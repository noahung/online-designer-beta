import { X, FolderInput } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { Folder } from '../../api/folders'

interface BulkActionsProps {
  selectedCount: number
  folders: Folder[]
  onMoveToFolder: (folderId: string | null) => void
  onClearSelection: () => void
}

export default function BulkActions({ selectedCount, folders, onMoveToFolder, onClearSelection }: BulkActionsProps) {
  const { theme } = useTheme()

  if (selectedCount === 0) return null

  return (
    <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 rounded-2xl border shadow-2xl backdrop-blur-xl p-4 animate-slide-up z-40 ${
      theme === 'light'
        ? 'bg-white/90 border-gray-200'
        : 'bg-gray-900/90 border-white/20'
    }`}>
      <div className="flex items-center space-x-4">
        {/* Selection Count */}
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
          theme === 'light' ? 'bg-blue-50' : 'bg-blue-500/20'
        }`}>
          <span className={`font-semibold ${
            theme === 'light' ? 'text-blue-700' : 'text-blue-300'
          }`}>
            {selectedCount} form{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>

        {/* Move to Folder Dropdown */}
        <div className="relative">
          <select
            onChange={(e) => {
              const value = e.target.value
              onMoveToFolder(value === 'null' ? null : value)
              e.target.value = '' // Reset selection
            }}
            className={`px-4 py-2 rounded-lg border font-medium cursor-pointer transition-all appearance-none pr-10 ${
              theme === 'light'
                ? 'bg-white border-gray-300 text-gray-700 hover:border-orange-500'
                : 'bg-white/10 border-white/20 text-white hover:border-orange-400'
            } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
          >
            <option value="">Move to folder...</option>
            <option value="null">📭 Uncategorized</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                📁 {folder.name}
              </option>
            ))}
          </select>
          <FolderInput className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none ${
            theme === 'light' ? 'text-gray-400' : 'text-white/40'
          }`} />
        </div>

        {/* Clear Selection */}
        <button
          onClick={onClearSelection}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'light'
              ? 'hover:bg-gray-100 text-gray-500'
              : 'hover:bg-white/10 text-white/60'
          }`}
          title="Clear selection"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
