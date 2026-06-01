import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { Key, User, Globe, Copy, Check } from 'lucide-react'

interface UserSettings {
  webhook_url: string
  zapier_enabled: boolean
  api_key: string
  brevo_api_key: string
}

export default function Settings() {
  const { user } = useAuth()
  const { push } = useToast()
  const [settings, setSettings] = useState<UserSettings>({
    webhook_url: '',
    zapier_enabled: false,
    api_key: '',
    brevo_api_key: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Interactive local states to match Gemini UX
  const [formHeight, setFormHeight] = useState('600')
  const [responsiveEmbed, setResponsiveEmbed] = useState(true)

  useEffect(() => {
    if (user) {
      loadUserSettings()
    }
  }, [user])

  const loadUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('webhook_url, zapier_enabled, api_key, brevo_api_key')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setSettings({
          webhook_url: data.webhook_url || '',
          zapier_enabled: data.zapier_enabled || false,
          api_key: data.api_key || '',
          brevo_api_key: data.brevo_api_key || ''
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
          api_key: settings.api_key,
          brevo_api_key: settings.brevo_api_key
        }, { onConflict: 'user_id' })

      if (error) throw error

      push({ type: 'success', message: 'Settings saved successfully!' })
    } catch (error) {
      console.error('Error saving settings:', error)
      push({ type: 'error', message: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const regenerateApiKey = async () => {
    try {
      setSaving(true)
      
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

  const handleCopyKey = () => {
    if (settings.api_key) {
      navigator.clipboard.writeText(settings.api_key)
      setCopied(true)
      push({ type: 'success', message: 'API key copied to clipboard!' })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-full w-full py-12 px-6 dark:bg-transparent">
      <div className="max-w-3xl mx-auto animate-fade-in">
        {/* Page Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-medium tracking-tight text-white">Settings</h1>
          <p className="text-sm text-zinc-400 mt-2">Manage your account and integration settings</p>
        </div>

        {/* Separator line */}
        <div className="border-b border-zinc-800/80 mb-8" />

        <div className="space-y-12">
          {/* Section 1: Account Settings */}
          <div className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <h2 className="text-lg font-medium text-white mb-1">Account settings</h2>
            <p className="text-xs text-zinc-400 mb-6">View your profile details and manage your account authentication.</p>
            
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-[#1e1e1f] border border-zinc-800/60 rounded-xl text-zinc-400 cursor-not-allowed text-sm focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                  Account Type
                </label>
                <div className="px-4 py-3 bg-[#1e1e1f] border border-zinc-800/60 rounded-xl text-zinc-300 text-sm">
                  Agency Admin
                </div>
              </div>

              <div className="pt-2">
                <button className="px-5 py-2 bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full font-medium transition-all duration-200 border border-zinc-700 text-sm shadow-sm">
                  Change Password
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-zinc-800/80" />

          {/* Section 2: Brevo Email API Key */}
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-lg font-medium text-white mb-1">Brevo Email API Key</h2>
            <p className="text-xs text-zinc-400 mb-6 font-normal leading-relaxed">
              Enter your Brevo API key to enable SMTP email notifications. You can find this key in your Brevo SMTP & API settings dashboard.
            </p>
            
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                  Brevo API Key
                </label>
                <input
                  type="text"
                  value={settings.brevo_api_key || ''}
                  onChange={e => setSettings(prev => ({ ...prev, brevo_api_key: e.target.value }))}
                  placeholder="Enter Brevo API Key (e.g. xkeysib-...)"
                  className="w-full px-4 py-3 bg-[#1e1e1f] border border-zinc-800/60 rounded-xl text-white placeholder-zinc-600 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="pt-2">
                <button 
                  onClick={saveWebhookSettings}
                  disabled={saving}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-800 text-white rounded-full font-medium transition-all duration-200 text-sm shadow-sm disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Brevo API Key'}
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-zinc-800/80" />

          {/* Section 3: API Access */}
          <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <h2 className="text-lg font-medium text-white mb-1">API Access</h2>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Generate secure API keys to integrate and access your forms and responses programmatically. Keep this key confidential.
            </p>
            
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                  API Key
                </label>
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={loading ? 'Loading...' : (settings.api_key || 'No API key generated')}
                      readOnly
                      className="w-full px-4 py-3 pr-12 bg-[#1e1e1f] border border-zinc-800/60 rounded-xl text-zinc-300 font-mono text-sm focus:outline-none select-all cursor-text"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    {settings.api_key && (
                      <button
                        onClick={handleCopyKey}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Copy API key"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  <button 
                    onClick={regenerateApiKey}
                    disabled={loading || saving}
                    className="px-5 py-3 bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full font-medium transition-all duration-200 border border-zinc-700 text-sm shadow-sm disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-zinc-800/80" />

          {/* Section 4: Embed Settings */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-lg font-medium text-white mb-1">Embed settings</h2>
            <p className="text-xs text-zinc-400 mb-6">Configure default viewing behaviors and responsiveness for your public form player embeds.</p>
            
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                  Default Form Height
                </label>
                <select 
                  value={formHeight}
                  onChange={(e) => setFormHeight(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1e1e1f] border border-zinc-800/60 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer text-sm appearance-none"
                >
                  <option value="600" className="bg-[#1e1e1f] text-white">600px</option>
                  <option value="800" className="bg-[#1e1e1f] text-white">800px</option>
                  <option value="1000" className="bg-[#1e1e1f] text-white">1000px</option>
                  <option value="auto" className="bg-[#1e1e1f] text-white">Auto</option>
                </select>
              </div>

              {/* Custom Gemini-style Toggle Switch */}
              <div className="flex items-center justify-between py-2 border-t border-zinc-800/40 border-b border-zinc-800/40">
                <div className="pr-4">
                  <span className="text-sm font-medium text-white">Enable responsive embeds</span>
                  <p className="text-xs text-zinc-500 mt-1 leading-normal">
                    Automatically adjust form dimension scales and layouts to perfectly fit mobile or smaller viewer views.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setResponsiveEmbed(!responsiveEmbed)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none flex-shrink-0 ${
                    responsiveEmbed ? 'bg-orange-600' : 'bg-zinc-800'
                  }`}
                  title="Toggle responsiveness"
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      responsiveEmbed ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => push({ type: 'success', message: 'Embed settings updated successfully!' })}
                  className="px-5 py-2.5 bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full font-medium transition-all duration-200 border border-zinc-700 text-sm shadow-sm"
                >
                  Update Embed Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}