import { getAdminDb } from "@/lib/firebase-admin"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const adminDb = getAdminDb()
  const snap = await adminDb.collection("games").doc(id).get()

  if (!snap.exists) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const data = snap.data()!
  // Don't send full HTML in the metadata response
  const { gameHtml: _, ...meta } = data
  return Response.json(meta)
}
