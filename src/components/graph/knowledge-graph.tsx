"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { NodeStatus } from "@/lib/graph-types"
import type { GraphData, GraphNode } from "@/lib/graph-utils"

interface KnowledgeGraphProps {
  graphData: GraphData
  onNodeClick?: (nodeId: string, status: NodeStatus) => void
  focusNodeId?: string | null
  initialGrade?: string | null
}

export function KnowledgeGraph({ graphData, onNodeClick, focusNodeId, initialGrade }: KnowledgeGraphProps) {
  const fgRef = useRef<any>(null)
  const [ForceGraph3D, setForceGraph3D] = useState<any>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Dynamic import of ForceGraph3D (browser-only)
  useEffect(() => {
    import("react-force-graph-3d").then(mod => {
      setForceGraph3D(() => mod.default)
    })
  }, [])

  // Track window dimensions
  useEffect(() => {
    const update = () => setDimensions({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  // Auto-orbit (gentle rotation) — stop on first interaction
  const orbitingRef = useRef(true)
  useEffect(() => {
    if (!fgRef.current) return
    const fg = fgRef.current

    // Start gentle orbit
    const interval = setInterval(() => {
      if (orbitingRef.current && fg.scene) {
        const { x, y, z } = fg.cameraPosition()
        const angle = 0.001
        fg.cameraPosition({
          x: x * Math.cos(angle) - z * Math.sin(angle),
          y,
          z: x * Math.sin(angle) + z * Math.cos(angle),
        })
      }
    }, 30)

    return () => clearInterval(interval)
  }, [ForceGraph3D])

  // Stop orbiting on interaction
  const handleInteraction = useCallback(() => {
    orbitingRef.current = false
  }, [])

  // Focus camera on a specific node
  useEffect(() => {
    if (!focusNodeId || !fgRef.current) return
    const node = graphData.nodes.find(n => n.id === focusNodeId)
    if (node && (node as any).x !== undefined) {
      const n = node as any
      fgRef.current.cameraPosition(
        { x: n.x, y: n.y, z: n.z + 80 },
        { x: n.x, y: n.y, z: n.z },
        1000
      )
    }
  }, [focusNodeId, graphData.nodes])

  // Zoom to grade-relevant available nodes on first load
  const hasZoomedRef = useRef(false)
  useEffect(() => {
    if (!fgRef.current || hasZoomedRef.current || !ForceGraph3D) return
    const timer = setTimeout(() => {
      if (fgRef.current && !hasZoomedRef.current) {
        hasZoomedRef.current = true
        // Prefer nodes matching student's grade, fall back to all available
        const available = graphData.nodes.filter(n => n.status === "available")
        const gradeMatches = initialGrade
          ? available.filter(n => n.grade === initialGrade)
          : []
        const targets = gradeMatches.length > 0 ? gradeMatches : available
        const withPos = targets.filter((n: any) => n.x !== undefined)
        if (withPos.length > 0) {
          const cx = withPos.reduce((s: number, n: any) => s + n.x, 0) / withPos.length
          const cy = withPos.reduce((s: number, n: any) => s + n.y, 0) / withPos.length
          const cz = withPos.reduce((s: number, n: any) => s + n.z, 0) / withPos.length
          fgRef.current.cameraPosition(
            { x: cx, y: cy, z: cz + 150 },
            { x: cx, y: cy, z: cz },
            2000
          )
        }
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [ForceGraph3D, graphData.nodes, initialGrade])

  // WASD / Arrow key camera controls
  useEffect(() => {
    if (!fgRef.current) return
    const speed = 3
    const keys = new Set<string>()

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "q", "e"].includes(key)) {
        e.preventDefault()
        keys.add(key)
        orbitingRef.current = false
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase())
    }

    let animFrame: number
    const moveCamera = () => {
      if (keys.size > 0 && fgRef.current) {
        const pos = fgRef.current.cameraPosition()
        let dx = 0, dy = 0, dz = 0
        if (keys.has("w") || keys.has("arrowup")) dz -= speed
        if (keys.has("s") || keys.has("arrowdown")) dz += speed
        if (keys.has("a") || keys.has("arrowleft")) dx -= speed
        if (keys.has("d") || keys.has("arrowright")) dx += speed
        if (keys.has("q")) dy += speed
        if (keys.has("e")) dy -= speed
        fgRef.current.cameraPosition({
          x: pos.x + dx,
          y: pos.y + dy,
          z: pos.z + dz,
        })
      }
      animFrame = requestAnimationFrame(moveCamera)
    }
    animFrame = requestAnimationFrame(moveCamera)

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      cancelAnimationFrame(animFrame)
    }
  }, [ForceGraph3D])

  const handleNodeClick = useCallback((node: GraphNode) => {
    orbitingRef.current = false
    onNodeClick?.(node.id, node.status)

    // Fly camera to clicked node
    if (fgRef.current) {
      const n = node as any
      if (n.x !== undefined) {
        fgRef.current.cameraPosition(
          { x: n.x, y: n.y, z: n.z + 60 },
          { x: n.x, y: n.y, z: n.z },
          800
        )
      }
    }
  }, [onNodeClick])

  if (!ForceGraph3D) {
    return (
      <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading galaxy...</div>
      </div>
    )
  }

  return (
    <div
      className="w-full h-full bg-zinc-950"
      onMouseDown={handleInteraction}
      onTouchStart={handleInteraction}
      onWheel={handleInteraction}
    >
      <ForceGraph3D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="#09090b"
        nodeColor={(node: GraphNode) => node.color}
        nodeVal={(node: GraphNode) => node.val}
        nodeLabel={(node: GraphNode) => {
          if (node.status === "locked") return `[locked] ${node.name}`
          return `${node.name}\n${node.id}`
        }}
        nodeOpacity={0.9}
        nodeResolution={8}
        nodeRelSize={2}
        linkColor={(link: any) => link.color}
        linkWidth={0.1}
        linkOpacity={0.6}
        linkDirectionalArrowLength={(link: any) => link.edgeType === "prerequisite" ? 2 : 0}
        linkDirectionalArrowRelPos={1}
        onNodeClick={handleNodeClick}
        enableNodeDrag={false}
        warmupTicks={100}
        cooldownTicks={200}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
    </div>
  )
}
