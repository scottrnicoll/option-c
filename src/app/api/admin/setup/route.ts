import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"

export async function GET() {
  return setupAdmin()
}

export async function POST() {
  return setupAdmin()
}

async function setupAdmin() {
  try {
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()

    // Find or create the admin user
    let userRecord
    try {
      userRecord = await adminAuth.getUserByEmail("mrdavolatech@gmail.com")
    } catch {
      // User doesn't exist in Auth yet — they'll sign in with Google
      return Response.json(
        { error: "Sign in with Google first at /admin/login, then call this again" },
        { status: 400 }
      )
    }

    // Create/update admin user doc
    await adminDb.collection("users").doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        name: userRecord.displayName || "Admin",
        role: "admin",
        grade: "",
        interests: [],
        classId: "",
        tokens: 0,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      },
      { merge: true }
    )

    return Response.json({ success: true, uid: userRecord.uid })
  } catch (error: any) {
    console.error("Admin setup error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
