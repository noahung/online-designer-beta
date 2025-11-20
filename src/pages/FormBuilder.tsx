import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import FormPreview from '../components/FormPreview'
import SingleStepPreview from '../components/SingleStepPreview'
import SaveTemplateModal from '../components/templates/SaveTemplateModal'
import LoadTemplateModal from '../components/templates/LoadTemplateModal'
import { formThemes } from '../lib/formThemes'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  Image, 
  FileText, 
  MessageSquare,
  Upload,
  X,
  Paperclip,
  User,
  GripVertical,
  Ruler,
  Star,
  ChevronDown,
  ChevronUp,
  Palette,
  Frame,
  Copy,
  Undo,
  Redo,
  BookmarkPlus,
  FolderOpen,
  Settings
} from 'lucide-react'
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable'
import { 
  useSortable 
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Option = { 
  id?: string
  label: string
  description?: string
  imageFile?: File | null
  image_url?: string
  jump_to_step?: number 
}

type Step = { 
  id?: string
  title: string
  description?: string
  question_type: 'image_selection' | 'multiple_choice' | 'text_input' | 'contact_fields' | 'file_upload' | 'dimensions' | 'opinion_scale' | 'frames_plan'
  is_required?: boolean
  step_order: number
  options: Option[]
  max_file_size?: number // in MB
  allowed_file_types?: string[] // array of mime types
  dimension_type?: '2d' | '3d' // for dimensions step
  dimension_units?: string // units for dimensions (mm, cm, m, in, ft)
  scale_type?: 'number' | 'star' // for opinion scale step
  scale_min?: number // minimum scale value (default 1)
  scale_max?: number // maximum scale value (default 10 for number, 5 for star)
  images_per_row?: number // for image_selection step layout (default 2)
  crop_images_to_square?: boolean // whether to crop images to square aspect ratio (default true)
  // Frames plan specific fields
  frames_max_count?: number // maximum number of frames allowed (default 10)
  frames_require_image?: boolean // whether image upload is required for each frame
  frames_require_location?: boolean // whether location text is required for each frame  
  frames_require_measurements?: boolean // whether measurements are required for each frame
}

interface StepTypeOption {
  type: Step['question_type']
  title: string
  description: string
  icon: React.ReactNode
}

const stepTypes: StepTypeOption[] = [
  {
    type: 'image_selection',
    title: 'Card Selection',
    description: 'Choose from image cards with descriptions',
    icon: <Image className="h-4 w-4" />
  },
  {
    type: 'multiple_choice',
    title: 'Multiple Choice',
    description: 'Select from text-based options',
    icon: <FileText className="h-4 w-4" />
  },
  {
    type: 'text_input',
    title: 'Text Input',
    description: 'Single line or paragraph text input',
    icon: <MessageSquare className="h-4 w-4" />
  },
  {
    type: 'file_upload',
    title: 'File Upload',
    description: 'Allow users to upload files',
    icon: <Paperclip className="h-4 w-4" />
  },
  {
    type: 'dimensions',
    title: 'Dimensions',
    description: 'Collect 2D or 3D measurements',
    icon: <Ruler className="h-4 w-4" />
  },
  {
    type: 'opinion_scale',
    title: 'Opinion Scale',
    description: 'Rate using numbers (1-10) or stars (1-5)',
    icon: <Star className="h-4 w-4" />
  },
  {
    type: 'contact_fields',
    title: 'Contact Information',
    description: 'Collect contact details from users',
    icon: <User className="h-4 w-4" />
  },
  {
    type: 'frames_plan',
    title: 'Frames Plan',
    description: 'Multiple frame upload with locations and measurements',
    icon: <Frame className="h-4 w-4" />
  }
]

// Sortable Step Item Component
interface SortableStepItemProps {
  step: Step
  index: number
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
  onDuplicate: () => void
  onPreview: () => void
  canDelete: boolean
}

function SortableStepItem({ step, index, isSelected, onClick, onDelete, onDuplicate, onPreview, canDelete }: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `step-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-step-index={index}
      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border backdrop-blur-sm ${
        isSelected
          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30 shadow-lg shadow-blue-500/25'
          : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
      } ${isDragging ? 'rotate-2 scale-105' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-white/50 hover:text-white/80 transition-colors"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1" onClick={onClick}>
            <p className="font-medium text-sm text-white">
              {step.title || `Step ${index + 1}`}
            </p>
            <p className="text-xs text-white/60 capitalize mt-1">
              {step.question_type.replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-lg">{index + 1}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPreview()
            }}
            className="p-1 text-white/40 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-all duration-200 hover:scale-110"
            title="Preview this step"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate()
            }}
            className="p-1 text-white/40 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-200 hover:scale-110"
            title="Duplicate step"
          >
            <Copy className="h-4 w-4" />
          </button>
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-1 text-white/40 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200 hover:scale-110"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Sortable Image Selection Option Item Component
interface SortableImageOptionItemProps {
  option: Option
  stepIndex: number
  optionIndex: number
  onUpdate: (stepIndex: number, optionIndex: number, updatedOption: Option) => void
  onDelete: (stepIndex: number, optionIndex: number) => void
  onFileChange: (stepIndex: number, optionIndex: number, file: File | null) => void
  cropImagesToSquare?: boolean
}

function SortableImageOptionItem({ 
  option, 
  stepIndex, 
  optionIndex, 
  onUpdate, 
  onDelete, 
  onFileChange,
  cropImagesToSquare = true
}: SortableImageOptionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `step-${stepIndex}-option-${optionIndex}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Drag and drop state for image uploads
  const [isDraggingOver, setIsDraggingOver] = React.useState(false)

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(true)
  }

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
  }

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      onFileChange(stepIndex, optionIndex, imageFile)
    }
  }

  const handleFileInputChange = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0] || null
      onFileChange(stepIndex, optionIndex, file)
    }
    input.click()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200 hover:scale-105 hover:shadow-xl flex flex-col ${isDragging ? 'rotate-2 scale-105' : ''}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 bg-black/20 hover:bg-black/40 text-white/60 hover:text-white rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
        title="Drag to reorder"
      >
        <GripVertical className="h-3 w-3" />
      </div>

      {/* Image Upload Area */}
      <div className={`p-4 flex-grow flex ${cropImagesToSquare ? 'aspect-square' : 'items-start'}`}>
        {option.image_url ? (
          <div 
            className={`relative ${cropImagesToSquare ? 'h-full w-full' : 'w-full'} group/image`}
            onDragOver={handleImageDragOver}
            onDragLeave={handleImageDragLeave}
            onDrop={handleImageDrop}
          >
            <img
              src={option.image_url}
              alt="Option preview"
              className={`rounded-lg border border-white/20 shadow-lg ${
                cropImagesToSquare 
                  ? 'h-full w-full object-cover' 
                  : 'w-full object-contain'
              } ${isDraggingOver ? 'opacity-50' : ''}`}
            />
            {isDraggingOver && (
              <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                  <p className="text-sm text-blue-200 font-medium">Drop to replace image</p>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="flex space-x-2 opacity-0 group-hover/image:opacity-100 transition-opacity duration-200">
                <button
                  onClick={handleFileInputChange}
                  className="p-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-full transition-all duration-200 hover:scale-110 shadow-lg"
                  title="Replace image"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => onUpdate(stepIndex, optionIndex, { ...option, image_url: undefined, imageFile: null })}
                  className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-all duration-200 hover:scale-110 shadow-lg"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleFileInputChange}
            onDragOver={handleImageDragOver}
            onDragLeave={handleImageDragLeave}
            onDrop={handleImageDrop}
            className={`h-full w-full border-2 border-dashed rounded-lg transition-all duration-200 flex flex-col items-center justify-center space-y-2 group-hover:scale-105 ${
              isDraggingOver
                ? 'border-blue-400 bg-blue-500/20 scale-105'
                : 'border-white/30 hover:border-cyan-400/50 hover:bg-cyan-500/10'
            }`}
          >
            <Upload className={`h-8 w-8 transition-colors duration-200 ${
              isDraggingOver
                ? 'text-blue-300'
                : 'text-white/40 group-hover:text-cyan-300'
            }`} />
            <span className={`text-xs transition-colors duration-200 ${
              isDraggingOver
                ? 'text-blue-200 font-medium'
                : 'text-white/50 group-hover:text-cyan-200'
            }`}>
              {isDraggingOver ? 'Drop image here' : 'Upload or drag image'}
            </span>
          </button>
        )}
      </div>

      {/* Label and Description */}
      <div className="p-4 space-y-3 flex-shrink-0">
        <input
          type="text"
          value={option.label}
          onChange={(e) => onUpdate(stepIndex, optionIndex, { ...option, label: e.target.value })}
          placeholder="Option label"
          className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15 text-sm font-medium"
        />
        <textarea
          value={option.description || ''}
          onChange={(e) => onUpdate(stepIndex, optionIndex, { ...option, description: e.target.value })}
          placeholder="Description (optional)"
          rows={2}
          className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15 text-xs resize-none"
        />

        {/* Jump to step */}
        <div className="space-y-1">
          <input
            type="number"
            min={1}
            max={999}
            value={option.jump_to_step ?? ''}
            onChange={(e) => onUpdate(stepIndex, optionIndex, {
              ...option,
              jump_to_step: e.target.value ? Number(e.target.value) : undefined
            })}
            placeholder="Jump to step"
            className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15 text-xs"
          />
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(stepIndex, optionIndex)}
        className="absolute top-2 right-2 p-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-full transition-all duration-200 hover:scale-110 shadow-lg opacity-0 group-hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

// Sortable Multiple Choice Option Item Component
interface SortableMultipleChoiceOptionItemProps {
  option: Option
  stepIndex: number
  optionIndex: number
  onUpdate: (stepIndex: number, optionIndex: number, updatedOption: Option) => void
  onDelete: (stepIndex: number, optionIndex: number) => void
}

function SortableMultipleChoiceOptionItem({ 
  option, 
  stepIndex, 
  optionIndex, 
  onUpdate, 
  onDelete 
}: SortableMultipleChoiceOptionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `step-${stepIndex}-option-${optionIndex}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-200 ${isDragging ? 'rotate-1 scale-105' : ''}`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 text-white/50 hover:text-white/80 transition-colors"
              title="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-3">
              <input
                type="text"
                value={option.label}
                onChange={(e) => onUpdate(stepIndex, optionIndex, { ...option, label: e.target.value })}
                placeholder="Option label"
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15 font-medium"
              />
              <textarea
                value={option.description || ''}
                onChange={(e) => onUpdate(stepIndex, optionIndex, { ...option, description: e.target.value })}
                placeholder="Option description"
                rows={2}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15 text-sm resize-none"
              />
            </div>
          </div>
          <div className="ml-4 space-y-3">
            <button
              onClick={() => onDelete(stepIndex, optionIndex)}
              className="p-2 text-white/40 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <label className="block text-xs text-white/70">Jump to step (optional)</label>
          <input
            type="number"
            min={1}
            max={999}
            value={option.jump_to_step ?? ''}
            onChange={(e) => onUpdate(stepIndex, optionIndex, {
              ...option,
              jump_to_step: e.target.value ? Number(e.target.value) : undefined
            })}
            placeholder="Step number"
            className="w-24 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15 text-sm"
          />
        </div>
      </div>
    </div>
  )
}

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  isCollapsed: boolean
  onToggle: () => void
  animationDelay?: string
  children: React.ReactNode
}

