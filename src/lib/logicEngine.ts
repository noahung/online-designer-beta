import type {
  StepLogic,
  LogicRule,
  LogicCondition,
  LogicEvaluationResult
} from '../types/formLogic'

export interface StepMinimal {
  id?: string
  title: string
  question_type: string
  step_order: number
  options?: Array<{ id?: string; label: string; image_url?: string }>
}

/**
 * Evaluates a single logic condition against the user's response.
 */
export function evaluateCondition(
  condition: LogicCondition,
  userResponse: any
): boolean {
  if (userResponse === undefined || userResponse === null) {
    return condition.condition_type === 'is_empty'
  }

  switch (condition.field_type) {
    case 'option': {
      // Option can be stored as option_id directly, object { id, option_id }, or array for multi-choice
      const selectedOptionId =
        typeof userResponse === 'string'
          ? userResponse
          : userResponse?.option_id || userResponse?.id

      if (Array.isArray(userResponse)) {
        const ids = userResponse.map((item) =>
          typeof item === 'string' ? item : item?.option_id || item?.id
        )
        if (condition.condition_type === 'is_not') {
          return !ids.includes(condition.option_id)
        }
        return ids.includes(condition.option_id)
      }

      if (condition.condition_type === 'is_not') {
        return selectedOptionId !== condition.option_id
      }
      return selectedOptionId === condition.option_id
    }

    case 'scale':
    case 'dimension': {
      let numericVal: number | null = null
      if (typeof userResponse === 'number') {
        numericVal = userResponse
      } else if (typeof userResponse === 'string') {
        const parsed = parseFloat(userResponse)
        if (!isNaN(parsed)) numericVal = parsed
      } else if (typeof userResponse === 'object') {
        // e.g. dimensions { width, height, length, value }
        const val = userResponse?.value ?? userResponse?.width ?? userResponse?.rating
        const parsed = parseFloat(val)
        if (!isNaN(parsed)) numericVal = parsed
      }

      if (numericVal === null) return false

      const compVal =
        typeof condition.comparison_value === 'number'
          ? condition.comparison_value
          : parseFloat(String(condition.comparison_value || '0'))

      switch (condition.condition_type) {
        case 'greater_than':
          return numericVal > compVal
        case 'greater_than_or_equal':
          return numericVal >= compVal
        case 'less_than':
          return numericVal < compVal
        case 'less_than_or_equal':
          return numericVal <= compVal
        case 'is':
          return numericVal === compVal
        case 'is_not':
          return numericVal !== compVal
        default:
          return numericVal === compVal
      }
    }

    case 'text':
    default: {
      const textVal =
        typeof userResponse === 'string'
          ? userResponse
          : typeof userResponse === 'object'
          ? userResponse?.text || userResponse?.value || JSON.stringify(userResponse)
          : String(userResponse || '')

      const trimmedText = textVal.trim().toLowerCase()
      const compText = String(condition.comparison_value || '').trim().toLowerCase()

      switch (condition.condition_type) {
        case 'is_filled':
          return trimmedText.length > 0
        case 'is_empty':
          return trimmedText.length === 0
        case 'is':
          return trimmedText === compText
        case 'is_not':
          return trimmedText !== compText
        case 'contains':
          return trimmedText.includes(compText)
        case 'not_contains':
          return !trimmedText.includes(compText)
        default:
          return trimmedText === compText
      }
    }
  }
}

/**
 * Evaluates the step logic for a given step and user response,
 * returning the target step ID, index, and whether it leads to the form ending.
 */
export function evaluateStepLogic(
  currentStepId: string,
  userResponse: any,
  stepLogic: StepLogic | undefined | null,
  allSteps: StepMinimal[]
): LogicEvaluationResult {
  const result: LogicEvaluationResult = {
    targetStepId: null,
    targetStepIndex: null,
    isEnd: false
  }

  if (!stepLogic) {
    return result
  }

  // 1. Evaluate explicit rules in sequential order
  if (Array.isArray(stepLogic.rules) && stepLogic.rules.length > 0) {
    for (const rule of stepLogic.rules) {
      if (!rule.conditions || rule.conditions.length === 0) continue

      const operator = rule.operator || 'AND'
      let isMatch = false

      if (operator === 'AND') {
        isMatch = rule.conditions.every((cond) => evaluateCondition(cond, userResponse))
      } else {
        isMatch = rule.conditions.some((cond) => evaluateCondition(cond, userResponse))
      }

      if (isMatch) {
        result.matchedRuleId = rule.id

        if (rule.action.type === 'go_to_end') {
          result.isEnd = true
          result.targetStepIndex = allSteps.length
          return result
        }

        if (rule.action.target_step_id) {
          result.targetStepId = rule.action.target_step_id
          const targetIndex = allSteps.findIndex((s) => s.id === rule.action.target_step_id)
          result.targetStepIndex = targetIndex >= 0 ? targetIndex : null
          return result
        }
      }
    }
  }

  // 2. Evaluate fallback default action if no rule matched
  if (stepLogic.default_action && stepLogic.default_action.action) {
    const action = stepLogic.default_action.action
    if (action.type === 'go_to_end') {
      result.isEnd = true
      result.targetStepIndex = allSteps.length
      return result
    }

    if (action.target_step_id) {
      result.targetStepId = action.target_step_id
      const targetIndex = allSteps.findIndex((s) => s.id === action.target_step_id)
      result.targetStepIndex = targetIndex >= 0 ? targetIndex : null
      return result
    }
  }

  return result
}

