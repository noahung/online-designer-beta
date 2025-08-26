import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import FormPreview from '../components/FormPreview'
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
  User
} from 'lucide-react'

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
  question_type: 'image_selection' | 'multiple_choice' | 'text_input' | 'contact_fields' | 'file_upload'
  is_required?: boolean
  step_order: number
  options: Option[]
  max_file_size?: number // in MB
  allowed_file_types?: string[] // array of mime types
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
    type: 'contact_fields',
    title: 'Contact Information',
    description: 'Collect contact details from users',
    icon: <User className="h-4 w-4" />
  }
]

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
  const [steps, setSteps] = useState<Step[]>([])
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => { 
    if (user) {
      fetchClients()
      if (formId) {
        loadExistingForm()
      }
    }
  }, [user, formId])

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
      allowed_file_types: type === 'file_upload' ? ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] : undefined
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
            welcome_message: welcomeMessage 
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
          welcome_message: welcomeMessage
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
          allowed_file_types: step.allowed_file_types
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
            allowed_file_types: step.allowed_file_types
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
            allowed_file_types: step.allowed_file_types
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

            {/* Form Steps */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-purple-400" />
                  Form Steps
                </h3>
                <div className="flex space-x-1">
                  {stepTypes.map((stepType) => (
                    <button
                      key={stepType.type}
                      onClick={() => addStep(stepType.type)}
                      title={`Add ${stepType.title}`}
                      className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-200 text-white/80 hover:text-white hover:scale-110 shadow-lg"
                    >
                      {stepType.icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedStepIndex(index)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border backdrop-blur-sm ${
                      selectedStepIndex === index
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30 shadow-lg shadow-blue-500/25'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-white">
                          {step.title || `Step ${index + 1}`}
                        </p>
                        <p className="text-xs text-white/60 capitalize mt-1">
                          {step.question_type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-lg">{index + 1}</span>
                        {steps.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteStep(index)
                            }}
                            className="p-1 text-white/40 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200 hover:scale-110"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
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
