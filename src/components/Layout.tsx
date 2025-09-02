import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import logoPlaceholder from '../assets/images/advertomedia2024.png'
import { 
  backgrounds, 
  textColors, 
  gradients, 
  layout, 
  navigationItem, 
  animations, 
  borders,
  cn 
} from '../lib/theme'

const adminNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Forms', href: '/forms', icon: FileText },
  { name: 'Responses', href: '/responses', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const clientNavigation = [
  { name: 'Responses', href: '/responses', icon: BarChart3 },
]

export default function Layout() {
  const { user, userType, clientData, signOut } = useAuth()
  const { theme } = useTheme()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  const navigation = userType === 'client' ? clientNavigation : adminNavigation

  return (
    <div className="flex h-screen">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className={cn('absolute inset-0 backdrop-blur-sm', layout.backdrop(theme))} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'w-20' : 'w-72'}
      `}>
        <div className={cn(
          'flex h-full flex-col backdrop-blur-xl border-r animate-slide-in-left',
          backgrounds.card(theme)
        )}>
          {/* Logo */}
          <div className={cn(
            'flex h-16 items-center border-b',
            borders.default(theme),
            sidebarCollapsed ? 'justify-center px-4' : 'justify-between px-4'
          )}>
            {!sidebarCollapsed ? (
              <>
                <div className="flex items-center space-x-3 animate-fade-in">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <img src={logoPlaceholder} alt="Advertomedia Logo" className="w-10 h-10 object-contain" />
                  </div>
                  <span className={cn(
                    'text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent whitespace-nowrap',
                    gradients.logo(theme)
                  )}>
                    Online Designer
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className={cn(
                      'hidden lg:block p-1.5 rounded-md transition-colors hover:scale-105',
                      textColors.secondary(theme)
                    )}
                    title="Collapse sidebar"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <ThemeToggle />
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'lg:hidden p-2 rounded-md transition-colors',
                      textColors.secondary(theme),
                      'hover:scale-105'
                    )}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className={cn(
                  'p-2 rounded-md transition-colors hover:scale-105',
                  textColors.secondary(theme)
                )}
                title="Expand sidebar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className={cn(
            'flex-1 py-6 space-y-2',
            sidebarCollapsed ? 'px-2' : 'px-4'
          )}>
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.href || 
                (item.href === '/forms' && location.pathname.startsWith('/forms'));
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    navigationItem(theme, isActive),
                    sidebarCollapsed ? 'justify-center px-3' : 'px-4'
                  )}
                  style={{ animationDelay: animations.stagger(index) }}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className={`h-5 w-5 transition-colors ${
                    isActive 
                      ? theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                      : theme === 'light' 
                        ? 'text-gray-400 group-hover:text-gray-600' 
                        : 'text-white/50 group-hover:text-white/70'
                  } ${sidebarCollapsed ? '' : 'mr-3'}`} />
                  {!sidebarCollapsed && (
                    <>
                      {item.name}
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className={cn('py-4 border-t', borders.default(theme), sidebarCollapsed ? 'px-2' : 'px-4')}>
            {!sidebarCollapsed ? (
              <div className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-xl backdrop-blur-sm border transition-all duration-200 animate-fade-in-delay',
                backgrounds.card(theme)
              )}>
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">
                    {user?.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', textColors.primary(theme))}>
                    {userType === 'client' && clientData ? clientData.name : user?.email}
                  </p>
                  <p className={cn('text-xs', textColors.secondary(theme))}>
                    {userType === 'client' ? 'Client Portal' : 'Agency Admin'}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  className={cn(
                    'p-2 rounded-lg transition-all duration-200 hover:scale-110',
                    textColors.secondary(theme),
                    'hover:text-red-600',
                    theme === 'light' ? 'hover:bg-red-50' : 'hover:bg-red-500/20'
                  )}
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">
                    {user?.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className={cn(
                    'p-2 rounded-lg transition-all duration-200 hover:scale-110',
                    textColors.secondary(theme),
                    'hover:text-red-600',
                    theme === 'light' ? 'hover:bg-red-50' : 'hover:bg-red-500/20'
                  )}
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar for mobile */}
        <div className={cn(
          'lg:hidden flex items-center justify-between h-16 px-4 backdrop-blur-xl border-b',
          backgrounds.card(theme)
        )}>
          <button
            onClick={() => setSidebarOpen(true)}
            className={cn(
              'p-2 rounded-xl transition-colors',
              textColors.secondary(theme),
              'hover:scale-105'
            )}
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className={cn(
            'text-lg font-semibold bg-gradient-to-r bg-clip-text text-transparent',
            gradients.title(theme)
          )}>
            Online Designer
          </span>
          <ThemeToggle />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}