"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  // The color the galaxy view is currently showing for this planet.
  // We pass it through so the central orb matches what the learner saw.
  progressColor?: string
}

// Status colors for the glow/ring
function statusGlow(status: NodeStatus): string {
  switch (status) {
    case "locked": return "rgba(100,100,100,0.15)"
    case "available": return "rgba(96,165,250,0.5)"
    case "in_progress": return "rgba(251,191,36,0.6)"
    case "in_review": return "rgba(161,98,7,0.6)"   // mustard glow
    case "approved_unplayed": return "rgba(245,158,11,0.7)"
    case "unlocked": return "rgba(52,211,153,0.6)"
    case "mastered": return "rgba(251,191,36,0.7)"
  }
}

function statusBorder(status: NodeStatus): string {
  switch (status) {
    case "locked": return "border-zinc-700/40"
    case "available": return "border-blue-400/60"
    case "in_progress": return "border-amber-400/60"
    case "in_review": return "border-yellow-700/70"   // mustard border
    case "approved_unplayed": return "border-amber-500/70"
    case "unlocked": return "border-emerald-400/60"
    case "mastered": return "border-emerald-400/60"
  }
}

function statusLabel(status: NodeStatus): string {
  switch (status) {
    case "locked": return "Not Started"
    case "available": return "My grade level"
    case "in_progress": return "Progressing"
    case "in_review": return "Pending Review"
    case "approved_unplayed": return "Approved — play to demo"
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
  progressColor,
}: PlanetViewProps) {
  // Use the progress color the galaxy view is showing if provided,
  // otherwise fall back to the planet's domain base color so we never
  // render a black planet.
  const orbColor = progressColor && progressColor !== "#333333" && progressColor !== "#262626"
    ? progressColor
    : planet.color
  const [angles, setAngles] = useState<number[]>(() =>
    moons.map(m => m.orbitOffset)
  )
  const [hoveredMoon, setHoveredMoon] = useState<string | null>(null)
  const hoveredMoonRef = useRef<string | null>(null)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  // Community games
  const [communityGames, setCommunityGames] = useState<Omit<Game, "gameHtml">[]>([])
  const [playingGame, setPlayingGame] = useState<{ id: string; title: string; html: string; concept?: string; authorUid?: string; standardId?: string; isPublished?: boolean } | null>(null)

  useEffect(() => {
    fetch(`/api/games/planet/${planet.id}`)
      .then((res) => res.ok ? res.json() : [])
      .then((games) => setCommunityGames(games))
      .catch(() => {})
  }, [planet.id])

  // Map of standardId → published game count, used to mark moons that
  // have games available with a small icon and a tooltip count.
  const gamesByStandard = useMemo(() => {
    const map = new Map<string, number>()
    for (const g of communityGames) {
      if (g.status !== "published") continue
      map.set(g.standardId, (map.get(g.standardId) ?? 0) + 1)
    }
    return map
  }, [communityGames])

  const handlePlayGame = useCallback(async (gameId: string) => {
    try {
      const res = await fetch(`/api/game/${gameId}/html`)
      if (!res.ok) return
      const html = await res.text()
      const game = communityGames.find((g) => g.id === gameId)
      setPlayingGame({
        id: gameId,
        title: game?.title || "Game",
        html,
        concept: game?.designDoc?.concept,
        authorUid: game?.authorUid,
        standardId: game?.standardId,
        isPublished: game?.status === "published",
      })
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

  // Suppress unused-warning for bridges/onBridgeClick/planetNames (kept in API for compat)
  void bridges; void onBridgeClick; void planetNames;

  return (
    <div className="w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden">
      <style>{`
        @keyframes mastered-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Pulsing data beacon — used to mark moons that have published
           games available. Three rings cascade outward from a center
           dot like a radar ping. Transform-origin must be set on the
           SVG circles so they scale from their center, not the
           top-left of the viewBox. */
        @keyframes beacon-ring-pulse {
          0%   { transform: scale(0.4); opacity: 0.95; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        @keyframes beacon-dot-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.55; }
        }
        .beacon-ring {
          transform-origin: 14px 14px;
          animation: beacon-ring-pulse 1.8s ease-out infinite;
        }
        .beacon-ring-2 { animation-delay: 0.6s; }
        .beacon-ring-3 { animation-delay: 1.2s; }
        .beacon-dot {
          animation: beacon-dot-pulse 1.8s ease-in-out infinite;
          filter: drop-shadow(0 0 3px rgba(34, 211, 238, 0.85));
        }
      `}</style>
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

        {/* Central planet orb — uses the same color the galaxy view shows */}
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            left: center - 45,
            top: center - 45,
            width: 90,
            height: 90,
            background: `radial-gradient(circle at 35% 35%, ${orbColor}, ${orbColor}88, ${orbColor}22)`,
            boxShadow: `0 0 40px ${orbColor}44, 0 0 80px ${orbColor}22`,
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
          const gameCount = gamesByStandard.get(moon.id) ?? 0

          return (
            <div key={moon.id}>
              {/* Mastered moons get a slowly spinning gold ring around their green dot.
                  The ring is a dashed circle so the rotation is visible. */}
              {moon.status === "mastered" && (
                <svg
                  className="absolute pointer-events-none"
                  width={hitSize + 16}
                  height={hitSize + 16}
                  style={{
                    left: x - hitSize / 2 - 8,
                    top: y - hitSize / 2 - 8,
                    transform: isHovered ? "scale(1.3)" : "scale(1)",
                    transition: "transform 150ms",
                    filter: "drop-shadow(0 0 6px rgba(251,191,36,0.7))",
                  }}
                >
                  <circle
                    cx={(hitSize + 16) / 2}
                    cy={(hitSize + 16) / 2}
                    r={hitSize / 2 + 4}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    style={{
                      transformOrigin: "center",
                      animation: "mastered-ring-spin 8s linear infinite",
                    }}
                  />
                </svg>
              )}
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

              {/* "Has games" indicator — pulsing data beacon next to
                  the moon. SVG so the edges stay crisp at any zoom.
                  Three concentric rings expand outward from a solid
                  center dot, fading as they grow. Reads as a sci-fi
                  "transmission detected" marker. Cyan against the
                  dark space background for max contrast.

                  We use transform: scale() instead of animating the
                  SVG `r` attribute because `r` animation isn't
                  supported in all browsers, but `transform` is. The
                  rings start tiny and scale up to ~4x while fading. */}
              {gameCount > 0 && (
                <div
                  className="absolute z-10 pointer-events-none beacon-indicator"
                  style={{
                    left: x + hitSize / 2 + 2,
                    top: y - hitSize / 2 - 14,
                    width: 28,
                    height: 28,
                  }}
                  title={`${gameCount} game${gameCount === 1 ? "" : "s"} available`}
                >
                  <svg viewBox="0 0 28 28" width="28" height="28" style={{ overflow: "visible" }}>
                    <circle className="beacon-ring beacon-ring-1" cx="14" cy="14" r="3" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
                    <circle className="beacon-ring beacon-ring-2" cx="14" cy="14" r="3" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
                    <circle className="beacon-ring beacon-ring-3" cx="14" cy="14" r="3" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
                    <circle className="beacon-dot" cx="14" cy="14" r="2.5" fill="#22d3ee" />
                  </svg>
                </div>
              )}

              {/* Tooltip on hover */}
              {isHovered && (
                <div
                  className="absolute z-20 pointer-events-none"
                  style={{
                    left: x - 130,
                    top: y - moonSize / 2 - 64,
                    width: 260,
                  }}
                >
                  <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-lg px-3 py-2 text-center">
                    <div className="text-sm text-white font-medium leading-snug whitespace-normal">
                      {moon.shortTitle}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">{statusLabel(moon.status)}</div>
                    {gameCount > 0 && (
                      <div className="text-xs text-blue-400 mt-1">
                        🎮 {gameCount} game{gameCount === 1 ? "" : "s"} available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Bridge navigation bubbles removed */}
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
          authorUid={playingGame.authorUid}
          isPublished={playingGame.isPublished}
          standardId={playingGame.standardId}
          onClose={() => setPlayingGame(null)}
          onUnapproved={() => setPlayingGame(null)}
        />
      )}
    </div>
  )
}
