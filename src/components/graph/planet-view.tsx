"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Planet, Bridge, MoonData } from "@/lib/galaxy-utils"
import type { NodeStatus } from "@/lib/graph-types"

interface PlanetViewProps {
  planet: Planet
  moons: MoonData[]
  onMoonClick: (standardId: string, status: NodeStatus) => void
  onBridgeClick: (targetPlanetId: string) => void
  bridges: Bridge[]
  planetNames: Map<string, string>
}

// Status colors for the glow/ring
function statusGlow(status: NodeStatus): string {
  switch (status) {
    case "locked": return "rgba(100,100,100,0.15)"
    case "available": return "rgba(96,165,250,0.5)"
    case "in_progress": return "rgba(251,191,36,0.6)"
    case "unlocked": return "rgba(52,211,153,0.5)"
  }
}

function statusBorder(status: NodeStatus): string {
  switch (status) {
    case "locked": return "border-zinc-700/40"
    case "available": return "border-blue-400/60"
    case "in_progress": return "border-amber-400/60"
    case "unlocked": return "border-emerald-400/60"
  }
}

function statusLabel(status: NodeStatus): string {
  switch (status) {
    case "locked": return "Locked"
    case "available": return "Ready to learn"
    case "in_progress": return "In progress"
    case "unlocked": return "Mastered"
  }
}

export function PlanetView({
  planet,
  moons,
  onMoonClick,
  onBridgeClick,
  bridges,
  planetNames,
}: PlanetViewProps) {
  const [angles, setAngles] = useState<number[]>(() =>
    moons.map(m => m.orbitOffset)
  )
  const [hoveredMoon, setHoveredMoon] = useState<string | null>(null)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  // Animate orbiting moons
  useEffect(() => {
    const offsets = moons.map(m => m.orbitOffset)
    const speeds = moons.map(m => m.orbitSpeed)
    setAngles(offsets)

    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time
      const dt = (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time

      setAngles(prev =>
        prev.map((a, i) => a + speeds[i] * dt * 0.5)
      )
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(animRef.current)
      lastTimeRef.current = 0
    }
  }, [moons])

  // Compute orbit rings for visual guides
  const orbitRings = [25, 37, 49]

  // Container size
  const viewSize = 600
  const center = viewSize / 2

  // Bridge indicator positions around the edge
  const bridgeAngleStep = bridges.length > 0 ? (2 * Math.PI) / bridges.length : 0
  const bridgeRadius = (viewSize / 2) - 30

  return (
    <div className="w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden">
      <div
        className="relative"
        style={{ width: viewSize, height: viewSize }}
      >
        {/* Orbit ring guides */}
        <svg
          className="absolute inset-0 pointer-events-none"
          viewBox={`0 0 ${viewSize} ${viewSize}`}
          width={viewSize}
          height={viewSize}
        >
          {orbitRings.map((r, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={r * (viewSize / 120)}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={1}
            />
          ))}
        </svg>

        {/* Central planet orb */}
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            left: center - 45,
            top: center - 45,
            width: 90,
            height: 90,
            background: `radial-gradient(circle at 35% 35%, ${planet.color}, ${planet.color}88, ${planet.color}22)`,
            boxShadow: `0 0 40px ${planet.color}44, 0 0 80px ${planet.color}22`,
          }}
        >
          <div className="text-center">
            <div className="text-white font-bold text-sm leading-tight">{planet.domainName}</div>
            <div className="text-white/50 text-xs">Grade {planet.grade}</div>
          </div>
        </div>

        {/* Orbiting moons */}
        {moons.map((moon, i) => {
          const angle = angles[i] ?? moon.orbitOffset
          const radius = moon.orbitRadius * (viewSize / 120)
          const x = center + Math.cos(angle) * radius
          const y = center + Math.sin(angle) * radius
          const moonSize = moon.size * 5
          const isHovered = hoveredMoon === moon.id

          return (
            <div key={moon.id}>
              {/* Moon dot */}
              <button
                className={`absolute rounded-full border-2 transition-transform duration-150 ${statusBorder(moon.status)} ${
                  moon.status !== "locked" ? "cursor-pointer hover:scale-125" : "cursor-default"
                }`}
                style={{
                  left: x - moonSize / 2,
                  top: y - moonSize / 2,
                  width: moonSize,
                  height: moonSize,
                  backgroundColor: moon.color,
                  boxShadow: moon.status !== "locked"
                    ? `0 0 ${moonSize}px ${statusGlow(moon.status)}`
                    : "none",
                  transform: isHovered ? "scale(1.3)" : "scale(1)",
                }}
                onClick={() => onMoonClick(moon.id, moon.status)}
                onMouseEnter={() => setHoveredMoon(moon.id)}
                onMouseLeave={() => setHoveredMoon(null)}
                aria-label={`${moon.description} - ${statusLabel(moon.status)}`}
              />

              {/* Tooltip on hover */}
              {isHovered && (
                <div
                  className="absolute z-20 pointer-events-none"
                  style={{
                    left: x - 100,
                    top: y - moonSize / 2 - 50,
                    width: 200,
                  }}
                >
                  <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-lg px-3 py-2 text-center">
                    <div className="text-xs text-white font-medium leading-tight">
                      {moon.description.length > 80
                        ? moon.description.slice(0, 80) + "..."
                        : moon.description}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">{statusLabel(moon.status)}</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Bridge indicators around the edge */}
        {bridges.map((bridge, i) => {
          const angle = bridgeAngleStep * i - Math.PI / 2
          const bx = center + Math.cos(angle) * bridgeRadius
          const by = center + Math.sin(angle) * bridgeRadius
          const targetName = planetNames.get(bridge.targetPlanetId) ?? bridge.targetPlanetId

          return (
            <button
              key={bridge.targetPlanetId}
              className="absolute flex items-center gap-1 cursor-pointer group"
              style={{
                left: bx - 40,
                top: by - 12,
                width: 80,
              }}
              onClick={() => onBridgeClick(bridge.targetPlanetId)}
              aria-label={`Bridge to ${targetName}`}
            >
              <div className="bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/50 rounded-full px-2 py-1 text-center w-full group-hover:border-blue-500/50 group-hover:bg-zinc-700/80 transition-colors">
                <div className="text-[10px] text-zinc-400 group-hover:text-blue-300 truncate">
                  {targetName}
                </div>
                <svg
                  className="w-3 h-3 mx-auto text-zinc-600 group-hover:text-blue-400"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2 6h8M7 3l3 3-3 3"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
