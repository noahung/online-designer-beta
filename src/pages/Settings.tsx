import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { 
  Key, 
  User, 
  Globe, 
  Copy, 
  Check, 
  Shield, 
  Mail, 
  Code, 
  ExternalLink, 
  RefreshCw, 
  Lock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react'

interface UserSettings {
  webhook_url: string
  zapier_enabled: boolean
  api_key: string
  brevo_api_key: string
}

type SettingsTab = 'general' | 'api' | 'integrations' | 'embeds'

export default function Settings() {
  const { user } = useAuth()
  const { push } = useToast()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [settings, setSettings] = useState<UserSettings>({
    webhook_url: '',
    zapier_enabled: false,
    api_key: '',
    brevo_api_key: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Interactive local states for embed settings
  const [formHeight, setFormHeight] = useState('600')
  const [responsiveEmbed, setResponsiveEmbed] = useState(true)

  // Password reset modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)

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

  const saveSettings = async () => {
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
    } catch (error: any) {
      console.error('Error saving settings:', error)
      push({ type: 'error', message: `Failed to save settings: ${error.message}` })
    } finally {
      setSaving(false)
    }
  }

  const regenerateApiKey = async () => {
    try {
      setSaving(true)
      const newKey = generateApiKey()
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          ...settings,
          api_key: newKey
        }, { onConflict: 'user_id' })

      if (error) throw error
      
      setSettings(prev => ({ ...prev, api_key: newKey }))
      push({ type: 'success', message: 'New API key generated and saved!' })
    } catch (error: any) {
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      push({ type: 'error', message: 'Password must be at least 6 characters' })
      return
    }
    if (newPassword !== confirmPassword) {
      push({ type: 'error', message: 'Passwords do not match' })
      return
    }

    setUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
      push({ type: 'success', message: 'Password updated successfully!' })
      setShowPasswordModal(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      push({ type: 'error', message: `Failed to update password: ${error.message}` })
    } finally {
      setUpdatingPassword(false)
    }
  }

  return (
    <div className="min-h-full w-full py-8 md:py-10 px-4 md:px-8 font-sans bg-white dark:bg-[#0d0d0d] text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Project Settings
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Manage account authentication, global API keys, and workspace integrations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://platform.openai.com/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              <span>Documentation</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
          </div>
        </div>

        {/* OpenAI Clean Text Navigation Tab Bar */}
        <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800 -mt-2 overflow-x-auto">
          {[
            { id: 'general', label: 'General' },
            { id: 'api', label: 'API Keys' },
            { id: 'integrations', label: 'Integrations & Webhooks' },
            { id: 'embeds', label: 'Embed Defaults' },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`pb-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab 1: General & Profile */}
        {activeTab === 'general' && (
          <div className="space-y-6 pt-2 animate-fade-in">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                Profile &amp; Authentication
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Your authenticated account details and credentials.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800/80">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">Email Address</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Primary login and account recovery email.</p>
                </div>
                <div className="font-mono text-xs text-zinc-800 dark:text-zinc-200 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  {user?.email || 'user@example.com'}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800/80">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">Account Role</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Workspace permission and access tier.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                  <Shield className="w-3.5 h-3.5 text-indigo-500" />
                  Agency Admin
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">Password</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Update your password to keep your workspace secure.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#18181b] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-medium shadow-xs transition-colors"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: API Keys & Access */}
        {activeTab === 'api' && (
          <div className="space-y-6 pt-2 animate-fade-in">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                Developer API Keys
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Secret API keys used to securely authenticate programmatic requests from your own backend or headless SDK.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-6 shadow-xs space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-zinc-900 dark:text-white">
                    Live Production API Key
                  </label>
                  <span className="text-[11px] font-mono text-zinc-400">Bearer Token</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={loading ? 'Loading API key...' : (settings.api_key || 'No key generated')}
                      readOnly
                      className="w-full px-3.5 py-2.5 pr-10 bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-100 select-all cursor-text focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    />
                    {settings.api_key && (
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                        title="Copy API key"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={regenerateApiKey}
                    disabled={loading || saving}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3 text-zinc-500" />
                    <span>Regenerate</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Do not share your API key in client-side code or public repositories. Requests with this key have full administrative access.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-white mb-2">
                  Sample cURL Request
                </h4>
                <pre className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto">
{`curl -X GET "${window.location.origin}/api/forms" \\
  -H "Authorization: Bearer ${settings.api_key || 'dk_live_your_key'}" \\
  -H "Content-Type: application/json"`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Integrations & Brevo */}
        {activeTab === 'integrations' && (
          <div className="space-y-6 pt-2 animate-fade-in">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                Email &amp; Webhook Integrations
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Configure SMTP email credentials and default Zapier webhook endpoints.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-6 shadow-xs space-y-6">
              {/* Brevo SMTP Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-900 dark:text-white">
                    Brevo (Sendinblue) API Key
                  </label>
                  <a
                    href="https://app.brevo.com/settings/keys/api"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1"
                  >
                    <span>Get API Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="text"
                  value={settings.brevo_api_key || ''}
                  onChange={(e) => setSettings((prev) => ({ ...prev, brevo_api_key: e.target.value }))}
                  placeholder="xkeysib-..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Used to deliver transactional lead alert emails and submission receipts to customers.
                </p>
              </div>

              {/* Default Webhook URL */}
              <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                <label className="text-xs font-semibold text-zinc-900 dark:text-white block">
                  Default Global Zapier Webhook URL
                </label>
                <input
                  type="url"
                  value={settings.webhook_url || ''}
                  onChange={(e) => setSettings((prev) => ({ ...prev, webhook_url: e.target.value }))}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Fallback endpoint for forms that do not have a dedicated client-level webhook configured.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Integration Settings'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Embed Defaults */}
        {activeTab === 'embeds' && (
          <div className="space-y-6 pt-2 animate-fade-in">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                Embed &amp; Player Defaults
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Configure default iframe viewport height and responsive behavior for published forms.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-6 shadow-xs space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-900 dark:text-white block">
                  Default Embed Viewport Height
                </label>
                <select
                  value={formHeight}
                  onChange={(e) => setFormHeight(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
                >
                  <option value="600">600px (Compact)</option>
                  <option value="800">800px (Standard Desktop)</option>
                  <option value="1000">1000px (Large Screen)</option>
                  <option value="auto">Auto Responsive Height</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-b border-zinc-100 dark:border-zinc-800/80">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">
                    Enable Responsive Mobile Embeds
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Automatically scales form container width and font sizes when viewed on small touch devices.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={responsiveEmbed}
                    onChange={(e) => setResponsiveEmbed(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900 dark:peer-checked:bg-white dark:peer-checked:after:bg-zinc-900" />
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => push({ type: 'success', message: 'Embed preferences updated!' })}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold shadow-xs transition-colors"
                >
                  Save Embed Preferences
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Change Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}