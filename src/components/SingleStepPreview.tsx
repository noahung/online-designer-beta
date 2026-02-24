import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Upload } from 'lucide-react'

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
  max_file_size?: number
  allowed_file_types?: string[]
  dimension_type?: '2d' | '3d'
  dimension_units?: string
  scale_type?: 'number' | 'star'
  scale_min?: number
  scale_max?: number
  images_per_row?: number
  crop_images_to_square?: boolean
  frames_max_count?: number
  frames_require_image?: boolean
  frames_require_location?: boolean  
  frames_require_measurements?: boolean
  loop_start_step_id?: string
  loop_end_step_id?: string
  loop_label?: string
  loop_max_iterations?: number
  loop_button_text?: string
}

interface SingleStepPreviewProps {
  isOpen: boolean
  onClose: () => void
  step: Step
  stepNumber: number
  primaryColor?: string
  secondaryColor?: string
}

export default function SingleStepPreview({ 
  isOpen, 
  onClose, 
  step,
  stepNumber,
  primaryColor = '#3B82F6',
  secondaryColor = '#8B5CF6'
}: SingleStepPreviewProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set())
  const [textInput, setTextInput] = useState('')

  if (!isOpen) return null

  const handleOptionClick = (optionId: string) => {
    const newSelected = new Set(selectedOptions)
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId)
    } else {
      newSelected.add(optionId)
    }
    setSelectedOptions(newSelected)
  }

  const renderStepContent = () => {
    switch (step.question_type) {
      case 'image_selection':
        const imagesPerRow = step.images_per_row || 2
        const cropToSquare = step.crop_images_to_square !== false
        return (
          <div className={`grid gap-4 ${
            imagesPerRow === 1 ? 'grid-cols-1' :
            imagesPerRow === 3 ? 'grid-cols-1 md:grid-cols-3' :
            'grid-cols-1 md:grid-cols-2'
          }`}>
            {step.options.map((option, index) => (
              <button
                key={option.id || index}
                onClick={() => handleOptionClick(option.id || `option-${index}`)}
                className={`border rounded-xl p-4 text-left hover:shadow-lg transition-all duration-200 flex flex-col h-full ${
                  selectedOptions.has(option.id || `option-${index}`)
                    ? 'ring-2 border-blue-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={
                  selectedOptions.has(option.id || `option-${index}`)
                    ? { 
                        borderColor: primaryColor,
                        boxShadow: `0 0 0 2px ${primaryColor}40`
                      }
                    : {}
                }
              >
                {option.image_url && (
                  <div className={`${
                    cropToSquare ? 'aspect-square' : 'flex-grow flex items-start'
                  } w-full mb-3 rounded-lg overflow-hidden`}>
                    <img
                      src={option.image_url}
                      alt={option.label}
                      className={`w-full ${
                        cropToSquare ? 'h-full object-cover' : 'object-contain'
                      } transition-transform duration-200 hover:scale-105`}
                    />
                  </div>
                )}
                <div className="flex-shrink-0">
                  <div className="font-medium text-gray-900">{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {step.options.map((option, index) => (
              <button
                key={option.id || index}
                onClick={() => handleOptionClick(option.id || `option-${index}`)}
                className={`w-full border rounded-xl p-4 text-left hover:shadow-md transition-all duration-200 ${
                  selectedOptions.has(option.id || `option-${index}`)
                    ? 'ring-2 border-blue-500 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={
                  selectedOptions.has(option.id || `option-${index}`)
                    ? { 
                        borderColor: primaryColor,
                        boxShadow: `0 0 0 2px ${primaryColor}40`
                      }
                    : {}
                }
              >
                <div className="font-medium text-gray-900">{option.label}</div>
                {option.description && (
                  <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                )}
              </button>
            ))}
          </div>
        )

      case 'text_input':
        return (
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            placeholder="Enter your answer here..."
          />
        )

      case 'contact_fields':
        return (
          <div className="space-y-4">
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Name"
            />
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email"
            />
            <input
              type="tel"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Phone"
            />
          </div>
        )

      case 'file_upload':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
            <p className="text-sm text-gray-500">
              {step.max_file_size ? `Max file size: ${step.max_file_size}MB` : 'No size limit'}
            </p>
          </div>
        )

      case 'dimensions':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Width (${step.dimension_units || 'mm'})`}
              />
              <input
                type="number"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Height (${step.dimension_units || 'mm'})`}
              />
            </div>
            {step.dimension_type === '3d' && (
              <input
                type="number"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Depth (${step.dimension_units || 'mm'})`}
              />
            )}
          </div>
        )

      case 'opinion_scale':
        const scaleMin = step.scale_min || 1
        const scaleMax = step.scale_max || (step.scale_type === 'star' ? 5 : 10)
        const scaleItems = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i)
        
        return (
          <div className="flex justify-center items-center space-x-2">
            {scaleItems.map((value) => (
              <button
                key={value}
                onClick={() => handleOptionClick(`scale-${value}`)}
                className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 font-semibold ${
                  selectedOptions.has(`scale-${value}`)
                    ? 'border-blue-500 bg-blue-500 text-white shadow-lg scale-110'
                    : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                }`}
                style={
                  selectedOptions.has(`scale-${value}`)
                    ? { 
                        borderColor: primaryColor,
                        backgroundColor: primaryColor
                      }
                    : undefined
                }
              >
                {step.scale_type === 'star' ? '★' : value}
              </button>
            ))}
          </div>
        )

      case 'frames_plan':
        return (
          <div className="space-y-4">
            <div className="text-center text-gray-600 mb-4">
              <p>Frame upload interface with location and measurements</p>
              <p className="text-sm mt-2">Max frames: {step.frames_max_count || 10}</p>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Upload frame images</p>
            </div>
          </div>
        )

      case 'loop_section':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {step.loop_label ? `Add Another ${step.loop_label}?` : 'Add Another Entry?'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Users can repeat this section multiple times
                {step.loop_max_iterations && ` (max ${step.loop_max_iterations})`}
              </p>
              <div className="flex gap-2 justify-center">
                <button 
                  type="button"
                  className="px-6 py-2 rounded-lg font-medium text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {step.loop_button_text || `Add Another ${step.loop_label || 'Entry'}`}
                </button>
                <button 
                  type="button"
                  className="px-6 py-2 rounded-lg font-medium border-2 border-gray-300 text-gray-700"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return <div className="text-gray-500">Unsupported question type</div>
    }
  }

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Preview Step</h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {stepNumber} • {step.question_type.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/50 transition-colors text-gray-600 hover:text-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Step Title and Description */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {step.title || `Question ${stepNumber}`}
              {step.is_required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {step.description && (
              <p className="text-gray-600">{step.description}</p>
            )}
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Info Banner */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800">
              <strong>Preview Mode:</strong> This is how this question will appear to users. 
              The actual form will include navigation buttons and progress indicators.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
