import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  Home, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Search,
  ChevronDown,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'
import { useLocation, Outlet, Link, useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { cn } from '../lib/theme'

const navigationItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Forms', href: '/forms', icon: FileText },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Responses', href: '/responses', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout() {
  const { user, userType, clientData, signOut } = useAuth()
  const { theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-[#0d0d0d] text-zinc-900 dark:text-zinc-100 select-none font-sans">
      {/* OpenAI Platform-Style Left Sidebar with Collapse/Expand Toggle */}
      <aside
        className={cn(
          "border-r border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#0d0d0d] flex flex-col flex-shrink-0 h-full transition-all duration-200",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Top: Project / Workspace Dropdown + Toggle Button */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between gap-2">
          {!isCollapsed ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/forms')}
                className="flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-zinc-200/60 dark:hover:bg-[#1f1f1f] transition-colors group min-w-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {userType === 'client' && clientData ? clientData.name : 'Adverto Media'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 flex-shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200/60 dark:hover:bg-[#1f1f1f] transition-colors flex-shrink-0"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200/60 dark:hover:bg-[#1f1f1f] transition-colors"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Quick Search with Ctrl+K (when not collapsed) */}
        {!isCollapsed && (
          <div className="p-3 pt-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-12 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 bg-zinc-100 dark:bg-[#27272a] px-1.5 py-0.5 rounded font-mono">
                Ctrl+K
              </span>
            </div>
          </div>
        )}

        {/* Middle Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navigationItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center rounded-xl text-xs font-medium transition-colors",
                  isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2",
                  active
                    ? "bg-zinc-200/80 dark:bg-[#212121] text-zinc-950 dark:text-white font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#18181b] hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-zinc-900 dark:text-white" : "text-zinc-400")} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom User Organization / Theme Switcher */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/60">
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {user?.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {userType === 'client' && clientData ? clientData.name : (user?.email?.split('@')[0] || 'Admin')}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">Organization</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={signOut}
                  className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={signOut}
                className="p-2 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main App Content Viewport */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#0d0d0d]">
        <Outlet />
      </main>
    </div>
  )
}