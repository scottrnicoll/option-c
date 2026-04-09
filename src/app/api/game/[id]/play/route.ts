// Increment a game's playCount. Called once per session by the game player
// (the client guards against double-counting and skips author's own plays).

import { getAdminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const adminDb = getAdminDb()
    await adminDb.collection("games").doc(id).update({
      playCount: FieldValue.increment(1),
    })
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
