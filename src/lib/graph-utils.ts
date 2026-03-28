import Graph from "graphology"
import forceAtlas2 from "graphology-layout-forceatlas2"
import type { StandardsGraph, NodeStatus } from "./graph-types"

export function buildGraph(data: StandardsGraph): Graph {
  const graph = new Graph()
  for (const node of data.nodes) {
    graph.addNode(node.id, {
      label: node.description.slice(0, 60),
      ...node,
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      size: node.isHub ? 8 : 4,
    })
  }
  for (const edge of data.edges) {
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue
    const edgeKey = `${edge.source}->${edge.target}`
    if (graph.hasEdge(edgeKey)) continue
    graph.addEdgeWithKey(edgeKey, edge.source, edge.target, { edgeType: edge.type })
  }
  return graph
}

export function applyLayout(graph: Graph): void {
  forceAtlas2.assign(graph, {
    iterations: 500,
    settings: { gravity: 1, scalingRatio: 10, barnesHutOptimize: true, slowDown: 5 },
  })
}

export function getNodeColor(status: NodeStatus): string {
  switch (status) {
    case "locked": return "#333333"
    case "available": return "#4a9eff"
    case "in_progress": return "#f59e0b"
    case "unlocked": return "#22c55e"
  }
}

export function getEdgeColor(sourceStatus: NodeStatus, targetStatus: NodeStatus, edgeType: string): string {
  if (sourceStatus === "unlocked" && targetStatus === "unlocked") return "#22c55e80"
  if (sourceStatus === "unlocked" && targetStatus === "available") return "#4a9eff60"
  if (edgeType === "related") return "#ffffff15"
  return "#ffffff08"
}
