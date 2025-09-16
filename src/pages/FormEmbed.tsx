import { useEffect, useState } from 'react'
import { useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formThemes } from '../lib/formThemes'
import { Upload } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// Extend window interface for height update timeout
declare global {
  interface Window {
    heightUpdateTimeout?: number;
  }
}

type Option = { id: string; label: string; description?: string; image_url?: string; jump_to_step?: number }

// Email validation function - matches Brevo's strict validation requirements
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false

  // Remove any whitespace
  email = email.trim()

  // Basic format check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!emailRegex.test(email)) return false

  // Split into local and domain parts
  const [localPart, domain] = email.split('@')

  // Local part validations (RFC 5322 compliant)
  if (!localPart || localPart.length === 0 || localPart.length > 80) return false
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false
  if (localPart.includes('..')) return false

  // Domain validations
  if (!domain || domain.length === 0 || domain.length > 253) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false
  if (domain.includes('..')) return false

  // Domain must have at least one dot
  if (!domain.includes('.')) return false

  // Check domain parts (each part should be valid)
  const domainParts = domain.split('.')
  for (const part of domainParts) {
    if (part.length === 0 || part.length > 63) return false
    if (part.startsWith('-') || part.endsWith('-')) return false
    // Domain parts should only contain valid characters
    if (!/^[a-zA-Z0-9-]+$/.test(part)) return false
  }

  // Additional Brevo-specific validations
  // Reject obviously invalid patterns that Brevo doesn't accept
  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) return false
  if (localPart.includes('..') || domain.includes('..')) return false

  return true
}

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
  frames_count?: number;
  frames_max_count?: number;
  frames_require_image?: boolean;
  frames_require_location?: boolean;
  frames_require_measurements?: boolean;
  enable_room_location?: boolean;
  enable_measurements?: boolean;
}

