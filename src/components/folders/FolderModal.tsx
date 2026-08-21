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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl animate-scale-in bg-white dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800/80">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              {mode === 'create' ? 'Create New Folder' : 'Edit Folder'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Organize forms into custom workspace folders.
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Folder Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Folder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing Forms, Client Projects..."
              required
              maxLength={50}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this folder..."
              rows={2}
              maxLength={200}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 resize-none"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Folder Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 border ${
                    color === presetColor
                      ? 'border-black dark:border-white shadow-xs ring-1 ring-black dark:ring-white'
                      : 'border-transparent'
                  }`}
                  style={{
                    backgroundColor: presetColor
                  }}
                  title={presetColor}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
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
