import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Users, FileText, BarChart3, TrendingUp, Sparkles, Zap, Star, Activity } from 'lucide-react'
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

export default function Dashboard() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalForms: 0,
    totalResponses: 0,
    responseRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
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
            <button className="w-full text-left px-5 py-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-400/30 hover:border-purple-400/50 rounded-xl transition-all duration-200 group">
              <div className="font-medium text-purple-200 group-hover:text-purple-100 transition-colors">View Responses</div>
              <div className="text-sm text-purple-300/70 group-hover:text-purple-200/70 transition-colors">Check the latest form submissions</div>
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
    </div>
  )
}