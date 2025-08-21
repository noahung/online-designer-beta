import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Users, FileText, BarChart3, TrendingUp } from 'lucide-react'

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
      color: 'blue',
    },
    {
      name: 'Active Forms',
      value: stats.totalForms,
      icon: FileText,
      color: 'green',
    },
    {
      name: 'Total Responses',
      value: stats.totalResponses,
      icon: BarChart3,
      color: 'purple',
    },
    {
      name: 'Response Rate',
      value: `${stats.responseRate}%`,
      icon: TrendingUp,
      color: 'orange',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome back! Here's an overview of your forms and responses.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const colorClasses = {
              blue: 'bg-blue-50 text-blue-600 border-blue-200',
              green: 'bg-green-50 text-green-600 border-green-200',
              purple: 'bg-purple-50 text-purple-600 border-purple-200',
              orange: 'bg-orange-50 text-orange-600 border-orange-200',
            }

            return (
              <div key={stat.name} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors">
              <div className="font-medium text-blue-900">Create New Form</div>
              <div className="text-sm text-blue-600">Build a new form for your clients</div>
            </button>
            <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors">
              <div className="font-medium text-green-900">Add New Client</div>
              <div className="text-sm text-green-600">Set up branding for a new client</div>
            </button>
            <button className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors">
              <div className="font-medium text-purple-900">View Responses</div>
              <div className="text-sm text-purple-600">Check the latest form submissions</div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">New form responses received</p>
                <p className="text-xs text-slate-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Client "Premium Windows" added</p>
                <p className="text-xs text-slate-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}