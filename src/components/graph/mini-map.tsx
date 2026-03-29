"use client"

import { useMemo } from "react"
import type { GalaxyData, GalaxyNode } from "@/lib/galaxy-utils"

interface MiniMapProps {
  galaxyData: GalaxyData
  currentPlanetId: string | null
  onPlanetClick: (planetId: string) => void
  totalStandards: number
  unlockedCount: number
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
}: MiniMapProps) {
  const width = 200
  const height = 140

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

  const progressPct = totalStandards > 0
    ? Math.round((unlockedCount / totalStandards) * 100)
    : 0

  return (
    <div className="absolute bottom-4 left-4 z-20">
      <div className="bg-zinc-900/85 backdrop-blur-sm border border-zinc-800 rounded-lg overflow-hidden">
        {/* SVG mini-map */}
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block"
        >
          {/* Background */}
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
                {/* Current planet ring */}
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
                  onClick={() => onPlanetClick(node.id)}
                />
              </g>
            )
          })}
        </svg>

        {/* Progress bar */}
        <div className="px-2 pb-2 pt-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
            <span>{unlockedCount}/{totalStandards} unlocked</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(progressPct, 1)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
