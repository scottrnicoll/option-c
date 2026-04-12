"use client"

import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Trophy, Crown } from "lucide-react"

// Leaderboard panel for the game library.
//
// Shows two things:
//   1. The overall TOP 3 PODIUM — the three learners with the most
//      tokens across all grades. Rendered as a 2nd / 1st / 3rd
//      podium (1st in the middle, biggest).
//   2. A per-grade TOP 10 list — the current learner's grade by
//      default, switchable via tabs.
//
// Both queries hit the `users` collection filtered by role=student.
// Tokens are stored on the user doc directly so the queries are
// cheap (no progress aggregation needed).
//
// We deliberately do NOT show the current learner's own rank if
// they're outside the top 10 — the goal is to show kids "look at
// the kids ahead of you" not "you're 47th, womp womp."

interface LeaderRow {
  uid: string
  name: string
  grade: string
  tokens: number
}

interface LeaderboardProps {
  // The current learner's grade — used as the default for the
  // per-grade panel. Pass empty string to default to "All grades".
  myGrade: string
  // Optional: highlight the current learner's row when they appear.
  myUid?: string
}

export function Leaderboard({ myGrade, myUid }: LeaderboardProps) {
  const [topThree, setTopThree] = useState<LeaderRow[]>([])
  const [gradeRows, setGradeRows] = useState<LeaderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGrade, setSelectedGrade] = useState<string>(myGrade || "all")
  const [availableGrades, setAvailableGrades] = useState<string[]>([])

  // Fetch the overall top 3 (any grade) once on mount.
  // We do client-side sort instead of Firestore orderBy because
  // combining where(role) + orderBy(tokens) requires a composite
  // index in Firestore that we don't deploy by default. Class sizes
  // are small (< few hundred) so client-side sort is imperceptible.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const all = await getDocs(
          query(collection(db, "users"), where("role", "==", "student"))
        )
        if (cancelled) return
        const rows: LeaderRow[] = all.docs.map((d) => {
          const data = d.data() as { name?: string; grade?: string; tokens?: number; lifetimeTokens?: number }
          return {
            uid: d.id,
            name: data.name ?? "Unknown",
            grade: data.grade ?? "",
            tokens: data.lifetimeTokens ?? data.tokens ?? 0,
          }
        })
        rows.sort((a, b) => b.tokens - a.tokens)
        setTopThree(rows.slice(0, 3))
      } catch (err) {
        console.warn("[leaderboard] top-3 query failed:", err)
        // Silent fail — leaderboard is non-critical
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Fetch per-grade top 10 when grade selection changes.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        // We do this client-side filter because composite indexes
        // for grade+role+tokens-desc would need separate Firestore
        // index deployment. Fine for class sizes < ~200.
        const all = await getDocs(
          query(collection(db, "users"), where("role", "==", "student"))
        )
        if (cancelled) return
        const rows: LeaderRow[] = all.docs.map((d) => {
          const data = d.data() as { name?: string; grade?: string; tokens?: number; lifetimeTokens?: number }
          return {
            uid: d.id,
            name: data.name ?? "Unknown",
            grade: data.grade ?? "",
            tokens: data.lifetimeTokens ?? data.tokens ?? 0,
          }
        })
        // Discover the set of grades present
        const grades = Array.from(new Set(rows.map((r) => r.grade).filter(Boolean))).sort()
        setAvailableGrades(grades)
        // Filter by selected grade
        const filtered =
          selectedGrade === "all"
            ? rows
            : rows.filter((r) => r.grade === selectedGrade)
        filtered.sort((a, b) => b.tokens - a.tokens)
        setGradeRows(filtered.slice(0, 10))
      } catch (err) {
        console.warn("[leaderboard] grade query failed:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedGrade])

  if (loading && topThree.length === 0 && gradeRows.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-zinc-400 mt-3">Loading leaderboard...</p>
      </div>
    )
  }

  if (topThree.length === 0 && gradeRows.length === 0) {
    return null // No data yet — hide silently
  }

  return (
    <div className="space-y-6">
      {/* PODIUM — top 3 overall */}
      {topThree.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
            <Crown className="size-4 text-amber-400" />
            Top 3 of all time
          </h3>
          <Podium rows={topThree} myUid={myUid} />
        </div>
      )}

      {/* PER-GRADE TOP 10 */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Trophy className="size-4 text-amber-400" />
            Top 10
          </h3>
          {availableGrades.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setSelectedGrade("all")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  selectedGrade === "all"
                    ? "bg-zinc-700 text-white"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                All grades
              </button>
              {availableGrades.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    selectedGrade === g
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                  }`}
                >
                  Grade {g}
                </button>
              ))}
            </div>
          )}
        </div>
        {gradeRows.length === 0 ? (
          <p className="text-sm text-zinc-500">No learners yet at this grade.</p>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-xs">
                  <th className="text-left px-3 py-2 font-medium w-12">#</th>
                  <th className="text-left px-3 py-2 font-medium">Learner</th>
                  <th className="text-left px-3 py-2 font-medium">Grade</th>
                  <th className="text-right px-3 py-2 font-medium">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {gradeRows.map((row, i) => {
                  const isMe = myUid && row.uid === myUid
                  return (
                    <tr
                      key={row.uid}
                      className={`border-b border-zinc-800/50 ${
                        isMe ? "bg-blue-500/10" : ""
                      }`}
                    >
                      <td className="px-3 py-2 text-zinc-500 font-mono">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2 text-white">
                        {row.name}
                        {isMe && (
                          <span className="ml-2 text-[10px] text-blue-300 uppercase tracking-wide">
                            you
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-zinc-400">{row.grade || "-"}</td>
                      <td className="px-3 py-2 text-right text-amber-400 font-mono">
                        {row.tokens}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// 3-position podium with 1st in the middle, biggest. 2nd on the
// left (slightly shorter), 3rd on the right (shortest).
function Podium({ rows, myUid }: { rows: LeaderRow[]; myUid?: string }) {
  // Re-order rows for visual layout: [2nd, 1st, 3rd]
  const podiumOrder = [
    rows[1] ?? null,
    rows[0] ?? null,
    rows[2] ?? null,
  ]
  const heights = ["h-20", "h-28", "h-16"]
  const ranks = [2, 1, 3]
  const colors = [
    "bg-zinc-700/40 border-zinc-500/40",
    "bg-amber-500/20 border-amber-400/50",
    "bg-orange-700/30 border-orange-600/40",
  ]
  const trophies = ["🥈", "🥇", "🥉"]

  return (
    <div className="flex items-end justify-center gap-3 max-w-md mx-auto">
      {podiumOrder.map((row, i) => {
        const rank = ranks[i]
        const isMe = !!myUid && row?.uid === myUid
        return (
          <div key={i} className="flex flex-col items-center flex-1 max-w-[120px]">
            {/* Avatar bubble + name + tokens */}
            <div className="text-center mb-2 min-h-[68px] flex flex-col items-center justify-end">
              <div className="text-3xl mb-1">{trophies[i]}</div>
              {row ? (
                <>
                  <p className={`text-xs font-bold leading-tight ${isMe ? "text-blue-300" : "text-white"}`}>
                    {row.name}
                    {isMe && <span className="block text-[9px] text-blue-400 uppercase tracking-wide">you</span>}
                  </p>
                  <p className="text-[10px] text-amber-400 font-mono">
                    {row.tokens}
                  </p>
                </>
              ) : (
                <p className="text-xs text-zinc-600">—</p>
              )}
            </div>
            {/* Podium block */}
            <div
              className={`w-full ${heights[i]} ${colors[i]} border-2 rounded-t-lg flex items-start justify-center pt-2`}
            >
              <span className="text-xl font-bold text-white">{rank}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
