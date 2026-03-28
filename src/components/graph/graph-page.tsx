"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import type { StandardsGraph, StandardNode, NodeStatus } from "@/lib/graph-types"
import { getNodeColor, getEdgeColor } from "@/lib/graph-utils"
import { KnowledgeGraph } from "./knowledge-graph"
import { useRippleAnimation } from "./use-ripple-animation"
import { StandardPanel } from "@/components/standard/standard-panel"
import type Sigma from "sigma"
import type Graph from "graphology"

interface GraphPageProps {
  data: StandardsGraph
}

function computeInitialProgress(data: StandardsGraph): Map<string, NodeStatus> {
  const incomingPrereqs = new Set<string>()

  for (const edge of data.edges) {
    if (edge.type === "prerequisite") {
      incomingPrereqs.add(edge.target)
    }
  }

  const progressMap = new Map<string, NodeStatus>()
  for (const node of data.nodes) {
    if (incomingPrereqs.has(node.id)) {
      progressMap.set(node.id, "locked")
    } else {
      progressMap.set(node.id, "available")
    }
  }

  return progressMap
}

function computeNewlyAvailable(
  data: StandardsGraph,
  progressMap: Map<string, NodeStatus>,
  unlockedId: string
): string[] {
  const newlyAvailable: string[] = []
  for (const edge of data.edges) {
    if (edge.type === "prerequisite" && edge.source === unlockedId) {
      const candidateId = edge.target
      const allPrereqsMet = data.edges
        .filter(e => e.type === "prerequisite" && e.target === candidateId)
        .every(e => progressMap.get(e.source) === "unlocked" || e.source === unlockedId)
      if (allPrereqsMet && progressMap.get(candidateId) === "locked") {
        newlyAvailable.push(candidateId)
      }
    }
  }
  return newlyAvailable
}

function updateGraphColors(
  graph: Graph,
  sigma: Sigma,
  progressMap: Map<string, NodeStatus>
) {
  graph.forEachEdge((edgeId, attrs, source, target) => {
    const sourceStatus = progressMap.get(source) ?? "locked"
    const targetStatus = progressMap.get(target) ?? "locked"
    graph.setEdgeAttribute(edgeId, "color", getEdgeColor(sourceStatus, targetStatus, attrs.edgeType))
  })
  sigma.refresh()
}

export function GraphPage({ data }: GraphPageProps) {
  const initialProgress = useMemo(() => computeInitialProgress(data), [data])
  const [progressMap, setProgressMap] = useState<Map<string, NodeStatus>>(initialProgress)
  const [selectedStandard, setSelectedStandard] = useState<StandardNode | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const sigmaRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)

  const { triggerRipple } = useRippleAnimation(sigmaRef.current, graphRef.current)

  const handleGraphReady = useCallback((sigma: Sigma, graph: Graph) => {
    sigmaRef.current = sigma
    graphRef.current = graph
  }, [])

  const handleNodeClick = useCallback((nodeId: string) => {
    const status = progressMap.get(nodeId)
    if (status === "available" || status === "in_progress") {
      const node = data.nodes.find((n) => n.id === nodeId)
      if (node) {
        setSelectedStandard(node)
        setPanelOpen(true)
      }
    } else if (status === "locked") {
      console.log("Locked — need prerequisites")
    } else if (status === "unlocked") {
      console.log("Already unlocked")
    }
  }, [progressMap, data.nodes])

  const handleUnlock = useCallback((standardId: string) => {
    // Close the panel
    setPanelOpen(false)

    // Compute newly available before updating state
    const newlyAvailable = computeNewlyAvailable(data, progressMap, standardId)

    // Update progressMap: unlocked node + newly available nodes
    setProgressMap((prev) => {
      const next = new Map(prev)
      next.set(standardId, "unlocked")
      for (const id of newlyAvailable) {
        next.set(id, "available")
      }

      // Update edge colors on the graph instance with the new state
      if (graphRef.current && sigmaRef.current) {
        updateGraphColors(graphRef.current, sigmaRef.current, next)
      }

      return next
    })

    // Fire-and-forget API call (will be wired to real auth later)
    fetch("/api/progress/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ standardId }),
    }).catch(() => {
      // Silently ignore — client-side cascade is the source of truth for now
    })

    // Trigger the ripple animation
    triggerRipple(standardId, newlyAvailable)
  }, [data, progressMap, triggerRipple])

  return (
    <div className="h-screen w-screen">
      <KnowledgeGraph
        data={data}
        progressMap={progressMap}
        onNodeClick={handleNodeClick}
        onGraphReady={handleGraphReady}
      />
      <StandardPanel
        standard={selectedStandard}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onUnlock={handleUnlock}
      />
    </div>
  )
}
