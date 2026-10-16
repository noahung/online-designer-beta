import React from 'react'
import {
  GitFork,
  Image,
  CheckSquare,
  Type,
  Phone,
  Paperclip,
  Ruler,
  Star,
  Layers,
  ChevronDown,
  Upload,
  Plus,
  Trash2,
  Info,
  HelpCircle
} from 'lucide-react'

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
  crop_images_to_square?: boolean
  scale_type?: 'number' | 'star'
  scale_min?: number
  scale_max?: number
  dimension_type?: '2d' | '3d'
  dimension_units?: string
  allow_multiple?: boolean
  randomize_options?: boolean
  allow_other_option?: boolean
  allow_none_option?: boolean
  contact_show_phone?: boolean
  contact_show_address?: boolean
  contact_show_project_details?: boolean
}

interface StudioInspectorProps {
  currentStep: Step | null
  onUpdateStep: (updates: Partial<Step>) => void
  onOpenLogicBuilder: () => void
  hasLogicRules?: boolean
  logicRuleCount?: number
}

const QUESTION_TYPES = [
  { value: 'image_selection', label: 'Picture Choice', icon: Image },
  { value: 'multiple_choice', label: 'Multiple Choice', icon: CheckSquare },
  { value: 'text_input', label: 'Short Text', icon: Type },
  { value: 'contact_fields', label: 'Contact Info', icon: Phone },
  { value: 'dimensions', label: 'Dimensions', icon: Ruler },
  { value: 'opinion_scale', label: 'Opinion Scale', icon: Star },
  { value: 'file_upload', label: 'File Upload', icon: Paperclip },
  { value: 'frames_plan', label: 'Frames Plan', icon: Layers },
  { value: 'loop_section', label: 'Loop Section', icon: Layers }
]

export default function StudioInspector({
  currentStep,
  onUpdateStep,
  onOpenLogicBuilder,
  hasLogicRules,
  logicRuleCount = 0
}: StudioInspectorProps) {
  if (!currentStep) {
    return (
      <aside className="w-80 flex-shrink-0 h-full bg-white dark:bg-[#0d0d0d] border-l border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center justify-center text-center font-sans select-none">
        <p className="text-xs text-zinc-400">Select a question to configure settings.</p>
      </aside>
    )
  }

  return (
    <aside className="w-80 flex-shrink-0 h-full bg-white dark:bg-[#0d0d0d] border-l border-zinc-200 dark:border-zinc-800 flex flex-col select-none overflow-y-auto font-sans">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-xs font-semibold text-zinc-900 dark:text-white">
          Question Settings
        </span>
      </div>

      <div className="p-4 space-y-6">
        {/* Answer Type Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Answer Type
          </label>
          <div className="relative">
            <select
              value={currentStep.question_type}
              onChange={(e) => onUpdateStep({ question_type: e.target.value as any })}
              className="w-full pl-3 pr-8 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#18181b] text-xs font-medium text-zinc-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:border-zinc-500"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Grid Layout / Columns (for Picture Choice steps) */}
        {currentStep.question_type === 'image_selection' && (
          <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
              Cards per row (Desktop Grid)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { cols: 1, label: '1 col' },
                { cols: 2, label: '2 cols' },
                { cols: 3, label: '3 cols' },
                { cols: 4, label: '4 cols' },
              ].map((c) => {
                const isSelected = (currentStep.images_per_row || 2) === c.cols
                return (
                  <button
                    key={c.cols}
                    type="button"
                    onClick={() => onUpdateStep({ images_per_row: c.cols })}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#18181b] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-zinc-400">
              {(currentStep.images_per_row || 2) === 2
                ? '4 cards will form a 2x2 grid, 6 cards form 2x3.'
                : (currentStep.images_per_row || 2) === 3
                ? '6 cards will form a 3x2 grid.'
                : (currentStep.images_per_row || 2) === 4
                ? '8 cards will form a 4x2 grid.'
                : 'Cards will stack vertically in a single column.'}
            </p>
          </div>
        )}

        {/* Core Toggles (OpenAI switches) */}
        <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          {/* Required */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Required</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentStep.is_required || false}
                onChange={(e) => onUpdateStep({ is_required: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900 dark:peer-checked:bg-white dark:peer-checked:after:bg-zinc-900"></div>
            </label>
          </div>

          {/* Multiple Selection (for choice steps) */}
          {(currentStep.question_type === 'image_selection' ||
            currentStep.question_type === 'multiple_choice') && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Multiple selection
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentStep.allow_multiple || false}
                  onChange={(e) => onUpdateStep({ allow_multiple: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900 dark:peer-checked:bg-white dark:peer-checked:after:bg-zinc-900"></div>
              </label>
            </div>
          )}

          {/* Randomize Choices */}
          {(currentStep.question_type === 'image_selection' ||
            currentStep.question_type === 'multiple_choice') && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Randomize choices
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentStep.randomize_options || false}
                  onChange={(e) => onUpdateStep({ randomize_options: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900 dark:peer-checked:bg-white dark:peer-checked:after:bg-zinc-900"></div>
              </label>
            </div>
          )}

          {/* "Other" option */}
          {(currentStep.question_type === 'image_selection' ||
            currentStep.question_type === 'multiple_choice') && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                &quot;Other&quot; option
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentStep.allow_other_option || false}
                  onChange={(e) => onUpdateStep({ allow_other_option: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900 dark:peer-checked:bg-white dark:peer-checked:after:bg-zinc-900"></div>
              </label>
            </div>
          )}
        </div>

        {/* Step Logic Trigger */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Logic &amp; Branching
          </label>
          <button
            type="button"
            onClick={onOpenLogicBuilder}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold text-zinc-900 dark:text-white"
          >
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-zinc-500" />
              <span>Configure Logic Rules</span>
            </div>
            {hasLogicRules && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                {logicRuleCount} rules
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
