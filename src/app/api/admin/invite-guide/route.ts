import { adminAuth, adminDb } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  try {
    const { email, name, className } = await req.json()

    if (!email || !className) {
      return Response.json({ error: "Email and className required" }, { status: 400 })
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password: Math.random().toString(36).slice(-12) + "A1!", // temp password, guide resets
      displayName: name || email.split("@")[0],
    })

    // Generate class code (6 chars, uppercase alphanumeric)
    const code = Array.from({ length: 6 }, () =>
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
    ).join("")

    // Create class doc
    const classRef = adminDb.collection("classes").doc()
    await classRef.set({
      name: className,
      code,
      guideUid: userRecord.uid,
      createdAt: Date.now(),
    })

    // Create user doc
    await adminDb.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: name || email.split("@")[0],
      role: "guide",
      grade: "",
      interests: [],
      classId: classRef.id,
      tokens: 0,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    })

    return Response.json({
      uid: userRecord.uid,
      classId: classRef.id,
      classCode: code,
      message: `Guide created. Class code: ${code}`,
    })
  } catch (error: any) {
    console.error("Invite guide error:", error)
    return Response.json({ error: error.message || "Failed to create guide" }, { status: 500 })
  }
}
