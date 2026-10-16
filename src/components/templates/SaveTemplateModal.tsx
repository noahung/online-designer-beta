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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl border transition-all ${
        theme === 'light'
          ? 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-200/50'
          : 'bg-[#18181b] border-zinc-800 text-zinc-100 shadow-black/70'
      }`}>
        <div className={`flex items-center justify-between px-6 py-4.5 border-b ${
          theme === 'light' ? 'border-zinc-100 bg-white' : 'border-zinc-800/80 bg-[#18181b]'
        }`}>
          <div>
            <h2 className={`text-base font-semibold tracking-tight ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>
              Save Step as Template
            </h2>
            <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Create a reusable preset from this step's configuration
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'light'
                ? 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${
              theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'
            }`}>
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Window Style Selection"
              className={`w-full px-3 py-2 rounded-lg text-sm border transition-colors outline-none ${
                theme === 'light'
                  ? 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600'
              }`}
              required
              disabled={saving}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1.5 ${
              theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'
            }`}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template is for..."
              rows={3}
              className={`w-full px-3 py-2 rounded-lg text-sm border transition-colors outline-none resize-none ${
                theme === 'light'
                  ? 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600'
              }`}
              disabled={saving}
            />
          </div>

          <div className={`p-3 rounded-lg border text-xs leading-relaxed ${
            theme === 'light'
              ? 'bg-zinc-50 border-zinc-200 text-zinc-600'
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-200'}`}>
                Step Type:
              </span>
              <span className={`px-1.5 py-0.5 rounded border capitalize ${
                theme === 'light' ? 'bg-zinc-100 text-zinc-700 border-zinc-200' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}>
                {stepType.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-1 text-[11px] opacity-80">
              This template captures all current options, layout settings, and configurations for reuse.
            </p>
          </div>

          <div className={`flex justify-end items-center gap-2.5 pt-4 border-t ${
            theme === 'light' ? 'border-zinc-100' : 'border-zinc-800/80'
          }`}>
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                theme === 'light'
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  : 'bg-white hover:bg-zinc-200 text-zinc-900 font-semibold'
              }`}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
