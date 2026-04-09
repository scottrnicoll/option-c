"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import type { StandardsGraph, StandardNode, NodeStatus } from "@/lib/graph-types"
import { buildPlanets, buildBridges, buildGalaxyData, buildMoonData, isClusterNode } from "@/lib/galaxy-utils"
import type { Planet, Bridge, ColorMode } from "@/lib/galaxy-utils"
import { GalaxyView } from "./galaxy-view"
import { PlanetView } from "./planet-view"
import { MiniMap } from "./mini-map"
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import type { OnboardingData } from "@/components/onboarding/onboarding-flow"
import { StandardPanel } from "@/components/standard/standard-panel"
import { BuildScreen } from "@/components/game/build-screen"
import { Workshop } from "@/components/game/workshop"
import { ImportHtml } from "@/components/game/import-html"
import { MasteryAnimation } from "./mastery-animation"
import type { GameDesignDoc } from "@/lib/game-types"
import { doc, setDoc, getDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth"
import { LearnerNav } from "@/components/learner-nav"
import { FeedbackButton } from "@/components/feedback/feedback-button"
import { UserMenu } from "@/components/user-menu"
import { GalaxySettingsPopover } from "./galaxy-settings-popover"
import { RulesPopover } from "@/components/rules-popover"
import { useSearchParams } from "next/navigation"

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
    if (isClusterNode(node.id)) continue
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

// Walk every "locked" standard. If all of its prerequisites are now
// "unlocked" or "mastered", upgrade it to "available". This catches the
// cascade after a guide approves a game on a different device — the
// approved standard arrives via Firestore as "unlocked", but its
// dependents would still be "locked" without this pass.
function recomputeAvailable(
  data: StandardsGraph,
  progressMap: Map<string, NodeStatus>
): Map<string, NodeStatus> {
  const next = new Map(progressMap)
  // Build target → prereq sources lookup once
  const prereqsOf = new Map<string, string[]>()
  for (const edge of data.edges) {
    if (edge.type !== "prerequisite") continue
    const arr = prereqsOf.get(edge.target) ?? []
    arr.push(edge.source)
    prereqsOf.set(edge.target, arr)
  }
  // Iterate to a fixed point in case of chained unlocks
  let changed = true
  while (changed) {
    changed = false
    for (const [id, status] of next) {
      if (status !== "locked") continue
      const prereqs = prereqsOf.get(id) ?? []
      const allMet = prereqs.every((p) => {
        const s = next.get(p)
        return s === "unlocked" || s === "mastered"
      })
      if (allMet) {
        next.set(id, "available")
        changed = true
      }
    }
  }
  return next
}

export function GraphPage({ data }: GraphPageProps) {
  const { user, profile, activeProfile, impersonating, stopImpersonating, loading: authLoading, saveProgress, loadProgress } = useAuth()
  const searchParams = useSearchParams()
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
  // Grade filter — controls whether the galaxy view dims everything outside
  // the student's grade. Default is "myGrade" so a brand-new student walks
  // in to a focused view. Hidden entirely if the student hasn't picked a grade.
  const [gradeFilter, setGradeFilter] = useState<"all" | "myGrade">("myGrade")
  const [showWaveEffect, setShowWaveEffect] = useState(false)
  const [waveColor, setWaveColor] = useState("#22c55e")
  const [lockedMessage, setLockedMessage] = useState<string | null>(null)

  // Tokens
  const [tokens, setTokens] = useState(0)

  // Rotate hint — show once, then dismiss forever via localStorage
  const [showRotateHint, setShowRotateHint] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const dismissed = localStorage.getItem("option_c_rotate_hint_dismissed")
    if (!dismissed) setShowRotateHint(true)
  }, [])
  const dismissRotateHint = useCallback(() => {
    setShowRotateHint(false)
    if (typeof window !== "undefined") {
      localStorage.setItem("option_c_rotate_hint_dismissed", "1")
    }
  }, [])

  // Reset galaxy state ONLY when actually switching profiles, not on mount.
  // (Resetting on mount would knock the student back to onboarding every
  // time they navigated to /, even though they're already signed in.)
  const lastProfileUidRef = useRef<string | null>(null)
  useEffect(() => {
    const currentUid = activeProfile?.uid ?? null
    if (lastProfileUidRef.current === null) {
      lastProfileUidRef.current = currentUid
      return
    }
    if (lastProfileUidRef.current === currentUid) return
    // Profile actually changed (impersonation start/stop) → reset
    lastProfileUidRef.current = currentUid
    setOnboardingComplete(false)
    setProgressMap(initialProgress)
    setTokens(0)
    setStudentData(null)
    setViewMode("galaxy")
    setCurrentPlanetId(null)
    setPanelOpen(false)
    setBuildMode("idle")
  }, [activeProfile?.uid, initialProgress])

  // Honor a `?moon=<standardId>` query param: open the planet view +
  // standard panel for that moon. Used by deep links from My Stuff.
  // Runs once after onboarding is complete and the data is loaded.
  const moonParamHandled = useRef(false)
  useEffect(() => {
    if (!onboardingComplete || moonParamHandled.current) return
    const moonId = searchParams?.get("moon")
    if (!moonId) return
    const node = data.nodes.find((n) => n.id === moonId)
    if (!node) return
    moonParamHandled.current = true
    const planetId = `${node.grade}.${node.domainCode}`
    setCurrentPlanetId(planetId)
    setViewMode("planet")
    setSelectedStandard(node)
    setPanelOpen(true)
  }, [onboardingComplete, searchParams, data.nodes])

  // Honor a `?fix=<gameId>` query param: load the game from Firestore
  // and drop the creator straight into the Workshop to fix it. Used by
  // the "Fix this game" button on the creator's feedback inbox. Runs
  // once when both onboarding is complete and we have an active profile.
  const fixParamHandled = useRef(false)
  useEffect(() => {
    if (!onboardingComplete || fixParamHandled.current) return
    if (!activeProfile) return
    const gameIdToFix = searchParams?.get("fix")
    if (!gameIdToFix) return
    fixParamHandled.current = true
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, "games", gameIdToFix))
        if (!snap.exists()) return
        const gameData = snap.data() as {
          authorUid?: string
          gameHtml?: string
          designDoc?: GameDesignDoc
          standardId?: string
        }
        // Only the original author can open their own game in the Workshop.
        if (gameData.authorUid !== activeProfile.uid) return
        if (!gameData.designDoc || !gameData.gameHtml) return
        // Revert the author's progress for this standard back to in_progress
        // so the moon doesn't keep claiming "demonstrated" while it's being
        // re-worked. Best-effort.
        if (gameData.standardId) {
          saveProgress(gameData.standardId, { status: "in_progress" }).catch(() => {})
          setProgressMap((prev) => {
            const next = new Map(prev)
            next.set(gameData.standardId!, "in_progress")
            return next
          })
        }
        setCurrentDesignDoc(gameData.designDoc)
        setCurrentGameHtml(gameData.gameHtml)
        setCurrentGameId(gameIdToFix)
        setBuildMode("workshop")
      } catch (err) {
        console.warn("fix-flow load failed:", err)
      }
    })()
  // saveProgress is intentionally excluded — it's stable enough and we
  // only want this effect to run once per query param change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingComplete, searchParams, activeProfile])

  // Refreshable progress loader. Pulls from Firestore, merges with the
  // local "what's locked vs available" baseline, then runs the cascade
  // pass so newly approved standards bubble out to their dependents.
  const refreshProgress = useCallback(() => {
    if (!activeProfile) return
    loadProgress().then((progressDocs) => {
      const map = new Map(initialProgress)
      for (const [id, progressDoc] of progressDocs) {
        map.set(id, progressDoc.status as NodeStatus)
      }
      setProgressMap(recomputeAvailable(data, map))
    }).catch(() => {
      // Fall back to initial progress
    })
  }, [activeProfile, loadProgress, initialProgress, data])

  // Load from auth profile on mount / when profile changes
  useEffect(() => {
    if (activeProfile) {
      setStudentData({ name: activeProfile.name, grade: activeProfile.grade, interests: activeProfile.interests })
      setTokens(activeProfile.tokens)

      // Only skip onboarding if profile is complete (has grade and interests)
      const profileComplete = activeProfile.grade && activeProfile.interests.length > 0
      if (profileComplete) {
        setOnboardingComplete(true)
      }

      refreshProgress()
    }
  }, [activeProfile, refreshProgress])

  // Refresh progress + token count when the user returns to the tab. This
  // is how the student sees a game approval (which happens on the guide's
  // device) without having to reload the page.
  useEffect(() => {
    if (!activeProfile) return
    const onFocus = async () => {
      refreshProgress()
      try {
        const snap = await getDoc(doc(db, "users", activeProfile.uid))
        if (snap.exists()) {
          const data = snap.data() as { tokens?: number }
          if (typeof data.tokens === "number") setTokens(data.tokens)
        }
      } catch {
        // ignore — token refresh is best-effort
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus()
    }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [activeProfile, refreshProgress])

  // Mastery animation
  const [masteryEvent, setMasteryEvent] = useState<{ planetName: string; planetColor: string; tokenGain: number } | null>(null)

  // Token notification (for game publish)
  const [tokenNotify, setTokenNotify] = useState<string | null>(null)

  // Game builder state. "importing" = the learner is pasting their own HTML;
  // once it passes the AI judge they go straight to the workshop preview.
  const [buildMode, setBuildMode] = useState<"idle" | "building" | "workshop" | "importing">("idle")
  // The standard the learner is importing HTML for (only set in importing mode)
  const [importingStandard, setImportingStandard] = useState<StandardNode | null>(null)
  const [currentDesignDoc, setCurrentDesignDoc] = useState<GameDesignDoc | null>(null)
  const [currentGameHtml, setCurrentGameHtml] = useState<string>("")
  const [currentGameId, setCurrentGameId] = useState<string | null>(null)
  const [reviewResult, setReviewResult] = useState<{ pass: boolean; feedback: string } | null>(null)

  // Build planet/bridge data
  const planets = useMemo(() => buildPlanets(data), [data])
  const bridges = useMemo(() => buildBridges(data, planets), [data, planets])

  // Build galaxy-level graph data
  const galaxyData = useMemo(
    () => buildGalaxyData(planets, bridges, progressMap, colorMode, studentData?.grade ?? null, gradeFilter),
    [planets, bridges, progressMap, colorMode, studentData?.grade, gradeFilter]
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

  // Counts for progress — filtered to student's grade, exclude cluster nodes
  const counts = useMemo(() => {
    const grade = studentData?.grade
    let total = 0, available = 0, demonstrated = 0, mastered = 0
    for (const node of data.nodes) {
      if (isClusterNode(node.id)) continue
      // If student picked a grade, only count that grade's standards
      if (grade && node.grade !== grade) continue
      total++
      const status = progressMap.get(node.id)
      if (status === "available") available++
      // "Demonstrated" = green moon. Both "unlocked" and "mastered" count.
      if (status === "unlocked" || status === "mastered") demonstrated++
      if (status === "mastered") mastered++
    }
    // Fall back to all if no grade selected or no standards match
    if (total === 0) {
      total = data.nodes.length
      progressMap.forEach(status => {
        if (status === "available") available++
        if (status === "unlocked" || status === "mastered") demonstrated++
        if (status === "mastered") mastered++
      })
    }
    // We expose `unlocked` (the green count) under that name for back-compat
    // with components that already consume it.
    return { total, available, unlocked: demonstrated, mastered }
  }, [progressMap, data.nodes, studentData?.grade])

  // Recommended next planet — "closest to finishing" rule:
  // among accessible, not-yet-fully-completed planets that have at least
  // one ACTIONABLE moon (blue or yellow), pick the one with the highest
  // unlocked-percentage. Tiebreaker: most available moons.
  // If a grade filter is on, scope to that grade.
  // A planet with only green + locked moons is NOT a candidate — there's
  // nothing the learner can do there right now, so the ring should move on.
  const recommendedPlanetId = useMemo(() => {
    const grade = studentData?.grade
    const candidates = galaxyData.nodes.filter(n => {
      if (n.access === "locked") return false
      if (n.isCompleted) return false
      if (n.moonCount === 0) return false
      if (gradeFilter === "myGrade" && grade && n.grade !== grade) return false
      // The learner must have something ACTIONABLE on this planet right now:
      // a blue moon (available), an in_progress moon, or an approved_unplayed.
      // in_review is yellow but waiting on the guide — NOT actionable.
      // Green-only or green+locked or green+in_review doesn't qualify.
      const actionable = n.availableCount + n.actionableCount
      if (actionable === 0) return false
      return true
    })
    if (candidates.length === 0) return null
    candidates.sort((a, b) => {
      const aPct = a.unlockedCount / a.moonCount
      const bPct = b.unlockedCount / b.moonCount
      if (Math.abs(aPct - bPct) > 0.001) return bPct - aPct
      return (b.availableCount + b.actionableCount) - (a.availableCount + a.actionableCount)
    })
    return candidates[0].id
  }, [galaxyData.nodes, studentData?.grade, gradeFilter])

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

    // Mark as in_progress when first opened (if currently available)
    if (status === "available") {
      saveProgress(standardId, { status: "in_progress" }).catch(() => {})
      setProgressMap(prev => {
        const next = new Map(prev)
        next.set(standardId, "in_progress")
        return next
      })
    }
  }, [data.nodes, tutorialStep, saveProgress])

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

      // No tokens awarded here. Tokens come from:
      //   - Guide approving a submitted game: +2000
      //   - Mastering a skill by playing 3 times: +100

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

    // Save progress to Firestore
    saveProgress(standardId, { status: "unlocked", unlockedAt: Date.now() }).catch(() => {})
    // Also mark newly available standards
    for (const id of newlyAvailable) {
      saveProgress(id, { status: "available" }).catch(() => {})
    }

    if (tutorialStep < 3) setTutorialStep(3)
  }, [data, progressMap, tutorialStep, planets, saveProgress])

  // Standard panel: learner demonstrated a skill (won their own game 3 in
  // a row). Flip the local moon to "unlocked", cascade-unlock any dependent
  // moons whose prereqs are now all met, close the panel, fly back to
  // the galaxy, and ONLY THEN fire the supernova so the learner can
  // actually see it happen.
  const handleDemonstrated = useCallback((standardId: string) => {
    const node = data.nodes.find(n => n.id === standardId)
    const planet = node ? planets.find(p => p.id === `${node.grade}.${node.domainCode}`) : null

    // Cascade: any moons that were locked but had this one as their last
    // missing prereq now flip to "available" (blue).
    const newlyAvailable = computeNewlyAvailable(data, progressMap, standardId)

    setProgressMap(prev => {
      const next = new Map(prev)
      next.set(standardId, "unlocked")
      for (const id of newlyAvailable) {
        next.set(id, "available")
      }
      return next
    })

    // Persist the demonstrated standard AND each newly-available one
    saveProgress(standardId, { status: "unlocked", unlockedAt: Date.now() }).catch(() => {})
    for (const id of newlyAvailable) {
      saveProgress(id, { status: "available" }).catch(() => {})
    }

    // Close the standard panel + fly back to galaxy
    setPanelOpen(false)
    setSelectedStandard(null)

    // Compute "did this fill the planet?" — reads the FRESH progress
    // map by inspecting the standards we know about. If yes, we'll fire
    // the supernova once we land in galaxy view.
    let fillsPlanet = false
    if (planet) {
      fillsPlanet = planet.standards.every(s => {
        if (s.id === standardId) return true
        const st = progressMap.get(s.id)
        return st === "unlocked" || st === "mastered"
      })
    }

    // Brief wave effect on the moon, then fly to galaxy view
    if (planet) setWaveColor(planet.color)
    setShowWaveEffect(true)

    setTimeout(() => {
      setShowWaveEffect(false)
      // Switch to galaxy view so the supernova can play in the right place
      setViewMode("galaxy")
      // Give the camera a moment to land, then trigger the supernova
      if (fillsPlanet && planet) {
        setTimeout(() => {
          setMasteryEvent({
            planetName: planet.domainName,
            planetColor: planet.color,
            tokenGain: 0,
          })
        }, 1200)
      }
    }, 1500)
  }, [data, planets, saveProgress, progressMap])

  // Handle "Build my Game" from Genie chat
  const handleBuildGame = useCallback((designDoc: GameDesignDoc) => {
    setCurrentDesignDoc(designDoc)
    setPanelOpen(false)
    setBuildMode("building")
  }, [])

  // Handle "Paste my own HTML" — open the import screen for this standard.
  const handleImportHtml = useCallback((standard: StandardNode) => {
    setImportingStandard(standard)
    setPanelOpen(false)
    setBuildMode("importing")
  }, [])

  // Called by ImportHtml when the AI judge passes. Synthesise a minimal
  // design doc and drop the learner into the workshop preview, where the
  // play-and-win gate still applies before they can submit for review.
  const handleImportPass = useCallback((params: { title: string; html: string; visualConcept: string[] }) => {
    if (!importingStandard) return
    const std = importingStandard
    const designDoc: GameDesignDoc = {
      title: params.title,
      concept: `Imported HTML game for ${std.description.slice(0, 80)}`,
      standardId: std.id,
      planetId: `${std.grade}.${std.domainCode}`,
      howItWorks: "Imported from a learner-pasted HTML file.",
      rules: [],
      winCondition: "Player wins as defined in the imported HTML.",
      mathRole: std.description,
      designChoices: {},
      visualConcept: params.visualConcept,
    }
    setCurrentDesignDoc(designDoc)
    setCurrentGameHtml(params.html)
    setCurrentGameId(null)
    setImportingStandard(null)
    setBuildMode("workshop")
  }, [importingStandard])

  // Handle build complete — move to workshop. Stash the visual concept
  // bullets on the design doc so they get saved with the game.
  const handleBuildComplete = useCallback((html: string, designChoices: Record<string, string>, visualConcept: string[]) => {
    if (currentDesignDoc) {
      setCurrentDesignDoc({ ...currentDesignDoc, designChoices, visualConcept })
    }
    setCurrentGameHtml(html)
    setCurrentGameId(null)
    setBuildMode("workshop")
  }, [currentDesignDoc])

  // Handle back to planet from workshop
  const handleBackToPlanet = useCallback(async (html: string, gameId: string | null) => {
    // Save draft. If the workshop already created a doc, REUSE its id.
    // Don't reset counters or createdAt on existing docs.
    try {
      const gamesRef = collection(db, "games")
      const id = gameId || doc(gamesRef).id
      const ref = doc(db, "games", id)
      const existing = await getDoc(ref)
      const isNew = !existing.exists()

      const update: Record<string, unknown> = {
        id,
        title: currentDesignDoc?.title || "Untitled",
        designerName: activeProfile?.name || "Learner",
        authorUid: activeProfile?.uid || "",
        classId: activeProfile?.classId || "",
        standardId: currentDesignDoc?.standardId || "",
        planetId: currentDesignDoc?.planetId || "",
        gameHtml: html,
        designDoc: currentDesignDoc,
        updatedAt: Date.now(),
      }
      if (isNew) {
        update.status = "draft"
        update.playCount = 0
        update.ratingSum = 0
        update.ratingCount = 0
        update.reviews = []
        update.createdAt = Date.now()
      } else {
        const data = existing.data() as { status?: string }
        if (data.status === "draft" || data.status === undefined) {
          update.status = "draft"
        }
      }
      await setDoc(ref, update, { merge: true })
    } catch {
      // Silent fail
    }
    setBuildMode("idle")
    setCurrentDesignDoc(null)
    setCurrentGameHtml("")
    setCurrentGameId(null)
  }, [currentDesignDoc, activeProfile])

  // Handle send for review
  const handleSendForReview = useCallback(async (html: string, gameId: string | null) => {
    // Save with pending_review status. Reuse the workshop's existing doc id
    // and don't reset counters/createdAt on the existing draft.
    try {
      const gamesRef = collection(db, "games")
      const id = gameId || doc(gamesRef).id
      const ref = doc(db, "games", id)
      const existing = await getDoc(ref)
      const isNew = !existing.exists()

      const update: Record<string, unknown> = {
        id,
        title: currentDesignDoc?.title || "Untitled",
        designerName: activeProfile?.name || "Learner",
        authorUid: activeProfile?.uid || "",
        classId: activeProfile?.classId || "",
        standardId: currentDesignDoc?.standardId || "",
        planetId: currentDesignDoc?.planetId || "",
        gameHtml: html,
        designDoc: currentDesignDoc,
        // Always set status here — the whole point of this call is to flip it
        status: "pending_review",
        updatedAt: Date.now(),
      }
      if (isNew) {
        update.playCount = 0
        update.ratingSum = 0
        update.ratingCount = 0
        update.reviews = []
        update.createdAt = Date.now()
      }
      await setDoc(ref, update, { merge: true })

      // Mark standard as in_review
      if (currentDesignDoc?.standardId) {
        await saveProgress(currentDesignDoc.standardId, { status: "in_review" })
        setProgressMap(prev => {
          const next = new Map(prev)
          next.set(currentDesignDoc.standardId, "in_review")
          return next
        })
      }

      // No tokens for submitting — only on guide approval (+2000)

      setReviewResult({ pass: true, feedback: "Sent for review! You'll earn 2000 tokens when your guide approves it." })
      setTimeout(() => {
        setBuildMode("idle")
        setCurrentDesignDoc(null)
        setCurrentGameHtml("")
        setCurrentGameId(null)
        setReviewResult(null)
      }, 2000)
    } catch {
      setReviewResult({ pass: false, feedback: "Failed to submit. Please try again." })
      setTimeout(() => setReviewResult(null), 4000)
    }
  }, [currentDesignDoc, activeProfile, saveProgress])

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

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

      {/* Game Builder: HTML import */}
      {buildMode === "importing" && importingStandard && (
        <ImportHtml
          standard={importingStandard}
          onCancel={() => { setBuildMode("idle"); setImportingStandard(null) }}
          onPass={handleImportPass}
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
                  {reviewResult.pass ? "Sent for review!" : "Needs Work"}
                </h3>
                <p className="text-zinc-300 text-sm">{reviewResult.feedback}</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Student navigation — galaxy view only (planet view has Back to Galaxy) */}
      {buildMode === "idle" && viewMode === "galaxy" && <LearnerNav />}

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
            // Pass the same color the galaxy uses so the central orb
            // matches what the learner saw a moment ago.
            progressColor={galaxyData.nodes.find(n => n.id === currentPlanet.id)?.color}
          />
        ) : null
      )}

      {/* Impersonation banner */}
      {impersonating && buildMode === "idle" && (
        <div className="fixed top-0 left-0 right-0 z-30 bg-amber-500/90 text-black px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium">Viewing as {activeProfile?.name ?? "learner"}</span>
          <button
            onClick={() => {
              stopImpersonating()
              window.location.href = "/guide"
            }}
            className="text-sm font-semibold bg-black/20 hover:bg-black/30 rounded px-3 py-1 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Back to Galaxy button (planet view only, hidden during build) */}
      {buildMode === "idle" && viewMode === "planet" && (
        <button
          onClick={handleBackToGalaxy}
          className={`absolute ${impersonating ? "top-14" : "top-4"} left-4 z-20 flex items-center gap-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors`}
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Galaxy
        </button>
      )}

      {/* Top-right toolbar — single horizontal strip */}
      <div className={`absolute ${impersonating ? "top-14" : "top-4"} right-4 z-10 flex items-center gap-2`}>
        {/* Compact status strip — plain text, no boxes */}
        <div className="hidden md:flex items-center gap-3 bg-zinc-900/85 backdrop-blur-sm border border-zinc-700 rounded-lg px-4 py-2 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-mono font-bold">{counts.unlocked}</span>
            <span className="text-zinc-300">demonstrated</span>
          </span>
          <span className="text-zinc-700">·</span>
          <span className="flex items-center gap-1">
            <span className="text-amber-400">⬡</span>
            <span className="text-amber-300 font-mono font-bold">{tokens}</span>
          </span>
          {studentData?.grade && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-400 text-xs">Grade {studentData.grade}</span>
            </>
          )}
        </div>

        {/* Settings popover — toggles + legend live in here */}
        {viewMode === "galaxy" && (
          <GalaxySettingsPopover
            colorMode={colorMode}
            onColorModeChange={setColorMode}
            gradeFilter={gradeFilter}
            onGradeFilterChange={setGradeFilter}
            showGradeFilter={!!studentData?.grade}
            showOtherGradeSwatch={!!studentData?.grade && gradeFilter === "myGrade"}
          />
        )}

        {/* Rules / help */}
        <RulesPopover />

        {/* User menu (name + sign out) */}
        <UserMenu />
      </div>

      {/* Rotate hint — show once, dismissable */}
      {viewMode === "galaxy" && showRotateHint && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-zinc-900/85 backdrop-blur-sm border border-zinc-700 rounded-lg pl-5 pr-2 py-2 text-center flex items-center gap-3">
            <p className="text-sm text-white font-medium">You can rotate your galaxy in 3D motion. Figure out how.</p>
            <button
              onClick={dismissRotateHint}
              className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
              aria-label="Dismiss"
              title="Got it"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Tutorial hint — sits BELOW the nav, not next to it */}
      {tutorialStep === 0 && viewMode === "galaxy" && (
        <div className={`absolute ${impersonating ? "top-28" : "top-16"} left-4 z-10 max-w-[260px]`}>
          <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-xl px-4 py-2 text-sm text-blue-200">
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
        scopeLabel={studentData?.grade && gradeFilter === "myGrade" ? `Grade ${studentData.grade}` : "All grades"}
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
        onDemonstrated={handleDemonstrated}
        onBuildGame={handleBuildGame}
        onImportHtml={handleImportHtml}
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

      {/* Suggest a fix or idea — feedback button. Visible everywhere
          including the build/workshop screens, so learners can flag a
          problem at any moment without losing their work. */}
      <FeedbackButton />
    </div>
  )
}
