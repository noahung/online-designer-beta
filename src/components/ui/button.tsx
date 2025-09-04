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
          return 'px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:scale-105'
        case 'secondary':
          return theme === 'light'
            ? 'px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-all duration-200'
            : 'px-6 py-3 bg-white/10 text-white/90 hover:bg-white/20 rounded-xl font-medium transition-all duration-200'
        case 'danger':
          return 'px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:scale-105'
        case 'ghost':
          return theme === 'light'
            ? 'p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200'
            : 'p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200'
        default:
          return 'px-6 py-3 bg-gray-500 text-white rounded-xl font-medium transition-all duration-200'
      }
    }

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
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
