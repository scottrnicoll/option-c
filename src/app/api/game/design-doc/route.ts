import Anthropic from "@anthropic-ai/sdk"

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const { chatHistory, standardId, standardDescription, planetId } = await req.json()

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: `Extract a structured game design document from this conversation between a student and a game design mentor. The student was designing a game that uses a math concept.

Respond in EXACTLY this JSON format, no markdown, no code fences:
{"title":"Short catchy game name","concept":"The math concept in plain language","howItWorks":"1-2 sentences describing the game","rules":["rule 1","rule 2","rule 3"],"winCondition":"How you win","mathRole":"How math is essential to the game"}

Rules:
- The title should be fun and short (2-4 words)
- Extract actual details from the conversation, don't make things up
- If something wasn't discussed, make a reasonable inference from context
- Keep language at the student's reading level`,
      messages: [{
        role: "user",
        content: `Chat history:\n${chatHistory}\n\nMath concept: ${standardDescription}\nStandard: ${standardId}`,
      }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
    const parsed = JSON.parse(cleaned)
    return Response.json({ ...parsed, standardId, planetId, designChoices: {} })
  } catch {
    return Response.json({
      title: "My Math Game",
      concept: standardDescription,
      standardId,
      planetId,
      howItWorks: "A game that uses math",
      rules: ["Play and have fun"],
      winCondition: "Use math to win",
      mathRole: "Math is part of the gameplay",
      designChoices: {},
    })
  }
}
