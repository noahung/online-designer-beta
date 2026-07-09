import { createPortal } from 'react-dom'
import { X, Layers, AlignLeft } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface FormTypeSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: 'multi_step' | 'single_page') => void
}

export default function FormTypeSelectionModal({
  isOpen,
  onClose,
  onSelect
}: FormTypeSelectionModalProps) {
  const { theme } = useTheme()

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border animate-scale-in ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-[#1a1a2e] border-white/10'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-8 pt-8 pb-4 border-b ${
          theme === 'light' ? 'border-gray-100' : 'border-white/10'
        }`}>
          <div>
            <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Choose Form Type
            </h2>
            <p className={`mt-1 text-sm ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>
              Select the layout that best suits your use case
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
              theme === 'light'
                ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                : 'text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cards */}
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Multi-Step */}
          <button
            onClick={() => onSelect('multi_step')}
            className={`group relative text-left p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
              theme === 'light'
                ? 'border-gray-200 hover:border-orange-400 bg-white hover:bg-orange-50/50'
                : 'border-white/10 hover:border-orange-400/60 bg-white/5 hover:bg-orange-500/10'
            }`}
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 transition-shadow">
              <Layers className="h-6 w-6 text-white" />
            </div>

            <h3 className={`text-lg font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Multi-Step Form
            </h3>
            <p className={`text-sm leading-relaxed mb-4 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>
              Guide users through one question at a time. Perfect for product configurators,
              online designers, and complex workflows.
            </p>

            {/* Example visual */}
            <div className={`rounded-lg p-3 space-y-1.5 ${
              theme === 'light' ? 'bg-gray-50' : 'bg-white/5'
            }`}>
              {['Step 1: Choose style', 'Step 2: Pick colour', 'Step 3: Measurements'].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0
                      ? 'bg-orange-500 text-white'
                      : theme === 'light' ? 'bg-gray-200 text-gray-400' : 'bg-white/10 text-white/30'
                  }`}>
                    {i + 1}
                  </span>
                  <span className={`text-xs ${
                    i === 0
                      ? theme === 'light' ? 'text-gray-700 font-medium' : 'text-white/80 font-medium'
                      : theme === 'light' ? 'text-gray-400' : 'text-white/30'
                  }`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span className={`text-xs font-medium ${theme === 'light' ? 'text-orange-600' : 'text-orange-400'}`}>
                Current builder
              </span>
            </div>
          </button>

          {/* Single-Page */}
          <button
            onClick={() => onSelect('single_page')}
            className={`group relative text-left p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
              theme === 'light'
                ? 'border-gray-200 hover:border-blue-400 bg-white hover:bg-blue-50/50'
                : 'border-white/10 hover:border-blue-400/60 bg-white/5 hover:bg-blue-500/10'
            }`}
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              <AlignLeft className="h-6 w-6 text-white" />
            </div>

            <h3 className={`text-lg font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Single-Page Form
            </h3>
            <p className={`text-sm leading-relaxed mb-4 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>
              All fields on one scrollable page. Ideal for contact forms,
              questionnaires, and simple data collection.
            </p>

            {/* Example visual */}
            <div className={`rounded-lg p-3 space-y-1.5 ${
              theme === 'light' ? 'bg-gray-50' : 'bg-white/5'
            }`}>
              {[
                { label: 'Full Name', type: 'text' },
                { label: 'Email Address', type: 'email' },
                { label: 'Message', type: 'textarea' },
              ].map((field, i) => (
                <div key={i} className={`rounded p-1.5 ${
                  theme === 'light' ? 'bg-white border border-gray-200' : 'bg-white/10 border border-white/10'
                }`}>
                  <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>
                    {field.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className={`text-xs font-medium ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
                New
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
