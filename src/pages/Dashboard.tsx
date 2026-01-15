import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import bannerImage from '../assets/images/banner.jpg'
import { BentoCard } from '../components/ui/bento-card'
import { 
  Users, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  Star, 
  Activity,
  Plus,
  Clock,
  Eye,
  MousePointerClick,
  Target,
  X
} from 'lucide-react'

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

  const fetchStats = useCallback(async () => {
    if (!user) return

    try {
      const [
        { count: clientsCount },
        { count: formsCount },
        { count: responsesCount }
      ] = await Promise.all([
        supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('forms')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('responses')
          .select('*, forms!inner(user_id)', { count: 'exact', head: true })
          .eq('forms.user_id', user.id)
      ])

      // Calculate response rate
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
  }, [user])

  const fetchRecentActivity = useCallback(async () => {
    if (!user) return

    try {
      const [
        { data: forms },
        { data: responses },
        { data: clients }
      ] = await Promise.all([
        supabase
          .from('forms')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2),
        supabase
          .from('responses')
          .select('id, contact_name, submitted_at, forms!inner(user_id, name)')
          .eq('forms.user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(2),
        supabase
          .from('clients')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
      ])

      const activities: RecentActivity[] = []

      // Add forms
      forms?.forEach(form => {
        activities.push({
          id: form.id,
          type: 'form_created',
          title: 'New form created',
          description: form.name,
          timestamp: new Date(form.created_at),
          icon: FileText,
          color: 'from-blue-500 to-cyan-500'
        })
      })

      // Add responses
      responses?.forEach(response => {
        activities.push({
          id: response.id,
          type: 'response_received',
          title: 'New response received',
          description: `${response.contact_name || 'Anonymous'} - ${(response.forms as any).name}`,
          timestamp: new Date(response.submitted_at),
          icon: Activity,
          color: 'from-green-500 to-emerald-500'
        })
      })

      // Add clients
      clients?.forEach(client => {
        activities.push({
          id: client.id,
          type: 'client_added',
          title: 'New client added',
          description: client.name,
          timestamp: new Date(client.created_at),
          icon: Users,
          color: 'from-purple-500 to-pink-500'
        })
      })

      // Sort by timestamp
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      
      setRecentActivity(activities.slice(0, 5))
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }, [user])

  useEffect(() => {
    fetchStats()
    fetchRecentActivity()
  }, [fetchStats, fetchRecentActivity])

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  const quickActions = useMemo(() => [
    {
      title: 'Create New Form',
      description: 'Build a custom form for your clients',
      icon: Plus,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-400/30',
      action: () => navigate('/forms')
    },
    {
      title: 'Add New Client',
      description: 'Set up branding for a new client',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-400/30',
      action: () => navigate('/clients')
    },
    {
      title: 'View Responses',
      description: 'Check latest form submissions',
      icon: Eye,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-400/30',
      action: () => navigate('/responses')
    },
    {
      title: 'Analytics',
      description: 'View detailed performance metrics',
      icon: BarChart3,
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-500/10 to-red-500/10',
      borderColor: 'border-orange-400/30',
      action: () => {}
    }
  ], [navigate])

  return (
    <div className={`w-full min-h-full ${theme === 'light' ? 'bg-gray-50' : ''}`}>
      <div className="max-w-[1600px] mx-auto p-8">
        {/* Promotional Banner */}
        {showBanner && (
          <div className="mb-8 relative overflow-hidden rounded-3xl animate-fade-in">
            {/* Close Button */}
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-6 right-6 z-10 p-2 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full transition-all duration-200 group"
            >
              <X className="w-5 h-5 text-white/80 group-hover:text-white" />
            </button>

            {/* Banner Image */}
            <img
              src={bannerImage}
              alt="Promotional Banner"
              className="w-full h-[400px] object-cover rounded-3xl"
            />
          </div>
        )}

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-5xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                theme === 'light'
                  ? 'from-gray-900 via-blue-600 to-purple-600'
                  : 'from-white via-blue-200 to-purple-200'
              }`}>
                Welcome back, Adel!
              </h1>
              <p className={`mt-3 text-lg ${
                theme === 'light' ? 'text-gray-600' : 'text-white/70'
              }`}>
                Here's what's happening with your forms today
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/forms')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Form
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" style={{ minHeight: '400px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`backdrop-blur-md rounded-2xl border p-6 animate-pulse ${
                theme === 'light'
                  ? 'bg-white border-gray-200'
                  : 'bg-white/5 border-white/10'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-16 h-16 rounded-xl ${
                    theme === 'light' ? 'bg-gray-200' : 'bg-white/10'
                  }`}></div>
                </div>
                <div className={`h-4 rounded w-24 mb-3 ${
                  theme === 'light' ? 'bg-gray-200' : 'bg-white/10'
                }`}></div>
                <div className={`h-8 rounded w-16 ${
                  theme === 'light' ? 'bg-gray-200' : 'bg-white/10'
                }`}></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" style={{ minHeight: '400px' }}>
            <div className="md:col-span-2">
              <BentoCard
                title="Total Clients"
                value={stats.totalClients}
                subtitle="Active clients in your account"
                colors={["#3B82F6", "#60A5FA", "#93C5FD"]}
                delay={0.2}
              />
            </div>
            <BentoCard
              title="Active Forms"
              value={stats.totalForms}
              subtitle="Forms ready to collect responses"
              colors={["#60A5FA", "#34D399", "#93C5FD"]}
              delay={0.4}
            />
            <BentoCard
              title="Response Rate"
              value={`${stats.responseRate}%`}
              subtitle="Engagement across all forms"
              colors={["#F59E0B", "#A78BFA", "#FCD34D"]}
              delay={0.6}
            />
            <div className="md:col-span-2">
              <BentoCard
                title="Total Responses"
                value={stats.totalResponses}
                subtitle="Form submissions received this month"
                colors={["#3B82F6", "#A78BFA", "#FBCFE8"]}
                delay={0.8}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions - Spans 2 columns */}
          <div className="lg:col-span-2">
            <div className={`backdrop-blur-md rounded-2xl border p-8 ${
              theme === 'light'
                ? 'bg-white border-gray-200'
                : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl font-bold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Quick Actions
                </h3>
                <Zap className="w-6 h-6 text-yellow-500" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={action.title}
                    onClick={action.action}
                    className={`text-left p-6 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group will-change-transform ${
                      action.borderColor
                    } bg-gradient-to-br ${action.bgColor}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className={`text-lg font-semibold mb-2 ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {action.title}
                    </h4>
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-600' : 'text-white/60'
                    }`}>
                      {action.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Performance Insights */}
            <div className={`mt-8 backdrop-blur-md rounded-2xl border p-8 ${
              theme === 'light'
                ? 'bg-white border-gray-200'
                : 'bg-white/5 border-white/10'
            }`}>
              <h3 className={`text-2xl font-bold mb-6 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Performance Insights
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20">
                  <MousePointerClick className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                  <p className={`text-3xl font-bold mb-2 ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    {stats.totalResponses * 3}
                  </p>
                  <p className={`text-sm ${
                    theme === 'light' ? 'text-gray-600' : 'text-white/60'
                  }`}>
                    Total Clicks
                  </p>
                </div>

                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/20">
                  <Target className="w-10 h-10 mx-auto mb-3 text-green-500" />
                  <p className={`text-3xl font-bold mb-2 ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    {Math.round(stats.responseRate * 1.2)}%
                  </p>
                  <p className={`text-sm ${
                    theme === 'light' ? 'text-gray-600' : 'text-white/60'
                  }`}>
                    Conversion Rate
                  </p>
                </div>

                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20">
                  <Clock className="w-10 h-10 mx-auto mb-3 text-purple-500" />
                  <p className={`text-3xl font-bold mb-2 ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    2.5m
                  </p>
                  <p className={`text-sm ${
                    theme === 'light' ? 'text-gray-600' : 'text-white/60'
                  }`}>
                    Avg. Time
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity - Spans 1 column */}
          <div className="lg:col-span-1">
            <div className={`backdrop-blur-md rounded-2xl border p-8 ${
              theme === 'light'
                ? 'bg-white border-gray-200'
                : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-2xl font-bold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Recent Activity
                </h3>
                <Activity className="w-6 h-6 text-green-500" />
              </div>

              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div
                      key={activity.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] will-change-transform ${
                        theme === 'light'
                          ? 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${
                        activity.color === 'from-blue-500 to-cyan-500' ? 'from-blue-500/10 to-cyan-500/10' :
                        activity.color === 'from-green-500 to-emerald-500' ? 'from-green-500/10 to-emerald-500/10' :
                        'from-purple-500/10 to-pink-500/10'
                      }`}>
                        <activity.icon className={`w-6 h-6 bg-gradient-to-r ${activity.color} bg-clip-text text-transparent`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm mb-1 ${
                          theme === 'light' ? 'text-gray-900' : 'text-white'
                        }`}>
                          {activity.title}
                        </p>
                        <p className={`text-sm mb-2 truncate ${
                          theme === 'light' ? 'text-gray-600' : 'text-white/70'
                        }`}>
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock className={`w-3 h-3 ${
                            theme === 'light' ? 'text-gray-400' : 'text-white/40'
                          }`} />
                          <span className={`text-xs ${
                            theme === 'light' ? 'text-gray-500' : 'text-white/50'
                          }`}>
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                      <Star className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Activity className={`w-16 h-16 mx-auto mb-4 ${
                      theme === 'light' ? 'text-gray-300' : 'text-white/20'
                    }`} />
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-500' : 'text-white/50'
                    }`}>
                      No recent activity yet
                    </p>
                  </div>
                )}
              </div>

              {recentActivity.length > 0 && (
                <button className={`w-full mt-6 py-3 rounded-xl border-2 font-medium transition-all duration-200 hover:scale-[1.02] ${
                  theme === 'light'
                    ? 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    : 'border-white/10 hover:bg-white/5 text-white/80'
                }`}>
                  View All Activity
                </button>
              )}
            </div>

            {/* Quick Tip */}
            <div className={`mt-8 backdrop-blur-md rounded-2xl border p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 ${
              theme === 'light'
                ? 'border-amber-400/20'
                : 'border-amber-400/20'
            }`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className={`font-semibold mb-2 ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    Pro Tip
                  </h4>
                  <p className={`text-sm ${
                    theme === 'light' ? 'text-gray-700' : 'text-white/80'
                  }`}>
                    Use form templates to save time! Create reusable templates for common form types.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
