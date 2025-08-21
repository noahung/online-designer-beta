import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
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
  X
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
  question_type: 'image_selection' | 'multiple_choice' | 'text_input' | 'contact_fields'
  is_required?: boolean
  step_order: number
  options: Option[] 
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
      ] : []
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
          step_order: step.step_order 
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
            step_order: step.step_order 
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
            step_order: step.step_order 
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/forms')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {isEditing ? 'Edit Form: ' : 'Create Form: '}{name || 'Untitled Form'}
              </h1>
              {clientId && (
                <p className="text-sm text-slate-500">
                  {clients.find(c => c.id === clientId)?.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={debugStorageConnection}>
              🔍 Test Storage
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button onClick={save} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Form'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar */}
        <div className="w-[400px] border-r bg-white overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Form Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Form Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="form-title">Form Title</Label>
                  <Input 
                    id="form-title"
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter form title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-description">Description</Label>
                  <Textarea 
                    id="form-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your form"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcome-message">Welcome Message</Label>
                  <Textarea 
                    id="welcome-message"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Welcome message for form users"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-select">Client</Label>
                  <select 
                    id="client-select"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2" 
                    value={clientId ?? ''} 
                    onChange={e => setClientId(e.target.value)}
                  >
                    <option value="">Select client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Form Steps */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Form Steps</CardTitle>
                  <div className="flex space-x-1">
                    {stepTypes.map((stepType) => (
                      <Button 
                        key={stepType.type}
                        variant="outline" 
                        size="sm"
                        onClick={() => addStep(stepType.type)}
                        title={`Add ${stepType.title}`}
                      >
                        {stepType.icon}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedStepIndex(index)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                        selectedStepIndex === index
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-slate-50 hover:bg-slate-100 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-slate-900">
                            {step.title || `Step ${index + 1}`}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">
                            {step.question_type.replace('_', ' ')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-400">{index + 1}</span>
                          {steps.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteStep(index)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {steps.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-500 mb-4">No steps added yet</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {stepTypes.map((stepType) => (
                          <Button 
                            key={stepType.type}
                            variant="outline" 
                            size="sm"
                            onClick={() => addStep(stepType.type)}
                          >
                            {stepType.icon}
                            <span className="ml-1">{stepType.title}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Editor Panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {currentStep ? (
              <Card>
                <CardHeader>
                  <CardTitle>Step {selectedStepIndex! + 1} - {currentStep.question_type.replace('_', ' ')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="step-title">Step Title</Label>
                    <Input 
                      id="step-title"
                      value={currentStep.title} 
                      onChange={(e) => updateStep(selectedStepIndex!, { ...currentStep, title: e.target.value })}
                      placeholder="What are you looking for?"
                    />
                  </div>

                  {(currentStep.question_type === 'image_selection' || currentStep.question_type === 'multiple_choice') && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Options</Label>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addOption(selectedStepIndex!)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Option
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {currentStep.options.map((option, optIndex) => (
                          <Card key={optIndex} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                  <Input
                                    value={option.label}
                                    onChange={(e) => updateOption(selectedStepIndex!, optIndex, { ...option, label: e.target.value })}
                                    placeholder="Option label"
                                    className="font-medium"
                                  />
                                  <Textarea
                                    value={option.description || ''}
                                    onChange={(e) => updateOption(selectedStepIndex!, optIndex, { ...option, description: e.target.value })}
                                    placeholder="Option description"
                                    className="text-sm"
                                    rows={2}
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="ml-2"
                                  onClick={() => deleteOption(selectedStepIndex!, optIndex)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              {currentStep.question_type === 'image_selection' && (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Label className="text-sm">Image</Label>
                                    <Button
                                      variant="outline"
                                      size="sm"
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
                                    >
                                      <Upload className="mr-2 h-4 w-4" />
                                      Upload Image
                                    </Button>
                                  </div>
                                  {option.image_url && (
                                    <div className="relative">
                                      <img 
                                        src={option.image_url} 
                                        alt="Option preview" 
                                        className="h-24 w-32 object-cover rounded border"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 bg-white shadow-sm"
                                        onClick={() => updateOption(selectedStepIndex!, optIndex, { ...option, image_url: undefined, imageFile: null })}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="space-y-2">
                                <Label className="text-sm">Jump to step (optional)</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={steps.length}
                                  value={option.jump_to_step ?? ''}
                                  onChange={(e) => updateOption(selectedStepIndex!, optIndex, { 
                                    ...option, 
                                    jump_to_step: e.target.value ? Number(e.target.value) : undefined 
                                  })}
                                  placeholder="Step number"
                                  className="w-24"
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Save Step Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button 
                      onClick={() => saveStep(selectedStepIndex!)} 
                      disabled={saving}
                      size="sm"
                      variant={isEditing && formId ? "outline" : "default"}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Saving...' : (isEditing && formId ? 'Save Step' : 'Save Form & Step')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No step selected</h3>
                    <p className="text-slate-500 mb-6">Create a step to start building your form</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {stepTypes.map((stepType) => (
                        <Button 
                          key={stepType.type}
                          variant="outline"
                          onClick={() => addStep(stepType.type)}
                        >
                          {stepType.icon}
                          <span className="ml-2">{stepType.title}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
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
