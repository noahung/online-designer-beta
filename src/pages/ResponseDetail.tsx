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

    // File upload
    if ((questionType === 'file_upload' || questionType === 'contact_fields') && answer.file_url) {
      return (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg p-4 border border-blue-200 dark:border-blue-400/30">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <a
              href={answer.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium block truncate"
            >
              {answer.file_name || 'Download File'}
            </a>
            {answer.file_size && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {(answer.file_size / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
          <button
            onClick={() => downloadFile(answer.file_url, answer.file_name || 'file')}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex-shrink-0"
            title="Download file"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      )
    }

    // Dimensions
    if (answer.width || answer.height || answer.depth) {
      return (
        <span className="text-gray-900 dark:text-white">
          {answer.width || ''} × {answer.height || ''} × {answer.depth || ''} {answer.units || ''}
        </span>
      )
    }

    // Opinion scale
    if (answer.scale_rating !== null) {
      return (
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <span key={star} className={star <= answer.scale_rating ? 'text-yellow-400 text-xl' : 'text-gray-300 dark:text-gray-600 text-xl'}>
              ⭐
            </span>
          ))}
          <span className="text-gray-700 dark:text-gray-300 ml-2">({answer.scale_rating}/5)</span>
        </div>
      )
    }

    // Text or selected option
    if (answer.form_option) {
      return (
        <div className="space-y-2">
          <span className="text-gray-900 dark:text-white font-medium">{answer.form_option.label}</span>
          {answer.form_option.image_url && (
            <div className="relative group inline-block">
              <img 
                src={answer.form_option.image_url} 
                alt={answer.form_option.label}
                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
              />
              <button
                onClick={() => downloadFile(answer.form_option.image_url, 'image.jpg')}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )
    }

    return <span className="text-gray-900 dark:text-white">{answer.answer_text || 'No response'}</span>
  }

  const renderFrames = (stepId: string) => {
    const frames = response.response_frames?.filter((f: any) => f.step_id === stepId) || []
    if (frames.length === 0) return null

    return (
      <div className="mt-4 space-y-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {frames.length} frame{frames.length > 1 ? 's' : ''} captured
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {frames.map((frame: any) => (
            <div key={frame.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              {frame.image_url ? (
                <div className="relative group">
                  <img 
                    src={frame.image_url} 
                    alt={`Frame ${frame.frame_number}`}
                    className="w-full h-40 object-cover rounded-lg mb-2"
                  />
                  <button
                    onClick={() => downloadFile(frame.image_url, `frame-${frame.frame_number}.jpg`)}
                    className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-2">
                  <span className="text-gray-400 dark:text-gray-500 text-sm">No image</span>
                </div>
              )}
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-900 dark:text-white">Frame {frame.frame_number}</p>
                {frame.location_text && <p className="text-gray-600 dark:text-gray-400">{frame.location_text}</p>}
                {frame.measurements_text && <p className="text-gray-500 dark:text-gray-500 text-xs">{frame.measurements_text}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!response) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Response not found</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'} py-8`}>
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Response Details</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Submitted {new Date(response.submitted_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={downloadAllAttachments}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Download All Attachments
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-xl shadow-lg p-6 mb-6`}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {response.contact_name && (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">{response.contact_name}</p>
                </div>
              </div>
            )}
            {response.contact_email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">{response.contact_email}</p>
                </div>
              </div>
            )}
            {response.contact_phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">{response.contact_phone}</p>
                </div>
              </div>
            )}
            {response.contact_postcode && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Postcode</p>
                  <p className="font-medium text-gray-900 dark:text-white">{response.contact_postcode}</p>
                </div>
              </div>
            )}
          </div>
          {response.project_details && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Project Details</p>
              <p className="text-gray-900 dark:text-white">{response.project_details}</p>
            </div>
          )}
        </div>

        {/* Form Details */}
        <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-xl shadow-lg p-6 mb-6`}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Form Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Form Name</p>
              <p className="font-medium text-gray-900 dark:text-white">{response.form?.name}</p>
            </div>
            {response.form?.clients && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Client</p>
                <p className="font-medium text-gray-900 dark:text-white">{response.form.clients.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Responses */}
        <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-xl shadow-lg p-6`}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Response Answers</h2>
          <div className="space-y-6">
            {response.response_answers?.map((answer: any, index: number) => (
              <div key={answer.id} className={`pb-6 ${index < response.response_answers.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {answer.form_steps?.title || 'Question'}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    {answer.form_steps?.question_type?.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  {renderAnswerValue(answer)}
                  {answer.form_steps?.question_type === 'frames_plan' && (
                    <>
                      {answer.frames_count && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Requested: {answer.frames_count} frame{answer.frames_count > 1 ? 's' : ''}
                        </p>
                      )}
                      {renderFrames(answer.step_id)}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
