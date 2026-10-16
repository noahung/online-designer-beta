import React, { useState, useEffect } from 'react'
import {
  Folder,
  FolderPlus,
  Edit2,
  Trash2,
  Inbox,
  ChevronRight,
  Search,
  Plus,
  Lock
} from 'lucide-react'
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
  onCreateForm?: () => void
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
  onToggleCollapse,
  onCreateForm
}: FolderSidebarProps) {
  const { theme } = useTheme()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [searchFilter, setSearchFilter] = useState('')

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchFilter.toLowerCase())
  )

  if (isCollapsed) {
    return (
      <div className="w-14 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d0d] flex flex-col items-center py-4 transition-all">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title="Expand workspaces"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d0d] flex flex-col select-none h-full font-sans">
      {/* Top CTA & Search */}
      <div className="p-3 space-y-2.5 border-b border-zinc-200 dark:border-zinc-800">
        {onCreateForm && (
          <button
            type="button"
            onClick={onCreateForm}
            className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create form</span>
          </button>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search workspaces..."
            className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#18181b] text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      {/* Workspaces & Folders Section */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            <Lock className="w-3 h-3" />
            <span>Private Workspaces</span>
          </div>
          <button
            type="button"
            onClick={onCreateFolder}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Create new workspace"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* All Forms (Uncategorized / Root) */}
        <button
          type="button"
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            selectedFolderId === null
              ? 'bg-zinc-200/80 dark:bg-[#212121] text-zinc-950 dark:text-white font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#18181b] hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <Inbox className="w-3.5 h-3.5 text-zinc-400" />
            <span className="truncate">All Forms</span>
          </div>
          {uncategorizedCount > 0 && (
            <span className="text-[11px] text-zinc-400 font-normal">
              {uncategorizedCount}
            </span>
          )}
        </button>

        {/* Dynamic Folder List */}
        <div className="space-y-0.5">
          {filteredFolders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                selectedFolderId === folder.id
                  ? 'bg-zinc-200/80 dark:bg-[#212121] text-zinc-950 dark:text-white font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#18181b] hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                <Folder
                  className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400"
                />
                <span className="truncate">{folder.name}</span>
              </div>

              <div className="flex items-center gap-1">
                {folder.form_count !== undefined && (
                  <span className="text-[11px] text-zinc-400 group-hover:hidden">
                    {folder.form_count}
                  </span>
                )}
                <div className="hidden group-hover:flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditFolder(folder)
                    }}
                    className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    title="Edit folder"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteFolder(folder.id)
                    }}
                    className="p-1 text-zinc-400 hover:text-red-500"
                    title="Delete folder"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
