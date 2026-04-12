"use client"

import { useState, useEffect, useMemo } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import standardsData from "@/data/standards.json"
import moonNamesData from "@/data/moon-names.json"
import type { StandardsGraph } from "@/lib/graph-types"
import { isClusterNode, buildDuplicateParentSet, isValidMoon } from "@/lib/galaxy-utils"

const STANDARDS = standardsData as StandardsGraph
const MOON_NAMES = moonNamesData as Record<string, string>

const SHORT_DOMAIN: Record<string, string> = {
  CC: "Counting", OA: "Algebra", NBT: "Base Ten", NF: "Fractions",
  G: "Geometry", MD: "Measurement", RP: "Ratios", NS: "Numbers",
  EE: "Equations", SP: "Statistics", F: "Functions",
}

const STATUS_COLORS: Record<string, string> = {
  mastered: "bg-amber-500",
  unlocked: "bg-emerald-500",
  approved_unplayed: "bg-yellow-500",
  in_review: "bg-yellow-700",
  in_progress: "bg-yellow-500",
  available: "bg-blue-500",
  locked: "bg-zinc-700",
}

const STATUS_LABELS: Record<string, string> = {
  mastered: "Mastered",
  unlocked: "Demonstrated",
  approved_unplayed: "Approved — needs to play",
  in_review: "In review",
  in_progress: "In progress",
  available: "Ready to start",
  locked: "Locked",
}

interface LearnerProgressGridProps {
  uid: string
  grade: string
}

// Shows all planets for a grade with each moon as a colored dot.
// Click a planet to expand and see individual moon names + statuses.
export function LearnerProgressGrid({ uid, grade }: LearnerProgressGridProps) {
  const [progressMap, setProgressMap] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null)

  // Build prerequisite set for determining locked vs available
  const incomingPrereqs = useMemo(() => {
    const set = new Set<string>()
    for (const edge of STANDARDS.edges) {
      if (edge.type === "prerequisite") set.add(edge.target)
    }
    return set
  }, [])

  useEffect(() => {
    if (!uid) return
    setLoading(true)
    getDocs(collection(db, "progress", uid, "standards")).then((snap) => {
      const map = new Map<string, string>()
      snap.forEach((d) => {
        const data = d.data() as { status?: string }
        if (data.status) map.set(d.id, data.status)
      })
      setProgressMap(map)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [uid])

  const effectiveStatus = (nodeId: string): string => {
    const stored = progressMap.get(nodeId)
    if (stored) return stored
    if (!incomingPrereqs.has(nodeId)) return "available"
    const allMet = STANDARDS.edges
      .filter(e => e.type === "prerequisite" && e.target === nodeId)
      .every(e => {
        const s = progressMap.get(e.source)
        return s === "unlocked" || s === "mastered"
      })
    return allMet ? "available" : "locked"
  }

  type MoonInfo = { id: string; name: string; status: string }
  type PlanetInfo = { id: string; name: string; moons: MoonInfo[] }

  const planets: PlanetInfo[] = useMemo(() => {
    if (!grade) return []
    const groupMap = new Map<string, PlanetInfo>()
    const dupeParents = buildDuplicateParentSet(STANDARDS.nodes.map((n: any) => n.id))
    for (const node of STANDARDS.nodes) {
      if (!isValidMoon(node.id, dupeParents)) continue
      if (node.grade !== grade) continue
      const pid = `${node.grade}.${node.domainCode}`
      let group = groupMap.get(pid)
      if (!group) {
        group = { id: pid, name: SHORT_DOMAIN[node.domainCode] ?? node.domain, moons: [] }
        groupMap.set(pid, group)
      }
      group.moons.push({
        id: node.id,
        name: MOON_NAMES[node.id] ?? node.description,
        status: effectiveStatus(node.id),
      })
    }
    return Array.from(groupMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [grade, progressMap, incomingPrereqs])

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!grade) {
    return <p className="text-sm text-zinc-500">No grade set for this learner.</p>
  }

  return (
    <div className="space-y-2">
      {planets.map((planet) => {
        const demonstrated = planet.moons.filter(m => m.status === "unlocked" || m.status === "mastered").length
        const mastered = planet.moons.filter(m => m.status === "mastered").length
        const isExpanded = expandedPlanet === planet.id
        return (
          <div key={planet.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedPlanet(isExpanded ? null : planet.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-semibold text-white">{planet.name}</h4>
                {/* Mini moon dots */}
                <div className="flex items-center gap-0.5">
                  {planet.moons.map((m) => (
                    <div
                      key={m.id}
                      className={`w-2 h-2 rounded-full ${STATUS_COLORS[m.status] || "bg-zinc-700"}`}
                      title={`${m.name}: ${STATUS_LABELS[m.status] || m.status}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <span><span className="text-blue-400 font-semibold">{demonstrated}</span>/{planet.moons.length} demonstrated</span>
                {mastered > 0 && <span><span className="text-amber-400 font-semibold">{mastered}</span> mastered</span>}
                <svg className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-zinc-800 divide-y divide-zinc-800/50">
                {planet.moons.map((m) => (
                  <div key={m.id} className={`flex items-center gap-3 px-4 py-2.5 ${m.status === "locked" ? "opacity-50" : ""}`}>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_COLORS[m.status] || "bg-zinc-700"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{m.name}</p>
                      <p className="text-[11px] text-zinc-500">{m.id}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.status === "mastered" ? "bg-amber-500/20 text-amber-400" :
                      m.status === "unlocked" ? "bg-emerald-500/20 text-emerald-400" :
                      m.status === "available" ? "bg-blue-500/20 text-blue-400" :
                      m.status === "locked" ? "bg-zinc-700/50 text-zinc-500" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {STATUS_LABELS[m.status] || m.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-[10px] text-zinc-500">{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
