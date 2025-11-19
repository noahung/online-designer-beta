import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut
} from 'lucide-react'
import { useLocation, Outlet } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import logoPlaceholder from '../assets/images/advertomedia2024.png'
import { 
  backgrounds, 
  textColors, 
  gradients, 
  borders,
  cn 
} from '../lib/theme'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const adminNavigation = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
  { 
    name: 'Clients', 
    href: '/clients', 
    icon: <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
  { 
    name: 'Forms', 
    href: '/forms', 
    icon: <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
  { 
    name: 'Responses', 
    href: '/responses', 
    icon: <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
]

const clientNavigation = [
  { 
    name: 'Responses', 
    href: '/responses', 
    icon: <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
  },
]

export default function Layout() {
  const { user, userType, clientData, signOut } = useAuth()
  const { theme } = useTheme()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  
  const navigation = userType === 'client' ? clientNavigation : adminNavigation

  // Map navigation items to sidebar link format
  const links = navigation.map(item => ({
    label: item.name,
    href: item.href,
    icon: item.icon,
  }))

  return (
    <div className={cn(
      "flex flex-col md:flex-row w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
      "h-screen"
    )}>
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: userType === 'client' && clientData ? clientData.name : (user?.email || 'User'),
                href: '#',
                icon: (
                  <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {user?.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                ),
              }}
            />
            <button
              onClick={signOut}
              className={cn(
                "flex items-center justify-start gap-2 group/sidebar py-2 w-full text-left",
                "text-neutral-700 dark:text-neutral-200 hover:text-red-600 transition-colors"
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
              >
                Logout
              </motion.span>
            </button>
          </div>
        </SidebarBody>
      </Sidebar>
      <Dashboard />
    </div>
  )
}

const Logo = () => {
  return (
    <Link
      to="/"
      className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
    >
      <div className="w-10 h-10 flex items-center justify-center">
        <img src={logoPlaceholder} alt="Advertomedia Logo" className="w-10 h-10 object-contain" />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-neutral-800 dark:text-neutral-200 whitespace-pre"
      >
        Online Designer
      </motion.span>
    </Link>
  );
};

const LogoIcon = () => {
  return (
    <Link
      to="/"
      className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
    >
      <div className="w-10 h-10 flex items-center justify-center">
        <img src={logoPlaceholder} alt="Logo" className="w-10 h-10 object-contain" />
      </div>
    </Link>
  );
};

// Dashboard component holds the main content area
const Dashboard = () => {
  return (
    <div className="flex flex-1">
      <div className={cn(
        "p-2 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700",
        "bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full overflow-y-auto"
      )}>
        <Outlet />
      </div>
    </div>
  );
};