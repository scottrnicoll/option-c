import Anthropic from "@anthropic-ai/sdk"

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const { designDoc, designChoices } = await req.json()

  const vibeInstructions = designChoices?.vibe ? `Visual theme: ${designChoices.vibe}.` : ""
  const colorInstructions = designChoices?.color ? `Color scheme: ${designChoices.color}.` : ""
  const characterInstructions = designChoices?.characters ? `Characters/style: ${designChoices.characters}.` : ""

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: "You generate complete, self-contained HTML files for playable browser games. Output ONLY the HTML. No markdown. No code fences. Start with <!DOCTYPE html>.",
    messages: [{
      role: "user",
      content: `Generate a complete, self-contained HTML file for a playable browser game.

GAME DESIGN:
- Title: ${designDoc.title}
- Concept: ${designDoc.concept}
- How it works: ${designDoc.howItWorks}
- Rules: ${(designDoc.rules || []).join(". ")}
- Win condition: ${designDoc.winCondition}
- Math role: ${designDoc.mathRole}
${vibeInstructions}
${colorInstructions}
${characterInstructions}

REQUIREMENTS:
- All CSS and JavaScript must be inline (in <style> and <script> tags).
- The game must be fully playable with mouse/touch input.
- Use a dark background (#18181b) with light text (#e4e4e7).
- Make it visually appealing with colors, animations, and clear UI.
- Include a title screen, gameplay, and a win/lose state.
- The math concept must be essential to gameplay — not decorative.
- Target audience: elementary/middle school students. Keep it simple and fun.
- Responsive — works on desktop and mobile.
- Include clear instructions on how to play.
- Maximum 500 lines of code. Keep it simple but polished.
- IMPORTANT: When the player loses (game over / lose state), you MUST call window.parent.postMessage({type:'game_lose'}, '*') exactly once before showing the lose screen. This is required.`,
    }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  if (!text || (!text.includes("<!DOCTYPE html>") && !text.includes("<html"))) {
    return Response.json({ error: "Failed to generate game" }, { status: 500 })
  }

  let cleanHtml = text
  if (cleanHtml.startsWith("```")) {
    cleanHtml = cleanHtml.replace(/^```html?\n?/, "").replace(/\n?```$/, "")
  }

  return Response.json({ html: cleanHtml })
}
