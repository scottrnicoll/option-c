"use client"

import { useState, useCallback, useMemo } from "react"
import type { StandardsGraph, StandardNode, NodeStatus } from "@/lib/graph-types"
import { buildGraphData, getNodeColor, getNodeSize, getEdgeColor } from "@/lib/graph-utils"
import { KnowledgeGraph } from "./knowledge-graph"
import { ProgressOverlay } from "./progress-overlay"
import { WelcomeOverlay } from "./welcome-overlay"
import { StandardPanel } from "@/components/standard/standard-panel"

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
    progressMap.set(node.id, incomingPrereqs.has(node.id) ? "locked" : "available")
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

export function GraphPage({ data }: GraphPageProps) {
  const initialProgress = useMemo(() => computeInitialProgress(data), [data])
  const [progressMap, setProgressMap] = useState<Map<string, NodeStatus>>(initialProgress)
  const [selectedStandard, setSelectedStandard] = useState<StandardNode | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)

  // Compute counts from progressMap
  const counts = useMemo(() => {
    let available = 0, unlocked = 0
    progressMap.forEach(status => {
      if (status === "available") available++
      if (status === "unlocked") unlocked++
    })
    return { total: data.nodes.length, available, unlocked }
  }, [progressMap, data.nodes.length])

  // Build graph data for the 3D renderer
  const graphData = useMemo(() => buildGraphData(data, progressMap), [data, progressMap])

  const handleNodeClick = useCallback((nodeId: string, status: NodeStatus) => {
    if (status === "available" || status === "in_progress") {
      const node = data.nodes.find((n) => n.id === nodeId)
      if (node) {
        setSelectedStandard(node)
        setPanelOpen(true)
      }
    }
  }, [data.nodes])

  const handleUnlock = useCallback((standardId: string) => {
    setPanelOpen(false)

    const newlyAvailable = computeNewlyAvailable(data, progressMap, standardId)

    setProgressMap((prev) => {
      const next = new Map(prev)
      next.set(standardId, "unlocked")
      for (const id of newlyAvailable) {
        next.set(id, "available")
      }
      return next
    })

    // Fire-and-forget API call
    fetch("/api/progress/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ standardId }),
    }).catch(() => {})

    // Focus camera on the unlocked node
    setFocusNodeId(standardId)
    setTimeout(() => setFocusNodeId(null), 2000)
  }, [data, progressMap])

  return (
    <div className="h-screen w-screen relative">
      <KnowledgeGraph
        graphData={graphData}
        onNodeClick={handleNodeClick}
        focusNodeId={focusNodeId}
      />
      <ProgressOverlay total={counts.total} available={counts.available} unlocked={counts.unlocked} />
      {showWelcome && (
        <WelcomeOverlay
          availableCount={counts.available}
          onDismiss={() => setShowWelcome(false)}
        />
      )}
      <StandardPanel
        standard={selectedStandard}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onUnlock={handleUnlock}
      />
    </div>
  )
}
