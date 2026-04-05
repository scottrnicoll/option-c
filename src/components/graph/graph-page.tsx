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
import { BuildScreen } from "@/components/game/build-screen"
import { Workshop } from "@/components/game/workshop"
import { MasteryAnimation } from "./mastery-animation"
import type { GameDesignDoc } from "@/lib/game-types"
import { getTokens, addTokens } from "@/lib/tokens"

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
  const [colorMode, setColorMode] = useState<ColorMode>("mastery")
  const [showWaveEffect, setShowWaveEffect] = useState(false)
  const [waveColor, setWaveColor] = useState("#22c55e")
  const [lockedMessage, setLockedMessage] = useState<string | null>(null)

  // Tokens
  const [tokens, setTokens] = useState(0)
  // Sync from localStorage on mount (client only)
  useState(() => { if (typeof window !== "undefined") setTokens(getTokens()) })

  // Mastery animation
  const [masteryEvent, setMasteryEvent] = useState<{ planetName: string; planetColor: string; tokenGain: number } | null>(null)

  // Token notification (for game publish)
  const [tokenNotify, setTokenNotify] = useState<string | null>(null)

  // Game builder state
  const [buildMode, setBuildMode] = useState<"idle" | "building" | "workshop">("idle")
  const [currentDesignDoc, setCurrentDesignDoc] = useState<GameDesignDoc | null>(null)
  const [currentGameHtml, setCurrentGameHtml] = useState<string>("")
  const [currentGameId, setCurrentGameId] = useState<string | null>(null)
  const [reviewResult, setReviewResult] = useState<{ pass: boolean; feedback: string } | null>(null)

  // Build planet/bridge data
  const planets = useMemo(() => buildPlanets(data), [data])
  const bridges = useMemo(() => buildBridges(data, planets), [data, planets])

  // Build galaxy-level graph data
  const galaxyData = useMemo(
    () => buildGalaxyData(planets, bridges, progressMap, colorMode, studentData?.grade ?? null),
    [planets, bridges, progressMap, colorMode, studentData?.grade]
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
    return { total, available, unlocked, mastered: unlocked }
  }, [progressMap, data.nodes, studentData?.grade])

  // Recommended next planet — available planet on student's grade with most ready moons
  const recommendedPlanetId = useMemo(() => {
    const grade = studentData?.grade
    const candidates = galaxyData.nodes.filter(n =>
      n.access !== "locked" &&
      !n.isCompleted &&
      n.availableCount > 0 &&
      (!grade || n.grade === grade)
    )
    if (candidates.length === 0) return null
    // Prefer the one with the most available (ready) moons
    candidates.sort((a, b) => b.availableCount - a.availableCount)
    return candidates[0].id
  }, [galaxyData.nodes, studentData?.grade])

  // Galaxy view: click planet -> enter planet view
  const handlePlanetClick = useCallback((planetId: string) => {
    setCurrentPlanetId(planetId)
    setViewMode("planet")
    if (tutorialStep === 0) setTutorialStep(1)
  }, [tutorialStep])

  // Galaxy view: click locked planet -> show message
  const handleLockedPlanetClick = useCallback((planetId: string) => {
    const planet = planets.find(p => p.id === planetId)
    if (!planet) return
    // Find which bridge planets lead to this one
    const prereqPlanets = bridges
      .filter(b => b.targetPlanetId === planetId)
      .map(b => planets.find(p => p.id === b.sourcePlanetId))
      .filter(Boolean)
      .slice(0, 3)
    const prereqNames = prereqPlanets.map(p => `${p!.domainName} (Grade ${p!.grade})`).join(", ")
    const msg = prereqNames
      ? `Keep exploring to reach ${planet.domainName}. Try: ${prereqNames}`
      : `Keep exploring to reach ${planet.domainName} (Grade ${planet.grade}).`
    setLockedMessage(msg)
    setTimeout(() => setLockedMessage(null), 4000)
  }, [planets, bridges])

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

    // Determine the planet this standard belongs to
    const node = data.nodes.find(n => n.id === standardId)
    const planet = node ? planets.find(p => p.id === `${node.grade}.${node.domainCode}`) : null

    // Wave effect
    if (planet) setWaveColor(planet.color)
    setShowWaveEffect(true)
    setTimeout(() => setShowWaveEffect(false), 1500)

    const newlyAvailable = computeNewlyAvailable(data, progressMap, standardId)

    setProgressMap(prev => {
      const next = new Map(prev)
      next.set(standardId, "unlocked")
      for (const id of newlyAvailable) {
        next.set(id, "available")
      }

      // Award +5 tokens per skill
      const newTotal = addTokens(5)
      setTokens(newTotal)

      // Detect planet mastery: all moons on this planet now unlocked
      if (planet) {
        const allMastered = planet.standards.every(s =>
          s.id === standardId || next.get(s.id) === "unlocked"
        )
        if (allMastered) {
          // Delay slightly so the wave effect plays first
          setTimeout(() => {
            setMasteryEvent({ planetName: planet.domainName, planetColor: planet.color, tokenGain: 0 })
          }, 800)
        }
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
  }, [data, progressMap, tutorialStep, planets])

  // Handle "Build my Game" from Genie chat
  const handleBuildGame = useCallback((designDoc: GameDesignDoc) => {
    setCurrentDesignDoc(designDoc)
    setPanelOpen(false)
    setBuildMode("building")
  }, [])

  // Handle build complete — move to workshop
  const handleBuildComplete = useCallback((html: string, designChoices: Record<string, string>) => {
    if (currentDesignDoc) {
      setCurrentDesignDoc({ ...currentDesignDoc, designChoices })
    }
    setCurrentGameHtml(html)
    setCurrentGameId(null)
    setBuildMode("workshop")
  }, [currentDesignDoc])

  // Handle back to planet from workshop
  const handleBackToPlanet = useCallback(async (html: string, gameId: string | null) => {
    // Save draft
    try {
      await fetch("/api/game/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: gameId,
          title: currentDesignDoc?.title || "Untitled",
          designerName: "Student",
          standardId: currentDesignDoc?.standardId || "",
          planetId: currentDesignDoc?.planetId || "",
          gameHtml: html,
          designDoc: currentDesignDoc,
          status: "draft",
          playCount: 0,
          ratingSum: 0,
          ratingCount: 0,
        }),
      })
    } catch {
      // Silent fail
    }
    setBuildMode("idle")
    setCurrentDesignDoc(null)
    setCurrentGameHtml("")
    setCurrentGameId(null)
  }, [currentDesignDoc])

  // Handle send for review
  const handleSendForReview = useCallback(async (html: string, gameId: string | null) => {
    // Save first
    try {
      const saveRes = await fetch("/api/game/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: gameId,
          title: currentDesignDoc?.title || "Untitled",
          designerName: "Student",
          standardId: currentDesignDoc?.standardId || "",
          planetId: currentDesignDoc?.planetId || "",
          gameHtml: html,
          designDoc: currentDesignDoc,
          status: "in_review",
          playCount: 0,
          ratingSum: 0,
          ratingCount: 0,
        }),
      })
      const { id } = await saveRes.json()
      const reviewGameId = gameId || id

      // Run AI review
      const reviewRes = await fetch(`/api/game/${reviewGameId}/review`, {
        method: "POST",
      })
      const result = await reviewRes.json()

      if (result.pass) {
        // Award +1 token for published game
        const newTotal = addTokens(1)
        setTokens(newTotal)
        setTokenNotify("+1 token — game published!")
        setTimeout(() => setTokenNotify(null), 3000)

        setReviewResult(result)
        setTimeout(() => {
          setBuildMode("idle")
          setCurrentDesignDoc(null)
          setCurrentGameHtml("")
          setCurrentGameId(null)
          setReviewResult(null)
        }, 3000)
      } else {
        setReviewResult(result)
        setTimeout(() => setReviewResult(null), 5000)
      }
    } catch {
      setReviewResult({ pass: false, feedback: "Review failed. Please try again." })
      setTimeout(() => setReviewResult(null), 4000)
    }
  }, [currentDesignDoc])

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
      {/* Game Builder: Build Screen */}
      {buildMode === "building" && currentDesignDoc && (
        <BuildScreen
          designDoc={currentDesignDoc}
          onComplete={handleBuildComplete}
        />
      )}

      {/* Game Builder: Workshop */}
      {buildMode === "workshop" && currentDesignDoc && (
        <>
          <Workshop
            initialHtml={currentGameHtml}
            designDoc={currentDesignDoc}
            gameId={currentGameId}
            onBackToPlanet={handleBackToPlanet}
            onSendForReview={handleSendForReview}
          />
          {/* Review result overlay */}
          {reviewResult && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
              <div className={`max-w-md mx-4 p-6 rounded-xl border ${
                reviewResult.pass
                  ? "bg-emerald-950 border-emerald-500/30"
                  : "bg-amber-950 border-amber-500/30"
              }`}>
                <h3 className={`text-lg font-bold mb-2 ${
                  reviewResult.pass ? "text-emerald-400" : "text-amber-400"
                }`}>
                  {reviewResult.pass ? "Game Published!" : "Needs Work"}
                </h3>
                <p className="text-zinc-300 text-sm">{reviewResult.feedback}</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Main view (hidden when building) */}
      {buildMode === "idle" && (
        viewMode === "galaxy" ? (
          <GalaxyView
            galaxyData={galaxyData}
            onPlanetClick={handlePlanetClick}
            onLockedPlanetClick={handleLockedPlanetClick}
            currentPlanetId={currentPlanetId}
            initialGrade={studentData?.grade ?? null}
            recommendedPlanetId={recommendedPlanetId}
          />
        ) : currentPlanet ? (
          <PlanetView
            planet={currentPlanet}
            moons={currentMoons}
            isMastered={currentMoons.length > 0 && currentMoons.every(m => m.status === "unlocked")}
            onMoonClick={handleMoonClick}
            onBridgeClick={handleBridgeClick}
            bridges={currentBridges}
            planetNames={planetNames}
          />
        ) : null
      )}

      {/* Back to Galaxy button (planet view only, hidden during build) */}
      {buildMode === "idle" && viewMode === "planet" && (
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
        {/* Progress + tokens */}
        <div className="bg-zinc-900/80 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="text-emerald-400 font-mono font-bold text-base">{counts.unlocked}</span>
              <span className="text-zinc-300 ml-1.5 text-sm">
                {counts.unlocked === 1 ? "skill" : "skills"} demonstrated
              </span>
            </div>
            <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.max((counts.unlocked / counts.total) * 100, 2)}%` }}
              />
            </div>
            <div className="flex items-center gap-1 border-l border-zinc-700 pl-3">
              <span className="text-amber-400 text-sm">⬡</span>
              <span className="text-amber-300 font-mono font-bold text-sm">{tokens}</span>
            </div>
          </div>
        </div>

        {/* Color mode toggle */}
        {viewMode === "galaxy" && (
          <div className="bg-zinc-900/80 backdrop-blur-sm rounded-lg border border-zinc-800 flex overflow-hidden">
            <button
              onClick={() => setColorMode("domain")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                colorMode === "domain"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              By concept
            </button>
            <button
              onClick={() => setColorMode("mastery")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                colorMode === "mastery"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
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
              <span className="text-xs text-zinc-300">Demonstrated</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-xs text-zinc-300">Progressing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs text-zinc-300">Ready to Explore</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-zinc-500" />
              <span className="text-xs text-zinc-300">Not Started</span>
            </div>
          </div>
        )}
      </div>

      {/* Tutorial hint */}
      {tutorialStep === 0 && viewMode === "galaxy" && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl px-4 py-2 text-sm text-blue-200 max-w-xs">
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
        unlockedCount={counts.available}
        masteredCount={counts.mastered}
      />

      {/* Locked planet message */}
      {lockedMessage && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-xl px-5 py-3 text-sm text-zinc-300 max-w-md text-center animate-fade-in">
          {lockedMessage}
        </div>
      )}

      {/* Wave effect on unlock */}
      {showWaveEffect && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div
            className="rounded-full animate-wave-expand"
            style={{
              background: `radial-gradient(circle, transparent 30%, ${waveColor}40 50%, transparent 70%)`,
            }}
          />
        </div>
      )}

      {/* Standard panel */}
      <StandardPanel
        standard={selectedStandard}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onUnlock={handleUnlock}
        onBuildGame={handleBuildGame}
        interests={studentData?.interests}
        nodeStatus={selectedStandard ? progressMap.get(selectedStandard.id) : undefined}
      />

      {/* Planet mastery celebration */}
      {masteryEvent && (
        <MasteryAnimation
          planetName={masteryEvent.planetName}
          planetColor={masteryEvent.planetColor}
          tokenGain={masteryEvent.tokenGain}
          onDone={() => setMasteryEvent(null)}
        />
      )}

      {/* Token earned notification */}
      {tokenNotify && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] bg-amber-500/20 border border-amber-400/40 rounded-full px-5 py-2 text-sm text-amber-300 font-medium animate-fade-in">
          {tokenNotify}
        </div>
      )}
    </div>
  )
}
