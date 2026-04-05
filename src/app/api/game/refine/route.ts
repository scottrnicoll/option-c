import Anthropic from "@anthropic-ai/sdk"

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const { currentHtml, feedback, designDoc } = await req.json()

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: "You modify existing HTML games based on student feedback. Output ONLY the complete updated HTML file. No markdown. No code fences. Start with <!DOCTYPE html>.",
    messages: [{
      role: "user",
      content: `Here is an existing HTML game:

${currentHtml}

The student who designed this game wants the following changes:
"${feedback}"

Original game design:
- Title: ${designDoc?.title || "Math Game"}
- Math concept: ${designDoc?.concept || "math"}
- How it works: ${designDoc?.howItWorks || ""}

Generate the updated complete HTML file incorporating the requested changes.
Keep all existing functionality that wasn't mentioned in the feedback.
All CSS and JavaScript must remain inline.`,
    }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  let cleanHtml = text || ""
  if (cleanHtml.startsWith("```")) {
    cleanHtml = cleanHtml.replace(/^```html?\n?/, "").replace(/\n?```$/, "")
  }

  return Response.json({ html: cleanHtml })
}
