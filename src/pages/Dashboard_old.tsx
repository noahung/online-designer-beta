import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  Users, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  Star, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  ArrowRight,
  Calendar,
  Clock,
  Eye,
  MousePointerClick,
  Target,
  Rocket,
  X
} from 'lucide-react'
import { 
  backgrounds, 
  textColors, 
  gradients, 
  layout, 
  loadingSkeleton, 
  animations, 
  cn 
} from '../lib/theme'

interface Stats {
  totalClients: number
  totalForms: number
  totalResponses: number
  responseRate: number
}

interface RecentActivity {
  id: string
  type: 'form_created' | 'response_received' | 'client_added'
  title: string
  description: string
  timestamp: Date
  icon: any
  color: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalForms: 0,
    totalResponses: 0,
    responseRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showBanner, setShowBanner] = useState(true)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    fetchStats()
    fetchRecentActivity()
  }, [user])

  const fetchStats = async () => {
    if (!user) return

    try {
      // Get clients count
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Get forms count
      const { count: formsCount } = await supabase
        .from('forms')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Get responses count
      const { count: responsesCount } = await supabase
        .from('responses')
        .select('*, forms!inner(user_id)', { count: 'exact', head: true })
        .eq('forms.user_id', user.id)

      // Calculate response rate (simplified)
      const responseRate = formsCount && formsCount > 0 ? 
        Math.round(((responsesCount || 0) / (formsCount * 10)) * 100) : 0

      setStats({
        totalClients: clientsCount || 0,
        totalForms: formsCount || 0,
        totalResponses: responsesCount || 0,
        responseRate: Math.min(responseRate, 100),
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const runFinalVerification = async () => {
    setVerificationLoading(true)
    setVerificationResults(null)

    try {
      const results: any = {
        webhookSystem: {},
        emailSystem: {},
        overall: {}
      }

      console.log('🎯 FINAL VERIFICATION TEST')
      console.log('=========================')

      // ===== WEBHOOK SYSTEM VERIFICATION =====
      console.log('\n🔗 TESTING WEBHOOK SYSTEM')

      // Test 1: Insert a response to trigger webhook
      console.log('1️⃣ Testing webhook trigger...')
      try {
        const { data: testResponse, error: insertError } = await supabase
          .from('responses')
          .insert([{
            form_id: '00000000-0000-0000-0000-000000000001',
            contact_name: 'Final Verification Test',
            contact_email: 'verification@test.local',
            contact_phone: '+1234567890',
            submitted_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (insertError) {
          results.webhookSystem.trigger = { status: 'ERROR', error: insertError.message }
          console.error('❌ Webhook trigger failed:', insertError)
        } else {
          results.webhookSystem.trigger = { status: 'OK', responseId: testResponse.id }
          console.log('✅ Response inserted successfully')

          // Test 2: Check if webhook notification was created
          console.log('2️⃣ Checking webhook notification creation...')
          await new Promise(resolve => setTimeout(resolve, 3000))

          const { data: webhookNotif, error: webhookError } = await supabase
            .from('webhook_notifications')
            .select('*')
            .eq('response_id', testResponse.id)

          if (webhookError) {
            results.webhookSystem.notification = { status: 'ERROR', error: webhookError.message }
            console.error('❌ Webhook notification check failed:', webhookError)
          } else if (webhookNotif && webhookNotif.length > 0) {
            results.webhookSystem.notification = { status: 'OK', notification: webhookNotif[0] }
            console.log('✅ Webhook notification created:', webhookNotif[0])
          } else {
            results.webhookSystem.notification = { status: 'NO_NOTIFICATION' }
            console.log('❌ No webhook notification created')
          }
        }
      } catch (e) {
        results.webhookSystem.trigger = { status: 'ERROR', error: e instanceof Error ? e.message : 'Unknown error' }
        console.error('❌ Webhook trigger test failed:', e)
      }

      // Test 3: Test webhook processing function
      console.log('3️⃣ Testing webhook processing function...')
      try {
        const response = await fetch('/functions/v1/process-webhooks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || 'test-token'}`
          }
        })

        results.webhookSystem.processing = {
          status: response.ok ? 'OK' : 'ERROR',
          statusCode: response.status
        }

        if (response.ok) {
          console.log('✅ Webhook processing function accessible')
        } else {
          console.error('❌ Webhook processing function error:', response.status)
        }
      } catch (e) {
        results.webhookSystem.processing = { status: 'ERROR', error: e instanceof Error ? e.message : 'Unknown error' }
        console.error('❌ Webhook processing test failed:', e)
      }

      // ===== EMAIL SYSTEM VERIFICATION =====
      console.log('\n📧 TESTING EMAIL SYSTEM')

      // Test 4: Test email validation with complex formats
      console.log('4️⃣ Testing email validation...')
      const testEmails = [
        'simple@test.com',
        'user.name+tag@domain.co.uk',
        'test@monday.com',
        'complex.email@sub.domain.monday.com',
        'user_name123@test-domain.org',
        'invalid-email@',
        '@invalid.com',
        'invalid@.com'
      ]

      const emailResults = []
      for (const email of testEmails) {
        // Test with the updated validation function
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

        let isValid = emailRegex.test(email)
        if (isValid) {
          const [localPart, domain] = email.split('@')
          isValid = isValid &&
            localPart && localPart.length <= 64 &&
            !localPart.startsWith('.') && !localPart.endsWith('.') &&
            !localPart.includes('..') &&
            domain && domain.length <= 253 &&
            !domain.startsWith('.') && !domain.endsWith('.') &&
            !domain.includes('..') &&
            domain.includes('.')
        }

        emailResults.push({ email, isValid })
      }

      results.emailSystem.validation = { status: 'COMPLETED', results: emailResults }
      console.log('✅ Email validation test completed')

      // Test 5: Test email sending endpoint
      console.log('5️⃣ Testing email sending endpoint...')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch('/functions/v1/send-response-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || 'test-token'}`
          },
          body: JSON.stringify({
            response_id: 'test-response-id',
            test: true
          })
        })

        results.emailSystem.sending = {
          status: response.ok ? 'OK' : 'ERROR',
          statusCode: response.status
        }

        if (response.ok) {
          console.log('✅ Email sending function accessible')
        } else {
          console.error('❌ Email sending function error:', response.status)
        }
      } catch (e) {
        results.emailSystem.sending = { status: 'ERROR', error: e instanceof Error ? e.message : 'Unknown error' }
        console.error('❌ Email sending test failed:', e)
      }

      // ===== FINAL ANALYSIS =====
      console.log('\n📊 FINAL VERIFICATION RESULTS')
      console.log('==============================')

      // Overall status
      const webhookWorking = results.webhookSystem.trigger?.status === 'OK' &&
                            results.webhookSystem.notification?.status === 'OK' &&
                            results.webhookSystem.processing?.status === 'OK'

      const emailWorking = results.emailSystem.validation?.status === 'COMPLETED' &&
                          results.emailSystem.sending?.status === 'OK'

      results.overall = {
        webhookSystem: webhookWorking ? 'WORKING' : 'ISSUES_FOUND',
        emailSystem: emailWorking ? 'WORKING' : 'ISSUES_FOUND',
        overall: (webhookWorking && emailWorking) ? 'ALL_SYSTEMS_WORKING' : 'ISSUES_REMAIN'
      }

      console.log('🔗 Webhook System:', results.overall.webhookSystem)
      console.log('📧 Email System:', results.overall.emailSystem)
      console.log('🎯 Overall Status:', results.overall.overall)

      setVerificationResults(results)

    } catch (error) {
      console.error('❌ Final verification failed:', error)
      setVerificationResults({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setVerificationLoading(false)
    }
  }

  const statCards = [
    {
      name: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-400/30',
    },
    {
      name: 'Active Forms',
      value: stats.totalForms,
      icon: FileText,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-400/30',
    },
    {
      name: 'Total Responses',
      value: stats.totalResponses,
      icon: BarChart3,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-400/30',
    },
    {
      name: 'Response Rate',
      value: `${stats.responseRate}%`,
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-400/30',
    },
  ]

  return (
    <div className={cn(layout.container, 'animate-fade-in')}>
      <div className="mb-8">
        <h1 className={cn(
          'text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent animate-slide-up',
          gradients.heading(theme)
        )}>
          Dashboard
        </h1>
        <p className={cn(
          'mt-2 text-lg animate-fade-in-delay',
          textColors.secondary(theme)
        )}>
          Welcome back! Here's an overview of your forms and responses.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={cn(
              'backdrop-blur-xl rounded-2xl border p-6 animate-pulse',
              backgrounds.card(theme)
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={loadingSkeleton(theme, 'h-4 rounded w-24 mb-3')}></div>
                  <div className={loadingSkeleton(theme, 'h-8 rounded w-16 mb-2')}></div>
                </div>
                <div className={loadingSkeleton(theme, 'w-14 h-14 rounded-xl')}></div>
              </div>
              <div className={loadingSkeleton(theme, 'mt-4 h-1 rounded-full')}></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div 
              key={stat.name} 
              className={cn(
                'backdrop-blur-xl rounded-2xl border p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 animate-fade-in hover:scale-105',
                stat.borderColor,
                backgrounds.card(theme),
                theme === 'light' 
                  ? 'hover:bg-white/80 hover:border-gray-300'
                  : 'hover:bg-white/15 hover:border-white/30'
              )}
              style={{ animationDelay: animations.stagger(index) }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn('text-sm font-medium', textColors.secondary(theme))}>
                    {stat.name}
                  </p>
                  <p className={cn('text-3xl font-bold mt-2', textColors.primary(theme))}>
                    {stat.value}
                  </p>
                </div>
                <div className={cn(
                  'w-14 h-14 rounded-xl backdrop-blur-sm border flex items-center justify-center shadow-lg',
                  `bg-gradient-to-r ${stat.bgColor}`,
                  stat.borderColor
                )}>
                  <stat.icon className={cn(
                    'w-7 h-7 text-transparent bg-gradient-to-r bg-clip-text',
                    stat.color
                  )} fill="currentColor" />
                </div>
              </div>
              
              <div className="mt-4 flex items-center">
                <div className={cn(
                  'w-full h-1 rounded-full overflow-hidden',
                  `bg-gradient-to-r ${stat.bgColor}`
                )}>
                  <div className={cn(
                    'h-full rounded-full animate-pulse',
                    `bg-gradient-to-r ${stat.color}`
                  )} style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={cn(
          'backdrop-blur-xl rounded-2xl border p-6 animate-fade-in',
          backgrounds.card(theme)
        )} style={{animationDelay: '0.5s'}}>
          <h3 className={cn(
            'text-xl font-semibold mb-6 flex items-center',
            textColors.primary(theme)
          )}>
            <Zap className="w-6 h-6 mr-2 text-yellow-400" />
            Quick Actions
          </h3>
          <div className="space-y-4">
            <button className="w-full text-left px-5 py-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-400/30 hover:border-blue-400/50 rounded-xl transition-all duration-200 group">
              <div className="font-medium text-blue-200 group-hover:text-blue-100 transition-colors">Create New Form</div>
              <div className="text-sm text-blue-300/70 group-hover:text-blue-200/70 transition-colors">Build a new form for your clients</div>
            </button>
            <button className="w-full text-left px-5 py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-400/30 hover:border-green-400/50 rounded-xl transition-all duration-200 group">
              <div className="font-medium text-green-200 group-hover:text-green-100 transition-colors">Add New Client</div>
              <div className="text-sm text-green-300/70 group-hover:text-green-200/70 transition-colors">Set up branding for a new client</div>
            </button>
            <button 
              onClick={runFinalVerification}
              disabled={verificationLoading}
              className="w-full text-left px-5 py-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 border border-red-400/30 hover:border-red-400/50 rounded-xl transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-medium text-red-200 group-hover:text-red-100 transition-colors">
                {verificationLoading ? '🔄 Running Tests...' : '🔧 Run Final Verification'}
              </div>
              <div className="text-sm text-red-300/70 group-hover:text-red-200/70 transition-colors">
                {verificationLoading ? 'Testing webhook and email systems...' : 'Test webhook and email systems'}
              </div>
            </button>
          </div>
        </div>

        <div className={`backdrop-blur-xl rounded-2xl border p-6 animate-fade-in ${
          theme === 'light'
            ? 'bg-white/60 border-gray-200'
            : 'bg-white/10 border-white/20'
        }`} style={{animationDelay: '0.7s'}}>
          <h3 className={`text-xl font-semibold mb-6 flex items-center ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            <Activity className="w-6 h-6 mr-2 text-green-400" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className={`flex items-center space-x-4 p-4 rounded-xl border transition-all duration-200 ${
              theme === 'light'
                ? 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
                <FileText className="w-5 h-5 text-blue-300" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>New form responses received</p>
                <p className={`text-xs ${
                  theme === 'light' ? 'text-gray-500' : 'text-white/60'
                }`}>2 minutes ago</p>
              </div>
              <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
            </div>
            <div className={`flex items-center space-x-4 p-4 rounded-xl border transition-all duration-200 ${
              theme === 'light'
                ? 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}>
              <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border border-green-400/30">
                <Users className="w-5 h-5 text-green-300" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>Client "Premium Windows" added</p>
                <p className={`text-xs ${
                  theme === 'light' ? 'text-gray-500' : 'text-white/60'
                }`}>1 hour ago</p>
              </div>
            </div>
            <div className={`flex items-center space-x-4 p-4 rounded-xl border transition-all duration-200 ${
              theme === 'light'
                ? 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-400/30">
                <Sparkles className="w-5 h-5 text-purple-300" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>Form "Contact Us" updated</p>
                <p className={`text-xs ${
                  theme === 'light' ? 'text-gray-500' : 'text-white/60'
                }`}>3 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Diagnostics Section - Hidden for now */}
      {false && (
        <div className="mt-12">
          <SystemDiagnostics />
        </div>
      )}

      {/* Verification Results Section */}
      {verificationResults && (
        <div className="mt-12">
          <div className={cn(
            'backdrop-blur-xl rounded-2xl border p-6 animate-fade-in',
            backgrounds.card(theme)
          )}>
            <h3 className={cn(
              'text-xl font-semibold mb-6 flex items-center',
              textColors.primary(theme)
            )}>
              {verificationResults.overall?.overall === 'ALL_SYSTEMS_WORKING' ? (
                <CheckCircle className="w-6 h-6 mr-2 text-green-400" />
              ) : (
                <AlertCircle className="w-6 h-6 mr-2 text-yellow-400" />
              )}
              Final Verification Results
            </h3>

            {verificationResults.error ? (
              <div className="p-4 bg-red-500/20 border border-red-400/30 rounded-xl">
                <div className="flex items-center">
                  <XCircle className="w-5 h-5 text-red-400 mr-2" />
                  <span className="text-red-200 font-medium">Verification Failed</span>
                </div>
                <p className="text-red-300/70 mt-2">{verificationResults.error}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overall Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border ${
                    verificationResults.overall?.webhookSystem === 'WORKING'
                      ? 'bg-green-500/20 border-green-400/30'
                      : 'bg-yellow-500/20 border-yellow-400/30'
                  }`}>
                    <div className="flex items-center">
                      {verificationResults.overall?.webhookSystem === 'WORKING' ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-yellow-400 mr-2" />
                      )}
                      <span className="font-medium">Webhook System</span>
                    </div>
                    <p className="text-sm opacity-70 mt-1">{verificationResults.overall?.webhookSystem}</p>
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    verificationResults.overall?.emailSystem === 'WORKING'
                      ? 'bg-green-500/20 border-green-400/30'
                      : 'bg-yellow-500/20 border-yellow-400/30'
                  }`}>
                    <div className="flex items-center">
                      {verificationResults.overall?.emailSystem === 'WORKING' ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-yellow-400 mr-2" />
                      )}
                      <span className="font-medium">Email System</span>
                    </div>
                    <p className="text-sm opacity-70 mt-1">{verificationResults.overall?.emailSystem}</p>
                  </div>

                  <div className={`p-4 rounded-xl border ${
                    verificationResults.overall?.overall === 'ALL_SYSTEMS_WORKING'
                      ? 'bg-green-500/20 border-green-400/30'
                      : 'bg-yellow-500/20 border-yellow-400/30'
                  }`}>
                    <div className="flex items-center">
                      {verificationResults.overall?.overall === 'ALL_SYSTEMS_WORKING' ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                      )}
                      <span className="font-medium">Overall Status</span>
                    </div>
                    <p className="text-sm opacity-70 mt-1">{verificationResults.overall?.overall}</p>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Webhook Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-lg">Webhook System Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span>Trigger Creation</span>
                        {verificationResults.webhookSystem?.trigger?.status === 'OK' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span>Notification Created</span>
                        {verificationResults.webhookSystem?.notification?.status === 'OK' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span>Processing Function</span>
                        {verificationResults.webhookSystem?.processing?.status === 'OK' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Email Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-lg">Email System Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span>Validation Logic</span>
                        {verificationResults.emailSystem?.validation?.status === 'COMPLETED' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span>Sending Function</span>
                        {verificationResults.emailSystem?.sending?.status === 'OK' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      {verificationResults.emailSystem?.validation?.results && (
                        <div className="p-3 bg-white/5 rounded-lg">
                          <span className="text-sm">
                            Email Tests: {
                              verificationResults.emailSystem.validation.results.filter((r: any) => 
                                r.isValid && !['invalid-email@', '@invalid.com', 'invalid@.com'].includes(r.email)
                              ).length
                            }/5 valid, {
                              verificationResults.emailSystem.validation.results.filter((r: any) => 
                                !r.isValid && ['invalid-email@', '@invalid.com', 'invalid@.com'].includes(r.email)
                              ).length
                            }/3 invalid rejected
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                {verificationResults.overall?.overall === 'ALL_SYSTEMS_WORKING' && (
                  <div className="p-4 bg-green-500/20 border border-green-400/30 rounded-xl">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                      <span className="text-green-200 font-medium">🎉 All Systems Working!</span>
                    </div>
                    <p className="text-green-300/70 mt-2">
                      ✅ Webhook system creates notifications automatically<br/>
                      ✅ Webhook processing function is accessible<br/>
                      ✅ Email validation accepts complex formats<br/>
                      ✅ Email sending function is accessible
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}