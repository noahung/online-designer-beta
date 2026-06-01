import React from "react"
import { motion } from "framer-motion"
import { BarChart3, Code, MoreVertical, Eye, Pencil, Copy as Duplicate, Trash2 } from "lucide-react"

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
  const isMenuOpen = openMenuId === form.id

  // Determine elegant, calm avatar colors based on the form name
  const avatarStyle = React.useMemo(() => {
    const colors = [
      { bg: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400" },
      { bg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" },
      { bg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400" },
      { bg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" },
      { bg: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" },
      { bg: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400" },
    ]
    const charCodeSum = form.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const colorIndex = Math.abs(charCodeSum) % colors.length
    return colors[colorIndex]
  }, [form.name])

  return (
    <motion.div
      className={`relative bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-200/60 dark:border-white/10 hover:bg-zinc-100/50 dark:hover:bg-white/[0.08] transition-all duration-200 ${
        isMenuOpen ? 'z-[100] overflow-visible' : 'overflow-hidden'
      }`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
    >
      <div className="relative z-10 p-5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Left Side: Checkbox, Avatar, and Form Info */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-orange-500 focus:ring-0 cursor-pointer transition-all flex-shrink-0"
            />

            {/* Letter Avatar (Gemini style) */}
            <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm transition-transform duration-200 ${avatarStyle.bg}`}>
              {form.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2.5 mb-1 flex-wrap gap-y-1">
                <h3 className="text-base font-semibold text-zinc-950 dark:text-white truncate max-w-[240px] sm:max-w-md md:max-w-lg lg:max-w-xl">
                  {form.name}
                </h3>
                {form.internal_name && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50">
                    {form.internal_name}
                  </span>
                )}
                
                {/* Clean inline status dot instead of bulky badge */}
                <span className={`inline-flex items-center text-xs font-medium ${form.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${form.is_active ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
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
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-normal line-clamp-1 mb-1 leading-relaxed">
                  {form.description}
                </p>
              )}

              {/* Clean metadata line */}
              <div className="flex items-center space-x-2.5 text-xs text-zinc-400 dark:text-zinc-500 font-normal">
                <span>Client: <span className="text-zinc-600 dark:text-zinc-400 font-medium">{form.clients?.name || 'Unassigned'}</span></span>
                <span>•</span>
                <span>Created {new Date(form.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Right Side: Gemini-style Quiet Action Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            
            {/* Clean Responses Link/Count Button */}
            <button
              onClick={onViewResponses}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              title="View responses"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Responses</span>
              {responseCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] leading-none rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                  {responseCount}
                </span>
              )}
            </button>

            {/* Custom styled select box - quiet and borderless */}
            <div className="relative hidden md:block">
              <select
                value={form.folder_id || ''}
                onChange={(e) => onMoveToFolder(e.target.value || null)}
                className="appearance-none pl-2.5 pr-6 py-1.5 text-xs font-medium rounded-lg bg-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer focus:outline-none"
                title="Move to folder"
              >
                <option value="" className="bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">Uncategorized</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id} className="bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                    {folder.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Embed settings (Gemini's Share style) */}
            <button
              onClick={onCopyEmbed}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              title="Embed settings"
            >
              <Code className="w-4 h-4" />
            </button>

            {/* Direct Edit Pencil (Gemini's Pencil style) */}
            <button
              onClick={onEdit}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              title="Edit form"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* More Actions Dropdown */}
            <div className="relative z-[110]">
              <button
                onClick={onToggleMenu}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                title="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={onToggleMenu} />
                  <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden z-[120]">
                    <button
                      onClick={() => {
                        onPreview()
                        onToggleMenu()
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => {
                        onDuplicate()
                        onToggleMenu()
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <Duplicate className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                      <span>Duplicate</span>
                    </button>

                    <button
                      onClick={() => {
                        onToggleStatus()
                        onToggleMenu()
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${form.is_active ? 'bg-zinc-400 dark:bg-zinc-600' : 'bg-emerald-500'}`} />
                      </span>
                      <span>{form.is_active ? 'Deactivate' : 'Activate'}</span>
                    </button>

                    <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                    <button
                      onClick={() => {
                        onDelete()
                        onToggleMenu()
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  )
}

export { FormCard }
