import Anthropic from "@anthropic-ai/sdk"

// Generate-and-test loop can take 60-180s in the worst case:
//   - Initial generation:        ~25-40s
//   - Static checks:             instant
//   - Playtest AI call:          ~15-25s
//   - Optional fix generation:   ~25-40s
//   - Optional 2nd playtest:     ~15-25s
// Total worst case: ~3 minutes. 300s gives us comfortable headroom.
// Vercel hobby plans cap at 60s; pro plans allow 300. Set the higher
// value here so the route works on whichever plan you're on.
export const maxDuration = 300

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
  - Draw all characters and items as inline SVG with the neon palette. Characters are simple geometric shapes with glowing outlines — a circle head, rectangle body, dot eyes. Items are SVG shapes with glow effects.

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
  - Draw all characters and items as inline SVG pixel-art style — blocky shapes, flat colors from the C64 palette. No emoji. Characters are simple 8-bit style SVG drawings.

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
  - Sprinkle a FEW small SVG-drawn decorative shapes floating gently in the background: tiny hearts, stars, flowers, clouds (max 6-8 total, drawn with SVG paths, NOT emoji). The main characters are SVG-drawn chubby creatures.
  - On wins, briefly pop SVG-drawn heart sparkles with a CSS keyframe animation (fade + scale).
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
  rules.push("- Emoji as game characters, items, or obstacles. Draw everything with inline SVG or CSS shapes.")
  rules.push("- Comic Sans, Times New Roman, Arial, default serifs.")
  rules.push("- The word \"mate\" or \"buddy\" anywhere in the UI.")
  return `\n🚫 BANNED — reject these even if you're tempted:\n${rules.join("\n")}\n`
}

// =====================================================================
// SELF-TEST PIPELINE
// =====================================================================
// We catch most broken games BEFORE the kid sees them by running:
//   1. Static structural checks (regex/parse) — instant, no AI cost
//   2. Playtest AI call — checks for runtime/logic bugs by simulating play
//   3. Fix-and-retry loop — sends specific bugs back to the generator
// Up to ~3 retries total. Total worst-case latency ~3 minutes; typical
// successful generation ~30-60s.

interface StaticCheckResult {
  ok: boolean
  issues: string[]
}

// Fast structural checks. Run first because they're free and catch the
// most blatant bugs (truncated HTML, missing gameWin call, etc).
function runStaticChecks(html: string): StaticCheckResult {
  const issues: string[] = []
  const lower = html.toLowerCase()

  // Truncation / structural completeness
  if (!lower.includes("<!doctype html>") && !lower.includes("<html")) {
    issues.push("HTML is missing the <!DOCTYPE html> declaration. The file looks truncated or malformed.")
  }
  if (!lower.includes("<body")) {
    issues.push("HTML is missing a <body> tag.")
  }
  if (!lower.includes("</body>")) {
    issues.push("HTML is missing a closing </body> tag — probably truncated mid-generation.")
  }
  if (!lower.includes("</html>")) {
    issues.push("HTML is missing a closing </html> tag — probably truncated mid-generation.")
  }
  if (!lower.includes("<script")) {
    issues.push("Game has no <script> tag, so it has no game logic at all.")
  }

  // Required postMessage protocol
  if (!html.includes("function gameWin") && !html.includes("gameWin =") && !html.includes("gameWin:")) {
    issues.push("Game does not define a gameWin() function. The parent app cannot detect wins.")
  }
  if (!html.includes("function gameLose") && !html.includes("gameLose =") && !html.includes("gameLose:")) {
    issues.push("Game does not define a gameLose() function.")
  }
  // Check that gameWin is actually CALLED somewhere (not just defined).
  // We look for an invocation pattern that isn't the function declaration.
  const gameWinDefIndex = html.indexOf("gameWin")
  const gameWinAfterDef = gameWinDefIndex >= 0 ? html.slice(gameWinDefIndex + 50) : ""
  if (!gameWinAfterDef.includes("gameWin(")) {
    issues.push("gameWin() is defined but never called. The player can never win this game.")
  }

  // At least one interactive element
  const hasInteraction =
    html.includes("addEventListener") ||
    /onclick\s*=/i.test(html) ||
    /ontouch/i.test(html) ||
    /onkey/i.test(html) ||
    /onpointerdown/i.test(html)
  if (!hasInteraction) {
    issues.push("Game has no event listeners or onclick handlers. Nothing the player does will register.")
  }

  // Forbidden body overflow:hidden
  // Look for body { ... overflow: hidden ... } pattern
  if (/body\s*\{[^}]*overflow\s*:\s*hidden/i.test(html)) {
    issues.push("Body has overflow:hidden which can hide the win screen. Remove it.")
  }

  // Brace balance — basic JS syntax sanity check
  const openBraces = (html.match(/\{/g) ?? []).length
  const closeBraces = (html.match(/\}/g) ?? []).length
  if (Math.abs(openBraces - closeBraces) > 2) {
    issues.push(`Curly braces are unbalanced (${openBraces} open vs ${closeBraces} close). The script may have a syntax error.`)
  }

  return { ok: issues.length === 0, issues }
}

