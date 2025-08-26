import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { X, Upload } from 'lucide-react'

interface FormPreviewProps {
  isOpen: boolean
  onClose: () => void
  formName: string
  steps: Array<{
    title: string
    question_type: string
    options: Array<{
      label: string
      description?: string
      image_url?: string
    }>
    max_file_size?: number
    allowed_file_types?: string[]
  }>
}

export default function FormPreview({ isOpen, onClose, formName, steps }: FormPreviewProps) {
  const [currentStep, setCurrentStep] = React.useState(0)

  if (!isOpen) return null

  const step = steps[currentStep]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Form Preview</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-2">{formName}</h1>
                
                {step && (
                  <>
                    <p className="text-slate-600 mb-4">{step.title}</p>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-6">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all" 
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} 
                      />
                    </div>

                    {/* Options or File Upload or Contact Fields */}
                    {step.question_type === 'contact_fields' ? (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Your Free Quote</h3>
                          <p className="text-gray-600">Tell us about your project and we'll provide a personalised quote</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Enter your first name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                disabled
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Enter your last name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                disabled
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              placeholder="Enter your email address"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              disabled
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              placeholder="Enter your phone number"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              disabled
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Property Address <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              placeholder="Enter your full address"
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                              disabled
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Project Details
                            </label>
                            <textarea
                              placeholder="Tell us more about your project, preferred timeline, budget range, etc."
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                              disabled
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Contact Method</label>
                            <div className="flex space-x-4">
                              {['Phone Call', 'Email', 'Both'].map((method) => (
                                <label key={method} className="flex items-center">
                                  <input
                                    type="radio"
                                    name="contactMethod"
                                    value={method}
                                    className="mr-2 text-blue-600"
                                    disabled
                                  />
                                  <span className="text-sm text-gray-700">{method}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <div className="flex flex-col items-center">
                              <Upload className="w-12 h-12 text-gray-400 mb-2" />
                              <p className="text-lg font-medium text-gray-600 mb-1">
                                Upload Plans or Reference Images (Optional)
                              </p>
                              <p className="text-sm text-gray-500">
                                Click to upload or drag and drop<br/>
                                PNG, JPG, PDF up to 10MB each
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : step.question_type === 'file_upload' ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Upload className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to browse</p>
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
                                  return type
                                }).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {step.options.map((option, index) => (
                          <div 
                            key={index} 
                            className="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            {option.image_url && (
                              <img 
                                src={option.image_url} 
                                alt={option.label} 
                                className="h-28 w-full object-cover mb-2 rounded" 
                              />
                            )}
                            <div className="font-medium">{option.label}</div>
                            {option.description && (
                              <div className="text-sm text-slate-500 mt-1">{option.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-6">
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-slate-500">
                        Step {currentStep + 1} of {steps.length}
                      </span>
                      <Button 
                        onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                        disabled={currentStep === steps.length - 1}
                      >
                        {currentStep === steps.length - 1 ? 'Submit' : 'Next'}
                      </Button>
                    </div>
                  </>
                )}

                {steps.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-500">No steps to preview yet. Add some steps to see your form.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
