import * as React from "react"
import { useTheme } from "../../contexts/ThemeContext"
import { backgrounds, cn } from "../../lib/theme"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    const { theme } = useTheme()
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium',
              theme === 'light' ? 'text-gray-700' : 'text-white/90'
            )}
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-full border px-4 py-2 text-sm transition-all duration-300 ease-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            backgrounds.input(theme),
            error 
              ? theme === 'light' 
                ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500' 
                : 'border-red-400/50 focus-visible:border-red-400 focus-visible:ring-red-400'
              : theme === 'light'
                ? 'border-white/20 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/50'
                : 'border-white/10 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/50',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className={cn(
            'text-sm',
            theme === 'light' ? 'text-red-600' : 'text-red-400'
          )}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className={cn(
            'text-sm',
            theme === 'light' ? 'text-gray-500' : 'text-white/60'
          )}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