/**
 * Cleans up logic rules that point to deleted steps or invalid option IDs.
 */
export function cleanupDanglingLogicRules(
  stepLogicMap: Map<string, StepLogic>,
  validStepIds: Set<string>,
  validOptionIds?: Set<string>
): Map<string, StepLogic> {
  const cleanedMap = new Map<string, StepLogic>()

  stepLogicMap.forEach((logic, stepId) => {
    if (!validStepIds.has(stepId)) return

    const cleanedRules: LogicRule[] = []

    for (const rule of logic.rules || []) {
      // Filter out conditions with deleted option IDs if validOptionIds provided
      const validConditions = validOptionIds
        ? rule.conditions.filter(
            (cond) => cond.field_type !== 'option' || (cond.option_id && validOptionIds.has(cond.option_id))
          )
        : rule.conditions

      // Validate action target
      const isTargetValid =
        rule.action.type === 'go_to_end' ||
        (rule.action.target_step_id && validStepIds.has(rule.action.target_step_id))

      if (validConditions.length > 0 && isTargetValid) {
        cleanedRules.push({
          ...rule,
          conditions: validConditions
        })
      }
    }

    let cleanedDefaultAction = logic.default_action
    if (
      cleanedDefaultAction &&
      cleanedDefaultAction.action.type !== 'go_to_end' &&
      cleanedDefaultAction.action.target_step_id &&
      !validStepIds.has(cleanedDefaultAction.action.target_step_id)
    ) {
      cleanedDefaultAction = undefined
    }

    cleanedMap.set(stepId, {
      ...logic,
      rules: cleanedRules,
      default_action: cleanedDefaultAction
    })
  })

  return cleanedMap
}

/**
 * Detects cyclic branching rules (e.g. Step A -> Step B -> Step A)
 */
export function detectCycles(
  stepLogicMap: Map<string, StepLogic>,
  steps: StepMinimal[]
): { hasCycles: boolean; cyclePaths: string[][] } {
  const graph = new Map<string, string[]>()
  const stepIds = steps.map((s) => s.id).filter(Boolean) as string[]

  // Build adjacency list
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    if (!step.id) continue

    const neighbors: string[] = []
    const logic = stepLogicMap.get(step.id)

    if (logic && logic.rules && logic.rules.length > 0) {
      for (const rule of logic.rules) {
        if (rule.action.type === 'go_to_step' && rule.action.target_step_id) {
          neighbors.push(rule.action.target_step_id)
        }
      }
      if (logic.default_action?.action.target_step_id) {
        neighbors.push(logic.default_action.action.target_step_id)
      }
    } else {
      // Default linear progression
      if (i + 1 < steps.length && steps[i + 1].id) {
        neighbors.push(steps[i + 1].id!)
      }
    }

    graph.set(step.id, neighbors)
  }

  const visited = new Set<string>()
  const recStack = new Set<string>()
  const cycles: string[][] = []

  function dfs(node: string, path: string[]) {
    visited.add(node)
    recStack.add(node)
    path.push(node)

    const neighbors = graph.get(node) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path])
      } else if (recStack.has(neighbor)) {
        const cycleStartIndex = path.indexOf(neighbor)
        if (cycleStartIndex !== -1) {
          cycles.push([...path.slice(cycleStartIndex), neighbor])
        }
      }
    }

    recStack.delete(node)
  }

  for (const stepId of stepIds) {
    if (!visited.has(stepId)) {
      dfs(stepId, [])
    }
  }

  return {
    hasCycles: cycles.length > 0,
    cyclePaths: cycles
  }
}