function CollapsibleSection({ 
  title, 
  icon, 
  isCollapsed, 
  onToggle, 
  animationDelay = '0s', 
  children 
}: CollapsibleSectionProps) {
  const { theme } = useTheme()
  
  return (
    <div 
      className={`backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-200 ${
        theme === 'light' 
          ? 'bg-white/80 border border-gray-200 shadow-lg' 
          : 'bg-white/10 border border-white/20'
      }`}
      style={{animationDelay}}
    >
      <button
        onClick={onToggle}
        className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors duration-200 ${
          theme === 'light'
            ? 'hover:bg-gray-50 text-gray-800'
            : 'hover:bg-white/5 text-white'
        }`}
      >
        <h3 className={`text-lg font-semibold flex items-center ${
          theme === 'light' ? 'text-gray-800' : 'text-white'
        }`}>
          {icon}
          {title}
        </h3>
        <div className="flex items-center">
          {isCollapsed ? (
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${
              theme === 'light' ? 'text-gray-500' : 'text-white/60'
            }`} />
          ) : (
            <ChevronUp className={`w-5 h-5 transition-transform duration-200 ${
              theme === 'light' ? 'text-gray-500' : 'text-white/60'
            }`} />
          )}
        </div>
      </button>
      
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isCollapsed 
          ? 'max-h-0 opacity-0' 
          : 'max-h-[5000px] opacity-100'
      }`}>
        <div className="px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function FormBuilder() {
  const { user } = useAuth()
  const { push } = useToast()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { id: formId } = useParams() // Get form ID from URL params for editing
  const [name, setName] = useState('Window & Door Designer Tool')
  const [internalName, setInternalName] = useState('')
  const [description, setDescription] = useState('Interactive form to help customers design their perfect windows and doors')
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome to our design tool! Let\'s create the perfect windows and doors for your home.')
  const [clientId, setClientId] = useState<string | null>(null)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  // Theme selection
  const [formTheme, setFormTheme] = useState<'generic' | 'soft-ui'>('generic')
  // Color customization states
  const [primaryButtonColor, setPrimaryButtonColor] = useState('#3B82F6')
  const [primaryButtonTextColor, setPrimaryButtonTextColor] = useState('#FFFFFF')
  const [secondaryButtonColor, setSecondaryButtonColor] = useState('#E5E7EB')
  const [secondaryButtonTextColor, setSecondaryButtonTextColor] = useState('#374151')
  const [steps, setSteps] = useState<Step[]>([])
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showSingleStepPreview, setShowSingleStepPreview] = useState(false)
  const [previewStepIndex, setPreviewStepIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showStepTypeDropdown, setShowStepTypeDropdown] = useState(false)

  // Template modal states
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [showLoadTemplateModal, setShowLoadTemplateModal] = useState(false)
  const [showLayoutSettingsModal, setShowLayoutSettingsModal] = useState(false)

  // Settings modal states
  const [showFormSettingsModal, setShowFormSettingsModal] = useState(false)
  const [showFormThemeModal, setShowFormThemeModal] = useState(false)
  const [showButtonColoursModal, setShowButtonColoursModal] = useState(false)

  // Undo/Redo state
  const [history, setHistory] = useState<{ past: any[]; present: any; future: any[] }>({
    past: [],
    present: null,
    future: []
  })
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState({
    formSteps: false,    // Keep expanded for easy access to add steps
  })

  const toggleSection = (sectionKey: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const activeIndex = parseInt(active.id.toString().replace('step-', ''))
      const overIndex = parseInt(over.id.toString().replace('step-', ''))

      if (activeIndex !== overIndex) {
        const newSteps = arrayMove(steps, activeIndex, overIndex)
        // Update step orders
        const updatedSteps = newSteps.map((step, index) => ({
          ...step,
          step_order: index + 1
        }))
        setSteps(updatedSteps)
        
        // Update selected index if needed
        if (selectedStepIndex === activeIndex) {
          setSelectedStepIndex(overIndex)
        } else if (selectedStepIndex === overIndex) {
          setSelectedStepIndex(activeIndex)
        }
        
        saveToHistory()
      }
    }
  }

  // Handle option drag end
  const handleOptionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const activeId = active.id.toString()
      const overId = over.id.toString()
      
      // Extract step index and option index from IDs like "step-0-option-1"
      const activeMatch = activeId.match(/step-(\d+)-option-(\d+)/)
      const overMatch = overId.match(/step-(\d+)-option-(\d+)/)
      
      if (activeMatch && overMatch) {
        const stepIndex = parseInt(activeMatch[1])
        const activeOptionIndex = parseInt(activeMatch[2])
        const overOptionIndex = parseInt(overMatch[2])
        
        if (activeOptionIndex !== overOptionIndex) {
          const step = steps[stepIndex]
          const newOptions = arrayMove(step.options, activeOptionIndex, overOptionIndex)
          updateStep(stepIndex, { ...step, options: newOptions })
        }
      }
    }
  }

  useEffect(() => { 
    if (user) {
      fetchClients()
      if (formId) {
        loadExistingForm()
      } else {
        // For new forms, set initial load to false after a short delay to allow state to settle
        setTimeout(() => setIsInitialLoad(false), 100)
      }
    }
  }, [user, formId])

  // Initialize history present state after initial load
  useEffect(() => {
    if (!isInitialLoad && history.present === null) {
      setHistory(prev => ({
        ...prev,
        present: {
          steps,
          selectedStepIndex,
          name,
          internalName,
          description,
          welcomeMessage,
          clientId,
          formTheme,
          primaryButtonColor,
          primaryButtonTextColor,
          secondaryButtonColor,
          secondaryButtonTextColor
        }
      }))
    }
  }, [isInitialLoad, steps, selectedStepIndex, name, internalName, description, welcomeMessage, clientId, formTheme, primaryButtonColor, primaryButtonTextColor, secondaryButtonColor, secondaryButtonTextColor, history.present])

  const fetchClients = async () => {
    if (!user) return
    const { data, error } = await supabase.from('clients').select('id,name').eq('user_id', user.id)
    if (error) {
      console.error(error)
      push({ type: 'error', message: 'Error loading clients' })
      return
    }
    setClients(data || [])
    if ((data || []).length > 0) setClientId((data || [])[0].id)
  }

  const loadExistingForm = async () => {
    if (!formId || !user) return
    
    setLoading(true)
    try {
      // Load form data
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('user_id', user.id)
        .single()

      if (formError) throw formError

      // Load form steps
      const { data: stepsData, error: stepsError } = await supabase
        .from('form_steps')
        .select(`
          *,
          form_options (
            id,
            label,
            image_url,
            option_order,
            jump_to_step
          )
        `)
        .eq('form_id', formId)
        .order('step_order')

      if (stepsError) throw stepsError

      // Set form data
  setName(formData.name)
  setInternalName(formData.internal_name || '')
  setDescription(formData.description)
  setWelcomeMessage(formData.welcome_message || '')
  setClientId(formData.client_id)
  setFormTheme(formData.form_theme || 'generic')
  setPrimaryButtonColor(formData.primary_button_color || '#3B82F6')
  setPrimaryButtonTextColor(formData.primary_button_text_color || '#FFFFFF')
  setSecondaryButtonColor(formData.secondary_button_color || '#E5E7EB')
  setSecondaryButtonTextColor(formData.secondary_button_text_color || '#374151')
  setIsEditing(true)

      // Convert database steps to component format
      const convertedSteps: Step[] = (stepsData || []).map(step => ({
        id: step.id,
        title: step.title,
        description: step.description || undefined,
        question_type: step.question_type as Step['question_type'],
        step_order: step.step_order,
        is_required: step.is_required,
        max_file_size: step.max_file_size,
        allowed_file_types: step.allowed_file_types,
        dimension_type: step.dimension_type,
        dimension_units: step.dimension_units,
        scale_type: step.scale_type,
        scale_min: step.scale_min,
        scale_max: step.scale_max,
        images_per_row: step.images_per_row,
        crop_images_to_square: step.crop_images_to_square ?? true,
        frames_max_count: step.frames_max_count,
        frames_require_image: step.frames_require_image,
        frames_require_location: step.frames_require_location,
        frames_require_measurements: step.frames_require_measurements,
        options: (step.form_options || [])
          .sort((a: any, b: any) => (a.option_order || 0) - (b.option_order || 0))
          .map((option: any) => ({
          id: option.id,
          label: option.label,
          description: '',
          image_url: option.image_url,
          jump_to_step: option.jump_to_step
        }))
      }))

      setSteps(convertedSteps)
      push({ type: 'success', message: 'Form loaded successfully' })
      setIsInitialLoad(false)
    } catch (error) {
      console.error('Error loading form:', error)
      push({ type: 'error', message: 'Error loading form for editing' })
      navigate('/forms')
    } finally {
      setLoading(false)
    }
  }

  const ensureBucketExists = async (bucketName: string) => {
    try {
      // Instead of listing all buckets (which might not be allowed), 
      // just try to access the specific bucket directly
      const { error: accessError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 })
        
      if (accessError) {
        console.error(`Error accessing bucket ${bucketName}:`, accessError)
        
        // If bucket doesn't exist, try to create it
        if (accessError.message.includes('not found') || accessError.message.includes('does not exist')) {
          console.log(`Attempting to create bucket: ${bucketName}`)
          const { error: createError } = await supabase.storage.createBucket(bucketName, { public: true })
          if (createError) {
            console.error(`Error creating bucket ${bucketName}:`, createError)
            push({ 
              type: 'error', 
              message: `Could not create storage bucket "${bucketName}": ${createError.message}`
            })
            return false
          }
          push({ type: 'success', message: `✅ Storage bucket "${bucketName}" created successfully` })
          return true
        } else {
          push({ 
            type: 'error', 
            message: `Cannot access storage bucket "${bucketName}": ${accessError.message}`
          })
          return false
        }
      }
      
      // Bucket exists and is accessible
      console.log(`Bucket ${bucketName} is accessible`)
      return true
      
    } catch (error) {
      console.error('Error checking bucket:', error)
      push({ 
        type: 'error', 
        message: `Storage error: ${error}. Make sure the "${bucketName}" bucket exists in Supabase Storage.`
      })
      return false
    }
  }

  const addStep = (type: Step['question_type']) => {
    const newStep: Step = {
      title: `New ${type.replace('_', ' ')} Step`,
      question_type: type,
      step_order: steps.length + 1,
      is_required: true,
      options: type === 'image_selection' || type === 'multiple_choice' ? [
        { label: 'Option 1', description: '' }
      ] : [],
      max_file_size: type === 'file_upload' ? 5 : undefined, // Default 5MB
      allowed_file_types: type === 'file_upload' ? ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] : undefined,
      dimension_type: type === 'dimensions' ? '2d' : undefined, // Default to 2D for dimensions
      scale_type: type === 'opinion_scale' ? 'number' : undefined, // Default to number scale
      scale_min: type === 'opinion_scale' ? 1 : undefined,
      scale_max: type === 'opinion_scale' ? 10 : undefined,
      images_per_row: type === 'image_selection' ? 2 : undefined, // Default 2 images per row
      crop_images_to_square: type === 'image_selection' ? true : undefined, // Default to crop images to square
      // Frames plan defaults
      frames_max_count: type === 'frames_plan' ? 10 : undefined,
      frames_require_image: type === 'frames_plan' ? true : undefined,
      frames_require_location: type === 'frames_plan' ? true : undefined,
      frames_require_measurements: type === 'frames_plan' ? true : undefined
    }
    const newSteps = [...steps, newStep]
    setSteps(newSteps)
    setSelectedStepIndex(newSteps.length - 1)
    saveToHistory()
    
    // Scroll to the newly added step after a short delay to ensure DOM is updated
    setTimeout(() => {
      const stepElement = document.querySelector(`[data-step-index="${newSteps.length - 1}"]`)
      if (stepElement) {
        stepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 100)
  }

  const updateStep = (index: number, updatedStep: Step) => {
    const newSteps = [...steps]
    newSteps[index] = updatedStep
    setSteps(newSteps)
    saveToHistory()
  }

  const deleteStep = (index: number) => {
    if (steps.length <= 1) return
    const newSteps = steps.filter((_, i) => i !== index)
    setSteps(newSteps.map((st, i) => ({ ...st, step_order: i + 1 })))
    if (selectedStepIndex === index) {
      setSelectedStepIndex(Math.max(0, Math.min(index, newSteps.length - 1)))
    }
    saveToHistory()
  }

  const duplicateStep = (index: number) => {
    const stepToDuplicate = steps[index]
    const duplicatedStep: Step = {
      ...stepToDuplicate,
      id: undefined, // Remove id so it's treated as new
      title: `${stepToDuplicate.title} (Copy)`,
      step_order: index + 2, // Insert after the current step
      options: stepToDuplicate.options.map(option => ({
        ...option,
        id: undefined // Remove option ids
      }))
    }
    const newSteps = [
      ...steps.slice(0, index + 1),
      duplicatedStep,
      ...steps.slice(index + 1)
    ].map((st, i) => ({ ...st, step_order: i + 1 }))
    setSteps(newSteps)
    setSelectedStepIndex(index + 1) // Select the duplicated step
    saveToHistory()
  }

  // Undo/Redo functions
  const saveToHistory = () => {
    if (isInitialLoad) return
    setHistory(prev => ({
      past: prev.present ? [...prev.past, prev.present] : prev.past,
      present: {
        steps,
        selectedStepIndex,
        name,
        internalName,
        description,
        welcomeMessage,
        clientId,
        formTheme,
        primaryButtonColor,
        primaryButtonTextColor,
        secondaryButtonColor,
        secondaryButtonTextColor
      },
      future: []
    }))
  }

  const undo = () => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev
      
      const previous = prev.past[prev.past.length - 1]
      if (!previous) return prev
      
      const newPast = prev.past.slice(0, -1)
      
      // Restore state
      setSteps(previous.steps || [])
      setSelectedStepIndex(previous.selectedStepIndex || null)
      setName(previous.name || '')
      setInternalName(previous.internalName || '')
      setDescription(previous.description || '')
      setWelcomeMessage(previous.welcomeMessage || '')
      setClientId(previous.clientId || null)
      setFormTheme(previous.formTheme || 'generic')
      setPrimaryButtonColor(previous.primaryButtonColor || '#3B82F6')
      setPrimaryButtonTextColor(previous.primaryButtonTextColor || '#FFFFFF')
      setSecondaryButtonColor(previous.secondaryButtonColor || '#E5E7EB')
      setSecondaryButtonTextColor(previous.secondaryButtonTextColor || '#374151')
      
      return {
        past: newPast,
        present: previous,
        future: prev.present ? [prev.present, ...prev.future] : prev.future
      }
    })
  }

  const redo = () => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev
      
      const next = prev.future[0]
      if (!next) return prev
      
      const newFuture = prev.future.slice(1)
      
      // Restore state
      setSteps(next.steps || [])
      setSelectedStepIndex(next.selectedStepIndex || null)
      setName(next.name || '')
      setInternalName(next.internalName || '')
      setDescription(next.description || '')
      setWelcomeMessage(next.welcomeMessage || '')
      setClientId(next.clientId || null)
      setFormTheme(next.formTheme || 'generic')
      setPrimaryButtonColor(next.primaryButtonColor || '#3B82F6')
      setPrimaryButtonTextColor(next.primaryButtonTextColor || '#FFFFFF')
      setSecondaryButtonColor(next.secondaryButtonColor || '#E5E7EB')
      setSecondaryButtonTextColor(next.secondaryButtonTextColor || '#374151')
      
      return {
        past: prev.present ? [...prev.past, prev.present] : prev.past,
        present: next,
        future: newFuture
      }
    })
  }

  const addOption = (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return
    const step = steps[stepIndex]
    const newOption: Option = {
      label: `Option ${step.options.length + 1}`,
      description: '',
      imageFile: null
    }
    const updatedStep = {
      ...step,
      options: [...step.options, newOption]
    }
    updateStep(stepIndex, updatedStep)
  }

  const updateOption = (stepIndex: number, optionIndex: number, updatedOption: Option) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return
    const step = steps[stepIndex]
    const newOptions = [...step.options]
    newOptions[optionIndex] = updatedOption
    updateStep(stepIndex, { ...step, options: newOptions })
  }

  const deleteOption = (stepIndex: number, optionIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return
    const step = steps[stepIndex]
    if (step.options.length <= 1) return
    const newOptions = step.options.filter((_, i) => i !== optionIndex)
    updateStep(stepIndex, { ...step, options: newOptions })
  }

  // Template functions
  const saveStepAsTemplate = async (name: string, description: string) => {
    if (!user || selectedStepIndex === null) {
      push({ type: 'error', message: 'Please select a step to save as template' })
      return
    }

    const step = steps[selectedStepIndex]
    if (!step) return

    try {
      // Insert the template
      const { data: templateData, error: templateError } = await supabase
        .from('step_templates')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          question_type: step.question_type,
          title: step.title,
          is_required: step.is_required ?? true,
          max_file_size: step.max_file_size,
          allowed_file_types: step.allowed_file_types,
          dimension_type: step.dimension_type,
          dimension_units: step.dimension_units,
          scale_type: step.scale_type,
          scale_min: step.scale_min,
          scale_max: step.scale_max,
          images_per_row: step.images_per_row,
          crop_images_to_square: step.crop_images_to_square,
          frames_max_count: step.frames_max_count,
          frames_require_image: step.frames_require_image,
          frames_require_location: step.frames_require_location,
          frames_require_measurements: step.frames_require_measurements
        })
        .select()
        .single()

      if (templateError) throw templateError

      // Insert template options if any
      if (step.options && step.options.length > 0) {
        const optionsToInsert = step.options.map((option, index) => ({
          template_id: templateData.id,
          label: option.label,
          description: option.description || null,
          image_url: option.image_url || null,
          jump_to_step: option.jump_to_step || null,
          option_order: index + 1
        }))

        const { error: optionsError } = await supabase
          .from('step_template_options')
          .insert(optionsToInsert)

        if (optionsError) throw optionsError
      }

      push({ type: 'success', message: `Template "${name}" saved successfully!` })
    } catch (error) {
      console.error('Error saving template:', error)
      push({ type: 'error', message: 'Failed to save template' })
      throw error
    }
  }

  const loadTemplateToStep = async (template: any) => {
    if (selectedStepIndex === null) {
      push({ type: 'error', message: 'Please select a step first' })
      return
    }

    try {
      const currentStep = steps[selectedStepIndex]
      
      // Create updated step with template data
      const updatedStep: Step = {
        ...currentStep,
        title: template.title,
        description: template.description || undefined,
        question_type: template.question_type,
        is_required: template.is_required ?? true,
        max_file_size: template.max_file_size,
        allowed_file_types: template.allowed_file_types,
        dimension_type: template.dimension_type,
        dimension_units: template.dimension_units,
        scale_type: template.scale_type,
        scale_min: template.scale_min,
        scale_max: template.scale_max,
        images_per_row: template.images_per_row,
        crop_images_to_square: template.crop_images_to_square ?? true,
        frames_max_count: template.frames_max_count,
        frames_require_image: template.frames_require_image,
        frames_require_location: template.frames_require_location,
        frames_require_measurements: template.frames_require_measurements,
        options: (template.options || []).map((opt: any) => ({
          label: opt.label,
          description: opt.description || '',
          image_url: opt.image_url || undefined,
          jump_to_step: opt.jump_to_step || undefined,
          imageFile: null
        }))
      }

      updateStep(selectedStepIndex, updatedStep)
      push({ type: 'success', message: `Template "${template.name}" applied successfully!` })
    } catch (error) {
      console.error('Error loading template:', error)
      push({ type: 'error', message: 'Failed to apply template' })
      throw error
    }
  }

  const createStepFromTemplate = async (template: any) => {
    try {
      const newStep: Step = {
        title: template.title,
        description: template.description || undefined,
        question_type: template.question_type,
        is_required: template.is_required ?? true,
        step_order: steps.length + 1,
        max_file_size: template.max_file_size,
        allowed_file_types: template.allowed_file_types,
        dimension_type: template.dimension_type,
        dimension_units: template.dimension_units,
        scale_type: template.scale_type,
        scale_min: template.scale_min,
        scale_max: template.scale_max,
        images_per_row: template.images_per_row,
        crop_images_to_square: template.crop_images_to_square ?? true,
        frames_max_count: template.frames_max_count,
        frames_require_image: template.frames_require_image,
        frames_require_location: template.frames_require_location,
        frames_require_measurements: template.frames_require_measurements,
        options: (template.options || []).map((opt: any) => ({
          label: opt.label,
          description: opt.description || '',
          image_url: opt.image_url || undefined,
          jump_to_step: opt.jump_to_step || undefined,
          imageFile: null
        }))
      }

      const newSteps = [...steps, newStep]
      setSteps(newSteps)
      setSelectedStepIndex(newSteps.length - 1)
      saveToHistory()
      push({ type: 'success', message: `Step created from template "${template.name}"!` })
    } catch (error) {
      console.error('Error creating step from template:', error)
      push({ type: 'error', message: 'Failed to create step from template' })
      throw error
    }
  }

  const handleFileChange = (stepIndex: number, optionIndex: number, file: File | null) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return
    const step = steps[stepIndex]
    const option = step.options[optionIndex]
    if (!option) return
    
    const preview = file ? URL.createObjectURL(file) : undefined
    
    // Auto-generate label from filename if current label is default/empty
    let newLabel = option.label
    if (file && (!option.label || option.label.match(/^Option \d+$/))) {
      // Extract filename without extension and clean it up
      const fileName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
      newLabel = fileName
        .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
        .replace(/\b\w/g, c => c.toUpperCase()) // Capitalize first letter of each word
    }
    
    const updatedOption = {
      ...option,
      imageFile: file,
      image_url: preview ?? option.image_url,
      label: newLabel
    }
    updateOption(stepIndex, optionIndex, updatedOption)
  }

  const save = async () => {
    if (!user) return push({ type: 'error', message: 'You must be signed in' })
    if (!name || !clientId) return push({ type: 'error', message: 'Please provide form name and client' })
    setSaving(true)

    try {
      let finalFormId = formId

      if (isEditing && formId) {
        // Update existing form
        const { error: formErr } = await supabase.from('forms')
          .update({ 
            name, 
            internal_name: internalName,
            description, 
            client_id: clientId,
            welcome_message: welcomeMessage,
            form_theme: formTheme,
            primary_button_color: primaryButtonColor,
            primary_button_text_color: primaryButtonTextColor,
            secondary_button_color: secondaryButtonColor,
            secondary_button_text_color: secondaryButtonTextColor
          })
          .eq('id', formId)
          .eq('user_id', user.id)
        
        if (formErr) throw formErr

        // Delete existing steps and options
        const { error: deleteErr } = await supabase
          .from('form_steps')
          .delete()
          .eq('form_id', formId)
        
        if (deleteErr) throw deleteErr
      } else {
        // Create new form
        const { data: formData, error: formErr } = await supabase.from('forms').insert([{ 
          name, 
          internal_name: internalName,
          description, 
          client_id: clientId, 
          user_id: user.id,
          welcome_message: welcomeMessage,
          form_theme: formTheme,
          primary_button_color: primaryButtonColor,
          primary_button_text_color: primaryButtonTextColor,
          secondary_button_color: secondaryButtonColor,
          secondary_button_text_color: secondaryButtonTextColor
        }]).select().single()
        
        if (formErr) throw formErr
        finalFormId = formData.id
      }

      // Create/recreate all steps
      for (const step of steps) {
        const { data: stepData, error: stepErr } = await supabase.from('form_steps').insert([{ 
          form_id: finalFormId, 
          title: step.title,
          description: step.description || null,
          question_type: step.question_type, 
          is_required: step.is_required ?? true, 
          step_order: step.step_order,
          max_file_size: step.max_file_size,
          allowed_file_types: step.allowed_file_types,
          dimension_type: step.dimension_type,
          dimension_units: step.dimension_units,
          scale_type: step.scale_type,
          scale_min: step.scale_min,
          scale_max: step.scale_max,
          images_per_row: step.images_per_row,
          crop_images_to_square: step.crop_images_to_square ?? true,
          frames_max_count: step.frames_max_count,
          frames_require_image: step.frames_require_image,
          frames_require_location: step.frames_require_location,
          frames_require_measurements: step.frames_require_measurements
        }]).select().single()
        if (stepErr) throw stepErr
        const stepId = stepData.id

        // Insert options (upload images if provided)
        for (const opt of step.options) {
          let image_url = opt.image_url || null
          if (opt.imageFile) {
            // Try direct upload without policy checks first
            const bucket = 'form-assets'
            const filename = `${user.id}/${finalFormId}/${stepId}/${Date.now()}-${opt.imageFile.name}`
            
            console.log('Attempting direct upload to:', bucket, filename)
            const { error: upErr } = await supabase.storage.from(bucket).upload(filename, opt.imageFile)
            
            if (upErr) {
              console.error('Upload error details:', upErr)
              push({ type: 'error', message: `Image upload failed: ${upErr.message}` })
              // Fall back to placeholder
              image_url = `https://via.placeholder.com/300x200?text=${encodeURIComponent(opt.label)}`
            } else {
              // Success! Get the public URL
              const { data: pub } = await supabase.storage.from(bucket).getPublicUrl(filename)
              image_url = pub?.publicUrl || `https://via.placeholder.com/300x200?text=${encodeURIComponent(opt.label)}`
              console.log('Upload successful, URL:', image_url)
              push({ type: 'success', message: 'Image uploaded successfully!' })
            }
            
            /* TODO: Re-enable when storage is working
            const bucket = 'form-assets'
            
            // Ensure bucket exists before uploading
            const bucketReady = await ensureBucketExists(bucket)
            if (!bucketReady) {
              push({ type: 'error', message: 'Storage bucket not available. Please check your Supabase configuration.' })
              continue // Skip this image and continue with the form save
            }
            
            const filename = `${user.id}/${finalFormId}/${stepId}/${Date.now()}-${opt.imageFile.name}`
            const { error: upErr } = await supabase.storage.from(bucket).upload(filename, opt.imageFile)
            if (upErr) {
              console.error('Upload error details:', upErr)
              push({ type: 'error', message: `Image upload failed: ${upErr.message || 'Unknown error'}` })
            } else {
              // for public buckets, get the public URL and store that for direct use in the embed
              const { data: pub } = await supabase.storage.from(bucket).getPublicUrl(filename)
              image_url = (pub ?? { publicUrl: filename }).publicUrl
            }
            */
          }

          const { error: optErr } = await supabase.from('form_options').insert([{ 
            step_id: stepId, 
            label: opt.label, 
            image_url, 
            jump_to_step: opt.jump_to_step ?? null,
            option_order: step.options.indexOf(opt) + 1
          }])
          if (optErr) throw optErr
        }
      }

      push({ type: 'success', message: isEditing ? 'Form updated successfully' : 'Form created successfully' })
      // Stay on the same page after saving
    } catch (error) {
      console.error('Error saving form:', error)
      push({ type: 'error', message: 'Error saving form' })
    } finally {
      setSaving(false)
    }
  }

  const saveStep = async (stepIndex: number) => {
    if (!user) {
      push({ type: 'error', message: 'You must be signed in' })
      return
    }
    
    const step = steps[stepIndex]
    if (!step) return

    // If we're not editing an existing form, we need to save the form first
    if (!isEditing || !formId) {
      push({ type: 'info', message: 'Saving entire form first...' })
      await save() // This will save the whole form
      return
    }

    setSaving(true)
    try {
      // Check if this step already exists in the database
      let stepId = step.id
      
      if (stepId) {
        // Update existing step
        const { error: stepErr } = await supabase.from('form_steps')
          .update({ 
            title: step.title,
            description: step.description || null,
            question_type: step.question_type, 
            is_required: step.is_required ?? true, 
            step_order: step.step_order,
            max_file_size: step.max_file_size,
            allowed_file_types: step.allowed_file_types,
            scale_type: step.scale_type,
            scale_min: step.scale_min,
            scale_max: step.scale_max,
            dimension_type: step.dimension_type,
            dimension_units: step.dimension_units,
            images_per_row: step.images_per_row,
            crop_images_to_square: step.crop_images_to_square ?? true,
            frames_max_count: step.frames_max_count,
            frames_require_image: step.frames_require_image,
            frames_require_location: step.frames_require_location,
            frames_require_measurements: step.frames_require_measurements
          })
          .eq('id', stepId)
          .eq('form_id', formId)
        
        if (stepErr) throw stepErr

        // Delete existing options for this step
        const { error: deleteOptErr } = await supabase
          .from('form_options')
          .delete()
          .eq('step_id', stepId)
        
        if (deleteOptErr) throw deleteOptErr
      } else {
        // Create new step
        const { data: stepData, error: stepErr } = await supabase.from('form_steps')
          .insert([{ 
            form_id: formId, 
            title: step.title,
            description: step.description || null,
            question_type: step.question_type, 
            is_required: step.is_required ?? true, 
            step_order: step.step_order,
            max_file_size: step.max_file_size,
            allowed_file_types: step.allowed_file_types,
            scale_type: step.scale_type,
            scale_min: step.scale_min,
            scale_max: step.scale_max,
            dimension_type: step.dimension_type,
            dimension_units: step.dimension_units,
            images_per_row: step.images_per_row,
            crop_images_to_square: step.crop_images_to_square ?? true,
            frames_max_count: step.frames_max_count,
            frames_require_image: step.frames_require_image,
            frames_require_location: step.frames_require_location,
            frames_require_measurements: step.frames_require_measurements
          }])
          .select()
          .single()
        
        if (stepErr) throw stepErr
        stepId = stepData.id

        // Update the step in local state with the new ID
        const updatedSteps = [...steps]
        updatedSteps[stepIndex] = { ...step, id: stepId }
        setSteps(updatedSteps)
      }

      // Insert/recreate options
      for (const opt of step.options) {
        let image_url = opt.image_url || null
        if (opt.imageFile) {
          // Try direct upload without policy checks first
          const bucket = 'form-assets'
          const filename = `${user.id}/${formId}/${stepId}/${Date.now()}-${opt.imageFile.name}`
          
          console.log('Attempting direct upload to:', bucket, filename)
          const { error: upErr } = await supabase.storage.from(bucket).upload(filename, opt.imageFile)
          
          if (upErr) {
            console.error('Upload error details:', upErr)
            push({ type: 'error', message: `Image upload failed: ${upErr.message}` })
            // Fall back to placeholder
            image_url = `https://via.placeholder.com/300x200?text=${encodeURIComponent(opt.label)}`
          } else {
            // Success! Get the public URL
            const { data: pub } = await supabase.storage.from(bucket).getPublicUrl(filename)
            image_url = pub?.publicUrl || `https://via.placeholder.com/300x200?text=${encodeURIComponent(opt.label)}`
            console.log('Upload successful, URL:', image_url)
            push({ type: 'success', message: 'Image uploaded successfully!' })
          }
          
          /* TODO: Re-enable when storage is working
          const bucket = 'form-assets'
          
          // Ensure bucket exists before uploading
          const bucketReady = await ensureBucketExists(bucket)
          if (!bucketReady) {
            push({ type: 'error', message: 'Storage bucket not available. Please check your Supabase configuration.' })
            continue // Skip this image and continue with the step save
          }
          
          const filename = `${user.id}/${formId}/${stepId}/${Date.now()}-${opt.imageFile.name}`
          const { error: upErr } = await supabase.storage.from(bucket).upload(filename, opt.imageFile)
          if (upErr) {
            console.error('Upload error details:', upErr)
            push({ type: 'error', message: `Image upload failed: ${upErr.message || 'Unknown error'}` })
          } else {
            const { data: pub } = await supabase.storage.from(bucket).getPublicUrl(filename)
            image_url = (pub ?? { publicUrl: filename }).publicUrl
          }
          */
        }

        const { error: optErr } = await supabase.from('form_options').insert([{ 
          step_id: stepId, 
          label: opt.label, 
          image_url, 
          jump_to_step: opt.jump_to_step ?? null,
          option_order: step.options.indexOf(opt) + 1
        }])
        if (optErr) throw optErr
      }

      push({ type: 'success', message: `Step "${step.title}" saved successfully` })
    } catch (error) {
      console.error('Error saving step:', error)
      push({ type: 'error', message: 'Error saving step' })
    } finally {
      setSaving(false)
    }
  }

  const currentStep = selectedStepIndex !== null ? steps[selectedStepIndex] : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111111]">
        <div className={`backdrop-blur-xl rounded-2xl p-8 text-center animate-pulse ${
          theme === 'light'
            ? 'bg-white/80 border border-gray-200 shadow-lg'
            : 'bg-white/10 border border-white/20'
        }`}>
          <div className={`animate-spin rounded-full h-12 w-12 border-2 mx-auto mb-4 ${
            theme === 'light'
              ? 'border-gray-300 border-t-blue-600'
              : 'border-white/30 border-t-white'
          }`}></div>
          <p className={`font-medium ${
            theme === 'light' ? 'text-gray-700' : 'text-white/80'
          }`}>Loading form builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111111]">
      {/* Header */}
      <div className={`border-b backdrop-blur-xl px-6 py-4 ${
        theme === 'light'
          ? 'border-gray-200 bg-white/80'
          : 'border-white/10 bg-white/10'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/forms')}
              className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                theme === 'light'
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                theme === 'light'
                  ? 'from-gray-800 via-blue-600 to-purple-600'
                  : 'from-white via-orange-100 to-red-200'
              }`}>
                {isEditing ? 'Edit Form: ' : 'Create Form: '}{name || 'Untitled Form'}
              </h1>
              {clientId && (
                <p className={`mt-1 ${
                  theme === 'light' ? 'text-gray-600' : 'text-white/70'
                }`}>
                  {clients.find(c => c.id === clientId)?.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowStepTypeDropdown(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/30 text-blue-200 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </button>
            <button
              onClick={() => setShowFormSettingsModal(true)}
              className={`inline-flex items-center px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 border border-blue-200'
                  : 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 text-blue-200 border border-blue-400/30'
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Form Settings
            </button>
            <button
              onClick={() => setShowFormThemeModal(true)}
              className={`inline-flex items-center px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 border border-purple-200'
                  : 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 text-purple-200 border border-purple-400/30'
              }`}
            >
              <Palette className="h-4 w-4 mr-2" />
              Form Theme
            </button>
            <button
              onClick={() => setShowButtonColoursModal(true)}
              className={`inline-flex items-center px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 text-yellow-700 border border-yellow-200'
                  : 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 hover:from-yellow-500/30 hover:to-yellow-600/30 text-yellow-200 border border-yellow-400/30'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v11H4V4z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM6 8a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Button Colours
            </button>
            <button
              onClick={undo}
              disabled={history.past.length === 0}
              className={`inline-flex items-center px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 border border-gray-200 disabled:bg-gray-50'
                  : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-600/30 text-gray-300 border border-gray-400/30 disabled:bg-gray-500/10'
              }`}
              title="Undo last action"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={redo}
              disabled={history.future.length === 0}
              className={`inline-flex items-center px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 border border-gray-200 disabled:bg-gray-50'
                  : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-600/30 text-gray-300 border border-gray-400/30 disabled:bg-gray-500/10'
              }`}
              title="Redo last undone action"
            >
              <Redo className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className={`inline-flex items-center px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 border border-purple-200'
                  : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-200 border border-purple-400/30'
              }`}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </button>
            <button
              onClick={save}
              disabled={saving}
              className={`inline-flex items-center px-6 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-orange-500/25 hover:shadow-orange-500/40'
                  : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-orange-500/25 hover:shadow-orange-500/40'
              }`}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Form'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar */}
        <div className={`w-[400px] border-r overflow-y-auto ${
          theme === 'light'
            ? 'border-gray-200 bg-white/60 backdrop-blur-sm'
            : 'border-white/10 bg-white/5 backdrop-blur-sm'
        }`}>
          <div className="p-6 pb-24 space-y-6">
            {/* Form Steps */}
            <CollapsibleSection
              title="Form Steps"
              icon={<MessageSquare className="w-5 h-5 mr-2 text-purple-400" />}
              isCollapsed={collapsedSections.formSteps}
              onToggle={() => toggleSection('formSteps')}
              animationDelay="0.1s"
            >
              <div className="space-y-4">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-3">
                  <SortableContext 
                    items={steps.map((_, index) => `step-${index}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {steps.map((step, index) => (
                      <SortableStepItem
                        key={`step-${index}`}
                        step={step}
                        index={index}
                        isSelected={selectedStepIndex === index}
                        onClick={() => setSelectedStepIndex(index)}
                        onDelete={() => deleteStep(index)}
                        onDuplicate={() => duplicateStep(index)}
                        onPreview={() => {
                          setPreviewStepIndex(index)
                          setShowSingleStepPreview(true)
                        }}
                        canDelete={steps.length > 1}
                      />
                    ))}
                  </SortableContext>
                  
                  {steps.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                        <Plus className="w-6 h-6 text-white/60" />
                      </div>
                      <p className="text-sm text-white/70 mb-6">Create a step to start building your form</p>
                      <div className="flex flex-wrap justify-center gap-3">
                        {stepTypes.map((stepType) => (
                          <button
                            key={stepType.type}
                            onClick={() => addStep(stepType.type)}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/30 text-blue-200 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
                          >
                            {stepType.icon}
                            <span className="ml-2 text-sm">{stepType.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DndContext>
              
              {/* Add Step Button at bottom of list */}
              {steps.length > 0 && (
                <button
                  onClick={() => setShowStepTypeDropdown(true)}
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border-2 border-dashed border-blue-400/30 hover:border-blue-400/50 text-blue-200 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-sm mt-3"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Step
                </button>
              )}
              </div>
            </CollapsibleSection>
          </div>
        </div>

        {/* Main Editor Panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {currentStep ? (
              <div className={`backdrop-blur-xl rounded-2xl p-6 ${
                theme === 'light'
                  ? 'bg-white/90 border border-gray-200 shadow-lg'
                  : 'bg-white/10 border border-white/20'
              }`}>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className={`text-xl font-semibold bg-gradient-to-r bg-clip-text text-transparent ${
                    theme === 'light'
                      ? 'from-gray-800 to-blue-600'
                      : 'from-white to-blue-200'
                  }`}>
                    Step {selectedStepIndex! + 1} - {currentStep.question_type.replace('_', ' ')}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowLoadTemplateModal(true)}
                      className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        theme === 'light'
                          ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                          : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30'
                      }`}
                      title="Load from template"
                    >
                      <FolderOpen className="w-4 h-4 mr-1.5" />
                      Load Template
                    </button>
                    <button
                      onClick={() => setShowSaveTemplateModal(true)}
                      className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        theme === 'light'
                          ? 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                          : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/30'
                      }`}
                      title="Save as template"
                    >
                      <BookmarkPlus className="w-4 h-4 mr-1.5" />
                      Save Template
                    </button>
                    {currentStep.question_type === 'image_selection' && (
                      <button
                        onClick={() => setShowLayoutSettingsModal(true)}
                        className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          theme === 'light'
                            ? 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                            : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-400/30'
                        }`}
                        title="Layout settings"
                      >
                        <Settings className="w-4 h-4 mr-1.5" />
                        Layout Settings
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-white/90'
                    }`}>Step Title</label>
                    <input
                      type="text"
                      value={currentStep.title} 
                      onChange={(e) => updateStep(selectedStepIndex!, { ...currentStep, title: e.target.value })}
                      placeholder="What are you looking for?"
                      className={`w-full px-4 py-3 backdrop-blur-sm border rounded-xl transition-all duration-200 focus:ring-2 focus:border-transparent ${
                        theme === 'light'
                          ? 'bg-white/90 border-gray-200 text-gray-900 placeholder-gray-500 hover:bg-white focus:ring-blue-500 shadow-sm'
                          : 'bg-white/10 border-white/20 text-white placeholder-white/50 hover:bg-white/15 focus:ring-blue-400'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-sm font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-white/90'
                    }`}>Description (Optional)</label>
                    <textarea
                      value={currentStep.description || ''} 
                      onChange={(e) => updateStep(selectedStepIndex!, { ...currentStep, description: e.target.value })}
                      placeholder="Add a short description or helpful text..."
                      rows={2}
                      className={`w-full px-4 py-3 backdrop-blur-sm border rounded-xl transition-all duration-200 focus:ring-2 focus:border-transparent resize-none ${
                        theme === 'light'
                          ? 'bg-white/90 border-gray-200 text-gray-900 placeholder-gray-500 hover:bg-white focus:ring-blue-500 shadow-sm'
                          : 'bg-white/10 border-white/20 text-white placeholder-white/50 hover:bg-white/15 focus:ring-blue-400'
                      }`}
                    />
                  </div>

                  {(currentStep.question_type === 'image_selection' || currentStep.question_type === 'multiple_choice') && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-white/90">Options</label>
                        <button
                          onClick={() => addOption(selectedStepIndex!)}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Option
                        </button>
                      </div>
                      
                      {/* Grid layout for image selection options */}
                      {currentStep.question_type === 'image_selection' ? (
                        <DndContext 
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleOptionDragEnd}
                        >
                          <SortableContext 
                            items={currentStep.options.map((_, index) => `step-${selectedStepIndex}-option-${index}`)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className={`grid gap-4 grid-auto-rows-fr ${!currentStep.crop_images_to_square ? 'items-start' : ''} ${
                              currentStep.images_per_row === 1
                                ? 'grid-cols-1'
                                : currentStep.images_per_row === 2
                                ? 'grid-cols-1 sm:grid-cols-2'
                                : currentStep.images_per_row === 3
                                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                : currentStep.images_per_row === 4
                                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                                : 'grid-cols-1 sm:grid-cols-2' // default case (2 per row)
                            }`}>
                              {currentStep.options.map((option, optIndex) => (
                                <SortableImageOptionItem
                                  key={`step-${selectedStepIndex}-option-${optIndex}`}
                                  option={option}
                                  stepIndex={selectedStepIndex!}
                                  optionIndex={optIndex}
                                  onUpdate={updateOption}
                                  onDelete={deleteOption}
                                  onFileChange={handleFileChange}
                                  cropImagesToSquare={currentStep.crop_images_to_square ?? true}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      ) : (
                        /* Sortable layout for multiple choice options */
                        <DndContext 
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleOptionDragEnd}
                        >
                          <SortableContext 
                            items={currentStep.options.map((_, index) => `step-${selectedStepIndex}-option-${index}`)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-4">
                              {currentStep.options.map((option, optIndex) => (
                                <SortableMultipleChoiceOptionItem
                                  key={`step-${selectedStepIndex}-option-${optIndex}`}
                                  option={option}
                                  stepIndex={selectedStepIndex!}
                                  optionIndex={optIndex}
                                  onUpdate={updateOption}
                                  onDelete={deleteOption}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </div>
                  )}

                  {currentStep.question_type === 'file_upload' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">File Upload Preview</label>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                          <div 
                            className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center hover:border-cyan-400/50 transition-colors cursor-pointer"
                          >
                            <div className="flex flex-col items-center space-y-4">
                              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-lg font-medium text-white/90 mb-2">
                                  Drop files here or click to browse
                                </p>
                                <p className="text-sm text-white/60">
                                  Maximum file size: {currentStep.max_file_size || 5}MB
                                </p>
                                {(currentStep.allowed_file_types || []).length > 0 && (
                                  <p className="text-xs text-white/50 mt-1">
                                    Allowed types: {(currentStep.allowed_file_types || []).map(type => {
                                      if (type === 'image/*') return 'Images'
                                      if (type === 'application/pdf') return 'PDF'
                                      if (type.includes('word')) return 'Word docs'
                                      if (type === 'text/*') return 'Text files'
                                      return type.split('/')[1]?.toUpperCase() || type
                                    }).join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-white/90">Maximum File Size (MB)</label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={currentStep.max_file_size || 5}
                            onChange={(e) => updateStep(selectedStepIndex!, { 
                              ...currentStep, 
                              max_file_size: Number(e.target.value) || 5 
                            })}
                            className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-white/90">Required</label>
                          <select
                            value={currentStep.is_required ? 'true' : 'false'}
                            onChange={(e) => updateStep(selectedStepIndex!, { 
                              ...currentStep, 
                              is_required: e.target.value === 'true' 
                            })}
                            className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                          >
                            <option value="true" className="bg-slate-800">Required</option>
                            <option value="false" className="bg-slate-800">Optional</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Allowed File Types</label>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="flex items-center space-x-2 text-sm text-white/90">
                            <input
                              type="checkbox"
                              checked={(currentStep.allowed_file_types || []).includes('image/*')}
                              onChange={(e) => {
                                const types = currentStep.allowed_file_types || []
                                const newTypes = e.target.checked 
                                  ? [...types.filter(t => t !== 'image/*'), 'image/*']
                                  : types.filter(t => t !== 'image/*')
                                updateStep(selectedStepIndex!, { ...currentStep, allowed_file_types: newTypes })
                              }}
                              className="rounded border-white/20 bg-white/10"
                            />
                            <span>Images</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm text-white/90">
                            <input
                              type="checkbox"
                              checked={(currentStep.allowed_file_types || []).includes('application/pdf')}
                              onChange={(e) => {
                                const types = currentStep.allowed_file_types || []
                                const newTypes = e.target.checked 
                                  ? [...types.filter(t => t !== 'application/pdf'), 'application/pdf']
                                  : types.filter(t => t !== 'application/pdf')
                                updateStep(selectedStepIndex!, { ...currentStep, allowed_file_types: newTypes })
                              }}
                              className="rounded border-white/20 bg-white/10"
                            />
                            <span>PDF Documents</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm text-white/90">
                            <input
                              type="checkbox"
                              checked={(currentStep.allowed_file_types || []).some(t => t.includes('word'))}
                              onChange={(e) => {
                                const types = currentStep.allowed_file_types || []
                                const wordTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
                                const newTypes = e.target.checked 
                                  ? [...types.filter(t => !wordTypes.includes(t)), ...wordTypes]
                                  : types.filter(t => !wordTypes.includes(t))
                                updateStep(selectedStepIndex!, { ...currentStep, allowed_file_types: newTypes })
                              }}
                              className="rounded border-white/20 bg-white/10"
                            />
                            <span>Word Documents</span>
                          </label>
                          <label className="flex items-center space-x-2 text-sm text-white/90">
                            <input
                              type="checkbox"
                              checked={(currentStep.allowed_file_types || []).includes('text/*')}
                              onChange={(e) => {
                                const types = currentStep.allowed_file_types || []
                                const newTypes = e.target.checked 
                                  ? [...types.filter(t => t !== 'text/*'), 'text/*']
                                  : types.filter(t => t !== 'text/*')
                                updateStep(selectedStepIndex!, { ...currentStep, allowed_file_types: newTypes })
                              }}
                              className="rounded border-white/20 bg-white/10"
                            />
                            <span>Text Files</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep.question_type === 'text_input' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Text Input Preview</label>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                          <div className="text-sm text-white/70 mb-3">Enter your response</div>
                          <textarea
                            placeholder="Enter your answer here..."
                            rows={4}
                            className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none"
                            readOnly
                          />
                          {currentStep.is_required && (
                            <p className="text-xs text-white/60 mt-2">* This field is required</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Required</label>
                        <select
                          value={currentStep.is_required ? 'true' : 'false'}
                          onChange={(e) => updateStep(selectedStepIndex!, { 
                            ...currentStep, 
                            is_required: e.target.value === 'true' 
                          })}
                          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                        >
                          <option value="true" className="bg-slate-800">Required</option>
                          <option value="false" className="bg-slate-800">Optional</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {currentStep.question_type === 'dimensions' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Dimensions Preview</label>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                          <div className="text-sm text-white/70 mb-4">Enter measurements</div>
                          
                          {/* Dimension Type Preview */}
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center space-x-6">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name="dimensionTypePreview"
                                  value="2d"
                                  checked={currentStep.dimension_type === '2d' || !currentStep.dimension_type}
                                  className="text-cyan-400 focus:ring-cyan-400 bg-white/10 border-white/20"
                                  readOnly
                                />
                                <span className="text-white/70">2D (Width × Height)</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name="dimensionTypePreview"
                                  value="3d"
                                  checked={currentStep.dimension_type === '3d'}
                                  className="text-cyan-400 focus:ring-cyan-400 bg-white/10 border-white/20"
                                  readOnly
                                />
                                <span className="text-white/70">3D (Width × Height × Depth)</span>
                              </label>
                            </div>
                          </div>

                          {/* Units Preview */}
                          <div className="space-y-2 mb-4">
                            <label className="block text-sm font-medium text-white/70">Units</label>
                            <select
                              value="mm"
                              className="px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                              disabled
                            >
                              <option value="mm">Millimeters (mm)</option>
                              <option value="cm">Centimeters (cm)</option>
                              <option value="m">Meters (m)</option>
                              <option value="in">Inches (in)</option>
                              <option value="ft">Feet (ft)</option>
                            </select>
                          </div>

                          {/* Dimension Input Fields Preview */}
                          <div className={`grid gap-4 ${currentStep.dimension_type === '3d' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                            <div>
                              <label className="block text-sm font-medium text-white/70 mb-1">Width</label>
                              <input
                                type="number"
                                placeholder="0"
                                className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                readOnly
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white/70 mb-1">Height</label>
                              <input
                                type="number"
                                placeholder="0"
                                className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                readOnly
                              />
                            </div>
                            {currentStep.dimension_type === '3d' && (
                              <div>
                                <label className="block text-sm font-medium text-white/70 mb-1">Depth</label>
                                <input
                                  type="number"
                                  placeholder="0"
                                  className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                  readOnly
                                />
                              </div>
                            )}
                          </div>
                          
                          {currentStep.is_required && (
                            <p className="text-xs text-white/60 mt-2">* These fields are required</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Dimension Type</label>
                        <div className="space-y-3">
                          <label className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="dimensionType"
                              value="2d"
                              checked={currentStep.dimension_type === '2d'}
                              onChange={(e) => updateStep(selectedStepIndex!, { 
                                ...currentStep, 
                                dimension_type: e.target.value as '2d' | '3d'
                              })}
                              className="text-blue-600 focus:ring-blue-500 bg-white/10 border-white/20"
                            />
                            <span className="text-white/90">2D (Width × Height)</span>
                          </label>
                          <label className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="dimensionType"
                              value="3d"
                              checked={currentStep.dimension_type === '3d'}
                              onChange={(e) => updateStep(selectedStepIndex!, { 
                                ...currentStep, 
                                dimension_type: e.target.value as '2d' | '3d'
                              })}
                              className="text-blue-600 focus:ring-blue-500 bg-white/10 border-white/20"
                            />
                            <span className="text-white/90">3D (Width × Height × Depth)</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Default Units</label>
                        <select
                          value={currentStep.dimension_units || 'mm'}
                          onChange={(e) => updateStep(selectedStepIndex!, { 
                            ...currentStep, 
                            dimension_units: e.target.value 
                          })}
                          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                        >
                          <option value="mm" className="bg-slate-800">Millimeters (mm)</option>
                          <option value="cm" className="bg-slate-800">Centimeters (cm)</option>
                          <option value="m" className="bg-slate-800">Meters (m)</option>
                          <option value="in" className="bg-slate-800">Inches (in)</option>
                          <option value="ft" className="bg-slate-800">Feet (ft)</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Required</label>
                        <select
                          value={currentStep.is_required ? 'true' : 'false'}
                          onChange={(e) => updateStep(selectedStepIndex!, { 
                            ...currentStep, 
                            is_required: e.target.value === 'true' 
                          })}
                          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                        >
                          <option value="true" className="bg-slate-800">Required</option>
                          <option value="false" className="bg-slate-800">Optional</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {currentStep.question_type === 'opinion_scale' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Scale Preview</label>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                          <div className="text-center">
                            {currentStep.scale_type === 'star' ? (
                              // Star Rating Preview (1-5)
                              <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button
                                    key={rating}
                                    type="button"
                                    className="text-4xl text-white/40 hover:text-cyan-300 transition-colors"
                                    disabled
                                  >
                                    ⭐
                                  </button>
                                ))}
                              </div>
                            ) : (
                              // Number Scale Preview (configurable range)
                              <div className="w-full overflow-x-auto">
                                <div className="flex justify-center gap-1 sm:gap-2 min-w-max px-4">
                                  {Array.from(
                                    { length: (currentStep.scale_max || 10) - (currentStep.scale_min || 1) + 1 },
                                    (_, i) => (currentStep.scale_min || 1) + i
                                  ).map((rating) => (
                                    <button
                                      key={rating}
                                      type="button"
                                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 bg-white/10 border-white/20 text-white/70 font-semibold text-sm sm:text-base transition-all flex-shrink-0 hover:bg-white/20 hover:border-cyan-400/50"
                                      disabled
                                    >
                                      {rating}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Scale Type</label>
                        <div className="space-y-3">
                          <label className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="scaleType"
                              value="number"
                              checked={currentStep.scale_type === 'number'}
                              onChange={(e) => updateStep(selectedStepIndex!, { 
                                ...currentStep, 
                                scale_type: e.target.value as 'number' | 'star',
                                scale_min: 1,
                                scale_max: e.target.value === 'number' ? 10 : 5
                              })}
                              className="text-blue-600 focus:ring-blue-500 bg-white/10 border-white/20"
                            />
                            <span className="text-white/90">Number Scale (1-10)</span>
                          </label>
                          <label className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="scaleType"
                              value="star"
                              checked={currentStep.scale_type === 'star'}
                              onChange={(e) => updateStep(selectedStepIndex!, { 
                                ...currentStep, 
                                scale_type: e.target.value as 'number' | 'star',
                                scale_min: 1,
                                scale_max: e.target.value === 'number' ? 10 : 5
                              })}
                              className="text-blue-600 focus:ring-blue-500 bg-white/10 border-white/20"
                            />
                            <span className="text-white/90">Star Rating (1-5)</span>
                          </label>
                        </div>
                      </div>
                      
                      {currentStep.scale_type === 'number' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-white/90">Minimum Value</label>
                            <input
                              type="number"
                              min={1}
                              max={9}
                              value={currentStep.scale_min || 1}
                              onChange={(e) => updateStep(selectedStepIndex!, { 
                                ...currentStep, 
                                scale_min: Number(e.target.value) || 1 
                              })}
                              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-white/90">Maximum Value</label>
                            <input
                              type="number"
                              min={2}
                              max={10}
                              value={currentStep.scale_max || 10}
                              onChange={(e) => updateStep(selectedStepIndex!, { 
                                ...currentStep, 
                                scale_max: Number(e.target.value) || 10 
                              })}
                              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Required</label>
                        <select
                          value={currentStep.is_required ? 'true' : 'false'}
                          onChange={(e) => updateStep(selectedStepIndex!, { 
                            ...currentStep, 
                            is_required: e.target.value === 'true' 
                          })}
                          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                        >
                          <option value="true" className="bg-slate-800">Required</option>
                          <option value="false" className="bg-slate-800">Optional</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {currentStep.question_type === 'frames_plan' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Frames Plan Preview</label>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                          <div className="space-y-4">
                            {/* Frame count selector preview */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-white/70">How many frames do you want?</label>
                              <select
                                value={1}
                                className="w-32 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                disabled
                              >
                                {Array.from({ length: currentStep.frames_max_count || 10 }, (_, i) => i + 1).map(num => (
                                  <option key={num} value={num}>
                                    {num} {num === 1 ? 'frame' : 'frames'}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Sample frame preview */}
                            <div className="border border-white/20 rounded-lg p-4 bg-white/5">
                              <h4 className="text-lg font-medium text-white/90 mb-4">Frame 1</h4>
                              
                              <div className="space-y-4">
                                {/* Image Upload Preview */}
                                {currentStep.frames_require_image !== false && (
                                  <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                      Image{currentStep.frames_require_image ? ' *' : ''}
                                    </label>
                                    <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center">
                                      <div className="flex flex-col items-center space-y-2">
                                        <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                                          <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                          </svg>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-white/70">Choose file</p>
                                          <p className="text-xs text-white/50">PNG, JPG up to 10MB</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Location Input Preview */}
                                {currentStep.frames_require_location !== false && (
                                  <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                      Room Location (e.g., bedroom){currentStep.frames_require_location ? ' *' : ''}
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g., bedroom"
                                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                      readOnly
                                    />
                                  </div>
                                )}
                                
                                {/* Measurements Input Preview */}
                                {currentStep.frames_require_measurements !== false && (
                                  <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                      Measurements (optional) - width × height in mm{currentStep.frames_require_measurements ? ' *' : ''}
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g., 1200 × 800"
                                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                      readOnly
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Maximum Number of Frames</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={currentStep.frames_max_count || 10}
                          onChange={(e) => updateStep(selectedStepIndex!, { 
                            ...currentStep, 
                            frames_max_count: Number(e.target.value) || 10 
                          })}
                          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                        />
                        <p className="text-xs text-white/60">Users can select up to this many frames</p>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-medium text-white/90">Required Fields for Each Frame</p>
                        
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={currentStep.frames_require_image !== false}
                            onChange={(e) => updateStep(selectedStepIndex!, { 
                              ...currentStep, 
                              frames_require_image: e.target.checked 
                            })}
                            className="text-blue-600 focus:ring-blue-500 bg-white/10 border-white/20 rounded"
                          />
                          <span className="text-white/90">Image Upload</span>
                        </label>
                        
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={currentStep.frames_require_location !== false}
                            onChange={(e) => updateStep(selectedStepIndex!, { 
                              ...currentStep, 
                              frames_require_location: e.target.checked 
                            })}
                            className="text-blue-600 focus:ring-blue-500 bg-white/10 border-white/20 rounded"
                          />
                          <span className="text-white/90">Location (e.g., bedroom)</span>
                        </label>
                        
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={currentStep.frames_require_measurements !== false}
                            onChange={(e) => updateStep(selectedStepIndex!, { 
                              ...currentStep, 
                              frames_require_measurements: e.target.checked 
                            })}
                            className="text-blue-600 focus:ring-blue-500 bg-white/10 border-white/20 rounded"
                          />
                          <span className="text-white/90">Measurements</span>
                        </label>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/90">Required</label>
                        <select
                          value={currentStep.is_required ? 'true' : 'false'}
                          onChange={(e) => updateStep(selectedStepIndex!, { 
                            ...currentStep, 
                            is_required: e.target.value === 'true' 
                          })}
                          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                        >
                          <option value="true" className="bg-slate-800">Required</option>
                          <option value="false" className="bg-slate-800">Optional</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Save Step Button */}
                  <div className="flex justify-end pt-6 mt-6 border-t border-white/20">
                    <button
                      onClick={() => saveStep(selectedStepIndex!)} 
                      disabled={saving}
                      className={`inline-flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isEditing && formId 
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-blue-200 border border-blue-400/30 shadow-blue-500/25' 
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-green-500/25 hover:shadow-green-500/40'
                      }`}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Saving...' : (isEditing && formId ? 'Save Step' : 'Save Form & Step')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`backdrop-blur-xl rounded-2xl p-12 text-center ${
                theme === 'light'
                  ? 'bg-white/90 border border-gray-200 shadow-lg'
                  : 'bg-white/10 border border-white/20'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border ${
                  theme === 'light'
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-white/10 border-white/20'
                }`}>
                  <MessageSquare className={`w-8 h-8 ${
                    theme === 'light' ? 'text-gray-500' : 'text-white/60'
                  }`} />
                </div>
                <h3 className={`text-xl font-semibold mb-3 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>No step selected</h3>
                <p className={`mb-8 text-lg ${
                  theme === 'light' ? 'text-gray-600' : 'text-white/70'
                }`}>Create a step to start building your form</p>
                <div className="flex flex-wrap justify-center gap-4 mb-6">
                  {stepTypes.map((stepType) => (
                    <button
                      key={stepType.type}
                      onClick={() => addStep(stepType.type)}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/30 text-blue-200 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      {stepType.icon}
                      <span className="ml-3">{stepType.title}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowLoadTemplateModal(true)}
                    className={`inline-flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:scale-105 ${
                      theme === 'light'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                        : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-200 border border-purple-400/30'
                    }`}
                  >
                    <FolderOpen className="w-5 h-5 mr-2" />
                    Create from Template
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Step Type Modal */}
      {showStepTypeDropdown && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
            theme === 'light'
              ? 'bg-white border border-gray-200'
              : 'bg-slate-800 border border-white/20'
          }`}>
            <div className={`sticky top-0 px-6 py-4 border-b backdrop-blur-xl ${
              theme === 'light'
                ? 'bg-white/95 border-gray-200'
                : 'bg-slate-800/95 border-white/20'
            }`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-semibold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Choose Step Type
                </h2>
                <button
                  onClick={() => setShowStepTypeDropdown(false)}
                  className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                    theme === 'light'
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stepTypes.map((stepType) => (
                  <button
                    key={stepType.type}
                    onClick={() => {
                      addStep(stepType.type)
                      setShowStepTypeDropdown(false)
                    }}
                    className={`flex items-start p-4 rounded-xl border-2 transition-all duration-200 text-left hover:scale-105 ${
                      theme === 'light'
                        ? 'bg-white hover:bg-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-md'
                        : 'bg-white/5 hover:bg-white/10 border-white/20 hover:border-blue-400/50'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl mr-4 flex-shrink-0 ${
                      theme === 'light' ? 'bg-blue-50' : 'bg-blue-500/20'
                    }`}>
                      <div className={theme === 'light' ? 'text-blue-600' : 'text-blue-300'}>
                        {stepType.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-base mb-1 ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>{stepType.title}</p>
                      <p className={`text-sm ${
                        theme === 'light' ? 'text-gray-600' : 'text-white/70'
                      }`}>{stepType.description}</p>
                    </div>
                  </button>
                ))}
                
                {/* Create from Template Option */}
                <button
                  onClick={() => {
                    setShowStepTypeDropdown(false)
                    setShowLoadTemplateModal(true)
                  }}
                  className={`flex items-start p-4 rounded-xl border-2 transition-all duration-200 text-left hover:scale-105 ${
                    theme === 'light'
                      ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 hover:border-purple-300 hover:shadow-md'
                      : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-400/30 hover:border-purple-400/50'
                  }`}
                >
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl mr-4 flex-shrink-0 ${
                    theme === 'light' ? 'bg-purple-100' : 'bg-purple-500/20'
                  }`}>
                    <FolderOpen className={`w-6 h-6 ${
                      theme === 'light' ? 'text-purple-600' : 'text-purple-300'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-base mb-1 ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>Create from Template</p>
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-600' : 'text-white/70'
                    }`}>Use a saved template to create a new step</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Preview Modal */}
      <FormPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        formId={formId}
        formName={name}
      />

      {/* Single Step Preview Modal */}
      {previewStepIndex !== null && (
        <SingleStepPreview
          isOpen={showSingleStepPreview}
          onClose={() => {
            setShowSingleStepPreview(false)
            setPreviewStepIndex(null)
          }}
          step={steps[previewStepIndex]}
          stepNumber={previewStepIndex + 1}
          primaryColor={primaryButtonColor}
          secondaryColor={secondaryButtonColor}
        />
      )}

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveTemplateModal}
        onClose={() => setShowSaveTemplateModal(false)}
        onSave={saveStepAsTemplate}
        stepType={currentStep?.question_type || ''}
      />

      {/* Load Template Modal */}
      <LoadTemplateModal
        isOpen={showLoadTemplateModal}
        onClose={() => setShowLoadTemplateModal(false)}
        onSelect={selectedStepIndex !== null ? loadTemplateToStep : createStepFromTemplate}
      />

      {/* Form Settings Modal */}
      {showFormSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
            theme === 'light'
              ? 'bg-white border border-gray-200'
              : 'bg-slate-800 border border-white/20'
          }`}>
            <div className={`sticky top-0 px-6 py-4 border-b backdrop-blur-xl ${
              theme === 'light'
                ? 'bg-white/95 border-gray-200'
                : 'bg-slate-800/95 border-white/20'
            }`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-semibold flex items-center ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  <FileText className={`w-5 h-5 mr-2 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} />
                  Form Settings
                </h2>
                <button
                  onClick={() => setShowFormSettingsModal(false)}
                  className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                    theme === 'light'
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${
                  theme === 'light' ? 'text-gray-700' : 'text-white/90'
                }`}>Form Title</label>
                <input
                  type="text"
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter form title"
                  className={`w-full px-4 py-3 backdrop-blur-sm border rounded-xl transition-all duration-200 focus:ring-2 focus:border-transparent ${
                    theme === 'light'
                      ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 hover:bg-gray-50 focus:ring-blue-500 shadow-sm'
                      : 'bg-white/10 border-white/20 text-white placeholder-white/50 hover:bg-white/15 focus:ring-blue-400'
                  }`}
                />
              </div>
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${
                  theme === 'light' ? 'text-gray-700' : 'text-white/90'
                }`}>Internal Name (Admin Only)</label>
                <input
                  type="text"
                  value={internalName}
                  onChange={e => setInternalName(e.target.value)}
                  placeholder="Internal name for admin use only"
                  className={`w-full px-4 py-3 backdrop-blur-sm border rounded-xl transition-all duration-200 focus:ring-2 focus:border-transparent ${
                    theme === 'light'
                      ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 hover:bg-gray-50 focus:ring-orange-500 shadow-sm'
                      : 'bg-white/10 border-white/20 text-white placeholder-white/50 hover:bg-white/15 focus:ring-orange-400'
                  }`}
                />
              </div>
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${
                  theme === 'light' ? 'text-gray-700' : 'text-white/90'
                }`}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your form"
                  rows={3}
                  className={`w-full px-4 py-3 backdrop-blur-sm border rounded-xl transition-all duration-200 focus:ring-2 focus:border-transparent resize-none ${
                    theme === 'light'
                      ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 hover:bg-gray-50 focus:ring-blue-500 shadow-sm'
                      : 'bg-white/10 border-white/20 text-white placeholder-white/50 hover:bg-white/15 focus:ring-blue-400'
                  }`}
                />
              </div>
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${
                  theme === 'light' ? 'text-gray-700' : 'text-white/90'
                }`}>Welcome Message</label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Welcome message for form users"
                  rows={3}
                  className={`w-full px-4 py-3 backdrop-blur-sm border rounded-xl transition-all duration-200 focus:ring-2 focus:border-transparent resize-none ${
                    theme === 'light'
                      ? 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 hover:bg-gray-50 focus:ring-blue-500 shadow-sm'
                      : 'bg-white/10 border-white/20 text-white placeholder-white/50 hover:bg-white/15 focus:ring-blue-400'
                  }`}
                />
              </div>
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${
                  theme === 'light' ? 'text-gray-700' : 'text-white/90'
                }`}>Client</label>
                <select 
                  value={clientId ?? ''} 
                  onChange={e => setClientId(e.target.value)}
                  className={`w-full px-4 py-3 backdrop-blur-sm border rounded-xl transition-all duration-200 focus:ring-2 focus:border-transparent ${
                    theme === 'light'
                      ? 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50 focus:ring-blue-500 shadow-sm'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/15 focus:ring-blue-400'
                  }`}
                >
                  <option value="" className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-800 text-white'}>Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id} className={theme === 'light' ? 'bg-white text-gray-900' : 'bg-slate-800 text-white'}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Theme Modal */}
      {showFormThemeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
            theme === 'light'
              ? 'bg-white border border-gray-200'
              : 'bg-slate-800 border border-white/20'
          }`}>
            <div className={`sticky top-0 px-6 py-4 border-b backdrop-blur-xl ${
              theme === 'light'
                ? 'bg-white/95 border-gray-200'
                : 'bg-slate-800/95 border-white/20'
            }`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-semibold flex items-center ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  <Palette className={`w-5 h-5 mr-2 ${theme === 'light' ? 'text-purple-600' : 'text-purple-400'}`} />
                  Form Theme
                </h2>
                <button
                  onClick={() => setShowFormThemeModal(false)}
                  className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                    theme === 'light'
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className={`text-sm mb-4 ${
                theme === 'light' ? 'text-gray-600' : 'text-white/70'
              }`}>Choose how your form appears to users</p>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(formThemes).map(([themeKey, themeData]) => (
                  <button
                    key={themeKey}
                    onClick={() => setFormTheme(themeKey as keyof typeof formThemes)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left overflow-hidden ${
                      formTheme === themeKey
                        ? theme === 'light'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-purple-400 bg-purple-400/20'
                        : theme === 'light'
                          ? 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                          : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                    }`}
                  >
                    {themeKey === 'soft-ui' && (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/10 to-purple-100/10 pointer-events-none" />
                    )}
                    
                    <div className="relative flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-semibold mb-1 ${
                          theme === 'light' ? 'text-gray-900' : 'text-white'
                        }`}>{themeData.name}</h4>
                        <p className={`text-sm mb-4 ${
                          theme === 'light' ? 'text-gray-600' : 'text-white/70'
                        }`}>{themeData.description}</p>
                        
                        <div className="space-y-3">
                          <div className={`p-3 ${
                            themeKey === 'soft-ui' 
                              ? 'bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20' 
                              : 'bg-white/90 rounded-lg border border-gray-200'
                          }`}>
                            <div className={`h-3 mb-2 ${
                              themeKey === 'soft-ui' 
                                ? 'bg-white/60 backdrop-blur-sm rounded-xl border border-white/30' 
                                : 'bg-gray-100 border border-gray-300 rounded-md'
                            }`} />
                            
                            <div className="flex gap-2 mt-3">
                              <div className={`h-2.5 w-16 ${
                                themeKey === 'soft-ui' 
                                  ? 'bg-white/70 backdrop-blur-sm rounded-full border border-white/40' 
                                  : 'bg-gray-300 rounded-md'
                              }`} />
                              <div className={`h-2.5 w-12 ${
                                themeKey === 'soft-ui' 
                                  ? 'bg-gradient-to-r from-blue-400/80 to-purple-500/80 rounded-full shadow-sm' 
                                  : themeData.preview.primaryColor + ' rounded-md'
                              }`} />
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className={`h-2 rounded ${
                              themeKey === 'soft-ui' 
                                ? 'bg-gradient-to-r from-slate-700/40 to-slate-500/40' 
                                : 'bg-gray-700/60'
                            }`} style={{width: '70%'}} />
                            <div className={`h-1.5 rounded ${
                              themeKey === 'soft-ui' 
                                ? 'bg-slate-400/40' 
                                : 'bg-gray-500/60'
                            }`} style={{width: '50%'}} />
                          </div>
                        </div>
                      </div>
                      
                      {formTheme === themeKey && (
                        <div className="flex-shrink-0 ml-4">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            theme === 'light' ? 'bg-purple-600' : 'bg-purple-400'
                          }`}>
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Button Colours Modal */}
      {showButtonColoursModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
            theme === 'light'
              ? 'bg-white border border-gray-200'
              : 'bg-slate-800 border border-white/20'
          }`}>
            <div className={`sticky top-0 px-6 py-4 border-b backdrop-blur-xl ${
              theme === 'light'
                ? 'bg-white/95 border-gray-200'
                : 'bg-slate-800/95 border-white/20'
            }`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-semibold flex items-center ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  <svg className={`w-5 h-5 mr-2 ${theme === 'light' ? 'text-yellow-600' : 'text-yellow-400'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v11H4V4z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM6 8a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Button Colours
                </h2>
                <button
                  onClick={() => setShowButtonColoursModal(false)}
                  className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                    theme === 'light'
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Primary Button Colors */}
              <div className="space-y-3">
                <div className={`text-sm font-medium ${
                  theme === 'light' ? 'text-gray-700' : 'text-white/80'
                }`}>Next Button</div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className={`block text-xs font-medium ${
                      theme === 'light' ? 'text-gray-600' : 'text-white/70'
                    }`}>Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryButtonColor}
                        onChange={(e) => setPrimaryButtonColor(e.target.value)}
                        className={`w-10 h-10 rounded border cursor-pointer flex-shrink-0 ${
                          theme === 'light' ? 'border-gray-300' : 'border-white/20'
                        }`}
                      />
                      <input
                        type="text"
                        value={primaryButtonColor}
                        onChange={(e) => setPrimaryButtonColor(e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent ${
                          theme === 'light'
                            ? 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'
                            : 'bg-white/10 border-white/20 text-white focus:ring-blue-400'
                        }`}
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`block text-xs font-medium ${
                      theme === 'light' ? 'text-gray-600' : 'text-white/70'
                    }`}>Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryButtonTextColor}
                        onChange={(e) => setPrimaryButtonTextColor(e.target.value)}
                        className={`w-10 h-10 rounded border cursor-pointer flex-shrink-0 ${
                          theme === 'light' ? 'border-gray-300' : 'border-white/20'
                        }`}
                      />
                      <input
                        type="text"
                        value={primaryButtonTextColor}
                        onChange={(e) => setPrimaryButtonTextColor(e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent ${
                          theme === 'light'
                            ? 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'
                            : 'bg-white/10 border-white/20 text-white focus:ring-blue-400'
                        }`}
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Button Colors */}
              <div className="space-y-3">
                <div className={`text-sm font-medium ${
                  theme === 'light' ? 'text-gray-700' : 'text-white/80'
                }`}>Previous Button</div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className={`block text-xs font-medium ${
                      theme === 'light' ? 'text-gray-600' : 'text-white/70'
                    }`}>Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryButtonColor}
                        onChange={(e) => setSecondaryButtonColor(e.target.value)}
                        className={`w-10 h-10 rounded border cursor-pointer flex-shrink-0 ${
                          theme === 'light' ? 'border-gray-300' : 'border-white/20'
                        }`}
                      />
                      <input
                        type="text"
                        value={secondaryButtonColor}
                        onChange={(e) => setSecondaryButtonColor(e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent ${
                          theme === 'light'
                            ? 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'
                            : 'bg-white/10 border-white/20 text-white focus:ring-blue-400'
                        }`}
                        placeholder="#E5E7EB"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`block text-xs font-medium ${
                      theme === 'light' ? 'text-gray-600' : 'text-white/70'
                    }`}>Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryButtonTextColor}
                        onChange={(e) => setSecondaryButtonTextColor(e.target.value)}
                        className={`w-10 h-10 rounded border cursor-pointer flex-shrink-0 ${
                          theme === 'light' ? 'border-gray-300' : 'border-white/20'
                        }`}
                      />
                      <input
                        type="text"
                        value={secondaryButtonTextColor}
                        onChange={(e) => setSecondaryButtonTextColor(e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent ${
                          theme === 'light'
                            ? 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'
                            : 'bg-white/10 border-white/20 text-white focus:ring-blue-400'
                        }`}
                        placeholder="#374151"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className={`p-4 rounded-lg border ${
                theme === 'light'
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-white/5 border-white/10'
              }`}>
                <div className={`text-xs mb-3 ${
                  theme === 'light' ? 'text-gray-600' : 'text-white/70'
                }`}>Button Preview:</div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    style={{
                      backgroundColor: secondaryButtonColor,
                      color: secondaryButtonTextColor
                    }}
                    className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      formTheme === 'soft-ui' ? 'rounded-full' : 'rounded'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    style={{
                      backgroundColor: primaryButtonColor,
                      color: primaryButtonTextColor
                    }}
                    className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      formTheme === 'soft-ui' ? 'rounded-full' : 'rounded'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Layout Settings Modal */}
      {showLayoutSettingsModal && selectedStepIndex !== null && steps[selectedStepIndex]?.question_type === 'image_selection' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${
            theme === 'light'
              ? 'bg-white'
              : 'bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10'
          }`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-white/5'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  theme === 'light' ? 'bg-orange-100' : 'bg-orange-500/20'
                }`}>
                  <Settings className={`w-5 h-5 ${
                    theme === 'light' ? 'text-orange-600' : 'text-orange-400'
                  }`} />
                </div>
                <h2 className={`text-xl font-semibold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  Layout Settings
                </h2>
              </div>
              <button
                onClick={() => setShowLayoutSettingsModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'light'
                    ? 'hover:bg-gray-200 text-gray-500'
                    : 'hover:bg-white/10 text-white/70'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${
                    theme === 'light' ? 'text-gray-700' : 'text-white/90'
                  }`}>Images per row</label>
                  <select
                    value={steps[selectedStepIndex].images_per_row || 2}
                    onChange={(e) => updateStep(selectedStepIndex, { 
                      ...steps[selectedStepIndex], 
                      images_per_row: parseInt(e.target.value) 
                    })}
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      theme === 'light'
                        ? 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'
                        : 'bg-white/10 border-white/20 text-white focus:ring-blue-400'
                    }`}
                  >
                    <option value={1} className={theme === 'light' ? 'bg-white' : 'bg-gray-800'}>1 (Full width)</option>
                    <option value={2} className={theme === 'light' ? 'bg-white' : 'bg-gray-800'}>2 (Default)</option>
                    <option value={3} className={theme === 'light' ? 'bg-white' : 'bg-gray-800'}>3 (Compact)</option>
                    <option value={4} className={theme === 'light' ? 'bg-white' : 'bg-gray-800'}>4 (Grid)</option>
                  </select>
                  <p className={`text-xs ${
                    theme === 'light' ? 'text-gray-500' : 'text-white/60'
                  }`}>
                    Controls how many image cards display per row. Use fewer for larger cards on mobile.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${
                    theme === 'light' ? 'text-gray-700' : 'text-white/90'
                  }`}>Crop images to square</label>
                  <select
                    value={steps[selectedStepIndex].crop_images_to_square ? 'true' : 'false'}
                    onChange={(e) => updateStep(selectedStepIndex, { 
                      ...steps[selectedStepIndex], 
                      crop_images_to_square: e.target.value === 'true' 
                    })}
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      theme === 'light'
                        ? 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'
                        : 'bg-white/10 border-white/20 text-white focus:ring-blue-400'
                    }`}
                  >
                    <option value="true" className={theme === 'light' ? 'bg-white' : 'bg-gray-800'}>Yes (Default)</option>
                    <option value="false" className={theme === 'light' ? 'bg-white' : 'bg-gray-800'}>No - Show full image ratio</option>
                  </select>
                  <p className={`text-xs ${
                    theme === 'light' ? 'text-gray-500' : 'text-white/60'
                  }`}>
                    When "No", images display in their original aspect ratio with top alignment.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t ${
                theme === 'light' ? 'border-gray-200' : 'border-white/10'
              }">
                <button
                  onClick={() => setShowLayoutSettingsModal(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
