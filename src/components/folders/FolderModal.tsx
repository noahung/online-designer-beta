import { useState } from 'react'
import { X } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { createPortal } from 'react-dom'

interface FolderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { name: string; description: string; color: string }) => Promise<void>
  initialData?: {
    name: string
    description: string
    color: string
  }
  mode: 'create' | 'edit'
}

const PRESET_COLORS = [
  '#FF6B35', // Orange
  '#F7931E', // Light Orange
  '#FFD23F', // Yellow
  '#4ECDC4', // Teal
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#10B981', // Green
  '#6366F1', // Indigo
  '#64748B', // Slate
  '#78716C', // Stone
]

export default function FolderModal({ isOpen, onClose, onSave, initialData, mode }: FolderModalProps) {
  const { theme } = useTheme()
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [color, setColor] = useState(initialData?.color || '#FF6B35')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await onSave({ name: name.trim(), description: description.trim(), color })
      onClose()
      // Reset form
      setName('')
      setDescription('')
      setColor('#FF6B35')
    } catch (error) {
      console.error('Error saving folder:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setName(initialData?.name || '')
      setDescription(initialData?.description || '')
      setColor(initialData?.color || '#FF6B35')
      onClose()
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className={`w-full max-w-md rounded-2xl border shadow-2xl animate-scale-in ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-gray-900 border-white/20'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'light' ? 'border-gray-200' : 'border-white/10'
        }`}>
          <h2 className={`text-2xl font-bold ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            {mode === 'create' ? 'Create New Folder' : 'Edit Folder'}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'light'
                ? 'hover:bg-gray-100 text-gray-500'
                : 'hover:bg-white/10 text-white/60'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Folder Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-white/80'
            }`}>
              Folder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Forms, Client Projects..."
              required
              maxLength={50}
              className={`w-full px-4 py-2 rounded-lg border transition-all ${
                theme === 'light'
                  ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                  : 'bg-white/5 border-white/20 text-white placeholder-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20'
              } focus:outline-none`}
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-white/80'
            }`}>
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this folder..."
              rows={3}
              maxLength={200}
              className={`w-full px-4 py-2 rounded-lg border transition-all resize-none ${
                theme === 'light'
                  ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                  : 'bg-white/5 border-white/20 text-white placeholder-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20'
              } focus:outline-none`}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${
              theme === 'light' ? 'text-gray-700' : 'text-white/80'
            }`}>
              Folder Color
            </label>
            <div className="grid grid-cols-6 gap-3">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-10 h-10 rounded-lg transition-all hover:scale-110 ${
                    color === presetColor
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
                      : 'hover:ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
                  }`}
                  style={{
                    backgroundColor: presetColor
                  }}
                  title={presetColor}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center space-x-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 rounded-lg border-2 cursor-pointer"
                title="Custom color"
              />
              <span className={`text-sm ${
                theme === 'light' ? 'text-gray-600' : 'text-white/60'
              }`}>
                Or choose a custom color
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-white/10 text-white hover:bg-white/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Folder' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
