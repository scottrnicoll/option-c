import Anthropic from "@anthropic-ai/sdk"

export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// POST /api/templates
//
// Generates 2-3 generic game-mechanic TEMPLATES for a math standard.
// A template describes the game shape in practical terms — what the
// player does with the math — WITHOUT prescribing a setting or theme.
// Each template has 3-4 diverse examples (realistic + fun) that show
// the range of worlds the kid could place the mechanic in.
//
// The learner clicks a template and it seeds the Genie chat with the
// template description. They then decide the theme/setting themselves
// (in chat), preserving their imagination while removing the "how
// does this math become a game?" cognitive block.
//
// Request body:
//   { standardId, description, grade }
//
// Response:
//   { templates: [{ title, description, examples: string[], mechanicId? }, ...] }

interface Template {
  title: string
  description: string
  examples: string[]
  mechanicId?: string
}

export async function POST(req: Request) {
  const { standardId, description, grade } = (await req.json()) as {
    standardId: string
    description: string
    grade: string
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: `You generate game-mechanic TEMPLATES for a math game builder app. A kid (grade ${grade}) is about to build a browser game that teaches a specific math concept. You give them 2-3 template options that describe the GAME SHAPE in practical terms, without prescribing a specific theme.

Each template is a generic player-action blueprint. The kid fills in what world it lives in — their imagination, not yours.

🧠 INTRINSIC INTEGRATION RULE (most important):
The math concept must BE the core player action, not a multiple-choice quiz. The player VERB must equal the math operation. If you can't find a verb where doing the math IS playing the game, start over.

❌ FORBIDDEN template patterns:
- "Answer questions about..."
- "Pick the right answer..."
- "Type the number..."
- Anything that's a quiz wearing a costume

✅ REQUIRED: pick the verb from this table that matches the math concept:

| Math concept           | Core player verb                              |
|------------------------|-----------------------------------------------|
| Number line / ordering | Dive/jump/fly to a position on a line         |
| Counting / cardinality | Collect a specific count of objects           |
| Place value            | Stack, load, pack into fixed containers       |
| Addition / subtraction | Combine or separate physical groups           |
| Multiplication / array | Build a rectangle of rows × columns           |
| Division / factoring   | Split an object into equal groups             |
| Fractions (cut)        | Cut, slice, share a whole into equal parts    |
| Fractions (equivalent) | Mix or stretch parts until two amounts match  |
| Ratio / proportion     | Mix, pour, balance two quantities             |
| Percent / scaling      | Resize, fill a meter to a target proportion   |
| Decimals               | Aim, launch with magnitude                    |
| Measurement length     | Stretch, drag, compare, fit shapes            |
| Money / time           | Spend, schedule, exchange tokens              |
| Geometry shapes        | Build, fold, rotate, fit shapes               |
| Shape composition      | Snap pieces together to match a target shape  |
| Coordinate plane       | Navigate, aim, defend by (x,y)                |
| Equations / algebra    | Move, balance tokens across a divide          |
| Patterns / functions   | Predict the next step, tune a transformer     |
| Statistics / data      | Sort, group, build a chart                    |
| Probability            | Bet, spin, weight outcomes                    |
| Negative numbers       | Climb above and below zero                    |

TEMPLATE FORMAT:
- "title": 2-4 words, generic, describes the VERB (e.g. "Build a Structure", "Cut the Whole", "Climb the Line"). NOT theme-specific.
- "description": 1-2 sentences, plain English, describes what the player DOES with the math. Starts with a verb. No specific settings or characters — just the action. Max 30 words.
- "examples": an array of 3-4 short phrases showing different WORLDS this mechanic could live in. Mix realistic + fun + diverse domains (building, sport, fantasy, animals, food, craft, space). Each example is 3-6 words. Think of these as "you could do this about..."
- The first example should be the MOST REALISTIC/tangible (helps kids who want a grounded idea)
- The second should be the MOST FUN/imaginative (helps kids who want something playful)
- Additional examples add variety

You MUST respond with ONLY a valid JSON object — no markdown, no code fences. The JSON has exactly one key "templates" — an array of 2-3 objects.

Example for K.G.B.5 (Kindergarten — Model shapes in the world by building shapes from components, e.g., sticks and clay balls):
{"templates":[
  {"title":"Build a Structure","description":"Snap together sticks and corner pieces to build the exact shape shown on the screen.","examples":["build a house","build a rocket","sculpt a trophy","make a robot"]},
  {"title":"Copy the Shape","description":"Look at a target shape and place matching pieces on a blank board until it's identical.","examples":["copy a window","copy a snowflake","copy a dinosaur","copy a crown"]}
]}

The 2-3 templates should differ from each other in verb or feel. If the math concept only realistically supports 2 good templates, return 2. Never return 4 or more. Return 3 whenever reasonable.`,
      messages: [
        {
          role: "user",
          content: `Generate 2-3 game-mechanic templates for this math standard:
- Standard ID: ${standardId}
- Description: ${description}
- Grade: ${grade}

Pick the right player verb. Describe the shape generically. Give 3-4 example worlds per template, first realistic, second fun. Return JSON only.`,
        },
      ],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    if (start === -1 || end === -1) {
      console.error("[templates] no JSON in response:", cleaned.slice(0, 200))
      return Response.json({ templates: fallbackTemplates(description) })
    }

    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as { templates?: Template[] }
    if (!Array.isArray(parsed.templates) || parsed.templates.length === 0) {
      return Response.json({ templates: fallbackTemplates(description) })
    }

    // Clip to 3 and ensure every template has an examples array.
    const cleaned_templates = parsed.templates.slice(0, 3).map((t) => ({
      title: t.title ?? "Game Idea",
      description: t.description ?? "",
      examples: Array.isArray(t.examples) ? t.examples.slice(0, 4) : [],
    }))

    return Response.json({ templates: cleaned_templates })
  } catch (e) {
    console.error("[templates] error:", String(e))
    return Response.json({ templates: fallbackTemplates(description) })
  }
}

function fallbackTemplates(description: string): Template[] {
  return [
    {
      title: "Build Your Own",
      description: `Design a small game where the player has to use ${description.toLowerCase()} to win.`,
      examples: ["build anything you like"],
    },
  ]
}
