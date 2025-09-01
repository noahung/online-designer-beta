import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import logoPlaceholder from '../assets/images/advertomedia2024.png'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const { theme } = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse ${
          theme === 'light' ? 'bg-orange-500/10' : 'bg-orange-500/20'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse ${
          theme === 'light' ? 'bg-red-500/10' : 'bg-red-500/20'
        }`} style={{animationDelay: '1s'}}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full blur-3xl animate-pulse ${
          theme === 'light' ? 'bg-orange-600/5' : 'bg-orange-600/10'
        }`} style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        <div className={`backdrop-blur-xl rounded-2xl border p-8 shadow-2xl ${
          theme === 'light' 
            ? 'bg-white/80 border-gray-200' 
            : 'bg-white/10 border-white/20'
        }`}>
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 flex items-center justify-center mb-6 animate-scale-in">
              <img src={logoPlaceholder} alt="Advertomedia Logo" className="w-20 h-20 object-contain" />
            </div>
            <h2 className={`text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent animate-slide-up ${
              theme === 'light' 
                ? 'from-gray-800 to-orange-600' 
                : 'from-white to-orange-200'
            }`}>
              Online Designer
            </h2>
            <p className={`mt-2 text-lg animate-fade-in-delay ${
              theme === 'light' ? 'text-gray-600' : 'text-white/70'
            }`}>Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={`backdrop-blur-sm rounded-xl p-4 animate-fade-in ${
                theme === 'light'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-red-500/20 border border-red-400/30'
              }`}>
                <p className={`text-sm ${
                  theme === 'light' ? 'text-red-700' : 'text-red-200'
                }`}>{error}</p>
              </div>
            )}
            
            <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
              <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                theme === 'light' ? 'text-gray-700' : 'text-white/90'
              }`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  theme === 'light' ? 'text-gray-400' : 'text-white/40'
                }`} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 backdrop-blur-sm border rounded-xl transition-all duration-200 ${
                    theme === 'light'
                      ? 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-white/70'
                      : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent hover:bg-white/15'
                  }`}
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div className="animate-slide-up" style={{animationDelay: '0.4s'}}>
              <label htmlFor="password" className={`block text-sm font-medium mb-2 ${
                theme === 'light' ? 'text-gray-700' : 'text-white/90'
              }`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  theme === 'light' ? 'text-gray-400' : 'text-white/40'
                }`} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-12 py-3 backdrop-blur-sm border rounded-xl transition-all duration-200 ${
                    theme === 'light'
                      ? 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-white/70'
                      : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent hover:bg-white/15'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                    theme === 'light' 
                      ? 'text-gray-400 hover:text-gray-600' 
                      : 'text-white/40 hover:text-white/70'
                  }`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 animate-slide-up ${
                loading
                  ? theme === 'light' 
                    ? 'bg-gray-300 cursor-not-allowed opacity-50'
                    : 'bg-white/20 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105'
              }`}
              style={{animationDelay: '0.6s'}}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className={`animate-spin rounded-full h-5 w-5 border-b-2 mr-2 ${
                    theme === 'light' ? 'border-gray-600' : 'border-white'
                  }`}></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
