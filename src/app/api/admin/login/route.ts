import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json()

    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()

    // Verify the ID token
    const decoded = await adminAuth.verifyIdToken(idToken)

    // Check if user has admin role in Firestore
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get()

    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return Response.json({ error: "Not an admin" }, { status: 403 })
    }

    return Response.json({
      success: true,
      profile: userDoc.data()
    })
  } catch (error: any) {
    console.error("Admin login verify error:", error)
    return Response.json({ error: error.message }, { status: 401 })
  }
}
