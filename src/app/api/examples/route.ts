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
    ? `The student is interested in: ${interests.join(", ")}. At least 1-2 examples MUST connect to these interests.`
    : ""

  const { text } = await generateText({
    model: "anthropic/claude-sonnet-4.5",
    system: `You give students real, specific examples of how math concepts appear in games, apps, and real life. ${interestContext}

Target reading level: ${grade === "K" ? "kindergarten" : `grade ${grade}`}.

Respond in EXACTLY this JSON format, no markdown, no code fences:
{"examples":[{"game":"Name of game or real-world thing","explanation":"1-2 sentences explaining how the math shows up"},{"game":"...","explanation":"..."},{"game":"...","explanation":"..."}]}

RULES:
- Give exactly 3 examples
- Use REAL games, apps, sports, or activities kids know (Minecraft, Roblox, basketball, cooking, etc.)
- Be specific — don't say "strategy games use this". Say "In Minecraft, you use [concept] when you [specific action]"
- Keep explanations to 1-2 short sentences
- Make it feel like a discovery: "whoa, I already use this math!"`,
    prompt: `Give 3 real examples of this math concept in games/real life: "${description}" (Standard ${standardId}, Grade ${grade})`,
  })

  try {
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
    const parsed = JSON.parse(cleaned)
    return Response.json(parsed)
  } catch {
    return Response.json({
      examples: [
        { game: "Minecraft", explanation: `When you play Minecraft, you use this kind of math more than you think!` },
        { game: "Cooking", explanation: `Following a recipe uses this concept — measuring and comparing amounts.` },
        { game: "Sports", explanation: `Keeping score and figuring out who's winning uses this math.` },
      ]
    })
  }
}
