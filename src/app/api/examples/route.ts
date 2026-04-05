import Anthropic from "@anthropic-ai/sdk"

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: `You suggest game design ideas that use a specific math concept. Each idea is a game MECHANIC — not a full game, just a core loop a student could build on.

${interestContext}

Target student: ${grade === "K" ? "kindergarten" : `grade ${grade}`}.

Respond in EXACTLY this JSON format, no markdown, no code fences:
{"inspos":[{"icon":"target","mechanic":"Short mechanic name (3-5 words)","hook":"One exciting sentence about why this is cool","example":"1-2 sentences describing how the math concept works in this game mechanic"},{"icon":"...","mechanic":"...","hook":"...","example":"..."},{"icon":"...","mechanic":"...","hook":"...","example":"..."}]}

For the "icon" field, choose one of these icon names that best matches the mechanic: target, puzzle, hammer, trophy, zap, rocket, sword, shield, dice, map, compass, scale, timer, flag, crown, gem, heart, star, flame, mountain

RULES:
- Give exactly 3 ideas
- Each mechanic should be a different TYPE of game (e.g., one puzzle, one action, one building)
- The "hook" should make a kid think "oh that sounds fun!"
- The "example" should make it clear exactly how the math shows up
- Mechanics should be things a student could actually build (simple, achievable)
- Think: card games, board games, obstacle courses, cooking challenges, building competitions, races, treasure hunts`,
      messages: [{
        role: "user",
        content: `Suggest 3 game mechanics that use this math concept: "${description}" (Standard ${standardId}, Grade ${grade})`,
      }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
    const parsed = JSON.parse(cleaned)
    return Response.json(parsed)
  } catch {
    return Response.json({
      inspos: [
        { icon: "target", mechanic: "Target Challenge", hook: "Hit the right number to score!", example: `Use ${description.slice(0, 40).toLowerCase()} to aim for the perfect score.` },
        { icon: "hammer", mechanic: "Build & Balance", hook: "Stack it up without falling!", example: "The math helps you figure out the right amounts to keep things balanced." },
        { icon: "puzzle", mechanic: "Puzzle Race", hook: "Solve it faster than your friends!", example: "Each puzzle uses this math concept — the faster you solve, the more you score." },
      ]
    })
  }
}
