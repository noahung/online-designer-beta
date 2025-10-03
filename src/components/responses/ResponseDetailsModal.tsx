import { X, Calendar, User, Mail, Trash2, Phone, MapPin, FileText } from 'lucide-react'
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

  const renderAnswerValue = (answer: any): JSX.Element => {
    // Handle different answer types
    if (answer.answer_text) {
      return <span>{answer.answer_text}</span>
    }
    if (answer.file_url) {
      return (
        <div className="space-y-2">
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
          {answer.file_size && (
            <span className={`text-sm ml-2 ${
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
      return <span>Frames: {answer.frames_count}</span>
    }
    return <span className={theme === 'light' ? 'text-gray-400' : 'text-white/40'}>-</span>
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