export default function FormEmbed() {
  // Ref for main form container
  const formContainerRef = useRef<HTMLDivElement>(null);

  // Animated Image Card Component
  const AnimatedImageCard = ({ 
    option, 
    isSelected, 
    onClick, 
    isAnimating, 
    animationDirection,
    index 
  }: {
    option: Option;
    isSelected: boolean;
    onClick: () => void;
    isAnimating: boolean;
    animationDirection: 'forward' | 'backward';
    index: number;
  }) => {
    const animationDelay = index * 50; // Stagger animation by 50ms per card
    
    return (
      <button 
        onClick={onClick} 
        className={`
          border rounded-lg p-4 text-left hover:shadow-md transition-all duration-300 ease-out
          ${isSelected ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
          ${isAnimating ? 
            animationDirection === 'forward' 
              ? 'animate-fade-in-up' 
              : 'animate-fade-in-down'
            : ''
          }
        `}
        style={{
          animationDelay: isAnimating ? `${animationDelay}ms` : '0ms',
          animationFillMode: 'both'
        }}
      >
        {option.image_url && (
          <div className={`
            aspect-square w-full mb-3 rounded-lg overflow-hidden bg-gray-100 
            transition-all duration-300 ease-out
            ${isAnimating ? 'animate-scale-in' : ''}
          `}
          style={{
            animationDelay: isAnimating ? `${animationDelay + 100}ms` : '0ms',
            animationFillMode: 'both'
          }}
          >
            <img 
              src={option.image_url} 
              alt={option.label} 
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
            />
          </div>
        )}
        <div className={`
          font-medium text-gray-900 transition-all duration-200
          ${isAnimating ? 'animate-slide-in' : ''}
        `}
        style={{
          animationDelay: isAnimating ? `${animationDelay + 200}ms` : '0ms',
          animationFillMode: 'both'
        }}
        >
          {option.label}
        </div>
        {option.description && (
          <div className={`
            text-sm text-gray-500 mt-1 transition-all duration-200
            ${isAnimating ? 'animate-slide-in' : ''}
          `}
          style={{
            animationDelay: isAnimating ? `${animationDelay + 250}ms` : '0ms',
            animationFillMode: 'both'
          }}
          >
            {option.description}
          </div>
        )}
      </button>
    );
  };
  // MutationObserver for robust height updates
  useEffect(() => {
    const observer = new MutationObserver(() => {
      // Debounce the height updates to avoid too many calls
      clearTimeout(window.heightUpdateTimeout);
      window.heightUpdateTimeout = setTimeout(() => {
        sendHeightToParent();
      }, 100);
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    
    // Also observe for image loads which can change height
    const handleImageLoad = () => sendHeightToParent();
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', handleImageLoad);
        img.addEventListener('error', handleImageLoad);
      }
    });
    
    return () => {
      observer.disconnect();
      clearTimeout(window.heightUpdateTimeout);
      images.forEach(img => {
        img.removeEventListener('load', handleImageLoad);
        img.removeEventListener('error', handleImageLoad);
      });
    };
  }, []);
  const { user } = useAuth()
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
  
  // Animation state for morph transitions
  const [isAnimating, setIsAnimating] = useState(false)
  const [previousStepIndex, setPreviousStepIndex] = useState<number | null>(null)
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward')
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
    // Frames plan responses
    frames_count?: number;
    frames?: Array<{
      frame_number: number;
      image?: File;
      image_url?: string;
      location_text?: string;
      measurements_text?: string;
    }>;
  }>>({})

  const [formTheme, setFormTheme] = useState<string>('generic')

  // --- Add postMessage logic for iframe auto-resize ---
  // Send height to parent window
  const sendHeightToParent = () => {
    // Use requestAnimationFrame to ensure DOM is fully updated
    requestAnimationFrame(() => {
      let height = 0;
      
      // Try multiple methods to get the most accurate height
      if (formContainerRef.current) {
        // Method 1: Use the container ref
        height = formContainerRef.current.offsetHeight;
        
        // Method 2: Also check scrollHeight for content that might overflow
        const scrollHeight = formContainerRef.current.scrollHeight;
        height = Math.max(height, scrollHeight);
      } else {
        // Fallback: Use document body
        height = document.body.scrollHeight;
      }
      
      // Ensure minimum height to prevent collapsing
      height = Math.max(height, 200);
      
      // Account for potential scrollbars
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        height += 20; // Extra buffer if scrollbar exists
      }
      
      // Add some padding for safety
      height += 20;
      
      console.log('[FormEmbed] Sending designerFormHeight:', height, 'Scrollbar detected:', scrollbarWidth > 0);
      window.parent.postMessage({
        type: 'designerFormHeight',
        height: height
      }, '*');
    });
  };

  useEffect(() => {
    sendHeightToParent();
    window.addEventListener('resize', sendHeightToParent);
    
    // Also send height after a short delay to ensure everything is rendered
    const initialTimeout = setTimeout(() => {
      sendHeightToParent();
    }, 500);
    
    // Send height when window fully loads
    const handleLoad = () => sendHeightToParent();
    window.addEventListener('load', handleLoad);
    
    // Periodic height checks for dynamic content (every 2 seconds for 10 seconds)
    let periodicCheckCount = 0;
    const periodicCheck = setInterval(() => {
      if (periodicCheckCount < 5) {
        sendHeightToParent();
        periodicCheckCount++;
      } else {
        clearInterval(periodicCheck);
      }
    }, 2000);
    
    return () => {
      window.removeEventListener('resize', sendHeightToParent);
      window.removeEventListener('load', handleLoad);
      clearTimeout(initialTimeout);
      clearInterval(periodicCheck);
    };
  }, []);

  // Call sendHeightToParent after each step change, response change, or frame count change
  useEffect(() => {
    // Use setTimeout to ensure all DOM updates and animations are complete
    const timeoutId = setTimeout(() => {
      sendHeightToParent();
      
      // Send again after potential CSS transitions (animations, etc.)
      const secondTimeoutId = setTimeout(() => {
        sendHeightToParent();
      }, 300);
      
      return () => clearTimeout(secondTimeoutId);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [currentStepIndex, steps, responses]);

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
            id,
            name,
            logo_url,
            primary_color,
            client_email,
            email_notifications_enabled
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

      const { data: s, error: stepsError } = await supabase
        .from('form_steps')
        .select(`
          *,
          frames_max_count,
          frames_require_image,
          frames_require_location,
          frames_require_measurements,
          form_options(*)
        `)
        .eq('form_id', formId)
        .order('step_order', { ascending: true })
        
      console.log('Steps query result:', { s, stepsError })
      
      // Debug: Log the frames_plan step data
      const framesPlanStep = s?.find(step => step.question_type === 'frames_plan')
      if (framesPlanStep) {
        console.log('Frames plan step data:', framesPlanStep)
        console.log('Frames config:', {
          frames_max_count: framesPlanStep.frames_max_count,
          frames_require_image: framesPlanStep.frames_require_image,
          frames_require_location: framesPlanStep.frames_require_location,
          frames_require_measurements: framesPlanStep.frames_require_measurements
        })
      }
      
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
          let image_url = o.image_url;
          // If image_url doesn't start with http, it might be an object path that needs a signed URL
          // But since we're using public buckets now, this should mostly be public URLs already
          return {
            id: o.id,
            label: o.label,
            description: o.description,
            image_url,
            jump_to_step: o.jump_to_step
          };
        });
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
          images_per_row: row.images_per_row,
          // Frames plan configuration (default when null/undefined)
          frames_max_count: row.frames_max_count ?? 10,
          frames_require_image: row.frames_require_image ?? true,
          frames_require_location: row.frames_require_location ?? true,
          frames_require_measurements: row.frames_require_measurements ?? false,
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
        // Check if both current and target steps are image selection steps
        const currentStep = steps[currentStepIndex]
        const targetStep = steps[idx]
        if (currentStep?.question_type === 'image_selection' && targetStep?.question_type === 'image_selection') {
          setPreviousStepIndex(currentStepIndex)
          setAnimationDirection('forward')
          setIsAnimating(true)
          setTimeout(() => {
            setNavigationHistory(prev => [...prev, currentStepIndex])
            setCurrentStepIndex(idx)
            setTimeout(() => setIsAnimating(false), 300)
          }, 150)
        } else {
          // Add current step to history before jumping
          setNavigationHistory(prev => [...prev, currentStepIndex])
          setCurrentStepIndex(idx)
        }
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
    console.log('🚀 [WEBHOOK] Starting webhook send process...')
    console.log('📋 [WEBHOOK] Response ID:', responseId)
    console.log('📊 [WEBHOOK] Answers count:', answers.length)
    console.log('👤 [WEBHOOK] Contact data:', contactData)

    try {
      if (!formData) {
        console.log('❌ [WEBHOOK] No form data available for webhook')
        return
      }

      console.log('📝 [WEBHOOK] Form data found:', {
        formId: formData.id,
        formName: formData.name,
        clientId: formData.client_id
      })

      // Get client's webhook URL (new per-client system)
      console.log('🔍 [WEBHOOK] Fetching client webhook URL...')
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('webhook_url')
        .eq('id', formData.client_id)
        .maybeSingle()

      console.log('📡 [WEBHOOK] Client query result:', { client, clientError })

      if (clientError || !client || !client.webhook_url) {
        console.log('⚠️ [WEBHOOK] Client webhook not configured:', {
          error: clientError?.message,
          hasClient: !!client,
          webhookUrl: client?.webhook_url
        })
        return
      }

      console.log('✅ [WEBHOOK] Client webhook URL found:', client.webhook_url)

      // Prepare comprehensive structured answers
      console.log('🔧 [WEBHOOK] Preparing structured answers...')
      const structuredAnswers = answers.map(answer => {
        const step = steps.find(s => s.id === answer.step_id)
        // Add all possible properties to baseAnswer type
        const baseAnswer: {
          question: string;
          question_type: string;
          step_order: number;
          is_required: boolean;
          answer_text?: string;
          selected_option?: string;
          selected_option_label?: string;
          selected_option_image?: string;
          file_url?: string;
          file_name?: string;
          file_size?: number;
          rating?: number;
          scale_type?: string;
          scale_min?: number;
          scale_max?: number;
          dimensions?: {
            width?: string;
            height?: string;
            depth?: string;
            units?: string;
            dimension_type?: string;
          };
        } = {
          question: step?.title || 'Unknown',
          question_type: step?.question_type || 'unknown',
          step_order: step?.step_order || 0,
          is_required: step?.is_required || false
        };

        // Add type-specific data
        if (answer.answer_text) {
          baseAnswer.answer_text = answer.answer_text;
        }

        if (answer.selected_option_id) {
          baseAnswer.selected_option = answer.selected_option_id;
          // Try to get option label from step
          const option = step?.options?.find(opt => opt.id === answer.selected_option_id);
          if (option) {
            baseAnswer.selected_option_label = option.label;
            if (option.image_url) {
              baseAnswer.selected_option_image = option.image_url;
            }
          }
        }

        if (answer.file_url) {
          baseAnswer.file_url = answer.file_url;
          baseAnswer.file_name = answer.file_name;
          baseAnswer.file_size = answer.file_size;
        }

        if (answer.scale_rating) {
          baseAnswer.rating = answer.scale_rating;
          baseAnswer.scale_type = step?.scale_type || 'number';
          baseAnswer.scale_min = step?.scale_min || 1;
          baseAnswer.scale_max = step?.scale_max || 10;
        }

        if (answer.width || answer.height || answer.depth) {
          baseAnswer.dimensions = {
            width: answer.width,
            height: answer.height,
            depth: answer.depth,
            units: answer.units,
            dimension_type: step?.dimension_type || '2d'
          };
        }

        return baseAnswer;
      });

      console.log('📊 [WEBHOOK] Structured answers prepared:', structuredAnswers.length)

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
  .map(a => a.file_size !== undefined ? `${a.file_name} (${(a.file_size / 1024 / 1024).toFixed(1)} MB) - ${a.file_url}` : `${a.file_name} - ${a.file_url}`)

      const dimensionMeasurements = structuredAnswers
        .filter(a => a.question_type === 'dimensions' && a.dimensions)
        .map(a => {
          const d = a.dimensions
          if (!d) return '';
          if (d.dimension_type === '3d') {
            return `${a.question}: ${d.width ?? ''}${d.units ?? ''} × ${d.height ?? ''}${d.units ?? ''} × ${d.depth ?? ''}${d.units ?? ''}`;
          } else {
            return `${a.question}: ${d.width ?? ''}${d.units ?? ''} × ${d.height ?? ''}${d.units ?? ''}`;
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

      console.log('📈 [WEBHOOK] Completion metrics:', {
        totalQuestions,
        answeredQuestions,
        completionPercentage: `${completionPercentage}%`
      })

      // Prepare comprehensive webhook payload
      const webhookData = {
        response_id: responseId,
        form_id: formData.id,
        form_name: formData.name,
        internal_name: formData.internal_name || null,
        client_id: formData.clients?.id || null,
        client_name: formData.clients?.name || null,
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

      console.log('📦 [WEBHOOK] Webhook payload prepared:', {
        responseId,
        formId: formData.id,
        clientName: formData.clients?.name,
        answersCount: structuredAnswers.length,
        hasFiles: fileAttachments.length > 0
      })

      // Send webhook via Supabase Edge Function
      console.log('🌐 [WEBHOOK] Sending webhook via Supabase Edge Function...')
      console.log('🔗 [WEBHOOK] Target URL:', client.webhook_url)

      const response = await fetch('https://bahloynyhjgmdndqabhu.supabase.co/functions/v1/send-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          webhook_url: client.webhook_url,
          payload: webhookData
        })
      })

      console.log('📡 [WEBHOOK] Edge Function response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [WEBHOOK] Edge Function error response:', errorText)
        throw new Error(`Webhook failed with status: ${response.status}`)
      }

      const responseData = await response.json()
      console.log('✅ [WEBHOOK] Edge Function success response:', responseData)

      // Update response to mark webhook as sent
      console.log('💾 [WEBHOOK] Updating database to mark webhook as sent...')
      const { error: updateError } = await supabase
        .from('responses')
        .update({ webhook_sent: true })
        .eq('id', responseId)

      if (updateError) {
        console.error('❌ [WEBHOOK] Database update error:', updateError)
      } else {
        console.log('✅ [WEBHOOK] Database updated successfully')
      }

      console.log('🎉 [WEBHOOK] Webhook process completed successfully!')
    } catch (error) {
      console.error('💥 [WEBHOOK] Webhook error:', error)
      throw error
    }
  }

  const sendClientEmailNotification = async (responseId: string) => {
    console.log('📧 [EMAIL] Starting email notification for response:', responseId)

    try {
      if (!formData || !formData.clients) {
        console.log('❌ [EMAIL] No form data or client info available')
        return
      }

      console.log('👥 [EMAIL] Client info:', {
        clientName: formData.clients.name,
        clientEmail: formData.clients.client_email,
        emailNotificationsEnabled: formData.clients.email_notifications_enabled
      })

      // Check if the client has email notifications enabled
      if (!formData.clients.email_notifications_enabled) {
        console.log('⚠️ [EMAIL] Client has email notifications disabled')
        return
      }

      // Check if the client has an email configured
      if (!formData.clients.client_email) {
        console.log('⚠️ [EMAIL] Client does not have email configured')
        return
      }

      console.log('🔑 [EMAIL] Fetching Brevo API key from user settings...')

      // Fetch Brevo API key from user_settings
      let brevoApiKey = null;
      try {
        console.log('🔍 [EMAIL] Querying user_settings for Brevo API key...')
        const { data, error } = await supabase
          .from('user_settings')
          .select('brevo_api_key')
          .eq('user_id', formData.user_id)
          .maybeSingle();

        console.log('📊 [EMAIL] Brevo API key query result:', {
          found: !!data,
          error: error?.message,
          hasApiKey: !!(data?.brevo_api_key)
        })

        if (error) {
          console.warn('⚠️ [EMAIL] Could not fetch Brevo API key:', error.message)
        }
        brevoApiKey = data?.brevo_api_key || null;
        console.log('🔑 [EMAIL] Brevo API key status:', brevoApiKey ? 'Found' : 'Not found')
      } catch (err) {
        console.error('❌ [EMAIL] Error fetching Brevo API key:', err);
      }

      if (!brevoApiKey) {
        console.warn('Brevo API key not configured in user settings, trying environment variable as fallback')
        brevoApiKey = import.meta.env.VITE_BREVO_API_KEY
      }

      if (!brevoApiKey) {
        console.warn('Brevo API key not configured in user settings or environment, skipping email notification');
        return;
      }

      console.log('Sending email notification to:', formData.clients.client_email);

      // Fetch additional emails from the database
      let additionalEmails: string[] = [];
      try {
        const { data: clientData } = await supabase
          .from('clients')
          .select('additional_emails')
          .eq('id', formData.clients.id)
          .single();

        if (clientData?.additional_emails && Array.isArray(clientData.additional_emails)) {
          additionalEmails = clientData.additional_emails.filter((email: string) => 
            email && email.trim() && email !== formData.clients.client_email && isValidEmail(email.trim())
          );
        }
        console.log('Additional emails found:', additionalEmails);
      } catch (error) {
        console.warn('Could not fetch additional emails:', error);
      }

      // Get the full response data for email template
      const responseData = await getResponseDataForEmail(responseId);
      if (!responseData) {
        console.error('Could not fetch response data for email');
        return;
      }

      const emailHtml = generateEmailTemplate(responseData);
      const emailText = generateEmailText(responseData);

      // Build recipients array
      const recipients = [];

      // Add primary email
      if (formData.clients.client_email) {
        recipients.push({
          email: formData.clients.client_email,
          name: formData.clients.name || 'Client'
        });
      }

      // Add additional emails
      additionalEmails.forEach(email => {
        if (email && email.trim()) {
          recipients.push({
            email: email.trim(),
            name: formData.clients.name || 'Client'
          });
        }
      });

      console.log('📝 [EMAIL] Recipients list:', recipients);

      const emailPayload = {
        sender: {
          name: "Online Designer - Advertomedia",
          email: "designer@advertomedia.co.uk"
        },
        to: recipients,
        subject: `New Response Received - ${formName}`,
        htmlContent: emailHtml,
        textContent: emailText
      };

      console.log('📦 [EMAIL] Email payload prepared:', {
        subject: emailPayload.subject,
        recipientCount: recipients.length,
        hasHtmlContent: !!emailHtml,
        hasTextContent: !!emailText
      });

      console.log('🌐 [EMAIL] Sending email via Brevo API...');
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': brevoApiKey
        },
        body: JSON.stringify(emailPayload)
      });

      console.log('📡 [EMAIL] Brevo API response status:', response.status);

      if (response.ok) {
        console.log(`✅ [EMAIL] Client email notification sent successfully to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`);
      } else {
        const errorData = await response.text();
        console.error('❌ [EMAIL] Brevo API error:', response.status, errorData);
      }

    } catch (error) {
      console.error('Email notification error:', error)
      throw error
    }
  }

  const getResponseDataForEmail = async (responseId: string) => {
    try {
      // Get the response with contact data
      const { data: responseData, error: responseError } = await supabase
        .from('responses')
        .select('id, contact_name, contact_email, contact_phone, contact_postcode, submitted_at')
        .eq('id', responseId)
        .single()

      if (responseError || !responseData) {
        console.error('Error fetching response for email:', responseError)
        return null
      }

      // Get the response answers with step details
      const { data: answers, error: answersError } = await supabase
        .from('response_answers')
        .select(`
          id,
          answer_text,
          selected_option_id,
          file_url,
          file_name,
          file_size,
          width,
          height,
          depth,
          units,
          scale_rating,
          step_id
        `)
        .eq('response_id', responseId)

      if (answersError) {
        console.error('Error fetching answers for email:', answersError)
      }

      // Get frames data if exists
      const { data: framesData, error: framesError } = await supabase
        .from('response_frames')
        .select('*')
        .eq('response_id', responseId)
        .order('frame_number', { ascending: true })

      if (framesError) {
        console.error('Error fetching frames for email:', framesError)
      }

      // Match answers with step information from current form data
      const enrichedAnswers = (answers || []).map(answer => {
        const step = steps.find(s => s.id === answer.step_id)
        return {
          ...answer,
          question_title: step?.title || 'Question',
          question_type: step?.question_type || 'unknown',
          step_order: step?.step_order || 0,
          options: step?.options || []
        }
      }).sort((a, b) => a.step_order - b.step_order)

      return {
        response_id: responseData.id,
        form_name: formName,
  client_name: formData?.clients?.name || 'Client',
  contact_name: responseData.contact_name,
        contact_email: responseData.contact_email,
        contact_phone: responseData.contact_phone,
        contact_postcode: responseData.contact_postcode,
        submitted_at: responseData.submitted_at,
        answers: enrichedAnswers,
        frames_data: framesData || []
      }

    } catch (error) {
      console.error('Error in getResponseDataForEmail:', error)
      return null
    }
  }

  const generateEmailTemplate = (data: any): string => {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatAnswer = (answer: any): string => {
      let answerContent = ''
      
      switch (answer.question_type) {
        case 'text_input':
        case 'text_area':
          answerContent = answer.answer_text || 'No response'
          break
        
        case 'multiple_choice':
          const selectedOption = answer.options?.find((opt: any) => opt.id === answer.selected_option_id)
          answerContent = selectedOption?.label || answer.answer_text || 'No selection'
          break
        
        case 'image_selection':
          const selectedImage = answer.options?.find((opt: any) => opt.id === answer.selected_option_id)
          if (selectedImage) {
            answerContent = `
              <div style="margin: 10px 0;">
                <img src="${selectedImage.image_url}" alt="${selectedImage.label}" style="max-width: 200px; max-height: 150px; border-radius: 8px; border: 2px solid #e5e7eb;">
                <p style="margin: 5px 0; font-weight: 600;">${selectedImage.label}</p>
              </div>
            `
          } else {
            answerContent = 'No image selected'
          }
          break
        
        case 'file_upload':
          if (answer.file_url && answer.file_name) {
            const fileSizeKB = answer.file_size ? Math.round(answer.file_size / 1024) : 'Unknown size'
            answerContent = `
              <div style="display: inline-block; padding: 10px 15px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <a href="${answer.file_url}" style="color: #3b82f6; text-decoration: none; font-weight: 600;">
                  📎 ${answer.file_name}
                </a>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">${fileSizeKB} KB</p>
              </div>
            `
          } else {
            answerContent = 'No file uploaded'
          }
          break
        
        case 'dimensions':
          const dimensions = []
          if (answer.width) dimensions.push(`Width: ${answer.width}${answer.units || ''}`)
          if (answer.height) dimensions.push(`Height: ${answer.height}${answer.units || ''}`)
          if (answer.depth) dimensions.push(`Depth: ${answer.depth}${answer.units || ''}`)
          answerContent = dimensions.length > 0 ? dimensions.join(' × ') : 'No dimensions provided'
          break
        
        case 'opinion_scale':
          if (answer.scale_rating !== null) {
            const stars = '★'.repeat(answer.scale_rating) + '☆'.repeat(5 - answer.scale_rating)
            answerContent = `${stars} (${answer.scale_rating}/5)`
          } else {
            answerContent = 'No rating provided'
          }
          break
        
        default:
          answerContent = answer.answer_text || 'No response'
      }
      
      return answerContent
    }

    const answersHtml = data.answers.map((answer: any, index: number) => `
      <div style="margin-bottom: 25px; padding: 20px; background-color: #f9fafb; border-radius: 10px; border-left: 4px solid #3b82f6;">
        <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
          ${index + 1}. ${answer.question_title}
        </h3>
        <div style="color: #374151;">
          ${formatAnswer(answer)}
        </div>
      </div>
    `).join('')

    // Contact information section
    const contactInfo = []
    if (data.contact_name) contactInfo.push(`<strong>Name:</strong> ${data.contact_name}`)
    if (data.contact_email) contactInfo.push(`<strong>Email:</strong> <a href="mailto:${data.contact_email}" style="color: #3b82f6;">${data.contact_email}</a>`)
    if (data.contact_phone) contactInfo.push(`<strong>Phone:</strong> <a href="tel:${data.contact_phone}" style="color: #3b82f6;">${data.contact_phone}</a>`)
    if (data.contact_postcode) contactInfo.push(`<strong>Postcode:</strong> ${data.contact_postcode}`)

    const contactHtml = contactInfo.length > 0 ? `
      <div style="margin: 30px 0; padding: 20px; background-color: #ecfdf5; border-radius: 10px; border-left: 4px solid #10b981;">
        <h2 style="margin: 0 0 15px 0; color: #065f46; font-size: 18px;">👤 Contact Information</h2>
        <div style="color: #047857; line-height: 1.6;">
          ${contactInfo.join('<br>')}
        </div>
      </div>
    ` : ''

    // Frames data section (if exists)
    const framesHtml = data.frames_data && data.frames_data.length > 0 ? `
      <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-radius: 10px; border-left: 4px solid #f59e0b;">
        <h2 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px;">🖼️ Frame Data</h2>
        ${data.frames_data.map((frame: any) => `
          <div style="margin-bottom: 15px; padding: 15px; background-color: white; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0; color: #92400e;">Frame ${frame.frame_number}</h4>
            ${frame.image_url ? `<img src="${frame.image_url}" alt="Frame ${frame.frame_number}" style="max-width: 200px; max-height: 150px; border-radius: 6px; margin-bottom: 10px;">` : ''}
            ${frame.location_text ? `<p><strong>Location:</strong> ${frame.location_text}</p>` : ''}
            ${frame.measurements_text ? `<p><strong>Measurements:</strong> ${frame.measurements_text}</p>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Form Response - ${data.form_name}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; color: white;">
            <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 700;">🎉 New Form Response!</h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">You've received a new submission</p>
          </div>

          <!-- Form Details -->
          <div style="margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-radius: 10px; border-left: 4px solid #6366f1;">
            <h2 style="margin: 0 0 15px 0; color: #4338ca; font-size: 18px;">📋 Form Details</h2>
            <p style="margin: 5px 0; color: #1f2937;"><strong>Form Name:</strong> ${data.form_name}</p>
            <p style="margin: 5px 0; color: #1f2937;"><strong>Client:</strong> ${data.client_name}</p>
            <p style="margin: 5px 0; color: #1f2937;"><strong>Submitted:</strong> ${formatDate(data.submitted_at)}</p>
          </div>

          <!-- Contact Information -->
          ${contactHtml}

          <!-- Responses -->
          <div style="margin-bottom: 30px;">
            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
              💬 Form Responses
            </h2>
            ${answersHtml}
          </div>

          <!-- Frames Data -->
          ${framesHtml}

          <!-- View All Responses Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://designer.advertomedia.co.uk/responses" 
               style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              🔗 View All Responses
            </a>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; padding: 20px; background-color: #f3f4f6; border-radius: 10px; text-align: center; color: #6b7280; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">This email was sent automatically by Online Designer</p>
            <p style="margin: 0;">
              <a href="https://designer.advertomedia.co.uk" style="color: #3b82f6; text-decoration: none;">designer.advertomedia.co.uk</a> | 
              <a href="mailto:designer@advertomedia.co.uk" style="color: #3b82f6; text-decoration: none;">designer@advertomedia.co.uk</a>
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `
  }

  const generateEmailText = (data: any): string => {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    let text = `NEW FORM RESPONSE RECEIVED!\n\n`
    text += `Form: ${data.form_name}\n`
    text += `Client: ${data.client_name}\n`
    text += `Submitted: ${formatDate(data.submitted_at)}\n\n`

    if (data.contact_name || data.contact_email || data.contact_phone || data.contact_postcode) {
      text += `CONTACT INFORMATION:\n`
      if (data.contact_name) text += `Name: ${data.contact_name}\n`
      if (data.contact_email) text += `Email: ${data.contact_email}\n`
      if (data.contact_phone) text += `Phone: ${data.contact_phone}\n`
      if (data.contact_postcode) text += `Postcode: ${data.contact_postcode}\n`
      text += `\n`
    }

    text += `RESPONSES:\n`
    data.answers.forEach((answer: any, index: number) => {
      text += `${index + 1}. ${answer.question_title}\n`
      
      let answerText = ''
      switch (answer.question_type) {
        case 'text_input':
        case 'text_area':
          answerText = answer.answer_text || 'No response'
          break
        case 'multiple_choice':
          const selectedOption = answer.options?.find((opt: any) => opt.id === answer.selected_option_id)
          answerText = selectedOption?.label || answer.answer_text || 'No selection'
          break
        case 'file_upload':
          if (answer.file_url && answer.file_name) {
            answerText = `File: ${answer.file_name} (${answer.file_url})`
          } else {
            answerText = 'No file uploaded'
          }
          break
        case 'dimensions':
          const dimensions = []
          if (answer.width) dimensions.push(`Width: ${answer.width}${answer.units || ''}`)
          if (answer.height) dimensions.push(`Height: ${answer.height}${answer.units || ''}`)
          if (answer.depth) dimensions.push(`Depth: ${answer.depth}${answer.units || ''}`)
          answerText = dimensions.length > 0 ? dimensions.join(' × ') : 'No dimensions provided'
          break
        case 'opinion_scale':
          answerText = answer.scale_rating !== null ? `Rating: ${answer.scale_rating}/5` : 'No rating provided'
          break
        default:
          answerText = answer.answer_text || 'No response'
      }
      
      text += `   ${answerText}\n\n`
    })

    if (data.frames_data && data.frames_data.length > 0) {
      text += `FRAME DATA:\n`
      data.frames_data.forEach((frame: any) => {
        text += `Frame ${frame.frame_number}:\n`
        if (frame.location_text) text += `  Location: ${frame.location_text}\n`
        if (frame.measurements_text) text += `  Measurements: ${frame.measurements_text}\n`
        if (frame.image_url) text += `  Image: ${frame.image_url}\n`
        text += `\n`
      })
    }

    text += `View all responses: https://designer.advertomedia.co.uk/responses\n\n`
    text += `---\nThis email was sent automatically by Online Designer\n`
    text += `designer.advertomedia.co.uk | designer@advertomedia.co.uk`

    return text
  }

  const goNext = async () => {
    const step = steps[currentStepIndex]
    if (!step) return

    console.log('➡️ [FORM] Navigation triggered:', {
      currentStep: currentStepIndex + 1,
      totalSteps: steps.length,
      stepType: step.question_type,
      isLastStep: currentStepIndex === steps.length - 1
    })

    // require answer if needed
    const resp = responses[currentStepIndex]
    if (step.is_required) {
      // Specialized validation per question type
      if (step.question_type === 'frames_plan') {
        const count = (resp as any)?.frames_count || 1
        const frames = ((resp as any)?.frames || []) as Array<any>
        const issues: string[] = []
        for (let i = 0; i < count; i++) {
          const f = frames[i] || {}
          const missing: string[] = []
          if ((step.frames_require_image ?? true) && !f.image_url) missing.push('Image')
          if ((step.frames_require_location ?? true) && !(f.location_text || '').trim()) missing.push('Location')
          if ((step.frames_require_measurements ?? false) && !(f.measurements_text || '').trim()) missing.push('Measurements')
          if (missing.length > 0) {
            issues.push(`Frame ${i + 1}: ${missing.join(', ')} required`)
          }
        }
        if (issues.length > 0) {
          alert(`Please complete the required fields before continuing:\n\n${issues.map(i => `• ${i}`).join('\n')}`)
          return
        }
        // frames_plan is valid → proceed without generic check
      } else if (!resp || (!resp.option_id && !resp.answer_text && !resp.file && !resp.contact_name && !resp.contact_email)) {
        alert('Please answer this step before continuing')
        return
      }
    }

    if (currentStepIndex === steps.length - 1) {
      console.log('🎯 [FORM] Final step reached - starting form submission process...')
      console.log('📝 [FORM] Form data:', { formId: id, formName, clientId: formData?.client_id })
      console.log('📊 [FORM] Responses to submit:', responses)

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

      console.log('👤 [FORM] Contact data extracted:', contactData)

      // submit: create responses row and response_answers
      console.log('💾 [FORM] Creating response record in database...')
      const { data: inserted, error: resErr } = await supabase.from('responses').insert([{
        form_id: id,
        ...contactData
      }]).select().single()

      if (resErr || !inserted) {
        console.error('❌ [FORM] Error creating response:', resErr)
        alert('Submission failed')
        return
      }

      console.log('✅ [FORM] Response record created:', { responseId: inserted.id, submitted_at: inserted.submitted_at })

      const responseId = inserted.id
  // build answers and frame rows (for frames_plan)
  const answers = [] as any[]
  const frameRows = [] as any[]
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

        // Collect frames_plan rows
        if (stepObj.question_type === 'frames_plan' && (ans as any)?.frames?.length) {
          const frames = (ans as any).frames as Array<any>
          frames.forEach((f: any, idx: number) => {
            frameRows.push({
              response_id: responseId,
              step_id: stepObj.id,
              frame_number: f.frame_number ?? idx + 1,
              image_url: f.image_url ?? null,
              location_text: f.location_text ?? null,
              measurements_text: f.measurements_text ?? null
            })
          })
        }
      }

      if (answers.length > 0) {
        const { error: ansErr } = await supabase.from('response_answers').insert(answers)
        if (ansErr) console.error('Error inserting answers', ansErr)
      }

      // Insert frames rows if present
      if (frameRows.length > 0) {
        const { error: framesErr } = await supabase.from('response_frames').insert(frameRows)
        if (framesErr) console.error('Error inserting response_frames', framesErr)
      }

      // Webhook is now sent automatically via database trigger
      console.log('🚀 [WEBHOOK] Database trigger should fire now for webhook...')
      console.log('📡 [WEBHOOK] Expecting webhook to be sent to client webhook URL')
      console.log('⏳ [WEBHOOK] Webhook will be processed asynchronously by database trigger')

      // Send email notification to client
      console.log('📧 [EMAIL] Starting client email notification process...')
      try {
        await sendClientEmailNotification(responseId)
        console.log('✅ [EMAIL] Client email notification completed')
      } catch (error) {
        console.error('❌ [EMAIL] Email notification failed:', error)
        // Don't fail the form submission if email fails
      }

      console.log('🎉 [FORM] Form submission completed successfully!')
      console.log('📋 [FORM] Response ID:', responseId)
      console.log('🔗 [FORM] View responses at: https://designer.advertomedia.co.uk/responses')

      setCurrentStepIndex(currentStepIndex + 1)
      return
    }

    // Regular next step navigation - add to history
    setNavigationHistory(prev => [...prev, currentStepIndex])
    
    // Trigger animation for image selection steps
    const currentStep = steps[currentStepIndex]
    const nextStep = steps[currentStepIndex + 1]
    if (currentStep?.question_type === 'image_selection' && nextStep?.question_type === 'image_selection') {
      setPreviousStepIndex(currentStepIndex)
      setAnimationDirection('forward')
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStepIndex(currentStepIndex + 1)
        setTimeout(() => setIsAnimating(false), 300)
      }, 150)
    } else {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const goPrev = () => {
    if (navigationHistory.length > 1) {
      // Go back to the previous step in history
      const newHistory = [...navigationHistory]
      newHistory.pop() // Remove current step
      const previousStep = newHistory[newHistory.length - 1]
      setNavigationHistory(newHistory)
      
      // Trigger animation for image selection steps
      const currentStep = steps[currentStepIndex]
      const prevStep = steps[previousStep]
      if (currentStep?.question_type === 'image_selection' && prevStep?.question_type === 'image_selection') {
        setPreviousStepIndex(currentStepIndex)
        setAnimationDirection('backward')
        setIsAnimating(true)
        setTimeout(() => {
          setCurrentStepIndex(previousStep)
          setTimeout(() => setIsAnimating(false), 300)
        }, 150)
      } else {
        setCurrentStepIndex(previousStep)
      }
    } else {
      // Regular previous navigation if no history (shouldn't happen but safeguard)
      setCurrentStepIndex(Math.max(0, currentStepIndex - 1))
    }
  }

  // Get the current theme configuration
  const currentTheme = formThemes[formTheme as keyof typeof formThemes] || formThemes.generic

  if (loading) {
    return (
      <div className={`${currentTheme.styles.background} flex items-center justify-center`}>
        <div className={`${currentTheme.styles.card} w-full max-w-2xl text-center`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading form...</h2>
          <p className={currentTheme.styles.text.body}>Please wait while we load your form.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${currentTheme.styles.background} flex items-center justify-center`}>
        <div className={`${currentTheme.styles.card} w-full max-w-2xl text-center`}>
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600">Error Loading Form</h2>
          <p className={`${currentTheme.styles.text.body} mb-4`}>{error}</p>
          <button 
            onClick={() => id && loadForm(id)}
            style={{
              backgroundColor: formColors.primaryButtonColor,
              color: formColors.primaryButtonTextColor
            }}
            className={`${currentTheme.styles.button.primary} hover:opacity-90 transition-all duration-200`}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!steps || steps.length === 0) {
    return (
      <div className={`${currentTheme.styles.background} flex items-center justify-center`}>
        <div className={`${currentTheme.styles.card} w-full max-w-2xl text-center`}>
          <h2 className="text-xl font-semibold">Form not available</h2>
          <p className={currentTheme.styles.text.body}>This form isn't published or contains no steps.</p>
        </div>
      </div>
    )
  }

  if (currentStepIndex >= steps.length) {
    return (
      <div className={`${currentTheme.styles.background} flex items-center justify-center`}>
        <div className={`${currentTheme.styles.card} w-full max-w-2xl text-center`}>
          <h2 className="text-xl font-semibold">Thank you</h2>
          <p className={currentTheme.styles.text.body}>Your submission has been received.</p>
        </div>
      </div>
    )
  }

  const step = steps[currentStepIndex]
  const percent = Math.round(((currentStepIndex) / steps.length) * 100)

  return (
  <div ref={formContainerRef} className={`${currentTheme.styles.background}`} style={{ position: 'relative', height: 'auto' }}>
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
  {formData?.clients && (
          <div className="text-center mb-6 pb-4 border-b border-gray-200">
            {/* Client Logo */}
            {formData?.clients?.logo_url ? (
              <div className="flex justify-center mb-3">
                <img 
                  src={formData?.clients?.logo_url}
                  alt={`${formData?.clients?.name ?? ''} logo`}
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{formData?.clients?.name}</h2>
            
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
                    <span className="text-orange-500">⚠️</span> I agree to be contacted by {formData?.clients?.name || 'the company'} regarding my enquiry <span className="text-red-500">*</span>
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
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.currentTarget.classList.add('border-blue-500', 'bg-blue-50')
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
                
                const files = Array.from(e.dataTransfer.files)
                if (files.length > 0) {
                  handleFileUpload(files[0])
                }
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
        ) : step.question_type === 'frames_plan' ? (
          <div className="mt-6">
            <div className="space-y-6">
              {/* Number of frames selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">How many frames do you want?</label>
                <select
                  value={(responses[currentStepIndex] as any)?.frames_count || 1}
                  onChange={(e) => {
                    const count = parseInt(e.target.value)
                    setResponses(r => ({
                      ...r,
                      [currentStepIndex]: {
                        ...(r[currentStepIndex] || {}),
                        frames_count: count,
                        frames: Array(count).fill(null).map((_, i) => 
                          (r[currentStepIndex] as any)?.frames?.[i] || {
                            frame_number: i + 1,
                            image_url: '',
                            location_text: '',
                            measurements_text: ''
                          }
                        )
                      }
                    }))
                  }}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required={step.is_required}
                >
                  {Array.from({ length: step.frames_max_count || 10 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'frame' : 'frames'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Frame sections */}
              {Array.from({ length: (responses[currentStepIndex] as any)?.frames_count || 1 }, (_, frameIndex) => {
                const frameData = (responses[currentStepIndex] as any)?.frames?.[frameIndex] || {}
                
                return (
                  <div key={frameIndex} className="border rounded-lg p-6 bg-gray-50">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Frame {frameIndex + 1}</h4>
                    
                    <div className="space-y-4">
                      {/* Image Upload */}
                      {(step.frames_require_image ?? true) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Image{step.frames_require_image ? ' *' : ''}
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (file && step.id) {
                                  try {
                                    // Upload file logic here (similar to existing file upload)
                                    const filename = `frames/${step.id}/${Date.now()}-${file.name}`
                                    const { error: uploadError } = await supabase.storage
                                      .from('form-assets')
                                      .upload(filename, file)
                                    
                                    if (uploadError) throw uploadError
                                    
                                    const { data } = supabase.storage
                                      .from('form-assets')
                                      .getPublicUrl(filename)
                                    
                                    // Update frame data
                                    setResponses(r => {
                                      const current = r[currentStepIndex] || {}
                                      const frames = [...((current as any)?.frames || [])]
                                      frames[frameIndex] = {
                                        ...frames[frameIndex],
                                        frame_number: frameIndex + 1,
                                        image_url: data.publicUrl
                                      }
                                      return {
                                        ...r,
                                        [currentStepIndex]: {
                                          ...current,
                                          frames
                                        }
                                      }
                                    })
                                  } catch (error) {
                                    console.error('Error uploading frame image:', error)
                                  }
                                }
                              }}
                              className="hidden"
                              id={`frame-image-${frameIndex}`}
                            />
                            <label 
                              htmlFor={`frame-image-${frameIndex}`}
                              className="cursor-pointer flex flex-col items-center space-y-2"
                              onDragOver={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                e.currentTarget.closest('.border-2')?.classList.add('border-blue-500', 'bg-blue-50')
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                e.currentTarget.closest('.border-2')?.classList.remove('border-blue-500', 'bg-blue-50')
                              }}
                              onDrop={async (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                e.currentTarget.closest('.border-2')?.classList.remove('border-blue-500', 'bg-blue-50')
                                
                                const files = Array.from(e.dataTransfer.files)
                                const imageFile = files.find(file => file.type.startsWith('image/'))
                                
                                if (imageFile && step.id) {
                                  try {
                                    const filename = `frames/${step.id}/${Date.now()}-${imageFile.name}`
                                    const { error: uploadError } = await supabase.storage
                                      .from('form-assets')
                                      .upload(filename, imageFile)
                                    
                                    if (uploadError) throw uploadError
                                    
                                    const { data } = supabase.storage
                                      .from('form-assets')
                                      .getPublicUrl(filename)
                                    
                                    // Update frame data
                                    setResponses(r => {
                                      const current = r[currentStepIndex] || {}
                                      const frames = [...((current as any)?.frames || [])]
                                      frames[frameIndex] = {
                                        ...frames[frameIndex],
                                        frame_number: frameIndex + 1,
                                        image_url: data.publicUrl
                                      }
                                      return {
                                        ...r,
                                        [currentStepIndex]: {
                                          ...current,
                                          frames
                                        }
                                      }
                                    })
                                  } catch (error) {
                                    console.error('Error uploading frame image:', error)
                                  }
                                }
                              }}
                            >
                              {frameData.image_url ? (
                                <div className="space-y-2">
                                  <img 
                                    src={frameData.image_url} 
                                    alt={`Frame ${frameIndex + 1}`}
                                    className="w-32 h-32 object-cover rounded"
                                  />
                                  <p className="text-sm text-gray-600">Click to change</p>
                                </div>
                              ) : (
                                <>
                                  <Upload className="h-12 w-12 text-gray-400" />
                                  <div>
                                    <p className="text-lg font-medium text-gray-600">Choose file</p>
                                    <p className="text-sm text-gray-500">PNG, JPG up to 10MB (drag & drop or click)</p>
                                  </div>
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                      )}
                      
                      {/* Location Input */}
                      {(step.frames_require_location ?? true) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Room Location (e.g., bedroom){step.frames_require_location ? ' *' : ''}
                          </label>
                          <input
                            type="text"
                            value={frameData.location_text || ''}
                            onChange={(e) => {
                              setResponses(r => {
                                const current = r[currentStepIndex] || {}
                                const frames = [...((current as any)?.frames || [])]
                                frames[frameIndex] = {
                                  ...frames[frameIndex],
                                  frame_number: frameIndex + 1,
                                  location_text: e.target.value
                                }
                                return {
                                  ...r,
                                  [currentStepIndex]: {
                                    ...current,
                                    frames
                                  }
                                }
                              })
                            }}
                            placeholder="e.g., bedroom"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required={step.frames_require_location && step.is_required}
                          />
                        </div>
                      )}
                      
                      {/* Measurements Input */}
                      {(step.frames_require_measurements ?? false) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Measurements (optional) - width × height in mm{step.frames_require_measurements ? ' *' : ''}
                          </label>
                          <input
                            type="text"
                            value={frameData.measurements_text || ''}
                            onChange={(e) => {
                              setResponses(r => {
                                const current = r[currentStepIndex] || {}
                                const frames = [...((current as any)?.frames || [])]
                                frames[frameIndex] = {
                                  ...frames[frameIndex],
                                  frame_number: frameIndex + 1,
                                  measurements_text: e.target.value
                                }
                                return {
                                  ...r,
                                  [currentStepIndex]: {
                                    ...current,
                                    frames
                                  }
                                }
                              })
                            }}
                            placeholder="e.g., 1200 × 800"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required={step.frames_require_measurements && step.is_required}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {step.is_required && (
                <p className="text-xs text-gray-500">* indicates required fields</p>
              )}
            </div>
          </div>
        ) : (
          <div 
            className={`grid gap-4 mt-6 ${
              step.images_per_row === 1 
                ? 'grid-cols-1' 
                : step.images_per_row === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : step.images_per_row === 3 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : step.images_per_row === 4
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-2' // default case (2 per row)
            }`}
          >
            {step.options.map((opt: any, index: number) => (
              <AnimatedImageCard
                key={opt.id}
                option={opt}
                isSelected={responses[currentStepIndex]?.option_id === opt.id}
                onClick={() => selectOption(opt)}
                isAnimating={isAnimating}
                animationDirection={animationDirection}
                index={index}
              />
            ))}
          </div>
        )}

        <div className="flex justify-between items-center gap-2 mt-6">
          <button 
            onClick={goPrev} 
            disabled={currentStepIndex === 0} 
            className={`${currentTheme.styles.button.secondary} ${currentStepIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              backgroundColor: formColors.secondaryButtonColor,
              color: formColors.secondaryButtonTextColor
            }}
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={goNext} 
              className={currentTheme.styles.button.primary}
              style={{
                backgroundColor: formColors.primaryButtonColor,
                color: formColors.primaryButtonTextColor,
                backgroundImage: 'none'
              }}
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
