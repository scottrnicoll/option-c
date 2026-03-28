"use client"

import { useEffect, useRef } from "react"
import type { StandardsGraph, NodeStatus } from "@/lib/graph-types"
import { buildGraph, applyLayout, getNodeColor, getEdgeColor } from "@/lib/graph-utils"
import type Graph from "graphology"
import type Sigma from "sigma"

export function useGraph(
  container: HTMLElement | null,
  data: StandardsGraph,
  progressMap: Map<string, NodeStatus>,
  onNodeClick?: (nodeId: string) => void
) {
  const sigmaRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)

  useEffect(() => {
    if (!container) return

    const el = container
    let cancelled = false
    let sigmaInstance: Sigma | null = null

    async function init() {
      const { default: SigmaClass } = await import("sigma")

      if (cancelled) return

      const graph = buildGraph(data)
      applyLayout(graph)

      // Apply node colors based on progress
      graph.forEachNode((nodeId, attrs) => {
        const status = progressMap.get(nodeId) ?? "locked"
        graph.setNodeAttribute(nodeId, "color", getNodeColor(status))
        graph.setNodeAttribute(nodeId, "size", attrs.isHub ? 8 : 4)
      })

      // Apply edge colors based on progress
      graph.forEachEdge((edgeId, attrs, source, target) => {
        const sourceStatus = progressMap.get(source) ?? "locked"
        const targetStatus = progressMap.get(target) ?? "locked"
        graph.setEdgeAttribute(edgeId, "color", getEdgeColor(sourceStatus, targetStatus, attrs.edgeType))
      })

      if (cancelled) return

      sigmaInstance = new SigmaClass(graph, el, {
        defaultEdgeType: "arrow",
        renderEdgeLabels: false,
        labelColor: { color: "#e2e8f0" },
        labelRenderedSizeThreshold: 12,
        defaultNodeColor: "#333333",
        defaultEdgeColor: "#ffffff08",
      })

      sigmaInstance.on("clickNode", ({ node }) => {
        onNodeClick?.(node)
      })

      sigmaRef.current = sigmaInstance
      graphRef.current = graph
    }

    init()

    return () => {
      cancelled = true
      if (sigmaInstance) {
        sigmaInstance.kill()
      }
      sigmaRef.current = null
      graphRef.current = null
    }
  }, [container, data, progressMap, onNodeClick])

  return { sigma: sigmaRef, graph: graphRef }
}
