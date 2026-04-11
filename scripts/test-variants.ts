import { generateWithEngine, getAvailableEngines, VIBE_PALETTES } from "../src/lib/game-engines/index"
import type { ThemeConfig, MathParams } from "../src/lib/game-engines/engine-types"

const cfg: ThemeConfig = {
  title: "T", character: "c", itemName: "i", targetName: "t", worldName: "w",
  colors: VIBE_PALETTES.stickman, vibe: "stickman", winMessage: "W", loseMessage: "L",
}
const math: MathParams = { grade: "6", standardId: "x", standardDescription: "x", difficulty: "medium" }

let ok = 0
for (const id of getAvailableEngines()) {
  const classic = generateWithEngine(id, cfg, math, "classic")
  const timed = generateWithEngine(id, cfg, math, "timed")
  const challenge = generateWithEngine(id, cfg, math, "challenge")
  const hasTimer = timed?.includes("startTimer")
  const hasChallenge = challenge?.includes("challengeMode")
  if (classic && timed && challenge && hasTimer && hasChallenge) {
    console.log("✅", id)
    ok++
  } else {
    console.log("⚠️", id, "classic:", !!classic, "timed:", !!timed && !!hasTimer, "challenge:", !!challenge && !!hasChallenge)
  }
}
console.log(`\n${ok}/${getAvailableEngines().length} engines support all 3 variants`)
