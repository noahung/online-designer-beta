import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  Loader
} from 'lucide-react'

export default function ResponseDetail() {
  const { responseId } = useParams<{ responseId: string }>()
  const navigate = useNavigate()
  const { push } = useToast()
  const { theme } = useTheme()
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (responseId) {
      fetchResponseDetails()
    }
  }, [responseId])

  const fetchResponseDetails = async () => {
    try {
      // Get response with answers
      const { data: responseData, error: responseError } = await supabase
        .from('responses')
        .select(`
          id,
          form_id,
          contact_name,
          contact_email,
          contact_phone,
          contact_postcode,
          preferred_contact,
          project_details,
          submitted_at,
          response_answers (
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
            frames_count,
            step_id,
            form_steps!step_id (
              id,
              title,
              question_type,
              step_order
            )
          )
        `)
        .eq('id', responseId)
        .single()

      if (responseError) throw responseError

      // Get form data
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select(`
          id,
          name,
          clients (
            id,
            name
          )
        `)
        .eq('id', responseData.form_id)
        .single()

      if (formError) throw formError

      // Combine data
      const combinedData: any = {
        ...responseData,
        form: formData
      }

      // Fetch form_options for selected options
      if (combinedData.response_answers) {
        const optionIds = combinedData.response_answers
          .map((answer: any) => answer.selected_option_id)
          .filter(Boolean)

        let optionsMap = new Map()
        
        if (optionIds.length > 0) {
          const { data: optionsData, error: optionsError } = await supabase
            .from('form_options')
            .select('id, label, image_url')
            .in('id', optionIds)

          if (optionsError) throw optionsError

          optionsData?.forEach(option => {
            optionsMap.set(option.id, option)
          })
        }

        // Attach options
        combinedData.response_answers = combinedData.response_answers.map((answer: any) => ({
          ...answer,
          form_option: answer.selected_option_id ? optionsMap.get(answer.selected_option_id) : null
        }))

        // Sort by step order
        combinedData.response_answers.sort((a: any, b: any) => {
          const aOrder = a.form_steps?.step_order || 0
          const bOrder = b.form_steps?.step_order || 0
          return aOrder - bOrder
        })
      }

      // Fetch frames
      const { data: framesData, error: framesError } = await supabase
        .from('response_frames')
        .select(`
          id,
          response_id,
          step_id,
          frame_number,
          image_url,
          location_text,
          measurements_text
        `)
        .eq('response_id', responseId)
        .order('step_id')
        .order('frame_number', { ascending: true })

      if (framesError) {
        console.error('Error fetching frames:', framesError)
      } else {
        console.log('Frames data fetched:', framesData)
        console.log('Frame URLs:', framesData?.map(f => ({ id: f.id, url: f.image_url })))
        combinedData.response_frames = framesData || []
      }

      console.log('Response detail loaded:', combinedData)
      console.log('Response frames:', combinedData.response_frames)
      console.log('Response answers:', combinedData.response_answers)
      setResponse(combinedData)
    } catch (error) {
      console.error('Error fetching response details:', error)
      push({ type: 'error', message: 'Failed to load response details' })
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      push({ type: 'success', message: 'Downloaded successfully' })
    } catch (error) {
      console.error('Error downloading file:', error)
      push({ type: 'error', message: 'Failed to download file' })
    }
  }

  const downloadAllAttachments = async () => {
    try {
      let downloadCount = 0

      // Download all files from answers
      if (response.response_answers) {
        for (const answer of response.response_answers) {
          if (answer.file_url && answer.file_name) {
            await downloadFile(answer.file_url, answer.file_name)
            downloadCount++
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        }
      }

      // Download all frame images
      if (response.response_frames) {
        for (const frame of response.response_frames) {
          if (frame.image_url) {
            const fileName = `frame-${frame.frame_number}-step-${frame.step_id}.jpg`
            await downloadFile(frame.image_url, fileName)
            downloadCount++
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        }
      }

      if (downloadCount > 0) {
        push({ type: 'success', message: `Downloaded ${downloadCount} file${downloadCount > 1 ? 's' : ''}` })
      } else {
        push({ type: 'info', message: 'No attachments to download' })
      }
    } catch (error) {
      console.error('Error downloading all attachments:', error)
      push({ type: 'error', message: 'Failed to download some files' })
    }
  }

  const renderAnswerValue = (answer: any) => {
    const questionType = answer.form_steps?.question_type

    // If frames_plan, don't show "No response" since frames are rendered below
    if (questionType === 'frames_plan') {
      return null
    }

    // File upload
    if ((questionType === 'file_upload' || questionType === 'contact_fields') && answer.file_url) {
      return (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <a
                href={answer.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-zinc-900 dark:text-white hover:underline truncate block"
              >
                {answer.file_name || 'Uploaded Document'}
              </a>
              {answer.file_size && (
                <span className="text-[10px] font-mono text-zinc-400">
                  {(answer.file_size / 1024).toFixed(1)} KB
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => downloadFile(answer.file_url, answer.file_name || 'file')}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors flex-shrink-0"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }

    // Dimensions
    if (answer.width || answer.height || answer.depth) {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-xs font-semibold text-zinc-900 dark:text-white">
          <span>{answer.width || ''} × {answer.height || ''} {answer.depth ? `× ${answer.depth}` : ''} {answer.units || 'mm'}</span>
        </div>
      )
    }

    // Opinion scale
    if (answer.scale_rating !== null && answer.scale_rating !== undefined) {
      return (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`text-base ${star <= answer.scale_rating ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-700'}`}>
                ★
              </span>
            ))}
          </div>
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 ml-1">
            ({answer.scale_rating}/5)
          </span>
        </div>
      )
    }

    // Text or selected option
    if (answer.form_option) {
      return (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-900 dark:text-white">
            {answer.form_option.label}
          </p>
          {answer.form_option.image_url && (
            <div className="relative group inline-block rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
              <img 
                src={answer.form_option.image_url} 
                alt={answer.form_option.label}
                className="w-28 h-28 object-cover"
              />
              <button
                onClick={() => downloadFile(answer.form_option.image_url, 'image.jpg')}
                className="absolute top-1.5 right-1.5 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="Download image"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )
    }

    if (answer.answer_text) {
      return <p className="text-xs font-semibold text-zinc-900 dark:text-white">{answer.answer_text}</p>
    }

    return <p className="text-xs text-zinc-400 italic">No response</p>
  }

  const renderFrames = (stepId: string) => {
    const frames = response.response_frames?.filter((f: any) => f.step_id === stepId) || []
    if (frames.length === 0) return null

    return (
      <div className="mt-3 space-y-2.5">
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          {frames.length} frame{frames.length > 1 ? 's' : ''} captured:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {frames.map((frame: any) => (
            <div key={frame.id} className="bg-zinc-50 dark:bg-[#141416] rounded-xl p-3 border border-zinc-200 dark:border-zinc-800/90 space-y-2.5 shadow-2xs">
              {frame.image_url ? (
                <div className="relative group rounded-lg overflow-hidden border border-zinc-200/80 dark:border-zinc-800">
                  <img 
                    src={frame.image_url} 
                    alt={`Frame ${frame.frame_number}`}
                    className="w-full h-36 object-cover"
                  />
                  <button
                    onClick={() => downloadFile(frame.image_url, `frame-${frame.frame_number}.jpg`)}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Download Frame Image"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-36 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-400 text-xs">
                  No image attached
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">Frame {frame.frame_number}</span>
                  {frame.measurements_text && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
                      {frame.measurements_text}
                    </span>
                  )}
                </div>
                {frame.location_text && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {frame.location_text}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!response) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Response not found</h1>
        <button
          onClick={() => navigate('/responses')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Responses</span>
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 md:p-10 space-y-6 font-sans text-zinc-900 dark:text-zinc-100 animate-fade-in">
      {/* Top Header */}
      <div>
        <button
          onClick={() => navigate('/responses')}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Responses</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Submission Details
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Received {new Date(response.submitted_at).toLocaleString('en-GB', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>

          <button
            onClick={downloadAllAttachments}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Attachments</span>
          </button>
        </div>
      </div>

      {/* Grid: Contact Info & Form Meta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Contact Information (2 cols) */}
        <div className="md:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Contact Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-0.5">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Full Name</span>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {response.contact_name || 'Anonymous'}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Email Address</span>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                {response.contact_email || '—'}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Phone Number</span>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {response.contact_phone || '—'}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Postcode / Location</span>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                {response.contact_postcode || '—'}
              </p>
            </div>
          </div>

          {response.project_details && (
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block mb-1">
                Customer Message / Notes
              </span>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                {response.project_details}
              </p>
            </div>
          )}
        </div>

        {/* Form Meta (1 col) */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Form Details
          </h2>

          <div className="space-y-3.5 pt-1">
            <div className="space-y-0.5">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Form Title</span>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {response.form?.name || 'Untitled Form'}
              </p>
            </div>

            {response.form?.clients && (
              <div className="space-y-0.5">
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Client Workspace</span>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {response.form.clients.name}
                </p>
              </div>
            )}

            <div className="space-y-0.5">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Submission ID</span>
              <p className="text-[11px] font-mono text-zinc-500 truncate">
                {response.id}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Response Answers */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <h2 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Responses &amp; Specifications
          </h2>
          <span className="text-[11px] text-zinc-400">
            {response.response_answers?.length || 0} answer{response.response_answers?.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {response.response_answers?.map((answer: any, index: number) => (
            <div key={answer.id || index} className="py-4 first:pt-1 last:pb-1 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {answer.form_steps?.title || `Question ${index + 1}`}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/90 text-zinc-500 border border-zinc-200 dark:border-zinc-700/80">
                  {answer.form_steps?.question_type?.replace('_', ' ') || 'field'}
                </span>
              </div>

              <div>
                {renderAnswerValue(answer)}
                {answer.form_steps?.question_type === 'frames_plan' && renderFrames(answer.step_id)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
