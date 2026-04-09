import { getAdminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { rating, comment, raterUid, raterName } = await req.json()

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return Response.json({ error: "Rating must be 1-5" }, { status: 400 })
  }
  if (typeof comment !== "string" || comment.trim().length < 5) {
    return Response.json(
      { error: "Comment is required (at least 5 characters)" },
      { status: 400 }
    )
  }

  const adminDb = getAdminDb()
  const snap = await adminDb.collection("games").doc(id).get()
  if (!snap.exists) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await adminDb.collection("games").doc(id).update({
    ratingSum: FieldValue.increment(rating),
    ratingCount: FieldValue.increment(1),
    // Store the rating-with-comment privately so guides + admins + the
    // author can see it. Visible only to those parties (enforced in UI).
    privateReviews: FieldValue.arrayUnion({
      rating,
      comment: comment.trim(),
      raterUid: raterUid || "",
      raterName: raterName || "Anonymous",
      createdAt: Date.now(),
    }),
  })

  return Response.json({ success: true })
}
