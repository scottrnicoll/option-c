"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Planet, Bridge, MoonData } from "@/lib/galaxy-utils"
import type { NodeStatus } from "@/lib/graph-types"
import type { Game } from "@/lib/game-types"
import { GameCard } from "@/components/game/game-card"
import { GamePlayer } from "@/components/game/game-player"

interface PlanetViewProps {
  planet: Planet
  moons: MoonData[]
  isMastered?: boolean
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
    case "mastered": return "rgba(251,191,36,0.7)"
  }
}

function statusBorder(status: NodeStatus): string {
  switch (status) {
    case "locked": return "border-zinc-700/40"
    case "available": return "border-blue-400/60"
    case "in_progress": return "border-amber-400/60"
    case "unlocked": return "border-emerald-400/60"
    case "mastered": return "border-amber-400/60"
  }
}

function statusLabel(status: NodeStatus): string {
  switch (status) {
    case "locked": return "Not Started"
    case "available": return "Ready to Explore"
    case "in_progress": return "Progressing"
    case "unlocked": return "Demonstrated"
    case "mastered": return "Mastered"
  }
}

export function PlanetView({
  planet,
  moons,
  isMastered = false,
  onMoonClick,
  onBridgeClick,
  bridges,
  planetNames,
}: PlanetViewProps) {
  const [angles, setAngles] = useState<number[]>(() =>
    moons.map(m => m.orbitOffset)
  )
  const [hoveredMoon, setHoveredMoon] = useState<string | null>(null)
  const hoveredMoonRef = useRef<string | null>(null)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  // Community games
  const [communityGames, setCommunityGames] = useState<Omit<Game, "gameHtml">[]>([])
  const [playingGame, setPlayingGame] = useState<{ id: string; title: string; html: string; concept?: string } | null>(null)

  useEffect(() => {
    fetch(`/api/games/planet/${planet.id}`)
      .then((res) => res.ok ? res.json() : [])
      .then((games) => setCommunityGames(games))
      .catch(() => {})
  }, [planet.id])

  const handlePlayGame = useCallback(async (gameId: string) => {
    try {
      const res = await fetch(`/api/game/${gameId}/html`)
      if (!res.ok) return
      const html = await res.text()
      const game = communityGames.find((g) => g.id === gameId)
      setPlayingGame({ id: gameId, title: game?.title || "Game", html, concept: game?.designDoc?.concept })
    } catch {
      // Silent fail
    }
  }, [communityGames])

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
        prev.map((a, i) => {
          // Pause orbit when this moon is hovered
          if (moons[i] && hoveredMoonRef.current === moons[i].id) return a
          return a + speeds[i] * dt * 0.05
        })
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
            {isMastered && (
              <div className="text-base mb-0.5" title="Planet Mastered!">🚩</div>
            )}
            <div className="text-white font-bold text-sm leading-tight">{planet.domainName}</div>
            <div className="text-white/70 text-xs">Grade {planet.grade}</div>
          </div>
        </div>

        {/* Orbiting moons */}
        {moons.map((moon, i) => {
          const angle = angles[i] ?? moon.orbitOffset
          const radius = moon.orbitRadius * (viewSize / 120)
          const x = center + Math.cos(angle) * radius
          const y = center + Math.sin(angle) * radius
          const moonSize = moon.size * 5
          const hitSize = Math.max(moonSize, 24) // minimum 24px hit target
          const isHovered = hoveredMoon === moon.id

          return (
            <div key={moon.id}>
              {/* Moon dot */}
              <button
                className={`absolute rounded-full border-2 transition-transform duration-150 ${statusBorder(moon.status)} ${
                  moon.status !== "locked" ? "cursor-pointer hover:scale-125" : "cursor-default"
                }`}
                style={{
                  left: x - hitSize / 2,
                  top: y - hitSize / 2,
                  width: hitSize,
                  height: hitSize,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: moon.color,
                  boxShadow: moon.status !== "locked"
                    ? `0 0 ${moonSize}px ${statusGlow(moon.status)}`
                    : "none",
                  transform: isHovered ? "scale(1.3)" : "scale(1)",
                }}
                onClick={() => onMoonClick(moon.id, moon.status)}
                onMouseEnter={() => { setHoveredMoon(moon.id); hoveredMoonRef.current = moon.id }}
                onMouseLeave={() => { setHoveredMoon(null); hoveredMoonRef.current = null }}
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
                      {moon.shortTitle}
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
                <div className="text-xs text-zinc-300 group-hover:text-blue-300 truncate">
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

      {/* Community Games section */}
      {communityGames.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-lg px-4">
          <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-xl p-3">
            <h3 className="text-xs font-medium text-zinc-400 mb-2">
              Community Games ({communityGames.length})
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {communityGames.slice(0, 4).map((game) => (
                <button
                  key={game.id}
                  onClick={() => handlePlayGame(game.id)}
                  className="flex-shrink-0 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-left hover:border-emerald-500/50 transition-colors min-w-[120px]"
                >
                  <div className="text-xs font-medium text-white truncate">
                    {game.title}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {game.playCount} plays
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game player modal */}
      {playingGame && (
        <GamePlayer
          gameId={playingGame.id}
          title={playingGame.title}
          html={playingGame.html}
          concept={playingGame.concept}
          onClose={() => setPlayingGame(null)}
        />
      )}
    </div>
  )
}
