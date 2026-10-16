import { X, Calendar, User, Mail, Trash2, Phone, MapPin, FileText, Download } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { FormResponse } from '../../api/responses'
import { createPortal } from 'react-dom'

interface ResponseDetailsModalProps {
  isOpen: boolean
  response: FormResponse | null
  onClose: () => void
  onDelete?: (responseId: string) => void
}

export default function ResponseDetailsModal({
  isOpen,
  response,
  onClose,
  onDelete
}: ResponseDetailsModalProps) {
  const { theme } = useTheme()

  if (!isOpen || !response) return null

  console.log('ResponseDetailsModal - response data:', {
    response,
    hasContactInfo: !!(response.contact_name || response.contact_email),
    hasAnswers: response.response_answers?.length || 0
  })

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this response? This action cannot be undone.')) {
      onDelete?.(response.id)
      onClose()
    }
  }

  const downloadImage = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  const renderAnswerValue = (answer: any): JSX.Element => {
    // Handle different answer types
    if (answer.answer_text) {
      return <span>{answer.answer_text}</span>
    }
    if (answer.file_url) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <a
              href={answer.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`hover:underline ${
                theme === 'light' ? 'text-blue-600' : 'text-blue-400'
              }`}
            >
              {answer.file_name || 'Download File'} →
            </a>
            <button
              onClick={() => downloadImage(answer.file_url, answer.file_name || 'attachment')}
              className={`p-1.5 rounded-lg transition-colors ${
                theme === 'light'
                  ? 'hover:bg-blue-100 text-blue-600'
                  : 'hover:bg-blue-500/20 text-blue-400'
              }`}
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
          {answer.file_size && (
            <span className={`text-sm ${
              theme === 'light' ? 'text-gray-500' : 'text-white/60'
            }`}>
              ({(answer.file_size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>
      )
    }
    if (answer.width || answer.height || answer.depth) {
      return (
        <span>
          {answer.width || ''} × {answer.height || ''} × {answer.depth || ''} {answer.units || ''}
        </span>
      )
    }
    if (answer.scale_rating !== null) {
      return <span>Rating: {answer.scale_rating}</span>
    }
    if (answer.frames_count !== null) {
      return <span>Requested: {answer.frames_count} frame{answer.frames_count > 1 ? 's' : ''}</span>
    }
    return <span className={theme === 'light' ? 'text-gray-400' : 'text-white/40'}>-</span>
  }

  const renderFramesForAnswer = (answer: any) => {
    const frames = (response.response_frames || []).filter((f: any) => f.step_id === answer.step_id)
    if (frames.length === 0) return null

    return (
      <div className="mt-3 space-y-2">
        <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>
          {frames.length} frame{frames.length > 1 ? 's' : ''} captured
        </p>
        <div className="grid grid-cols-2 gap-3">
          {frames.map((frame: any) => (
            <div key={frame.id} className={`rounded-lg p-2 border ${
              theme === 'light' ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'
            }`}>
              {frame.image_url ? (
                <div className="relative group">
                  <img 
                    src={frame.image_url} 
                    alt={`Frame ${frame.frame_number}`}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                  <button
                    onClick={() => downloadImage(frame.image_url, `frame-${frame.frame_number}.jpg`)}
                    className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                      theme === 'light' 
                        ? 'bg-white/90 hover:bg-white text-gray-700'
                        : 'bg-black/60 hover:bg-black/80 text-white'
                    }`}
                    title="Download image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className={`w-full h-32 flex items-center justify-center rounded mb-2 ${
                  theme === 'light' ? 'bg-gray-100' : 'bg-white/5'
                }`}>
                  <span className={`text-xs ${
                    theme === 'light' ? 'text-gray-400' : 'text-white/40'
                  }`}>No image</span>
                </div>
              )}
              <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>
                <p className="font-medium">Frame {frame.frame_number}</p>
                {frame.location_text && <p className={theme === 'light' ? 'text-gray-500' : 'text-white/50'}>{frame.location_text}</p>}
                {frame.measurements_text && <p className={theme === 'light' ? 'text-gray-500' : 'text-white/50'}>{frame.measurements_text}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl my-8 animate-scale-in ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-gray-900 border-white/20'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'light' ? 'border-gray-200' : 'border-white/10'
        }`}>
          <h2 className={`text-2xl font-bold ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Response Details
          </h2>
          <div className="flex items-center space-x-2">
            {onDelete && (
              <button
                onClick={handleDelete}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'light'
                    ? 'hover:bg-red-100 text-red-600'
                    : 'hover:bg-red-500/20 text-red-400'
                }`}
                title="Delete response"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'light'
                  ? 'hover:bg-gray-100 text-gray-500'
                  : 'hover:bg-white/10 text-white/60'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {/* Contact Info */}
          <div className={`rounded-xl border p-4 ${
            theme === 'light'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-blue-500/10 border-blue-400/30'
          }`}>
            <h4 className={`text-sm font-semibold mb-3 ${
              theme === 'light' ? 'text-blue-900' : 'text-blue-200'
            }`}>
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start space-x-3">
                <Calendar className={`w-5 h-5 mt-0.5 ${
                  theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                }`} />
                <div>
                  <p className={`text-xs ${
                    theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                  }`}>
                    Submitted
                  </p>
                  <p className={`text-sm font-medium ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    {new Date(response.submitted_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {response.contact_name && (
                <div className="flex items-start space-x-3">
                  <User className={`w-5 h-5 mt-0.5 ${
                    theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                  }`} />
                  <div>
                    <p className={`text-xs ${
                      theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                    }`}>
                      Name
                    </p>
                    <p className={`text-sm font-medium ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {response.contact_name}
                    </p>
                  </div>
                </div>
              )}

              {response.contact_email && (
                <div className="flex items-start space-x-3">
                  <Mail className={`w-5 h-5 mt-0.5 ${
                    theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                  }`} />
                  <div>
                    <p className={`text-xs ${
                      theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                    }`}>
                      Email
                    </p>
                    <p className={`text-sm font-medium ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {response.contact_email}
                    </p>
                  </div>
                </div>
              )}

              {response.contact_phone && (
                <div className="flex items-start space-x-3">
                  <Phone className={`w-5 h-5 mt-0.5 ${
                    theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                  }`} />
                  <div>
                    <p className={`text-xs ${
                      theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                    }`}>
                      Phone
                    </p>
                    <p className={`text-sm font-medium ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {response.contact_phone}
                    </p>
                  </div>
                </div>
              )}

              {response.contact_postcode && (
                <div className="flex items-start space-x-3">
                  <MapPin className={`w-5 h-5 mt-0.5 ${
                    theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                  }`} />
                  <div>
                    <p className={`text-xs ${
                      theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                    }`}>
                      Postcode
                    </p>
                    <p className={`text-sm font-medium ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {response.contact_postcode}
                    </p>
                  </div>
                </div>
              )}

              {response.preferred_contact && (
                <div className="flex items-start space-x-3">
                  <Mail className={`w-5 h-5 mt-0.5 ${
                    theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                  }`} />
                  <div>
                    <p className={`text-xs ${
                      theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                    }`}>
                      Preferred Contact
                    </p>
                    <p className={`text-sm font-medium ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {response.preferred_contact}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {response.project_details && (
              <div className="mt-4 pt-4 border-t border-blue-200/30">
                <div className="flex items-start space-x-3">
                  <FileText className={`w-5 h-5 mt-0.5 ${
                    theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-xs mb-1 ${
                      theme === 'light' ? 'text-blue-600' : 'text-blue-300'
                    }`}>
                      Project Details
                    </p>
                    <p className={`text-sm ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {response.project_details}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Answers */}
          {response.response_answers && response.response_answers.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Form Answers
              </h3>
              <div className="space-y-4">
                {response.response_answers
                  .sort((a, b) => (a.form_steps?.[0]?.step_order || 0) - (b.form_steps?.[0]?.step_order || 0))
                  .map((answer) => (
                    <div
                      key={answer.id}
                      className={`rounded-xl border p-4 ${
                        theme === 'light'
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <p className={`text-sm font-medium mb-2 ${
                        theme === 'light' ? 'text-gray-700' : 'text-white/80'
                      }`}>
                        {answer.form_steps?.[0]?.title || 'Question'}
                      </p>
                      <div className={`text-base ${
                        theme === 'light' ? 'text-gray-900' : 'text-white'
                      }`}>
                        {renderAnswerValue(answer)}
                      </div>
                      {answer.form_steps?.[0]?.question_type === 'frames_plan' && renderFramesForAnswer(answer)}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {(!response.response_answers || response.response_answers.length === 0) && (
            <div className={`text-center py-8 ${
              theme === 'light' ? 'text-gray-500' : 'text-white/60'
            }`}>
              No form answers available
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
