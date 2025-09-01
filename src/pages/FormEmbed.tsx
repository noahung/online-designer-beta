import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formThemes } from '../lib/formThemes'

type Option = { id: string; label: string; description?: string; image_url?: string; jump_to_step?: number }
type Step = { 
  id: string; 
  title: string; 
  question_type: string; 
  is_required: boolean; 
  step_order: number; 
  options: Option[];
  max_file_size?: number;
  allowed_file_types?: string[];
  dimension_type?: '2d' | '3d';
  scale_type?: 'number' | 'star';
  scale_min?: number;
  scale_max?: number;
  images_per_row?: number;
}

export default function FormEmbed() {
  const { id } = useParams()
  const [steps, setSteps] = useState<Step[]>([])
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formData, setFormData] = useState<any>(null)
  const [formColors, setFormColors] = useState({
    primaryButtonColor: '#3B82F6',
    primaryButtonTextColor: '#FFFFFF',
    secondaryButtonColor: '#E5E7EB',
    secondaryButtonTextColor: '#374151'
  })
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [navigationHistory, setNavigationHistory] = useState<number[]>([0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<number, { 
    option_id?: string; 
    answer_text?: string; 
    file?: File;
    file_url?: string;
    // Contact field responses
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    contact_postcode?: string;
    project_details?: string;
    preferred_contact?: string;
    // Dimension responses
    width?: string;
    height?: string;
    depth?: string;
    units?: string;
    // Opinion scale response
    scale_rating?: number;
  }>>({})

  const [clientInfo, setClientInfo] = useState<{name: string; logo_url?: string; primary_color?: string} | null>(null)
  const [formTheme, setFormTheme] = useState<string>('generic')

  useEffect(() => { if (id) loadForm(id) }, [id])

  const loadForm = async (formId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading form:', formId)
      
      // Load form with client information
      const { data: form, error: formError } = await supabase
        .from('forms')
        .select(`
          id,
          name,
          description,
          user_id,
          form_theme,
          primary_button_color,
          primary_button_text_color,
          secondary_button_color,
          secondary_button_text_color,
          clients (
            name,
            logo_url,
            primary_color
          )
        `)
        .eq('id', formId)
        .maybeSingle()
      
      console.log('Form query result:', { form, formError })
      
      if (formError) {
        console.error('Form query error:', formError)
        setError(`Failed to load form: ${formError.message}`)
        return
      }
      
      if (!form) {
        console.log('No form found with ID:', formId)
        setError('Form not found')
        return
      }
      
      setFormName(form.name)
      setFormDescription(form.description)
      setFormData(form)
      setFormColors({
        primaryButtonColor: form.primary_button_color || '#3B82F6',
        primaryButtonTextColor: form.primary_button_text_color || '#FFFFFF',
        secondaryButtonColor: form.secondary_button_color || '#E5E7EB',
        secondaryButtonTextColor: form.secondary_button_text_color || '#374151'
      })
      setFormTheme(form.form_theme || 'generic')
      setClientInfo(form.clients)

      const { data: s, error: stepsError } = await supabase
        .from('form_steps')
        .select('*, form_options(*)')
        .eq('form_id', formId)
        .order('step_order', { ascending: true })
        
      console.log('Steps query result:', { s, stepsError })
      
      if (stepsError) {
        console.error('Steps query error:', stepsError)
        setError(`Failed to load form steps: ${stepsError.message}`)
        return
      }
        
      if (!s || s.length === 0) {
        console.log('No steps found for form:', formId)
        setError('This form has no steps configured')
        return
      }

      // Map steps and options, handling both public URLs and object paths
      const mapped: Step[] = s.map((row: any) => {
        const opts = (row.form_options || []).map((o: any) => {
          let image_url = o.image_url
          // If image_url doesn't start with http, it might be an object path that needs a signed URL
          // But since we're using public buckets now, this should mostly be public URLs already
          return { 
            id: o.id, 
            label: o.label, 
            description: o.description, 
            image_url, 
            jump_to_step: o.jump_to_step 
          }
        })
        return { 
          id: row.id, 
          title: row.title, 
          question_type: row.question_type, 
          is_required: row.is_required, 
          step_order: row.step_order, 
          max_file_size: row.max_file_size,
          allowed_file_types: row.allowed_file_types,
          dimension_type: row.dimension_type,
          scale_type: row.scale_type,
          scale_min: row.scale_min,
          scale_max: row.scale_max,
          options: opts 
        }
      })
      
      console.log('Mapped steps:', mapped)
      setSteps(mapped)
    } catch (err) {
      console.error('Unexpected error loading form:', err)
      setError('An unexpected error occurred while loading the form')
    } finally {
      setLoading(false)
    }
  }

  const selectOption = (option: Option) => {
    setResponses(r => ({ ...r, [currentStepIndex]: { ...(r[currentStepIndex] || {}), option_id: option.id } }))
    // branching: jump to step if defined (1-based step indexes stored in DB)
    if (option.jump_to_step) {
      // find index for jump_to_step
      const idx = steps.findIndex(s => s.step_order === option.jump_to_step)
      if (idx >= 0) {
        // Add current step to history before jumping
        setNavigationHistory(prev => [...prev, currentStepIndex])
        setCurrentStepIndex(idx)
      }
      return
    }
  }

  const handleFileUpload = (file: File) => {
    const step = steps[currentStepIndex]
    if (!step) return

    // Validate file size
    const maxSize = (step.max_file_size || 5) * 1024 * 1024 // Convert MB to bytes
    if (file.size > maxSize) {
      alert(`File size must be less than ${step.max_file_size || 5}MB`)
      return
    }

    // Validate file type
    if (step.allowed_file_types && step.allowed_file_types.length > 0) {
      const isAllowed = step.allowed_file_types.some(type => {
        if (type === 'image/*') return file.type.startsWith('image/')
        if (type === 'text/*') return file.type.startsWith('text/')
        return file.type === type
      })
      
      if (!isAllowed) {
        alert('File type not allowed')
        return
      }
    }

    setResponses(r => ({ 
      ...r, 
      [currentStepIndex]: { 
        ...(r[currentStepIndex] || {}), 
        file,
        answer_text: file.name
      } 
    }))
  }

  const sendWebhook = async (responseId: string, answers: any[], contactData: any) => {
    try {
      if (!formData) {
        console.log('No form data available for webhook')
        return
      }

      // Get user's webhook settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('webhook_url, zapier_enabled')
        .eq('user_id', formData.user_id)
        .maybeSingle()

      if (settingsError || !settings || !settings.zapier_enabled || !settings.webhook_url) {
        console.log('Webhook not configured or not enabled')
        return
      }

      // Prepare comprehensive structured answers
      const structuredAnswers = answers.map(answer => {
        const step = steps.find(s => s.id === answer.step_id)
        const baseAnswer = {
          question: step?.title || 'Unknown',
          question_type: step?.question_type || 'unknown',
          step_order: step?.step_order || 0,
          is_required: step?.is_required || false
        }

        // Add type-specific data
        if (answer.answer_text) {
          baseAnswer.answer_text = answer.answer_text
        }
        
        if (answer.selected_option_id) {
          baseAnswer.selected_option = answer.selected_option_id
          // Try to get option label from step
          const option = step?.options?.find(opt => opt.id === answer.selected_option_id)
          if (option) {
            baseAnswer.selected_option_label = option.label
            if (option.image_url) {
              baseAnswer.selected_option_image = option.image_url
            }
          }
        }

        if (answer.file_url) {
          baseAnswer.file_url = answer.file_url
          baseAnswer.file_name = answer.file_name
          baseAnswer.file_size = answer.file_size
        }

        if (answer.scale_rating) {
          baseAnswer.rating = answer.scale_rating
          baseAnswer.scale_type = step?.scale_type || 'number'
          baseAnswer.scale_min = step?.scale_min || 1
          baseAnswer.scale_max = step?.scale_max || 10
        }

        if (answer.width || answer.height || answer.depth) {
          baseAnswer.dimensions = {
            width: answer.width,
            height: answer.height,
            depth: answer.depth,
            units: answer.units,
            dimension_type: step?.dimension_type || '2d'
          }
        }

        return baseAnswer
      })

      // Categorize answers for easy access
      const textResponses = structuredAnswers
        .filter(a => a.question_type === 'text_input' && a.answer_text)
        .map(a => a.answer_text)

      const multipleChoiceResponses = structuredAnswers
        .filter(a => a.question_type === 'multiple_choice' && a.selected_option_label)
        .map(a => `${a.question} → ${a.selected_option_label}`)

      const imageSelectionResponses = structuredAnswers
        .filter(a => a.question_type === 'image_selection' && a.selected_option_label)
        .map(a => ({
          question: a.question,
          selection: a.selected_option_label,
          image_url: a.selected_option_image
        }))

      const fileUploads = structuredAnswers
        .filter(a => a.question_type === 'file_upload' && a.file_url)
        .map(a => `${a.file_name} (${(a.file_size / 1024 / 1024).toFixed(1)} MB) - ${a.file_url}`)

      const dimensionMeasurements = structuredAnswers
        .filter(a => a.question_type === 'dimensions' && a.dimensions)
        .map(a => {
          const d = a.dimensions
          if (d.dimension_type === '3d') {
            return `${a.question}: ${d.width}${d.units} × ${d.height}${d.units} × ${d.depth}${d.units}`
          } else {
            return `${a.question}: ${d.width}${d.units} × ${d.height}${d.units}`
          }
        })

      const opinionRatings = structuredAnswers
        .filter(a => a.question_type === 'opinion_scale' && a.rating)
        .map(a => `${a.question}: ${a.rating}/${a.scale_max} ${a.scale_type}`)

      // Get direct file URLs and names
      const fileAttachments = structuredAnswers
        .filter(a => a.file_url)
        .map(a => a.file_url)

      const fileNames = structuredAnswers
        .filter(a => a.file_name)
        .map(a => a.file_name)

      // Calculate completion metrics
      const totalQuestions = steps.length
      const answeredQuestions = structuredAnswers.length
      const completionPercentage = Math.round((answeredQuestions / totalQuestions) * 100)

      // Prepare comprehensive webhook payload
      const webhookData = {
        response_id: responseId,
        form_id: formData.id,
        form_name: formData.name,
        submitted_at: new Date().toISOString(),
        
        // Contact information (flattened for easy access)
        contact__name: contactData.contact_name || null,
        contact__email: contactData.contact_email || null,
        contact__phone: contactData.contact_phone || null,
        contact__postcode: contactData.contact_postcode || null,
        
        // Complete structured data
        answers: JSON.stringify(structuredAnswers),
        
        // Categorized responses for easy mapping
        answers__text_responses: textResponses,
        answers__multiple_choice: multipleChoiceResponses,
        answers__image_selections: imageSelectionResponses.map(a => `${a.question} → ${a.selection}`),
        answers__file_uploads: fileUploads,
        answers__dimensions: dimensionMeasurements,
        answers__opinion_ratings: opinionRatings,
        
        // Direct file access
        file_attachments: fileAttachments,
        file_names: fileNames,
        
        // Summary data
        total_questions_answered: answeredQuestions,
        completion_percentage: completionPercentage
      }

      // Send webhook
      const response = await fetch(settings.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      })

      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status}`)
      }

      // Update response to mark webhook as sent
      await supabase
        .from('responses')
        .update({ webhook_sent: true })
        .eq('id', responseId)

      console.log('Webhook sent successfully')
    } catch (error) {
      console.error('Webhook error:', error)
      throw error
    }
  }

  const goNext = async () => {
    const step = steps[currentStepIndex]
    if (!step) return

    // require answer if needed
    const resp = responses[currentStepIndex]
    if (step.is_required && (!resp || (!resp.option_id && !resp.answer_text && !resp.file && !resp.contact_name && !resp.contact_email))) {
      alert('Please answer this step before continuing')
      return
    }

    if (currentStepIndex === steps.length - 1) {
      // Find contact information from responses
      let contactData = {}
      for (const [stepIndexStr, ans] of Object.entries(responses)) {
        const si = Number(stepIndexStr)
        const stepObj = steps[si]
        if (stepObj?.question_type === 'contact_fields' && ans) {
          contactData = {
            contact_name: ans.contact_name || null,
            contact_email: ans.contact_email || null,
            contact_phone: ans.contact_phone || null,
            contact_postcode: ans.contact_postcode || null
          }
          break
        }
      }

      // submit: create responses row and response_answers
      const { data: inserted, error: resErr } = await supabase.from('responses').insert([{ 
        form_id: id,
        ...contactData
      }]).select().single()
      if (resErr || !inserted) {
        console.error('Error creating response', resErr)
        alert('Submission failed')
        return
      }

      const responseId = inserted.id
      // build answers
      const answers = [] as any[]
      for (const [stepIndexStr, ans] of Object.entries(responses)) {
        const si = Number(stepIndexStr)
        const stepObj = steps[si]
        if (!stepObj) continue

        let file_url = null
        let file_name = null
        let file_size = null

        // Handle file upload if present
        if (ans.file) {
          try {
            const filename = `responses/${responseId}/${stepObj.id}/${Date.now()}-${ans.file.name}`
            const { error: uploadErr } = await supabase.storage
              .from('form-assets')
              .upload(filename, ans.file)
            
            if (uploadErr) {
              console.error('File upload error:', uploadErr)
              alert('File upload failed, but form will be submitted without the file')
            } else {
              const { data: publicUrl } = supabase.storage
                .from('form-assets')
                .getPublicUrl(filename)
              file_url = publicUrl.publicUrl
              file_name = ans.file.name
              file_size = ans.file.size
            }
          } catch (error) {
            console.error('File upload error:', error)
            alert('File upload failed, but form will be submitted without the file')
          }
        }

        answers.push({ 
          response_id: responseId, 
          step_id: stepObj.id, 
          answer_text: ans.answer_text ?? null, 
          selected_option_id: ans.option_id ?? null,
          file_url,
          file_name,
          file_size,
          // Dimension fields
          width: ans.width ? parseFloat(ans.width) : null,
          height: ans.height ? parseFloat(ans.height) : null,
          depth: ans.depth ? parseFloat(ans.depth) : null,
          units: ans.units ?? null,
          // Opinion scale rating
          scale_rating: ans.scale_rating ?? null
        })
      }

      if (answers.length > 0) {
        const { error: ansErr } = await supabase.from('response_answers').insert(answers)
        if (ansErr) console.error('Error inserting answers', ansErr)
      }

      // Send webhook to Zapier if configured
      try {
        await sendWebhook(responseId, answers, contactData)
      } catch (error) {
        console.error('Webhook failed:', error)
        // Don't fail the form submission if webhook fails
      }

      setCurrentStepIndex(currentStepIndex + 1)
      return
    }

    // Regular next step navigation - add to history
    setNavigationHistory(prev => [...prev, currentStepIndex])
    setCurrentStepIndex(currentStepIndex + 1)
  }

  const goPrev = () => {
    if (navigationHistory.length > 1) {
      // Go back to the previous step in history
      const newHistory = [...navigationHistory]
      newHistory.pop() // Remove current step
      const previousStep = newHistory[newHistory.length - 1]
      setNavigationHistory(newHistory)
      setCurrentStepIndex(previousStep)
    } else {
      // Regular previous navigation if no history (shouldn't happen but safeguard)
      setCurrentStepIndex(Math.max(0, currentStepIndex - 1))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded shadow max-w-2xl w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading form...</h2>
          <p className="text-slate-600">Please wait while we load your form.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded shadow max-w-2xl w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600">Error Loading Form</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button 
            onClick={() => id && loadForm(id)}
            style={{
              backgroundColor: formColors.primaryButtonColor,
              color: formColors.primaryButtonTextColor
            }}
            className="px-4 py-2 rounded hover:opacity-90 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!steps || steps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded shadow max-w-2xl w-full text-center">
          <h2 className="text-xl font-semibold">Form not available</h2>
          <p className="text-slate-600">This form isn't published or contains no steps.</p>
        </div>
      </div>
    )
  }

  if (currentStepIndex >= steps.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded shadow max-w-2xl w-full text-center">
          <h2 className="text-xl font-semibold">Thank you</h2>
          <p className="text-slate-600">Your submission has been received.</p>
        </div>
      </div>
    )
  }

  const step = steps[currentStepIndex]
  const percent = Math.round(((currentStepIndex) / steps.length) * 100)

  // Get the current theme configuration
  const currentTheme = formThemes[formTheme as keyof typeof formThemes] || formThemes.generic

  return (
    <div className={currentTheme.styles.background} style={{ position: 'relative' }}>
      {/* Soft UI decorations for soft-ui theme */}
      {formTheme === 'soft-ui' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        </div>
      )}
      
      <div className={currentTheme.styles.container}>
        <div className={currentTheme.styles.card}>
        {/* Client Header */}
        {clientInfo && (
          <div className="text-center mb-6 pb-4 border-b border-gray-200">
            {/* Client Logo */}
            {clientInfo.logo_url ? (
              <div className="flex justify-center mb-3">
                <img 
                  src={clientInfo.logo_url} 
                  alt={`${clientInfo.name} logo`}
                  className="h-12 w-auto object-contain"
                />
              </div>
            ) : (
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
            
            {/* Client Name */}
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{clientInfo.name}</h2>
            
            {/* Form Description */}
            {formDescription && (
              <p className="text-sm text-gray-600">{formDescription}</p>
            )}
          </div>
        )}
        
        <h1 className={currentTheme.styles.text.heading}>{formName}</h1>
        <p className={currentTheme.styles.text.body}>{step.title}</p>

        <div className={currentTheme.styles.progress}>
          <div 
            className="progress-bar h-full rounded-full transition-all duration-500" 
            style={{ 
              width: `${percent}%`,
              background: formTheme === 'soft-ui' 
                ? 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
                : formColors.primaryButtonColor
            }}
          />
        </div>
        <div className="text-sm text-slate-500 text-right mt-1">{percent}%</div>

        {step.question_type === 'contact_fields' ? (
          <div className="mt-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Your Free Quote</h3>
                <p className="text-gray-600">Tell us about your project and we'll provide a personalised quote</p>
                <div className="text-blue-600 text-sm mt-2">Your Selection: {step.title}</div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className={currentTheme.styles.text.label}>
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={responses[currentStepIndex]?.contact_name?.split(' ')[0] || ''}
                      onChange={(e) => {
                        const currentResponse = responses[currentStepIndex] || {}
                        const lastName = currentResponse.contact_name?.split(' ').slice(1).join(' ') || ''
                        const fullName = e.target.value + (lastName ? ' ' + lastName : '')
                        setResponses(r => ({
                          ...r,
                          [currentStepIndex]: {
                            ...currentResponse,
                            contact_name: fullName
                          }
                        }))
                      }}
                      placeholder="Enter your first name"
                      className={currentTheme.styles.input}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className={currentTheme.styles.text.label}>
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={responses[currentStepIndex]?.contact_name?.split(' ').slice(1).join(' ') || ''}
                      onChange={(e) => {
                        const currentResponse = responses[currentStepIndex] || {}
                        const firstName = currentResponse.contact_name?.split(' ')[0] || ''
                        const fullName = firstName + (e.target.value ? ' ' + e.target.value : '')
                        setResponses(r => ({
                          ...r,
                          [currentStepIndex]: {
                            ...currentResponse,
                            contact_name: fullName
                          }
                        }))
                      }}
                      placeholder="Enter your last name"
                      className={currentTheme.styles.input}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className={currentTheme.styles.text.label}>
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={responses[currentStepIndex]?.contact_email || ''}
                    onChange={(e) => setResponses(r => ({
                      ...r,
                      [currentStepIndex]: {
                        ...(r[currentStepIndex] || {}),
                        contact_email: e.target.value
                      }
                    }))}
                    placeholder="Enter your email address"
                    className={currentTheme.styles.input}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className={currentTheme.styles.text.label}>
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={responses[currentStepIndex]?.contact_phone || ''}
                    onChange={(e) => setResponses(r => ({
                      ...r,
                      [currentStepIndex]: {
                        ...(r[currentStepIndex] || {}),
                        contact_phone: e.target.value
                      }
                    }))}
                    placeholder="Enter your phone number"
                    className={currentTheme.styles.input}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="address" className={currentTheme.styles.text.label}>
                    Property Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    value={responses[currentStepIndex]?.contact_postcode || ''}
                    onChange={(e) => setResponses(r => ({
                      ...r,
                      [currentStepIndex]: {
                        ...(r[currentStepIndex] || {}),
                        contact_postcode: e.target.value
                      }
                    }))}
                    placeholder="Enter your full address"
                    rows={3}
                    className={`${currentTheme.styles.input} resize-none`}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="projectDetails" className={currentTheme.styles.text.label}>
                    Project Details
                  </label>
                  <textarea
                    id="projectDetails"
                    value={responses[currentStepIndex]?.project_details || ''}
                    onChange={(e) => setResponses(r => ({
                      ...r,
                      [currentStepIndex]: {
                        ...(r[currentStepIndex] || {}),
                        project_details: e.target.value,
                        answer_text: e.target.value // Store in answer_text for compatibility
                      }
                    }))}
                    placeholder="Tell us more about your project, preferred timeline, budget range, etc."
                    rows={4}
                    className={`${currentTheme.styles.input} resize-none`}
                  />
                </div>

                <div>
                  <label className={currentTheme.styles.text.label}>Preferred Contact Method</label>
                  <div className="flex space-x-4">
                    {['Phone Call', 'Email', 'Both'].map((method) => (
                      <label key={method} className="flex items-center">
                        <input
                          type="radio"
                          name="contactMethod"
                          value={method}
                          checked={responses[currentStepIndex]?.preferred_contact === method}
                          onChange={(e) => setResponses(r => ({
                            ...r,
                            [currentStepIndex]: {
                              ...(r[currentStepIndex] || {}),
                              preferred_contact: e.target.value
                            }
                          }))}
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={currentTheme.styles.text.body}>{method}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                     onClick={() => {
                       const input = document.createElement('input')
                       input.type = 'file'
                       input.accept = 'image/*,application/pdf'
                       input.multiple = true
                       input.onchange = (e) => {
                         const files = Array.from((e.target as HTMLInputElement).files || [])
                         if (files.length > 0) {
                           // For now, just store the first file
                           handleFileUpload(files[0])
                         }
                       }
                       input.click()
                     }}>
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg font-medium text-gray-600 mb-1">
                      Upload Plans or Reference Images (Optional)
                    </p>
                    <p className="text-sm text-gray-500">
                      Click to upload or drag and drop<br/>
                      PNG, JPG, PDF up to 10MB each
                    </p>
                  </div>
                </div>

                {responses[currentStepIndex]?.file && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-green-800">{responses[currentStepIndex]?.file?.name}</span>
                      </div>
                      <button
                        onClick={() => setResponses(r => ({
                          ...r,
                          [currentStepIndex]: {
                            ...(r[currentStepIndex] || {}),
                            file: undefined
                          }
                        }))}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-2 pt-4">
                  <input
                    type="checkbox"
                    id="consent"
                    required
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="consent" className="text-sm text-gray-600 flex-1">
                    <span className="text-orange-500">⚠️</span> I agree to be contacted by {clientInfo?.name || 'the company'} regarding my enquiry <span className="text-red-500">*</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : step.question_type === 'file_upload' ? (
          <div className="mt-6">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = step.allowed_file_types?.join(',') || '*'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) handleFileUpload(file)
                }
                input.click()
              }}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {responses[currentStepIndex]?.file ? 'Change file' : 'Drop files here or click to browse'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Maximum file size: {step.max_file_size || 5}MB each
                  </p>
                  {step.allowed_file_types && step.allowed_file_types.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Allowed types: {step.allowed_file_types.map(type => {
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
            {responses[currentStepIndex]?.file && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{responses[currentStepIndex]?.file?.name}</p>
                      <p className="text-sm text-gray-500">
                        {Math.round((responses[currentStepIndex]?.file?.size || 0) / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setResponses(r => ({ ...r, [currentStepIndex]: { ...(r[currentStepIndex] || {}), file: undefined, answer_text: undefined } }))}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : step.question_type === 'text_input' ? (
          <div className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-slate-600 mb-4">Enter your response</div>
              <textarea
                value={responses[currentStepIndex]?.answer_text || ''}
                onChange={(e) => setResponses(r => ({
                  ...r,
                  [currentStepIndex]: {
                    ...(r[currentStepIndex] || {}),
                    answer_text: e.target.value
                  }
                }))}
                placeholder="Enter your answer here..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-gray-900 placeholder-gray-500"
                required={step.is_required}
              />
              {step.is_required && (
                <p className="text-xs text-gray-500">* This field is required</p>
              )}
            </div>
          </div>
        ) : step.question_type === 'dimensions' ? (
          <div className="mt-6">
            <div className="space-y-6">
              <div className="text-sm text-slate-600 mb-4">Enter measurements</div>
              
              {/* Dimension Type Selection */}
              <div className="space-y-3">
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`dimensionType-${currentStepIndex}`}
                      value="2d"
                      checked={(responses[currentStepIndex] as any)?.dimension_type === '2d' || !(responses[currentStepIndex] as any)?.dimension_type}
                      onChange={(e) => setResponses(r => ({
                        ...r,
                        [currentStepIndex]: {
                          ...(r[currentStepIndex] || {}),
                          dimension_type: e.target.value,
                          depth: undefined // Clear depth when switching to 2D
                        }
                      }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">2D (Width × Height)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`dimensionType-${currentStepIndex}`}
                      value="3d"
                      checked={(responses[currentStepIndex] as any)?.dimension_type === '3d'}
                      onChange={(e) => setResponses(r => ({
                        ...r,
                        [currentStepIndex]: {
                          ...(r[currentStepIndex] || {}),
                          dimension_type: e.target.value
                        }
                      }))}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">3D (Width × Height × Depth)</span>
                  </label>
                </div>
              </div>

              {/* Units Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Units</label>
                <select
                  value={responses[currentStepIndex]?.units || 'mm'}
                  onChange={(e) => setResponses(r => ({
                    ...r,
                    [currentStepIndex]: {
                      ...(r[currentStepIndex] || {}),
                      units: e.target.value
                    }
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="mm">Millimeters (mm)</option>
                  <option value="cm">Centimeters (cm)</option>
                  <option value="m">Meters (m)</option>
                  <option value="in">Inches (in)</option>
                  <option value="ft">Feet (ft)</option>
                </select>
              </div>

              {/* Dimension Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={responses[currentStepIndex]?.width || ''}
                    onChange={(e) => setResponses(r => ({
                      ...r,
                      [currentStepIndex]: {
                        ...(r[currentStepIndex] || {}),
                        width: e.target.value
                      }
                    }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required={step.is_required}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={responses[currentStepIndex]?.height || ''}
                    onChange={(e) => setResponses(r => ({
                      ...r,
                      [currentStepIndex]: {
                        ...(r[currentStepIndex] || {}),
                        height: e.target.value
                      }
                    }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required={step.is_required}
                  />
                </div>
                {((responses[currentStepIndex] as any)?.dimension_type === '3d') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Depth</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={responses[currentStepIndex]?.depth || ''}
                      onChange={(e) => setResponses(r => ({
                        ...r,
                        [currentStepIndex]: {
                          ...(r[currentStepIndex] || {}),
                          depth: e.target.value
                        }
                      }))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      required={step.is_required}
                    />
                  </div>
                )}
              </div>
              
              {step.is_required && (
                <p className="text-xs text-gray-500">* These fields are required</p>
              )}
            </div>
          </div>
        ) : step.question_type === 'opinion_scale' ? (
          <div className="mt-6">
            <div className="space-y-4">
              <div className="text-center">
                {step.scale_type === 'star' ? (
                  // Star Rating (1-5)
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setResponses(prev => ({
                          ...prev,
                          [currentStepIndex]: { scale_rating: rating }
                        }))}
                        className={`text-4xl transition-colors ${
                          responses[currentStepIndex]?.scale_rating === rating
                            ? ''
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                        style={responses[currentStepIndex]?.scale_rating === rating ? {
                          color: formColors.primaryButtonColor
                        } : {}}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                ) : (
                  // Number Scale (configurable range)
                  <div className="w-full overflow-x-auto">
                    <div className="flex justify-center gap-1 sm:gap-2 min-w-max px-4">
                      {Array.from(
                        { length: (step.scale_max || 10) - (step.scale_min || 1) + 1 },
                        (_, i) => (step.scale_min || 1) + i
                      ).map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setResponses(prev => ({
                            ...prev,
                            [currentStepIndex]: { scale_rating: rating }
                          }))}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 font-semibold text-sm sm:text-base transition-all flex-shrink-0 ${
                            responses[currentStepIndex]?.scale_rating === rating
                              ? 'border-2'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                          style={responses[currentStepIndex]?.scale_rating === rating ? {
                            backgroundColor: formColors.primaryButtonColor,
                            color: formColors.primaryButtonTextColor,
                            borderColor: formColors.primaryButtonColor
                          } : {}}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {responses[currentStepIndex]?.scale_rating && (
                  <p className="mt-4 text-gray-600">
                    You rated: {responses[currentStepIndex]?.scale_rating}
                    {step.scale_type === 'star' ? ' stars' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div 
            className={`grid gap-4 mt-6 ${
              step.images_per_row === 1 
                ? 'grid-cols-1' 
                : step.images_per_row === 3 
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' 
                : step.images_per_row === 4
                ? 'grid-cols-2 md:grid-cols-4'
                : 'grid-cols-1 md:grid-cols-2' // default case
            }`}
          >
            {step.options.map((opt: any) => (
              <button key={opt.id} onClick={() => selectOption(opt)} className={`border rounded-lg p-4 text-left hover:shadow-md transition-all duration-200 ${responses[currentStepIndex]?.option_id === opt.id ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                {opt.image_url && (
                  <div className="aspect-square w-full mb-3 rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={opt.image_url} 
                      alt={opt.label} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
                <div className="font-medium text-gray-900">{opt.label}</div>
                {opt.description && <div className="text-sm text-gray-500 mt-1">{opt.description}</div>}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center gap-2 mt-6">
          <button 
            onClick={goPrev} 
            disabled={currentStepIndex === 0} 
            className={`${currentTheme.styles.button.secondary} ${currentStepIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={goNext} 
              className={currentTheme.styles.button.primary}
            >
              {currentStepIndex === steps.length - 1 
                ? (step.question_type === 'contact_fields' ? 'Get My Free Quote' : 'Submit') 
                : 'Next'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
