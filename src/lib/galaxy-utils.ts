import type { StandardsGraph, StandardNode, StandardEdge, NodeStatus } from "./graph-types"
import moonNames from "@/data/moon-names.json"

const NAMES = moonNames as Record<string, string>

// A Planet = one domain at one grade level
export interface Planet {
  id: string           // e.g., "K.CC", "3.NF", "7.EE"
  grade: string
  domainCode: string
  domainName: string
  standards: StandardNode[]  // moons
  color: string
  gradeBand: "K-2" | "3-5" | "6-8" | "HS"
}

// A Bridge = cross-planet connection
export interface Bridge {
  sourcePlanetId: string
  targetPlanetId: string
  edgeCount: number    // how many standard-level edges cross this bridge
}

export type PlanetAccess = "home" | "explorable" | "earned" | "locked"
// home = student's grade, fully open
// explorable = below student's grade or 1 grade above with bridge earned
// earned = 1 grade above, earned via bridge demonstration
// locked = 2+ grades above, not yet reachable

// Planet-level graph data for react-force-graph-3d
export interface GalaxyNode {
  id: string
  name: string
  grade: string
  domainCode: string
  gradeBand: string
  color: string
  val: number          // size based on moon count
  moonCount: number
  unlockedCount: number
  availableCount: number
  // Number of moons in any "in-progress-ish" state (in_progress,
  // in_review, or approved_unplayed). Used for planet color.
  inProgressCount: number
  // Number of moons the learner can actively work on RIGHT NOW.
  // Includes available (blue), in_progress, and approved_unplayed.
  // EXCLUDES in_review (waiting on the guide). Used by the white-ring
  // recommendation logic.
  actionableCount: number
  // True when every moon is unlocked or mastered (planet turns green)
  isCompleted: boolean
  // True when every moon is mastered (planet earns the gold ring)
  isFullyMastered: boolean
  access: PlanetAccess
}

export interface GalaxyLink {
  source: string
  target: string
  edgeCount: number
  isLit: boolean       // at least one standard unlocked on both sides
  color: string
}

export interface GalaxyData {
  nodes: GalaxyNode[]
  links: GalaxyLink[]
}

// Moon data for planet view
export interface MoonData {
  id: string
  description: string
  shortTitle: string
  status: NodeStatus
  orbitRadius: number
  orbitSpeed: number
  orbitOffset: number  // starting angle
  size: number
  color: string
}

// Domain color palette — high-contrast, distinct colors for each major group.
// Friendly grouped names share the same color across grades/HS subdomains
// so the legend stays small and consistent.
const DOMAIN_COLORS: Record<string, string> = {
  "CC": "#f59e0b",   // Counting — orange
  "OA": "#f97316",   // Algebra — bright orange
  "NBT": "#14b8a6",  // Base Ten — teal
  "NF": "#06b6d4",   // Fractions — cyan
  "G": "#3b82f6",    // Geometry — blue
  "MD": "#a855f7",   // Measurement — purple
  "RP": "#ec4899",   // Ratios — pink
  "NS": "#10b981",   // Numbers — emerald
  "EE": "#eab308",   // Equations — yellow
  "SP": "#84cc16",   // Statistics — lime
  "F": "#22d3ee",    // Functions — sky cyan
  // HS subdomains share their parent color
  "A-SSE": "#f97316", "A-APR": "#f97316", "A-CED": "#f97316", "A-REI": "#f97316",
  "F-IF": "#22d3ee", "F-BF": "#22d3ee", "F-LE": "#22d3ee", "F-TF": "#22d3ee",
  "G-CO": "#3b82f6", "G-SRT": "#3b82f6", "G-C": "#3b82f6", "G-GPE": "#3b82f6", "G-GMD": "#3b82f6", "G-MG": "#3b82f6",
  "N-RN": "#10b981", "N-Q": "#10b981", "N-CN": "#10b981", "N-VM": "#10b981",
  "S-ID": "#84cc16", "S-IC": "#84cc16", "S-CP": "#84cc16", "S-MD": "#84cc16",
}

// Friendly name + color for the "By concept" legend. Order = display order.
export const CONCEPT_LEGEND: { name: string; color: string }[] = [
  { name: "Counting",    color: "#f59e0b" },
  { name: "Algebra",     color: "#f97316" },
  { name: "Base Ten",    color: "#14b8a6" },
  { name: "Fractions",   color: "#06b6d4" },
  { name: "Geometry",    color: "#3b82f6" },
  { name: "Measurement", color: "#a855f7" },
  { name: "Ratios",      color: "#ec4899" },
  { name: "Numbers",     color: "#10b981" },
  { name: "Equations",   color: "#eab308" },
  { name: "Statistics",  color: "#84cc16" },
  { name: "Functions",   color: "#22d3ee" },
]

