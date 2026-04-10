"use client"

import { useState, useEffect, useCallback } from "react"
import type { Game } from "@/lib/game-types"
import { useAuth } from "@/lib/auth"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { GameCard } from "./game-card"
import { GamePlayer } from "./game-player"
import { Leaderboard } from "./leaderboard"
import { Search } from "lucide-react"
import { useTokenConfig } from "@/lib/token-config"

interface GameLibraryProps {
  games: Omit<Game, "gameHtml">[]
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
  // Top-level tab — "For my grade" (default) or "All games"
  const [tab, setTab] = useState<"mine" | "all">(activeProfile?.grade ? "mine" : "all")
  // Search query — matches against title, designer name, concept, and
  // standard ID. Standard ID is matched both with AND without dots so
  // "kgb5" finds "K.G.B.5". Empty query disables the filter.
  const [search, setSearch] = useState<string>("")
  const [loading, setLoading] = useState<string | null>(null)
  const [pendingGames, setPendingGames] = useState<Omit<Game, "gameHtml">[]>([])

  const fetchPendingGames = useCallback(async () => {
    if (!activeProfile?.classId) return
    try {
      const q = query(
        collection(db, "games"),
        where("classId", "==", activeProfile.classId),
        where("status", "==", "pending_review")
      )
      const snap = await getDocs(q)
      const all = snap.docs.map(d => {
        const data = d.data()
        const { gameHtml: _, ...meta } = data
        return { ...meta, id: d.id } as Omit<Game, "gameHtml">
      })
      setPendingGames(all.filter(g => g.authorUid !== user?.uid))
    } catch {
      // Silent fail
    }
  }, [activeProfile?.classId, user?.uid])

  useEffect(() => {
    fetchPendingGames()
  }, [fetchPendingGames])

  // Extract unique grades from games
  const grades = Array.from(new Set(games.map((g) => {
    const parts = g.planetId?.split(".") || []
    return parts[0] || ""
  }).filter(Boolean))).sort()

  // First narrow by tab, THEN by grade chip filter, THEN by search.
  const myGrade = activeProfile?.grade
  const tabFiltered = tab === "mine" && myGrade
    ? games.filter((g) => g.planetId?.startsWith(myGrade + "."))
    : games
  const gradeFiltered = gradeFilter === "all" || tab === "mine"
    ? tabFiltered
    : tabFiltered.filter((g) => g.planetId?.startsWith(gradeFilter + "."))

  // Search filter — case-insensitive match against title, designer
  // name, math concept, and standard ID. The standard ID is matched
  // both raw ("K.G.B.5") and stripped of dots ("KGB5") so kids can
  // type either form.
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

  const handlePlay = async (gameId: string, isPending = false) => {
    setLoading(gameId)
    try {
      const snap = await getDoc(doc(db, "games", gameId))
      if (!snap.exists()) throw new Error("Game not found")
      const html = snap.data().gameHtml
      const allGames = isPending ? pendingGames : games
      const game = allGames.find((g) => g.id === gameId)
      setPlayingGame({
        id: gameId,
        title: game?.title || "Game",
        html,
        concept: game?.designDoc?.concept,
        isPendingReview: isPending,
        isPublished: !isPending && game?.status === "published",
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

  const handleReviewComplete = (approved: boolean) => {
    setPlayingGame(null)
    fetchPendingGames()
    // If approved, the game will appear in the published list on next page load
    if (approved) {
      // Could trigger a refresh of published games here if needed
    }
  }

  return (
    <div>
      {/* Top tabs — For my grade vs All games. Hidden if no grade picked. */}
      {myGrade && (
        <div className="flex gap-1 mb-4 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab("mine")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "mine"
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            For my grade ({myGrade})
          </button>
          <button
            onClick={() => setTab("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "all"
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All games
          </button>
        </div>
      )}

      {/* Search box — matches title, author, concept, and standard ID
          (with or without dots). Always visible, always searches the
          currently active tab+grade selection. */}
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

      {/* Needs Review section */}
      {pendingGames.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Needs Review ({pendingGames.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pendingGames.map((game) => (
              <div key={game.id} className="relative">
                <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-medium">
                  Needs Review
                </div>
                <GameCard game={game} onPlay={(id) => handlePlay(id, true)} />
                {loading === game.id && (
                  <div className="absolute inset-0 bg-zinc-950/50 rounded-xl flex items-center justify-center">
                    <div className="text-sm text-zinc-300">Loading...</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard — shown above the game grid on the All games tab.
          Hidden on the For-my-grade tab so the focused view stays clean. */}
      {tab === "all" && (
        <div className="mb-8">
          <Leaderboard myGrade={myGrade ?? ""} myUid={user?.uid} />
        </div>
      )}

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
                No games for grade {myGrade} yet
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

      {/* Game player modal */}
      {playingGame && (
        <GamePlayer
          gameId={playingGame.id}
          title={playingGame.title}
          html={playingGame.html}
          concept={playingGame.concept}
          onClose={() => setPlayingGame(null)}
          isPendingReview={playingGame.isPendingReview}
          isPublished={playingGame.isPublished}
          standardId={playingGame.standardId}
          authorUid={playingGame.authorUid}
          authorName={playingGame.authorName}
          reviewerUid={user?.uid}
          reviewerName={activeProfile?.name}
          onReviewComplete={playingGame.isPendingReview ? handleReviewComplete : undefined}
          onUnapproved={() => setPlayingGame(null)}
        />
      )}
    </div>
  )
}
