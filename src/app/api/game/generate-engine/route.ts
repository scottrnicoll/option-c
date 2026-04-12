// Generate a game using a pre-built engine instead of AI HTML generation.
// Takes the design doc + mechanic ID and returns themed HTML instantly.

import { hasEngine, generateWithEngine, DEFAULT_PALETTE } from "@/lib/game-engines"
import type { ThemeConfig, MathParams, RoundData } from "@/lib/game-engines"
import Anthropic from "@anthropic-ai/sdk"

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const body = await req.json()
  const { designDoc, mechanicId, standardId, standardDescription, grade, cardChoices, sprites, gameOption } = body

  if (!mechanicId || !hasEngine(mechanicId)) {
    return Response.json({ error: "No engine for this mechanic", hasEngine: false }, { status: 400 })
  }

  // Generate theme config from the design doc using Haiku (fast + cheap)
  let themeConfig: ThemeConfig
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 450,
      system: `Generate a theme config JSON for a math game. Be creative with names but keep them SHORT (max 5 words each). Return ONLY valid JSON, no markdown.

Also select the best matching sprites from the library:
Characters: pirate, robot, astronaut, knight, chef, diver, ghost, ninja, wizard, explorer
Items: coin, gem, treasure-chest, crystal, potion, fruit, star, shell, mushroom, key
Backgrounds: underwater, space, forest, castle, kitchen, cave, city, volcano, arctic, jungle

Pick the sprites that best match the game's theme and setting.`,
      messages: [{
        role: "user",
        content: `Game design:
Title: ${designDoc.title || "Math Game"}
Theme/World: ${cardChoices?.theme || designDoc.howItWorks || "a fun place"}
Character: ${cardChoices?.character || designDoc.concept || "player"}
Player Action: ${cardChoices?.action || "play the game"}
Win condition: ${cardChoices?.win || designDoc.winCondition || "complete all rounds"}
Math: ${designDoc.mathRole || standardDescription}

Return JSON:
{
  "title": "game title (max 4 words)",
  "character": "who you play as (max 3 words)",
  "itemName": "what you interact with (max 3 words)",
  "targetName": "what you're trying to match/build (max 3 words)",
  "worldName": "the setting (max 3 words)",
  "winMessage": "victory text (max 5 words)",
  "loseMessage": "defeat text (max 5 words)",
  "bgColor1": "hex background gradient start color matching the theme",
  "bgColor2": "hex background gradient end color matching the theme",
  "characterSprite": "<best matching character id>",
  "itemSprite": "<best matching item id>",
  "backgroundImage": "<best matching background id>"
}`,
      }],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    const parsed = JSON.parse(cleaned.slice(start, end + 1))

    // Override background with theme-specific colors if provided
    const themedPalette = { ...DEFAULT_PALETTE }
    if (parsed.bgColor1 && parsed.bgColor2) {
      themedPalette.bg = parsed.bgColor1
    }

    themeConfig = {
      title: parsed.title || designDoc.title || "Math Game",
      character: parsed.character || "player",
      itemName: parsed.itemName || "items",
      targetName: parsed.targetName || "target",
      worldName: parsed.worldName || "the world",
      colors: themedPalette,
      winMessage: parsed.winMessage || "You did it!",
      loseMessage: parsed.loseMessage || "Try again!",
      dare: designDoc.dare,
      characterSprite: parsed.characterSprite || "explorer",
      itemSprite: parsed.itemSprite || "coin",
      backgroundImage: parsed.backgroundImage || "forest",
    }
  } catch {
    // Fallback config
    themeConfig = {
      title: designDoc.title || "Math Game",
      character: "player",
      itemName: "items",
      targetName: "target",
      worldName: "the world",
      colors: { ...DEFAULT_PALETTE },
      winMessage: "You did it!",
      loseMessage: "Try again!",
      dare: designDoc.dare,
      characterSprite: "explorer",
      itemSprite: "coin",
      backgroundImage: "forest",
    }
  }

  // Student sprite overrides (from artwork picker UI)
  if (sprites?.characterSprite) themeConfig.characterSprite = sprites.characterSprite
  if (sprites?.itemSprite) themeConfig.itemSprite = sprites.itemSprite
  if (sprites?.backgroundImage) themeConfig.backgroundImage = sprites.backgroundImage

  // Generate math-specific round data tailored to the exact standard
  let rounds: RoundData[] | undefined
  try {
    const roundResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: `You generate math game round data. Each round has a PROMPT (what the player sees), a TARGET (the correct number to collect), ITEMS (clickable numbers including the answer and distractors), and an optional HINT.

CRITICAL: The math in each round must DIRECTLY test the specific standard described. Do NOT just make addition problems — make problems that test the EXACT skill.

Return ONLY a JSON array of 5 rounds. No markdown, no explanation.`,
      messages: [{
        role: "user",
        content: `Standard: ${standardId} — ${standardDescription}
Grade: ${grade || "4"}
Game mechanic: Player clicks items with numeric values to collect them. Their collected total must match the target exactly.
Item name in game: ${themeConfig.itemName}

Generate 5 rounds of increasing difficulty. Each round:
- "prompt": A short math question/challenge that tests this SPECIFIC standard (not generic addition). Max 60 chars.
- "target": The correct answer (a number the player must collect)
- "items": Array of 6-8 numbers the player can click. MUST include numbers that sum to target. Include distractors.
- "hint": One sentence hint about the math concept

Examples for different standards:
- "Understanding the equals sign": prompt "What makes 5 + ? = 12 true?", target 7, items [3,4,7,9,2,5]
- "Area using multiplication": prompt "Area of a 6×4 rectangle?", target 24, items [24,18,10,20,12,30,6]
- "Multiply by multiples of 10": prompt "30 × 7 = ?", target 210, items [210,180,37,200,21,170,240]
- "Compare fractions": prompt "Which is bigger: 3/4 or 2/3? (as 12ths)", target 9, items [9,8,6,10,12,3,7]

Return JSON array: [{"prompt":"...","target":N,"items":[...],"hint":"..."},...]`,
      }],
    })

    const roundText = roundResponse.content[0].type === "text" ? roundResponse.content[0].text : ""
    const roundCleaned = roundText.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
    const rStart = roundCleaned.indexOf("[")
    const rEnd = roundCleaned.lastIndexOf("]")
    if (rStart !== -1 && rEnd !== -1) {
      const parsed = JSON.parse(roundCleaned.slice(rStart, rEnd + 1))
      if (Array.isArray(parsed) && parsed.length >= 3) {
        rounds = parsed.slice(0, 5).map((r: any) => ({
          prompt: String(r.prompt || "Collect the target!"),
          target: Number(r.target) || 10,
          items: Array.isArray(r.items) ? r.items.map(Number).filter((n: number) => !isNaN(n)) : [1,2,3,4,5,10],
          hint: r.hint ? String(r.hint) : undefined,
        }))
      }
    }
  } catch (err) {
    console.warn("[generate-engine] Round generation failed, using fallback:", err)
    // rounds stays undefined — engine will use its built-in fallback
  }

  const mathParams: MathParams = {
    grade: grade || "6",
    standardId: standardId || "",
    standardDescription: standardDescription || "",
    difficulty: "medium",
    rounds,
  }

  const html = generateWithEngine(mechanicId, themeConfig, mathParams, gameOption)
  if (!html) {
    return Response.json({ error: "Engine generation failed" }, { status: 500 })
  }

  return Response.json({ html, hasEngine: true })
}
