"use client"

import { useState, useCallback, useMemo } from "react"
import type { StandardsGraph, StandardNode, NodeStatus } from "@/lib/graph-types"
import { buildPlanets, buildBridges, buildGalaxyData, buildMoonData } from "@/lib/galaxy-utils"
import type { Planet, Bridge, ColorMode } from "@/lib/galaxy-utils"
import { GalaxyView } from "./galaxy-view"
import { PlanetView } from "./planet-view"
import { MiniMap } from "./mini-map"
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import type { OnboardingData } from "@/components/onboarding/onboarding-flow"
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
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [studentData, setStudentData] = useState<OnboardingData | null>(null)
  const [tutorialStep, setTutorialStep] = useState(0)

  // Galaxy navigation state
  const [viewMode, setViewMode] = useState<"galaxy" | "planet">("galaxy")
  const [currentPlanetId, setCurrentPlanetId] = useState<string | null>(null)
  const [colorMode, setColorMode] = useState<ColorMode>("domain")

  // Build planet/bridge data
  const planets = useMemo(() => buildPlanets(data), [data])
  const bridges = useMemo(() => buildBridges(data, planets), [data, planets])

  // Build galaxy-level graph data
  const galaxyData = useMemo(
    () => buildGalaxyData(planets, bridges, progressMap, colorMode),
    [planets, bridges, progressMap, colorMode]
  )

  // Planet name lookup
  const planetNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of planets) {
      map.set(p.id, p.domainName)
    }
    return map
  }, [planets])

  // Current planet object and its data
  const currentPlanet = useMemo(
    () => planets.find(p => p.id === currentPlanetId) ?? null,
    [planets, currentPlanetId]
  )

  const currentMoons = useMemo(
    () => currentPlanet ? buildMoonData(currentPlanet, progressMap) : [],
    [currentPlanet, progressMap]
  )

  const currentBridges = useMemo(
    () => currentPlanetId
      ? bridges.filter(b => b.sourcePlanetId === currentPlanetId)
      : [],
    [bridges, currentPlanetId]
  )

  // Counts for progress — filtered to student's grade
  const counts = useMemo(() => {
    const grade = studentData?.grade
    let total = 0, available = 0, unlocked = 0
    for (const node of data.nodes) {
      // If student picked a grade, only count that grade's standards
      if (grade && node.grade !== grade) continue
      total++
      const status = progressMap.get(node.id)
      if (status === "available") available++
      if (status === "unlocked") unlocked++
    }
    // Fall back to all if no grade selected or no standards match
    if (total === 0) {
      total = data.nodes.length
      progressMap.forEach(status => {
        if (status === "available") available++
        if (status === "unlocked") unlocked++
      })
    }
    return { total, available, unlocked }
  }, [progressMap, data.nodes, studentData?.grade])

  // Galaxy view: click planet -> enter planet view
  const handlePlanetClick = useCallback((planetId: string) => {
    setCurrentPlanetId(planetId)
    setViewMode("planet")
    if (tutorialStep === 0) setTutorialStep(1)
  }, [tutorialStep])

  // Planet view: click moon -> open standard panel
  const handleMoonClick = useCallback((standardId: string, status: NodeStatus) => {
    const node = data.nodes.find(n => n.id === standardId)
    if (!node) return
    setSelectedStandard(node)
    setPanelOpen(true)
    if (tutorialStep === 1) setTutorialStep(2)
  }, [data.nodes, tutorialStep])

  // Planet view: click bridge -> fly to that planet
  const handleBridgeClick = useCallback((targetPlanetId: string) => {
    setCurrentPlanetId(targetPlanetId)
  }, [])

  // Mini-map: click planet
  const handleMiniMapClick = useCallback((planetId: string) => {
    if (viewMode === "galaxy") {
      setCurrentPlanetId(planetId)
    } else {
      setCurrentPlanetId(planetId)
    }
  }, [viewMode])

  // Back to galaxy button
  const handleBackToGalaxy = useCallback(() => {
    setViewMode("galaxy")
    setCurrentPlanetId(null)
  }, [])

  // Standard panel: unlock
  const handleUnlock = useCallback((standardId: string) => {
    setPanelOpen(false)

    const newlyAvailable = computeNewlyAvailable(data, progressMap, standardId)

    setProgressMap(prev => {
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

    if (tutorialStep < 3) setTutorialStep(3)
  }, [data, progressMap, tutorialStep])

  if (!onboardingComplete) {
    return (
      <OnboardingFlow
        onComplete={(completedData) => {
          setStudentData(completedData)
          setOnboardingComplete(true)
        }}
      />
    )
  }

  return (
    <div className="h-screen w-screen relative">
      {/* Main view */}
      {viewMode === "galaxy" ? (
        <GalaxyView
          galaxyData={galaxyData}
          onPlanetClick={handlePlanetClick}
          currentPlanetId={currentPlanetId}
          initialGrade={studentData?.grade ?? null}
        />
      ) : currentPlanet ? (
        <PlanetView
          planet={currentPlanet}
          moons={currentMoons}
          onMoonClick={handleMoonClick}
          onBridgeClick={handleBridgeClick}
          bridges={currentBridges}
          planetNames={planetNames}
        />
      ) : null}

      {/* Back to Galaxy button (planet view only) */}
      {viewMode === "planet" && (
        <button
          onClick={handleBackToGalaxy}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Galaxy
        </button>
      )}

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
        {/* Progress */}
        <div className="bg-zinc-900/80 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="text-emerald-400 font-mono font-bold text-base">{counts.unlocked}</span>
              <span className="text-zinc-500 ml-1.5 text-xs">
                {counts.unlocked === 1 ? "skill" : "skills"} explored
              </span>
            </div>
            <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.max((counts.unlocked / counts.total) * 100, 2)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Color mode toggle */}
        {viewMode === "galaxy" && (
          <div className="bg-zinc-900/80 backdrop-blur-sm rounded-lg border border-zinc-800 flex overflow-hidden">
            <button
              onClick={() => setColorMode("domain")}
              className={`px-3 py-1.5 text-xs transition-colors ${
                colorMode === "domain"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              By concept
            </button>
            <button
              onClick={() => setColorMode("mastery")}
              className={`px-3 py-1.5 text-xs transition-colors ${
                colorMode === "mastery"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              By progress
            </button>
          </div>
        )}

        {/* Mastery legend */}
        {viewMode === "galaxy" && colorMode === "mastery" && (
          <div className="bg-zinc-900/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-zinc-800 flex gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-zinc-400">Mastered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-[10px] text-zinc-400">Working</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] text-zinc-400">Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-zinc-500" />
              <span className="text-[10px] text-zinc-400">Locked</span>
            </div>
          </div>
        )}
      </div>

      {/* Tutorial hint */}
      {tutorialStep === 0 && viewMode === "galaxy" && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl px-5 py-3 text-sm text-blue-200 animate-bounce-slow max-w-xs text-center">
            Click a planet to explore its standards
          </div>
        </div>
      )}
      {tutorialStep === 1 && viewMode === "planet" && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl px-5 py-3 text-sm text-blue-200 animate-bounce-slow max-w-xs text-center">
            Click a glowing moon to start learning
          </div>
        </div>
      )}

      {/* Mini-map (always visible) */}
      <MiniMap
        galaxyData={galaxyData}
        currentPlanetId={currentPlanetId}
        onPlanetClick={handleMiniMapClick}
        totalStandards={counts.total}
        unlockedCount={counts.unlocked}
      />

      {/* Standard panel */}
      <StandardPanel
        standard={selectedStandard}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onUnlock={handleUnlock}
        interests={studentData?.interests}
        nodeStatus={selectedStandard ? progressMap.get(selectedStandard.id) : undefined}
      />
    </div>
  )
}
