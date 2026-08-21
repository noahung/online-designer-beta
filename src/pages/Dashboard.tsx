import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  Users, 
  FileText, 
  BarChart3, 
  Sparkles, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Zap,
  CheckCircle2
} from 'lucide-react'

interface Stats {
  totalClients: number
  totalForms: number
  totalResponses: number
  responseRate: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d')
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalForms: 0,
    totalResponses: 0,
    responseRate: 0,
  })
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <div className="w-full min-h-full overflow-y-auto bg-white dark:bg-[#0d0d0d] text-zinc-900 dark:text-zinc-100 p-8 select-none font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header: Title & Time Range Filter */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Home
          </h1>

          {/* Time Range Pills (OpenAI Platform style) */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
            {(['24h', '7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Banner (OpenAI Promo style) */}
        <div className="relative rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-950 to-slate-900 text-white p-8 sm:p-10 shadow-lg">
          <div className="relative z-10 max-w-xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-emerald-300 border border-white/10">
              <Sparkles className="w-3 h-3" />
              <span>Next Gen Form Studio</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              Create interactive typeform experiences with AI
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300">
              Build smart multi-step workflows, conditional branching trees, and live embeds in minutes.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/forms/new')}
                className="px-5 py-2.5 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-100 transition-colors shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create new form</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/forms')}
                className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors backdrop-blur-sm"
              >
                Browse Workspaces
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Grid (OpenAI Metrics Cards with Sparklines) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Responses */}
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span>Total Responses</span>
              <span className="text-emerald-500 font-bold">+14%</span>
            </div>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {stats.totalResponses.toLocaleString()}
            </div>
            {/* Sparkline curve visualization */}
            <div className="h-8 flex items-end gap-1.5 pt-2">
              <div className="flex-1 h-3 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30" />
              <div className="flex-1 h-5 rounded-full bg-emerald-500/30 dark:bg-emerald-500/40" />
              <div className="flex-1 h-4 rounded-full bg-emerald-500/25 dark:bg-emerald-500/35" />
              <div className="flex-1 h-7 rounded-full bg-emerald-500/40 dark:bg-emerald-500/50" />
              <div className="flex-1 h-8 rounded-full bg-emerald-500 text-white" />
            </div>
          </div>

          {/* Card 2: Active Forms */}
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span>Active Forms</span>
              <span className="text-blue-500 font-bold">Live</span>
            </div>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {stats.totalForms}
            </div>
            {/* Horizontal progress bar */}
            <div className="pt-3 space-y-1">
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full w-3/4" />
              </div>
              <div className="text-[10px] text-zinc-400">All forms responding normally</div>
            </div>
          </div>

          {/* Card 3: Connected Clients */}
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span>Client Workspaces</span>
              <span className="text-purple-500 font-bold">Active</span>
            </div>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {stats.totalClients}
            </div>
            {/* Horizontal progress bar */}
            <div className="pt-3 space-y-1">
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full w-2/3" />
              </div>
              <div className="text-[10px] text-zinc-400">Custom branded portals</div>
            </div>
          </div>
        </div>

        {/* Section: Recommended Templates (OpenAI Recommended Models Grid) */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Recommended Templates
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => navigate('/forms/new')}
              className="p-5 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer group shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                  📐
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Popular
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:underline">
                  Multi-Step Design Quote
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Product dimensions, material image selections, and instant price qualification.
                </p>
              </div>
            </div>

            <div
              onClick={() => navigate('/forms/new')}
              className="p-5 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer group shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  ⭐
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  High Conversion
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:underline">
                  CSAT &amp; Feedback Survey
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Star ratings, conditional branching for low scores, and Google review redirects.
                </p>
              </div>
            </div>

            <div
              onClick={() => navigate('/forms/new')}
              className="p-5 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer group shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                  ⚡
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Lead Gen
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:underline">
                  B2B Lead Qualification
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Capture contact info, company size, and route leads directly into Zapier &amp; CRM.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
