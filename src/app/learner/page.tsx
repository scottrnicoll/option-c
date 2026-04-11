"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import type { Game } from "@/lib/game-types"
import { Bell, Play, MessageCircle, Hammer, Trophy, Lock, CheckCircle, Star, Clock } from "lucide-react"
import { GamePlayer } from "@/components/game/game-player"
import { FeedbackInbox } from "@/components/feedback/feedback-inbox"
import { UserMenu } from "@/components/user-menu"
import standardsData from "@/data/standards.json"
import moonNames from "@/data/moon-names.json"
import type { StandardsGraph } from "@/lib/graph-types"
import { isClusterNode } from "@/lib/galaxy-utils"
import { Logo } from "@/components/logo"
import { LearnerNav } from "@/components/learner-nav"
import { InfoButton } from "@/components/info-button"
import { WeeklyProgressChart } from "@/components/weekly-progress-chart"

const MOON_NAMES = moonNames as Record<string, string>
const STANDARDS = standardsData as StandardsGraph

// Friendly short names per domain code
const SHORT_DOMAIN: Record<string, string> = {
  "CC": "Counting",
  "OA": "Algebra",
  "NBT": "Base Ten",
  "NF": "Fractions",
  "G": "Geometry",
  "MD": "Measurement",
  "RP": "Ratios",
  "NS": "Numbers",
  "EE": "Equations",
  "SP": "Statistics",
  "F": "Functions",
}

