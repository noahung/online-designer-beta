import React, { useMemo, useCallback, useState, useEffect } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  ConnectionLineType
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import StartFlowNode from './StartFlowNode'
import StepFlowNode from './StepFlowNode'
import EndFlowNode from './EndFlowNode'
import { getLayoutedElements } from './flowLayout'
import { StepLogic } from '../../types/formLogic'
import { detectCycles } from '../../lib/logicEngine'
import { useTheme } from '../../contexts/ThemeContext'
import {
  GitFork,
  AlertTriangle,
  Layers,
  RefreshCw,
  Sparkles,
  Code,
  CheckCircle2
} from 'lucide-react'

interface Option {
  id?: string
  label: string
}

interface Step {
  id?: string
  title: string
  description?: string
  question_type: string
  step_order: number
  options?: Option[]
}

interface FormFlowchartProps {
  steps: Step[]
  stepLogicMap: Map<string, StepLogic>
  welcomeScreen?: {
    enabled?: boolean
    title?: string
    description?: string
  }
  endingScreen?: {
    title?: string
    description?: string
  }
  onSelectStep?: (stepId: string) => void
  onOpenLogicModal?: (step: Step) => void
  selectedStepId?: string | null
}

const nodeTypes = {
  startNode: StartFlowNode,
  stepNode: StepFlowNode,
  endNode: EndFlowNode
}

