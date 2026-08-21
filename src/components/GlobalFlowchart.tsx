import React from 'react'
import { X } from 'lucide-react'
import FormFlowchart from './workflow/FormFlowchart'
import { StepLogic } from '../types/formLogic'

interface Step {
  id?: string
  title: string
  description?: string
  question_type: string
  step_order: number
  options?: Array<{ id?: string; label: string; image_url?: string }>
}

interface GlobalFlowchartProps {
  steps: Step[]
  stepLogicMap: Map<string, StepLogic>
  onClose: () => void
  onEditLogic: (step: Step) => void
  welcomeScreen?: {
    enabled?: boolean
    title?: string
    description?: string
  }
  endingScreen?: {
    title?: string
    description?: string
  }
}

export default function GlobalFlowchart({
  steps,
  stepLogicMap,
  onClose,
  onEditLogic,
  welcomeScreen,
  endingScreen
}: GlobalFlowchartProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Form Logic &amp; Workflow Map
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive visual graph powered by React Flow
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-2xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 w-full h-full relative">
        <FormFlowchart
          steps={steps}
          stepLogicMap={stepLogicMap}
          welcomeScreen={welcomeScreen}
          endingScreen={endingScreen}
          onOpenLogicModal={onEditLogic}
        />
      </div>
    </div>
  )
}
