/**
 * Form Logic Types
 * Defines the structure for conditional branching/logic in forms
 */

export type LogicConditionType = 'is' | 'is_not' | 'contains' | 'not_contains' | 'greater_than' | 'less_than'
export type LogicActionType = 'go_to_step' | 'go_to_end' | 'skip_to_step'

/**
 * A single condition in a logic rule
 */
export interface LogicCondition {
  id: string
  field_type: 'option' | 'text' | 'scale' | 'dimension'
  // For option-based questions (image_selection, multiple_choice)
  option_id?: string
  // For comparison-based questions (opinion_scale, dimensions, text)
  condition_type?: LogicConditionType
  comparison_value?: string | number
}

/**
 * Action to take when conditions are met
 */
export interface LogicAction {
  type: LogicActionType
  target_step_order?: number // The step to jump to (1-based)
}

/**
 * A single logic rule (If-Then statement)
 */
export interface LogicRule {
  id: string
  step_id: string // The step this rule belongs to
  conditions: LogicCondition[] // Multiple conditions can be AND'ed together
  action: LogicAction
  order: number // Order of evaluation (rules are checked in order)
}

/**
 * Default action for "All other cases" (Else)
 */
export interface DefaultLogicAction {
  step_id: string
  action: LogicAction
}

/**
 * Complete logic configuration for a step
 */
export interface StepLogic {
  step_id: string
  rules: LogicRule[] // If-Then, Else-If-Then rules
  default_action?: DefaultLogicAction // Else-Then rule
}
