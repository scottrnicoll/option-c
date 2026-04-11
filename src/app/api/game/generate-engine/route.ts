// Generate a game using a pre-built engine instead of AI HTML generation.
// Takes the design doc + mechanic ID + vibe and returns themed HTML instantly.

import { hasEngine, generateWithEngine, VIBE_PALETTES } from "@/lib/game-engines"
import type { ThemeConfig, MathParams } from "@/lib/game-engines"
import Anthropic from "@anthropic-ai/sdk"

export const maxDuration = 15

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const body = await req.json()
  const { designDoc, mechanicId, vibe, standardId, standardDescription, grade } = body

  if (!mechanicId || !hasEngine(mechanicId)) {
    return Response.json({ error: "No engine for this mechanic", hasEngine: false }, { status: 400 })
  }

  // Generate theme config from the design doc using Haiku (fast + cheap)
  let themeConfig: ThemeConfig
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: `Generate a theme config JSON for a math game. Be creative with names but keep them SHORT (max 5 words each). Return ONLY valid JSON, no markdown.`,
      messages: [{
        role: "user",
        content: `Game design:
Title: ${designDoc.title || "Math Game"}
Theme: ${designDoc.howItWorks || "a fun math game"}
Character: ${designDoc.concept || "player"}
Win condition: ${designDoc.winCondition || "complete all rounds"}
Math: ${designDoc.mathRole || standardDescription}
Vibe: ${vibe || "stickman"}

Return JSON:
{
  "title": "game title (max 4 words)",
  "character": "who you play as (max 3 words)",
  "itemName": "what you interact with (max 3 words)",
  "targetName": "what you're trying to match/build (max 3 words)",
  "worldName": "the setting (max 3 words)",
  "winMessage": "victory text (max 5 words)",
  "loseMessage": "defeat text (max 5 words)"
}`,
      }],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    const parsed = JSON.parse(cleaned.slice(start, end + 1))

    const palette = VIBE_PALETTES[vibe || "stickman"] || VIBE_PALETTES.stickman

    themeConfig = {
      title: parsed.title || designDoc.title || "Math Game",
      character: parsed.character || "player",
      itemName: parsed.itemName || "items",
      targetName: parsed.targetName || "target",
      worldName: parsed.worldName || "the world",
      colors: palette,
      vibe: (vibe || "stickman") as ThemeConfig["vibe"],
      winMessage: parsed.winMessage || "You did it!",
      loseMessage: parsed.loseMessage || "Try again!",
      dare: designDoc.dare,
    }
  } catch {
    // Fallback config
    const palette = VIBE_PALETTES[vibe || "stickman"] || VIBE_PALETTES.stickman
    themeConfig = {
      title: designDoc.title || "Math Game",
      character: "player",
      itemName: "items",
      targetName: "target",
      worldName: "the world",
      colors: palette,
      vibe: (vibe || "stickman") as ThemeConfig["vibe"],
      winMessage: "You did it!",
      loseMessage: "Try again!",
      dare: designDoc.dare,
    }
  }

  const mathParams: MathParams = {
    grade: grade || "6",
    standardId: standardId || "",
    standardDescription: standardDescription || "",
    difficulty: "medium",
  }

  const html = generateWithEngine(mechanicId, themeConfig, mathParams)
  if (!html) {
    return Response.json({ error: "Engine generation failed" }, { status: 500 })
  }

  return Response.json({ html, hasEngine: true })
}
