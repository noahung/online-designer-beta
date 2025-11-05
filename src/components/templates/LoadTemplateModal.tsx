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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col ${
        theme === 'light'
          ? 'bg-white text-gray-900'
          : 'bg-slate-800 text-white'
      }`}>
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'light' ? 'border-gray-200' : 'border-white/10'
        }`}>
          <div>
            <h2 className="text-xl font-semibold">Load Step Template</h2>
            <p className={`text-sm mt-1 ${
              theme === 'light' ? 'text-gray-600' : 'text-white/70'
            }`}>
              Choose a saved template to quickly configure this step
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'light'
                ? 'hover:bg-gray-100 text-gray-600'
                : 'hover:bg-white/10 text-white/70'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
              theme === 'light' ? 'text-gray-400' : 'text-white/40'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200 ${
                theme === 'light'
                  ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  : 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
              }`}
            />
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className={`text-center py-12 ${
                theme === 'light' ? 'text-gray-500' : 'text-white/50'
              }`}>
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  {searchQuery ? 'No templates found' : 'No templates yet'}
                </p>
                <p className="text-sm">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Save your first template to reuse step configurations'}
                </p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedTemplate?.id === template.id
                      ? theme === 'light'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-blue-400 bg-blue-500/10'
                      : theme === 'light'
                        ? 'border-gray-200 hover:border-gray-300 bg-white'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        theme === 'light' ? 'bg-gray-100' : 'bg-white/10'
                      }`}>
                        {stepTypeIcons[template.question_type] || <FileText className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{template.name}</h3>
                        {template.description && (
                          <p className={`text-sm mb-2 ${
                            theme === 'light' ? 'text-gray-600' : 'text-white/70'
                          }`}>
                            {template.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className={`px-2 py-1 rounded-md ${
                            theme === 'light' ? 'bg-gray-100 text-gray-700' : 'bg-white/10 text-white/80'
                          }`}>
                            {template.question_type.replace('_', ' ')}
                          </span>
                          {template.options && template.options.length > 0 && (
                            <span className={`px-2 py-1 rounded-md ${
                              theme === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              {template.options.length} options
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(template.id, e)}
                      disabled={deletingId === template.id}
                      className={`p-2 rounded-lg transition-colors ml-2 ${
                        theme === 'light'
                          ? 'hover:bg-red-100 text-red-600'
                          : 'hover:bg-red-500/20 text-red-400'
                      }`}
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                theme === 'light'
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedTemplate}
              className={`inline-flex items-center px-6 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
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
