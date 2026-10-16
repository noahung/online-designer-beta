import * as React from "react"
import { useTheme } from "../../contexts/ThemeContext"
import { backgrounds, cn } from "../../lib/theme"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme()

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-3xl border px-4 py-3 text-sm transition-all duration-300 ease-out shadow-inner",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          backgrounds.input(theme),
          theme === 'light'
            ? 'border-white/20 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/50'
            : 'border-white/10 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
