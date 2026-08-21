import dagre from '@dagrejs/dagre'
import { Node, Edge } from '@xyflow/react'

const nodeWidth = 280
const nodeHeight = 160

/**
 * Computes an organized Directed Acyclic Graph (DAG) layout using Dagre
 * Defaults to 'LR' (Left-to-Right horizontal layout) matching OpenAI Agent Flows.
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR'
) {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: isHorizontal ? 70 : 60,
    ranksep: isHorizontal ? 120 : 90,
    marginx: 50,
    marginy: 50
  })

  nodes.forEach((node) => {
    const width = (node.data?.width as number) || nodeWidth
    const height = (node.data?.height as number) || nodeHeight
    dagreGraph.setNode(node.id, { width, height })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const width = (node.data?.width as number) || nodeWidth
    const height = (node.data?.height as number) || nodeHeight

    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2
      }
    }
  })

  return { nodes: layoutedNodes as Node[], edges }
}
