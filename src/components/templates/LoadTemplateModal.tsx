import React, { useState, useEffect } from 'react'
import { X, Search, FileText, Image, User, Upload, Ruler, Star, Frame, MessageSquare, Trash2 } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'

interface StepTemplate {
  id: string
  name: string
  description: string | null
  question_type: string
  title: string
  is_required: boolean
  max_file_size?: number
  allowed_file_types?: string[]
  dimension_type?: '2d' | '3d'
  scale_type?: 'number' | 'star'
  scale_min?: number
  scale_max?: number
  images_per_row?: number
  crop_images_to_square?: boolean
  frames_max_count?: number
  frames_require_image?: boolean
  frames_require_location?: boolean
  frames_require_measurements?: boolean
  created_at: string
  options?: Array<{
    id: string
    label: string
    description?: string
    image_url?: string
    jump_to_step?: number
    option_order: number
  }>
}

interface LoadTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (template: StepTemplate) => Promise<void>
  filterType?: string // Optional: filter templates by question_type
}

const stepTypeIcons: Record<string, React.ReactNode> = {
  image_selection: <Image className="w-5 h-5" />,
  multiple_choice: <MessageSquare className="w-5 h-5" />,
  text_input: <FileText className="w-5 h-5" />,
  contact_fields: <User className="w-5 h-5" />,
  file_upload: <Upload className="w-5 h-5" />,
  dimensions: <Ruler className="w-5 h-5" />,
  opinion_scale: <Star className="w-5 h-5" />,
  frames_plan: <Frame className="w-5 h-5" />
}

export default function LoadTemplateModal({ isOpen, onClose, onSelect, filterType }: LoadTemplateModalProps) {
  const { theme } = useTheme()
  const { push } = useToast()
  const [templates, setTemplates] = useState<StepTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<StepTemplate | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen, filterType])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('step_templates')
        .select(`
          *,
          step_template_options (
            id,
            label,
            description,
            image_url,
            jump_to_step,
            option_order
          )
        `)
        .order('created_at', { ascending: false })

      if (filterType) {
        query = query.eq('question_type', filterType)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform the data to match our interface
      const templatesData = (data || []).map(template => ({
        ...template,
        options: (template.step_template_options || []).sort((a: any, b: any) => a.option_order - b.option_order)
      }))

      setTemplates(templatesData)
    } catch (error) {
      console.error('Error loading templates:', error)
      push({ type: 'error', message: 'Failed to load templates' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this template?')) return

    setDeletingId(templateId)
    try {
      const { error } = await supabase
        .from('step_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      push({ type: 'success', message: 'Template deleted successfully' })
      loadTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      push({ type: 'error', message: 'Failed to delete template' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleSelect = async () => {
    if (!selectedTemplate) return
    
    try {
      await onSelect(selectedTemplate)
      onClose()
    } catch (error) {
      console.error('Error applying template:', error)
      push({ type: 'error', message: 'Failed to apply template' })
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.question_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className={`w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl border flex flex-col transition-all ${
        theme === 'light'
          ? 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-200/50'
          : 'bg-[#18181b] border-zinc-800 text-zinc-100 shadow-black/70'
      }`}>
        <div className={`flex items-center justify-between px-6 py-4.5 border-b ${
          theme === 'light' ? 'border-zinc-100 bg-white' : 'border-zinc-800/80 bg-[#18181b]'
        }`}>
          <div>
            <h2 className={`text-base font-semibold tracking-tight ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>
              Load Step Template
            </h2>
            <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Choose a saved template to quickly configure this step
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'light'
                ? 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              theme === 'light' ? 'text-zinc-400' : 'text-zinc-500'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by name or step type..."
              className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm border transition-colors outline-none ${
                theme === 'light'
                  ? 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600'
              }`}
            />
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-400 border-t-transparent"></div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className={`text-center py-12 ${
                theme === 'light' ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                <FileText className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium mb-1">
                  {searchQuery ? 'No templates found' : 'No saved templates yet'}
                </p>
                <p className="text-xs">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Save any configured step as a template to reuse it across forms'}
                </p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                    selectedTemplate?.id === template.id
                      ? theme === 'light'
                        ? 'border-zinc-900 bg-zinc-100/80 shadow-sm'
                        : 'border-zinc-500 bg-zinc-800/90 shadow-sm'
                      : theme === 'light'
                        ? 'border-zinc-200/80 hover:border-zinc-300 bg-white hover:bg-zinc-50/80'
                        : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                        theme === 'light'
                          ? 'bg-zinc-100 border-zinc-200 text-zinc-700'
                          : 'bg-zinc-800 border-zinc-700/60 text-zinc-300'
                      }`}>
                        {stepTypeIcons[template.question_type] || <FileText className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-medium leading-snug truncate ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>
                            {template.name}
                          </h3>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border capitalize flex-shrink-0 ${
                            theme === 'light' ? 'bg-zinc-100 text-zinc-600 border-zinc-200' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            {template.question_type.replace('_', ' ')}
                          </span>
                        </div>
                        {template.description && (
                          <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${
                            theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'
                          }`}>
                            {template.description}
                          </p>
                        )}
                        {template.options && template.options.length > 0 && (
                          <div className="mt-2 text-xs">
                            <span className={`text-[11px] font-normal ${
                              theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'
                            }`}>
                              {template.options.length} options included
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(template.id, e)
                      }}
                      disabled={deletingId === template.id}
                      className={`p-1.5 rounded-lg transition-colors ml-2 flex-shrink-0 ${
                        theme === 'light'
                          ? 'hover:bg-red-50 text-zinc-400 hover:text-red-600'
                          : 'hover:bg-red-950/40 text-zinc-500 hover:text-red-400'
                      }`}
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className={`flex justify-end items-center gap-2.5 pt-4 border-t ${
            theme === 'light' ? 'border-zinc-100' : 'border-zinc-800/80'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedTemplate}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                theme === 'light'
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  : 'bg-white hover:bg-zinc-200 text-zinc-900 font-semibold'
              }`}
            >
              Apply Template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
