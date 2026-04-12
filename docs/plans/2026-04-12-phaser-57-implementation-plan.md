# Phaser 57 Game Options — Implementation Plan

> **For Claude:** This plan is designed so that multiple people working in parallel sessions can each pick up a phase or individual mechanic and build it independently. Each mechanic is self-contained after Phase 1 infrastructure is complete.

**Design doc:** `docs/plans/2026-04-12-phaser-57-game-options-design.md`
**Blueprint specs:** `docs/diagonally-blueprint.html` (Section 7, "Detailed Game Option Specs")

---

## Phase 1: Infrastructure (must be done first)

### Task 1.1: Update Type System

**Files:** `src/lib/game-engines/engine-types.ts`

- Replace `GameVariant = "classic" | "timed" | "challenge"` with `GameOption = string`
- Update `GameEngine` type: `(config: ThemeConfig, math: MathParams, option?: string) => string`
- Keep `GameVariant` as a deprecated alias temporarily so existing code doesn't break during migration
- Remove `dare` from ThemeConfig (not used in new builder)

### Task 1.2: Create Game Option Registry

**Files:** Create `src/lib/game-engines/game-option-registry.ts`

Define all 57 game options with metadata for the UI:

```typescript
export interface GameOptionDef {
  id: string                    // e.g. "free-collect"
  mechanicId: string            // e.g. "resource-management"
  name: string                  // e.g. "Free Collect"
  description: string           // e.g. "Click items to hit exact target sum"
  introText: string             // shown on tutorial overlay before play
  helpText: string              // shown in help panel (?) during play
}

export const GAME_OPTIONS: GameOptionDef[] = [
  // 1. Collect & Manage
  {
    id: "free-collect",
    mechanicId: "resource-management",
    name: "Free Collect",
    description: "Click items to hit exact target sum",
    introText: "Items appear with numbers. Click to collect — your total must match the target exactly. Click again to put items back. Too many or too few and you lose a life!",
    helpText: "Each round shows a target number.\n\nClick items to collect them — your total must match exactly.\n\n✅ Target is 15 → click 8 + 7 = 15 (correct!)\n❌ Target is 15 → click 8 + 9 = 17 (too much!)"
  },
  {
    id: "conveyor-belt",
    mechanicId: "resource-management",
    name: "Conveyor Belt",
    description: "Items scroll past — grab the right ones before they disappear",
    introText: "Items slide across a belt. Tap the ones you need before they fall off! Your total must match the target. You can't put items back — choose carefully!",
    helpText: "Items scroll across the belt.\n\nTap to grab — they add to your total.\n\n✅ Target is 20 → grab 12 + 8 = 20 (correct!)\n❌ Missed the 8? Too late — it's gone!"
  },
  {
    id: "split-the-loot",
    mechanicId: "resource-management",
    name: "Split the Loot",
    description: "Divide items into 2 bins — each must hit its own target",
    introText: "Two bins, two targets. Drag every item into a bin. Both bins must hit their target exactly. Plan before you place!",
    helpText: "Each bin has its own target number.\n\nDrag items into bins. Both must match.\n\n✅ Left target 10, Right target 15 → split items so left=10, right=15\n❌ Left=12, Right=13 → neither matches!"
  },
  // ... (remaining 54 options follow same pattern — fill from blueprint specs)
]

export const GAME_OPTIONS_BY_MECHANIC = new Map<string, GameOptionDef[]>()
GAME_OPTIONS.forEach(opt => {
  const list = GAME_OPTIONS_BY_MECHANIC.get(opt.mechanicId) || []
  list.push(opt)
  GAME_OPTIONS_BY_MECHANIC.set(opt.mechanicId, list)
})

export function getDefaultOption(mechanicId: string): string {
  const options = GAME_OPTIONS_BY_MECHANIC.get(mechanicId)
  return options?.[0]?.id || "free-collect"
}
```

Fill in all 57 options using the specs from the blueprint.

### Task 1.3: Extract Shared Phaser Base

**Files:** Create `src/lib/game-engines/base-phaser-template.ts`

Extract from `collect-manage-phaser.ts` into a reusable function:

```typescript
export function phaserGame(opts: {
  config: ThemeConfig
  math: MathParams
  option: string
  gameSceneCode: string    // the JS source for GameScene class(es)
  sceneName: string        // which scene to start: "FreeCollect", "ConveyorBelt", etc.
  introText: string
  helpText: string
}): string
```

