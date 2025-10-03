import { TrendingUp, Calendar, Clock, FileText } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { ResponseStats } from '../../api/responses'

interface ResponsesStatsProps {
  stats: ResponseStats
  loading?: boolean
}

export default function ResponsesStats({ stats, loading = false }: ResponsesStatsProps) {
  const { theme } = useTheme()

  const statCards = [
    {
      title: 'Total Responses',
      value: stats.total,
      icon: FileText,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Today',
      value: stats.today,
      icon: Clock,
      color: 'green',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'This Week',
      value: stats.thisWeek,
      icon: TrendingUp,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: 'This Month',
      value: stats.thisMonth,
      icon: Calendar,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`rounded-2xl border p-6 animate-pulse ${
              theme === 'light'
                ? 'bg-white/50 border-gray-200'
                : 'bg-white/10 border-white/20'
            }`}
          >
            <div className={`h-4 rounded w-24 mb-4 ${
              theme === 'light' ? 'bg-gray-200' : 'bg-white/20'
            }`}></div>
            <div className={`h-8 rounded w-16 ${
              theme === 'light' ? 'bg-gray-200' : 'bg-white/20'
            }`}></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className={`backdrop-blur-xl rounded-2xl border p-6 hover:scale-105 transition-all duration-300 animate-fade-in ${
              theme === 'light'
                ? 'bg-white/50 border-gray-200 hover:shadow-lg'
                : 'bg-white/10 border-white/20 hover:shadow-2xl hover:shadow-' + card.color + '-500/10'
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm font-medium ${
                theme === 'light' ? 'text-gray-600' : 'text-white/70'
              }`}>
                {card.title}
              </p>
              <div className={`p-2 rounded-lg bg-gradient-to-r ${card.gradient} bg-opacity-10`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className={`text-3xl font-bold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              {card.value.toLocaleString()}
            </p>
          </div>
        )
      })}
    </div>
  )
}
