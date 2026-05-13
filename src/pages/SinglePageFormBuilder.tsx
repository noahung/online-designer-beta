import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Settings,
  Trash2,
  Copy,
  AlignLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  CheckSquare,
  ChevronDownSquare,
  Image,
  ToggleLeft,
  Hash,
  Calendar,
  Paperclip,
  Star,
  BarChart2,
  Activity,
  MessageSquare,
  FileText,
  Scale,
  Type,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  SinglePageField,
  SinglePageFieldType,
  SinglePageFieldOption,
  SINGLE_PAGE_FIELD_DEFINITIONS,
  FIELD_CATEGORIES,
  fieldsByCategory,
  emptyField,
  needsOptions,
} from '../components/single-page/FieldTypes'

// ── Lucide icon map ────────────────────────────────────────────────────────────
const FIELD_ICONS: Record<SinglePageFieldType, React.ReactNode> = {
  sp_short_text:     <Type className="h-4 w-4" />,
  sp_long_text:      <AlignLeft className="h-4 w-4" />,
  sp_email:          <Mail className="h-4 w-4" />,
  sp_phone:          <Phone className="h-4 w-4" />,
  sp_address:        <MapPin className="h-4 w-4" />,
  sp_website:        <Globe className="h-4 w-4" />,
  sp_multiple_choice:<CheckSquare className="h-4 w-4" />,
  sp_dropdown:       <ChevronDownSquare className="h-4 w-4" />,
  sp_picture_choice: <Image className="h-4 w-4" />,
  sp_yes_no:         <ToggleLeft className="h-4 w-4" />,
  sp_checkbox:       <CheckSquare className="h-4 w-4" />,
  sp_legal:          <Scale className="h-4 w-4" />,
  sp_number:         <Hash className="h-4 w-4" />,
  sp_date:           <Calendar className="h-4 w-4" />,
  sp_file_upload:    <Paperclip className="h-4 w-4" />,
  sp_rating:         <Star className="h-4 w-4" />,
  sp_opinion_scale:  <BarChart2 className="h-4 w-4" />,
  sp_nps:            <Activity className="h-4 w-4" />,
  sp_statement:      <MessageSquare className="h-4 w-4" />,
}

// ── Sortable field item (left panel) ─────────────────────────────────────────

interface SortableFieldItemProps {
  field: SinglePageField
  index: number
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
  onDuplicate: () => void
}

