import type { StandardsGraph, StandardNode, StandardEdge, NodeStatus } from "./graph-types"

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
  isCompleted: boolean
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
  status: NodeStatus
  orbitRadius: number
  orbitSpeed: number
  orbitOffset: number  // starting angle
  size: number
  color: string
}

// Domain color palette
const DOMAIN_COLORS: Record<string, string> = {
  "CC": "#f59e0b",
  "OA": "#f59e0b",
  "NBT": "#14b8a6",
  "NF": "#2dd4bf",
  "G": "#60a5fa",
  "MD": "#a78bfa",
  "RP": "#fb7185",
  "NS": "#14b8a6",
  "EE": "#fbbf24",
  "SP": "#86efac",
  "F": "#22d3ee",
  "A-SSE": "#eab308", "A-APR": "#eab308", "A-CED": "#eab308", "A-REI": "#eab308",
  "F-IF": "#22d3ee", "F-BF": "#22d3ee", "F-LE": "#22d3ee", "F-TF": "#22d3ee",
  "G-CO": "#60a5fa", "G-SRT": "#60a5fa", "G-C": "#60a5fa", "G-GPE": "#60a5fa", "G-GMD": "#60a5fa", "G-MG": "#60a5fa",
  "N-RN": "#14b8a6", "N-Q": "#14b8a6", "N-CN": "#14b8a6", "N-VM": "#14b8a6",
  "S-ID": "#86efac", "S-IC": "#86efac", "S-CP": "#86efac", "S-MD": "#86efac",
}

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

// Group standards into planets
export function buildPlanets(data: StandardsGraph): Planet[] {
  const planetMap = new Map<string, Planet>()

  for (const node of data.nodes) {
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
// working = "Progressing" (yellow), mastered = "Demonstrated" (green)
const MASTERY_COLORS = {
  locked: "#555555",     // grey — Not Started
  available: "#3b82f6",  // blue — Ready to Explore
  working: "#eab308",    // yellow — Progressing
  mastered: "#22c55e",   // green — Demonstrated
}

function getMasteryColor(planet: { unlockedCount: number; availableCount: number; moonCount: number; isCompleted: boolean }): string {
  if (planet.isCompleted) return MASTERY_COLORS.mastered
  if (planet.unlockedCount > 0) return MASTERY_COLORS.working
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
  studentGrade: string | null = null
): GalaxyData {
  // Pre-compute which planets have unlocked standards
  const planetHasUnlocked = new Map<string, boolean>()
  for (const planet of planets) {
    const hasUnlocked = planet.standards.some(s => progressMap.get(s.id) === "unlocked")
    planetHasUnlocked.set(planet.id, hasUnlocked)
  }

  const nodes: GalaxyNode[] = planets.map(planet => {
    let unlockedCount = 0
    let availableCount = 0
    for (const std of planet.standards) {
      const status = progressMap.get(std.id) ?? "locked"
      if (status === "unlocked") unlockedCount++
      if (status === "available") availableCount++
    }
    const isCompleted = unlockedCount === planet.standards.length && planet.standards.length > 0
    const access = computePlanetAccess(planet, studentGrade, bridges, planetHasUnlocked)

    let color: string
    if (colorMode === "mastery") {
      color = getMasteryColor({ unlockedCount, availableCount, moonCount: planet.standards.length, isCompleted })
      // Dim locked planets in mastery mode too
      if (access === "locked") color = "#333333"
    } else {
      // Domain color with brightness based on progress + access
      let brightness = 0.2
      if (access === "locked") {
        brightness = 0.08 // very dim for inaccessible planets
      } else if (access === "explorable" || access === "earned" || access === "home") {
        if (availableCount > 0) brightness = 0.5
        if (unlockedCount > 0) brightness = 0.6 + (unlockedCount / planet.standards.length) * 0.4
        if (isCompleted) brightness = 1.0
      }

      const baseColor = planet.color
      const r = parseInt(baseColor.slice(1, 3), 16)
      const g = parseInt(baseColor.slice(3, 5), 16)
      const b = parseInt(baseColor.slice(5, 7), 16)
      color = `rgb(${Math.round(r * brightness)}, ${Math.round(g * brightness)}, ${Math.round(b * brightness)})`
    }

    // Locked planets are smaller
    const sizeMultiplier = access === "locked" ? 0.5 : 1

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
      isCompleted,
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

// Build moon data for a specific planet
export function buildMoonData(
  planet: Planet,
  progressMap: Map<string, NodeStatus>
): MoonData[] {
  return planet.standards.map((std, i) => {
    const status = progressMap.get(std.id) ?? "locked"
    const total = planet.standards.length
    const orbitRadius = 25 + (i % 3) * 12  // 3 orbit rings
    const orbitSpeed = 0.2 + Math.random() * 0.3  // slightly different speeds
    const orbitOffset = (i / total) * Math.PI * 2  // spread evenly

    let size: number
    let color: string
    const baseColor = planet.color

    switch (status) {
      case "locked":
        size = 1.5
        color = "rgba(100,100,100,0.3)"
        break
      case "available":
        size = 3
        color = baseColor
        break
      case "in_progress":
        size = 3.5
        color = baseColor
        break
      case "unlocked":
        size = 2.5
        color = baseColor
        break
    }

    return {
      id: std.id,
      description: std.description,
      status,
      orbitRadius,
      orbitSpeed,
      orbitOffset,
      size,
      color,
    }
  })
}
