import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { User, Globe, Webhook, Key } from 'lucide-react'

interface UserSettings {
  webhook_url: string
  zapier_enabled: boolean
  api_key: string
}

export default function Settings() {
  const { user } = useAuth()
  const { push } = useToast()
  const [settings, setSettings] = useState<UserSettings>({
    webhook_url: '',
    zapier_enabled: false,
    api_key: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserSettings()
    }
  }, [user])

  const loadUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('webhook_url, zapier_enabled, api_key')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setSettings({
          webhook_url: data.webhook_url || '',
          zapier_enabled: data.zapier_enabled || false,
          api_key: data.api_key || ''
        })
      } else {
        // Generate initial API key for new users
        const newApiKey = generateApiKey()
        setSettings(prev => ({ ...prev, api_key: newApiKey }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      push({ type: 'error', message: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const generateApiKey = () => {
    return 'dk_live_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const saveWebhookSettings = async () => {
    if (!user) return
    setSaving(true)

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          webhook_url: settings.webhook_url,
          zapier_enabled: settings.zapier_enabled,
          api_key: settings.api_key
        })

      if (error) throw error

      push({ type: 'success', message: 'Webhook settings saved successfully!' })
    } catch (error) {
      console.error('Error saving settings:', error)
      push({ type: 'error', message: 'Failed to save webhook settings' })
    } finally {
      setSaving(false)
    }
  }

  const regenerateApiKey = async () => {
    try {
      setSaving(true)
      
      // Use Supabase function to generate new API key
      const { data: newApiKey, error } = await supabase
        .rpc('generate_new_api_key', {
          user_id_param: user?.id
        })

      if (error) throw error
      
      setSettings(prev => ({ ...prev, api_key: newApiKey }))
      push({ type: 'success', message: 'API key regenerated successfully!' })
    } catch (error) {
      console.error('Error regenerating API key:', error)
      push({ type: 'error', message: 'Failed to regenerate API key' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8 animate-slide-up">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-orange-100 to-red-200 bg-clip-text text-transparent">Settings</h1>
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
                value={settings.webhook_url}
                onChange={(e) => setSettings(prev => ({ ...prev, webhook_url: e.target.value }))}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
              />
              <p className="text-xs text-white/60 mt-2">
                Copy this URL from your Zapier webhook trigger
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="zapier-enabled"
                checked={settings.zapier_enabled}
                onChange={(e) => setSettings(prev => ({ ...prev, zapier_enabled: e.target.checked }))}
                className="w-4 h-4 text-purple-600 bg-white/10 border-white/30 rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="zapier-enabled" className="ml-3 text-sm text-white/80">
                Enable Zapier webhooks for all forms
              </label>
            </div>

            <button 
              onClick={saveWebhookSettings}
              disabled={saving}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-800 disabled:to-pink-800 text-white rounded-xl transition-all duration-200 font-medium transform hover:scale-105 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:cursor-not-allowed disabled:transform-none"
            >
              {saving ? 'Saving...' : 'Save Webhook Settings'}
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
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={loading ? 'Loading...' : (settings.api_key || 'No API key generated')}
                    readOnly
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white/80 font-mono text-sm pr-12 select-all"
                    onClick={(e) => e.target.select()}
                  />
                  {settings.api_key && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(settings.api_key)
                        push({ type: 'success', message: 'API key copied to clipboard!' })
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Copy API key"
                    >
                      <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
                <button 
                  onClick={regenerateApiKey}
                  disabled={loading}
                  className="px-4 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 disabled:from-slate-800 disabled:to-slate-900 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Regenerate'}
                </button>
              </div>
              <p className="text-xs text-white/60 mt-2">
                Use this key to access the API programmatically. Click the key to select all or use the copy button.
              </p>
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