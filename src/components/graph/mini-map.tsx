"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import type { GalaxyData, GalaxyNode } from "@/lib/galaxy-utils"
import { InfoButton } from "@/components/info-button"

interface MiniMapProps {
  galaxyData: GalaxyData
  currentPlanetId: string | null
  onPlanetClick: (planetId: string) => void
  totalStandards: number
  unlockedCount: number
  masteredCount: number
  scopeLabel?: string
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
  scopeLabel,
}: MiniMapProps) {
  const [expanded, setExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Expanded mini-map dimensions — large enough to actually read
  const width = 480
  const height = 340

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

  // Compute positions for each planet — grouped into 4 grade-band columns,
  // stacked vertically within each column. Leave room at the top for column
  // labels.
  const TOP_LABEL = 32
  const BOTTOM_PAD = 10
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
    const usableHeight = height - TOP_LABEL - BOTTOM_PAD

    for (const [band, nodes] of Object.entries(bandGroups)) {
      const cx = BAND_X[band] * width
      const step = nodes.length > 1 ? usableHeight / (nodes.length - 1) : 0
      nodes.forEach((node, i) => {
        const y = nodes.length === 1
          ? TOP_LABEL + usableHeight / 2
          : TOP_LABEL + step * i
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
        className="transition-all duration-300 ease-in-out overflow-hidden bg-zinc-900/95 backdrop-blur-sm border-2 border-zinc-300 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        style={{
          width: expanded ? width : 64,
          height: expanded ? height + 100 : 64,
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
          <svg width={64} height={64} viewBox="0 0 64 64" className="block">
            {/* Label so it's obvious this is a map */}
            <text
              x={32}
              y={12}
              fontSize={9}
              fontWeight={700}
              fill="#e4e4e7"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              MAP
            </text>
            {sampleNodes.map((node, i) => {
              // 3-col grid of sample dots underneath the label
              const col = i % 3
              const row = Math.floor(i / 3)
              const cx = 18 + col * 14
              const cy = 26 + row * 14
              return (
                <circle
                  key={node.id}
                  cx={cx}
                  cy={cy}
                  r={3.5}
                  fill={node.color}
                  opacity={1}
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
          {/* Legend header */}
          <div className="px-3 pt-3 pb-2">
            <p className="text-base text-white font-semibold">Map of all planets</p>
            <p className="text-xs text-zinc-300 leading-snug mt-0.5">
              Each dot is a planet (one math topic at one grade). Columns are grouped by grade level.
            </p>
          </div>

          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="block"
          >
            <rect width={width} height={height} fill="transparent" />

            {/* Column header labels */}
            {Object.entries(BAND_X).map(([band, bx]) => (
              <text
                key={band}
                x={bx * width}
                y={20}
                fontSize={13}
                fontWeight={700}
                fill="#e4e4e7"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {band === "HS" ? "High School" : `Grade ${band}`}
              </text>
            ))}

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
              const r = Math.max(Math.sqrt(node.val) * 1.6, 4)
              return (
                <g key={node.id}>
                  {isCurrent && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={r + 4}
                      fill="none"
                      stroke="white"
                      strokeWidth={1.5}
                      opacity={0.9}
                    />
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r}
                    fill={node.color}
                    opacity={0.95}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPlanetClick(node.id)
                    }}
                  >
                    <title>{node.name} · Grade {node.grade}</title>
                  </circle>
                </g>
              )
            })}
          </svg>

          {/* Stats — high-contrast, larger so they're actually readable */}
          <div className="px-3 pb-3 pt-1 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">Progress</p>
              <InfoButton title="Mini-map" className="scale-90">
                <p>The <span className="text-zinc-200">Mini-map</span> shows all planets at a glance.</p>
                <p>Click any dot to fly to that planet. Colors match the galaxy legend.</p>
                <p>Stats show how many skills you&apos;ve explored and mastered.</p>
              </InfoButton>
            </div>
          </div>
          <div className="px-3 pb-3 flex flex-col gap-1">
            {scopeLabel && (
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">
                Counting {scopeLabel}
              </p>
            )}
            <div className="text-sm text-zinc-200">
              <span className="text-blue-400 font-bold">{unlockedCount}</span>
              <span className="text-zinc-400">/{totalStandards}</span>{" "}
              <span className="text-zinc-200">skills ready to explore</span>
            </div>
            <div className="text-sm text-zinc-200">
              <span className="text-emerald-400 font-bold">{masteredCount}</span>
              <span className="text-zinc-400">/{totalStandards}</span>{" "}
              <span className="text-zinc-200">skills mastered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