function getDomainColor(domainCode: string): string {
  return DOMAIN_COLORS[domainCode] || DOMAIN_COLORS[domainCode.split("-")[0]] || "#888888"
}

function gradeToNumber(grade: string): number {
  if (grade === "K") return 0
  const n = parseInt(grade)
  if (!isNaN(n)) return n
  return 13 // HS
}

function getGradeBand(grade: string): "K-2" | "3-5" | "6-8" | "HS" {
  if (grade === "K" || grade === "1" || grade === "2") return "K-2"
  if (grade === "3" || grade === "4" || grade === "5") return "3-5"
  if (grade === "6" || grade === "7" || grade === "8") return "6-8"
  return "HS"
}

// A node is a "cluster header" (not a real moon) if its id is exactly 3 parts
// where the last part is a single capital letter — e.g. "K.G.A", "K.CC.B".
// These are headers for groups of standards, not standards themselves, so we
// hide them from the galaxy view.
export function isClusterNode(nodeId: string): boolean {
  const parts = nodeId.split(".")
  return parts.length === 3 && /^[A-Z]$/.test(parts[2])
}

// Group standards into planets
export function buildPlanets(data: StandardsGraph): Planet[] {
  const planetMap = new Map<string, Planet>()

  for (const node of data.nodes) {
    if (isClusterNode(node.id)) continue
    const planetId = `${node.grade}.${node.domainCode}`
    if (!planetMap.has(planetId)) {
      planetMap.set(planetId, {
        id: planetId,
        grade: node.grade,
        domainCode: node.domainCode,
        domainName: node.domain,
        standards: [],
        color: getDomainColor(node.domainCode),
        gradeBand: getGradeBand(node.grade),
      })
    }
    planetMap.get(planetId)!.standards.push(node)
  }

  return Array.from(planetMap.values())
}

// Find which planet a standard belongs to
export function standardToPlanetId(node: StandardNode): string {
  return `${node.grade}.${node.domainCode}`
}

// Build bridges between planets
export function buildBridges(data: StandardsGraph, planets: Planet[]): Bridge[] {
  const nodeToplanet = new Map<string, string>()
  for (const planet of planets) {
    for (const std of planet.standards) {
      nodeToplanet.set(std.id, planet.id)
    }
  }

  const bridgeMap = new Map<string, number>()
  for (const edge of data.edges) {
    if (edge.type !== "prerequisite") continue
    const sp = nodeToplanet.get(edge.source)
    const tp = nodeToplanet.get(edge.target)
    if (!sp || !tp || sp === tp) continue
    const key = `${sp}|${tp}`
    bridgeMap.set(key, (bridgeMap.get(key) || 0) + 1)
  }

  return Array.from(bridgeMap.entries()).map(([key, count]) => {
    const [sourcePlanetId, targetPlanetId] = key.split("|")
    return { sourcePlanetId, targetPlanetId, edgeCount: count }
  })
}

export type ColorMode = "domain" | "mastery"

// Mastery colors — Montessori terminology:
// locked = "Not Started" (grey), available = "Ready to Explore" (blue),
// working = "Progressing" (yellow), mastered = "Demonstrated" (green),
// otherGrade = "Available but not your grade" (purple)
const MASTERY_COLORS = {
  locked: "#555555",     // grey — Not Started
  available: "#3b82f6",  // blue — Ready to Explore
  working: "#eab308",    // yellow — Progressing
  mastered: "#22c55e",   // green — Demonstrated
  otherGrade: "#9333ea", // purple — Available but not your grade
}

function getMasteryColor(planet: { unlockedCount: number; availableCount: number; inProgressCount: number; moonCount: number; isCompleted: boolean }): string {
  if (planet.isCompleted) return MASTERY_COLORS.mastered
  // Yellow if any moon is unlocked OR in_progress OR in_review.
  // (Even before the first guide-approved unlock, the planet should look
  // alive once the student has started a game on it.)
  if (planet.unlockedCount > 0 || planet.inProgressCount > 0) return MASTERY_COLORS.working
  if (planet.availableCount > 0) return MASTERY_COLORS.available
  return MASTERY_COLORS.locked
}

