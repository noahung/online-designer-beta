import React from 'react'
import { ArrowDown, Check, Zap, AlertCircle, ArrowRight } from 'lucide-react'
import { StepLogic, LogicRule } from '../types/formLogic'
import { useTheme } from '../contexts/ThemeContext'

interface Step {
  id?: string
  title: string
  question_type: string
  step_order: number
}

interface LogicVisualizationProps {
  currentStep: Step
  allSteps: Step[]
  stepLogic: StepLogic | null
}

export default function LogicVisualization({ currentStep, allSteps, stepLogic }: LogicVisualizationProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const getStepName = (stepId?: string) => {
    if (!stepId) return 'End of Form'
    const step = allSteps.find(s => s.id === stepId)
    // If we can't find the step, it might be due to a broken link or unsaved changes.
    // Try to find by order if possible? No, too risky.
    if (!step) return `Target Step Missing`
    return `${step.step_order}. ${step.title}`
  }

  const StartNode = () => (
    <div className={`p-4 rounded-xl border-2 mb-8 relative max-w-sm mx-auto text-center ${
      isDark ? 'bg-blue-500/20 border-blue-500/50 text-white' : 'bg-blue-50 border-blue-200 text-gray-900'
    }`}>
      <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Current Step</div>
      <div className="font-semibold">{currentStep.step_order}. {currentStep.title}</div>
      <div className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 ${
        isDark ? 'text-white/30' : 'text-gray-300'
      }`}>
        <ArrowDown className="w-6 h-6" />
      </div>
    </div>
  )

  const RuleNode = ({ rule, index }: { rule: LogicRule, index: number }) => {
    return (
      <div className="relative flex flex-col items-center">
        {/* Connection Line */}
        <div className={`absolute -top-8 h-8 w-0.5 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
        
        {/* Condition Box */}
        <div className={`p-4 rounded-xl border-2 mb-8 relative w-64 ${
          isDark 
            ? 'bg-gray-800 border-gray-700 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              index === 0
                ? 'bg-blue-500 text-white'
                : 'bg-purple-500 text-white'
            }`}>
              {index === 0 ? 'IF' : 'ELSE IF'}
            </span>
          </div>
          
          <div className="text-sm">
            {rule.conditions.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 mb-1 last:mb-0">
                <Check className="w-3 h-3 text-green-500" />
                <span>
                  Option is <strong>"{currentStep.options?.find((o: any) => o.id === c.option_id)?.label || '...'}"</strong>
                </span>
              </div>
            ))}
          </div>

          <div className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 ${
            isDark ? 'text-white/30' : 'text-gray-300'
          }`}>
            <ArrowDown className="w-6 h-6" />
          </div>
        </div>

        {/* Action / Target */}
        <div className={`p-3 rounded-lg border flex items-center gap-2 text-sm ${
          isDark 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <ArrowRight className="w-4 h-4" />
          <span className="font-medium">Go to {getStepName(rule.action.target_step_id)}</span>
        </div>
      </div>
    )
  }

  const DefaultNode = () => {
    if (!stepLogic?.default_action) return null
    return (
      <div className="relative flex flex-col items-center">
        {/* Connection Line */}
        <div className={`absolute -top-8 h-8 w-0.5 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
        
        {/* Condition Box */}
        <div className={`p-4 rounded-xl border-2 mb-8 relative w-64 ${
          isDark 
            ? 'bg-gray-800 border-gray-700 text-white' 
            : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-500 text-white">
              ELSE
            </span>
          </div>
          
          <div className="text-sm text-center italic opacity-70">
            All other cases
          </div>

          <div className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 ${
            isDark ? 'text-white/30' : 'text-gray-300'
          }`}>
            <ArrowDown className="w-6 h-6" />
          </div>
        </div>

        {/* Action / Target */}
        <div className={`p-3 rounded-lg border flex items-center gap-2 text-sm ${
          isDark 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <ArrowRight className="w-4 h-4" />
          <span className="font-medium">Go to {getStepName(stepLogic.default_action?.action.target_step_id)}</span>
        </div>
      </div>
    )
  }

  if (!stepLogic || (!stepLogic.rules.length && !stepLogic.default_action)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center opacity-60">
        <Zap className="w-12 h-12 mb-4 text-gray-400" />
        <p>No logic configured for this step.</p>
        <p className="text-sm">The form will simply proceed to the next step.</p>
      </div>
    )
  }

  return (
    <div className="p-8 overflow-x-auto">
      <StartNode />
      
      <div className="flex justify-center gap-8 min-w-max pt-8 border-t-2 border-dashed border-gray-200 dark:border-gray-800 relative">
        {/* Vertical connector from start to horizontal bar */}
        <div className={`absolute top-0 left-1/2 h-8 w-0.5 -translate-y-8 bg-dashed ${
          isDark ? 'bg-white/10' : 'bg-gray-200'
        }`}></div>

        {stepLogic.rules.map((rule, idx) => (
          <RuleNode key={rule.id} rule={rule} index={idx} />
        ))}
        <DefaultNode />
      </div>
    </div>
  )
}
