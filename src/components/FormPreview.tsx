import React from 'react'
import { Button } from './ui/button'
import { createPortal } from 'react-dom'

interface FormPreviewProps {
  isOpen: boolean
  onClose: () => void
  formId?: string
  formName: string
}

export default function FormPreview({ 
  isOpen, 
  onClose, 
  formId,
  formName
}: FormPreviewProps) {
  React.useEffect(() => {
    if (isOpen && formId) {
      // Open the embedded form in a new tab
      const previewUrl = `${window.location.origin}/form/${formId}`
      window.open(previewUrl, '_blank', 'width=800,height=900,scrollbars=yes,resizable=yes')
      // Close the modal immediately since we're opening in new tab
      onClose()
    }
  }, [isOpen, formId, onClose])

  if (!isOpen) return null

  // Fallback modal if no formId is provided
  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Preview Form
        </h2>
        
        {!formId ? (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Please save the form first to enable preview.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Opening "{formName}" in a new tab...
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  const previewUrl = `${window.location.origin}/form/${formId}`
                  window.open(previewUrl, '_blank', 'width=800,height=900,scrollbars=yes,resizable=yes')
                }}
              >
                Open Preview
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
