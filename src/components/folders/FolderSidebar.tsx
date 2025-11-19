import { useState, useEffect } from 'react'
import { Folder, FolderPlus, Edit2, Trash2, MoreVertical, Inbox, ChevronRight, ChevronDown } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { Folder as FolderType } from '../../api/folders'

interface FolderSidebarProps {
  folders: FolderType[]
  selectedFolderId: string | null
  uncategorizedCount: number
  onSelectFolder: (folderId: string | null) => void
  onCreateFolder: () => void
  onEditFolder: (folder: FolderType) => void
  onDeleteFolder: (folderId: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function FolderSidebar({
  folders,
  selectedFolderId,
  uncategorizedCount,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  isCollapsed = false,
  onToggleCollapse
}: FolderSidebarProps) {
  const { theme } = useTheme()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleMenuClick = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation()
    setOpenMenuId(openMenuId === folderId ? null : folderId)
  }

  const handleEdit = (e: React.MouseEvent, folder: FolderType) => {
    e.stopPropagation()
    setOpenMenuId(null)
    onEditFolder(folder)
  }

  const handleDelete = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation()
    setOpenMenuId(null)
    onDeleteFolder(folderId)
  }

  if (isCollapsed) {
    return (
      <div className={`w-16 border-r transition-all duration-300 animate-slide-in-left ${
        theme === 'light'
          ? 'bg-white/50 border-gray-200'
          : 'bg-white/5 border-white/10'
      }`}>
        <button
          onClick={onToggleCollapse}
          className={`w-full p-4 flex items-center justify-center transition-colors ${
            theme === 'light'
              ? 'hover:bg-gray-100 text-gray-600'
              : 'hover:bg-white/10 text-white/60'
          }`}
          title="Expand sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className={`w-72 border-r transition-all duration-300 flex flex-col animate-slide-in-left ${
      theme === 'light'
        ? 'bg-white/50 border-gray-200'
        : 'bg-white/5 border-white/10'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between ${
        theme === 'light' ? 'border-gray-200' : 'border-white/10'
      }`}>
        <h3 className={`font-semibold ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Folders
        </h3>
        <button
          onClick={onToggleCollapse}
          className={`p-1 rounded transition-colors ${
            theme === 'light'
              ? 'hover:bg-gray-100 text-gray-600'
              : 'hover:bg-white/10 text-white/60'
          }`}
          title="Collapse sidebar"
        >
          <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
        </button>
      </div>

      {/* Folder List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* All Forms */}
        <button
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
            selectedFolderId === null
              ? theme === 'light'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-orange-500/20 text-orange-300'
              : theme === 'light'
              ? 'hover:bg-gray-100 text-gray-700'
              : 'hover:bg-white/10 text-white/70'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Inbox className="w-5 h-5" />
            <span className="font-medium">All Forms</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            selectedFolderId === null
              ? theme === 'light'
                ? 'bg-orange-200 text-orange-700'
                : 'bg-orange-500/30 text-orange-200'
              : theme === 'light'
              ? 'bg-gray-200 text-gray-600'
              : 'bg-white/10 text-white/60'
          }`}>
            {folders.reduce((sum, f) => sum + (f.form_count || 0), 0) + uncategorizedCount}
          </span>
        </button>

        {/* Uncategorized */}
        {uncategorizedCount > 0 && (
          <button
            onClick={() => onSelectFolder('uncategorized')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
              selectedFolderId === 'uncategorized'
                ? theme === 'light'
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-slate-500/20 text-slate-300'
                : theme === 'light'
                ? 'hover:bg-gray-100 text-gray-700'
                : 'hover:bg-white/10 text-white/70'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Folder className="w-5 h-5" />
              <span className="font-medium">Uncategorized</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              selectedFolderId === 'uncategorized'
                ? theme === 'light'
                  ? 'bg-slate-200 text-slate-700'
                  : 'bg-slate-500/30 text-slate-200'
                : theme === 'light'
                ? 'bg-gray-200 text-gray-600'
                : 'bg-white/10 text-white/60'
            }`}>
              {uncategorizedCount}
            </span>
          </button>
        )}

        {/* Divider */}
        {folders.length > 0 && (
          <div className={`my-2 border-t ${
            theme === 'light' ? 'border-gray-200' : 'border-white/10'
          }`} />
        )}

        {/* User Folders */}
        {folders.map((folder) => (
          <div key={folder.id} className="relative">
            <button
              onClick={() => onSelectFolder(folder.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                selectedFolderId === folder.id
                  ? 'ring-2 ring-offset-2'
                  : theme === 'light'
                  ? 'hover:bg-gray-100'
                  : 'hover:bg-white/10'
              }`}
              style={{
                backgroundColor: selectedFolderId === folder.id ? `${folder.color}20` : undefined,
                borderColor: selectedFolderId === folder.id ? `${folder.color}40` : undefined,
                ringColor: selectedFolderId === folder.id ? folder.color : undefined
              }}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Folder className="w-5 h-5 flex-shrink-0" style={{ color: folder.color }} />
                <span className={`font-medium truncate ${
                  selectedFolderId === folder.id
                    ? theme === 'light' ? 'text-gray-900' : 'text-white'
                    : theme === 'light' ? 'text-gray-700' : 'text-white/70'
                }`}>
                  {folder.name}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  selectedFolderId === folder.id
                    ? 'opacity-80'
                    : theme === 'light'
                    ? 'bg-gray-200 text-gray-600'
                    : 'bg-white/10 text-white/60'
                }`}
                style={{
                  backgroundColor: selectedFolderId === folder.id ? `${folder.color}30` : undefined,
                  color: selectedFolderId === folder.id ? folder.color : undefined
                }}>
                  {folder.form_count || 0}
                </span>
                
                <button
                  onClick={(e) => handleMenuClick(e, folder.id)}
                  className={`p-1 rounded hover:bg-black/10 transition-colors ${
                    theme === 'light' ? 'text-gray-500' : 'text-white/50'
                  }`}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </button>

            {/* Context Menu */}
            {openMenuId === folder.id && (
              <div className={`absolute right-2 top-12 w-48 rounded-lg border shadow-lg z-10 overflow-hidden ${
                theme === 'light'
                  ? 'bg-white border-gray-200'
                  : 'bg-gray-800 border-white/20'
              }`}>
                <button
                  onClick={(e) => handleEdit(e, folder)}
                  className={`w-full flex items-center space-x-2 px-4 py-2 transition-colors ${
                    theme === 'light'
                      ? 'hover:bg-gray-100 text-gray-700'
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Folder</span>
                </button>
                <button
                  onClick={(e) => handleDelete(e, folder.id)}
                  className={`w-full flex items-center space-x-2 px-4 py-2 transition-colors ${
                    theme === 'light'
                      ? 'hover:bg-red-50 text-red-600'
                      : 'hover:bg-red-500/10 text-red-400'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Folder</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Folder Button */}
      <div className={`p-3 border-t ${
        theme === 'light' ? 'border-gray-200' : 'border-white/10'
      }`}>
        <button
          onClick={onCreateFolder}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all hover:scale-105 ${
            theme === 'light'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white'
              : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white'
          }`}
        >
          <FolderPlus className="w-5 h-5" />
          <span>New Folder</span>
        </button>
      </div>
    </div>
  )
}