function SortableFieldItem({
  field,
  index,
  isSelected,
  onClick,
  onDelete,
  onDuplicate,
}: SortableFieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `field-${index}`,
  })
  const { theme } = useTheme()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const def = SINGLE_PAGE_FIELD_DEFINITIONS.find(d => d.type === field.field_type)

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
        isSelected
          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30 shadow-lg'
          : theme === 'light'
          ? 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
          : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
      } ${isDragging ? 'rotate-2 scale-105' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className={`cursor-grab active:cursor-grabbing p-1 transition-colors flex-shrink-0 ${
              theme === 'light' ? 'text-gray-300 hover:text-gray-500' : 'text-white/40 hover:text-white/70'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
          <div className={`flex-shrink-0 ${isSelected ? 'text-blue-400' : theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>
            {FIELD_ICONS[field.field_type]}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-medium text-xs truncate ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
              {field.label || def?.label || field.field_type}
            </p>
            <p className={`text-xs truncate mt-0.5 ${theme === 'light' ? 'text-gray-400' : 'text-white/50'}`}>
              {def?.label}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0 ml-1">
          <button
            onClick={e => { e.stopPropagation(); onDuplicate() }}
            className={`p-1 rounded-lg transition-all duration-200 hover:scale-110 ${
              theme === 'light'
                ? 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                : 'text-white/40 hover:text-blue-300 hover:bg-blue-500/20'
            }`}
            title="Duplicate field"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className={`p-1 rounded-lg transition-all duration-200 hover:scale-110 ${
              theme === 'light'
                ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                : 'text-white/40 hover:text-red-300 hover:bg-red-500/20'
            }`}
            title="Delete field"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Field editor panel (right side) ──────────────────────────────────────────

interface FieldEditorProps {
  field: SinglePageField
  onChange: (updated: SinglePageField) => void
}

function FieldEditor({ field, onChange }: FieldEditorProps) {
  const { theme } = useTheme()

  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm transition-all duration-200 ${
    theme === 'light'
      ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
      : 'bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
  }`
  const labelCls = `block text-xs font-medium mb-1 ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`
  const sectionCls = `space-y-4 p-4 rounded-xl border ${
    theme === 'light' ? 'bg-gray-50/80 border-gray-200' : 'bg-white/5 border-white/10'
  }`

  const updateOption = (optIdx: number, updated: SinglePageFieldOption) => {
    const newOpts = field.options.map((o, i) => (i === optIdx ? updated : o))
    onChange({ ...field, options: newOpts })
  }
  const addOption = () => {
    onChange({
      ...field,
      options: [...field.options, { id: crypto.randomUUID(), label: `Option ${field.options.length + 1}` }],
    })
  }
  const removeOption = (optIdx: number) => {
    onChange({ ...field, options: field.options.filter((_, i) => i !== optIdx) })
  }

  return (
    <div className="space-y-5">
      {/* Question label */}
      <div className={sectionCls}>
        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>
          Field Settings
        </h4>

        <div>
          <label className={labelCls}>Question / Label *</label>
          <input
            className={inputCls}
            value={field.label}
            onChange={e => onChange({ ...field, label: e.target.value })}
            placeholder="Enter your question"
          />
        </div>

        <div>
          <label className={labelCls}>Description (optional)</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            value={field.description || ''}
            onChange={e => onChange({ ...field, description: e.target.value })}
            placeholder="Add a hint or description"
          />
        </div>

        {/* Placeholder — only for text-like fields */}
        {['sp_short_text', 'sp_long_text', 'sp_email', 'sp_phone', 'sp_website', 'sp_number'].includes(field.field_type) && (
          <div>
            <label className={labelCls}>Placeholder text</label>
            <input
              className={inputCls}
              value={field.placeholder || ''}
              onChange={e => onChange({ ...field, placeholder: e.target.value })}
              placeholder="Placeholder shown inside the field"
            />
          </div>
        )}

        {/* Required toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
              field.is_required
                ? 'bg-blue-500'
                : theme === 'light' ? 'bg-gray-300' : 'bg-white/20'
            }`}
            onClick={() => onChange({ ...field, is_required: !field.is_required })}
          >
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
              field.is_required ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </div>
          <span className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-white/80'}`}>Required</span>
        </label>
      </div>

      {/* Choice options */}
      {needsOptions(field.field_type) && (
        <div className={sectionCls}>
          <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>
            Options
          </h4>
          <div className="space-y-2">
            {field.options.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input
                  className={inputCls}
                  value={opt.label}
                  onChange={e => updateOption(idx, { ...opt, label: e.target.value })}
                  placeholder={`Option ${idx + 1}`}
                />
                <button
                  onClick={() => removeOption(idx)}
                  className={`p-2 rounded-xl flex-shrink-0 transition-all duration-200 hover:scale-110 ${
                    theme === 'light'
                      ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      : 'text-white/40 hover:text-red-300 hover:bg-red-500/20'
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={addOption}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 w-full ${
                theme === 'light'
                  ? 'text-blue-600 hover:bg-blue-50 border border-dashed border-blue-300'
                  : 'text-blue-400 hover:bg-blue-500/10 border border-dashed border-blue-500/40'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              Add option
            </button>
          </div>

          {field.field_type === 'sp_multiple_choice' && (
            <label className="flex items-center gap-3 cursor-pointer mt-3">
              <div
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                  field.allow_multiple ? 'bg-blue-500' : theme === 'light' ? 'bg-gray-300' : 'bg-white/20'
                }`}
                onClick={() => onChange({ ...field, allow_multiple: !field.allow_multiple })}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  field.allow_multiple ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
              <span className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-white/80'}`}>Allow multiple selections</span>
            </label>
          )}
        </div>
      )}

      {/* Yes/No — no config needed */}

      {/* Rating / Scale */}
      {['sp_rating', 'sp_opinion_scale', 'sp_nps'].includes(field.field_type) && (
        <div className={sectionCls}>
          <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>
            Scale Settings
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {field.field_type !== 'sp_nps' && (
              <div>
                <label className={labelCls}>Min value</label>
                <input
                  type="number"
                  className={inputCls}
                  value={field.scale_min ?? 1}
                  onChange={e => onChange({ ...field, scale_min: Number(e.target.value) })}
                />
              </div>
            )}
            <div>
              <label className={labelCls}>Max value</label>
              <input
                type="number"
                className={inputCls}
                value={field.scale_max ?? (field.field_type === 'sp_rating' ? 5 : 10)}
                onChange={e => onChange({ ...field, scale_max: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className={labelCls}>Min label (optional)</label>
              <input
                className={inputCls}
                value={field.scale_min_label || ''}
                onChange={e => onChange({ ...field, scale_min_label: e.target.value })}
                placeholder="e.g. Not likely"
              />
            </div>
            <div>
              <label className={labelCls}>Max label (optional)</label>
              <input
                className={inputCls}
                value={field.scale_max_label || ''}
                onChange={e => onChange({ ...field, scale_max_label: e.target.value })}
                placeholder="e.g. Very likely"
              />
            </div>
          </div>
        </div>
      )}

      {/* Number min/max */}
      {field.field_type === 'sp_number' && (
        <div className={sectionCls}>
          <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>
            Number Constraints
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Min value</label>
              <input
                type="number"
                className={inputCls}
                value={field.number_min ?? ''}
                onChange={e => onChange({ ...field, number_min: e.target.value === '' ? undefined : Number(e.target.value) })}
                placeholder="No limit"
              />
            </div>
            <div>
              <label className={labelCls}>Max value</label>
              <input
                type="number"
                className={inputCls}
                value={field.number_max ?? ''}
                onChange={e => onChange({ ...field, number_max: e.target.value === '' ? undefined : Number(e.target.value) })}
                placeholder="No limit"
              />
            </div>
          </div>
        </div>
      )}

      {/* File upload */}
      {field.field_type === 'sp_file_upload' && (
        <div className={sectionCls}>
          <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>
            File Upload Settings
          </h4>
          <div>
            <label className={labelCls}>Max file size (MB)</label>
            <input
              type="number"
              className={inputCls}
              value={field.max_file_size ?? 10}
              onChange={e => onChange({ ...field, max_file_size: Number(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main builder ──────────────────────────────────────────────────────────────

export default function SinglePageFormBuilder() {
  const { user } = useAuth()
  const { push } = useToast()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { id: formId } = useParams()

  // Form metadata
  const [name, setName] = useState('New Contact Form')
  const [internalName, setInternalName] = useState('')
  const [description, setDescription] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [clientId, setClientId] = useState<string | null>(null)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])

  // Fields
  const [fields, setFields] = useState<SinglePageField[]>([])
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null)

  // UI
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showAddFieldPanel, setShowAddFieldPanel] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [fieldPanelCollapsed, setFieldPanelCollapsed] = useState(false)

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (user) {
      fetchClients()
      if (formId) loadExistingForm()
    }
  }, [user, formId])

  const fetchClients = async () => {
    if (!user) return
    const { data, error } = await supabase.from('clients').select('id,name').eq('user_id', user.id)
    if (error) { push({ type: 'error', message: 'Error loading clients' }); return }
    setClients(data || [])
    if (data && data.length > 0) setClientId(data[0].id)
  }

  const loadExistingForm = async () => {
    if (!formId || !user) return
    setLoading(true)
    try {
      const { data: formData, error: formError } = await supabase
        .from('forms').select('*').eq('id', formId).eq('user_id', user.id).single()
      if (formError) throw formError

      const { data: stepsData, error: stepsError } = await supabase
        .from('form_steps')
        .select('*, form_options(id, label, image_url, option_order, jump_to_step)')
        .eq('form_id', formId)
        .order('step_order')
      if (stepsError) throw stepsError

      setName(formData.name)
      setInternalName(formData.internal_name || '')
      setDescription(formData.description || '')
      setWelcomeMessage(formData.welcome_message || '')
      setClientId(formData.client_id)
      setIsEditing(true)

      // Map form_steps to SinglePageField[]
      const converted: SinglePageField[] = (stepsData || []).map((step: any) => ({
        id: step.id,
        field_type: step.question_type as SinglePageFieldType,
        label: step.title,
        description: step.description || '',
        placeholder: step.placeholder || '',
        is_required: step.is_required ?? false,
        field_order: step.step_order,
        options: (step.form_options || [])
          .sort((a: any, b: any) => (a.option_order || 0) - (b.option_order || 0))
          .map((o: any) => ({ id: o.id, label: o.label, image_url: o.image_url })),
        allow_multiple: step.allow_multiple ?? false,
        scale_min: step.scale_min,
        scale_max: step.scale_max,
        scale_min_label: step.scale_min_label || '',
        scale_max_label: step.scale_max_label || '',
        number_min: step.number_min,
        number_max: step.number_max,
        max_file_size: step.max_file_size,
        allowed_file_types: step.allowed_file_types,
        images_per_row: step.images_per_row,
      }))
      setFields(converted)
      if (converted.length > 0) setSelectedFieldIndex(0)
    } catch (err) {
      console.error('Error loading form:', err)
      push({ type: 'error', message: 'Error loading form' })
      navigate('/forms')
    } finally {
      setLoading(false)
    }
  }

  const addField = (type: SinglePageFieldType) => {
    const newField = emptyField(type, fields.length + 1)
    const newFields = [...fields, newField]
    setFields(newFields)
    setSelectedFieldIndex(newFields.length - 1)
    setShowAddFieldPanel(false)
  }

  const updateField = useCallback((index: number, updated: SinglePageField) => {
    setFields(prev => prev.map((f, i) => (i === index ? updated : f)))
  }, [])

  const deleteField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, field_order: i + 1 }))
    setFields(newFields)
    if (selectedFieldIndex === index) {
      setSelectedFieldIndex(newFields.length > 0 ? Math.min(index, newFields.length - 1) : null)
    } else if (selectedFieldIndex !== null && selectedFieldIndex > index) {
      setSelectedFieldIndex(selectedFieldIndex - 1)
    }
  }

  const duplicateField = (index: number) => {
    const original = fields[index]
    const copy: SinglePageField = {
      ...original,
      id: undefined,
      label: `${original.label} (Copy)`,
      field_order: index + 2,
      options: original.options.map(o => ({ ...o, id: crypto.randomUUID() })),
    }
    const newFields = [
      ...fields.slice(0, index + 1),
      copy,
      ...fields.slice(index + 1),
    ].map((f, i) => ({ ...f, field_order: i + 1 }))
    setFields(newFields)
    setSelectedFieldIndex(index + 1)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = parseInt(active.id.toString().replace('field-', ''))
    const to = parseInt(over.id.toString().replace('field-', ''))
    const reordered = arrayMove(fields, from, to).map((f, i) => ({ ...f, field_order: i + 1 }))
    setFields(reordered)
    if (selectedFieldIndex === from) setSelectedFieldIndex(to)
  }

  const save = async () => {
    if (!user) return push({ type: 'error', message: 'You must be signed in' })
    if (!name.trim()) return push({ type: 'error', message: 'Please provide a form name' })
    if (!clientId) return push({ type: 'error', message: 'Please select a client' })
    setSaving(true)

    try {
      let finalFormId = formId

      if (isEditing && formId) {
        const { error } = await supabase.from('forms').update({
          name,
          internal_name: internalName,
          description,
          client_id: clientId,
          welcome_message: welcomeMessage,
          form_type: 'single_page',
        }).eq('id', formId).eq('user_id', user.id)
        if (error) throw error

        // Delete existing steps
        await supabase.from('form_steps').delete().eq('form_id', formId)
      } else {
        const { data, error } = await supabase.from('forms').insert([{
          name,
          internal_name: internalName,
          description,
          client_id: clientId,
          user_id: user.id,
          welcome_message: welcomeMessage,
          form_type: 'single_page',
          form_theme: 'generic',
          primary_button_color: '#3B82F6',
          primary_button_text_color: '#FFFFFF',
          secondary_button_color: '#E5E7EB',
          secondary_button_text_color: '#374151',
        }]).select().single()
        if (error) throw error
        finalFormId = data.id
      }

      // Insert fields as form_steps
      for (const field of fields) {
        const { data: stepData, error: stepErr } = await supabase.from('form_steps').insert([{
          form_id: finalFormId,
          title: field.label,
          description: field.description || null,
          question_type: field.field_type,
          is_required: field.is_required,
          step_order: field.field_order,
          scale_min: field.scale_min ?? null,
          scale_max: field.scale_max ?? null,
          scale_min_label: (field as any).scale_min_label || null,
          scale_max_label: (field as any).scale_max_label || null,
          allow_multiple: (field as any).allow_multiple ?? false,
          number_min: field.number_min ?? null,
          number_max: field.number_max ?? null,
          max_file_size: field.max_file_size ?? null,
          allowed_file_types: field.allowed_file_types ?? null,
          images_per_row: field.images_per_row ?? null,
          placeholder: field.placeholder || null,
        }]).select().single()
        if (stepErr) throw stepErr

        if (field.options.length > 0) {
          const { error: optErr } = await supabase.from('form_options').insert(
            field.options.map((opt, oi) => ({
              step_id: stepData.id,
              label: opt.label,
              image_url: opt.image_url || null,
              option_order: oi + 1,
            }))
          )
          if (optErr) throw optErr
        }
      }

      push({ type: 'success', message: isEditing ? 'Form updated!' : 'Form created!' })
      if (!isEditing && finalFormId) {
        navigate(`/forms/edit-single/${finalFormId}`)
      } else {
        loadExistingForm()
      }
    } catch (err) {
      console.error('Error saving form:', err)
      push({ type: 'error', message: 'Error saving form' })
    } finally {
      setSaving(false)
    }
  }

  const selectedField = selectedFieldIndex !== null ? fields[selectedFieldIndex] : null

  // ── Colour helpers ──
  const bg = theme === 'light' ? 'bg-gray-50' : 'bg-[#111111]'
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white'
  const textSecondary = theme === 'light' ? 'text-gray-500' : 'text-white/60'
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm transition-all duration-200 ${
    theme === 'light'
      ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
      : 'bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
  }`
  const labelCls = `block text-xs font-medium mb-1 ${textSecondary}`

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${theme === 'light' ? 'border-gray-600' : 'border-white'}`}></div>
          </div>
          <p className={textSecondary}>Loading form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col ${bg}`}>
      {/* ── Top bar ── */}
      <div className={`flex items-center justify-between px-6 py-3 border-b flex-shrink-0 ${
        theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#1a1a2e] border-white/10'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/forms')}
            className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
              theme === 'light' ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-white/70'
            }`}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className={`text-base font-bold bg-transparent border-none outline-none ${textPrimary} w-64`}
                placeholder="Form name"
              />
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-blue-500/20 text-blue-400`}>
                Single-Page
              </span>
            </div>
            <p className={`text-xs ${textSecondary}`}>{isEditing ? 'Editing form' : 'New form'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 border ${
              showSettings
                ? 'bg-blue-500/20 border-blue-400/40 text-blue-400'
                : theme === 'light'
                ? 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/15'
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>

          {formId && (
            <button
              onClick={() => window.open(`/form/${formId}`, '_blank')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 border ${
                theme === 'light'
                  ? 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                  : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/15'
              }`}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Settings panel ── */}
      {showSettings && (
        <div className={`px-6 py-4 border-b space-y-4 ${
          theme === 'light' ? 'bg-blue-50/50 border-gray-200' : 'bg-blue-500/5 border-white/10'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Internal Name</label>
              <input className={inputCls} value={internalName} onChange={e => setInternalName(e.target.value)} placeholder="Internal reference name" />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <input className={inputCls} value={description} onChange={e => setDescription(e.target.value)} placeholder="Form description" />
            </div>
            <div>
              <label className={labelCls}>Client *</label>
              <select
                className={inputCls}
                value={clientId || ''}
                onChange={e => setClientId(e.target.value)}
              >
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Submit button / success message</label>
            <input className={inputCls} value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} placeholder="e.g. Thank you! We'll be in touch soon." />
          </div>
        </div>
      )}

      {/* ── Main workspace ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left panel: field list ── */}
        <div className={`w-72 flex-shrink-0 flex flex-col border-r overflow-hidden ${
          theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#1a1a2e] border-white/10'
        }`}>
          {/* Panel header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${
            theme === 'light' ? 'border-gray-100' : 'border-white/10'
          }`}>
            <span className={`text-sm font-semibold ${textPrimary}`}>
              Fields <span className={`font-normal text-xs ${textSecondary}`}>({fields.length})</span>
            </span>
            <button
              onClick={() => setFieldPanelCollapsed(c => !c)}
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'light' ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              {fieldPanelCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>

          {!fieldPanelCollapsed && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {fields.length === 0 && (
                <div className="text-center py-8">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                    theme === 'light' ? 'bg-gray-100' : 'bg-white/10'
                  }`}>
                    <FileText className={`h-6 w-6 ${textSecondary}`} />
                  </div>
                  <p className={`text-sm ${textSecondary}`}>No fields yet</p>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Click "Add Field" to start</p>
                </div>
              )}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fields.map((_, i) => `field-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {fields.map((field, idx) => (
                    <SortableFieldItem
                      key={`field-${idx}-${field.field_type}`}
                      field={field}
                      index={idx}
                      isSelected={selectedFieldIndex === idx}
                      onClick={() => setSelectedFieldIndex(idx)}
                      onDelete={() => deleteField(idx)}
                      onDuplicate={() => duplicateField(idx)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Add field button */}
          <div className={`p-3 border-t ${theme === 'light' ? 'border-gray-100' : 'border-white/10'}`}>
            <button
              onClick={() => setShowAddFieldPanel(p => !p)}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] ${
                showAddFieldPanel
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25'
              }`}
            >
              <Plus className="h-4 w-4" />
              Add Field
            </button>
          </div>
        </div>

        {/* ── Centre panel: field editor or empty state ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedField === null ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                theme === 'light' ? 'bg-blue-50 border border-blue-100' : 'bg-blue-500/10 border border-blue-500/20'
              }`}>
                <AlignLeft className="h-9 w-9 text-blue-400" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${textPrimary}`}>Build your form</h3>
              <p className={`text-sm max-w-sm mb-6 ${textSecondary}`}>
                Add fields from the left panel. All fields will appear on one page for your respondents.
              </p>
              <button
                onClick={() => setShowAddFieldPanel(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25"
              >
                <Plus className="h-4 w-4" />
                Add your first field
              </button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {FIELD_ICONS[selectedField.field_type]}
                </div>
                <div>
                  <h2 className={`font-bold text-base ${textPrimary}`}>
                    {SINGLE_PAGE_FIELD_DEFINITIONS.find(d => d.type === selectedField.field_type)?.label}
                  </h2>
                  <p className={`text-xs ${textSecondary}`}>Field {(selectedFieldIndex ?? 0) + 1} of {fields.length}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => duplicateField(selectedFieldIndex!)}
                    className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                      theme === 'light'
                        ? 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                        : 'text-white/40 hover:text-blue-300 hover:bg-blue-500/20'
                    }`}
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteField(selectedFieldIndex!)}
                    className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                      theme === 'light'
                        ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                        : 'text-white/40 hover:text-red-300 hover:bg-red-500/20'
                    }`}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <FieldEditor
                key={selectedFieldIndex}
                field={selectedField}
                onChange={updated => updateField(selectedFieldIndex!, updated)}
              />
            </div>
          )}
        </div>

        {/* ── Right panel: Add Field picker (slides in) ── */}
        {showAddFieldPanel && (
          <div className={`w-80 flex-shrink-0 flex flex-col border-l overflow-hidden ${
            theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#1a1a2e] border-white/10'
          }`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${
              theme === 'light' ? 'border-gray-100' : 'border-white/10'
            }`}>
              <span className={`text-sm font-semibold ${textPrimary}`}>Add Field</span>
              <button
                onClick={() => setShowAddFieldPanel(false)}
                className={`p-1.5 rounded-lg transition-all ${
                  theme === 'light' ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {FIELD_CATEGORIES.map(cat => {
                const catFields = fieldsByCategory[cat]
                if (!catFields || catFields.length === 0) return null
                return (
                  <div key={cat} className="mb-5">
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 px-1 ${textSecondary}`}>{cat}</p>
                    <div className="space-y-1">
                      {catFields.map(def => (
                        <button
                          key={def.type}
                          onClick={() => addField(def.type)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 hover:scale-[1.01] ${
                            theme === 'light'
                              ? 'hover:bg-blue-50 text-gray-700 hover:text-blue-700'
                              : 'hover:bg-blue-500/10 text-white/80 hover:text-blue-300'
                          }`}
                        >
                          <span className={`${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>
                            {FIELD_ICONS[def.type]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{def.label}</div>
                            <div className={`text-xs truncate ${textSecondary}`}>{def.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
