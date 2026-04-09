import Anthropic from "@anthropic-ai/sdk"
import { getAdminDb } from "@/lib/firebase-admin"

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const adminDb = getAdminDb()
  const snap = await adminDb.collection("games").doc(id).get()

  if (!snap.exists) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const game = snap.data()!
  const html = game.gameHtml as string
  const designDoc = game.designDoc as { concept?: string; title?: string }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      system: `You are a game reviewer for a student-created math game. Analyze the HTML game code and determine if it meets quality standards.

Check:
1. Does the HTML contain interactive elements (buttons, click handlers, event listeners)?
2. Does it reference the math concept in some meaningful way?
3. Does it have basic game structure (start state, gameplay, end state)?

Respond in EXACTLY this JSON format, no markdown, no code fences:
{"pass":true/false,"feedback":"One sentence explaining your decision"}

Be encouraging but honest. If it fails, give specific feedback the student can act on.`,
      messages: [{
        role: "user",
        content: `Game title: ${designDoc.title || "Untitled"}
Math concept: ${designDoc.concept || "Unknown"}

HTML code:
${html.slice(0, 8000)}`,
      }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
    const result = JSON.parse(cleaned)

    if (result.pass) {
      await adminDb.collection("games").doc(id).update({
        status: "published",
        updatedAt: Date.now(),
      })
    }

    return Response.json(result)
  } catch {
    return Response.json({
      pass: false,
      feedback: "Review could not be completed. Please try again.",
    })
  }
}
