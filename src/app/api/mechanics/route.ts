import { generateText } from "ai"

export const maxDuration = 45

export async function POST(req: Request) {
  const { description, grade, interests } = await req.json() as {
    description: string
    grade: string
    interests?: string[]
  }

  const interestContext = interests && interests.length > 0
    ? `The student likes: ${interests.join(", ")}. Make at least one mechanic relate to their interests.`
    : ""

  const { text } = await generateText({
    model: "anthropic/claude-sonnet-4.5",
    system: `You create exactly 3 small SVG animations showing a stick figure performing a GAME MECHANIC — a core action loop that makes a game fun.

A game mechanic is a VERB — the thing a player DOES repeatedly:
- "Collect & Compare" (gather items, compare which is bigger/better)
- "Dodge & Calculate" (avoid obstacles using math to predict paths)
- "Trade to Optimize" (swap resources to get the best deal)
- "Aim & Estimate" (guess a value, shoot, see how close you were)
- "Race Against the Clock" (solve before time runs out)
- "Balance & Stack" (keep things equal/stable while adding more)
- "Bid & Bluff" (use numbers strategically against opponents)

NOT game names. NOT "Card Sort" or "Tower Build". The CORE LOOP.

${interestContext}

Output EXACTLY a JSON array of 3 objects, no markdown, no code fences:
[{"title":"Verb-Driven Mechanic Name","svg":"<svg>...</svg>"},{"title":"...","svg":"..."},{"title":"...","svg":"..."}]

The title must be a 2-3 word action phrase starting with a verb: "Collect & Compare", "Dodge & Measure", "Trade to Win".

SVG RULES:
- Each SVG: 180x120, viewBox="0 0 180 120"
- Dark background: fill="#18181b" rect covering full area
- Stick figures: circle head (r=6), line body/arms/legs, stroke="#e4e4e7", stroke-width=2
- Math elements: stroke="#60a5fa", highlights: fill="#f59e0b"
- Include CSS @keyframes animation in a <style> tag showing the mechanic IN ACTION
- Show the stick figure DOING the mechanic: dodging, collecting, aiming, trading, stacking
- The math concept must be visually embedded (numbers, shapes, measurements on screen)
- 4-8 elements max per SVG. Keep it simple and clear.
- Each mechanic must be a DIFFERENT type of core loop
- Target: ${grade === "K" ? "kindergarten" : `grade ${grade}`} student`,
    prompt: `Create 3 stick-figure SVG animations of game MECHANICS (core action loops, not game names) that use this math concept: "${description}"`,
  })

  try {
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed) && parsed.length >= 1) {
      // Validate each SVG
      const valid = parsed
        .filter((item: any) => item.svg && item.svg.includes("<svg") && item.title)
        .slice(0, 3)
      return Response.json({ mechanics: valid })
    }
    throw new Error("Invalid format")
  } catch {
    return Response.json({ mechanics: [] })
  }
}