**What moves to the base:**
- HTML shell + Phaser CDN load
- BootScene (loading bar, sprite preloading)
- VictoryScene (celebration, particles, score, game_win postMessage)
- GameOverScene (game_lose postMessage)
- HUD class (title, score, round dots, life hearts, help button)
- GameJuice class (burstParticles, screenShake, comboCounter, scorePop)
- Font loading (Space Grotesk + Lexend)
- Phaser.Game config (800×600, Scale.FIT, CENTER_BOTH)
- Tutorial overlay
- Help panel overlay

**What stays in engine files:**
- GameScene class(es) — the gameplay
- Round generation logic
- Per-option intro/help text (passed to base)

### Task 1.4: Update Circuit Board Builder

**Files:** `src/components/standard/game-card-builder.tsx`

- Remove win-condition slot
- Replace with Game Option picker: 3 cards per mechanic from `GAME_OPTIONS_BY_MECHANIC`
- Each card shows: option name + short description
- Selected option ID stored in state as `gameOption`
- Pass `gameOption` through to designDoc / onBuildGame callback

Builder slots become:
1. Background (sprite picker — unchanged)
2. Character (sprite picker — unchanged)
3. Game Option (3 cards — NEW, replaces win condition)
4. Items (sprite picker — unchanged)

### Task 1.5: Update API Route + Engine Registry

**Files:**
- `src/app/api/game/generate-engine/route.ts`
- `src/lib/game-engines/index.ts`

- Accept `gameOption` parameter in the API route body
- Pass it through to `generateWithEngine(mechanicId, config, math, gameOption)`
- Update `generateWithEngine` signature to accept `option?: string`
- Pass `option` to individual engine functions

### Task 1.6: Rewrite Collect & Manage as Reference

**Files:** `src/lib/game-engines/collect-manage-phaser.ts`

Rewrite to use the shared base and implement all 3 game options:
- `FreeCollectScene` — existing gameplay, cleaned up
- `ConveyorBeltScene` — new: horizontal scrolling items, tap to grab
- `SplitTheLootScene` — new: two bins with drag-and-drop

This is the reference implementation that all other engines should follow.

### Task 1.7: Verify and Deploy

- `npx next build` — must pass
- Test all 3 Collect & Manage options in the browser
- Verify other (DOM) engines still work unchanged
- Deploy to production

---

## Phase 2: High-Impact Mechanics

> **Can be parallelized:** Each mechanic below is independent. Multiple people can work on different mechanics simultaneously.

### Prerequisites
- Phase 1 must be complete (shared base exists, types updated, builder updated)
- Read the reference implementation: `collect-manage-phaser.ts`
- Read the blueprint specs for your mechanic in `docs/diagonally-blueprint.html`

### How to Build a Mechanic (template for all phases)

1. **Read the blueprint spec** for your mechanic (Section 7, "Detailed Game Option Specs")
2. **Read the reference:** `collect-manage-phaser.ts` to understand the pattern
3. **Create the engine file:** `src/lib/game-engines/<mechanic>-phaser.ts`
4. **Implement 3 GameScene classes** — one per game option
5. **Implement round generation** — must guarantee solvable rounds, progressive difficulty
6. **Use the shared base:** call `phaserGame({...})` with your scenes
7. **Register the engine** in `src/lib/game-engines/index.ts` (replace the DOM engine import)
8. **Add game options** to `game-option-registry.ts` (if not already there from Task 1.2)
9. **Build check:** `npx next build`
10. **Browser test:** play all 3 options, verify math works, verify win/lose, verify on mobile viewport

### Task 2.1: Balance & Equalize (224 standards)

**File:** `src/lib/game-engines/balance-equalize-phaser.ts`
**Replaces:** `balance-equalize.ts` (300 lines DOM)
**Mechanic ID:** `balance-systems`

**Game Options:**
- `free-balance` — Drag weights to both sides. Beam tilts based on difference.
- `mystery-side` — One side covered. Place weights, then type the hidden value.
- `chain-scales` — 3 connected scales. Output of one feeds into next.

**Key Phaser work:** Scale beam tilt animation (rotates around fulcrum pivot), weight drag-and-drop onto pans, chain connection visualization.

### Task 2.2: Score & Rank (98 standards)

**File:** `src/lib/game-engines/score-rank-phaser.ts`
**Replaces:** `score-rank.ts` (274 lines DOM)
**Mechanic ID:** `scoring-ranking`

**Game Options:**
- `sorting-lane` — Drag items into order in a lane.
- `number-line-drop` — Drop tokens onto correct positions on a number line.
- `leaderboard-fix` — Find and swap wrongly-placed entries in a scoreboard.

**Key Phaser work:** Drag-to-reorder with snap-to-slot, number line with zoom, tap-two-to-swap mechanic.

### Task 2.3: Craft & Combine (155 standards)

**File:** `src/lib/game-engines/craft-combine-phaser.ts`
**Replaces:** `craft-combine.ts` (151 lines DOM)
**Mechanic ID:** `inventory-crafting`

