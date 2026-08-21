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
  X,
  Check
} from 'lucide-react'
import { DeviceView } from './StudioHeader'
import { FormTheme, getThemeConfig, getButtonRadiusValue, getCardRadiusValue } from '../../lib/formThemes'
import { StepperProgress } from '../forms/StepperProgress'

interface Option {
  id?: string
  label: string
  description?: string
  image_url?: string
  imageFile?: File | null
  price?: number
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
  formTheme?: FormTheme | string
  primaryButtonColor?: string
  primaryButtonTextColor?: string
  secondaryButtonColor?: string
  secondaryButtonTextColor?: string
  buttonRadius?: string
  cardRadius?: string
  totalSteps?: number
  currentStepIndex?: number
}

export default function StudioCanvas({
  currentStep,
  deviceView,
  onUpdateStep,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onImageUpload,
  clientLogo,
  formTheme = 'generic',
  primaryButtonColor = '#4F46E5',
  primaryButtonTextColor = '#FFFFFF',
  secondaryButtonColor = '#F1F5F9',
  secondaryButtonTextColor = '#334155',
  buttonRadius = 'xl',
  cardRadius = '2xl',
  totalSteps = 3,
  currentStepIndex = 0
}: StudioCanvasProps) {
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({})
  const themeConfig = getThemeConfig(formTheme)

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
        return 'max-w-3xl'
    }
  }

  const getButtonRadiusClass = () => {
    switch (buttonRadius) {
      case 'none': return '!rounded-none';
      case 'md': return '!rounded-lg';
      case 'full': return '!rounded-full';
      case 'xl':
      default: return '!rounded-xl';
    }
  }

  const getCardRadiusClass = () => {
    switch (cardRadius) {
      case 'none': return '!rounded-none';
      case 'xl': return '!rounded-xl';
      case '3xl': return '!rounded-3xl';
      case '2xl':
      default: return '!rounded-2xl';
    }
  }

  return (
    <main className={`flex-1 h-full overflow-y-auto relative flex flex-col items-center justify-start p-4 md:p-8 select-none transition-colors duration-300 ${
      formTheme === 'midnight-slate'
        ? 'bg-[#0B0F17]'
        : formTheme === 'soft-ui'
        ? 'bg-gradient-to-br from-slate-100 via-blue-50/70 to-indigo-100/80'
        : formTheme === 'warm-editorial'
        ? 'bg-[#FAF7F2]'
        : formTheme === 'vibrant-neo'
        ? 'bg-gradient-to-br from-violet-100/50 via-pink-50 to-amber-50/60'
        : 'bg-slate-100/80 dark:bg-[#0d0d0d]'
    }`}>
      {/* Background decorations for Soft UI */}
      {formTheme === 'soft-ui' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-500/20 rounded-full blur-3xl" />
        </div>
      )}

      {/* Form Container */}
      <div className={`w-full ${getContainerWidth()} transition-all duration-300 mx-auto my-auto py-6 relative z-10`}>
        <div 
          className={`${getCardRadiusClass()} p-6 md:p-10 transition-all duration-300 border ${
            formTheme === 'soft-ui'
              ? 'apple-glass-card bg-white/70 backdrop-blur-2xl border-white/60 shadow-2xl'
              : formTheme === 'midnight-slate'
              ? 'bg-[#121826]/95 border-slate-800 text-white shadow-2xl'
              : formTheme === 'warm-editorial'
              ? 'bg-[#FFFDF9] border-stone-200 text-stone-900 shadow-xl'
              : formTheme === 'vibrant-neo'
              ? 'bg-white border-purple-100 shadow-2xl shadow-purple-500/10 text-slate-900'
              : 'bg-white border-slate-200/90 dark:bg-[#18181b] dark:border-zinc-800 shadow-xl text-slate-900 dark:text-white'
          }`}
          style={{ borderRadius: getCardRadiusValue(cardRadius) }}
        >
          {/* Client Logo Header */}
          {clientLogo && (
            <div className="mb-6 flex justify-center">
              <img src={clientLogo} alt="Logo" className="h-10 object-contain" />
            </div>
          )}

          {/* Stepper Progress Bar at Top */}
          <div className="mb-6">
            <StepperProgress
              currentStepIndex={currentStepIndex}
              totalSteps={totalSteps}
              themeConfig={themeConfig}
              primaryColor={primaryButtonColor}
              variant={totalSteps <= 5 ? 'numbers' : 'bar'}
            />
          </div>

          {/* Question Title Inline Editing */}
          <div className="mb-2 flex items-center">
            <input
              type="text"
              value={currentStep.title || ''}
              onChange={(e) => onUpdateStep({ title: e.target.value })}
              placeholder="Type your question here..."
              className={`w-full text-xl md:text-2xl font-bold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-zinc-700 focus:border-indigo-500 pb-1 focus:outline-none transition-all ${
                formTheme === 'midnight-slate' ? 'text-white' : 'text-slate-900 dark:text-white'
              }`}
            />
            {currentStep.is_required && (
              <span className="text-rose-500 font-bold text-lg ml-1 select-none">*</span>
            )}
          </div>

          {/* Question Description Inline Editing */}
          <div className="mb-8">
            <input
              type="text"
              value={currentStep.description || ''}
              onChange={(e) => onUpdateStep({ description: e.target.value })}
              placeholder="Add description or guidance (optional)"
              className="w-full text-sm text-slate-500 dark:text-zinc-400 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-zinc-700 focus:border-indigo-500 pb-1 focus:outline-none transition-all"
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
                    className={`group relative rounded-2xl border overflow-hidden transition-all flex flex-col p-3 ${
                      formTheme === 'midnight-slate'
                        ? 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/50'
                        : formTheme === 'soft-ui'
                        ? 'bg-white/60 backdrop-blur-md border-white/60 hover:bg-white/80'
                        : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:shadow-md'
                    }`}
                  >
                    {/* Image Preview & Upload Zone */}
                    <div
                      onClick={() => fileInputRefs.current[idx]?.click()}
                      className="relative w-full aspect-square rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center cursor-pointer overflow-hidden mb-2.5"
                    >
                      {option.image_url ? (
                        <img
                          src={option.image_url}
                          alt={option.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400 dark:text-zinc-500 group-hover:text-indigo-600 transition-colors">
                          <ImageIcon className="w-7 h-7 mb-1" />
                          <span className="text-[11px] font-medium">Add Image</span>
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
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => onUpdateOption(idx, { label: e.target.value })}
                        placeholder="Choice title..."
                        className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-zinc-700 focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => onDeleteOption(idx)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 hover:border-indigo-400 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Choice Card</span>
              </button>
            </div>
          )}

          {/* 2. Multiple Choice (List) */}
          {currentStep.question_type === 'multiple_choice' && (
            <div className="space-y-3">
              {currentStep.options?.map((option, idx) => (
                <div
                  key={option.id || idx}
                  className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    formTheme === 'midnight-slate'
                      ? 'bg-slate-900/80 border-slate-800'
                      : formTheme === 'soft-ui'
                      ? 'bg-white/60 border-white/60'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold flex items-center justify-center">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => onUpdateOption(idx, { label: e.target.value })}
                      placeholder="Choice option label..."
                      className="w-full text-sm font-medium text-slate-800 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-zinc-700 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteOption(idx)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove choice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={onAddOption}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 hover:border-indigo-400 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Choice Option</span>
              </button>
            </div>
          )}

          {/* 3. Text Input */}
          {currentStep.question_type === 'text_input' && (
            <div className="space-y-2">
              <input
                type="text"
                disabled
                placeholder="User response will be typed here..."
                className={`w-full px-4 py-3.5 rounded-xl border text-sm cursor-not-allowed ${
                  formTheme === 'midnight-slate'
                    ? 'bg-slate-900 border-slate-700 text-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-400'
                }`}
              />
            </div>
          )}

          {/* 4. Contact Fields */}
          {currentStep.question_type === 'contact_fields' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1 block">First Name *</label>
                  <input
                    type="text"
                    disabled
                    placeholder="Sarah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1 block">Last Name *</label>
                  <input
                    type="text"
                    disabled
                    placeholder="Connor"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1 block">Email Address *</label>
                <input
                  type="email"
                  disabled
                  placeholder="sarah@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1 block">Phone Number *</label>
                <input
                  type="tel"
                  disabled
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* 5. Rating Scale */}
          {currentStep.question_type === 'opinion_scale' && (
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {Array.from({ length: 5 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`w-11 h-11 rounded-xl border font-bold text-sm transition-all flex items-center justify-center ${
                    num === 4
                      ? 'text-white shadow-md'
                      : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200'
                  }`}
                  style={num === 4 ? { backgroundColor: primaryButtonColor, borderColor: primaryButtonColor } : {}}
                >
                  {num}
                </button>
              ))}
            </div>
          )}

          {/* 6. Dimensions */}
          {currentStep.question_type === 'dimensions' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Width (mm)</label>
                <input
                  type="number"
                  disabled
                  placeholder="e.g. 1200"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Height (mm)</label>
                <input
                  type="number"
                  disabled
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* 7. File Upload Preview */}
          {currentStep.question_type === 'file_upload' && (
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 flex flex-col items-center justify-center text-center space-y-2">
              <Paperclip className="w-6 h-6 text-slate-400" />
              <div className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                Drag and drop files here, or <span className="text-indigo-600 underline">browse</span>
              </div>
            </div>
          )}

          {/* Live Action Buttons Footer (Reflecting Button Colors & Radius!) */}
          <div className="mt-10 pt-6 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between gap-4">
            <button
              type="button"
              className={`px-6 py-3 font-semibold text-sm transition-all border ${getButtonRadiusClass()}`}
              style={{
                backgroundColor: secondaryButtonColor,
                color: secondaryButtonTextColor,
                borderColor: secondaryButtonColor === '#F1F5F9' ? '#CBD5E1' : 'transparent',
                borderRadius: getButtonRadiusValue(buttonRadius),
                backgroundImage: 'none',
              }}
            >
              ← Previous
            </button>

            <button
              type="button"
              className={`px-7 py-3 font-semibold text-sm transition-all shadow-md ${getButtonRadiusClass()}`}
              style={{
                backgroundColor: primaryButtonColor,
                color: primaryButtonTextColor,
                borderRadius: getButtonRadiusValue(buttonRadius),
                backgroundImage: 'none',
              }}
            >
              Next Step →
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