interface PlaytestResult {
  works: boolean
  issues: string[]
  winPath: string
  // Raw AI text in case parsing fails — useful for debugging.
  raw?: string
}

// Calls Claude to "playtest" the game. The model reads the HTML and
// answers structured questions about whether a kid could actually
// play and win it. Returns a JSON-shaped result.
async function runPlaytest(html: string, designDoc: { title?: string; concept?: string; mathRole?: string; winCondition?: string }): Promise<PlaytestResult> {
  try {
    const playtestSystem = `You are a paranoid QA tester for a kids' math game app. A 6-12 year old will play the game you're testing. Your job is to find any bug, dead button, or contradiction BEFORE the kid does.

You will read a complete HTML game file and report whether it actually works.

Check for these specific bugs:
1. ELEMENT/WORD MISMATCH: Does every visible word in the UI match a real element on screen? Example bug: the UI says "Click a light beam" but there is no element called a light beam — only buttons labeled with numbers.
2. DEAD HANDLERS: Does every button/clickable element have a working onclick that actually changes game state? Example bug: a button exists but its onclick is missing, empty, or points to a function that does nothing.
3. STALE STATUS TEXT: Is any status message hardcoded to a wrong state on load? Example bug: "Status: try again!" is showing on round 1 before the player has even made a move.
4. UNREACHABLE WIN: Is there any 3-step sequence the player could take that triggers gameWin()? If you can't find a path to victory, the game is unwinnable.
5. ROUND-RESET BUGS: If the game has multiple rounds, does round 2 work? Does the score, status, target, and UI reset properly between rounds?
6. MATH NOT EMBODIED: Is the math the actual REASON to click something, or is it cosmetic? Example bug: the game says it teaches fractions but you can win by clicking randomly.
7. TRUNCATION / SYNTAX: Does the HTML end with </html>? Does the JavaScript look syntactically complete (no missing braces, no obvious truncation)?
8. WIN BUTTON DISABLED FOREVER: Is the main "submit / build / done" button stuck disabled because of a state bug?

For each bug you find, describe it in ONE concrete sentence the generator can act on. Don't say "the game has issues" — say "the 70 button has no onclick handler" or "the status bar is hardcoded to 'try again' on line 142."

Output JSON ONLY, no markdown, no code fences, no commentary:
{"works": true|false, "issues": ["specific bug 1", "specific bug 2", ...], "winPath": "click X then Y then Z to win"}

If works=true, issues should be an empty array. winPath should always be a concrete sequence even if works=false (your best guess of how to win).`

    const playtestUser = `Game design:
- Title: ${designDoc.title ?? "?"}
- Math concept: ${designDoc.concept ?? "?"}
- Math role: ${designDoc.mathRole ?? "?"}
- Win condition: ${designDoc.winCondition ?? "?"}

Game HTML:
${html}

Now playtest this. Return JSON only.`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      system: playtestSystem,
      messages: [{ role: "user", content: playtestUser }],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")
    if (start === -1 || end === -1) {
      console.warn("[playtest] no JSON in response — assuming game works")
      return { works: true, issues: [], winPath: "(playtest unparseable)", raw: text.slice(0, 200) }
    }
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as PlaytestResult
    return {
      works: !!parsed.works,
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      winPath: typeof parsed.winPath === "string" ? parsed.winPath : "",
    }
  } catch (e) {
    // If playtest fails for any reason, don't block the kid — assume
    // the game works and let them try it. Better than blocking forever.
    console.warn("[playtest] error:", String(e))
    return { works: true, issues: [], winPath: "(playtest failed)" }
  }
}

