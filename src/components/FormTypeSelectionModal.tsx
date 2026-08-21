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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border transition-all ${
          theme === 'light'
            ? 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-200/50'
            : 'bg-[#18181b] border-zinc-800 text-zinc-100 shadow-black/70'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4.5 border-b ${
          theme === 'light' ? 'border-zinc-100 bg-white' : 'border-zinc-800/80 bg-[#18181b]'
        }`}>
          <div>
            <h2 className={`text-base font-semibold tracking-tight ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>
              Choose Form Type
            </h2>
            <p className={`mt-0.5 text-xs ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Select the layout format for your new form
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'light'
                ? 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Multi-Step */}
          <button
            onClick={() => onSelect('multi_step')}
            className={`group relative text-left p-5 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
              theme === 'light'
                ? 'border-zinc-200/80 hover:border-zinc-300 bg-white hover:bg-zinc-50/90 shadow-sm'
                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/80'
            }`}
          >
            <div>
              {/* Icon */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3.5 border transition-colors ${
                theme === 'light'
                  ? 'bg-zinc-100 border-zinc-200 text-zinc-700 group-hover:text-zinc-900 group-hover:border-zinc-300'
                  : 'bg-zinc-800 border-zinc-700/60 text-zinc-300 group-hover:text-white group-hover:border-zinc-600'
              }`}>
                <Layers className="h-4 w-4" />
              </div>

              <h3 className={`text-sm font-semibold mb-1 ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>
                Multi-Step Form
              </h3>
              <p className={`text-xs leading-relaxed mb-4 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Guide users through one question at a time. Ideal for product configurators and custom workflows.
              </p>

              {/* Example visual */}
              <div className={`rounded-lg p-2.5 space-y-1.5 border ${
                theme === 'light' ? 'bg-zinc-50 border-zinc-200/60' : 'bg-zinc-950/60 border-zinc-800/80'
              }`}>
                {['Step 1: Choose style', 'Step 2: Pick colour', 'Step 3: Measurements'].map((label, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded text-[10px] font-semibold flex items-center justify-center flex-shrink-0 ${
                      i === 0
                        ? theme === 'light' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'
                        : theme === 'light' ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {i + 1}
                    </span>
                    <span className={`text-[11px] truncate ${
                      i === 0
                        ? theme === 'light' ? 'text-zinc-800 font-medium' : 'text-zinc-200 font-medium'
                        : theme === 'light' ? 'text-zinc-400' : 'text-zinc-500'
                    }`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${theme === 'light' ? 'bg-emerald-500' : 'bg-emerald-400'}`}></span>
              <span className={`text-[11px] font-medium ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Recommended for configurators
              </span>
            </div>
          </button>

          {/* Single-Page */}
          <button
            onClick={() => onSelect('single_page')}
            className={`group relative text-left p-5 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
              theme === 'light'
                ? 'border-zinc-200/80 hover:border-zinc-300 bg-white hover:bg-zinc-50/90 shadow-sm'
                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/80'
            }`}
          >
            <div>
              {/* Icon */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3.5 border transition-colors ${
                theme === 'light'
                  ? 'bg-zinc-100 border-zinc-200 text-zinc-700 group-hover:text-zinc-900 group-hover:border-zinc-300'
                  : 'bg-zinc-800 border-zinc-700/60 text-zinc-300 group-hover:text-white group-hover:border-zinc-600'
              }`}>
                <AlignLeft className="h-4 w-4" />
              </div>

              <h3 className={`text-sm font-semibold mb-1 ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>
                Single-Page Form
              </h3>
              <p className={`text-xs leading-relaxed mb-4 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                All questions on one scrollable page. Ideal for contact forms and quick questionnaires.
              </p>

              {/* Example visual */}
              <div className={`rounded-lg p-2.5 space-y-1.5 border ${
                theme === 'light' ? 'bg-zinc-50 border-zinc-200/60' : 'bg-zinc-950/60 border-zinc-800/80'
              }`}>
                {[
                  { label: 'Full Name' },
                  { label: 'Email Address' },
                  { label: 'Message' },
                ].map((field, i) => (
                  <div key={i} className={`rounded px-2 py-1 border ${
                    theme === 'light' ? 'bg-white border-zinc-200 text-zinc-500' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}>
                    <div className="text-[11px] truncate">
                      {field.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${theme === 'light' ? 'bg-blue-500' : 'bg-blue-400'}`}></span>
              <span className={`text-[11px] font-medium ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Fast single-scroll layout
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