**Game Options:**
- `recipe-mixer` — Set ingredient amounts with +/- steppers to match recipe.
- `potion-lab` — Drag ingredients with multipliers to cauldron. Hit formula target.
- `assembly-line` — Select groups on conveyor to merge. Hit target count.

**Key Phaser work:** Stepper UI for amounts, drag-to-cauldron with multiplier math, conveyor belt with group selection.

---

## Phase 3: Medium Complexity

### Task 3.1: Split & Share (87 standards)

**File:** `src/lib/game-engines/split-share-phaser.ts`
**Replaces:** `split-share.ts` (107 lines DOM)
**Mechanic ID:** `partitioning`

**Game Options:** `cut-the-bar`, `pour-the-liquid`, `share-the-pizza`

**Key Phaser work:** Interactive cut lines on rectangle, slider-based liquid fill, pizza slice drag-and-drop.

### Task 3.2: Scale & Transform (102 standards)

**File:** `src/lib/game-engines/scale-transform-phaser.ts`
**Replaces:** `scale-transform.ts` (154 lines DOM)
**Mechanic ID:** `scaling-resizing`

**Game Options:** `resize-tool`, `recipe-scaler`, `map-distance`

**Key Phaser work:** Shape scaling with slider, editable recipe amounts, map with click-to-measure tool.

### Task 3.3: Measure & Compare (130 standards)

**File:** `src/lib/game-engines/measure-compare-phaser.ts`
**Replaces:** `measure-compare.ts` (122 lines DOM)
**Mechanic ID:** `measurement-challenges`

**Game Options:** `size-picker`, `ruler-race`, `unit-converter`

**Key Phaser work:** Quick-fire comparison cards, ruler with fine markings and zoom, conversion reference card.

### Task 3.4: Bid & Estimate (97 standards)

**File:** `src/lib/game-engines/bid-estimate-phaser.ts`
**Replaces:** `bid-estimate.ts` (133 lines DOM)
**Mechanic ID:** `bidding-auction`

**Game Options:** `auction-house`, `price-is-right`, `round-and-win`

**Key Phaser work:** Bid slider with competing AI bids, price reveal animation, rounding with place-value highlight.

---

## Phase 4: Mixed Interaction Types

### Task 4.1: Pattern & Repeat (75 standards)

**File:** `src/lib/game-engines/pattern-repeat-phaser.ts`
**Replaces:** `pattern-repeat.ts` (169 lines DOM)
**Mechanic ID:** `timing-rhythm`

**Game Options:** `sequence-builder`, `pattern-machine`, `broken-pattern`

### Task 4.2: Rise & Fall (73 standards)

**File:** `src/lib/game-engines/rise-fall-phaser.ts`
**Replaces:** `rise-fall.ts` (203 lines DOM)
**Mechanic ID:** `above-below-zero`

**Game Options:** `depth-navigator`, `temperature-swing`, `elevator-operator`

### Task 4.3: Build & Measure (113 standards)

**File:** `src/lib/game-engines/build-measure-phaser.ts`
**Replaces:** `build-measure.ts` (141 lines DOM)
**Mechanic ID:** `construction-systems`

**Game Options:** `stack-to-target`, `fill-the-floor`, `box-packer`

### Task 4.4: Plot & Explore (70 standards)

**File:** `src/lib/game-engines/plot-explore-phaser.ts`
**Replaces:** `plot-explore.ts` (182 lines DOM)
**Mechanic ID:** `terrain-generation`

**Game Options:** `coordinate-hunter`, `battleship`, `treasure-trail`

---

## Phase 5: Complex Phaser Features

### Task 5.1: Fit & Rotate (149 standards)

**File:** `src/lib/game-engines/fit-rotate-phaser.ts`
**Replaces:** `fit-rotate.ts` (64 lines DOM)
**Mechanic ID:** `spatial-puzzles`

**Game Options:** `rotate-to-match`, `tangram-fill`, `mirror-puzzle`

**Key challenge:** Rotation/flip controls, multi-piece puzzle with overlap detection, symmetry validation.

### Task 5.2: Roll & Predict (100 standards)

**File:** `src/lib/game-engines/roll-predict-phaser.ts`
**Replaces:** `roll-predict.ts` (92 lines DOM)
**Mechanic ID:** `probability-systems`

**Game Options:** `find-the-stat`, `bet-the-spinner`, `build-the-chart`

**Key challenge:** Weighted spinner animation, draggable histogram bars, stat calculation.

### Task 5.3: Race & Calculate (73 standards)

**File:** `src/lib/game-engines/race-calculate-phaser.ts`
**Replaces:** `race-calculate.ts` (89 lines DOM)
**Mechanic ID:** `motion-simulation`