// Wraps an Anthropic generation call. Used both for the initial
// generation and for fix-up generations during the self-test loop.
async function generateGameHtml(opts: {
  systemPrompt: string
  userPrompt: string
}): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 10000,
    system: opts.systemPrompt,
    messages: [{ role: "user", content: opts.userPrompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""
  let cleanHtml = text
  if (cleanHtml.startsWith("```")) {
    cleanHtml = cleanHtml.replace(/^```html?\n?/, "").replace(/\n?```$/, "")
  }
  return cleanHtml
}

// =====================================================================
// POST /api/game/generate
// =====================================================================
// Generates a playable HTML game with a self-test loop:
//   1. Generate HTML
//   2. Run static checks (instant)
//   3. If structural issues, ask AI to fix them, regenerate
//   4. Run AI playtest
//   5. If playtest reports issues, ask AI to fix them, regenerate
//   6. Return whatever HTML we have (better something than nothing)
//
// Up to 3 generation attempts total. Each attempt includes the
// previous bug list as fix instructions.

export async function POST(req: Request) {
  // We track wall-clock time so the loop can degrade gracefully if
  // we're approaching the route's maxDuration. Each step checks
  // "do I have enough time for one more AI call?" and skips itself
  // if not. The kid still gets a game (better unverified than no
  // game at all).
  //
  // Time budget per step (rough averages, padded for safety):
  //   Initial generation:  45s
  //   Static check fix:    45s
  //   Playtest:            30s
  //   Playtest fix:        45s
  //
  // If we're past 200s budget remaining (out of 300s maxDuration),
  // we skip the playtest entirely and ship whatever we have.
  const startTime = Date.now()
  const TIMEOUT_MS = 290_000 // 290s — leaves 10s buffer below the 300s hard limit
  const remaining = () => TIMEOUT_MS - (Date.now() - startTime)

  try {
    const { designDoc, visualConcept, vibe } = await req.json()

    const vibePreset = VIBE_PRESETS[vibe as string] ?? VIBE_PRESETS.arcade
    const systemPrompt = buildSystemPrompt(vibePreset, visualConcept)
    const baseUserPrompt = buildUserPrompt(designDoc, vibePreset, visualConcept)

    // ATTEMPT 1: initial generation
    let html = await generateGameHtml({
      systemPrompt,
      userPrompt: baseUserPrompt,
    })

    if (!html || (!html.includes("<!DOCTYPE html>") && !html.includes("<html"))) {
      return Response.json({ error: "Failed to generate game" }, { status: 500 })
    }

    // STATIC CHECKS — instant, always run
    let staticResult = runStaticChecks(html)
    console.log(`[generate] attempt 1 static checks:`, staticResult.ok ? "OK" : staticResult.issues.length + " issues")

    // FIX-FROM-STATIC retry (up to 1) — only if we have time
    if (!staticResult.ok && remaining() > 60_000) {
      const fixPrompt = `${baseUserPrompt}

⚠️ THE PREVIOUS ATTEMPT HAD THESE STRUCTURAL BUGS — fix them:
${staticResult.issues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

Regenerate the entire HTML, fixing all the bugs above. Output ONLY the HTML.`
      html = await generateGameHtml({ systemPrompt, userPrompt: fixPrompt })
      staticResult = runStaticChecks(html)
      console.log(`[generate] attempt 2 (after static fix):`, staticResult.ok ? "OK" : staticResult.issues.length + " issues remaining")
    } else if (!staticResult.ok) {
      console.log(`[generate] skipping static fix retry — only ${Math.round(remaining() / 1000)}s left`)
    }

    // PLAYTEST — only if we have time for both the playtest AND a
    // potential follow-up fix (~75s combined)
    if (remaining() > 75_000) {
      const playtest = await runPlaytest(html, designDoc)
      console.log(`[generate] playtest:`, playtest.works ? "OK" : `${playtest.issues.length} issues`)
      if (!playtest.works && playtest.issues.length > 0) {
        console.log(`[generate] playtest issues:`, playtest.issues.slice(0, 3).join(" | "))
      }

      // FIX-FROM-PLAYTEST retry (up to 1) — only if we have time
      if (!playtest.works && playtest.issues.length > 0 && remaining() > 50_000) {
        const fixPrompt = `${baseUserPrompt}

⚠️ A PLAYTEST OF YOUR PREVIOUS ATTEMPT FOUND THESE BUGS — fix all of them:
${playtest.issues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

Regenerate the COMPLETE HTML file, fixing every bug above. Pay special attention to:
- Click handlers must actually do something to game state
- Status text must reflect the current state, not be hardcoded
- gameWin() must be reachable through normal play
- Math must be the REASON to click, not decoration

Output ONLY the HTML, no markdown, no code fences.`
        html = await generateGameHtml({ systemPrompt, userPrompt: fixPrompt })
        console.log(`[generate] attempt 3 (after playtest fix) — sending to learner regardless`)
      } else if (!playtest.works) {
        console.log(`[generate] skipping playtest fix retry — only ${Math.round(remaining() / 1000)}s left`)
      }
    } else {
      console.log(`[generate] skipping playtest entirely — only ${Math.round(remaining() / 1000)}s left after generation`)
    }

    // Log the chosen coreVerb for audit
    const verbMatch = html.match(/<!--\s*coreVerb:\s*(.+?)\s*-->/i)
    const coreVerb = verbMatch ? verbMatch[1] : "(NOT DECLARED)"
    const totalSeconds = Math.round((Date.now() - startTime) / 1000)
    console.log(`[generate] standard=${designDoc.standardId ?? "?"} mathRole="${designDoc.mathRole ?? "?"}" coreVerb="${coreVerb}" totalTime=${totalSeconds}s`)

    return Response.json({ html })
  } catch (error) {
    console.error("Generate API error:", error)
    return Response.json(
      { error: "Failed to generate game. Please try again." },
      { status: 500 }
    )
  }
}

// =====================================================================
// PROMPT BUILDERS — split out so the self-test loop can rebuild the
// user prompt with bug-fix instructions appended.
// =====================================================================

interface VibePresetLite {
  label: string
  spec: string
  allowPastels?: boolean
  allowSketch?: boolean
}

function buildSystemPrompt(vibePreset: VibePresetLite, _visualConcept: string | undefined): string {
  const forbiddenRules = buildForbiddenRules(!!vibePreset.allowPastels, !!vibePreset.allowSketch)
  const characterRule = vibePreset.allowSketch
    ? `- Use stick figures and simple line drawings as the main characters (the sketch aesthetic). All characters MUST be SVG-drawn line art — no emoji.`
    : `- Every moving entity (player, enemy, item, obstacle) MUST be drawn with inline SVG — simple shapes with faces (circle head, dot eyes, curved mouth). No emoji anywhere.`

  return `You generate complete, self-contained HTML files for playable browser games for learners aged 7-18. Output ONLY the HTML. No markdown. No code fences. Start with <!DOCTYPE html>.

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
- NEVER use emoji as game characters, items, or obstacles. Draw ALL visual
  elements using inline SVG (<svg>, <circle>, <rect>, <path>, <line>) or
  CSS shapes with colors, gradients, and shadows.
- Characters should have simple faces drawn with SVG: two small circles
  for eyes, a curve for a mouth. Bodies are simple shapes (circles, rounded
  rects). Think: cute but minimal, like a Hollow Knight character.
- Items and obstacles are also SVG-drawn: a coin is a yellow circle with
  a shine highlight, a wall is a rectangle, a star is a polygon.
- Use the chosen vibe's palette and font. Import the Google Font in a <style>.
- The game looks like it belongs in the chosen era — not like a generic web app.

🎮 GAME JUICE — every game MUST include ALL of these:
- PARTICLE BURST on correct action: spawn 8-12 small colored circles that
  fly outward and fade over 0.5s. Use CSS animations, not canvas.
- SCREEN SHAKE on wrong action: translateX jitter on the game container
  (±4px, 3 cycles, 0.3s total). Brief and punchy.
- SCORE POP-UPS: when points are earned, show "+10" text that floats
  upward and fades out over 0.8s at the location of the action.
- COMBO COUNTER: track consecutive correct actions. Show "2x!", "3x!",
  "4x!" with increasing font size and brighter color. Reset on wrong action.
- PROGRESSIVE DIFFICULTY: start easy (big targets, slow speed, simple
  numbers), get harder each round (smaller targets, faster, bigger numbers).
- RANDOMIZED VALUES: every playthrough uses different numbers, positions,
  or configurations. Never the same twice.
- TIMER WITH VISUAL PULSE: if there's a timer, make it pulse red and
  grow slightly when under 25% remaining.
- VICTORY CELEBRATION: on win, show a big animated celebration — particles
  flying everywhere, text scaling up with a bounce, background flash.
  NOT just a plain "You win!" text.
- SMOOTH ANIMATIONS: all movement uses CSS transitions or requestAnimationFrame.
  Nothing should teleport. Elements should ease-in-out.

🚨 CRITICAL GAMEPLAY RULES:
- The math concept must be the core player verb (see intrinsic integration above).
- Every round must use different numbers so memorising doesn't work.
- Game should have 3-5 rounds with progressive difficulty, ending with a clear win/lose.
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
important than any other rule. Every game MUST call gameWin() at least once when the player wins.`
}

// Builds the user prompt with the design doc and visual concept
// embedded. The same prompt is reused on retries (with bug-fix
// instructions appended) inside the self-test loop.
interface DesignDoc {
  title?: string
  concept?: string
  howItWorks?: string
  rules?: string[]
  winCondition?: string
  mathRole?: string
  standardId?: string
}

function buildUserPrompt(
  designDoc: DesignDoc,
  vibePreset: VibePresetLite,
  visualConcept: string | undefined
): string {
  const visualConceptBlock = visualConcept
    ? `\n\nVISUAL CONCEPT (the learner already approved this — match it):\n${visualConcept}\n`
    : ""

  return `Generate a complete, self-contained HTML file for a playable browser game.

GAME DESIGN:
- Title: ${designDoc.title}
- Concept: ${designDoc.concept}
- How it works: ${designDoc.howItWorks}
- Rules: ${(designDoc.rules || []).join(". ")}
- Win condition: ${designDoc.winCondition}
- Math role: ${designDoc.mathRole}
- Vibe: ${vibePreset.label}${visualConceptBlock}

⚠️ MANDATORY DESIGN RULES:
1. The THEME, CHARACTER, and WIN CONDITION above are NON-NEGOTIABLE. The learner
   chose them. The game MUST use them exactly:
   - The game world/setting MUST match the theme
   - The player character MUST be the character described
   - The win condition MUST work exactly as described
2. Pick the core player verb using the CONCEPT → CORE VERB MAPPING in the system
   prompt. The math role tells you which row. The game's central interaction MUST
   be that verb.
3. If the design doc describes a quiz pattern (multiple choice, type the answer,
   click the right one) — replace ONLY the interaction pattern with the intrinsic
   verb, but KEEP the theme, character, and win condition unchanged.

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

🚨 SELF-CHECK BEFORE FINALIZING:
- Does every visible UI word correspond to a real element on screen?
- Does every button have a working onclick that changes game state?
- Is the status text correct on round 1 (not pre-set to "try again")?
- Can the player actually reach gameWin() through normal play?
- Does round 2 reset the score, status, target, and UI properly?

REMEMBER: ${vibePreset.allowSketch
  ? "main characters are stick figures and simple line drawings, NOT emoji."
  : "every character/item is a recognizable big EMOJI, never a plain shape."} The game must FEEL like it belongs in the ${vibePreset.label} aesthetic.`
}
