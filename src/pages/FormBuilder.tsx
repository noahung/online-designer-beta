import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import FormPreview from '../components/FormPreview'
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
  Palette
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
  question_type: 'image_selection' | 'multiple_choice' | 'text_input' | 'contact_fields' | 'file_upload' | 'dimensions' | 'opinion_scale'
  is_required?: boolean
  step_order: number
  options: Option[]
  max_file_size?: number // in MB
  allowed_file_types?: string[] // array of mime types
  dimension_type?: '2d' | '3d' // for dimensions step
  scale_type?: 'number' | 'star' // for opinion scale step
  scale_min?: number // minimum scale value (default 1)
  scale_max?: number // maximum scale value (default 10 for number, 5 for star)
  images_per_row?: number // for image_selection step layout (default 2)
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
  }
]

// Sortable Step Item Component
interface SortableStepItemProps {
  step: Step
  index: number
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
  canDelete: boolean
}

function SortableStepItem({ step, index, isSelected, onClick, onDelete, canDelete }: SortableStepItemProps) {
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

export default function FormBuilder() {
  const { user } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const { id: formId } = useParams() // Get form ID from URL params for editing
  const [name, setName] = useState('Window & Door Designer Tool')
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
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showStepTypeDropdown, setShowStepTypeDropdown] = useState(false)

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
      }
    }
  }

  useEffect(() => { 
    if (user) {
      fetchClients()
      if (formId) {
        loadExistingForm()
      }
    }
  }, [user, formId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showStepTypeDropdown && event.target instanceof Element) {
        const dropdown = document.querySelector('.step-type-dropdown')
        if (dropdown && !dropdown.contains(event.target)) {
          setShowStepTypeDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStepTypeDropdown])

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
        question_type: step.question_type as Step['question_type'],
        step_order: step.step_order,
        is_required: step.is_required,
        max_file_size: step.max_file_size,
        allowed_file_types: step.allowed_file_types,
        dimension_type: step.dimension_type,
        scale_type: step.scale_type,
        scale_min: step.scale_min,
        scale_max: step.scale_max,
        images_per_row: step.images_per_row,
        options: (step.form_options || []).map((option: any) => ({
          id: option.id,
          label: option.label,
          description: '',
          image_url: option.image_url,
          jump_to_step: option.jump_to_step
        }))
      }))

      setSteps(convertedSteps)
      push({ type: 'success', message: 'Form loaded successfully' })
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
      images_per_row: type === 'image_selection' ? 2 : undefined // Default 2 images per row
    }
    const newSteps = [...steps, newStep]
    setSteps(newSteps)
    setSelectedStepIndex(newSteps.length - 1)
  }

  const updateStep = (index: number, updatedStep: Step) => {
    const newSteps = [...steps]
    newSteps[index] = updatedStep
    setSteps(newSteps)
  }

  const deleteStep = (index: number) => {
    if (steps.length <= 1) return
    const newSteps = steps.filter((_, i) => i !== index)
    setSteps(newSteps.map((st, i) => ({ ...st, step_order: i + 1 })))
    if (selectedStepIndex === index) {
      setSelectedStepIndex(Math.max(0, Math.min(index, newSteps.length - 1)))
    }
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

  const handleFileChange = (stepIndex: number, optionIndex: number, file: File | null) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return
    const step = steps[stepIndex]
    const option = step.options[optionIndex]
    if (!option) return
    
    const preview = file ? URL.createObjectURL(file) : undefined
    const updatedOption = {
      ...option,
      imageFile: file,
      image_url: preview ?? option.image_url
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
          question_type: step.question_type, 
          is_required: step.is_required ?? true, 
          step_order: step.step_order,
          max_file_size: step.max_file_size,
          allowed_file_types: step.allowed_file_types,
          dimension_type: step.dimension_type,
          scale_type: step.scale_type,
          scale_min: step.scale_min,
          scale_max: step.scale_max,
          images_per_row: step.images_per_row
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
      navigate('/forms')
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
            question_type: step.question_type, 
            is_required: step.is_required ?? true, 
            step_order: step.step_order,
            max_file_size: step.max_file_size,
            allowed_file_types: step.allowed_file_types,
            scale_type: step.scale_type,
            scale_min: step.scale_min,
            scale_max: step.scale_max
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
            question_type: step.question_type, 
            is_required: step.is_required ?? true, 
            step_order: step.step_order,
            max_file_size: step.max_file_size,
            allowed_file_types: step.allowed_file_types,
            scale_type: step.scale_type,
            scale_min: step.scale_min,
            scale_max: step.scale_max
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

  const debugStorageConnection = async () => {
    push({ type: 'info', message: 'Testing Supabase connection...' })
    
    try {
      // Test 1: Basic auth
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Auth error:', userError)
        push({ type: 'error', message: `❌ Auth issue: ${userError.message}` })
        return
      }
      
      if (user) {
        push({ type: 'success', message: `✅ Authenticated as: ${user.email}` })
      } else {
        push({ type: 'error', message: '❌ Not authenticated' })
        return
      }

      // Test 2: Try direct upload test
      push({ type: 'info', message: 'Testing direct file upload...' })
      
      // Create a tiny test file
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const testFilename = `test-${Date.now()}.txt`
      
      const { error: uploadError } = await supabase.storage
        .from('form-assets')
        .upload(testFilename, testFile)
      
      if (uploadError) {
        console.error('Upload test failed:', uploadError)
        push({ type: 'error', message: `❌ Upload test failed: ${uploadError.message}` })
      } else {
        push({ type: 'success', message: '✅ Upload test successful! Storage is working!' })
        
        // Clean up test file
        await supabase.storage.from('form-assets').remove([testFilename])
        push({ type: 'success', message: '✅ Storage fully functional - image uploads should work' })
      }
      
    } catch (error) {
      console.error('Debug error:', error)
      push({ type: 'error', message: `❌ Connection test failed: ${error}` })
    }
  }

  const currentStep = selectedStepIndex !== null ? steps[selectedStepIndex] : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 text-center animate-pulse">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white mx-auto mb-4"></div>
          <p className="text-white/80 font-medium">Loading form builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/10 backdrop-blur-xl px-6 py-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/forms')}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-orange-100 to-red-200 bg-clip-text text-transparent">
                {isEditing ? 'Edit Form: ' : 'Create Form: '}{name || 'Untitled Form'}
              </h1>
              {clientId && (
                <p className="text-white/70 mt-1">
                  {clients.find(c => c.id === clientId)?.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={debugStorageConnection}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-200 rounded-xl border border-cyan-400/30 text-sm transition-all duration-200 hover:scale-105 shadow-lg"
            >
              🔍 Test Storage
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-200 rounded-xl border border-purple-400/30 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Form'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar */}
        <div className="w-[400px] border-r border-white/10 bg-white/5 backdrop-blur-sm overflow-y-auto animate-slide-in-left">
          <div className="p-6 space-y-6">
            {/* Form Settings */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 animate-fade-in" style={{animationDelay: '0.1s'}}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-400" />
                Form Settings
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">Form Title</label>
                  <input
                    type="text"
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter form title"
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your form"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">Welcome Message</label>
                  <textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Welcome message for form users"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">Client</label>
                  <select 
                    value={clientId ?? ''} 
                    onChange={e => setClientId(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                  >
                    <option value="" className="bg-slate-800 text-white">Select client</option>
                    {clients.map(c => <option key={c.id} value={c.id} className="bg-slate-800 text-white">{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 animate-fade-in" style={{animationDelay: '0.125s'}}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2 text-purple-400" />
                Form Theme
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-white/70 mb-4">Choose how your form appears to users</p>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(formThemes).map(([themeKey, theme]) => (
                    <button
                      key={themeKey}
                      onClick={() => setFormTheme(themeKey as keyof typeof formThemes)}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left overflow-hidden ${
                        formTheme === themeKey
                          ? 'border-purple-400 bg-purple-400/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      {/* Theme Background Effect */}
                      {themeKey === 'soft-ui' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/10 to-purple-100/10 pointer-events-none" />
                      )}
                      
                      <div className="relative flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{theme.name}</h4>
                          <p className="text-sm text-white/70 mb-4">{theme.description}</p>
                          
                          {/* Enhanced Theme Preview */}
                          <div className="space-y-3">
                            {/* Form Card Preview */}
                            <div className={`p-3 ${
                              themeKey === 'soft-ui' 
                                ? 'bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20' 
                                : 'bg-white/90 rounded-lg border border-gray-200'
                            }`}>
                              {/* Input Field Preview */}
                              <div className={`h-3 mb-2 ${
                                themeKey === 'soft-ui' 
                                  ? 'bg-white/60 backdrop-blur-sm rounded-xl border border-white/30' 
                                  : 'bg-gray-100 border border-gray-300 rounded-md'
                              }`} />
                              
                              {/* Button Preview */}
                              <div className="flex gap-2 mt-3">
                                <div className={`h-2.5 w-16 ${
                                  themeKey === 'soft-ui' 
                                    ? 'bg-white/70 backdrop-blur-sm rounded-full border border-white/40' 
                                    : 'bg-gray-300 rounded-md'
                                }`} />
                                <div className={`h-2.5 w-12 ${
                                  themeKey === 'soft-ui' 
                                    ? 'bg-gradient-to-r from-blue-400/80 to-purple-500/80 rounded-full shadow-sm' 
                                    : theme.preview.primaryColor + ' rounded-md'
                                }`} />
                              </div>
                            </div>
                            
                            {/* Typography Preview */}
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
                            <div className="w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center">
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

            {/* Color Customization */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 animate-fade-in" style={{animationDelay: '0.15s'}}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v11H4V4z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM6 8a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Button Colors
              </h3>
              <div className="space-y-6">
                {/* Primary Button Colors */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-white/80">Next Button</div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-white/70">Background Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryButtonColor}
                          onChange={(e) => setPrimaryButtonColor(e.target.value)}
                          className="w-8 h-8 rounded border border-white/20 cursor-pointer flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={primaryButtonColor}
                          onChange={(e) => setPrimaryButtonColor(e.target.value)}
                          className="flex-1 px-2 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded text-white text-xs focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-white/70">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryButtonTextColor}
                          onChange={(e) => setPrimaryButtonTextColor(e.target.value)}
                          className="w-8 h-8 rounded border border-white/20 cursor-pointer flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={primaryButtonTextColor}
                          onChange={(e) => setPrimaryButtonTextColor(e.target.value)}
                          className="flex-1 px-2 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded text-white text-xs focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Button Colors */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-white/80">Previous Button</div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-white/70">Background Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={secondaryButtonColor}
                          onChange={(e) => setSecondaryButtonColor(e.target.value)}
                          className="w-8 h-8 rounded border border-white/20 cursor-pointer flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={secondaryButtonColor}
                          onChange={(e) => setSecondaryButtonColor(e.target.value)}
                          className="flex-1 px-2 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded text-white text-xs focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                          placeholder="#E5E7EB"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-white/70">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={secondaryButtonTextColor}
                          onChange={(e) => setSecondaryButtonTextColor(e.target.value)}
                          className="w-8 h-8 rounded border border-white/20 cursor-pointer flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={secondaryButtonTextColor}
                          onChange={(e) => setSecondaryButtonTextColor(e.target.value)}
                          className="flex-1 px-2 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded text-white text-xs focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                          placeholder="#374151"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-xs text-white/70 mb-3">Button Preview:</div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      style={{
                        backgroundColor: secondaryButtonColor,
                        color: secondaryButtonTextColor
                      }}
                      className={`px-3 py-2 text-xs font-medium transition-colors duration-200 ${
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
                      className={`px-3 py-2 text-xs font-medium transition-colors duration-200 ${
                        formTheme === 'soft-ui' ? 'rounded-full' : 'rounded'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Steps */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-purple-400" />
                  Form Steps
                </h3>
                <div className="relative">
                  <button
                    onClick={() => setShowStepTypeDropdown(!showStepTypeDropdown)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/30 text-blue-200 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Step
                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${showStepTypeDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showStepTypeDropdown && (
                    <div className="step-type-dropdown absolute right-0 top-full mt-2 w-64 bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl z-50 overflow-hidden">
                      {stepTypes.map((stepType) => (
                        <button
                          key={stepType.type}
                          onClick={() => {
                            addStep(stepType.type)
                            setShowStepTypeDropdown(false)
                          }}
                          className="w-full flex items-center px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-white/10 last:border-b-0"
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-lg mr-3 flex-shrink-0">
                            {stepType.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm">{stepType.title}</p>
                            <p className="text-white/60 text-xs truncate">{stepType.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
            </div>
          </div>
        </div>

        {/* Main Editor Panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {currentStep ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    Step {selectedStepIndex! + 1} - {currentStep.question_type.replace('_', ' ')}
                  </h2>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/90">Step Title</label>
                    <input
                      type="text"
                      value={currentStep.title} 
                      onChange={(e) => updateStep(selectedStepIndex!, { ...currentStep, title: e.target.value })}
                      placeholder="What are you looking for?"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                    />
                  </div>

                  {currentStep.question_type === 'image_selection' && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <label className="block text-sm font-medium text-white/90 mb-3">Layout Settings</label>
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-white/70">Images per row</label>
                        <select
                          value={currentStep.images_per_row || 2}
                          onChange={(e) => updateStep(selectedStepIndex!, { 
                            ...currentStep, 
                            images_per_row: parseInt(e.target.value) 
                          })}
                          className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm focus:ring-1 focus:ring-blue-400 focus:border-transparent"
                        >
                          <option value={1} className="bg-gray-800">1 (Full width)</option>
                          <option value={2} className="bg-gray-800">2 (Default)</option>
                          <option value={3} className="bg-gray-800">3 (Compact)</option>
                          <option value={4} className="bg-gray-800">4 (Grid)</option>
                        </select>
                        <div className="text-xs text-white/60">
                          Controls how many image cards display per row. Use fewer for larger cards on mobile.
                        </div>
                      </div>
                    </div>
                  )}

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
                      
                      <div className="space-y-4">
                        {currentStep.options.map((option, optIndex) => (
                          <div key={optIndex} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all duration-200">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-3">
                                  <input
                                    type="text"
                                    value={option.label}
                                    onChange={(e) => updateOption(selectedStepIndex!, optIndex, { ...option, label: e.target.value })}
                                    placeholder="Option label"
                                    className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15 font-medium"
                                  />
                                  <textarea
                                    value={option.description || ''}
                                    onChange={(e) => updateOption(selectedStepIndex!, optIndex, { ...option, description: e.target.value })}
                                    placeholder="Option description"
                                    rows={2}
                                    className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15 text-sm resize-none"
                                  />
                                </div>
                                <div className="ml-4 space-y-3">
                                  <button
                                    onClick={() => deleteOption(selectedStepIndex!, optIndex)}
                                    className="p-2 text-white/40 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all duration-200 hover:scale-110"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              {currentStep.question_type === 'image_selection' && (
                                <div className="space-y-3 mt-4">
                                  <div className="flex items-center space-x-3">
                                    <label className="text-sm text-white/90">Image</label>
                                    <button
                                      onClick={() => {
                                        const input = document.createElement('input')
                                        input.type = 'file'
                                        input.accept = 'image/*'
                                        input.onchange = (e) => {
                                          const file = (e.target as HTMLInputElement).files?.[0] || null
                                          handleFileChange(selectedStepIndex!, optIndex, file)
                                        }
                                        input.click()
                                      }}
                                      className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-200 rounded-xl border border-cyan-400/30 transition-all duration-200 hover:scale-105 shadow-lg text-sm"
                                    >
                                      <Upload className="mr-2 h-4 w-4" />
                                      Upload Image
                                    </button>
                                  </div>
                                  {option.image_url && (
                                    <div className="relative inline-block">
                                      <img 
                                        src={option.image_url} 
                                        alt="Option preview" 
                                        className="h-24 w-32 object-cover rounded-xl border border-white/20 shadow-lg"
                                      />
                                      <button
                                        onClick={() => updateOption(selectedStepIndex!, optIndex, { ...option, image_url: undefined, imageFile: null })}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-full transition-all duration-200 hover:scale-110 shadow-lg"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="space-y-2 mt-4">
                                <label className="block text-xs text-white/70">Jump to step (optional)</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={steps.length}
                                  value={option.jump_to_step ?? ''}
                                  onChange={(e) => updateOption(selectedStepIndex!, optIndex, { 
                                    ...option, 
                                    jump_to_step: e.target.value ? Number(e.target.value) : undefined 
                                  })}
                                  placeholder="Step number"
                                  className="w-24 px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 hover:bg-white/15 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStep.question_type === 'file_upload' && (
                    <div className="space-y-4">
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

                  {currentStep.question_type === 'dimensions' && (
                    <div className="space-y-4">
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
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center animate-fade-in">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                  <MessageSquare className="w-8 h-8 text-white/60" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">No step selected</h3>
                <p className="text-white/70 mb-8 text-lg">Create a step to start building your form</p>
                <div className="flex flex-wrap justify-center gap-4">
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Preview Modal */}
      <FormPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        formName={name}
        steps={steps}
      />
    </div>
  )
}
