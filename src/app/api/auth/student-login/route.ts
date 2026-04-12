import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  try {
    const { classCode, name, personalCode } = await req.json()

    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()

    let uid: string | null = null

    if (personalCode) {
      // 1. Returning student via personal code
      const codeQuery = await adminDb
        .collection("users")
        .where("personalCode", "==", personalCode.trim().toUpperCase())
        .limit(1)
        .get()

      if (codeQuery.empty) {
        return Response.json({ error: "Personal code not found." }, { status: 404 })
      }
      
      const userDoc = codeQuery.docs[0]
      uid = userDoc.id
    } else if (classCode && name) {
      // 2. Login via class code + name
      const classQuery = await adminDb
        .collection("classes")
        .where("code", "==", classCode.toUpperCase())
        .limit(1)
        .get()

      if (classQuery.empty) {
        return Response.json({ error: "Class not found." }, { status: 404 })
      }

      const classId = classQuery.docs[0].id
      
      // Check for existing student in this class
      // We'll do a simple match for now, but in production we'd normalize
      const studentsQuery = await adminDb
        .collection("users")
        .where("classId", "==", classId)
        .where("name", "==", name.trim())
        .limit(1)
        .get()

      if (!studentsQuery.empty) {
        uid = studentsQuery.docs[0].id
      } else {
        // Create new user record in Auth for the custom token
        const newUser = await adminAuth.createUser({
          displayName: name.trim(),
        })
        uid = newUser.uid
      }
    } else {
      // 3. Just need an anonymous-like token (placeholder)
      const newUser = await adminAuth.createUser({})
      uid = newUser.uid
    }

    if (!uid) {
      return Response.json({ error: "Could not determine UID" }, { status: 400 })
    }

    const customToken = await adminAuth.createCustomToken(uid)
    return Response.json({ token: customToken, uid })
  } catch (error: any) {
    console.error("[StudentLogin API] Error:", error)
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
