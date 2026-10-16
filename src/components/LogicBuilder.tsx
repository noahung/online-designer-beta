import React, { useState } from 'react'
import {
  Plus,
  Trash2,
  X,
  AlertCircle,
  ArrowRight,
  GitFork,
  Check,
  Zap,
  Info,
  ChevronDown
} from 'lucide-react'
import {
  LogicRule,
  LogicCondition,
  LogicAction,
  DefaultLogicAction,
  StepLogic,
  LogicConditionType
} from '../types/formLogic'

interface Option {
  id?: string
  label: string
  image_url?: string
}

interface Step {
  id?: string
  title: string
  question_type: string
  step_order: number
  options?: Option[]
}

interface LogicBuilderProps {
  currentStep: Step
  allSteps: Step[]
  stepLogic: StepLogic | null
  onSave: (logic: StepLogic) => void
  onClose: () => void
}

export default function LogicBuilder({
  currentStep,
  allSteps,
  stepLogic,
  onSave,
  onClose
}: LogicBuilderProps) {
  const [rules, setRules] = useState<LogicRule[]>(stepLogic?.rules || [])
  const [defaultAction, setDefaultAction] = useState<DefaultLogicAction | undefined>(
    stepLogic?.default_action
  )

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Available target steps (excluding current step to prevent direct self-loop)
  const targetStepOptions = allSteps.filter((s) => s.id !== currentStep.id)

  const handleAddRule = () => {
    const isOptionBased =
      currentStep.question_type === 'image_selection' ||
      currentStep.question_type === 'multiple_choice'
    const isNumeric =
      currentStep.question_type === 'opinion_scale' ||
      currentStep.question_type === 'dimensions'

    const firstOption = currentStep.options?.[0]
    const newRule: LogicRule = {
      id: generateId(),
      step_id: currentStep.id || '',
      order: rules.length,
      operator: 'AND',
      conditions: [
        {
          id: generateId(),
          field_type: isOptionBased ? 'option' : isNumeric ? 'scale' : 'text',
          option_id: isOptionBased && firstOption?.id ? firstOption.id : undefined,
          condition_type: isOptionBased ? 'is' : isNumeric ? 'greater_than' : 'contains',
          comparison_value: isOptionBased ? (firstOption?.label || '') : isNumeric ? 5 : ''
        }
      ],
      action: {
        type: 'go_to_step',
        target_step_id: targetStepOptions.find((s) => s.step_order > currentStep.step_order)?.id
      }
    }
    setRules([...rules, newRule])
  }

  const handleDeleteRule = (ruleId: string) => {
    setRules(rules.filter((r) => r.id !== ruleId).map((r, idx) => ({ ...r, order: idx })))
  }

  const handleUpdateCondition = (
    ruleId: string,
    conditionId: string,
    updates: Partial<LogicCondition>
  ) => {
    setRules(
      rules.map((rule) => {
        if (rule.id !== ruleId) return rule
        return {
          ...rule,
          conditions: rule.conditions.map((c) => (c.id === conditionId ? { ...c, ...updates } : c))
        }
      })
    )
  }

  const handleAddCondition = (ruleId: string) => {
    const isOptionBased =
      currentStep.question_type === 'image_selection' ||
      currentStep.question_type === 'multiple_choice'
    const isNumeric =
      currentStep.question_type === 'opinion_scale' ||
      currentStep.question_type === 'dimensions'

    const firstOption = currentStep.options?.[0]
    setRules(
      rules.map((rule) => {
        if (rule.id !== ruleId) return rule
        return {
          ...rule,
          conditions: [
            ...rule.conditions,
            {
              id: generateId(),
              field_type: isOptionBased ? 'option' : isNumeric ? 'scale' : 'text',
              option_id: isOptionBased && firstOption?.id ? firstOption.id : undefined,
              condition_type: isOptionBased ? 'is' : isNumeric ? 'greater_than' : 'contains',
              comparison_value: isOptionBased ? (firstOption?.label || '') : ''
            }
          ]
        }
      })
    )
  }

  const handleDeleteCondition = (ruleId: string, conditionId: string) => {
    setRules(
      rules.map((rule) => {
        if (rule.id !== ruleId) return rule
        // Keep at least 1 condition
        if (rule.conditions.length <= 1) return rule
        return {
          ...rule,
          conditions: rule.conditions.filter((c) => c.id !== conditionId)
        }
      })
    )
  }

  const handleUpdateAction = (ruleId: string, updates: Partial<LogicAction>) => {
    setRules(
      rules.map((rule) => {
        if (rule.id !== ruleId) return rule
        return {
          ...rule,
          action: { ...rule.action, ...updates }
        }
      })
    )
  }

  const handleSave = () => {
    const logicData: StepLogic = {
      step_id: currentStep.id || '',
      rules,
      default_action: defaultAction
    }
    onSave(logicData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Step {currentStep.step_order} Logic
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 capitalize">
                  {currentStep.question_type.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                {currentStep.title || 'Branching & Calculations'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {rules.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                No Branching Rules Configured
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                This question will follow the default step flow. Add rules to route respondents to
                different questions based on their answers.
              </p>
              <button
                type="button"
                onClick={handleAddRule}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Logic Rule</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule, rIndex) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3"
                >
                  {/* Rule Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                        RULE {rIndex + 1}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        (Evaluated in sequence)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Conditions List */}
                  <div className="space-y-2">
                    {rule.conditions.map((cond, cIndex) => (
                      <div key={cond.id} className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {cIndex === 0 ? 'IF' : rule.operator || 'AND'}
                        </span>

                        {/* Condition Target Type */}
                        {(currentStep.question_type === 'image_selection' ||
                          currentStep.question_type === 'multiple_choice') && (
                          <>
                            <select
                              value={cond.condition_type || 'is'}
                              onChange={(e) =>
                                handleUpdateCondition(rule.id, cond.id, {
                                  condition_type: e.target.value as LogicConditionType
                                })
                              }
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                            >
                              <option value="is">is</option>
                              <option value="is_not">is not</option>
                            </select>

                            <select
                              value={
                                cond.option_id ||
                                currentStep.options?.find(
                                  (o) => o.label?.toLowerCase() === String(cond.comparison_value || '').toLowerCase()
                                )?.id ||
                                ''
                              }
                              onChange={(e) => {
                                const selectedOpt = currentStep.options?.find((o) => o.id === e.target.value)
                                handleUpdateCondition(rule.id, cond.id, {
                                  option_id: e.target.value,
                                  comparison_value: selectedOpt?.label || ''
                                })
                              }}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium flex-1 min-w-[140px]"
                            >
                              {currentStep.options?.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.label || 'Unnamed Option'}
                                </option>
                              ))}
                            </select>
                          </>
                        )}

                        {(currentStep.question_type === 'opinion_scale' ||
                          currentStep.question_type === 'dimensions') && (
                          <>
                            <select
                              value={cond.condition_type || 'greater_than'}
                              onChange={(e) =>
                                handleUpdateCondition(rule.id, cond.id, {
                                  condition_type: e.target.value as LogicConditionType
                                })
                              }
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                            >
                              <option value="greater_than">&gt; greater than</option>
                              <option value="greater_than_or_equal">&gt;= greater or equal</option>
                              <option value="less_than">&lt; less than</option>
                              <option value="less_than_or_equal">&lt;= less or equal</option>
                              <option value="is">= equals</option>
                              <option value="is_not">!= not equal</option>
                            </select>

                            <input
                              type="number"
                              value={cond.comparison_value ?? ''}
                              onChange={(e) =>
                                handleUpdateCondition(rule.id, cond.id, {
                                  comparison_value: parseFloat(e.target.value) || 0
                                })
                              }
                              className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                              placeholder="Value"
                            />
                          </>
                        )}

                        {currentStep.question_type === 'text_input' && (
                          <>
                            <select
                              value={cond.condition_type || 'contains'}
                              onChange={(e) =>
                                handleUpdateCondition(rule.id, cond.id, {
                                  condition_type: e.target.value as LogicConditionType
                                })
                              }
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                            >
                              <option value="contains">contains</option>
                              <option value="not_contains">does not contain</option>
                              <option value="is">equals exactly</option>
                              <option value="is_filled">is filled</option>
                              <option value="is_empty">is empty</option>
                            </select>

                            {cond.condition_type !== 'is_filled' &&
                              cond.condition_type !== 'is_empty' && (
                                <input
                                  type="text"
                                  value={String(cond.comparison_value ?? '')}
                                  onChange={(e) =>
                                    handleUpdateCondition(rule.id, cond.id, {
                                      comparison_value: e.target.value
                                    })
                                  }
                                  className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                                  placeholder="Keyword or phrase"
                                />
                              )}
                          </>
                        )}

                        {rule.conditions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCondition(rule.id, cond.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action Row */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-xs flex-wrap">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">THEN</span>
                    <select
                      value={rule.action.type}
                      onChange={(e) =>
                        handleUpdateAction(rule.id, {
                          type: e.target.value as any,
                          target_step_id:
                            e.target.value === 'go_to_end' ? undefined : targetStepOptions[0]?.id
                        })
                      }
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                    >
                      <option value="go_to_step">Jump to Step</option>
                      <option value="go_to_end">Go to End of Form</option>
                    </select>

                    {rule.action.type !== 'go_to_end' && (
                      <select
                        value={
                          targetStepOptions.find(
                            (s) =>
                              s.id === rule.action.target_step_id ||
                              String(s.step_order) === String(rule.action.target_step_id)
                          )?.id || rule.action.target_step_id || ''
                        }
                        onChange={(e) =>
                          handleUpdateAction(rule.id, { target_step_id: e.target.value })
                        }
                        className="flex-1 min-w-[180px] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                      >
                        {targetStepOptions.map((s) => (
                          <option key={s.id} value={s.id}>
                            Step {s.step_order}: {s.title || `Question ${s.step_order}`}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddRule}
                className="w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Rule</span>
              </button>
            </div>
          )}

          {/* Fallback Default Else Action */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px]">
                IN ALL OTHER CASES (ELSE)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Go to:</span>
              <select
                value={
                  defaultAction?.action.type === 'go_to_end'
                    ? 'end'
                    : targetStepOptions.find(
                        (s) =>
                          s.id === defaultAction?.action.target_step_id ||
                          String(s.step_order) === String(defaultAction?.action.target_step_id)
                      )?.id ||
                      defaultAction?.action.target_step_id ||
                      'next'
                }
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'next') {
                    setDefaultAction(undefined)
                  } else if (val === 'end') {
                    setDefaultAction({
                      step_id: currentStep.id || '',
                      action: { type: 'go_to_end' }
                    })
                  } else {
                    setDefaultAction({
                      step_id: currentStep.id || '',
                      action: { type: 'go_to_step', target_step_id: val }
                    })
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="next">Default Next Step in Sequence</option>
                <option value="end">End of Form</option>
                {targetStepOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    Step {s.step_order}: {s.title || `Question ${s.step_order}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Logic</span>
          </button>
        </div>
      </div>
    </div>
  )
}
