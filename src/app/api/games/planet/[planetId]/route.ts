import { getAdminDb } from "@/lib/firebase-admin"

// NOTE: deliberately no orderBy in the Firestore query — combining
// where(...) + orderBy(...) requires a Firestore composite index, and
// if the index hasn't been deployed for the project the query silently
// returns nothing. We sort client-side instead. Same fix as /api/games.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ planetId: string }> }
) {
  try {
    const { planetId } = await params

    const adminDb = getAdminDb()
    const snap = await adminDb
      .collection("games")
      .where("planetId", "==", planetId)
      .where("status", "==", "published")
      .get()

    const games = snap.docs.map((d) => {
      const data = d.data()
      const { gameHtml: _gameHtml, ...meta } = data
      return meta as Record<string, unknown>
    })

    games.sort((a, b) => {
      const ta = typeof a.createdAt === "number" ? a.createdAt : 0
      const tb = typeof b.createdAt === "number" ? b.createdAt : 0
      return tb - ta
    })

    return Response.json(games)
  } catch (err) {
    console.error("[/api/games/planet] failed:", err)
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
