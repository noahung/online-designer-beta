import React, { useState } from 'react'
import { X, Save } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface SaveTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, description: string) => Promise<void>
  stepType: string
}

export default function SaveTemplateModal({ isOpen, onClose, onSave, stepType }: SaveTemplateModalProps) {
  const { theme } = useTheme()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      await onSave(name.trim(), description.trim())
      setName('')
      setDescription('')
      onClose()
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      setName('')
      setDescription('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-2xl shadow-xl ${
        theme === 'light'
          ? 'bg-white text-gray-900'
          : 'bg-slate-800 text-white'
      }`}>
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'light' ? 'border-gray-200' : 'border-white/10'
        }`}>
          <h2 className="text-xl font-semibold">Save Step as Template</h2>
          <button
            onClick={handleClose}
            disabled={saving}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'light'
                ? 'hover:bg-gray-100 text-gray-600'
                : 'hover:bg-white/10 text-white/70'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-white/90'
            }`}>
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Window Style Selection"
              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                theme === 'light'
                  ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
              }`}
              required
              disabled={saving}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-white/90'
            }`}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template is for..."
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 resize-none ${
                theme === 'light'
                  ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
              }`}
              disabled={saving}
            />
          </div>

          <div className={`p-4 rounded-lg ${
            theme === 'light' ? 'bg-blue-50' : 'bg-blue-500/10'
          }`}>
            <p className={`text-sm ${
              theme === 'light' ? 'text-blue-900' : 'text-blue-200'
            }`}>
              <strong>Step Type:</strong> {stepType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
            <p className={`text-xs mt-1 ${
              theme === 'light' ? 'text-blue-700' : 'text-blue-300'
            }`}>
              This template will include all current step settings, options, and configurations.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                theme === 'light'
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className={`inline-flex items-center px-6 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
              }`}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
