// Enhances a game card slot after the learner makes a pick.
// Takes the current picks + mechanic and returns:
//   - enhanced: the picked value rewritten to match theme/character
//   - nextOptions: 3 themed options for the next slot
//   - summary: progressive game description sentence

import Anthropic from "@anthropic-ai/sdk"

export const maxDuration = 15

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface EnhanceRequest {
  mechanic: string        // e.g. "Build & Measure — area and volume"
  mathSkill: string       // the standard description
  slot: "theme" | "character" | "action" | "win"
  picked: string          // what the learner just picked
  theme?: string          // current theme (if already picked)
  character?: string      // current character (if already picked)
  action?: string         // current action (if already picked)
}

export async function POST(req: Request) {
  const body = await req.json() as EnhanceRequest

  const currentState = [
    body.theme ? `Theme: ${body.theme}` : null,
    body.character ? `Character: ${body.character}` : null,
    body.action ? `Action: ${body.action}` : null,
    body.slot === "win" ? `Win: ${body.picked}` : null,
  ].filter(Boolean).join("\n")

  // Determine what the next slot is
  const nextSlot = body.slot === "theme" ? "character"
    : body.slot === "character" ? "action"
    : body.slot === "action" ? "win"
    : null

  const nextSlotPrompt = nextSlot ? `
Also generate 3 creative options for the NEXT slot (${nextSlot}):
${nextSlot === "character" ? "3 characters that would live in this theme world. Fun, unexpected, not obvious." :
  nextSlot === "action" ? "3 player actions specific to this math mechanic, phrased using the theme and character." :
  nextSlot === "win" ? "3 win conditions with specific round counts or timers, phrased using the theme, character, and action." : ""}
` : ""

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: `You enhance game card slots for a math game builder. You make generic choices feel specific and themed. Be creative but concise. Every response must be valid JSON, no markdown.`,
      messages: [{
        role: "user",
        content: `Math mechanic: ${body.mechanic}
Math skill: ${body.mathSkill}

Current card state:
${currentState || "(empty)"}

The learner just picked "${body.picked}" for the ${body.slot} slot.

Return JSON:
{
  "enhanced": "The picked value rewritten to be more vivid and themed (max 15 words). Keep the core meaning but add flavor from the theme/character.",
  "summary": "A one-sentence game description using ALL picks so far. Format: 'You are a [character] in a [theme], [action], [win].' Only include slots that have been picked.",
  ${nextSlot ? `"nextOptions": ["option 1", "option 2", "option 3"]` : `"nextOptions": []`}
}
${nextSlotPrompt}`,
      }],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    if (start === -1 || end === -1) {
      return Response.json({ enhanced: body.picked, summary: "", nextOptions: [] })
    }
    const parsed = JSON.parse(cleaned.slice(start, end + 1))
    return Response.json({
      enhanced: parsed.enhanced || body.picked,
      summary: parsed.summary || "",
      nextOptions: Array.isArray(parsed.nextOptions) ? parsed.nextOptions.slice(0, 3) : [],
    })
  } catch {
    return Response.json({ enhanced: body.picked, summary: "", nextOptions: [] })
  }
}
