import * as React from "react"
import { useTheme } from "../../contexts/ThemeContext"
import { cn } from "../../lib/theme"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  isLoading?: boolean
}

const sizeClasses = {
  sm: 'h-9 px-3 text-sm',
  default: 'h-10 px-4 py-2 text-sm',
  lg: 'h-11 px-8 text-base',
  icon: 'h-10 w-10'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', isLoading, disabled, children, ...props }, ref) => {
    const { theme } = useTheme()

    const getButtonStyles = (variant: string, theme: string) => {
      switch (variant) {
        case 'primary':
          return theme === 'light'
            ? 'px-6 py-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-500 text-white rounded-full font-medium transition-all duration-300 ease-out shadow-lg hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]'
            : 'px-6 py-3 bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 hover:from-blue-700 hover:via-violet-700 hover:to-fuchsia-700 text-white rounded-full font-medium transition-all duration-300 ease-out shadow-lg hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]'
        case 'secondary':
          return theme === 'light'
            ? 'px-6 py-3 bg-white/20 text-slate-800 hover:bg-white/30 rounded-full font-medium transition-all duration-300 ease-out border border-white/25 hover:scale-[1.02]'
            : 'px-6 py-3 bg-white/10 text-white/90 hover:bg-white/20 rounded-full font-medium transition-all duration-300 ease-out border border-white/10 hover:scale-[1.02]'
        case 'danger':
          return 'px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-full font-medium transition-all duration-300 ease-out shadow-lg hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]'
        case 'ghost':
          return theme === 'light'
            ? 'p-2 text-slate-600 hover:text-slate-800 hover:bg-white/20 rounded-full transition-all duration-300 ease-out'
            : 'p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 ease-out'
        default:
          return 'px-6 py-3 bg-slate-500 text-white rounded-full font-medium transition-all duration-300 ease-out'
      }
    }

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-300 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          getButtonStyles(variant, theme),
          sizeClasses[size],
          isLoading && 'pointer-events-none',
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
