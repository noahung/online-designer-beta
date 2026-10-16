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
    <tr className={`border-b border-zinc-200/70 dark:border-zinc-800/60 hover:bg-zinc-50/80 dark:hover:bg-[#18181b]/70 transition-colors text-xs text-zinc-800 dark:text-zinc-300 group select-none font-sans ${isSelected ? 'bg-zinc-100 dark:bg-[#18181b]' : ''}`}>
      {/* Checkbox + Name */}
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2.5">
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
              className="font-medium text-xs text-zinc-900 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white truncate block max-w-[200px] sm:max-w-[260px] text-left"
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

      {/* Status (Plain text like OpenAI UI) */}
      <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300 text-xs">
        {form.is_active ? 'Active' : 'Archived'}
      </td>

      {/* Workspace / Client */}
      <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400 text-xs truncate max-w-[140px]">
        {form.clients?.name || 'Default Workspace'}
      </td>

      {/* Responses */}
      <td className="py-2.5 px-3 text-xs text-zinc-600 dark:text-zinc-400">
        <button
          type="button"
          onClick={onViewResponses}
          className="hover:text-zinc-900 dark:hover:text-white hover:underline"
        >
          {responseCount}
        </button>
      </td>

      {/* Created Date */}
      <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
        {formattedDate}
      </td>

      {/* Actions (OpenAI style icons: Edit pencil, Copy Embed, Duplicate, Delete trash) */}
      <td className="py-2.5 px-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title="Edit Form"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onPreview}
            className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title="Preview Form"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onCopyEmbed}
            className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title="Copy Embed Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title="Duplicate"
          >
            <Duplicate className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}
