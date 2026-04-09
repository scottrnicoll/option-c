import { getAdminDb } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  const game = await req.json()
  const adminDb = getAdminDb()
  const gameId = game.id || adminDb.collection("games").doc().id

  await adminDb.collection("games").doc(gameId).set({
    ...game,
    id: gameId,
    reviews: game.reviews || [],
    updatedAt: Date.now(),
    createdAt: game.createdAt || Date.now(),
  })

  return Response.json({ id: gameId })
}