export default function LearnerDashboard() {
  const { activeProfile, loadProgress } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [progressStats, setProgressStats] = useState({ unlocked: 0, mastered: 0, inReview: 0 })
  const [progressByStandard, setProgressByStandard] = useState<Map<string, string>>(new Map())
  const [previewGame, setPreviewGame] = useState<Game | null>(null)
  // Class name for the "Class: ___" tag at the top of My Stuff. Loaded
  // separately because the class lives in its own collection and the
  // user profile only stores the classId.
  const [className, setClassName] = useState<string | null>(null)
  const [classmates, setClassmates] = useState<{ uid: string; name: string }[]>([])

  useEffect(() => {
    if (!activeProfile?.uid) return
    loadData()
  }, [activeProfile?.uid])

  // Fetch the learner's class name once the profile is loaded.
  useEffect(() => {
    if (!activeProfile?.classId) {
      setClassName(null)
      return
    }
    let cancelled = false
    import("firebase/firestore").then(({ doc, getDoc }) => {
      getDoc(doc(db, "classes", activeProfile.classId!))
        .then((snap) => {
          if (cancelled) return
          if (snap.exists()) {
            const data = snap.data() as { name?: string }
            setClassName(data.name ?? null)
          }
        })
        .catch(() => {
          // Silent — class name is decorative, don't block the UI
        })
    })
    return () => {
      cancelled = true
    }
  }, [activeProfile?.classId])

  // Fetch classmates for the progress chart
  useEffect(() => {
    if (!activeProfile?.classId || !activeProfile?.uid) return
    getDocs(query(collection(db, "users"), where("classId", "==", activeProfile.classId), where("role", "==", "student")))
      .then(snap => {
        setClassmates(snap.docs.map(d => {
          const data = d.data()
          return { uid: d.id, name: data.name || "Unknown" }
        }))
      })
      .catch(() => {})
  }, [activeProfile?.classId, activeProfile?.uid])

  async function loadData() {
    setLoading(true)
    try {
      const gamesQuery = query(
        collection(db, "games"),
        where("authorUid", "==", activeProfile!.uid)
      )
      const gamesSnap = await getDocs(gamesQuery)
      const allGames = gamesSnap.docs
        .map(d => ({ ...d.data(), id: d.id }) as Game)
        .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))

      // Deduplicate: if there are multiple docs for the same standard
      // (a known bug from earlier versions), keep the most "advanced"
      // one (published > pending_review > needs_work > draft) and break
      // ties by most recently updated.
      const statusRank: Record<string, number> = {
        published: 4,
        pending_review: 3,
        needs_work: 2,
        draft: 1,
      }
      const bestByStandard = new Map<string, Game>()
      for (const g of allGames) {
        const existing = bestByStandard.get(g.standardId)
        if (!existing) {
          bestByStandard.set(g.standardId, g)
          continue
        }
        const newRank = statusRank[g.status] ?? 0
        const existingRank = statusRank[existing.status] ?? 0
        if (newRank > existingRank) {
          bestByStandard.set(g.standardId, g)
        } else if (newRank === existingRank) {
          const newTs = g.updatedAt || g.createdAt || 0
          const existingTs = existing.updatedAt || existing.createdAt || 0
          if (newTs > existingTs) bestByStandard.set(g.standardId, g)
        }
      }
      const gameList = Array.from(bestByStandard.values()).sort(
        (a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
      )
      setGames(gameList)

      const progress = await loadProgress()
      // "Demonstrated" = green moon. Both "unlocked" and "mastered" count.
      let demonstrated = 0, mastered = 0, inProgress = 0
      const standardStatusMap = new Map<string, string>()
      progress.forEach((p, id) => {
        standardStatusMap.set(id, p.status)
        if (p.status === "unlocked" || p.status === "mastered") demonstrated++
        if (p.status === "mastered") mastered++
        if (p.status === "in_review" || p.status === "approved_unplayed" || p.status === "in_progress") inProgress++
      })
      setProgressStats({ unlocked: demonstrated, mastered, inReview: inProgress })
      setProgressByStandard(standardStatusMap)
    } catch (err) {
      console.error("Learner dashboard load error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Build the planet → moons overview for the learner's grade. Each
  // moon shows a status + the appropriate action button.
  type MoonRow = {
    id: string
    title: string // friendly short name
    status: string // available | in_progress | in_review | approved_unplayed | unlocked | mastered | locked
    game: Game | null // the learner's own game for this moon, if any
  }
  type PlanetGroup = {
    planetId: string
    planetName: string
    moons: MoonRow[]
  }

  const planetGroups: PlanetGroup[] = useMemo(() => {
    const grade = activeProfile?.grade
    if (!grade) return []

    // Build a set of standards that have incoming prerequisite edges
    // (these start as "locked" unless progress says otherwise)
    const incomingPrereqs = new Set<string>()
    for (const edge of STANDARDS.edges) {
      if (edge.type === "prerequisite") {
        incomingPrereqs.add(edge.target)
      }
    }

    // Determine effective status: if the progress system has a status,
    // use it. Otherwise, check if the standard has prerequisites — if
    // yes, it's locked; if no, it's available (entry point).
    // Additionally, for locked standards whose prereqs are all met,
    // upgrade to available.
    const effectiveStatus = (nodeId: string): string => {
      const stored = progressByStandard.get(nodeId)
      if (stored) return stored
      // No progress entry — check prerequisites
      if (!incomingPrereqs.has(nodeId)) return "available"
      // Has prerequisites — check if they're all met
      const allPrereqsMet = STANDARDS.edges
        .filter(e => e.type === "prerequisite" && e.target === nodeId)
        .every(e => {
          const s = progressByStandard.get(e.source)
          return s === "unlocked" || s === "mastered"
        })
      return allPrereqsMet ? "available" : "locked"
    }

    const gameByStandard = new Map(games.map((g) => [g.standardId, g]))
    const groupMap = new Map<string, PlanetGroup>()

    for (const node of STANDARDS.nodes) {
      if (isClusterNode(node.id)) continue
      if (node.grade !== grade) continue

      const planetId = `${node.grade}.${node.domainCode}`
      const planetName = SHORT_DOMAIN[node.domainCode] ?? node.domain

      let group = groupMap.get(planetId)
      if (!group) {
        group = { planetId, planetName, moons: [] }
        groupMap.set(planetId, group)
      }

      const status = effectiveStatus(node.id)
      group.moons.push({
        id: node.id,
        title: MOON_NAMES[node.id] ?? node.description,
        status,
        game: gameByStandard.get(node.id) ?? null,
      })
    }
    return Array.from(groupMap.values()).sort((a, b) =>
      a.planetName.localeCompare(b.planetName)
    )
  }, [activeProfile?.grade, games, progressByStandard])

  // Sort moons inside each planet by priority: need to demonstrate first,
  // then in review, then approved_unplayed, then demonstrated, then mastered,
  // then locked.
  const STATUS_PRIORITY: Record<string, number> = {
    available: 1,
    in_progress: 2,
    in_review: 3,
    approved_unplayed: 4,
    unlocked: 5,
    mastered: 6,
    locked: 99,
  }

  if (!activeProfile) return null

  const notifications: { text: string; type: "success" | "info" }[] = []
  const approvedGames = games.filter(g => g.status === "published")
  for (const g of approvedGames) {
    notifications.push({ text: `Your game "${g.title}" was approved!`, type: "success" })
  }
  const pendingCount = games.filter(g => g.status === "pending_review").length
  if (pendingCount > 0) {
    notifications.push({
      text: `${pendingCount} game${pendingCount > 1 ? "s" : ""} waiting for review`,
      type: "info",
    })
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "draft": return { text: "Draft", className: "bg-zinc-700 text-zinc-300" }
      case "pending_review": return { text: "Pending Review", className: "bg-amber-500/20 text-amber-400" }
      case "published": return { text: "Approved", className: "bg-emerald-500/20 text-emerald-400" }
      case "needs_work": return { text: "Needs Work", className: "bg-red-500/20 text-red-400" }
      default: return { text: status, className: "bg-zinc-700 text-zinc-300" }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={28} className="text-blue-400" />
            <h1 className="text-lg font-bold text-white">Diagonally</h1>
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-medium">
              Learner
            </span>
          </div>
          <UserMenu />
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <LearnerNav />
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Hey {activeProfile.name}</h1>
            <InfoButton title="My Stuff">
              <p><span className="text-zinc-200">My Stuff</span> is your personal dashboard.</p>
              <p>Track your progress: skills demonstrated, skills mastered, and tokens earned.</p>
              <p>See all planets and moons for your grade, color-coded by status.</p>
              <p className="text-zinc-500">Your inbox shows messages from guides and other learners about your games.</p>
            </InfoButton>
          </div>
          {className && (
            <p className="text-xs text-zinc-500 mt-0.5">
              Class:{" "}
              <span className="text-zinc-300 font-medium">{className}</span>
            </p>
          )}
        </div>
      </div>

      {/* Personal code — so the learner can write it down if they forgot */}
      {activeProfile.personalCode && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-xs text-amber-300 font-medium uppercase tracking-wide">
            Your personal code
          </p>
          <p className="text-2xl font-mono font-bold text-white tracking-widest mt-1">
            {activeProfile.personalCode}
          </p>
          <p className="text-xs text-zinc-400 mt-2">
            Write this down. Next time you sign in, use your name + this code to come back to your progress.
          </p>
        </div>
      )}


      {/* Progress Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-blue-400">{progressStats.unlocked}</p>
          <p className="text-xs text-zinc-400 mt-1">Skills Demonstrated</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-emerald-400">{progressStats.mastered}</p>
          <p className="text-xs text-zinc-400 mt-1">Skills Mastered</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-amber-400">{activeProfile.tokens}</p>
          <p className="text-xs text-zinc-400 mt-1">Tokens</p>
        </div>
      </div>

      {/* Weekly progress chart — me vs classmates */}
      {classmates.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Trophy className="size-4" /> My Progress vs Class
          </h2>
          <WeeklyProgressChart learners={classmates} highlightUid={activeProfile.uid} />
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Bell className="size-4" /> Notifications
          </h2>
          {notifications.map((n, i) => (
            <div
              key={i}
              className={`rounded-lg px-4 py-3 text-sm ${
                n.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  : "bg-blue-500/10 border border-blue-500/20 text-blue-300"
              }`}
            >
              {n.text}
            </div>
          ))}
        </div>
      )}

      {/* Grade overview — every planet on your grade with all its moons */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Trophy className="size-4" /> Grade {activeProfile.grade}
          <span className="text-zinc-500 text-xs font-normal">
            · Every planet and moon on your grade
          </span>
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !activeProfile.grade ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-400 text-sm">Pick a grade to see your planets.</p>
          </div>
        ) : planetGroups.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-400 text-sm">No planets found for your grade.</p>
          </div>
        ) : (
          planetGroups.map((group) => {
            const sortedMoons = [...group.moons].sort(
              (a, b) => (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99)
            )
            // Split into the buildable (prereqs met) moons and the locked
            // ones so we can render a "Locked" subheader between them.
            const buildable = sortedMoons.filter((m) => m.status !== "locked")
            const locked = sortedMoons.filter((m) => m.status === "locked")
            const greenCount = group.moons.filter(
              (m) => m.status === "unlocked" || m.status === "mastered"
            ).length
            return (
              <div
                key={group.planetId}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                  <h3 className="text-sm font-bold text-white">{group.planetName}</h3>
                  <span className="text-xs text-zinc-400">
                    {greenCount}/{group.moons.length} demonstrated
                  </span>
                </div>
                <div className="divide-y divide-zinc-800">
                  {buildable.map((moon) => (
                    <MoonRow
                      key={moon.id}
                      moon={moon}
                      onPlayGame={(g) => setPreviewGame(g)}
                    />
                  ))}
                </div>
                {locked.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-zinc-900/30 border-t border-zinc-800 flex items-center gap-2">
                      <Lock className="size-3 text-zinc-500" />
                      <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">
                        Locked — finish their prerequisites first
                      </span>
                    </div>
                    <div className="divide-y divide-zinc-800">
                      {locked.map((moon) => (
                        <MoonRow
                          key={moon.id}
                          moon={moon}
                          onPlayGame={(g) => setPreviewGame(g)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>
      {/* Inbox: messages from other players, plus replies to my own feedback */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <MessageCircle className="size-4" /> Inbox
        </h2>
        <FeedbackInbox mode="received" />
      </div>

      {/* Sent messages (with admin/peer replies) */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <MessageCircle className="size-4" /> Sent
        </h2>
        <FeedbackInbox mode="sent" />
      </div>

      {/* Full GamePlayer — same controls as the library/galaxy: Play again,
          Rate, Back, mandatory rating modal, etc. The learner can play
          their own game (own plays don't trigger rating). */}
      {previewGame && (
        <GamePlayer
          gameId={previewGame.id}
          title={previewGame.title}
          html={previewGame.gameHtml}
          concept={previewGame.designDoc?.concept}
          authorUid={previewGame.authorUid}
          standardId={previewGame.standardId}
          isPublished={previewGame.status === "published"}
          onClose={() => setPreviewGame(null)}
        />
      )}

      </div>
    </div>
  )
}

// One row per moon. Shows the moon name + status badge + the action
// button matching the current state.
function MoonRow({
  moon,
  onPlayGame,
}: {
  moon: {
    id: string
    title: string
    status: string
    game: Game | null
  }
  onPlayGame: (g: Game) => void
}) {
  const status = moon.status

  // Pick the right icon, dot color, and badge label per status
  const meta = (() => {
    switch (status) {
      case "available":
        return { dot: "bg-blue-500", label: "Need to demonstrate", labelClass: "text-blue-300" }
      case "in_progress":
        return { dot: "bg-yellow-500", label: "In progress", labelClass: "text-yellow-300" }
      case "in_review":
        return { dot: "bg-yellow-500", label: "In review by guide", labelClass: "text-yellow-300" }
      case "approved_unplayed":
        return { dot: "bg-yellow-500", label: "Approved · play 3 in a row to demonstrate", labelClass: "text-yellow-300" }
      case "unlocked":
        return { dot: "bg-emerald-500", label: "Demonstrated · play other learners' games to master", labelClass: "text-emerald-300" }
      case "mastered":
        return { dot: "bg-amber-500", label: "Mastered", labelClass: "text-amber-300" }
      case "locked":
        return { dot: "bg-zinc-700", label: "Locked", labelClass: "text-zinc-500" }
      default:
        return { dot: "bg-zinc-700", label: status, labelClass: "text-zinc-400" }
    }
  })()

  // Pick the right action button per status
  const action = (() => {
    if (status === "locked") {
      // Same shape as the active Build game button so the layout lines
      // up, but greyed out and labeled "Locked".
      return (
        <button
          disabled
          title="Locked — finish its prerequisites first"
          className="flex items-center gap-1.5 bg-zinc-800 text-zinc-500 text-xs font-semibold rounded-md px-3 py-1.5 cursor-not-allowed border border-zinc-700/60"
        >
          <Lock className="size-3.5" />
          Locked
        </button>
      )
    }
    if (status === "available") {
      // No game yet → build one
      return (
        <Link
          href={`/?moon=${encodeURIComponent(moon.id)}`}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md px-3 py-1.5 transition-colors"
        >
          <Hammer className="size-3.5" />
          Build game
        </Link>
      )
    }
    if (status === "in_progress" || status === "in_review") {
      if (moon.game) {
        return (
          <button
            onClick={() => onPlayGame(moon.game!)}
            className="flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-semibold rounded-md px-3 py-1.5 transition-colors"
          >
            <Clock className="size-3.5" />
            View game
          </button>
        )
      }
      return (
        <Link
          href={`/?moon=${encodeURIComponent(moon.id)}`}
          className="flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-semibold rounded-md px-3 py-1.5 transition-colors"
        >
          <Hammer className="size-3.5" />
          Continue
        </Link>
      )
    }
    if (status === "approved_unplayed" && moon.game) {
      return (
        <button
          onClick={() => onPlayGame(moon.game!)}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-md px-3 py-1.5 transition-colors"
        >
          <Play className="size-3.5" />
          Play game
        </button>
      )
    }
    if (status === "unlocked") {
      return (
        <Link
          href={`/library?skill=${encodeURIComponent(moon.id)}`}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md px-3 py-1.5 transition-colors"
        >
          <Star className="size-3.5" />
          Play to master
        </Link>
      )
    }
    if (status === "mastered") {
      return (
        <span className="flex items-center gap-1.5 text-amber-300 text-xs font-semibold">
          <CheckCircle className="size-3.5" />
          Mastered
        </span>
      )
    }
    return null
  })()

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 ${status === "locked" ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${meta.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{moon.title}</p>
          <p className={`text-xs mt-0.5 ${meta.labelClass}`}>{meta.label}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}