// Compute planet access based on student grade and bridge connections
function computePlanetAccess(
  planet: Planet,
  studentGrade: string | null,
  bridges: Bridge[],
  planetHasUnlocked: Map<string, boolean>
): PlanetAccess {
  if (!studentGrade) return "explorable" // no grade = everything open

  const studentNum = gradeToNumber(studentGrade)
  const planetNum = gradeToNumber(planet.grade)
  const diff = planetNum - studentNum

  // Student's own grade = home
  if (diff === 0) return "home"

  // Below student's grade = explorable (can go back to fill gaps)
  if (diff < 0) return "explorable"

  // One grade above = earned if they've demonstrated a standard that bridges into this planet
  if (diff === 1) {
    // Check if any bridge FROM a planet with unlocked standards leads TO this planet
    const hasBridgeIn = bridges.some(b =>
      b.targetPlanetId === planet.id && (planetHasUnlocked.get(b.sourcePlanetId) ?? false)
    )
    return hasBridgeIn ? "earned" : "locked"
  }

  // 2+ grades above = locked unless earned via bridges
  // Check if there's a chain of earned bridges leading here
  const hasBridgeIn = bridges.some(b =>
    b.targetPlanetId === planet.id && (planetHasUnlocked.get(b.sourcePlanetId) ?? false)
  )
  return hasBridgeIn ? "earned" : "locked"
}

// Build galaxy-level graph data
export function buildGalaxyData(
  planets: Planet[],
  bridges: Bridge[],
  progressMap: Map<string, NodeStatus>,
  colorMode: ColorMode = "domain",
  studentGrade: string | null = null,
  gradeFilter: "all" | "myGrade" = "all"
): GalaxyData {
  // Pre-compute which planets have unlocked standards
  const planetHasUnlocked = new Map<string, boolean>()
  for (const planet of planets) {
    const hasUnlocked = planet.standards.some(s => progressMap.get(s.id) === "unlocked")
    planetHasUnlocked.set(planet.id, hasUnlocked)
  }

  const isOutOfGradeFilter = (planet: Planet): boolean =>
    gradeFilter === "myGrade" && !!studentGrade && planet.grade !== studentGrade

  const nodes: GalaxyNode[] = planets.map(planet => {
    let unlockedCount = 0
    let availableCount = 0
    let inProgressCount = 0   // includes in_review (used for planet color)
    let actionableCount = 0   // excludes in_review (used for ring recommendation)
    let masteredCount = 0
    for (const std of planet.standards) {
      const status = progressMap.get(std.id) ?? "locked"
      if (status === "unlocked" || status === "mastered") unlockedCount++
      if (status === "mastered") masteredCount++
      if (status === "available") availableCount++
      if (status === "in_progress" || status === "in_review" || status === "approved_unplayed") inProgressCount++
      // "Actionable" = something the learner can DO right now.
      // in_review is yellow but waiting on the guide → not actionable.
      if (status === "in_progress" || status === "approved_unplayed") actionableCount++
    }
    // "Completed" planet = every moon green or gold (not just yellow).
    // Triggers the supernova when the last yellow flips to green.
    const isCompleted = unlockedCount === planet.standards.length && planet.standards.length > 0
    // "Fully mastered" planet = every moon gold. Adds the gold ring.
    const isFullyMastered = masteredCount === planet.standards.length && planet.standards.length > 0
    const access = computePlanetAccess(planet, studentGrade, bridges, planetHasUnlocked)
    const outOfGrade = isOutOfGradeFilter(planet)

    let color: string
    if (colorMode === "mastery") {
      // Out-of-grade but accessible → purple. Out-of-grade & locked → very dim grey.
      if (outOfGrade) {
        color = access === "locked" ? "#262626" : MASTERY_COLORS.otherGrade
      } else {
        color = getMasteryColor({ unlockedCount, availableCount, inProgressCount, moonCount: planet.standards.length, isCompleted })
        if (access === "locked") color = "#333333"
      }
    } else {
      // Domain color, brighter baseline so planets are actually visible.
      // Locked planets are dim; everything else stays at full saturation
      // and only varies in glow when progress changes (handled elsewhere).
      let brightness = 0.95
      if (access === "locked") {
        brightness = 0.18
      } else if (isCompleted) {
        brightness = 1.0
      }
      // Dim out-of-grade planets when the grade filter is on
      if (outOfGrade) brightness *= 0.5

      const baseColor = planet.color
      const r = parseInt(baseColor.slice(1, 3), 16)
      const g = parseInt(baseColor.slice(3, 5), 16)
      const b = parseInt(baseColor.slice(5, 7), 16)
      color = `rgb(${Math.round(r * brightness)}, ${Math.round(g * brightness)}, ${Math.round(b * brightness)})`
    }

    // Locked or filtered-out planets are smaller
    const sizeMultiplier = access === "locked" ? 0.5 : (outOfGrade ? 0.55 : 1)

    return {
      id: planet.id,
      name: planet.domainName,
      grade: planet.grade,
      domainCode: planet.domainCode,
      gradeBand: planet.gradeBand,
      color,
      val: Math.max(planet.standards.length * 0.5, 2) * sizeMultiplier,
      moonCount: planet.standards.length,
      unlockedCount,
      availableCount,
      inProgressCount,
      actionableCount,
      isCompleted,
      isFullyMastered,
      access,
    }
  })

  const links: GalaxyLink[] = bridges.map(bridge => {
    const isLit = (planetHasUnlocked.get(bridge.sourcePlanetId) ?? false) &&
                  (planetHasUnlocked.get(bridge.targetPlanetId) ?? false)
    return {
      source: bridge.sourcePlanetId,
      target: bridge.targetPlanetId,
      edgeCount: bridge.edgeCount,
      isLit,
      color: isLit ? "rgba(96,165,250,0.6)" : "rgba(255,255,255,0.12)",
    }
  })

  return { nodes, links }
}

