"use client"

import { useRef, useCallback, useState } from "react"
import type { StandardsGraph, NodeStatus } from "@/lib/graph-types"
import { useGraph } from "./use-graph"

interface KnowledgeGraphProps {
  data: StandardsGraph
  progressMap: Map<string, NodeStatus>
  onNodeClick?: (nodeId: string) => void
}

export function KnowledgeGraph({ data, progressMap, onNodeClick }: KnowledgeGraphProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node)
  }, [])

  useGraph(container, data, progressMap, onNodeClick)

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-zinc-950"
    />
  )
}
