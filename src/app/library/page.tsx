import { GameLibrary } from "@/components/game/game-library"
import type { Game } from "@/lib/game-types"
import Link from "next/link"
import moonNames from "@/data/moon-names.json"
import { LearnerNav } from "@/components/learner-nav"
import { InfoButton } from "@/components/info-button"
import { UserMenu } from "@/components/user-menu"
import { getAdminDb } from "@/lib/firebase-admin"

const MOON_NAMES = moonNames as Record<string, string>

// Server-side fetch of all published games. We talk DIRECTLY to
// firebase-admin instead of going through /api/games because:
//   1. Avoids a self-fetch that requires knowing the deployment URL
//      (the old code used NEXT_PUBLIC_BASE_URL which fell back to
//      "http://localhost:3000" on Vercel — causing the library to
//      always return zero games in production).
//   2. One Firestore query is faster than HTTP round-trip + Firestore.
//   3. Same admin SDK and same query as /api/games — behavior is
//      identical, just no extra hop.
async function getPublishedGames(): Promise<Omit<Game, "gameHtml">[]> {
  try {
    const adminDb = getAdminDb()
    const snap = await adminDb
      .collection("games")
      .where("status", "==", "published")
      .get()
    const games = snap.docs.map((d) => {
      const data = d.data()
      const { gameHtml: _gameHtml, ...meta } = data
      return { ...meta, id: d.id } as Omit<Game, "gameHtml">
    })
    // Sort newest first by createdAt
    games.sort((a, b) => {
      const ta = typeof a.createdAt === "number" ? a.createdAt : 0
      const tb = typeof b.createdAt === "number" ? b.createdAt : 0
      return tb - ta
    })
    return games
  } catch (err) {
    console.error("[library/page] Failed to load published games:", err)
    return []
  }
}

interface LibraryPageProps {
  searchParams: Promise<{ skill?: string }>
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const { skill } = await searchParams
  const allGames = await getPublishedGames()
  const games = skill ? allGames.filter((g) => g.standardId === skill) : allGames
  const skillName = skill ? (MOON_NAMES[skill] ?? skill) : null

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      <LearnerNav />
      <div className="absolute top-4 right-4 z-20">
        <UserMenu />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8 pt-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            {skillName ? (
              <>
                <p className="text-xs text-blue-400 font-medium uppercase tracking-wide">
                  Games for skill · {skill}
                </p>
                <h1 className="text-2xl font-bold">Play to Master: {skillName}</h1>
                <p className="text-zinc-400 text-sm mt-1">
                  Every game below is about this specific skill. Win a few to show you&apos;ve got it.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">Game Library</h1>
                  <InfoButton title="Game Library">
                    <p>The <span className="text-zinc-200">Game Library</span> has every game approved by a guide.</p>
                    <p>Play other learners&apos; games to <span className="text-zinc-200">master</span> skills. Win 3 games on a skill to earn the gold star.</p>
                    <p>Rate games after playing — your feedback helps creators improve.</p>
                    <p className="text-zinc-500">Check the Ranking tab to see who&apos;s leading in tokens.</p>
                  </InfoButton>
                </div>
                <p className="text-zinc-400 text-sm mt-1">
                  Games built by learners, for learners
                </p>
              </>
            )}
          </div>
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Back to Galaxy
          </Link>
        </div>

        {/* Library grid */}
        {games.length === 0 && skillName ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
            <p className="text-zinc-400">No approved games for this skill yet.</p>
            <p className="text-zinc-500 text-sm mt-1">Be the first — go back and build one!</p>
          </div>
        ) : (
          <GameLibrary games={games} />
        )}
      </div>
    </div>
  )
}
