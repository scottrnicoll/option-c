"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import type { GalaxyData, GalaxyNode } from "@/lib/galaxy-utils"

interface MiniMapProps {
  galaxyData: GalaxyData
  currentPlanetId: string | null
  onPlanetClick: (planetId: string) => void
  totalStandards: number
  unlockedCount: number
  masteredCount: number
}

// Layout planets by grade band columns
const BAND_X: Record<string, number> = {
  "K-2": 0.15,
  "3-5": 0.38,
  "6-8": 0.62,
  "HS": 0.85,
}

export function MiniMap({
  galaxyData,
  currentPlanetId,
  onPlanetClick,
  totalStandards,
  unlockedCount,
  masteredCount,
}: MiniMapProps) {
  const [expanded, setExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const width = 200
  const height = 140

  // Close on click outside (mobile)
  useEffect(() => {
    if (!expanded) return

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [expanded])

  // Compute positions for each planet
  const positions = useMemo(() => {
    const bandGroups: Record<string, GalaxyNode[]> = {
      "K-2": [],
      "3-5": [],
      "6-8": [],
      "HS": [],
    }

    for (const node of galaxyData.nodes) {
      const band = node.gradeBand as keyof typeof bandGroups
      if (bandGroups[band]) {
        bandGroups[band].push(node)
      }
    }

    const posMap = new Map<string, { x: number; y: number }>()
    const padding = 12

    for (const [band, nodes] of Object.entries(bandGroups)) {
      const cx = BAND_X[band] * width
      const totalHeight = height - padding * 2
      const step = nodes.length > 1 ? totalHeight / (nodes.length - 1) : 0

      nodes.forEach((node, i) => {
        const y = nodes.length === 1
          ? height / 2
          : padding + step * i
        posMap.set(node.id, { x: cx, y })
      })
    }

    return posMap
  }, [galaxyData.nodes, width, height])

  // Pick up to 8 sample nodes for the collapsed thumbnail
  const sampleNodes = useMemo(() => {
    const nodes = galaxyData.nodes
    if (nodes.length <= 8) return nodes
    const step = Math.floor(nodes.length / 8)
    const sampled: GalaxyNode[] = []
    for (let i = 0; i < nodes.length && sampled.length < 8; i += step) {
      sampled.push(nodes[i])
    }
    return sampled
  }, [galaxyData.nodes])

  return (
    <div className="absolute bottom-4 left-4 z-20" ref={containerRef}>
      <div
        className="transition-all duration-300 ease-in-out overflow-hidden bg-zinc-900/85 backdrop-blur-sm border border-zinc-800 rounded-lg"
        style={{
          width: expanded ? width : 40,
          height: expanded ? height + 44 : 40,
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onClick={() => setExpanded((prev) => !prev)}
      >
        {/* Collapsed: tiny dot preview */}
        <div
          className="transition-opacity duration-300"
          style={{
            opacity: expanded ? 0 : 1,
            pointerEvents: expanded ? "none" : "auto",
            position: expanded ? "absolute" : "relative",
          }}
        >
          <svg width={40} height={40} viewBox="0 0 40 40" className="block">
            {sampleNodes.map((node, i) => {
              // Spread sample dots in a small grid pattern
              const col = i % 3
              const row = Math.floor(i / 3)
              const cx = 10 + col * 10
              const cy = 10 + row * 10
              return (
                <circle
                  key={node.id}
                  cx={cx}
                  cy={cy}
                  r={2}
                  fill={node.color}
                  opacity={0.85}
                />
              )
            })}
          </svg>
        </div>

        {/* Expanded: full mini-map */}
        <div
          className="transition-opacity duration-300"
          style={{
            opacity: expanded ? 1 : 0,
            pointerEvents: expanded ? "auto" : "none",
          }}
        >
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="block"
          >
            <rect width={width} height={height} fill="transparent" />

            {/* Bridges as lines */}
            {galaxyData.links.map((link, i) => {
              const sourceId = typeof link.source === "string" ? link.source : (link.source as any).id
              const targetId = typeof link.target === "string" ? link.target : (link.target as any).id
              const sp = positions.get(sourceId)
              const tp = positions.get(targetId)
              if (!sp || !tp) return null
              return (
                <line
                  key={i}
                  x1={sp.x}
                  y1={sp.y}
                  x2={tp.x}
                  y2={tp.y}
                  stroke={link.isLit ? "rgba(96,165,250,0.25)" : "rgba(255,255,255,0.04)"}
                  strokeWidth={link.isLit ? 0.8 : 0.3}
                />
              )
            })}

            {/* Planet dots */}
            {galaxyData.nodes.map(node => {
              const pos = positions.get(node.id)
              if (!pos) return null
              const isCurrent = node.id === currentPlanetId
              const r = Math.max(Math.sqrt(node.val) * 0.8, 1.5)
              return (
                <g key={node.id}>
                  {isCurrent && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={r + 3}
                      fill="none"
                      stroke="white"
                      strokeWidth={1}
                      opacity={0.8}
                    />
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r}
                    fill={node.color}
                    opacity={0.9}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPlanetClick(node.id)
                    }}
                  />
                </g>
              )
            })}
          </svg>

          {/* Stats (no progress bar) */}
          <div className="px-2 pb-2 pt-1 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span><span className="text-blue-400 font-medium">{unlockedCount}</span>/{totalStandards} skills available</span>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span><span className="text-emerald-400 font-medium">{masteredCount}</span>/{totalStandards} skills mastered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
