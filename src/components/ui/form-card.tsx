import React from "react"
import { motion } from "framer-motion"
import { BarChart3, Code, MoreVertical, Eye, Edit, Copy as Duplicate, Trash2 } from "lucide-react"

interface FormCardProps {
  form: {
    id: string
    name: string
    internal_name?: string | null
    description: string | null
    is_active: boolean
    created_at: string
    folder_id: string | null
    clients: {
      name: string
      primary_color: string
    } | null
    form_folders?: {
      id: string
      name: string
      color: string
    } | null
  }
  index: number
  responseCount: number
  isSelected: boolean
  onToggleSelect: () => void
  onViewResponses: () => void
  onMoveToFolder: (folderId: string | null) => void
  onCopyEmbed: () => void
  onPreview: () => void
  onEdit: () => void
  onDuplicate: () => void
  onToggleStatus: () => void
  onDelete: () => void
  folders: Array<{ id: string; name: string }>
  openMenuId: string | null
  onToggleMenu: () => void
  theme: 'light' | 'dark'
  FolderBadge?: React.ComponentType<any>
}

const FormCard: React.FC<FormCardProps> = ({
  form,
  index,
  responseCount,
  isSelected,
  onToggleSelect,
  onViewResponses,
  onMoveToFolder,
  onCopyEmbed,
  onPreview,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
  folders,
  openMenuId,
  onToggleMenu,
  FolderBadge,
}) => {
  const colors = form.clients
    ? [form.clients.primary_color, "#60A5FA", "#93C5FD"]
    : ["#3B82F6", "#60A5FA", "#93C5FD"]

  const isMenuOpen = openMenuId === form.id

  return (
    <motion.div
      className={`relative bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 hover:shadow-2xl transition-all duration-300 ${
        isMenuOpen ? 'z-[100] overflow-visible' : 'overflow-hidden'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <motion.div
        className="relative z-10 p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: index * 0.05 + 0.1 }}
      >
        <div className="flex items-start justify-between">
          {/* Left side: Checkbox and Form Info */}
          <div className="flex items-start space-x-4 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="mt-1 w-5 h-5 rounded border-2 border-gray-300 dark:border-white/30 bg-white dark:bg-white/10 checked:bg-orange-500 checked:border-orange-500 cursor-pointer transition-all"
            />

            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3 flex-wrap gap-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {form.name}
                </h3>
                {form.internal_name && (
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-500/20 text-orange-600 dark:text-orange-300 border border-orange-400/30">
                    {form.internal_name}
                  </span>
                )}
                <span
                  className={`px-3 py-1.5 text-xs font-medium rounded-full backdrop-blur-sm border ${
                    form.is_active
                      ? 'bg-green-500/20 text-green-600 dark:text-green-300 border-green-400/30'
                      : 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-400/30'
                  }`}
                >
                  {form.is_active ? 'Active' : 'Inactive'}
                </span>
                {form.form_folders && FolderBadge && (
                  <FolderBadge
                    folderName={form.form_folders.name}
                    folderColor={form.form_folders.color}
                    size="sm"
                  />
                )}
              </div>

              {form.description && (
                <p className="text-gray-700 dark:text-white/70 mb-4 text-base leading-relaxed">
                  {form.description}
                </p>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-white/60">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                  Client: {form.clients?.name}
                </span>
                <span>•</span>
                <span>Created {new Date(form.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Right side: Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Responses Button */}
            <button
              onClick={onViewResponses}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 backdrop-blur-sm border border-gray-200 dark:border-white/20 bg-gradient-to-r from-blue-500/10 to-purple-600/10 dark:from-blue-500/20 dark:to-purple-600/20 text-gray-900 dark:text-white hover:from-blue-500/20 hover:to-purple-600/20 dark:hover:from-blue-500/30 dark:hover:to-purple-600/30 hover:scale-105"
              title="View responses"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Responses</span>
              {responseCount > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white font-semibold">
                  {responseCount}
                </span>
              )}
            </button>

            {/* Move to Folder dropdown */}
            <select
              value={form.folder_id || ''}
              onChange={(e) => onMoveToFolder(e.target.value || null)}
              className="px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 backdrop-blur-sm border border-gray-200 dark:border-white/20 bg-white/50 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-white/70 dark:hover:bg-white/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              title="Move to folder"
            >
              <option value="" className="bg-gray-100 dark:bg-gray-800">
                📭 Uncategorized
              </option>
              {folders.map((folder) => (
                <option
                  key={folder.id}
                  value={folder.id}
                  className="bg-gray-100 dark:bg-gray-800"
                >
                  📁 {folder.name}
                </option>
              ))}
            </select>

            {/* Embed Code Button */}
            <button
              onClick={onCopyEmbed}
              className="p-3 text-gray-600 dark:text-white/60 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-xl transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-blue-200 dark:hover:border-blue-400/30"
              title="Copy embed code"
            >
              <Code className="w-5 h-5" />
            </button>

            {/* More Actions Dropdown */}
            <div className="relative z-[110]">
              <button
                onClick={onToggleMenu}
                className="p-3 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-gray-200 dark:hover:border-white/30"
                title="More actions"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {isMenuOpen && (
                <>
                  {/* Backdrop to close menu */}
                  <div className="fixed inset-0 z-[90]" onClick={onToggleMenu} />

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/20 shadow-2xl overflow-hidden z-[120] animate-scale-in">
                    <button
                      onClick={() => {
                        onPreview()
                        onToggleMenu()
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-green-500 dark:text-green-300" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => {
                        onEdit()
                        onToggleMenu()
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <Edit className="w-4 h-4 text-purple-500 dark:text-purple-300" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => {
                        onDuplicate()
                        onToggleMenu()
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <Duplicate className="w-4 h-4 text-orange-500 dark:text-orange-300" />
                      <span>Duplicate</span>
                    </button>

                    <div className="h-px bg-gray-200 dark:bg-white/10 my-1" />

                    <button
                      onClick={() => {
                        onToggleStatus()
                        onToggleMenu()
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      {form.is_active ? (
                        <>
                          <div className="w-4 h-4 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-slate-400" />
                          </div>
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                          </div>
                          <span>Activate</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onDelete()
                        onToggleMenu()
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export { FormCard }