export default function FormFlowchart({
  steps,
  stepLogicMap,
  welcomeScreen,
  endingScreen,
  onSelectStep,
  onOpenLogicModal,
  selectedStepId
}: FormFlowchartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Default to Horizontal Left-to-Right ('LR') matching OpenAI Agent workflows
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR')

  // Detect any cycle loops
  const cycleInfo = useMemo(() => {
    return detectCycles(stepLogicMap, steps)
  }, [stepLogicMap, steps])

  // Convert Steps & StepLogicMap to React Flow Nodes & Edges
  const { rawNodes, rawEdges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    const sortedSteps = [...steps].sort((a, b) => a.step_order - b.step_order)

    // 1. Start Node
    nodes.push({
      id: 'start',
      type: 'startNode',
      data: {
        title: welcomeScreen?.title || 'Start Flow',
        description: welcomeScreen?.description || 'Form entry point'
      },
      position: { x: 0, y: 0 }
    })

    // Edge from Start to Step 1
    if (sortedSteps.length > 0 && sortedSteps[0].id) {
      edges.push({
        id: 'start-to-first',
        source: 'start',
        sourceHandle: 'start-out',
        target: sortedSteps[0].id,
        targetHandle: 'in',
        type: ConnectionLineType.Bezier,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981', width: 14, height: 14 },
        style: { stroke: '#10B981', strokeWidth: 2 }
      })
    }

    // 2. Step Nodes
    sortedSteps.forEach((step, index) => {
      if (!step.id) return

      const logic = stepLogicMap.get(step.id)
      const rules = logic?.rules || []
      const hasRules = rules.length > 0

      // Compute friendly summary labels for rules
      const ruleLabels = rules.map((r, i) => {
        if (r.conditions && r.conditions[0]) {
          const c = r.conditions[0]
          if (c.field_type === 'option' && c.option_id) {
            const opt = step.options?.find((o) => o.id === c.option_id)
            return opt ? `If "${opt.label}"` : `Condition ${i + 1}`
          }
          return `If ${c.condition_type?.replace('_', ' ')} ${c.comparison_value || ''}`
        }
        return `Rule ${i + 1}`
      })

      nodes.push({
        id: step.id,
        type: 'stepNode',
        data: {
          stepId: step.id,
          stepOrder: step.step_order,
          title: step.title || `Question ${step.step_order}`,
          questionType: step.question_type,
          description: step.description,
          options: step.options?.map((o) => ({ id: o.id, label: o.label })),
          hasRules,
          ruleCount: rules.length,
          ruleLabels,
          onSelectStep: () => onSelectStep?.(step.id!),
          onOpenLogic: () => onOpenLogicModal?.(step)
        },
        position: { x: 0, y: 0 },
        selected: selectedStepId === step.id
      })

      // Conditional Logic Rules Edges
      if (hasRules) {
        rules.forEach((rule, rIdx) => {
          let label = `Rule ${rIdx + 1}`
          if (rule.conditions && rule.conditions[0]) {
            const firstCond = rule.conditions[0]
            if (firstCond.field_type === 'option' && firstCond.option_id) {
              const matchedOpt = step.options?.find((o) => o.id === firstCond.option_id)
              if (matchedOpt) {
                label = `"${matchedOpt.label}"`
              }
            } else if (firstCond.condition_type) {
              label = `${firstCond.condition_type.replace('_', ' ')} ${firstCond.comparison_value || ''}`
            }
          }

          if (rule.action.type === 'go_to_end') {
            edges.push({
              id: `edge-${step.id}-end-${rule.id}`,
              source: step.id!,
              sourceHandle: 'out',
              target: 'end',
              targetHandle: 'end-in',
              label,
              type: ConnectionLineType.Bezier,
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B', width: 14, height: 14 },
              style: { stroke: '#F59E0B', strokeWidth: 2 },
              labelStyle: { fill: '#B45309', fontWeight: 600, fontSize: 10 },
              labelBgStyle: { fill: '#FEF3C7', fillOpacity: 0.95, rx: 6, ry: 6 }
            })
          } else if (rule.action.target_step_id) {
            edges.push({
              id: `edge-${step.id}-${rule.action.target_step_id}-${rule.id}`,
              source: step.id!,
              sourceHandle: 'out',
              target: rule.action.target_step_id,
              targetHandle: 'in',
              label,
              type: ConnectionLineType.Bezier,
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed, color: '#3B82F6', width: 14, height: 14 },
              style: { stroke: '#3B82F6', strokeWidth: 2 },
              labelStyle: { fill: '#1D4ED8', fontWeight: 600, fontSize: 10 },
              labelBgStyle: { fill: '#EFF6FF', fillOpacity: 0.95, rx: 6, ry: 6 }
            })
          }
        })
      }

      // Default fallback edge
      const defaultTargetId = logic?.default_action?.action?.target_step_id
      const defaultIsEnd = logic?.default_action?.action?.type === 'go_to_end'

      if (defaultIsEnd) {
        edges.push({
          id: `edge-${step.id}-default-end`,
          source: step.id,
          sourceHandle: 'out',
          target: 'end',
          targetHandle: 'end-in',
          label: hasRules ? 'Else' : undefined,
          type: ConnectionLineType.Bezier,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8', width: 12, height: 12 },
          style: { stroke: '#94A3B8', strokeWidth: 1.5, strokeDasharray: '4 4' }
        })
      } else if (defaultTargetId) {
        edges.push({
          id: `edge-${step.id}-default-${defaultTargetId}`,
          source: step.id,
          sourceHandle: 'out',
          target: defaultTargetId,
          targetHandle: 'in',
          label: hasRules ? 'Else' : undefined,
          type: ConnectionLineType.Bezier,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8', width: 12, height: 12 },
          style: { stroke: '#94A3B8', strokeWidth: 1.5, strokeDasharray: '4 4' }
        })
      } else if (!hasRules && index < sortedSteps.length - 1 && sortedSteps[index + 1].id) {
        // Natural linear step sequence
        edges.push({
          id: `edge-${step.id}-${sortedSteps[index + 1].id}`,
          source: step.id,
          sourceHandle: 'out',
          target: sortedSteps[index + 1].id!,
          targetHandle: 'in',
          type: ConnectionLineType.Bezier,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#CBD5E1', width: 12, height: 12 },
          style: { stroke: '#CBD5E1', strokeWidth: 1.5 }
        })
      } else if (!hasRules && index === sortedSteps.length - 1) {
        // Last step goes to end
        edges.push({
          id: `edge-${step.id}-to-end`,
          source: step.id,
          sourceHandle: 'out',
          target: 'end',
          targetHandle: 'end-in',
          type: ConnectionLineType.Bezier,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#CBD5E1', width: 12, height: 12 },
          style: { stroke: '#CBD5E1', strokeWidth: 1.5 }
        })
      }
    })

    // 3. End Node
    nodes.push({
      id: 'end',
      type: 'endNode',
      data: {
        title: endingScreen?.title || 'Thank You / End',
        description: endingScreen?.description || 'Form completion'
      },
      position: { x: 0, y: 0 }
    })

    return { rawNodes: nodes, rawEdges: edges }
  }, [steps, stepLogicMap, welcomeScreen, endingScreen, selectedStepId, onSelectStep, onOpenLogicModal])

  // Apply layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(rawNodes, rawEdges, direction)
  }, [rawNodes, rawEdges, direction])

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  useEffect(() => {
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges])

  const handleReLayout = useCallback(() => {
    const { nodes: newNodes, edges: newEdges } = getLayoutedElements(rawNodes, rawEdges, direction)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [rawNodes, rawEdges, direction, setNodes, setEdges])

  return (
    <div className="relative w-full h-full min-h-[600px] bg-[#fcfcfc] dark:bg-[#0d0d0d] overflow-hidden flex flex-col select-none">
      {/* Top OpenAI-Style Flow Canvas Toolbar */}
      <div className="absolute top-4 left-6 right-6 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-zinc-900 dark:text-white">
            Flow Graph
          </span>
          <span className="text-[11px] text-zinc-400 font-medium">
            • {steps.length} Steps
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {cycleInfo.hasCycles && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Circular loop detected</span>
            </div>
          )}

          <div className="flex items-center gap-1 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <button
              onClick={() => setDirection((d) => (d === 'LR' ? 'TB' : 'LR'))}
              className="px-3 py-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold flex items-center gap-1.5"
              title="Toggle Layout Direction"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{direction === 'LR' ? 'Horizontal' : 'Vertical'}</span>
            </button>
            <button
              onClick={handleReLayout}
              className="px-3 py-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold flex items-center gap-1.5"
              title="Reorganize layout automatically"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Auto Layout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="w-full h-full flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          minZoom={0.2}
          maxZoom={1.6}
        >
          <Background
            color={isDark ? '#27272a' : '#e4e4e7'}
            gap={24}
            size={1.5}
            variant={BackgroundVariant.Dots}
          />
          <Controls
            showInteractive={false}
            className="!bg-white dark:!bg-[#18181b] !border !border-zinc-200 dark:!border-zinc-800 !rounded-2xl !shadow-sm !overflow-hidden"
          />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-white/90 dark:!bg-[#18181b]/90 !border !border-zinc-200 dark:!border-zinc-800 !rounded-2xl !shadow-sm"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
