"use client"

import { useState, useCallback, useMemo } from "react"
import type { StandardsGraph, NodeStatus } from "@/lib/graph-types"
import { KnowledgeGraph } from "./knowledge-graph"

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

export function GraphPage({ data }: GraphPageProps) {
  const initialProgress = useMemo(() => computeInitialProgress(data), [data])
  const [progressMap, setProgressMap] = useState<Map<string, NodeStatus>>(initialProgress)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const handleNodeClick = useCallback((nodeId: string) => {
    console.log("Node clicked:", nodeId)
    setSelectedNode(nodeId)
  }, [])

  return (
    <div className="h-screen w-screen">
      <KnowledgeGraph
        data={data}
        progressMap={progressMap}
        onNodeClick={handleNodeClick}
      />
    </div>
  )
}
