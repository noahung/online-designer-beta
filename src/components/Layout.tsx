import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import logoPlaceholder from '../assets/images/advertomedia2024.png'

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
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const navigation = userType === 'client' ? clientNavigation : adminNavigation

  return (
    <div className="flex h-screen">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col bg-white/10 backdrop-blur-xl border-r border-white/20 animate-slide-in-left">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
            <div className="flex items-center space-x-3 animate-fade-in">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={logoPlaceholder} alt="Advertomedia Logo" className="w-10 h-10 object-contain" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                Online Designer
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.href || 
                (item.href === '/forms' && location.pathname.startsWith('/forms'));
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 animate-fade-in
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-400/30 shadow-lg shadow-blue-500/25 transform scale-105' 
                      : 'text-white/70 hover:text-white hover:bg-white/10 hover:scale-105'
                    }
                  `}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <item.icon className={`mr-3 h-5 w-5 transition-colors ${
                    isActive ? 'text-blue-300' : 'text-white/50 group-hover:text-white/70'
                  }`} />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 animate-fade-in-delay">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white">
                  {user?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userType === 'client' && clientData ? clientData.name : user?.email}
                </p>
                <p className="text-xs text-white/60">
                  {userType === 'client' ? 'Client Portal' : 'Agency Admin'}
                </p>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-white/70 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-200 hover:scale-110"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar for mobile */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white/10 backdrop-blur-xl border-b border-white/20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Online Designer
          </span>
          <div className="w-10"></div>
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