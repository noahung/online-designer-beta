import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { X } from 'lucide-react'

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

                    {/* Options */}
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
