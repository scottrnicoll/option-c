"use client"

import { useState } from "react"
import type { Game } from "@/lib/game-types"
import { useAuth } from "@/lib/auth"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { GameCard } from "./game-card"
import { GamePlayer } from "./game-player"
import { Leaderboard } from "./leaderboard"
import { Search } from "lucide-react"
import { useTokenConfig } from "@/lib/token-config"
import posthog from "posthog-js"

interface GameLibraryProps {
  games: Omit<Game, "gameHtml">[]
}

function formatGrade(grade: string): string {
  if (grade === "K") return "K"
  if (grade === "HS") return "HS"
  const n = parseInt(grade)
  if (isNaN(n)) return grade
  if (n === 1) return "1st"
  if (n === 2) return "2nd"
  if (n === 3) return "3rd"
  return `${n}th`
}

export function GameLibrary({ games }: GameLibraryProps) {
  const { user, profile, activeProfile } = useAuth()
  const { gameApproved: tokenGameApproved } = useTokenConfig()
  const [playingGame, setPlayingGame] = useState<{
    id: string
    title: string
    html: string
    concept?: string
    isPendingReview?: boolean
    isPublished?: boolean
    standardId?: string
    authorName?: string
    authorUid?: string
  } | null>(null)
  const [gradeFilter, setGradeFilter] = useState<string>("all")
  const myGrade = activeProfile?.grade
  const [tab, setTab] = useState<"mine" | "all" | "ranking">(myGrade ? "mine" : "all")
  const [search, setSearch] = useState<string>("")
  const [loading, setLoading] = useState<string | null>(null)

  // Extract unique grades from games
  const grades = Array.from(new Set(games.map((g) => {
    const parts = g.planetId?.split(".") || []
    return parts[0] || ""
  }).filter(Boolean))).sort()

  // First narrow by tab, THEN by grade chip filter, THEN by search.
  const tabFiltered = tab === "mine" && myGrade
    ? games.filter((g) => g.planetId?.startsWith(myGrade + "."))
    : games
  const gradeFiltered = gradeFilter === "all" || tab === "mine"
    ? tabFiltered
    : tabFiltered.filter((g) => g.planetId?.startsWith(gradeFilter + "."))

  // Search filter
  const searchNormalized = search.trim().toLowerCase()
  const searchNoDots = searchNormalized.replace(/\./g, "")
  const filtered = !searchNormalized
    ? gradeFiltered
    : gradeFiltered.filter((g) => {
        const haystacks: string[] = []
        if (g.title) haystacks.push(g.title.toLowerCase())
        if (g.designerName) haystacks.push(g.designerName.toLowerCase())
        if (g.designDoc?.concept) haystacks.push(g.designDoc.concept.toLowerCase())
        if (g.standardId) {
          haystacks.push(g.standardId.toLowerCase())
          haystacks.push(g.standardId.toLowerCase().replace(/\./g, ""))
        }
        return haystacks.some((h) => h.includes(searchNormalized) || h.includes(searchNoDots))
      })

  const handlePlay = async (gameId: string) => {
    setLoading(gameId)
    const game = games.find((g) => g.id === gameId)
    posthog.capture("game_library_game_selected", { game_id: gameId, standard_id: game?.standardId })
    try {
      const snap = await getDoc(doc(db, "games", gameId))
      if (!snap.exists()) throw new Error("Game not found")
      const html = snap.data().gameHtml
      setPlayingGame({
        id: gameId,
        title: game?.title || "Game",
        html,
        concept: game?.designDoc?.concept,
        isPublished: game?.status === "published",
        standardId: game?.standardId,
        authorName: game?.designerName,
        authorUid: game?.authorUid,
      })
    } catch {
      // Silent fail
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      {/* Top tabs */}
      <div className="flex gap-1 mb-4 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {myGrade && (
          <button
            onClick={() => { setTab("mine"); posthog.capture("game_library_tab_switched", { tab_name: "mine" }) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "mine"
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            For my grade ({formatGrade(myGrade)})
          </button>
        )}
        <button
          onClick={() => { setTab("all"); posthog.capture("game_library_tab_switched", { tab_name: "all" }) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "all"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          All games
        </button>
        <button
          onClick={() => { setTab("ranking"); posthog.capture("game_library_tab_switched", { tab_name: "ranking" }) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "ranking"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Ranking
        </button>
      </div>

      {/* Ranking tab */}
      {tab === "ranking" && (
        <Leaderboard myGrade={myGrade ?? ""} myUid={user?.uid} />
      )}

      {/* Game tabs (mine / all) */}
      {tab !== "ranking" && (
        <>
          {/* Search box */}
          <div className="mb-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or standard (e.g. KGB5)"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 px-2 py-0.5"
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter controls — only meaningful when viewing All games */}
          {tab === "all" && (
            <div className="flex gap-2 mb-6 flex-wrap">
              <button
                onClick={() => setGradeFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  gradeFilter === "all"
                    ? "bg-zinc-700 text-white"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                All Grades
              </button>
              {grades.map((grade) => (
                <button
                  key={grade}
                  onClick={() => setGradeFilter(grade)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    gradeFilter === grade
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                  }`}
                >
                  Grade {grade}
                </button>
              ))}
            </div>
          )}

          {/* Game grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 px-6">
              {tab === "mine" && myGrade ? (
                <div className="max-w-md mx-auto space-y-4">
                  <div className="text-5xl">🚀</div>
                  <h3 className="text-xl font-bold text-white">
                    No games for grade {formatGrade(myGrade)} yet
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Be the first to build one! Pick a moon on your grade level from the galaxy and create a game that demonstrates the math skill. You&apos;ll earn {tokenGameApproved} tokens when your guide approves it.
                  </p>
                  <a
                    href="/"
                    className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg px-5 py-2.5 mt-2 transition-colors"
                  >
                    Go to the galaxy →
                  </a>
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">No games published yet. Be the first!</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((game) => (
                <div key={game.id} className="relative">
                  <GameCard game={game} onPlay={handlePlay} />
                  {loading === game.id && (
                    <div className="absolute inset-0 bg-zinc-950/50 rounded-xl flex items-center justify-center">
                      <div className="text-sm text-zinc-300">Loading...</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Game player modal */}
      {playingGame && (
        <GamePlayer
          gameId={playingGame.id}
          title={playingGame.title}
          html={playingGame.html}
          concept={playingGame.concept}
          onClose={() => setPlayingGame(null)}
          isPublished={playingGame.isPublished}
          standardId={playingGame.standardId}
          authorUid={playingGame.authorUid}
          authorName={playingGame.authorName}
          onUnapproved={() => setPlayingGame(null)}
        />
      )}
    </div>
  )
}
