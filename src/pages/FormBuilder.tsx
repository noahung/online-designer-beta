import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import FormPreview from '../components/FormPreview'
import SingleStepPreview from '../components/SingleStepPreview'
import SaveTemplateModal from '../components/templates/SaveTemplateModal'
import EmbedModal from '../components/ui/EmbedModal'
import LoadTemplateModal from '../components/templates/LoadTemplateModal'
import LogicBuilder from '../components/LogicBuilder'
import GlobalFlowchart from '../components/GlobalFlowchart'
import FormFlowchart from '../components/workflow/FormFlowchart'
import StudioHeader, { StudioTab, DeviceView } from '../components/builder/StudioHeader'
import StudioSidebar from '../components/builder/StudioSidebar'
import StudioCanvas from '../components/builder/StudioCanvas'
import StudioInspector from '../components/builder/StudioInspector'
import ShareEmbedStudio from '../components/builder/ShareEmbedStudio'
import { formThemes, FormTheme, parseThemeString, encodeThemeString, extractDesignMeta, encodeDescriptionWithMeta, cleanColorString } from '../lib/formThemes'
import { OpenAISettingsDrawer, SettingsDrawerTab } from '../components/builder/OpenAISettingsDrawer'
import { StepLogic } from '../types/formLogic'
import { evaluateStepLogic, cleanupDanglingLogicRules } from '../lib/logicEngine'
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
  Code,
  Undo,
  Redo,
  Repeat,
  BookmarkPlus,
  FolderOpen,
  Settings,
  CheckCircle2,
  AlertCircle,
  Send,
  Mail,
  Zap,
  ExternalLink
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
  question_type: 'image_selection' | 'multiple_choice' | 'text_input' | 'contact_fields' | 'file_upload' | 'dimensions' | 'opinion_scale' | 'frames_plan' | 'loop_section'
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
  images_per_row?: number // for image_selection step layout (default 2) - desktop columns
  mobile_images_per_row?: number // for image_selection step layout - mobile columns (default 1)
  crop_images_to_square?: boolean // whether to crop images to square aspect ratio (default true)
  // Frames plan specific fields
  frames_max_count?: number // maximum number of frames allowed (default 10)
  frames_require_image?: boolean // whether image upload is required for each frame
  frames_require_location?: boolean // whether location text is required for each frame  
  frames_require_measurements?: boolean // whether measurements are required for each frame
  // Contact fields visibility toggles
  contact_show_phone?: boolean
  contact_show_address?: boolean
  contact_show_project_details?: boolean
  contact_show_preferred_contact?: boolean
  contact_show_file_upload?: boolean
  // Loop section specific fields
  loop_start_step_id?: string // for loop_section: ID of first step in loop
  loop_end_step_id?: string // for loop_section: ID of last step in loop
  loop_label?: string // for loop_section: label for repeated item (e.g., "Window")
  loop_max_iterations?: number // for loop_section: max times user can loop (default 10)
  loop_button_text?: string // for loop_section: custom "Add Another" button text
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
  },
  {
    type: 'loop_section',
    title: 'Loop Section',
    description: 'Let users repeat a section multiple times',
    icon: <Repeat className="h-4 w-4" />
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
  const { theme } = useTheme()
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
      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${isSelected
        ? theme === 'light'
          ? 'bg-zinc-100 border-zinc-300 shadow-sm'
          : 'bg-zinc-800 border-zinc-700 shadow-sm'
        : theme === 'light'
          ? 'bg-white hover:bg-zinc-50 border-zinc-200'
          : 'bg-[#1e1e1f] hover:bg-zinc-800/60 border-zinc-800'
        } ${isDragging ? 'rotate-2 scale-105' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className={`cursor-grab active:cursor-grabbing p-1 transition-colors ${
              theme === 'light' ? 'text-zinc-400 hover:text-zinc-600' : 'text-white/50 hover:text-white/80'
            }`}
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-1" onClick={onClick}>
            <p className={`font-medium text-sm ${theme === 'light' ? 'text-zinc-800' : 'text-white'}`}>
              {step.title || `Step ${index + 1}`}
            </p>
            <p className={`text-xs capitalize mt-1 ${theme === 'light' ? 'text-zinc-500' : 'text-white/60'}`}>
              {step.question_type.replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-lg ${
            theme === 'light' ? 'text-zinc-600 bg-zinc-100' : 'text-white/50 bg-white/10'
          }`}>{index + 1}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPreview()
            }}
            className={`p-1 rounded-lg transition-all duration-200 hover:scale-110 ${
              theme === 'light' ? 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100' : 'text-white/40 hover:text-white hover:bg-white/10'
            }`}
            title="Preview this step"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate()
            }}
            className={`p-1 rounded-lg transition-all duration-200 hover:scale-110 ${
              theme === 'light' ? 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100' : 'text-white/40 hover:text-white hover:bg-white/10'
            }`}
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
              className={`p-1 rounded-lg transition-all duration-200 hover:scale-110 ${
                theme === 'light' ? 'text-zinc-400 hover:text-red-600 hover:bg-red-50' : 'text-white/40 hover:text-red-400 hover:bg-red-500/20'
              }`}
              title="Delete step"
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
              className={`rounded-lg border border-white/20 shadow-lg ${cropImagesToSquare
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
            className={`h-full w-full border-2 border-dashed rounded-lg transition-all duration-200 flex flex-col items-center justify-center space-y-2 group-hover:scale-105 ${isDraggingOver
              ? 'border-blue-400 bg-blue-500/20 scale-105'
              : 'border-white/30 hover:border-cyan-400/50 hover:bg-cyan-500/10'
              }`}
          >
            <Upload className={`h-8 w-8 transition-colors duration-200 ${isDraggingOver
              ? 'text-blue-300'
              : 'text-white/40 group-hover:text-cyan-300'
              }`} />
            <span className={`text-xs transition-colors duration-200 ${isDraggingOver
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
      className={`backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-200 ${theme === 'light'
        ? 'bg-white/80 border border-gray-200 shadow-lg'
        : 'bg-white/10 border border-white/20'
        }`}
      style={{ animationDelay }}
    >
      <button
        onClick={onToggle}
        className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors duration-200 ${theme === 'light'
          ? 'hover:bg-gray-50 text-gray-800'
          : 'hover:bg-white/5 text-white'
          }`}
      >
        <h3 className={`text-lg font-semibold flex items-center ${theme === 'light' ? 'text-gray-800' : 'text-white'
          }`}>
          {icon}
          {title}
        </h3>
        <div className="flex items-center">
          {isCollapsed ? (
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'
              }`} />
          ) : (
            <ChevronUp className={`w-5 h-5 transition-transform duration-200 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'
              }`} />
          )}
        </div>
      </button>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed
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
  const [clients, setClients] = useState<{
    id: string;
    name: string;
    logo_url?: string | null;
    webhook_url?: string | null;
    client_email?: string | null;
    additional_emails?: string[];
    email_notifications_enabled?: boolean;
  }[]>([])
  // Theme selection & styling
  const [formTheme, setFormTheme] = useState<FormTheme>('generic')
  const [buttonRadius, setButtonRadius] = useState<string>('xl')
  const [cardRadius, setCardRadius] = useState<string>('2xl')
  // Color customization states
  const [primaryButtonColor, setPrimaryButtonColor] = useState('#4F46E5')
  const [primaryButtonTextColor, setPrimaryButtonTextColor] = useState('#FFFFFF')
  const [secondaryButtonColor, setSecondaryButtonColor] = useState('#F1F5F9')
  const [secondaryButtonTextColor, setSecondaryButtonTextColor] = useState('#334155')
  const [headingColor, setHeadingColor] = useState<string | undefined>(undefined)
  const [descriptionColor, setDescriptionColor] = useState<string | undefined>(undefined)
  const [showProgressBar, setShowProgressBar] = useState<boolean>(true)
  const [steps, setSteps] = useState<Step[]>([])
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null)
  const [activeStudioTab, setActiveStudioTab] = useState<StudioTab>('content')
  const [deviceView, setDeviceView] = useState<DeviceView>('desktop')
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showSingleStepPreview, setShowSingleStepPreview] = useState(false)
  const [previewStepIndex, setPreviewStepIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const loadedFormIdRef = useRef<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showStepTypeDropdown, setShowStepTypeDropdown] = useState(false)

  // Template modal states
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [showLoadTemplateModal, setShowLoadTemplateModal] = useState(false)
  const [showLayoutSettingsModal, setShowLayoutSettingsModal] = useState(false)

  // Slide-in Settings & Design Drawer states
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false)
  const [settingsDrawerTab, setSettingsDrawerTab] = useState<SettingsDrawerTab>('theme')
  const [showFormSettingsModal, setShowFormSettingsModal] = useState(false)
  const [showFormThemeModal, setShowFormThemeModal] = useState(false)
  const [showButtonColoursModal, setShowButtonColoursModal] = useState(false)
  const [showEmbedModal, setShowEmbedModal] = useState(false)

  // Integrations state
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [webhookTestResult, setWebhookTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [savingIntegration, setSavingIntegration] = useState(false)

  // Logic modal state
  const [showLogicBuilder, setShowLogicBuilder] = useState(false)
  const [showGlobalFlowchart, setShowGlobalFlowchart] = useState(false)
  const [stepLogicMap, setStepLogicMap] = useState<Map<string, StepLogic>>(new Map())

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
        if (loadedFormIdRef.current !== formId) {
          loadedFormIdRef.current = formId
          loadExistingForm()
        }
      } else {
        loadedFormIdRef.current = null
        // For new forms, set initial load to false after a short delay to allow state to settle
        setTimeout(() => setIsInitialLoad(false), 100)
      }
    }
  }, [user?.id, formId])

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
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, logo_url, webhook_url, client_email, additional_emails, email_notifications_enabled')
      .eq('user_id', user.id)
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

      // Load step logic
      const { data: logicData, error: logicError } = await supabase
        .from('step_logic')
        .select('*')
        .eq('form_id', formId)

      if (logicError && logicError.code !== 'PGRST116') { // Ignore "not found" errors
        console.error('Error loading step logic:', logicError)
      }

      // Set form data
      setName(formData.name)
      setInternalName(formData.internal_name || '')
      const design = extractDesignMeta(formData.description, formData.form_theme)
      setDescription(design.cleanDescription)
      setWelcomeMessage(formData.welcome_message || '')
      setClientId(formData.client_id)
      const cleanPrimary = cleanColorString(formData.primary_button_color) || '#4F46E5'
      const cleanSecondary = cleanColorString(formData.secondary_button_color) || '#F1F5F9'
      setFormTheme(design.theme)
      setButtonRadius(design.buttonRadius)
      setCardRadius(design.cardRadius)
      setHeadingColor(design.headingColor)
      setDescriptionColor(design.descriptionColor)
      setShowProgressBar(design.showProgressBar)
      setPrimaryButtonColor(cleanPrimary)
      setPrimaryButtonTextColor(cleanColorString(formData.primary_button_text_color) || '#FFFFFF')
      setSecondaryButtonColor(cleanSecondary)
      setSecondaryButtonTextColor(cleanColorString(formData.secondary_button_text_color) || '#334155')
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
        mobile_images_per_row: step.mobile_images_per_row,
        crop_images_to_square: step.crop_images_to_square ?? true,
        frames_max_count: step.frames_max_count,
        frames_require_image: step.frames_require_image,
        frames_require_location: step.frames_require_location,
        frames_require_measurements: step.frames_require_measurements,
        contact_show_phone: step.contact_show_phone,
        contact_show_address: step.contact_show_address,
        contact_show_project_details: step.contact_show_project_details,
        contact_show_preferred_contact: step.contact_show_preferred_contact,
        contact_show_file_upload: step.contact_show_file_upload,
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

      // Convert logic data to Map (always reset to avoid stale keys after step ID changes)
      const logicMap = new Map<string, StepLogic>()
      if (logicData && logicData.length > 0) {
        logicData.forEach((logic: any) => {
          logicMap.set(logic.step_id, {
            step_id: logic.step_id,
            rules: logic.rules || [],
            default_action: logic.default_action || undefined
          })
        })
      }
      setStepLogicMap(logicMap)
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
      mobile_images_per_row: type === 'image_selection' ? 1 : undefined, // Default 1 column on mobile
      crop_images_to_square: type === 'image_selection' ? true : undefined, // Default to crop images to square
      // Frames plan defaults
      frames_max_count: type === 'frames_plan' ? 10 : undefined,
      frames_require_image: type === 'frames_plan' ? true : undefined,
      frames_require_location: type === 'frames_plan' ? true : undefined,
      frames_require_measurements: type === 'frames_plan' ? true : undefined,
      id: `temp_${Date.now()}` // Temporary ID for logic mapping before save
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
      id: `temp_${Date.now()}`, // Temporary ID for logic mapping before save
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
  const historyTimeoutRef = React.useRef<NodeJS.Timeout>();
  
  const saveToHistory = React.useCallback(() => {
    if (isInitialLoad) return
    
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current)
    }
    
    // Debounce history save by 500ms
    historyTimeoutRef.current = setTimeout(() => {
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
    }, 500)
  }, [isInitialLoad, steps, selectedStepIndex, name, internalName, description, welcomeMessage, clientId, formTheme, primaryButtonColor, primaryButtonTextColor, secondaryButtonColor, secondaryButtonTextColor])

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
      id: `temp_${Date.now()}`, // Temporary ID so logic rules can reference this option before it's saved
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
          mobile_images_per_row: step.mobile_images_per_row,
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
        mobile_images_per_row: template.mobile_images_per_row,
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
        mobile_images_per_row: template.mobile_images_per_row,
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
      const cleanPrimary = cleanColorString(primaryButtonColor)
      const cleanSecondary = cleanColorString(secondaryButtonColor)
      const cleanPrimaryText = cleanColorString(primaryButtonTextColor)
      const cleanSecondaryText = cleanColorString(secondaryButtonTextColor)
      const encodedDescription = encodeDescriptionWithMeta(description, {
        theme: formTheme,
        buttonRadius,
        cardRadius,
        headingColor: headingColor || undefined,
        descriptionColor: descriptionColor || undefined,
        showProgressBar,
      })
      const safeTheme = formTheme === 'soft-ui' ? 'soft-ui' : 'generic'

      if (isEditing && formId) {
        // Update existing form metadata
        const { error: formErr, data: updatedData } = await supabase.from('forms')
          .update({
            name,
            internal_name: internalName,
            description: encodedDescription,
            client_id: clientId,
            welcome_message: welcomeMessage,
            form_theme: safeTheme,
            primary_button_color: cleanPrimary,
            primary_button_text_color: cleanPrimaryText,
            secondary_button_color: cleanSecondary,
            secondary_button_text_color: cleanSecondaryText
          })
          .eq('id', formId)
          .select()

        console.log('[FormBuilder] Form metadata updated:', { formId, safeTheme, cleanPrimary, updatedData, formErr })

        if (formErr) throw formErr

        // Delete all existing step logic first (will be re-inserted below with correct IDs)
        await supabase.from('step_logic').delete().eq('form_id', formId)

        // Delete steps that were removed from the editor
        const { data: dbSteps } = await supabase.from('form_steps').select('id').eq('form_id', formId)
        const currentRealStepIds = new Set(
          steps.filter(s => s.id && !s.id.startsWith('temp_')).map(s => s.id!)
        )
        const stepIdsToDelete = (dbSteps || []).map(s => s.id).filter((id: string) => !currentRealStepIds.has(id))
        if (stepIdsToDelete.length > 0) {
          await supabase.from('form_steps').delete().in('id', stepIdsToDelete)
        }
      } else {
        // Create new form
        const { data: formData, error: formErr } = await supabase.from('forms').insert([{
          name,
          internal_name: internalName,
          description: encodedDescription,
          client_id: clientId,
          user_id: user.id,
          welcome_message: welcomeMessage,
          form_theme: safeTheme,
          primary_button_color: cleanPrimary,
          primary_button_text_color: cleanPrimaryText,
          secondary_button_color: cleanSecondary,
          secondary_button_text_color: cleanSecondaryText
        }]).select().single()

        if (formErr) throw formErr
        finalFormId = formData.id
      }

      // Maps temp IDs -> new real UUIDs (only for newly inserted steps)
      const idMap = new Map<string, string>()
      // Maps final step ID -> Map(old option ID -> new option ID)
      const optionIdMapByStep = new Map<string, Map<string, string>>()

      // Process each step: update existing ones in place (preserving UUIDs), insert new ones
      for (const step of steps) {
        const oldStepId = step.id
        let stepId: string

        if (step.id && !step.id.startsWith('temp_')) {
          // Existing step: UPDATE in place to preserve UUID (keeps logic references intact)
          stepId = step.id
          const { error: stepErr } = await supabase.from('form_steps')
            .update({
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
              mobile_images_per_row: step.mobile_images_per_row,
              crop_images_to_square: step.crop_images_to_square ?? true,
              frames_max_count: step.frames_max_count,
              frames_require_image: step.frames_require_image,
              frames_require_location: step.frames_require_location,
              frames_require_measurements: step.frames_require_measurements,
              contact_show_phone: step.contact_show_phone,
              contact_show_address: step.contact_show_address,
              contact_show_project_details: step.contact_show_project_details,
              contact_show_preferred_contact: step.contact_show_preferred_contact,
              contact_show_file_upload: step.contact_show_file_upload,
              loop_start_step_id: step.loop_start_step_id || null,
              loop_end_step_id: step.loop_end_step_id || null,
              loop_label: step.loop_label || null,
              loop_max_iterations: step.loop_max_iterations || null,
              loop_button_text: step.loop_button_text || null
            })
            .eq('id', stepId)
            .eq('form_id', finalFormId!)
          if (stepErr) throw stepErr

          // Delete existing options (will be recreated below)
          const { error: delOptErr } = await supabase.from('form_options').delete().eq('step_id', stepId)
          if (delOptErr) throw delOptErr
        } else {
          // New step: INSERT and track the temp→real ID mapping
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
            mobile_images_per_row: step.mobile_images_per_row,
            crop_images_to_square: step.crop_images_to_square ?? true,
            frames_max_count: step.frames_max_count,
            frames_require_image: step.frames_require_image,
            frames_require_location: step.frames_require_location,
            frames_require_measurements: step.frames_require_measurements,
            contact_show_phone: step.contact_show_phone,
            contact_show_address: step.contact_show_address,
            contact_show_project_details: step.contact_show_project_details,
            contact_show_preferred_contact: step.contact_show_preferred_contact,
            contact_show_file_upload: step.contact_show_file_upload,
            loop_start_step_id: step.loop_start_step_id || null,
            loop_end_step_id: step.loop_end_step_id || null,
            loop_label: step.loop_label || null,
            loop_max_iterations: step.loop_max_iterations || null,
            loop_button_text: step.loop_button_text || null
          }]).select().single()
          if (stepErr) throw stepErr
          stepId = stepData.id
          if (oldStepId) idMap.set(oldStepId, stepId)
        }

        // Insert options - resolve image URLs first (uploads must be sequential), then batch insert
        const resolvedOptions: Array<{ opt: typeof step.options[0]; image_url: string | null; order: number }> = []
        for (let oi = 0; oi < step.options.length; oi++) {
          const opt = step.options[oi]
          let image_url = opt.image_url || null
          if (opt.imageFile) {
            const bucket = 'form-assets'
            const filename = `${user.id}/${finalFormId}/${stepId}/${Date.now()}-${opt.imageFile.name}`
            const { error: upErr } = await supabase.storage.from(bucket).upload(filename, opt.imageFile)
            if (upErr) {
              console.error('Upload error details:', upErr)
              push({ type: 'error', message: `Image upload failed: ${upErr.message}` })
              image_url = `https://via.placeholder.com/300x200?text=${encodeURIComponent(opt.label)}`
            } else {
              const { data: pub } = await supabase.storage.from(bucket).getPublicUrl(filename)
              image_url = pub?.publicUrl || `https://via.placeholder.com/300x200?text=${encodeURIComponent(opt.label)}`
            }
          }
          resolvedOptions.push({ opt, image_url, order: oi + 1 })
        }

        // Batch insert all options for this step in one DB call
        if (resolvedOptions.length > 0) {
          const { data: insertedOpts, error: optErr } = await supabase.from('form_options').insert(
            resolvedOptions.map(({ opt, image_url, order }) => ({
              step_id: stepId,
              label: opt.label,
              image_url,
              jump_to_step: opt.jump_to_step ?? null,
              option_order: order
            }))
          ).select()
          if (optErr) throw optErr

          // Track old->new option ID mapping for logic condition updates (keyed by final step ID)
          if (insertedOpts) {
            const optionMap = new Map<string, string>()
            resolvedOptions.forEach(({ opt, order }) => {
              const matchedInserted = insertedOpts.find(
                (io: any) => io.option_order === order || (io.label && io.label === opt.label)
              )
              if (opt.id && matchedInserted?.id) {
                optionMap.set(opt.id, matchedInserted.id)
              }
            })
            optionIdMapByStep.set(stepId, optionMap)
          }
        }
      }

      // Build and save step logic
      const logicToInsert: any[] = []
      stepLogicMap.forEach((logic, mapStepId) => {
        // Resolve the final step ID:
        // - temp IDs were newly created → look up in idMap
        // - real UUIDs belong to existing steps → ID is unchanged
        let finalStepId: string
        if (idMap.has(mapStepId)) {
          finalStepId = idMap.get(mapStepId)!
        } else if (mapStepId && !mapStepId.startsWith('temp_')) {
          finalStepId = mapStepId
        } else {
          return // Orphaned temp ID (step was removed), skip
        }

        const optionIdMap = optionIdMapByStep.get(finalStepId) || new Map<string, string>()
        const currentStepObj = steps.find(s => s.id === mapStepId || idMap.get(s.id || '') === finalStepId)

        const updatedRules = logic.rules.map(rule => {
          let resolvedTargetId = rule.action.target_step_id
          if (resolvedTargetId) {
            if (idMap.has(resolvedTargetId)) {
              resolvedTargetId = idMap.get(resolvedTargetId)
            } else {
              // If target was saved as step_order, resolve to real step ID
              const stepByOrder = steps.find(s => String(s.step_order) === String(resolvedTargetId))
              if (stepByOrder?.id) {
                resolvedTargetId = idMap.get(stepByOrder.id) || stepByOrder.id
              }
            }
          }

          return {
            ...rule,
            step_id: finalStepId,
            conditions: rule.conditions.map(c => {
              const newOptionId = c.option_id ? (optionIdMap.get(c.option_id) || c.option_id) : undefined
              const optLabel = c.comparison_value || currentStepObj?.options?.find(o => o.id === c.option_id)?.label || ''
              return {
                ...c,
                option_id: newOptionId,
                comparison_value: optLabel || c.comparison_value
              }
            }),
            action: {
              ...rule.action,
              target_step_id: resolvedTargetId
            }
          }
        })

        let resolvedDefaultTargetId = logic.default_action?.action.target_step_id
        if (resolvedDefaultTargetId) {
          if (idMap.has(resolvedDefaultTargetId)) {
            resolvedDefaultTargetId = idMap.get(resolvedDefaultTargetId)
          } else {
            const stepByOrder = steps.find(s => String(s.step_order) === String(resolvedDefaultTargetId))
            if (stepByOrder?.id) {
              resolvedDefaultTargetId = idMap.get(stepByOrder.id) || stepByOrder.id
            }
          }
        }

        const updatedDefaultAction = logic.default_action ? {
          ...logic.default_action,
          action: {
            ...logic.default_action.action,
            target_step_id: resolvedDefaultTargetId
          }
        } : undefined

        if (updatedRules.length > 0 || updatedDefaultAction) {
          logicToInsert.push({
            step_id: finalStepId,
            form_id: finalFormId,
            rules: updatedRules,
            default_action: updatedDefaultAction || null
          })
        }
      })

      if (logicToInsert.length > 0) {
        const { error: logicErr } = await supabase.from('step_logic').insert(logicToInsert)
        if (logicErr) {
          console.error('Error saving step logic:', logicErr)
          push({ type: 'info', message: 'Form saved but logic rules may not have been saved' })
        }
      }

      push({ type: 'success', message: isEditing ? 'Form updated successfully' : 'Form created successfully' })

      // Reload form to sync IDs
      if (finalFormId) {
        if (!isEditing) {
          navigate(`/forms/${finalFormId}`)
        } else {
          loadExistingForm()
        }
      }
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
      let stepId = step.id && !step.id.startsWith('temp_') ? step.id : undefined

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
            mobile_images_per_row: step.mobile_images_per_row,
            crop_images_to_square: step.crop_images_to_square ?? true,
            frames_max_count: step.frames_max_count,
            frames_require_image: step.frames_require_image,
            frames_require_location: step.frames_require_location,
            frames_require_measurements: step.frames_require_measurements,
            contact_show_phone: step.contact_show_phone,
            contact_show_address: step.contact_show_address,
            contact_show_project_details: step.contact_show_project_details,
            contact_show_preferred_contact: step.contact_show_preferred_contact,
            contact_show_file_upload: step.contact_show_file_upload,
            loop_start_step_id: step.loop_start_step_id || null,
            loop_end_step_id: step.loop_end_step_id || null,
            loop_label: step.loop_label || null,
            loop_max_iterations: step.loop_max_iterations || null,
            loop_button_text: step.loop_button_text || null
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
            mobile_images_per_row: step.mobile_images_per_row,
            crop_images_to_square: step.crop_images_to_square ?? true,
            frames_max_count: step.frames_max_count,
            frames_require_image: step.frames_require_image,
            frames_require_location: step.frames_require_location,
            frames_require_measurements: step.frames_require_measurements,
            contact_show_phone: step.contact_show_phone,
            contact_show_address: step.contact_show_address,
            contact_show_project_details: step.contact_show_project_details,
            contact_show_preferred_contact: step.contact_show_preferred_contact,
            contact_show_file_upload: step.contact_show_file_upload,
            loop_start_step_id: step.loop_start_step_id || null,
            loop_end_step_id: step.loop_end_step_id || null,
            loop_label: step.loop_label || null,
            loop_max_iterations: step.loop_max_iterations || null,
            loop_button_text: step.loop_button_text || null
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

      // Track option ID mapping for logic updates
      const optionIdMap = new Map<string, string>()
      const newOptionsWithIds: Array<any> = []

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

        const { data: optData, error: optErr } = await supabase.from('form_options').insert([{
          step_id: stepId,
          label: opt.label,
          image_url,
          jump_to_step: opt.jump_to_step ?? null,
          option_order: step.options.indexOf(opt) + 1
        }]).select().single()
        
        if (optErr) throw optErr

        // Map old option ID to new option ID
        if (optData) {
          if (opt.id) optionIdMap.set(opt.id, optData.id)
          newOptionsWithIds.push({ ...opt, id: optData.id, image_url })
        }
      }

      // Update local state with new IDs immediately!
      // This fixes the issue where subsequent logic edits use old/undefined IDs
      setSteps(prevSteps => {
        const newSteps = [...prevSteps]
        newSteps[stepIndex] = { 
          ...newSteps[stepIndex], 
          id: stepId,
          options: newOptionsWithIds 
        }
        return newSteps
      })

      // Handle Step Logic
      // We must save logic here because saveStep recreates IDs which breaks existing logic links
      const oldStepId = step.id // Use original ID to look up logic
      if (oldStepId && stepLogicMap.has(oldStepId)) {
        const logic = stepLogicMap.get(oldStepId)
        
        // Check for temp IDs in targets (safeguard)
        const hasTempTargets = logic?.rules.some(r => r.action.target_step_id?.startsWith('temp_')) ||
                               logic?.default_action?.action.target_step_id?.startsWith('temp_')

        if (hasTempTargets) {
             push({ type: 'warning', message: 'Logic saved locally. Use "Save Form" to persist links to new steps.' })
        } else if (logic && (logic.rules.length > 0 || logic.default_action)) {
             // Delete existing logic for this step first
             await supabase.from('step_logic').delete().eq('step_id', stepId)
             
             // Map rules to use new IDs
             const mappedRules = logic.rules.map(r => ({
                 ...r, 
                 step_id: stepId!,
                 conditions: r.conditions.map(c => ({
                     ...c,
                     // Map option ID if it was recreated
                     option_id: c.option_id ? (optionIdMap.get(c.option_id) || c.option_id) : undefined
                 }))
             }))

             // Insert new logic
             const updatedDefaultAction = logic.default_action ? {...logic.default_action, step_id: stepId!} : null
             const { error: logicErr } = await supabase.from('step_logic').insert({
                 step_id: stepId,
                 form_id: formId,
                 rules: mappedRules,
                 default_action: updatedDefaultAction
             })
             
             if (logicErr) {
                 console.error('Error saving step logic:', logicErr)
             } else {
                 // Update stepLogicMap with remapped option IDs so that:
                 // 1. Re-opening the LogicBuilder shows the correct (current) option IDs
                 // 2. Subsequent saveStep calls use current IDs in optionIdMap (not stale ones)
                 const updatedLogic = {
                     ...logic,
                     step_id: stepId!,
                     rules: mappedRules,
                     default_action: updatedDefaultAction || undefined
                 }
                 setStepLogicMap(prev => {
                     const newMap = new Map(prev)
                     if (oldStepId !== stepId) newMap.delete(oldStepId)
                     newMap.set(stepId!, updatedLogic)
                     return newMap
                 })
             }
        } else if (oldStepId !== stepId && logic) {
             // Step ID changed (new step getting its first real DB ID) — update map key
             setStepLogicMap(prev => {
                 const newMap = new Map(prev)
                 newMap.delete(oldStepId)
                 newMap.set(stepId!, { ...logic, step_id: stepId! })
                 return newMap
             })
        }
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
        <div className={`backdrop-blur-xl rounded-2xl p-8 text-center animate-pulse ${theme === 'light'
          ? 'bg-white/80 border border-gray-200 shadow-lg'
          : 'bg-white/10 border border-white/20'
          }`}>
          <div className={`animate-spin rounded-full h-12 w-12 border-2 mx-auto mb-4 ${theme === 'light'
            ? 'border-gray-300 border-t-blue-600'
            : 'border-white/30 border-t-white'
            }`}></div>
          <p className={`font-medium ${theme === 'light' ? 'text-gray-700' : 'text-white/80'
            }`}>Loading form builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
      {/* Studio Header (Typeform + OpenAI) */}
      <StudioHeader
        formName={name}
        onFormNameChange={setName}
        activeTab={activeStudioTab}
        onTabChange={(tab) => {
          if (tab === 'results' && formId) {
            navigate(`/forms/${formId}/responses`)
          } else {
            setActiveStudioTab(tab)
          }
        }}
        deviceView={deviceView}
        onDeviceViewChange={setDeviceView}
        onSave={save}
        onPreview={async () => {
          await save()
          setShowPreview(true)
        }}
        onOpenDesign={() => {
          setSettingsDrawerTab('theme')
          setShowSettingsDrawer(true)
        }}
        onOpenShare={() => setActiveStudioTab('share')}
        onBack={() => navigate('/forms')}
        isSaving={saving}
        hasUnsavedChanges={false}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onUndo={undo}
        onRedo={redo}
      />

      {/* Main Studio Body Based on Active Tab */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Steps & Flow Navigation (Always persistent) */}
        <StudioSidebar
          steps={steps}
          activeStepIndex={selectedStepIndex ?? 0}
          onSelectStep={(idx) => {
            setSelectedStepIndex(idx)
            if (activeStudioTab !== 'content') setActiveStudioTab('content')
          }}
          onAddStep={() => setShowStepTypeDropdown(true)}
          onDuplicateStep={duplicateStep}
          onDeleteStep={deleteStep}
          onReorderSteps={handleDragEnd}
          welcomeScreen={{
            enabled: true,
            title: 'Welcome Screen',
          }}
          onToggleWelcomeScreen={() => {
            setSettingsDrawerTab('general')
            setShowSettingsDrawer(true)
          }}
          endingScreen={{
            title: 'A Thank you!',
          }}
        />

        {/* Tab 1: Content (Visual Editor Studio Canvas & Inspector) */}
        {activeStudioTab === 'content' && (
          <>
            {/* Center Canvas: Live Form Studio Card (Reflecting Theme & Button Styles Live!) */}
            <StudioCanvas
              currentStep={currentStep}
              deviceView={deviceView}
              onUpdateStep={(updates) => {
                if (selectedStepIndex !== null) {
                  updateStep(selectedStepIndex, { ...currentStep, ...updates } as Step)
                }
              }}
              onAddOption={() => {
                if (selectedStepIndex !== null) {
                  addOption(selectedStepIndex)
                }
              }}
              onUpdateOption={(optIdx, updates) => {
                if (selectedStepIndex !== null) {
                  updateOption(selectedStepIndex, optIdx, updates)
                }
              }}
              onDeleteOption={(optIdx) => {
                if (selectedStepIndex !== null) {
                  deleteOption(selectedStepIndex, optIdx)
                }
              }}
              onImageUpload={(optIdx, file) => {
                if (selectedStepIndex !== null) {
                  handleFileChange(selectedStepIndex, optIdx, file)
                }
              }}
              clientLogo={clients.find((c) => c.id === clientId)?.logo_url || undefined}
              formTheme={formTheme}
              primaryButtonColor={primaryButtonColor}
              primaryButtonTextColor={primaryButtonTextColor}
              secondaryButtonColor={secondaryButtonColor}
              secondaryButtonTextColor={secondaryButtonTextColor}
              buttonRadius={buttonRadius}
              cardRadius={cardRadius}
              headingColor={headingColor}
              descriptionColor={descriptionColor}
              showProgressBar={showProgressBar}
              totalSteps={steps.length || 1}
              currentStepIndex={selectedStepIndex ?? 0}
            />

            {/* Right Sidebar: Question Inspector & Logic */}
            <StudioInspector
              currentStep={currentStep}
              onUpdateStep={(updates) => {
                if (selectedStepIndex !== null) {
                  updateStep(selectedStepIndex, { ...currentStep, ...updates } as Step)
                }
              }}
              onOpenLogicBuilder={() => setShowLogicBuilder(true)}
              hasLogicRules={Boolean(stepLogicMap.get(currentStep?.id || '')?.rules?.length)}
              logicRuleCount={stepLogicMap.get(currentStep?.id || '')?.rules?.length || 0}
            />
          </>
        )}

        {/* Tab 2: Workflow (React Flow Interactive Flowchart) */}
        {activeStudioTab === 'workflow' && (
          <div className="flex-1 w-full h-full relative">
            <FormFlowchart
              steps={steps}
              stepLogicMap={stepLogicMap}
              onSelectStep={(id) => {
                const idx = steps.findIndex((s) => s.id === id)
                if (idx !== -1) {
                  setSelectedStepIndex(idx)
                  setActiveStudioTab('content')
                }
              }}
              onOpenLogicModal={(step) => {
                const idx = steps.findIndex((s) => s.id === step.id)
                if (idx !== -1) {
                  setSelectedStepIndex(idx)
                  setShowLogicBuilder(true)
                }
              }}
              selectedStepId={currentStep?.id}
            />
          </div>
        )}

        {/* Tab 3: Connect (OpenAI Platform-Style Form Integrations) */}
        {activeStudioTab === 'connect' && (() => {
          const currentClient = clients.find((c) => c.id === clientId)
          const webhookUrl = currentClient?.webhook_url || ''
          const emailEnabled = currentClient?.email_notifications_enabled ?? true
          const clientEmail = currentClient?.client_email || ''

          const handleSaveWebhook = async (url: string) => {
            if (!clientId) {
              push({ type: 'error', message: 'Please select a client workspace for this form first' })
              return
            }
            setSavingIntegration(true)
            try {
              const { error } = await supabase
                .from('clients')
                .update({ webhook_url: url.trim() || null })
                .eq('id', clientId)
              if (error) throw error
              setClients((prev) =>
                prev.map((c) => (c.id === clientId ? { ...c, webhook_url: url.trim() || null } : c))
              )
              push({ type: 'success', message: 'Zapier webhook URL updated successfully!' })
            } catch (err: any) {
              push({ type: 'error', message: `Failed to save webhook: ${err.message}` })
            } finally {
              setSavingIntegration(false)
            }
          }

          const handleSaveEmail = async (enabled: boolean, email: string) => {
            if (!clientId) {
              push({ type: 'error', message: 'Please select a client workspace for this form first' })
              return
            }
            setSavingIntegration(true)
            try {
              const { error } = await supabase
                .from('clients')
                .update({
                  email_notifications_enabled: enabled,
                  client_email: email.trim() || null,
                })
                .eq('id', clientId)
              if (error) throw error
              setClients((prev) =>
                prev.map((c) =>
                  c.id === clientId
                    ? { ...c, email_notifications_enabled: enabled, client_email: email.trim() || null }
                    : c
                )
              )
              push({ type: 'success', message: 'Email notification settings saved!' })
            } catch (err: any) {
              push({ type: 'error', message: `Failed to save email settings: ${err.message}` })
            } finally {
              setSavingIntegration(false)
            }
          }

          const handleSendTestWebhook = async () => {
            if (!webhookUrl) {
              push({ type: 'error', message: 'Please enter and save a Zapier webhook URL first' })
              return
            }
            setTestingWebhook(true)
            setWebhookTestResult(null)
            try {
              const testPayload = {
                event: 'form_submission_test',
                form_id: formId || 'test_form_id',
                form_name: name,
                client_name: currentClient?.name || 'Default Client',
                timestamp: new Date().toISOString(),
                test: true,
                data: {
                  contact_name: 'John Doe (Test)',
                  contact_email: 'john.doe@example.com',
                  contact_phone: '+44 7700 900077',
                  contact_postcode: 'SW1A 1AA',
                  answers: steps.map((s, idx) => ({
                    step_order: idx + 1,
                    question: s.title || `Step ${idx + 1}`,
                    question_type: s.question_type,
                    answer_text: s.options?.[0]?.label || 'Test Answer Value',
                  })),
                },
              }

              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testPayload),
                mode: 'no-cors',
              })

              setWebhookTestResult({
                success: true,
                message: 'Test payload successfully dispatched to Zapier webhook!',
              })
              push({ type: 'success', message: 'Test webhook sent successfully!' })
            } catch (err: any) {
              setWebhookTestResult({
                success: false,
                message: `Failed to send webhook: ${err.message || 'Network error'}`,
              })
              push({ type: 'error', message: `Webhook test failed: ${err.message}` })
            } finally {
              setTestingWebhook(false)
            }
          }

          return (
            <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-5xl mx-auto w-full space-y-7 font-sans bg-white dark:bg-[#0d0d0d]">
              {/* Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                    Integrations &amp; Workflows
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Connect form submission data to automated workflows, CRM pipelines, and notification channels.
                  </p>
                </div>
                {currentClient && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181b] text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Workspace: {currentClient.name}</span>
                  </div>
                )}
              </div>

              {/* Section 1: Automations & Data Routing (OpenAI Platform 3-Card Grid) */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
                  Automations &amp; Data Routing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Card 1: Zapier Webhook */}
                  <div className="rounded-xl p-4 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-amber-500">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            webhookUrl
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {webhookUrl ? 'Active' : 'Unset'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">
                          Zapier Automation Webhook
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                          Push every completed customer submission directly into your Zapier zaps and triggers.
                        </p>
                      </div>
                      <input
                        type="url"
                        defaultValue={webhookUrl}
                        key={webhookUrl}
                        id="zapier-card-input"
                        placeholder="https://hooks.zapier.com/..."
                        className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px] font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      />
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('zapier-card-input') as HTMLInputElement
                            if (el) handleSaveWebhook(el.value)
                          }}
                          disabled={savingIntegration}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/80 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleSendTestWebhook}
                          disabled={!webhookUrl || testingWebhook}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/80 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40"
                        >
                          <Send className="w-2.5 h-2.5 text-indigo-500" />
                          <span>{testingWebhook ? 'Testing...' : 'Test'}</span>
                        </button>
                      </div>
                      <a
                        href="https://zapier.com/apps/webhook/integrations"
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                        title="Open Zapier"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Card 2: Google Sheets Sync */}
                  <div className="rounded-xl p-4 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-emerald-500">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          Via Webhook
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">
                          Google Sheets Row Sync
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                          Append every customer design quote and submission as a new row in Google Sheets in real-time.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleSendTestWebhook}
                        disabled={!webhookUrl}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/80 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        <span>Send Test Row</span>
                      </button>
                      <span className="text-[10px] text-zinc-400">Automated</span>
                    </div>
                  </div>

                  {/* Card 3: Custom REST API Endpoint */}
                  <div className="rounded-xl p-4 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-blue-500">
                          <Code className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">JSON POST</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">
                          Custom REST Webhook
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                          Forward submissions to your backend API endpoint or Make.com scenario via raw JSON.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          const payload = JSON.stringify({
                            event: 'form_submission',
                            form_id: formId || 'form_id',
                            form_name: name,
                            client_name: currentClient?.name,
                            timestamp: new Date().toISOString(),
                          }, null, 2)
                          navigator.clipboard.writeText(payload)
                          push({ type: 'success', message: 'Schema copied to clipboard!' })
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/80 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        <span>Copy Schema</span>
                      </button>
                      <span className="text-[10px] text-zinc-400">REST v1</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Alerts & Team Communications */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
                  Alerts &amp; Notifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Card 4: Email Alerts */}
                  <div className="rounded-xl p-4 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-indigo-500">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            emailEnabled && clientEmail
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {emailEnabled && clientEmail ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">
                          Email Lead Notifications
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                          Instant email alerts with itemized product configurations sent directly to your sales team.
                        </p>
                      </div>
                      <input
                        type="email"
                        defaultValue={clientEmail}
                        key={clientEmail}
                        id="email-card-input"
                        placeholder="sales@company.com"
                        className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      />
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('email-card-input') as HTMLInputElement
                          if (el) handleSaveEmail(true, el.value)
                        }}
                        disabled={savingIntegration}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/80 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      >
                        Save Email
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEmail(!emailEnabled, clientEmail)}
                        className="text-[10px] font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
                      >
                        {emailEnabled ? 'Turn Off' : 'Turn On'}
                      </button>
                    </div>
                  </div>

                  {/* Card 5: HubSpot CRM */}
                  <div className="rounded-xl p-4 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-orange-500">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          CRM Sync
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">
                          HubSpot / CRM Deals
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                          Automatically creates new Contacts and Deals in HubSpot when customers submit their design.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleSendTestWebhook}
                        disabled={!webhookUrl}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/80 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40"
                      >
                        <Zap className="w-2.5 h-2.5 text-amber-500" />
                        <span>Trigger Sync</span>
                      </button>
                      <span className="text-[10px] text-zinc-400">Via Zapier</span>
                    </div>
                  </div>

                  {/* Card 6: Customer Auto-responder */}
                  <div className="rounded-xl p-4 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-purple-500">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          Automatic
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">
                          Customer Copy Email
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                          Sends a branded confirmation email copy with the chosen windows/doors specifications to the customer.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => push({ type: 'info', message: 'Configured automatically for all contact form submissions.' })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/80 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <span>Details</span>
                      </button>
                      <span className="text-[10px] text-emerald-500 font-medium">Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Webhook Test Alert Box */}
              {webhookTestResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in ${
                    webhookTestResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
                  }`}
                >
                  {webhookTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{webhookTestResult.message}</span>
                </div>
              )}
            </div>
          )
        })()}

        {/* Tab 4: Share & Embed Studio */}
        {activeStudioTab === 'share' && (
          <ShareEmbedStudio
            formId={formId}
            formName={name}
            clientName={clients.find((c) => c.id === clientId)?.name}
          />
        )}
      </div>

      {/* Add Step Type Modal */}
      {showStepTypeDropdown && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border transition-all ${theme === 'light'
            ? 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-200/50'
            : 'bg-[#18181b] border-zinc-800 text-zinc-100 shadow-black/70'
            }`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'light'
              ? 'border-zinc-100 bg-white'
              : 'border-zinc-800/80 bg-[#18181b]'
              }`}>
              <div>
                <h2 className={`text-base font-semibold tracking-tight ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>
                  Choose Step Type
                </h2>
                <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Select a step component to add to your multi-step flow
                </p>
              </div>
              <button
                onClick={() => setShowStepTypeDropdown(false)}
                className={`p-1.5 rounded-lg transition-colors ${theme === 'light'
                  ? 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                  }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content / Cards */}
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {stepTypes.map((stepType) => (
                  <button
                    key={stepType.type}
                    onClick={() => {
                      addStep(stepType.type)
                      setShowStepTypeDropdown(false)
                    }}
                    className={`group flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all duration-150 ${theme === 'light'
                      ? 'bg-white hover:bg-zinc-50/90 border-zinc-200/80 hover:border-zinc-300 shadow-sm'
                      : 'bg-zinc-900/50 hover:bg-zinc-800/80 border-zinc-800/90 hover:border-zinc-700'
                      }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${theme === 'light'
                      ? 'bg-zinc-100 border border-zinc-200/80 text-zinc-600 group-hover:text-zinc-900 group-hover:border-zinc-300'
                      : 'bg-zinc-800/90 border border-zinc-700/60 text-zinc-300 group-hover:text-white group-hover:border-zinc-600'
                      }`}>
                      {stepType.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm leading-snug ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-200 group-hover:text-white'}`}>
                        {stepType.title}
                      </p>
                      <p className={`text-xs mt-0.5 leading-relaxed ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                        {stepType.description}
                      </p>
                    </div>
                  </button>
                ))}

                {/* Create from Template Option */}
                <button
                  onClick={() => {
                    setShowStepTypeDropdown(false)
                    setShowLoadTemplateModal(true)
                  }}
                  className={`group flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all duration-150 ${theme === 'light'
                    ? 'bg-zinc-50/60 hover:bg-zinc-100/80 border-dashed border-zinc-300 hover:border-zinc-400'
                    : 'bg-zinc-900/40 hover:bg-zinc-800/60 border-dashed border-zinc-700 hover:border-zinc-600'
                    }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${theme === 'light'
                    ? 'bg-zinc-100 border border-zinc-200/80 text-zinc-600 group-hover:text-zinc-900 group-hover:border-zinc-300'
                    : 'bg-zinc-800/90 border border-zinc-700/60 text-zinc-300 group-hover:text-white group-hover:border-zinc-600'
                    }`}>
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm leading-snug ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-200 group-hover:text-white'}`}>
                        Create from Template
                      </p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                        theme === 'light' ? 'bg-zinc-200/60 text-zinc-600 border-zinc-300/80' : 'bg-zinc-800 text-zinc-400 border-zinc-700/80'
                      }`}>
                        Preset
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 leading-relaxed ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                      Use a saved template to create a new step
                    </p>
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

      {/* OpenAI-Style Settings & Design Slide-in Drawer */}
      <OpenAISettingsDrawer
        isOpen={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
        initialTab={settingsDrawerTab}
        formTitle={name}
        onChangeFormTitle={setName}
        internalName={internalName}
        onChangeInternalName={setInternalName}
        description={description}
        onChangeDescription={setDescription}
        welcomeMessage={welcomeMessage}
        onChangeWelcomeMessage={setWelcomeMessage}
        clientId={clientId}
        onChangeClientId={setClientId}
        clients={clients}
        formTheme={formTheme}
        onChangeFormTheme={setFormTheme}
        primaryButtonColor={primaryButtonColor}
        onChangePrimaryButtonColor={setPrimaryButtonColor}
        primaryButtonTextColor={primaryButtonTextColor}
        onChangePrimaryButtonTextColor={setPrimaryButtonTextColor}
        secondaryButtonColor={secondaryButtonColor}
        onChangeSecondaryButtonColor={setSecondaryButtonColor}
        secondaryButtonTextColor={secondaryButtonTextColor}
        onChangeSecondaryButtonTextColor={setSecondaryButtonTextColor}
        buttonRadius={buttonRadius}
        onChangeButtonRadius={setButtonRadius}
        cardRadius={cardRadius}
        onChangeCardRadius={setCardRadius}
        headingColor={headingColor}
        onChangeHeadingColor={setHeadingColor}
        descriptionColor={descriptionColor}
        onChangeDescriptionColor={setDescriptionColor}
        showProgressBar={showProgressBar}
        onChangeShowProgressBar={setShowProgressBar}
        systemTheme={theme}
        onSave={save}
        isSaving={saving}
      />

      {/* Button Colours Modal — kept for backwards compat but no longer shown via top bar */}
      {showButtonColoursModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${theme === 'light'
            ? 'bg-white border border-gray-200'
            : 'bg-slate-800 border border-white/20'
            }`}>
            <div className={`sticky top-0 px-6 py-4 border-b backdrop-blur-xl ${theme === 'light'
              ? 'bg-white/95 border-gray-200'
              : 'bg-slate-800/95 border-white/20'
              }`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-semibold flex items-center ${theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                  <svg className={`w-5 h-5 mr-2 ${theme === 'light' ? 'text-yellow-600' : 'text-yellow-400'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v11H4V4z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM6 8a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Button Colours
                </h2>
                <button
                  onClick={() => setShowButtonColoursModal(false)}
                  className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${theme === 'light'
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
                <div className={`text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-white/80'
                  }`}>Next Button</div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className={`block text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-white/70'
                      }`}>Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryButtonColor}
                        onChange={(e) => setPrimaryButtonColor(e.target.value)}
                        className={`w-10 h-10 rounded border cursor-pointer flex-shrink-0 ${theme === 'light' ? 'border-gray-300' : 'border-white/20'
                          }`}
                      />
                      <input
                        type="text"
                        value={primaryButtonColor}
                        onChange={(e) => setPrimaryButtonColor(e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent ${theme === 'light'
                          ? 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'
                          : 'bg-white/10 border-white/20 text-white focus:ring-blue-400'
                          }`}
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-white/70'
                      }`}>Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryButtonTextColor}
                        onChange={(e) => setPrimaryButtonTextColor(e.target.value)}
                        className={`w-10 h-10 rounded border cursor-pointer flex-shrink-0 ${theme === 'light' ? 'border-gray-300' : 'border-white/20'
                          }`}
                      />
                      <input
                        type="text"
                        value={primaryButtonTextColor}
                        onChange={(e) => setPrimaryButtonTextColor(e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent ${theme === 'light'
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
                <div className={`text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-white/80'
                  }`}>Previous Button</div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className={`block text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-white/70'
                      }`}>Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryButtonColor}
                        onChange={(e) => setSecondaryButtonColor(e.target.value)}
                        className={`w-10 h-10 rounded border cursor-pointer flex-shrink-0 ${theme === 'light' ? 'border-gray-300' : 'border-white/20'
                          }`}
                      />
                      <input
                        type="text"
                        value={secondaryButtonColor}
                        onChange={(e) => setSecondaryButtonColor(e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent ${theme === 'light'
                          ? 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'
                          : 'bg-white/10 border-white/20 text-white focus:ring-blue-400'
                          }`}
                        placeholder="#E5E7EB"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`block text-xs font-medium ${theme === 'light' ? 'text-gray-600' : 'text-white/70'
                      }`}>Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryButtonTextColor}
                        onChange={(e) => setSecondaryButtonTextColor(e.target.value)}
                        className={`w-10 h-10 rounded border cursor-pointer flex-shrink-0 ${theme === 'light' ? 'border-gray-300' : 'border-white/20'
                          }`}
                      />
                      <input
                        type="text"
                        value={secondaryButtonTextColor}
                        onChange={(e) => setSecondaryButtonTextColor(e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:border-transparent ${theme === 'light'
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
              <div className={`p-4 rounded-lg border ${theme === 'light'
                ? 'bg-gray-50 border-gray-200'
                : 'bg-white/5 border-white/10'
                }`}>
                <div className={`text-xs mb-3 ${theme === 'light' ? 'text-gray-600' : 'text-white/70'
                  }`}>Button Preview:</div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    style={{
                      backgroundColor: secondaryButtonColor,
                      color: secondaryButtonTextColor
                    }}
                    className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${formTheme === 'soft-ui' ? 'rounded-full' : 'rounded'
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
                    className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${formTheme === 'soft-ui' ? 'rounded-full' : 'rounded'
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

      {/* Embed Form Modal */}
      {showEmbedModal && formId && (
        <EmbedModal
          formId={formId}
          formName={name || 'Form'}
          isOpen={showEmbedModal}
          onClose={() => setShowEmbedModal(false)}
        />
      )}

      {/* Layout Settings Modal */}
      {showLayoutSettingsModal && selectedStepIndex !== null && steps[selectedStepIndex]?.question_type === 'image_selection' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${theme === 'light'
            ? 'bg-white border border-gray-200'
            : 'bg-[#1e1e1f] border border-zinc-800'
            }`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-white/10 bg-white/5'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-zinc-100' : 'bg-zinc-800'
                  }`}>
                  <Settings className={`w-5 h-5 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'
                    }`} />
                </div>
                <h2 className={`text-xl font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                  Layout Settings
                </h2>
              </div>
              <button
                onClick={() => setShowLayoutSettingsModal(false)}
                className={`p-2 rounded-lg transition-colors ${theme === 'light'
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
                  <label className={`block text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-white/90'
                    }`}>Desktop columns</label>
                  <select
                    value={steps[selectedStepIndex].images_per_row || 2}
                    onChange={(e) => updateStep(selectedStepIndex, {
                      ...steps[selectedStepIndex],
                      images_per_row: parseInt(e.target.value)
                    })}
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:border-transparent transition-all duration-200 ${theme === 'light'
                      ? 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'
                      : 'bg-white/10 border-white/20 text-white focus:ring-blue-400'
                      }`}
                  >
                    <option value={1} className={theme === 'light' ? 'bg-white' : 'bg-gray-800'}>1 (Full width)</option>
                    <option value={2} className={theme === 'light' ? 'bg-white' : 'bg-gray-800'}>2 (Default)</option>
                    <option value={3} className={theme === 'light' ? 'bg-white' : 'bg-gray-800'}>3 (Compact)</option>
                    <option value={4} className={theme === 'light' ? 'bg-white' : 'bg-gray-800'}>4 (Grid)</option>
                  </select>
                  <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-white/60'
                    }`}>
                    Number of columns on wider screens (≥768px).
                  </p>
                </div>

                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-white/90'
                    }`}>Mobile columns</label>
                  <select
                    value={steps[selectedStepIndex].mobile_images_per_row || 1}
                    onChange={(e) => updateStep(selectedStepIndex, {
                      ...steps[selectedStepIndex],
                      mobile_images_per_row: parseInt(e.target.value)
                    })}
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:border-transparent transition-all duration-200 ${theme === 'light'
                      ? 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'
                      : 'bg-white/10 border-white/20 text-white focus:ring-blue-400'
                      }`}
                  >
                    <option value={1} className={theme === 'light' ? 'bg-white' : 'bg-gray-800'}>1 (Default)</option>
                    <option value={2} className={theme === 'light' ? 'bg-white' : 'bg-gray-800'}>2 (Side by side)</option>
                    <option value={3} className={theme === 'light' ? 'bg-white' : 'bg-gray-800'}>3 (Compact)</option>
                  </select>
                  <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-white/60'
                    }`}>
                    Number of columns on narrow screens (&lt;768px). Set to 2 to show 2 cards side-by-side on mobile.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-white/90'
                    }`}>Crop images to square</label>
                  <select
                    value={steps[selectedStepIndex].crop_images_to_square ? 'true' : 'false'}
                    onChange={(e) => updateStep(selectedStepIndex, {
                      ...steps[selectedStepIndex],
                      crop_images_to_square: e.target.value === 'true'
                    })}
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:border-transparent transition-all duration-200 ${theme === 'light'
                      ? 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500'
                      : 'bg-white/10 border-white/20 text-white focus:ring-blue-400'
                      }`}
                  >
                    <option value="true" className={theme === 'light' ? 'bg-white' : 'bg-gray-800'}>Yes (Default)</option>
                    <option value="false" className={theme === 'light' ? 'bg-white' : 'bg-gray-800'}>No - Show full image ratio</option>
                  </select>
                  <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-white/60'
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'light'
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

      {/* Logic Builder Modal */}
      {showLogicBuilder && currentStep && (
        <LogicBuilder
          currentStep={currentStep}
          allSteps={steps}
          stepLogic={stepLogicMap.get(currentStep.id || '') || null}
          onSave={async (logic) => {
            const stepId = currentStep.id || ''
            setStepLogicMap(prev => {
              const newMap = new Map(prev)
              newMap.set(stepId, logic)
              return newMap
            })

            // Immediately persist to DB if form and step exist so preview/embed gets fresh rules
            if (formId && stepId && !stepId.startsWith('temp_')) {
              try {
                await supabase.from('step_logic').delete().eq('step_id', stepId)
                if ((logic.rules && logic.rules.length > 0) || logic.default_action) {
                  await supabase.from('step_logic').insert({
                    step_id: stepId,
                    form_id: formId,
                    rules: logic.rules,
                    default_action: logic.default_action || null
                  })
                }
              } catch (err) {
                console.error('Error auto-saving step logic:', err)
              }
            }
            push({ type: 'success', message: 'Logic rules applied and saved' })
          }}
          onClose={() => setShowLogicBuilder(false)}
        />
      )}

      {/* Global Flowchart Modal */}
      {showGlobalFlowchart && (
        <GlobalFlowchart
          steps={steps}
          stepLogicMap={stepLogicMap}
          onClose={() => setShowGlobalFlowchart(false)}
          onEditLogic={(step) => {
            const index = steps.findIndex(s => s.id === step.id)
            if (index !== -1) {
              setSelectedStepIndex(index)
              setShowGlobalFlowchart(false) // Close map to open editor
              setShowLogicBuilder(true)
            }
          }}
        />
      )}
    </div>
  )
}
