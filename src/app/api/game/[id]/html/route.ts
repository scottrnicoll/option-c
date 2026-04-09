import { getAdminDb } from "@/lib/firebase-admin"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const adminDb = getAdminDb()
  const snap = await adminDb.collection("games").doc(id).get()

  if (!snap.exists) {
    return new Response("Not found", { status: 404 })
  }

  const game = snap.data()!
  return new Response(game.gameHtml, {
    headers: { "Content-Type": "text/html" },
  })
}