// Generate a short title from a standard description.
// Prefer the AI-generated name from moon-names.json if available; fall back
// to a heuristic that capitalises the first clause of the description.
function makeShortTitle(id: string, description: string): string {
  const aiName = NAMES[id]
  if (aiName) return aiName
  // Strip leading code patterns like "5.NBT.A.1 " or "(5.NBT.A.1)"
  const cleaned = description.replace(/^\(?\d*\.?[A-Z]+\.?[A-Z]*\.?\d*\.?\d*\)?\s*/i, "").trim()
  // Take first meaningful clause (up to first period, semicolon, or colon, max 40 chars)
  const first = cleaned.split(/[.;:]/)[0].trim()
  // Capitalise first letter
  const capitalised = first.charAt(0).toUpperCase() + first.slice(1)
  if (capitalised.length <= 40) return capitalised
  const cut = capitalised.slice(0, 37)
  const lastSpace = cut.lastIndexOf(" ")
  return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut) + "..."
}

// Build moon data for a specific planet
export function buildMoonData(
  planet: Planet,
  progressMap: Map<string, NodeStatus>
): MoonData[] {
  // Distribute moons across 3 orbit rings, then within each ring
  // give them an even angular spread AND a single shared rotation speed,
  // so two moons on the same ring never collide.
  const ringRadii = [25, 37, 49]
  const ringSpeeds = [0.30, 0.22, 0.16] // outer rings move slower (looks more realistic)
  const ringMembers: number[][] = [[], [], []]
  planet.standards.forEach((_, idx) => {
    ringMembers[idx % 3].push(idx)
  })

  // Build a per-index lookup of (ringIndex, positionInRing, ringSize)
  const placement = new Map<number, { ring: number; pos: number; size: number }>()
  ringMembers.forEach((members, ring) => {
    members.forEach((idx, pos) => {
      placement.set(idx, { ring, pos, size: members.length })
    })
  })

  return planet.standards.map((std, i) => {
    const status = progressMap.get(std.id) ?? "locked"
    const place = placement.get(i)!
    const orbitRadius = ringRadii[place.ring]
    const orbitSpeed = ringSpeeds[place.ring]
    // Even angular spacing within the ring; offset alternate rings so they
    // don't all start at angle 0.
    const orbitOffset = (place.pos / Math.max(place.size, 1)) * Math.PI * 2 + place.ring * 0.5

    // Moon colors mirror the "By progress" semantics so the student
    // gets the same visual language at the planet and moon level:
    //   locked            → grey
    //   available         → blue
    //   in_progress       → yellow
    //   in_review         → yellow (game submitted, waiting for guide)
    //   approved_unplayed → yellow (guide approved, win 3 in a row to demo)
    //   unlocked          → green (guide approved AND demonstrated)
    //   mastered          → gold
    let size: number
    let color: string

    switch (status) {
      case "locked":
        size = 1.5
        color = "rgba(120,120,120,0.35)"
        break
      case "available":
        size = 3
        color = "#3b82f6" // blue
        break
      case "in_progress":
        size = 3.5
        color = "#eab308" // yellow
        break
      case "in_review":
        size = 3.5
        color = "#a16207" // mustard — non-actionable, waiting on guide
        break
      case "approved_unplayed":
        size = 3.5
        color = "#eab308" // yellow — actionable (play to demonstrate)
        break
      case "unlocked":
        size = 3.5
        color = "#22c55e" // green
        break
      case "mastered":
        size = 4
        color = "#f59e0b" // gold
        break
    }

    return {
      id: std.id,
      description: std.description,
      shortTitle: makeShortTitle(std.id, std.description),
      status,
      orbitRadius,
      orbitSpeed,
      orbitOffset,
      size,
      color,
    }
  })
}
