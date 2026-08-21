import React from "react"
import {
  Eye,
  Pencil,
  Copy as Duplicate,
  Trash2,
  Share2,
  FolderInput,
  CheckCircle2,
  Code
} from "lucide-react"

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

export const FormCard: React.FC<FormCardProps> = ({
  form,
  responseCount,
  isSelected,
  onToggleSelect,
  onViewResponses,
  onCopyEmbed,
  onPreview,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(form.created_at)
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return '-'
    }
  }, [form.created_at])

  return (
    <tr className={`border-b border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-[#18181b]/50 transition-colors text-xs text-zinc-900 dark:text-zinc-200 group select-none font-sans ${isSelected ? 'bg-zinc-100 dark:bg-[#18181b]' : ''}`}>
      {/* Checkbox + Name */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-0 cursor-pointer"
          />
          <div className="min-w-0">
            <button
              type="button"
              onClick={onEdit}
              className="font-medium text-xs text-zinc-900 dark:text-zinc-100 hover:underline text-left truncate block max-w-[200px] sm:max-w-[280px]"
            >
              {form.name || 'Untitled Form'}
            </button>
            {form.internal_name && (
              <span className="text-[10px] text-zinc-400 font-mono truncate block">
                {form.internal_name}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Active</span>
        </span>
      </td>

      {/* Workspace / Client */}
      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 truncate max-w-[140px]">
        {form.clients?.name || 'Default Workspace'}
      </td>

      {/* Responses */}
      <td className="py-3 px-4">
        <button
          type="button"
          onClick={onViewResponses}
          className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:underline"
        >
          {responseCount}
        </button>
      </td>

      {/* Created Date */}
      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
        {formattedDate}
      </td>

      {/* Actions (Pencil, Preview, Copy Embed, Duplicate, Delete) */}
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onEdit}
            className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Edit Form"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onPreview}
            className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Preview Form"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onCopyEmbed}
            className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Copy Embed Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Duplicate"
          >
            <Duplicate className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}
