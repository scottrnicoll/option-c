import Anthropic from "@anthropic-ai/sdk"

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Vibe presets — each is a strict design system that the AI must follow.
// New vibes can be added here. The build screen lets the learner pick one.
//
// Each preset has an `allowPastels` flag which we use to soften the
// global "no pastels / no cute" forbidden rules for vibes that NEED them.
const VIBE_PRESETS: Record<string, { label: string; allowPastels?: boolean; allowSketch?: boolean; spec: string }> = {
  arcade: {
    label: "Arcade",
    spec: `
🕹️ ARCADE VIBE — strict spec, follow exactly:

Color palette (use ONLY these):
  Background:   #000000 (pure black)
  Primary:      #00ffff (electric cyan)
  Secondary:    #ff00ff (hot magenta)
  Accent:       #ffff00 (electric yellow)
  Success:      #00ff66 (neon green)
  Danger:       #ff0033 (laser red)
  Text:         #ffffff (white)
  Dim text:     #888888

Typography:
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  font-family: 'Press Start 2P', monospace;
  Use UPPERCASE for all UI text. Tiny font sizes (8px-14px) so it feels chunky.

Effects:
  - Pure black background.
  - Apply a subtle CRT scanline overlay using a repeating linear-gradient on a fixed pseudo element.
  - Every text element gets a glow: text-shadow: 0 0 6px currentColor, 0 0 12px currentColor.
  - Buttons and panels have a 2-3px solid border (cyan or magenta) with a matching glow.
  - Animations should be CHUNKY — step()-style transitions, not smooth.
  - Use big emoji as game characters (60px+).

Vocabulary:
  Score panel: "SCORE" / "LIVES" / "LEVEL". Win screen: "YOU WIN!" / "GAME OVER".
  Avoid pastel words like "cute", "lovely", "sweet". This is an ARCADE.
`,
  },
  c64: {
    label: "Retro Game",
    spec: `
💻 RETRO GAME VIBE — strict spec, follow exactly (1980s home computer aesthetic):

Color palette (use ONLY these — these are the ACTUAL C64 hardware colors):
  Background:   #4040E0 (C64 light blue)
  Border:       #7878F8 (C64 lighter blue, used as a 12-16px thick fixed border around the viewport)
  Primary:      #FFFFFF (white)
  Secondary:    #FFFF99 (pale yellow)
  Accent:       #FF7777 (light red)
  Success:      #88FF88 (light green)
  Danger:       #BB55BB (purple)
  Text:         #FFFFFF (always white on the blue background)

Typography:
  @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
  font-family: 'VT323', monospace;
  font-size 18-26px. UPPERCASE for all UI labels.

Effects:
  - The whole game viewport sits inside a thick lighter-blue border (the iconic C64 frame).
  - Background is solid C64 blue (#4040E0). NEVER gradients.
  - Pixel-art feel: borders are crisp 2-4px solid white. No rounded corners. No drop shadows. No glow.
  - Add a few tiny "8x8 pixel" decorations using flat blocks of pure colors from the palette.
  - Animations are step()-style and snappy.
  - Use big emoji as game characters (50px+).

Vocabulary:
  Top of screen: "READY." or "LOAD"*",8,1" easter eggs allowed.
  Score panel: "SCORE:" / "HI:". Win: "YOU WIN!" Lose: "GAME OVER".
  This is the 1982 home computer aesthetic. Embrace it.
`,
  },
  kawaii: {
    label: "Kawaii",
    allowPastels: true,
    spec: `
🎀 KAWAII VIBE — chubby characters with big shiny googly eyes, soft
pastel world. Think Sanrio / Studio Ghibli soot-sprite cuteness, not
sticker-book cheese.

Color palette (use ONLY these soft pastels):
  Background:   #fff1f2 (very pale rose) or a vertical gradient from #fef9c3 (cream) to #ffe4e6 (rose)
  Primary:      #f9a8d4 (pink)
  Secondary:    #c4b5fd (lavender)
  Accent:       #99f6e4 (mint)
  Soft blue:    #bfdbfe (baby blue)
  Peach:        #fed7aa
  Text:         #6b21a8 (deep plum) for headings; #4c1d95 for body text. Never pure black.
  Hearts/sparkles use: #f472b6 (pink), #fbbf24 (gold), #c084fc (lavender)

Typography:
  @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap');
  font-family: 'Quicksand', sans-serif;
  font-weight 600 for body, 700 for headings.
  Generous letter-spacing on headings (0.02em).

🥹 KAWAII CHARACTERS — exact specification:
  Use SVG-drawn chubby characters, NOT emoji. Each character must have:

  - A round, chubby BODY: a single soft circle or a slightly squished
    oval (wider than tall), pastel-filled, ~50-70px diameter. Think
    a marshmallow or a dumpling shape.
  - SHINY GOOGLY EYES: two large round black eyes set wide apart on
    the upper third of the body. Each eye has a small white highlight
    circle inside (offset to the upper-right of the eye) to make it
    look glossy and reflective. Eye size ~30% of head width. The
    highlight is what makes them "shiny googly eyes" — never omit it.
  - A tiny MOUTH: a small "ω" shape, a sideways "3", or a soft curve.
    Optional small pink blush dots on the cheeks (#fda4af, opacity 0.5).
  - Small stub ARMS and LEGS: short rounded rectangles or stubby
    paws sticking out from the body. They should look too small for
    the body — that's what makes them chubby and cute.
  - Optional ears, tail, or flower on top depending on the character:
    cat ears (two small triangles), bunny ears (two long ovals), a
    little leaf, etc.

  Example mental model: a Pokémon's basic form, a Tamagotchi, a
  Studio Ghibli soot sprite, or a kawaii sticker character. NOT a
  generic cartoon mascot.

Effects:
  - Gentle gradient or solid pastel background. NO black backgrounds, NO neon, NO scanlines.
  - Everything has soft rounded corners (border-radius 12-24px).
  - Buttons have a soft shadow (box-shadow: 0 4px 12px rgba(244, 114, 182, 0.25)).
  - Sprinkle a FEW decorative emoji floating gently in the background: 🌸 ✨ 💖 ⭐ ☁️ 🌷 (max 6-8 total). These are background decoration only — the main characters are SVG-drawn chubby creatures, NOT emoji.
  - On wins, briefly pop heart sparkles ✨💖 with a CSS keyframe animation (fade + scale).
  - Animations are gentle and bouncy (cubic-bezier with ease-out, no harsh step()).
  - Characters can have a tiny "breathing" idle animation: scale 1.0 → 1.03 → 1.0 over 2-3 seconds.

🚫 BUT NOT CHEESY — ban these even though it's the kawaii vibe:
  - NO rainbows everywhere (one rainbow OK as accent, not 5)
  - NO unicorn spam (one cute character is fine)
  - NO "OMG!", "yay!", "so cute!" in UI text — keep copy calm and respectful
  - NO Comic Sans (use Quicksand only)
  - NO glitter overload — restraint
  - NO baby talk in any UI string

Vocabulary:
  Score panel: "Score" / "Lives" (sentence case, not all caps). Win: "You did it!" Lose: "Try again!".
  This is for learners who like soft, pretty things — not condescending.
`,
  },
  stickman: {
    label: "Stick Man",
    allowSketch: true,
    spec: `
✏️ STICK MAN VIBE — hand-drawn notebook aesthetic, using the Diagonally
unified stick figure style:

Color palette (use ONLY these):
  Background:   #18181b (dark zinc — matches the Diagonally mechanic
                illustration backgrounds, NOT a paper white)
  Figure:       #e4e4e7 (light zinc — the standard stick figure stroke
                color used across all our mechanic SVGs)
  Accent:       #60a5fa (blue) for interactive items / props
  Highlight:    #fbbf24 (amber) for stars, points, success markers
  Success:      #22c55e (green) for win states and completed elements
  Danger:       #ef4444 (red) for failure / wrong moves
  Text:         #e4e4e7 (light) on the dark background

Typography:
  @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
  font-family: 'Patrick Hand', cursive;
  font-size 22-30px (handwriting needs to be bigger to read).

Effects:
  - Solid dark zinc background (#18181b).
  - All shape strokes are 2-2.5px solid #e4e4e7. Lines are crisp, no
    wobble — clean diagram-style.
  - NO drop shadows. NO glow. NO gradients. NO paper texture.
  - NO rounded corners on borders.

🎨 STICK MAN CHARACTERS — exact specification (matches our mechanic SVGs):
  Use SVG stick figures with these EXACT proportions, identical to the
  Diagonally mechanic illustrations:

  - Head: a faceless circle, radius 6-8px, stroke #e4e4e7 stroke-width 2,
    NO eyes, NO mouth, NO smile. Just an empty circle.
  - Neck gap: the body line starts 2px BELOW the head circle so it
    never enters the head.
  - Body (torso): a single straight vertical line from neck (just
    below head) to hip, total length ~14-16px. Short torso, not long.
  - Arms: 2 straight lines from the shoulder pivot (top of body),
    each ~9-12px long, can rotate via CSS keyframes for waving /
    holding props.
  - Legs: 2 SINGLE-SEGMENT straight lines from the hip pivot, each
    ~11-14px long. NO knees, NO bend, NO joints. Just straight lines
    that swing from the hip to simulate walking.
  - Walking: animate each leg with a wide-arc rotation (±22 degrees)
    from the hip. The figure should also translateX horizontally to
    show actual walking motion, not just leg-waving in place.
  - Floating gait: the body bobs up and down 1-2px during the walk
    cycle for a "floaty" feel.

  Items / props in the world should also be simple line drawings in
  the same #e4e4e7 stroke style: a square with a stroke for a box,
  a triangle for a mountain, a circle for a ball. Filled rectangles
  in the accent colors (#60a5fa, #fbbf24, #22c55e) are OK for things
  the player interacts with — they pop against the dark background.

  - You CAN use small filled accent shapes for collectibles (yellow
    circles for coins, green squares for goals).
  - NEVER use emoji as a main character or game element. Tiny emoji
    are OK only as decorative flourishes (a star above a head, etc).

Vocabulary:
  Score panel: "Score:" (handwritten feel). Win: "you win!" (lowercase,
  like a kid wrote it).

  This is the Diagonally house style — every game built in Stick Man
  vibe should feel like it could be one of the mechanic illustrations
  from the moon panels, but playable.
`,
  },
}

