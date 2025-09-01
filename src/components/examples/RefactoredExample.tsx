import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from '../ui/button'
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card'
import { Input } from '../ui/input'
import { useFormState } from '../../hooks/useSupabase'
import { 
  backgrounds, 
  textColors, 
  gradients, 
  layout, 
  cn 
} from '../../lib/theme'

interface ExampleFormData {
  name: string
  email: string
  message: string
}

export const RefactoredExample: React.FC = () => {
  const { theme } = useTheme()
  
  // Using our custom form hook with validation
  const form = useFormState<ExampleFormData>(
    {
      name: '',
      email: '',
      message: ''
    },
    {
      name: (value) => !value ? 'Name is required' : undefined,
      email: (value) => !value || !/\S+@\S+\.\S+/.test(value) ? 'Valid email is required' : undefined,
      message: (value) => !value ? 'Message is required' : undefined
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.validateForm()) {
      console.log('Form submitted:', form.values)
      // Handle successful submission
      form.reset()
    }
  }

  return (
    <div className={cn(layout.page(theme))}>
      <div className={cn(layout.container)}>
        {/* Page Header - Using theme utilities */}
        <div className="mb-8">
          <h1 className={cn(
            'text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
            gradients.heading(theme)
          )}>
            Refactored Components Example
          </h1>
          <p className={cn(
            'mt-2 text-lg',
            textColors.secondary(theme)
          )}>
            This demonstrates our improved, maintainable component system
          </p>
        </div>

        {/* Example Form Card */}
        <Card className="max-w-md mx-auto">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <h2 className={cn(
                'text-2xl font-semibold',
                textColors.primary(theme)
              )}>
                Contact Form
              </h2>
              <p className={cn(
                'text-sm',
                textColors.secondary(theme)
              )}>
                Built with our refactored components
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Theme-aware Input components */}
              <Input
                label="Name"
                value={form.values.name}
                onChange={(e) => form.setValue('name', e.target.value)}
                onBlur={() => form.setFieldTouched('name')}
                error={form.touched.name ? form.errors.name : undefined}
                placeholder="Enter your name"
              />

              <Input
                label="Email"
                type="email"
                value={form.values.email}
                onChange={(e) => form.setValue('email', e.target.value)}
                onBlur={() => form.setFieldTouched('email')}
                error={form.touched.email ? form.errors.email : undefined}
                placeholder="Enter your email"
              />

              <div className="space-y-2">
                <label className={cn(
                  'block text-sm font-medium',
                  textColors.primary(theme)
                )}>
                  Message
                </label>
                <textarea
                  value={form.values.message}
                  onChange={(e) => form.setValue('message', e.target.value)}
                  onBlur={() => form.setFieldTouched('message')}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border transition-all duration-200 resize-none',
                    'focus:ring-2 focus:ring-offset-0 focus:outline-none',
                    backgrounds.input(theme),
                    form.touched.message && form.errors.message
                      ? theme === 'light' 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20'
                      : theme === 'light'
                        ? 'focus:border-blue-500 focus:ring-blue-500/20'
                        : 'focus:border-blue-400 focus:ring-blue-400/20'
                  )}
                  rows={4}
                  placeholder="Enter your message"
                />
                {form.touched.message && form.errors.message && (
                  <p className={cn(
                    'text-sm',
                    theme === 'light' ? 'text-red-600' : 'text-red-400'
                  )}>
                    {form.errors.message}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => form.reset()}
                className="mr-2"
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!form.isValid}
              >
                Submit
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Benefits Summary */}
        <Card className="mt-8">
          <CardHeader>
            <h2 className={cn(
              'text-2xl font-semibold',
              textColors.primary(theme)
            )}>
              Refactoring Benefits
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className={cn(
                  'text-lg font-semibold mb-2',
                  textColors.primary(theme)
                )}>
                  Before Refactoring
                </h3>
                <ul className={cn(
                  'space-y-2 text-sm',
                  textColors.secondary(theme)
                )}>
                  <li>• Repetitive theme conditionals everywhere</li>
                  <li>• Hard-coded color values</li>
                  <li>• Duplicate component logic</li>
                  <li>• Difficult maintenance</li>
                  <li>• Inconsistent styling</li>
                </ul>
              </div>
              <div>
                <h3 className={cn(
                  'text-lg font-semibold mb-2',
                  textColors.primary(theme)
                )}>
                  After Refactoring
                </h3>
                <ul className={cn(
                  'space-y-2 text-sm',
                  textColors.secondary(theme)
                )}>
                  <li>• Centralized theme utilities</li>
                  <li>• Reusable UI components</li>
                  <li>• Custom hooks for common patterns</li>
                  <li>• Consistent design system</li>
                  <li>• Easy to maintain and extend</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RefactoredExample
