import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Globe, Webhook, Key } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your account and integration settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Account Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-slate-400 mr-2" />
            <h2 className="text-lg font-semibold text-slate-900">Account Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Account Type
              </label>
              <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-800">Agency Admin</span>
              </div>
            </div>

            <button className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors">
              Change Password
            </button>
          </div>
        </div>

        {/* Zapier Integration */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center mb-4">
            <Webhook className="w-5 h-5 text-slate-400 mr-2" />
            <h2 className="text-lg font-semibold text-slate-900">Zapier Integration</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Connect your forms to Zapier to automatically send responses to your email, CRM, or other tools.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="zapier-enabled"
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="zapier-enabled" className="ml-2 text-sm text-slate-700">
                Enable Zapier webhooks for all forms
              </label>
            </div>

            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Save Webhook Settings
            </button>
          </div>
        </div>

        {/* API Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center mb-4">
            <Key className="w-5 h-5 text-slate-400 mr-2" />
            <h2 className="text-lg font-semibold text-slate-900">API Access</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Generate API keys to access your forms and responses programmatically.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                API Key
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value="dk_live_••••••••••••••••"
                  disabled
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-600 font-mono text-sm"
                />
                <button className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors">
                  Regenerate
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Keep your API key secure. Don't share it in publicly accessible areas.
              </p>
            </div>
          </div>
        </div>

        {/* Embed Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center mb-4">
            <Globe className="w-5 h-5 text-slate-400 mr-2" />
            <h2 className="text-lg font-semibold text-slate-900">Embed Settings</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Configure default settings for embedded forms.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Default Form Height
              </label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="600">600px</option>
                <option value="800">800px</option>
                <option value="1000">1000px</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="responsive-embed"
                defaultChecked
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="responsive-embed" className="ml-2 text-sm text-slate-700">
                Enable responsive embeds
              </label>
            </div>

            <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              Update Embed Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}