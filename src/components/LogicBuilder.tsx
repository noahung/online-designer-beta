import React, { useState } from 'react'
import { Plus, Trash2, X, AlertCircle, ArrowRight, ChevronRight, Check, Zap } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { LogicRule, LogicCondition, LogicAction, DefaultLogicAction, StepLogic } from '../types/formLogic'

interface Step {
  id?: string
  title: string
  question_type: string
  step_order: number
  options: Array<{ id?: string; label: string }>
}

interface LogicBuilderProps {
  currentStep: Step
  allSteps: Step[]
  stepLogic: StepLogic | null
  onSave: (logic: StepLogic) => void
  onClose: () => void
}

export default function LogicBuilder({ currentStep, allSteps, stepLogic, onSave, onClose }: LogicBuilderProps) {
  const { theme } = useTheme()
  const [rules, setRules] = useState<LogicRule[]>(stepLogic?.rules || [])
  const [defaultAction, setDefaultAction] = useState<DefaultLogicAction | undefined>(stepLogic?.default_action)

  // Generate unique ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Add new rule
  const addRule = () => {
    const newRule: LogicRule = {
      id: generateId(),
      step_id: currentStep.id || '',
      conditions: [{
        id: generateId(),
        field_type: currentStep.question_type === 'image_selection' || currentStep.question_type === 'multiple_choice' 
          ? 'option' 
          : currentStep.question_type === 'opinion_scale' 
          ? 'scale' 
          : 'text',
        option_id: currentStep.options[0]?.id
      }],
      action: {
        type: 'go_to_step',
        target_step_order: allSteps.find(s => s.step_order > currentStep.step_order)?.step_order
      },
      order: rules.length
    }
    setRules([...rules, newRule])
  }

  // Delete rule
  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId).map((r, idx) => ({ ...r, order: idx })))
  }

  // Update rule condition
  const updateCondition = (ruleId: string, conditionId: string, updates: Partial<LogicCondition>) => {
    setRules(rules.map(rule => 
      rule.id === ruleId
        ? {
            ...rule,
            conditions: rule.conditions.map(c => 
              c.id === conditionId ? { ...c, ...updates } : c
            )
          }
        : rule
    ))
  }

  // Update rule action
  const updateAction = (ruleId: string, updates: Partial<LogicAction>) => {
    setRules(rules.map(rule => 
      rule.id === ruleId ? { ...rule, action: { ...rule.action, ...updates } } : rule
    ))
  }

  // Add condition to rule
  const addCondition = (ruleId: string) => {
    setRules(rules.map(rule => 
      rule.id === ruleId
        ? {
            ...rule,
            conditions: [
              ...rule.conditions,
              {
                id: generateId(),
                field_type: 'option',
                option_id: currentStep.options[0]?.id
              }
            ]
          }
        : rule
    ))
  }

  // Delete condition from rule
  const deleteCondition = (ruleId: string, conditionId: string) => {
    setRules(rules.map(rule => 
      rule.id === ruleId
        ? { ...rule, conditions: rule.conditions.filter(c => c.id !== conditionId) }
        : rule
    ))
  }

  // Update default action
  const updateDefaultAction = (updates: Partial<LogicAction>) => {
    setDefaultAction({
      step_id: currentStep.id || '',
      action: { ...defaultAction?.action, ...updates } as LogicAction
    })
  }

  // Save and close
  const handleSave = () => {
    const logic: StepLogic = {
      step_id: currentStep.id || '',
      rules,
      default_action: defaultAction
    }
    onSave(logic)
    onClose()
  }

  // Get available target steps (steps after current)
  const availableTargetSteps = allSteps.filter(s => s.step_order > currentStep.step_order)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
        theme === 'light'
          ? 'bg-white border border-gray-200'
          : 'bg-gray-900 border border-white/10'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 border-b p-6 flex items-center justify-between backdrop-blur-sm ${
          theme === 'light'
            ? 'bg-white/90 border-gray-200'
            : 'bg-gray-900/90 border-white/10'
        }`}>
          <div>
            <h2 className={`text-2xl font-bold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Edit logic for
            </h2>
            <p className={`mt-1 text-sm flex items-center gap-2 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold">
                {currentStep.step_order}
              </span>
              {currentStep.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'light'
                ? 'hover:bg-gray-100 text-gray-600'
                : 'hover:bg-white/10 text-white/60'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Box */}
        <div className={`m-6 p-4 rounded-xl border flex items-start gap-3 ${
          theme === 'light'
            ? 'bg-blue-50 border-blue-200'
            : 'bg-blue-500/10 border-blue-400/30'
        }`}>
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <p className={`text-sm font-medium mb-1 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Segment respondents, customize flows and calculate scores
            </p>
            <p className={`text-sm ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Assign your respondents to a specific segment based on their answers and customize their path accordingly. You can also calculate scores based on answers, segments and the source of respondents.
            </p>
          </div>
        </div>

        {/* Rules */}
        <div className="p-6 space-y-4">
          {rules.map((rule, ruleIndex) => (
            <div
              key={rule.id}
              className={`p-6 rounded-xl border-2 ${
                theme === 'light'
                  ? 'bg-white border-gray-200'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {/* Rule Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                    ruleIndex === 0
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                  }`}>
                    <Zap className="w-3.5 h-3.5" />
                    {ruleIndex === 0 ? 'If' : `Else If ${ruleIndex}`}
                  </div>
                  {rule.conditions.length > 1 && (
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      theme === 'light'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-white/10 text-white/70'
                    }`}>
                      {rule.conditions.length} conditions
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className={`p-2 rounded-lg transition-all hover:scale-110 ${
                    theme === 'light'
                      ? 'hover:bg-red-50 text-red-600'
                      : 'hover:bg-red-500/20 text-red-400'
                  }`}
                  title="Delete rule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Conditions */}
              <div className="space-y-3 mb-4">
                {rule.conditions.map((condition, condIndex) => (
                  <div key={condition.id}>
                    <div className="flex items-center gap-3">
                      {/* Step indicator */}
                      <div className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                        theme === 'light'
                          ? 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200'
                          : 'bg-gradient-to-r from-white/5 to-white/10 text-white/90 border-white/10'
                      }`}>
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] font-bold">
                          {currentStep.step_order}
                        </span>
                        {currentStep.title}
                      </div>

                      {/* Condition type */}
                      {condition.field_type === 'option' && (
                        <>
                          <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                            theme === 'light' ? 'text-gray-400' : 'text-white/40'
                          }`} />
                          <select
                            value="is"
                            className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                              theme === 'light'
                                ? 'bg-white border-gray-300 text-gray-900 [&>option]:text-gray-900 [&>option]:bg-white'
                                : 'bg-white/10 border-white/20 text-white [&>option]:text-white [&>option]:bg-gray-800'
                            }`}
                          >
                            <option value="is">is</option>
                          </select>

                          {/* Option selector */}
                          <select
                            value={condition.option_id || ''}
                            onChange={(e) => updateCondition(rule.id, condition.id, { option_id: e.target.value })}
                            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium ${
                              theme === 'light'
                                ? 'bg-white border-gray-300 text-gray-900 [&>option]:text-gray-900 [&>option]:bg-white'
                                : 'bg-white/10 border-white/20 text-white [&>option]:text-white [&>option]:bg-gray-800'
                            }`}
                          >
                            {currentStep.options.map(opt => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </>
                      )}

                      {/* Delete condition button */}
                      {rule.conditions.length > 1 && (
                        <button
                          onClick={() => deleteCondition(rule.id, condition.id)}
                          className={`p-2 rounded-lg transition-all hover:scale-110 flex-shrink-0 ${
                            theme === 'light'
                              ? 'hover:bg-red-50 text-red-600'
                              : 'hover:bg-red-500/20 text-red-400'
                          }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* AND connector */}
                    {condIndex < rule.conditions.length - 1 && (
                      <div className="flex items-center gap-2 py-2 pl-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          theme === 'light'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          AND
                        </div>
                        <div className={`text-xs ${
                          theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          All conditions must be met
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add condition button */}
                <button
                  onClick={() => addCondition(rule.id)}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    theme === 'light'
                      ? 'text-blue-600 hover:bg-blue-50'
                      : 'text-blue-400 hover:bg-blue-500/20'
                  }`}
                >
                  + Add condition
                </button>
              </div>

              {/* Then Action */}
              <div className={`pt-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                    theme === 'light'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                    Then
                  </div>

                  <ArrowRight className={`w-4 h-4 flex-shrink-0 ${
                    theme === 'light' ? 'text-gray-400' : 'text-white/40'
                  }`} />

                  {/* Action type */}
                  <select
                    value={rule.action.type}
                    onChange={(e) => updateAction(rule.id, { type: e.target.value as any })}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 text-gray-900 [&>option]:text-gray-900 [&>option]:bg-white'
                        : 'bg-white/10 border-white/20 text-white [&>option]:text-white [&>option]:bg-gray-800'
                    }`}
                  >
                    <option value="go_to_step">Go to</option>
                    <option value="skip_to_step">Skip to</option>
                  </select>

                  {/* Target step */}
                  <select
                    value={rule.action.target_step_order || ''}
                    onChange={(e) => updateAction(rule.id, { target_step_order: Number(e.target.value) })}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium ${
                      theme === 'light'
                        ? 'bg-white border-gray-300 text-gray-900 [&>option]:text-gray-900 [&>option]:bg-white'
                        : 'bg-white/10 border-white/20 text-white [&>option]:text-white [&>option]:bg-gray-800'
                    }`}
                  >
                    <option value="">Select step...</option>
                    {availableTargetSteps.map(step => (
                      <option key={step.id} value={step.step_order}>
                        {step.step_order}. {step.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {/* Add Rule Button */}
          <button
            onClick={addRule}
            className={`w-full py-3 px-4 rounded-xl border-2 border-dashed transition-all text-sm font-medium flex items-center justify-center gap-2 ${
              theme === 'light'
                ? 'border-gray-300 hover:border-blue-400 text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                : 'border-white/20 hover:border-blue-400/50 text-white/60 hover:text-blue-400 hover:bg-blue-500/10'
            }`}
          >
            <Plus className="w-4 h-4" />
            Add rule
          </button>

          {/* Default Action (All other cases) */}
          <div className={`p-6 rounded-xl border-2 ${
            theme === 'light'
              ? 'bg-gradient-to-br from-gray-50 to-white border-gray-300'
              : 'bg-gradient-to-br from-white/5 to-white/10 border-white/20'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-500/25'
                  : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25'
              }`}>
                <AlertCircle className="w-3.5 h-3.5" />
                Else
              </div>

              <ArrowRight className={`w-4 h-4 flex-shrink-0 ${
                theme === 'light' ? 'text-gray-400' : 'text-white/40'
              }`} />

              <span className={`text-sm font-medium ${
                theme === 'light' ? 'text-gray-700' : 'text-white/80'
              }`}>
                All other cases go to
              </span>

              <select
                value={defaultAction?.action?.target_step_order || ''}
                onChange={(e) => updateDefaultAction({ 
                  type: 'go_to_step',
                  target_step_order: Number(e.target.value) 
                })}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium ${
                  theme === 'light'
                    ? 'bg-white border-gray-300 text-gray-900 [&>option]:text-gray-900 [&>option]:bg-white'
                    : 'bg-white/10 border-white/20 text-white [&>option]:text-white [&>option]:bg-gray-800'
                }`}
              >
                <option value="">Next step (default)</option>
                {availableTargetSteps.map(step => (
                  <option key={step.id} value={step.step_order}>
                    {step.step_order}. {step.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info about no rules */}
          {rules.length === 0 && (
            <div className={`p-4 rounded-xl text-center ${
              theme === 'light'
                ? 'bg-gray-50 text-gray-600'
                : 'bg-white/5 text-white/60'
            }`}>
              <p className="text-sm">No logic rules defined. Form will proceed to the next step by default.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 border-t p-6 flex items-center justify-between backdrop-blur-sm ${
          theme === 'light'
            ? 'bg-white/90 border-gray-200'
            : 'bg-gray-900/90 border-white/10'
        }`}>
          <button
            onClick={() => setRules([])}
            className={`text-sm px-4 py-2 rounded-lg transition-colors ${
              theme === 'light'
                ? 'text-red-600 hover:bg-red-50'
                : 'text-red-400 hover:bg-red-500/20'
            }`}
          >
            Delete all rules
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-xl transition-colors ${
                theme === 'light'
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
