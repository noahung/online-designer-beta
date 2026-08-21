import React, { useRef } from 'react'
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckSquare,
  Type,
  Ruler,
  Star,
  Phone,
  Paperclip,
  Layers,
  X
} from 'lucide-react'
import { DeviceView } from './StudioHeader'

interface Option {
  id?: string
  label: string
  description?: string
  image_url?: string
  imageFile?: File | null
}

interface Step {
  id?: string
  title: string
  description?: string
  question_type: string
  is_required?: boolean
  step_order: number
  options?: Option[]
  images_per_row?: number
  mobile_images_per_row?: number
  scale_type?: 'number' | 'star'
  scale_min?: number
  scale_max?: number
  dimension_type?: '2d' | '3d'
  dimension_units?: string
}

interface StudioCanvasProps {
  currentStep: Step | null
  deviceView: DeviceView
  onUpdateStep: (updates: Partial<Step>) => void
  onAddOption: () => void
  onUpdateOption: (index: number, updates: Partial<Option>) => void
  onDeleteOption: (index: number) => void
  onImageUpload: (index: number, file: File) => void
  clientLogo?: string
}

export default function StudioCanvas({
  currentStep,
  deviceView,
  onUpdateStep,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onImageUpload,
  clientLogo
}: StudioCanvasProps) {
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})

  if (!currentStep) {
    return (
      <main className="flex-1 h-full bg-[#fcfcfc] dark:bg-[#0d0d0d] flex flex-col items-center justify-center p-8 font-sans select-none">
        <p className="text-sm text-zinc-400">No question selected. Add a step or pick one from the left sidebar.</p>
      </main>
    )
  }

  // Device view width container
  const getContainerWidth = () => {
    switch (deviceView) {
      case 'mobile':
        return 'max-w-sm'
      case 'tablet':
        return 'max-w-xl'
      case 'desktop':
      default:
        return 'max-w-4xl'
    }
  }

  return (
    <main className="flex-1 h-full bg-[#fcfcfc] dark:bg-[#0d0d0d] overflow-y-auto relative flex flex-col items-center justify-center p-4 md:p-8 font-sans select-none">
      {/* Centered Form Container (#212121 in dark mode, pure white in light mode) */}
      <div className={`w-full ${getContainerWidth()} transition-all duration-300 mx-auto my-auto py-6`}>
        <div className="bg-white dark:bg-[#212121] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 md:p-10 transition-all">
          {/* Client Logo Header */}
          {clientLogo && (
            <div className="mb-6">
              <img src={clientLogo} alt="Logo" className="h-10 object-contain" />
            </div>
          )}

          {/* Question Title Inline Editing */}
          <div className="mb-2 flex items-center">
            <input
              type="text"
              value={currentStep.title || ''}
              onChange={(e) => onUpdateStep({ title: e.target.value })}
              placeholder="Type your question here..."
              className="w-full text-xl md:text-2xl font-bold text-zinc-900 dark:text-white bg-transparent border-b border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus:border-zinc-500 pb-1 focus:outline-none transition-all"
            />
            {currentStep.is_required && (
              <span className="text-red-500 font-bold text-lg ml-1 select-none">*</span>
            )}
          </div>

          {/* Question Description Inline Editing */}
          <div className="mb-8">
            <input
              type="text"
              value={currentStep.description || ''}
              onChange={(e) => onUpdateStep({ description: e.target.value })}
              placeholder="Description (optional)"
              className="w-full text-sm text-zinc-500 dark:text-zinc-400 bg-transparent border-b border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus:border-zinc-500 pb-1 focus:outline-none transition-all italic"
            />
          </div>

          {/* Question Type Interactive Canvas */}

          {/* 1. Picture Choice Grid */}
          {currentStep.question_type === 'image_selection' && (
            <div className="space-y-4">
              <div
                className={`grid gap-4 ${
                  (currentStep.images_per_row || 2) === 1
                    ? 'grid-cols-1'
                    : (currentStep.images_per_row || 2) === 3
                    ? 'grid-cols-1 sm:grid-cols-3'
                    : (currentStep.images_per_row || 2) === 4
                    ? 'grid-cols-2 sm:grid-cols-4'
                    : 'grid-cols-1 sm:grid-cols-2'
                }`}
              >
                {currentStep.options?.map((option, idx) => (
                  <div
                    key={option.id || idx}
                    className="group relative bg-zinc-50 dark:bg-[#2a2a2a] rounded-2xl border border-zinc-200 dark:border-zinc-700/80 overflow-hidden hover:border-zinc-400 dark:hover:border-zinc-500 transition-all flex flex-col"
                  >
                    {/* Image Preview & Upload Zone */}
                    <div
                      onClick={() => fileInputRefs.current[idx]?.click()}
                      className="relative w-full aspect-video bg-zinc-100 dark:bg-[#1f1f1f] flex items-center justify-center cursor-pointer overflow-hidden"
                    >
                      {option.image_url ? (
                        <img
                          src={option.image_url}
                          alt={option.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                          <ImageIcon className="w-8 h-8 mb-1" />
                          <span className="text-[11px] font-medium">Click to upload image</span>
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => (fileInputRefs.current[idx] = el)}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) onImageUpload(idx, file)
                        }}
                      />
                    </div>

                    {/* Option Label & Delete */}
                    <div className="p-3 flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => onUpdateOption(idx, { label: e.target.value })}
                        placeholder="Choice title..."
                        className="w-full text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-zinc-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => onDeleteOption(idx)}
                        className="p-1 rounded-md text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove choice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={onAddOption}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add choice</span>
              </button>
            </div>
          )}

          {/* 2. Multiple Choice Pills */}
          {currentStep.question_type === 'multiple_choice' && (
            <div className="space-y-2.5 max-w-lg">
              {currentStep.options?.map((option, idx) => (
                <div
                  key={option.id || idx}
                  className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-[#2a2a2a] border border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-500 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-5 h-5 rounded-md border border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-xs font-bold text-zinc-500 dark:text-zinc-400">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => onUpdateOption(idx, { label: e.target.value })}
                      placeholder="Choice text..."
                      className="w-full text-sm font-medium text-zinc-800 dark:text-zinc-200 bg-transparent border-none focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteOption(idx)}
                    className="p-1 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={onAddOption}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add choice</span>
              </button>
            </div>
          )}

          {/* 3. Text Input Preview */}
          {currentStep.question_type === 'text_input' && (
            <div className="max-w-lg">
              <input
                type="text"
                disabled
                placeholder="User type response here..."
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2a] text-sm text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
              />
            </div>
          )}

          {/* 4. Contact Fields Preview */}
          {currentStep.question_type === 'contact_fields' && (
            <div className="space-y-3 max-w-lg">
              <input
                type="text"
                disabled
                placeholder="Full Name"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2a] text-xs text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
              />
              <input
                type="email"
                disabled
                placeholder="Email Address"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2a] text-xs text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
              />
              <input
                type="tel"
                disabled
                placeholder="Phone Number"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2a] text-xs text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
              />
            </div>
          )}

          {/* 5. Opinion Scale Preview */}
          {currentStep.question_type === 'opinion_scale' && (
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <div
                  key={num}
                  className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2a] text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-center flex-shrink-0"
                >
                  {num}
                </div>
              ))}
            </div>
          )}

          {/* 6. Dimensions Preview */}
          {currentStep.question_type === 'dimensions' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg">
              <div>
                <label className="text-[10px] font-semibold text-zinc-400 uppercase">Width (mm)</label>
                <input
                  type="number"
                  disabled
                  placeholder="e.g. 1200"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2a] text-xs text-zinc-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-zinc-400 uppercase">Height (mm)</label>
                <input
                  type="number"
                  disabled
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2a] text-xs text-zinc-400 cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* 7. File Upload Preview */}
          {currentStep.question_type === 'file_upload' && (
            <div className="max-w-lg p-6 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#2a2a2a] flex flex-col items-center justify-center text-center space-y-2">
              <Paperclip className="w-6 h-6 text-zinc-400" />
              <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Drag and drop files here, or <span className="underline">browse</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
