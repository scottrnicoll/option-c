import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getDb } from "@/lib/db"
import { getStudentProgress } from "@/lib/progress"

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Upsert student record by clerk_id
  const sql = getDb()
  const students = await sql`
    INSERT INTO students (clerk_id)
    VALUES (${userId})
    ON CONFLICT (clerk_id) DO UPDATE SET clerk_id = EXCLUDED.clerk_id
    RETURNING id
  `
  const studentId = students[0].id as string

  const progressMap = await getStudentProgress(studentId)

  // Convert Map to plain object for JSON serialization
  const progress: Record<string, string> = {}
  for (const [key, value] of progressMap) {
    progress[key] = value
  }

  return NextResponse.json({ studentId, progress })
}
