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

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD || "OptionC-Admin-2026!"
    if (!adminEmail) return Response.json({ error: "ADMIN_EMAIL not set in .env.local" }, { status: 500 })

    // Find or create the admin auth user
    let userRecord
    try {
      userRecord = await adminAuth.getUserByEmail(adminEmail)
      // Add password if not set
      await adminAuth.updateUser(userRecord.uid, { password: adminPassword })
    } catch {
      // Create new user with email/password
      userRecord = await adminAuth.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: "Admin",
      })
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

    return Response.json({
      success: true,
      uid: userRecord.uid,
      message: `Admin ready. Login with email: ${adminEmail} — password has been set.`,
    })
  } catch (error: any) {
    console.error("Admin setup error:", error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
