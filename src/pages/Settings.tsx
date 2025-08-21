import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Globe, Webhook, Key } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8 animate-slide-up">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">Settings</h1>
        <p className="text-white/70 mt-2 text-lg">Manage your account and integration settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Account Settings */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-200 animate-fade-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-400/30 mr-3">
              <User className="w-5 h-5 text-blue-200" />
            </div>
            <h2 className="text-xl font-semibold text-white">Account Settings</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white/80 cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Account Type
              </label>
              <div className="px-4 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl">
                <span className="text-sm font-medium text-blue-200">Agency Admin</span>
              </div>
            </div>

            <button className="w-full px-4 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl transition-all duration-200 font-medium transform hover:scale-105 shadow-lg">
              Change Password
            </button>
          </div>
        </div>

        {/* Zapier Integration */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-200 animate-fade-in" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center mb-6">
            <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30 mr-3">
              <Webhook className="w-5 h-5 text-purple-200" />
            </div>
            <h2 className="text-xl font-semibold text-white">Zapier Integration</h2>
          </div>
          
          <div className="space-y-6">
            <p className="text-sm text-white/70">
              Connect your forms to Zapier to automatically send responses to your email, CRM, or other tools.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="zapier-enabled"
                className="w-4 h-4 text-purple-600 bg-white/10 border-white/30 rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="zapier-enabled" className="ml-3 text-sm text-white/80">
                Enable Zapier webhooks for all forms
              </label>
            </div>

            <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 font-medium transform hover:scale-105 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40">
              Save Webhook Settings
            </button>
          </div>
        </div>

        {/* API Settings */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-200 animate-fade-in" style={{animationDelay: '0.4s'}}>
          <div className="flex items-center mb-6">
            <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-400/30 mr-3">
              <Key className="w-5 h-5 text-green-200" />
            </div>
            <h2 className="text-xl font-semibold text-white">API Access</h2>
          </div>
          
          <div className="space-y-6">
            <p className="text-sm text-white/70">
              Generate API keys to access your forms and responses programmatically.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                API Key
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value="dk_live_••••••••••••••••"
                  disabled
                  className="flex-1 px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white/80 font-mono text-sm cursor-not-allowed"
                />
                <button className="px-4 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl transition-all duration-200 font-medium">
                  Regenerate
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-xl p-4">
              <p className="text-sm text-amber-200">
                <strong>Important:</strong> Keep your API key secure. Don't share it in publicly accessible areas.
              </p>
            </div>
          </div>
        </div>

        {/* Embed Settings */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-200 animate-fade-in" style={{animationDelay: '0.5s'}}>
          <div className="flex items-center mb-6">
            <div className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-400/30 mr-3">
              <Globe className="w-5 h-5 text-cyan-200" />
            </div>
            <h2 className="text-xl font-semibold text-white">Embed Settings</h2>
          </div>
          
          <div className="space-y-6">
            <p className="text-sm text-white/70">
              Configure default settings for embedded forms.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Default Form Height
              </label>
              <select className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200 hover:bg-white/15">
                <option value="600" className="bg-slate-800 text-white">600px</option>
                <option value="800" className="bg-slate-800 text-white">800px</option>
                <option value="1000" className="bg-slate-800 text-white">1000px</option>
                <option value="auto" className="bg-slate-800 text-white">Auto</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="responsive-embed"
                defaultChecked
                className="w-4 h-4 text-cyan-600 bg-white/10 border-white/30 rounded focus:ring-cyan-500 focus:ring-2"
              />
              <label htmlFor="responsive-embed" className="ml-3 text-sm text-white/80">
                Enable responsive embeds
              </label>
            </div>

            <button className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 font-medium transform hover:scale-105 shadow-lg shadow-green-500/25 hover:shadow-green-500/40">
              Update Embed Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}