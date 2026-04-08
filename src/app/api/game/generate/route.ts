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
  cute: {
    label: "Cute",
    allowPastels: true,
    spec: `
🎀 CUTE VIBE — soft pastel, kawaii-inspired but NOT cheesy:

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

Effects:
  - Gentle gradient or solid pastel background. NO black backgrounds, NO neon, NO scanlines.
  - Everything has soft rounded corners (border-radius 12-24px).
  - Buttons have a soft shadow (box-shadow: 0 4px 12px rgba(244, 114, 182, 0.25)).
  - Sprinkle a FEW decorative emoji floating gently in the background: 🌸 ✨ 💖 ⭐ ☁️ 🌷 (max 6-8 total).
  - Use big emoji as game characters (50px+) — prefer cute ones: 🐱 🐰 🦄 🐼 🐻 🌸 🍰 🍓 ⭐ 🌙 ☁️ 🦋 🐝 🌷.
  - On wins, briefly pop heart sparkles ✨💖 with a CSS keyframe animation (fade + scale).
  - Animations are gentle and bouncy (cubic-bezier with ease-out, no harsh step()).

🚫 BUT NOT CHEESY — ban these even though it's the cute vibe:
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
  sketch: {
    label: "Sketch",
    allowSketch: true,
    spec: `
✏️ SKETCH VIBE — hand-drawn notebook aesthetic:

Color palette (use ONLY these):
  Background:   #fdfcf7 (warm paper white) — apply a subtle paper texture using a CSS background of repeating noise or a tiny grain pattern.
  Ink:          #1f2937 (near-black, wobbly handwritten ink)
  Faint grid:   #e5e7eb at 0.4 opacity — optional notebook ruling lines or grid
  Accent:       #dc2626 (red ink for highlights, like a teacher's pen)
  Light accent: #fde68a (highlighter yellow) — use sparingly for selected items
  Text:         #1f2937

Typography:
  @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
  font-family: 'Patrick Hand', cursive;
  font-size 22-30px (handwriting needs to be bigger to read).

Effects:
  - Paper background — use a CSS background-image with a subtle paper grain or just solid #fdfcf7.
  - All borders are 2-3px solid #1f2937 with a slightly imperfect feel (use border-radius: 4px max — no perfectly round shapes).
  - Lines are 1.5-2.5px thick.
  - NO drop shadows. NO glow. NO gradients.
  - Add a subtle "wobble" animation to characters: a CSS keyframe that translates by 1-2px and rotates by 0.5-1deg, creating a hand-shake feel.
  - Optional: faint horizontal notebook lines across the background.

🎨 SKETCH CHARACTERS — special rule:
  Unlike other vibes, this vibe USES STICK FIGURES AND SIMPLE LINE DRAWINGS, NOT EMOJI.
  - The player and other characters are stick figures drawn in SVG: head circle, body line, arm lines, leg lines, all in #1f2937 ink.
  - Items can be simple line-drawn shapes (a square with squiggles for a box, a triangle with a base for a mountain, etc.).
  - You CAN use emoji for tiny decorations (a star, a heart) but NEVER as the main character.
  - Stick figures should wobble or step like the ones in Option C's mechanic illustrations.

Vocabulary:
  Score panel: "Score:" (handwritten feel). Win: "you win!" (lowercase, like a kid wrote it).
  This looks like a math notebook came to life.
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
      max_tokens: 8000,
      system: `You generate complete, self-contained HTML files for playable browser games for learners aged 7-18. Output ONLY the HTML. No markdown. No code fences. Start with <!DOCTYPE html>.

${vibePreset.spec}

${forbiddenRules}

🚨 CRITICAL VISUAL RULES:
${characterRule}
- Use the chosen vibe's palette and font. Import the Google Font in a <style>.
- The game looks like it belongs in the chosen era — not like a generic web app.

🚨 CRITICAL GAMEPLAY RULES:
- The math concept must be ESSENTIAL — the player cannot win without using it.
- Every round must use different numbers so memorising doesn't work.
- Game ends after 3-5 rounds with a clear win/lose screen.
- Mouse/touch input. Keyboard is a bonus.
- Include a brief 1-sentence "how to play" before the game starts.

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

REQUIREMENTS:
- All CSS and JavaScript inline.
- Apply the ${vibePreset.label} vibe spec strictly: palette, font, effects.
- Responsive — works on desktop and mobile.
- NEVER use overflow:hidden on the body. Game must be scrollable if needed.
- Maximum 600 lines of code. Polished, not bloated.
- Include the gameWin() and gameLose() functions and CALL them at the right moments.

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

    return Response.json({ html: cleanHtml })
  } catch (error) {
    console.error("Generate API error:", error)
    return Response.json(
      { error: "Failed to generate game. Please try again." },
      { status: 500 }
    )
  }
}
