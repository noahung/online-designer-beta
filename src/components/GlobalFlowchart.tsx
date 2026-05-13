import React, { useMemo } from 'react'
import { X, ArrowDown, Zap, GitBranch, ArrowRight, Settings } from 'lucide-react'
import { StepLogic } from '../types/formLogic'
import { useTheme } from '../contexts/ThemeContext'

interface Step {
  id?: string
  title: string
  question_type: string
  step_order: number
}

interface GlobalFlowchartProps {
  steps: Step[]
  stepLogicMap: Map<string, StepLogic>
  onClose: () => void
  onEditLogic: (step: Step) => void
}

export default function GlobalFlowchart({ steps, stepLogicMap, onClose, onEditLogic }: GlobalFlowchartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Sort steps by order
  const sortedSteps = useMemo(() => {
    return [...steps].sort((a, b) => a.step_order - b.step_order)
  }, [steps])

  const getStepName = (stepId?: string) => {
    if (!stepId) return 'End of Form'
    const step = steps.find(s => s.id === stepId)
    return step ? `${step.step_order}. ${step.title}` : `Step not found`
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm">
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Form Logic Overview</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Visualizing the flow and logic rules for all {steps.length} steps</p>
        </div>
        <button 
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-3xl mx-auto space-y-0">
          
          {/* Start Node */}
          <div className="flex justify-center mb-8">
            <div className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${
              isDark 
                ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              Start Form
            </div>
          </div>

          <div className={`w-0.5 h-8 mx-auto -my-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className={`flex justify-center -my-1`}>
            <ArrowDown className={`w-4 h-4 ${isDark ? 'text-gray-700' : 'text-gray-200'}`} />
          </div>

          {/* Steps */}
          {sortedSteps.map((step, index) => {
            const hasLogic = stepLogicMap.has(step.id || '')
            const logic = stepLogicMap.get(step.id || '')
            const hasRules = logic?.rules && logic.rules.length > 0
            
            return (
              <div key={step.id || index} className="relative pb-8">
                
                {/* Connection Line to Next */}
                {index < sortedSteps.length - 1 && (
                  <>
                    <div className={`absolute left-1/2 top-full bottom-0 w-0.5 transform -translate-x-1/2 -z-10 ${
                       isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`} />
                    <div className="absolute left-1/2 bottom-[14px] transform -translate-x-1/2 translate-y-full -z-10">
                       <ArrowDown className={`w-4 h-4 ${isDark ? 'text-gray-700' : 'text-gray-200'}`} />
                    </div>
                  </>
                )}

                {/* Step Card */}
                <div 
                  onClick={() => onEditLogic(step)}
                  className={`relative group rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 hover:border-blue-500/50' 
                      : 'bg-white border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <div className="p-4 flex items-center gap-4">
                    {/* Step Number */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${
                      isDark
                        ? 'bg-gray-900 text-gray-400'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {step.step_order}
                    </div>

                    {/* Step Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {step.title}
                      </h3>
                      <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {step.question_type.replace(/_/g, ' ')}
                      </p>
                    </div>

                    {/* Logic Indicator */}
                    {hasRules ? (
                      <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                        isDark 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        <GitBranch className="w-3.5 h-3.5" />
                        {logic?.rules.length} Rules
                      </div>
                    ) : (
                      <div className={`opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium flex items-center gap-1 ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        <Settings className="w-3.5 h-3.5" />
                        Config
                      </div>
                    )}
                  </div>

                  {/* Logic Rules Visualization (Inline) */}
                  {hasRules && (
                    <div className={`px-4 pb-4 pt-2 border-t ${
                      isDark ? 'border-gray-700/50' : 'border-gray-100'
                    }`}>
                      <div className="space-y-2">
                        {logic?.rules.map((rule, idx) => (
                          <div key={rule.id} className="flex items-center gap-2 text-sm">
                            <span className={`flex-shrink-0 px-1.5 rounded text-[10px] font-bold uppercase ${
                              idx === 0
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                            }`}>
                              {idx === 0 ? 'IF' : 'ELSE IF'}
                            </span>
                            <span className={`text-xs truncate max-w-[150px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {rule.conditions.length} condition{rule.conditions.length > 1 ? 's' : ''}
                            </span>
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                              Go to {getStepName(rule.action.target_step_id)}
                            </span>
                          </div>
                        ))}
                        {logic?.default_action && (
                           <div className="flex items-center gap-2 text-sm">
                           <span className={`flex-shrink-0 px-1.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400`}>
                             ELSE
                           </span>
                           <span className={`text-xs truncate max-w-[150px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                             All other cases
                           </span>
                           <ArrowRight className="w-3 h-3 text-gray-400" />
                           <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                             Go to {getStepName(logic.default_action.action.target_step_id)}
                           </span>
                         </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )
          })}
          
          {/* End Node */}
          <div className="flex justify-center">
             <div className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${
               isDark 
                 ? 'bg-gray-800 border-gray-600 text-gray-400' 
                 : 'bg-gray-100 border-gray-300 text-gray-600'
             }`}>
               End of Default Flow
             </div>
           </div>

        </div>
      </div>
    </div>
  )
}
