import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Users, FileText, BarChart3, TrendingUp, Sparkles, Zap, Star, Activity } from 'lucide-react'

interface Stats {
  totalClients: number
  totalForms: number
  totalResponses: number
  responseRate: number
}

export default function Dashboard() {
  const { user } = useAuth()
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
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent animate-slide-up">
          Dashboard
        </h1>
        <p className="text-white/70 mt-2 text-lg animate-fade-in-delay">Welcome back! Here's an overview of your forms and responses.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-white/20 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-white/20 rounded w-16 mb-2"></div>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-xl"></div>
              </div>
              <div className="mt-4 h-1 bg-white/20 rounded-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div 
              key={stat.name} 
              className={`bg-white/10 backdrop-blur-xl rounded-2xl border ${stat.borderColor} p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 animate-fade-in hover:scale-105`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">{stat.name}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${stat.bgColor} backdrop-blur-sm border ${stat.borderColor} flex items-center justify-center shadow-lg`}>
                  <stat.icon className={`w-7 h-7 text-transparent bg-gradient-to-r ${stat.color} bg-clip-text`} fill="currentColor" />
                </div>
              </div>
              
              <div className="mt-4 flex items-center">
                <div className={`w-full h-1 rounded-full bg-gradient-to-r ${stat.bgColor} overflow-hidden`}>
                  <div className={`h-full bg-gradient-to-r ${stat.color} rounded-full animate-pulse`} style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 animate-fade-in" style={{animationDelay: '0.5s'}}>
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
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

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 animate-fade-in" style={{animationDelay: '0.7s'}}>
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-green-400" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
                <FileText className="w-5 h-5 text-blue-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">New form responses received</p>
                <p className="text-xs text-white/60">2 minutes ago</p>
              </div>
              <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
            </div>
            <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border border-green-400/30">
                <Users className="w-5 h-5 text-green-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Client "Premium Windows" added</p>
                <p className="text-xs text-white/60">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-400/30">
                <Sparkles className="w-5 h-5 text-purple-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Form "Contact Us" updated</p>
                <p className="text-xs text-white/60">3 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}