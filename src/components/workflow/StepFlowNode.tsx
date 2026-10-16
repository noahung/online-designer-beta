import React from 'react'
import { Handle, Position } from '@xyflow/react'
import {
  Image as ImageIcon,
  CheckSquare,
  Type,
  Phone,
  Paperclip,
  Ruler,
  Star,
  Layers,
  GitFork,
  ArrowRight
} from 'lucide-react'

interface OptionPreview {
  id?: string
  label: string
}

interface StepFlowNodeProps {
  id: string
  data: {
    stepId: string
    stepOrder: number
    title: string
    questionType: string
    description?: string
    options?: OptionPreview[]
    hasRules?: boolean
    ruleCount?: number
    ruleLabels?: string[]
    onSelectStep?: (stepId: string) => void
    onOpenLogic?: (stepId: string) => void
  }
  selected?: boolean
}

const getQuestionTheme = (type: string) => {
  switch (type) {
    case 'image_selection':
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300',
        border: 'border-purple-500/20 dark:border-purple-500/30',
        icon: <ImageIcon className="w-4 h-4" />
      }
    case 'multiple_choice':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
        border: 'border-blue-500/20 dark:border-blue-500/30',
        icon: <CheckSquare className="w-4 h-4" />
      }
    case 'text_input':
      return {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300',
        border: 'border-emerald-500/20 dark:border-emerald-500/30',
        icon: <Type className="w-4 h-4" />
      }
    case 'contact_fields':
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300',
        border: 'border-amber-500/20 dark:border-amber-500/30',
        icon: <Phone className="w-4 h-4" />
      }
    case 'file_upload':
      return {
        bg: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300',
        border: 'border-pink-500/20 dark:border-pink-500/30',
        icon: <Paperclip className="w-4 h-4" />
      }
    case 'dimensions':
      return {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300',
        border: 'border-indigo-500/20 dark:border-indigo-500/30',
        icon: <Ruler className="w-4 h-4" />
      }
    case 'opinion_scale':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300',
        border: 'border-yellow-500/20 dark:border-yellow-500/30',
        icon: <Star className="w-4 h-4" />
      }
    default:
      return {
        bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300',
        border: 'border-zinc-300 dark:border-zinc-700',
        icon: <Type className="w-4 h-4" />
      }
  }
}

export default function StepFlowNode({ id, data, selected }: StepFlowNodeProps) {
  const theme = getQuestionTheme(data.questionType)

  return (
    <div
      onClick={() => data.onSelectStep?.(data.stepId)}
      className={`group relative px-4 py-3.5 bg-white dark:bg-[#18181b] border-2 rounded-2xl shadow-sm transition-all min-w-[260px] max-w-[290px] cursor-pointer select-none ${
        selected
          ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-lg'
          : data.hasRules
          ? 'border-amber-500/40 dark:border-amber-500/30 hover:border-amber-500 shadow-sm'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm'
      }`}
    >
      {/* Target Handle on the Left (Horizontal LR layout) */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-3 !h-3 !bg-zinc-400 dark:!bg-zinc-600 !border-2 !border-white dark:!border-[#18181b] transition-transform hover:scale-125"
      />

      {/* Main Node Card Header */}
      <div className="flex items-center justify-between gap-2.5 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Question Type Icon Badge */}
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${theme.bg}`}
          >
            {theme.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                Step {data.stepOrder}
              </span>
              <span className="text-[10px] text-zinc-400">•</span>
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 capitalize truncate">
                {data.questionType.replace('_', ' ')}
              </span>
            </div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-1">
              {data.title || 'Untitled Question'}
            </h4>
          </div>
        </div>

        {data.hasRules && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
            <GitFork className="w-2.5 h-2.5" />
            {data.ruleCount}
          </span>
        )}
      </div>

      {/* Options Chips (if choices present) */}
      {data.options && data.options.length > 0 && (
        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap gap-1">
          {data.options.slice(0, 3).map((opt, idx) => (
            <span
              key={opt.id || idx}
              className="inline-block px-2 py-0.5 rounded-lg bg-zinc-50 dark:bg-[#212121] text-[10px] text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 max-w-[110px] truncate"
            >
              {opt.label}
            </span>
          ))}
          {data.options.length > 3 && (
            <span className="inline-block px-1.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-400 font-medium">
              +{data.options.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Logic Branch List (OpenAI If/Else style breakdown) */}
      {data.hasRules && data.ruleLabels && data.ruleLabels.length > 0 && (
        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
          {data.ruleLabels.slice(0, 3).map((lbl, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-[10px] px-2 py-0.5 rounded bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300"
            >
              <span className="truncate">{lbl}</span>
              <ArrowRight className="w-2.5 h-2.5 flex-shrink-0 text-amber-500" />
            </div>
          ))}
        </div>
      )}

      {/* Logic trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          data.onOpenLogic?.(data.stepId)
        }}
        className="mt-2.5 w-full py-1 px-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-[#212121] dark:hover:bg-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-zinc-200/80 dark:border-zinc-700/60"
      >
        <GitFork className="w-3 h-3 text-amber-500" />
        <span>Configure Logic</span>
      </button>

      {/* Source Handle on the Right (Horizontal LR layout) */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white dark:!border-[#18181b] transition-transform hover:scale-125"
      />
    </div>
  )
}
