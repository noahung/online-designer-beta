import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Play } from 'lucide-react'

interface StartFlowNodeProps {
  data: {
    title?: string
    description?: string
  }
  selected?: boolean
}

export default function StartFlowNode({ data, selected }: StartFlowNodeProps) {
  return (
    <div
      className={`relative flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#18181b] border-2 rounded-2xl shadow-sm transition-all min-w-[200px] select-none ${
        selected
          ? 'border-emerald-500 ring-4 ring-emerald-500/10 shadow-md'
          : 'border-emerald-500/30 dark:border-emerald-500/20 hover:border-emerald-500/80 shadow-sm'
      }`}
    >
      {/* Icon Badge */}
      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 font-bold shadow-inner">
        <Play className="w-4 h-4 fill-current ml-0.5" />
      </div>

      {/* Label */}
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Entrypoint
        </div>
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
          {data.title || 'Start'}
        </h4>
      </div>

      {/* Output handle on the Right (Horizontal LR flow) */}
      <Handle
        type="source"
        position={Position.Right}
        id="start-out"
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white dark:!border-[#18181b] transition-transform hover:scale-125"
      />
    </div>
  )
}
