import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getDb } from "@/lib/db"
import { unlockStandard } from "@/lib/progress"

export async function POST(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { standardId } = body as { standardId: string }

  if (!standardId) {
    return NextResponse.json(
      { error: "standardId is required" },
      { status: 400 }
    )
  }

  // Get or create student record
  const sql = getDb()
  const students = await sql`
    INSERT INTO students (clerk_id)
    VALUES (${userId})
    ON CONFLICT (clerk_id) DO UPDATE SET clerk_id = EXCLUDED.clerk_id
    RETURNING id
  `
  const studentId = students[0].id as string

  const newlyAvailable = await unlockStandard(studentId, standardId)

  return NextResponse.json({ newlyAvailable })
}