function buildForbiddenRules(allowPastels: boolean, allowSketch: boolean): string {
  const rules: string[] = []
  if (!allowPastels) {
    rules.push("- Pastel colors (baby blue, light pink, lavender). Use only the chosen vibe's palette.")
    rules.push("- The words \"cute\", \"kiddie\", \"fun for kids\", \"lovely\". This game is for learners 7-18.")
    rules.push("- Cartoonish proportions, soft drop shadows, \"playful\" rounded corners.")
    rules.push("- Pictures of crayons, balloons, or stars-and-rainbows decoration.")
  }
  if (!allowSketch) {
    rules.push("- Plain colored circles or rectangles as game characters. Use big emoji.")
  }
  rules.push("- Comic Sans, Times New Roman, Arial, default serifs.")
  rules.push("- The word \"mate\" or \"buddy\" anywhere in the UI.")
  return `\n🚫 BANNED — reject these even if you're tempted:\n${rules.join("\n")}\n`
}

export async function POST(req: Request) {
  try {
    const { designDoc, designChoices, visualConcept, vibe } = await req.json()

    const vibePreset = VIBE_PRESETS[vibe as string] ?? VIBE_PRESETS.arcade
    const forbiddenRules = buildForbiddenRules(!!vibePreset.allowPastels, !!vibePreset.allowSketch)
    const visualConceptBlock = visualConcept
      ? `\n\nVISUAL CONCEPT (the learner already approved this — match it):\n${visualConcept}\n`
      : ""

    // Sketch vibe overrides the "must use emoji" rule. Other vibes still
    // require big emoji as game characters.
    const characterRule = vibePreset.allowSketch
      ? `- Use stick figures and simple line drawings as the main characters (the sketch aesthetic). Tiny emoji decorations are OK but the main characters MUST be hand-drawn-style line art.`
      : `- Every moving entity (player, enemy, item, obstacle) MUST be a recognizable real thing — use big emoji at 50px+ font sizes.\n- Never use plain colored shapes as characters or items. ZERO exceptions.`

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 10000,
      system: `You generate complete, self-contained HTML files for playable browser games for learners aged 7-18. Output ONLY the HTML. No markdown. No code fences. Start with <!DOCTYPE html>.

🧠 INTRINSIC INTEGRATION — THE MOST IMPORTANT RULE:
This game teaches a math concept. Per Habgood & Ainsworth (2011), the math
concept MUST be the core player action — not a question stuck on top of an
unrelated game. The player verb IS the math operation.

❌ EXTRINSIC (forbidden — these are quizzes wearing a costume, not games):
- Multiple choice ("which of these is correct?")
- Type the answer in a box
- Click the right number / the right shape / the right bin
- A platformer/runner where you stop to answer a math question to keep going
- Any pattern where the math could be replaced by trivia and the game still works

✅ INTRINSIC (required — the math is the verb):
- The player physically MANIPULATES math objects to win
- Removing the math breaks the game itself, not just its scoring

CONCEPT → CORE VERB MAPPING (use this table to pick the right mechanic):

| Math concept type                  | Core player verb (the game IS this) |
|------------------------------------|--------------------------------------|
| Number line / ordering / comparing | Dive, jump, or fly to a position on a line |
| Counting / cardinality             | Collect a specific count of discrete objects |
| Place value / composing 10/100     | Stack, load, or pack into fixed-capacity containers |
| Addition / subtraction             | Combine or separate physical groups; merge/split |
| Multiplication / arrays            | Build a rectangle of rows × columns; tile a grid |
| Division / factoring               | Split an object into equal groups; cut/share evenly |
| Fractions (partitioning)           | Cut, slice, share a whole into equal parts |
| Fractions (equivalence)            | Mix or stretch parts until two amounts match |
| Ratio / proportion                 | Mix, pour, or balance two quantities (potions, paint) |
| Percent / scaling                  | Resize, zoom, fill a meter to a target proportion |
| Decimals                           | Aim/launch with magnitude; place on a fine number line |
| Measurement (length/area)          | Stretch, drag, compare, or fit shapes |
| Measurement (time/money)           | Spend, schedule, exchange tokens of fixed values |
| Geometry (shapes)                  | Build, fold, rotate, fit shapes together |
| Coordinate plane                   | Navigate, aim, or defend by (x,y) position |
| Algebra / equations                | Move/balance tokens across a divide to keep both sides equal |
| Functions / patterns               | Predict the next step; tune a machine that transforms input |
| Statistics / data                  | Sort, group, sample; build a chart by adding bars |
| Probability                        | Bet, gamble, weight outcomes; spin/draw to hit a target |

PROCESS — do this BEFORE writing any HTML:
1. Read the math role and concept below.
2. Match it to a row in the table above. Pick ONE core player verb.
3. Design the entire game around that verb. The verb is THE game.
4. Verify: if I removed the math, would the game still be playable? If yes,
   start over — the math is bolted on, not intrinsic.
5. At the very top of the <body>, write an HTML comment:
   <!-- coreVerb: <the verb you picked> -->
   This is required for debugging.

${vibePreset.spec}

${forbiddenRules}

🚨 CRITICAL VISUAL RULES:
${characterRule}
- Use the chosen vibe's palette and font. Import the Google Font in a <style>.
- The game looks like it belongs in the chosen era — not like a generic web app.

🚨 CRITICAL GAMEPLAY RULES:
- The math concept must be the core player verb (see intrinsic integration above).
- Every round must use different numbers so memorising doesn't work.
- Game ends after 3-5 rounds with a clear win/lose screen.
- Mouse/touch input. Keyboard is a bonus.
- Include a brief 1-sentence "how to play" before the game starts.
- BANNED interaction patterns (these are extrinsic quizzes, not games):
  multiple choice buttons, "type the answer" inputs, "tap the correct one"
  grids of options, trivia-style Q&A. If the design doc seems to imply these,
  REPLACE the mechanic with the matching intrinsic verb from the table above.

📖 MANDATORY HELP BUTTON — every game must include this:
A small "?" button (or "Help") visible in a corner of the game UI at all
times. Clicking it opens a tutorial panel overlay with:
  1. A short explanation of the math concept (2-3 sentences, age-appropriate)
  2. At least 2 examples of VALID answers/moves (with numbers shown)
  3. At least 2 examples of INVALID answers/moves (with WHY they're wrong)
  4. A "Got it" button to close the panel

The tutorial panel must use the same vibe palette and font as the rest of
the game. It overlays the play area without breaking the game state. The
player can open it anytime — including mid-round — to refresh themselves.

Implementation: a fixed-position button (top-right or bottom-right corner),
a hidden tutorial div that toggles via click. Don't make it a separate
screen — overlay it on top of the running game so the player doesn't
lose their place.

Example structure:
  <button id="helpBtn" onclick="document.getElementById('tutorial').style.display='flex'">?</button>
  <div id="tutorial" style="display:none; position:fixed; ...">
    <h2>How to play this</h2>
    <p>[concept explanation]</p>
    <h3>✅ Valid moves</h3>
    <ul><li>...</li><li>...</li></ul>
    <h3>❌ Invalid moves</h3>
    <ul><li>... (why it's wrong)</li><li>... (why it's wrong)</li></ul>
    <button onclick="document.getElementById('tutorial').style.display='none'">Got it</button>
  </div>

The valid/invalid examples MUST use real numbers from THIS game's math
concept, not generic placeholders. If the game is about fractions,
the examples are concrete fractions, not "fraction X" or "number Y".

🚨 MANDATORY POST-MESSAGE PROTOCOL — NON-NEGOTIABLE:
The game runs inside a parent app that needs to know when the player wins or loses.
You MUST include this exact handler in your <script> tag:

  function gameWin() { window.parent.postMessage({type:'game_win'}, '*'); }
  function gameLose() { window.parent.postMessage({type:'game_lose'}, '*'); }

And you MUST call gameWin() the moment the player wins a round (not just at the end of the game),
and gameLose() the moment the player loses (collision, time out, wrong answer too many times, etc.).
If you forget this, the parent app cannot mark the learner as having played and won. This is more
important than any other rule. Every game MUST call gameWin() at least once when the player wins.`,
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
- Vibe: ${vibePreset.label}${visualConceptBlock}

⚠️ FIRST: pick the core player verb using the CONCEPT → CORE VERB MAPPING in
the system prompt. The math role above tells you which row of the table
to use. The game's central interaction MUST be that verb. If the design
doc above describes anything that looks like multiple choice, "type the
answer", or "click the right one" — IGNORE that and replace it with the
intrinsic verb from the table. The design doc is a starting point, not
a constraint on the mechanic.

Add the required <!-- coreVerb: ... --> comment at the top of <body>.

REQUIREMENTS:
- All CSS and JavaScript inline.
- Apply the ${vibePreset.label} vibe spec strictly: palette, font, effects.
- Responsive — works on desktop and mobile.
- NEVER use overflow:hidden on the body. Game must be scrollable if needed.
- Maximum 700 lines of code. Polished, not bloated.
- Include the gameWin() and gameLose() functions and CALL them at the right moments.
- Include the mandatory "?" Help button and tutorial overlay (see system
  prompt). The tutorial must contain CONCRETE valid and invalid examples
  using real numbers from this game's math concept.

REMEMBER: ${vibePreset.allowSketch
  ? "main characters are stick figures and simple line drawings, NOT emoji."
  : "every character/item is a recognizable big EMOJI, never a plain shape."} The game must FEEL like it belongs in the ${vibePreset.label} aesthetic.`,
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

    // Log the model's chosen coreVerb so we can audit whether the
    // intrinsic-integration prompt is actually working. Cheap to keep on.
    const verbMatch = cleanHtml.match(/<!--\s*coreVerb:\s*(.+?)\s*-->/i)
    const coreVerb = verbMatch ? verbMatch[1] : "(NOT DECLARED)"
    console.log(`[generate] standard=${designDoc.standardId ?? "?"} mathRole="${designDoc.mathRole ?? "?"}" coreVerb="${coreVerb}"`)

    return Response.json({ html: cleanHtml })
  } catch (error) {
    console.error("Generate API error:", error)
    return Response.json(
      { error: "Failed to generate game. Please try again." },
      { status: 500 }
    )
  }
}
