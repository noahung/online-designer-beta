import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { CheckCircle2 } from 'lucide-react'

interface EndFlowNodeProps {
  data: {
    title?: string
    description?: string
  }
  selected?: boolean
}

export default function EndFlowNode({ data, selected }: EndFlowNodeProps) {
  return (
    <div
      className={`relative flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#18181b] border-2 rounded-2xl shadow-sm transition-all min-w-[200px] select-none ${
        selected
          ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-md'
          : 'border-indigo-500/30 dark:border-indigo-500/20 hover:border-indigo-500/80 shadow-sm'
      }`}
    >
      {/* Target Handle on the Left (Horizontal LR flow) */}
      <Handle
        type="target"
        position={Position.Left}
        id="end-in"
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white dark:!border-[#18181b] transition-transform hover:scale-125"
      />

      {/* Icon Badge */}
      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 font-bold shadow-inner">
        <CheckCircle2 className="w-4 h-4" />
      </div>

      {/* Label */}
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Terminal
        </div>
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
          {data.title || 'Thank You'}
        </h4>
      </div>
    </div>
  )
}
