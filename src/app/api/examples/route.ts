import { generateText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { standardId, description, grade, interests } = await req.json() as {
    standardId: string
    description: string
    grade: string
    interests?: string[]
  }

  const interestContext = interests && interests.length > 0
    ? `The student likes: ${interests.join(", ")}. At least 1 idea should connect to their interests.`
    : ""

  const { text } = await generateText({
    model: "anthropic/claude-sonnet-4.5",
    system: `You suggest game design ideas that use a specific math concept. Each idea is a game MECHANIC — not a full game, just a core loop a student could build on.

${interestContext}

Target student: ${grade === "K" ? "kindergarten" : `grade ${grade}`}.

Respond in EXACTLY this JSON format, no markdown, no code fences:
{"inspos":[{"emoji":"🎯","mechanic":"Short mechanic name (3-5 words)","hook":"One exciting sentence about why this is cool","example":"1-2 sentences describing how the math concept works in this game mechanic"},{"emoji":"...","mechanic":"...","hook":"...","example":"..."},{"emoji":"...","mechanic":"...","hook":"...","example":"..."}]}

RULES:
- Give exactly 3 ideas
- Each mechanic should be a different TYPE of game (e.g., one puzzle, one action, one building)
- Use fun emojis that match the mechanic
- The "hook" should make a kid think "oh that sounds fun!"
- The "example" should make it clear exactly how the math shows up
- Mechanics should be things a student could actually build (simple, achievable)
- Think: card games, board games, obstacle courses, cooking challenges, building competitions, races, treasure hunts`,
    prompt: `Suggest 3 game mechanics that use this math concept: "${description}" (Standard ${standardId}, Grade ${grade})`,
  })

  try {
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
    const parsed = JSON.parse(cleaned)
    return Response.json(parsed)
  } catch {
    return Response.json({
      inspos: [
        { emoji: "🎯", mechanic: "Target Challenge", hook: "Hit the right number to score!", example: `Use ${description.slice(0, 40).toLowerCase()} to aim for the perfect score.` },
        { emoji: "🏗️", mechanic: "Build & Balance", hook: "Stack it up without falling!", example: `The math helps you figure out the right amounts to keep things balanced.` },
        { emoji: "🧩", mechanic: "Puzzle Race", hook: "Solve it faster than your friends!", example: `Each puzzle uses this math concept — the faster you solve, the more you score.` },
      ]
    })
  }
}