**Game Options:** `launch-to-target`, `speed-trap`, `catch-up`

**Key challenge:** Projectile arc physics, real-time motion with checkpoint timing, chase animation.

### Task 5.4: Grow & Compound (54 standards)

**File:** `src/lib/game-engines/grow-compound-phaser.ts`
**Replaces:** `grow-compound.ts` (157 lines DOM)
**Mechanic ID:** `strategy-economy`

**Game Options:** `investment-sim`, `population-boom`, `doubling-maze`

**Key challenge:** Growth visualization with bar graph animation, maze navigation with value tracking.

---

## Phase 6: Logic & Graph Heavy

### Task 6.1: Solve & Eliminate (34 standards)

**File:** `src/lib/game-engines/solve-eliminate-phaser.ts`
**Replaces:** `solve-eliminate.ts` (155 lines DOM)
**Mechanic ID:** `constraint-puzzles`

**Game Options:** `elimination-grid`, `twenty-questions`, `logic-chain`

### Task 6.2: Navigate & Optimize (6 standards)

**File:** `src/lib/game-engines/navigate-optimize-phaser.ts`
**Replaces:** `navigate-optimize.ts` (70 lines DOM)
**Mechanic ID:** `path-optimization`

**Game Options:** `shortest-route`, `map-builder`, `delivery-run`

### Task 6.3: Build a Structure (3 standards)

**File:** `src/lib/game-engines/build-structure-phaser.ts`
**Replaces:** `build-structure.ts` (95 lines DOM)
**Mechanic ID:** `build-structure`

**Game Options:** `shape-matcher`, `free-build`, `shape-decomposer`

---

## Rules for All Implementers

1. **Read the blueprint specs first.** Every game option is defined in `docs/diagonally-blueprint.html`, Section 7.
2. **Read the reference engine.** `collect-manage-phaser.ts` is the pattern to follow.
3. **Use the shared base.** Call `phaserGame({...})` — don't duplicate Boot/Victory/HUD/juice.
4. **Engine files contain ONLY gameplay.** No HUD, no victory screens, no sprite loading, no fonts, no postMessage.
5. **Round generation must guarantee solvability.** Every round must have at least one valid solution. Test with edge cases.
6. **5 rounds, progressive difficulty.** Round 1 is easy enough for the grade level. Round 5 is challenging.
7. **3 wrong answers = game over.** The shared base handles this — engines just call a `wrongAnswer()` method.
8. **Test all 3 options.** Don't ship a mechanic until all 3 play correctly.
9. **Mobile-friendly.** Phaser Scale.FIT handles resizing, but test touch interactions (tap, drag).
10. **Build must pass.** `npx next build` with no errors before committing.

---

## Tracking Progress

| Phase | Mechanic | Options | Status |
|---|---|---|---|
| 1 | Infrastructure + Collect & Manage | free-collect, conveyor-belt, split-the-loot | Not started |
| 2 | Balance & Equalize | free-balance, mystery-side, chain-scales | Not started |
| 2 | Score & Rank | sorting-lane, number-line-drop, leaderboard-fix | Not started |
| 2 | Craft & Combine | recipe-mixer, potion-lab, assembly-line | Not started |
| 3 | Split & Share | cut-the-bar, pour-the-liquid, share-the-pizza | Not started |
| 3 | Scale & Transform | resize-tool, recipe-scaler, map-distance | Not started |
| 3 | Measure & Compare | size-picker, ruler-race, unit-converter | Not started |
| 3 | Bid & Estimate | auction-house, price-is-right, round-and-win | Not started |
| 4 | Pattern & Repeat | sequence-builder, pattern-machine, broken-pattern | Not started |
| 4 | Rise & Fall | depth-navigator, temperature-swing, elevator-operator | Not started |
| 4 | Build & Measure | stack-to-target, fill-the-floor, box-packer | Not started |
| 4 | Plot & Explore | coordinate-hunter, battleship, treasure-trail | Not started |
| 5 | Fit & Rotate | rotate-to-match, tangram-fill, mirror-puzzle | Not started |
| 5 | Roll & Predict | find-the-stat, bet-the-spinner, build-the-chart | Not started |
| 5 | Race & Calculate | launch-to-target, speed-trap, catch-up | Not started |
| 5 | Grow & Compound | investment-sim, population-boom, doubling-maze | Not started |
| 6 | Solve & Eliminate | elimination-grid, twenty-questions, logic-chain | Not started |
| 6 | Navigate & Optimize | shortest-route, map-builder, delivery-run | Not started |
| 6 | Build a Structure | shape-matcher, free-build, shape-decomposer | Not started |
