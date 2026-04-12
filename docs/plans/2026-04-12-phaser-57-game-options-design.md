# Phaser Engine: 57 Game Options Design

> **Goal:** Rebuild all 19 game engines on a shared Phaser base, with 3 genuinely different game options per mechanic (57 total). Each option should look and play like a different game while teaching the same math standard.

**Architecture decision:** Approach A — one engine file per mechanic, internal branching on game option ID. Shared Phaser base handles all boilerplate.

---

## Architecture Overview

### Type System Change

```typescript
// OLD
type GameVariant = "classic" | "timed" | "challenge"

// NEW — game options are string IDs, each mechanic defines its 3
type GameOption = string  // e.g. "free-collect", "conveyor-belt", "split-the-loot"

type GameEngine = (config: ThemeConfig, math: MathParams, option?: string) => string
```

### File Structure

```
src/lib/game-engines/
  base-phaser-template.ts       ← shared Boot, Victory, GameOver, HUD, game juice
  engine-types.ts               ← updated types (GameOption replaces GameVariant)
  game-option-registry.ts       ← all 57 option IDs, names, descriptions, mechanic mapping
  index.ts                      ← engine registry (unchanged shape, passes option through)
  collect-manage-phaser.ts      ← 3 scenes: FreeCollect, ConveyorBelt, SplitTheLoot
  split-share-phaser.ts         ← 3 scenes: CutTheBar, PourTheLiquid, ShareThePizza
  balance-equalize-phaser.ts    ← 3 scenes: FreeBalance, MysterySide, ChainScales
  ... (19 total engine files)
```

### Shared Phaser Base Provides
- Phaser 3.90 CDN load + HTML shell
- **BootScene** — loading bar, preloads character/item/background sprites
- **VictoryScene** — character celebration, particle fireworks, score display, dare text, `game_win` postMessage
- **GameOverScene** — wrong-answer feedback, `game_lose` postMessage
- **HUD overlay** — title (Space Grotesk), score, 5 round dots, 3 life hearts, help button (?)
- Game juice: `burstParticles()`, `screenShake()`, `comboCounter()`, `scorePop()`
- Fonts: Space Grotesk + Lexend via Google Fonts CDN
- Phaser config: 800×600, Scale.FIT, CENTER_BOTH, arcade physics
- Tutorial overlay with engine-provided intro text
- Help panel with engine-provided help content

### Each Engine File Provides
1. **GameScene class(es)** — the core interaction loop per game option
2. **Round generation logic** — targets, values, positions, guaranteed solvable
3. **Intro text** — per-option "how to play" for the tutorial overlay
4. **Help panel content** — worked examples (correct + incorrect)

---

## All 57 Game Option Specs

Format per mechanic: Math skill → shared engine logic → 3 options (ID, gameplay, feel, difficulty scaling, key Phaser features).

---

### 1. Collect & Manage
**Math:** Add values to hit a target sum.
**Shared:** `generateValues(target, count)` with guaranteed valid subset. Color-coded total (green=exact, red=over). "+value" score pop.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Free Collect** | `free-collect` | Items scattered on screen. Click to collect, click again to return. Total must match target exactly. No time pressure. | Calm, puzzle | More items (5→9), higher targets (10-20→40-60), more close-value distractors, fewer obvious subsets | Click-to-collect with fly-to-total tween, click-to-return |
| **Conveyor Belt** | `conveyor-belt` | Belt scrolls items right-to-left. Tap to grab before they fall off. Grabbed items go to collection tray. Can't un-grab. | Fast, arcade | Belt speeds up, more items/distractors, trickier spawn sequences | Horizontal scroll tweens, item pooling, left-edge collision zone |
| **Split the Loot** | `split-the-loot` | Two bins with separate targets. Drag each item into a bin. Both bins must hit their target. Every item must be placed. | Strategic, planning | More items (5→9), both targets increase, split less obvious, multiple valid solutions | Drag-and-drop with two drop zones, independent counters, snap-to-bin |

---

### 2. Split & Share
**Math:** Divide wholes into equal parts — fractions in action.
**Shared:** Fraction validation (check if parts are equal), visual fraction feedback, denominator display.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Cut the Bar** | `cut-the-bar` | A rectangular bar appears. Tap/click to place cut lines, dividing it into equal parts. Then shade the correct fraction by clicking sections. | Precise, visual | Harder fractions (1/2→5/8), more cuts needed, bar gets longer, must shade non-contiguous sections | Interactive cut lines on a rectangle, section click-to-shade, snap-to-equal guides |
| **Pour the Liquid** | `pour-the-liquid` | A container shows a target fraction mark. Drag a slider to pour liquid up to that line. The liquid level shows the current fraction. | Analog, tactile | Finer fractions, container shapes change (tall/thin vs short/wide), target line less obvious, no gridlines in later rounds | Slider drag with liquid fill animation, container sprite, fraction label updates live |
| **Share the Pizza** | `share-the-pizza` | A pizza (circle) is pre-cut into N slices. Drag slices to plates so each person gets an equal amount. Multiple pizzas in later rounds. | Social, fair-share | More people/plates (2→5), mixed slice sizes, leftover slices that don't divide evenly (must recombine), multiple pizzas | Drag slices to plate drop zones, pie-chart visual, per-plate fraction counter |

---

### 3. Balance & Equalize
**Math:** Keep both sides equal — solving equations by balancing.
**Shared:** Scale beam visual (tilts based on weight difference), weight-sum calculation, balance detection.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Free Balance** | `free-balance` | Two-pan scale. Left side has a value. Drag weights from a bank onto the right side until both sides match. | Deliberate, hands-on | Higher target values, more weights in bank (more distractors), weights include negatives in later rounds | Drag-to-pan with beam tilt tween, weight bank grid, balance snap animation |
| **Mystery Side** | `mystery-side` | One side of the scale is covered ("?"). The other side shows a value. Place weights on the mystery side — when you think you know its value, type your answer. | Deductive, detective | Mystery value increases, red herrings (extra weights that don't help), both sides can be partially hidden | Covered pan with "?" overlay, number input field, reveal animation on correct answer |
| **Chain Scales** | `chain-scales` | Three scales connected in a chain — the output of scale 1 feeds into scale 2, scale 2 feeds into scale 3. Balance all three. | Complex, multi-step | More chain links, values cascade (error propagates), must plan backwards from final target | Multiple scale sprites, cascade connection lines, sequential unlock (scale 2 activates when scale 1 balances) |

---

### 4. Fit & Rotate
**Math:** Rotate, flip, and fit shapes — geometry in action.
**Shared:** Shape rendering (polygon sprites), rotation controls, collision/overlap detection.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Rotate to Match** | `rotate-to-match` | A target shape outline appears. Your shape is rotated wrong. Tap rotate buttons (90°/flip) to match the target exactly. | Quick, spatial | More complex shapes (triangle→irregular polygon), finer rotation needed (90°→45°→free), flip required | Shape sprite with rotation tweens, target outline overlay, match detection |
| **Tangram Fill** | `tangram-fill` | An outline appears. Drag and rotate multiple pieces to fill it with no gaps or overlaps. | Puzzle, creative | More pieces (2→6), irregular outlines, pieces must be rotated AND flipped, tighter fits | Multi-piece drag-and-rotate, snap-to-grid, overlap detection, outline fill percentage |
| **Mirror Puzzle** | `mirror-puzzle` | A mirror line (axis) divides the screen. One side has a shape. Place/rotate your shape so it's a perfect mirror reflection. | Spatial, reflective | Mirror axis moves (vertical→horizontal→diagonal), shapes get more complex, must flip not just rotate | Mirror line sprite, reflection preview (ghost shape), symmetry validation |

---

### 5. Roll & Predict
**Math:** Predict outcomes and weigh chances — probability and statistics.
**Shared:** Random number generation with weighted distributions, stat calculation helpers (mean, median, mode).

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Find the Stat** | `find-the-stat` | A dataset appears (numbers on cards). Identify the mode, median, or mean as asked. Type or select your answer. | Analytical, cerebral | Larger datasets (5→12 numbers), asks for different stats each round, datasets with ties/no-mode, decimal means | Card layout with numbers, stat type label, number input or multiple choice |
| **Bet the Spinner** | `bet-the-spinner` | A weighted spinner appears (sections of different sizes). Bet on which section it'll land on. Spin to see. Earn points for correct bets. | Gambling, risk | More sections (3→6), less obvious weights, must calculate exact probabilities, consecutive bets with running bankroll | Animated spinner with weighted sections, bet placement UI, spin animation with easing |
| **Build the Chart** | `build-the-chart` | Given stats (mean=X, range=Y), drag bars up/down to build a histogram that matches those stats. | Creative, constructive | More bars (3→7), more constraints (mean AND median AND range), tighter tolerances | Draggable bar heights, live stat recalculation display, constraint checklist |

---

### 6. Navigate & Optimize
**Math:** Find the best path — graph reasoning and optimization.
**Shared:** Graph/node rendering, edge weight display, path cost calculation, visited-node tracking.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Shortest Route** | `shortest-route` | A map with nodes and weighted edges. Two nodes are highlighted (start/end). Click edges to build the shortest path. | Strategic, map-reading | More nodes (4→8), more edges (more route options), weights vary more, multiple near-optimal paths | Node-edge graph rendering, click-to-select-edge, path highlight, cost counter |
| **Map Builder** | `map-builder` | Nodes are placed on screen. Draw edges between them to connect all nodes. Total edge weight must stay under a budget. | Creative, constrained | More nodes (4→7), tighter budget, varying edge costs, must connect ALL nodes (minimum spanning tree) | Click-to-draw-edge between nodes, running cost display, budget bar |
| **Delivery Run** | `delivery-run` | A character starts at a depot. Visit all delivery stops and return. Minimize total distance traveled. | Planning, real-world | More stops (3→6), stops spread farther apart, one-way streets (directed edges), time windows on some stops | Character sprite moves along path, stop markers, distance odometer, route trail |

---

### 7. Build & Measure
**Math:** Build to exact measurements — area, volume, and dimensions.
**Shared:** Unit grid overlay, measurement display, dimension labels.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Stack to Target** | `stack-to-target` | Blocks of different heights appear. Click to stack them. Total height must reach the target exactly. | Vertical, stacking | More block sizes available, higher targets, blocks include fractions/decimals, fewer exact combos | Block sprites with height labels, vertical stack with gravity, height ruler |
| **Fill the Floor** | `fill-the-floor` | An irregular floor outline on a grid. Drag rectangular tiles to cover it exactly — no gaps, no overlaps. | Spatial, tiling | Larger floors, more tile sizes to choose from, L-shaped and T-shaped outlines, tiles can't be rotated (or can in later rounds) | Grid overlay, drag-to-place tiles, area counter, overlap detection |
| **Box Packer** | `box-packer` | A 3D box (shown in isometric view). Fit smaller blocks inside to fill the volume exactly. | 3D thinking, packing | Larger boxes, more block shapes, must calculate volume of irregular shapes, tighter fits | Isometric box rendering, drag blocks into box, volume counter, layer-by-layer view |

---

### 8. Race & Calculate
**Math:** Control speed, distance, and rate — rates and slopes.
**Shared:** Distance/speed/time formula helpers, motion animation, checkpoint system.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Launch to Target** | `launch-to-target` | Set launch speed (slider). Object flies and lands at a distance. Must hit the target zone. Distance = speed × time. | Experimental, projectile | Target zone shrinks, must account for varying times, wind resistance modifier in later rounds | Speed slider, projectile arc animation, target zone marker, distance trail |
| **Speed Trap** | `speed-trap` | An object passes two checkpoints. You see the distance between them and the time elapsed. Calculate the speed. Type your answer. | Observational, calculation | Faster objects, decimal answers, unit conversions (m/s to km/h), multiple objects passing at once | Object motion tween, checkpoint markers with distance label, stopwatch display, number input |
| **Catch Up** | `catch-up` | A leader moves at a known speed. You're behind. Set your speed to catch them before they reach the finish line. | Competitive, chase | Leader is farther ahead, both speeds must account for distance remaining, acceleration in later rounds | Two character sprites, parallel tracks, speed input, real-time position update |

---

### 9. Solve & Eliminate
**Math:** Use logic to eliminate and deduce — mathematical reasoning.
**Shared:** Option pool display, elimination animation (strikethrough/fade), clue presentation.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Elimination Grid** | `elimination-grid` | A grid of possible answers. Clues appear one at a time ("it's even", "it's > 20"). Click numbers to eliminate them. Last one standing wins. | Detective, systematic | Larger grids (9→25), more subtle clues, clues that overlap (must combine logic), negative clues ("it's NOT prime") | Number grid, clue panel, click-to-eliminate with strikethrough, remaining count |
| **20 Questions** | `twenty-questions` | A mystery number is hidden. Ask yes/no questions from a menu ("Is it > 50?", "Is it even?"). Narrow it down in fewest questions. | Interrogation, strategic | Larger range (1-20→1-100), harder question options, score based on questions used, some questions eliminated after use | Question button menu, possible-range narrowing visual, question counter, reveal animation |
| **Logic Chain** | `logic-chain` | Each clue eliminates options AND unlocks the next clue. Chain of 3-5 clues leads to the answer. Can't skip ahead. | Sequential, story-like | Longer chains (3→5 clues), clues require math operations to interpret, red-herring clues that don't help | Sequential clue reveal, option elimination per step, chain progress indicator, locked-clue icons |

---

### 10. Grow & Compound
**Math:** Grow and compound — exponential growth and investment.
**Shared:** Growth calculation, running value display, multiplier visualization.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Investment Sim** | `investment-sim` | Start with a value. Each turn, pick a multiplier (×1.5, ×2, ×3) to apply. Must reach the target value in exactly N turns. | Strategic, planning ahead | Higher targets, more multiplier options (including fractions like ×0.5), must reach EXACT target (not overshoot), fewer turns allowed | Multiplier button cards, running value with growth animation, turn counter, target line |
| **Population Boom** | `population-boom` | A population counter. Set the growth rate (%) each round. Population must reach the target zone — but not overshoot the cap! | Controlled growth | Tighter target zones, growth rate affects next round's base, cap gets closer to target, must account for compounding | Growth rate slider, population counter with bar graph, target zone highlighted, cap line (red) |
| **Doubling Maze** | `doubling-maze` | Navigate a maze. Each path fork doubles or triples your value (shown on the path). Reach the exit with the target value. | Exploration, path-planning | Larger mazes, more forks, include division paths (÷2), dead ends, multiple valid paths but only one hits target | Top-down maze with fork labels, character movement, value updates at each fork, target at exit |

---

### 11. Measure & Compare
**Math:** Measure, compare, and convert units accurately.
**Shared:** Measurement display, comparison operators (<, >, =), unit labels.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Size Picker** | `size-picker` | Two items appear with measurements. Pick the bigger (or smaller, as prompted). Quick-fire rounds. | Fast, comparison | Closer values, unit mismatches (compare 1.5m vs 140cm), decimal comparisons, negative numbers | Two item cards with values, tap-to-pick, quick-fire timer between comparisons, streak counter |
| **Ruler Race** | `ruler-race` | An object sits next to a ruler. Measure its length/height and type the answer. Ruler markings get finer. | Precise, observational | Finer ruler markings (whole→half→quarter→eighth), objects not aligned to zero, must subtract start from end, curved objects | Ruler sprite with markings, object sprite, measurement input, zoom-in ability |
| **Unit Converter** | `unit-converter` | Two items shown in different units. Convert one to match the other's unit, then compare. Type the converted value. | Calculation, conversion | Harder conversions (cm→m→km), weight/volume units, multi-step conversions, reference card disappears in later rounds | Unit label displays, conversion reference card (fades out), number input, comparison result |

---

### 12. Score & Rank
**Math:** Order, compare, and rank numbers — counting and cardinality.
**Shared:** Sortable item containers, position validation, ordering animation.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Sorting Lane** | `sorting-lane` | Items with values appear jumbled. Drag them into ascending (or descending) order in a lane. | Hands-on, ordering | More items (4→8), decimals, fractions, negative numbers, ascending AND descending in later rounds | Drag-to-reorder in lane slots, snap-to-position, order validation animation |
| **Number Line Drop** | `number-line-drop` | A number line with some marked positions. Drop number tokens onto their correct position on the line. | Spatial, precise | Finer number line (0-10→0-100→-50 to 50), fractions on the line, zoom-in required for precision, unlabeled tick marks | Number line with tick marks, drag-to-drop tokens, snap-to-nearest, zoom gesture |
| **Leaderboard Fix** | `leaderboard-fix` | A scoreboard has errors — some entries are in the wrong position. Find and fix the mistakes by swapping entries. | Error-finding, editorial | More entries (5→10), subtler errors (adjacent swaps), scores include decimals, multiple errors per round | Leaderboard table, tap-two-to-swap, error highlight on check, "errors remaining" counter |

---

### 13. Pattern & Repeat
**Math:** Recognize and extend patterns — sequences and functions.
**Shared:** Sequence display, rule detection, pattern visualization.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Sequence Builder** | `sequence-builder` | A number sequence with a blank at the end (or middle). Figure out the pattern and type the missing number. | Analytical, detective | Harder rules (add 3→multiply by 2→alternate operations), blanks in the middle not just end, two blanks | Sequence display with blank slots, number input, pattern hint (shows differences), reveal animation |
| **Pattern Machine** | `pattern-machine` | A machine takes an input and produces an output. See 2-3 examples. Set the rule (operation + value) to match. | Experimental, function-building | Multi-operation rules (×2+1), examples show edge cases, must test your rule before confirming, input/output include negatives | Machine sprite with input/output slots, rule-builder (operation picker + value input), test button |
| **Broken Pattern** | `broken-pattern` | A sequence looks right but one number is WRONG. Find it and fix it. | Error-finding, corrective | Longer sequences (5→9), subtler errors (off by 1), pattern rule is more complex, multiple possible interpretations | Sequence display, click-to-select wrong number, replacement input, pattern rule display after correction |

---

### 14. Scale & Transform
**Math:** Scale, resize, and keep proportions — ratios and proportional reasoning.
**Shared:** Ratio calculation, proportion display, scaling visualization.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Resize Tool** | `resize-tool` | A shape and its target size shown. Drag a slider to resize the shape to match the target ratio. Must be exact. | Tactile, visual | Finer ratios (2:1→3:4→7:5), non-integer scaling, bidirectional (enlarge AND shrink), shape changes (rectangle→triangle→irregular) | Shape sprite with scale transform, slider control, target outline overlay, ratio display |
| **Recipe Scaler** | `recipe-scaler` | A recipe for 4 servings. Scale it to serve a different number (6, 8, 12). Adjust each ingredient amount. | Practical, real-world | Harder scaling (4→3 servings requires fractions), more ingredients (3→6), mixed units, one ingredient is already scaled wrong | Recipe card with editable amounts, serving size selector, per-ingredient validation, fraction display |
| **Map Distance** | `map-distance` | A map with a scale bar (e.g. 1cm = 5km). Measure between points on the map and calculate real distance. | Geographic, applied | Finer scales, diagonal distances (Pythagorean theorem), multi-leg routes, scale changes between rounds | Map image with scale bar, click-to-measure tool, distance calculator, real-distance display |

---

### 15. Craft & Combine
**Math:** Add, group, and combine — addition, multiplication, equal groups.
**Shared:** Ingredient/part counter, recipe/target validation, combination display.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Recipe Mixer** | `recipe-mixer` | A recipe shows needed amounts (3 eggs, 2 cups flour). Set each ingredient to the right amount using +/- buttons. | Precise, cooking | More ingredients (3→6), amounts include fractions, some ingredients pre-filled (wrong — must correct), unit conversions | Ingredient rows with +/- steppers, target recipe card, per-ingredient check marks, mixing animation on submit |
| **Potion Lab** | `potion-lab` | Combine base ingredients — but each one has a multiplier (×2 fire, ×3 ice). Total must reach the exact formula target. | Experimental, magical | Higher multipliers, more ingredients, must factor out (target=24, have ×3 and ×8 — which combos work?), negative multipliers (subtract) | Ingredient bottles with multiplier labels, drag-to-cauldron, running formula display, bubbling animation |
| **Assembly Line** | `assembly-line` | Groups of items move down a line. Combine groups to hit the target count. Each group has N items — pick which groups to merge. | Factory, grouping | More groups (4→8), group sizes vary more, target requires exactly 2-3 groups combined, groups include partial items (fractions) | Group containers on conveyor, click-to-select groups, merge animation, running count |

---

### 16. Plot & Explore
**Math:** Navigate and plot by coordinates — the coordinate plane.
**Shared:** Coordinate grid rendering, axis labels, point plotting, click-to-coordinate detection.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Coordinate Hunter** | `coordinate-hunter` | A grid with hidden targets. Given coordinates (3,5), click that spot. Hit = revealed, miss = lose a life. | Hunting, precise | Larger grid (5×5→10×10), coordinates include negatives (4 quadrants), targets are close together (precision matters), decimal coordinates | Coordinate grid, click-to-plot, hit/miss feedback, revealed target animation, coordinate display on hover |
| **Battleship** | `battleship` | Hidden ships on a grid. Call a coordinate to fire. Hit detection based on ship positions. Sink all ships. | Strategic, warfare | Larger grid, more ships, ships in all 4 quadrants, must deduce ship orientation from hits, limited shots | Grid with fog-of-war, click-to-fire, hit/miss markers, ship reveal animation, shot counter |
| **Treasure Trail** | `treasure-trail` | A sequence of coordinate clues: "Go to (2,3), then move right 4 and up 2." Follow the trail to find treasure. | Adventure, sequential | Longer trails (3→6 steps), relative moves (not just absolute coordinates), moves include negatives, trail branches (pick the right direction) | Character on grid, clue panel, movement animation along grid, treasure reveal, trail dotted line |

---

### 17. Bid & Estimate
**Math:** Estimate, round, and judge place value.
**Shared:** Value display, estimation feedback (how close), rounding helpers.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Auction House** | `auction-house` | An item appears with clues about its value. Estimate and bid. Within 20% = win the auction. Overpay too much = lose money. | Gambling, estimation | Tighter margin (20%→10%), larger values, fewer clues, competing AI bidders, must stay within budget across rounds | Item card with clue text, bid input slider, competing bid display, won/lost animation, budget tracker |
| **Price is Right** | `price-is-right` | An item's true price is hidden. Guess the price — but don't go over! Closest without going over wins. | Game show, tension | Larger price ranges, fewer reference points, prices include cents/decimals, multiple items to price in one round | Item display, price input, reveal animation (price scrolls up), over/under feedback, score based on closeness |
| **Round and Win** | `round-and-win` | A number appears. Round it to the nearest 10 (or 100, or 1000). Pick the correct rounded value from options. Fastest correct answer wins more points. | Quick-fire, rounding | Rounder to larger places (10→100→1000), numbers near the midpoint (e.g. 450 — does it round to 400 or 500?), decimals rounding | Number display, multiple choice buttons, speed bonus, correct/incorrect flash, place-value highlight |

---

### 18. Rise & Fall
**Math:** Move above and below zero — signed numbers and absolute value.
**Shared:** Vertical number line, position tracking, signed arithmetic display.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Depth Navigator** | `depth-navigator` | A vertical number line (sea level = 0). Move a submarine to the target depth. Use +/- buttons to move up and down. | Exploration, vertical | Larger range (-50 to +50), target alternates above/below zero, must pass through zero, multi-move sequences (go to -3, then to +7) | Vertical number line with submarine sprite, +/- movement buttons, depth counter, water surface at 0 |
| **Temperature Swing** | `temperature-swing` | A thermometer at a starting temperature. Add or subtract degrees to reach the target zone. Stay in the zone for the round. | Control, maintenance | Tighter target zones, temperature swings (external events push you off target), must counteract swings, negative targets | Thermometer sprite, +/- degree buttons, target zone highlight, external event popups, zone timer |
| **Elevator Operator** | `elevator-operator` | An elevator at floor 0. Passengers wait at different floors (+3, -2, +5). Pick them all up efficiently. Order matters for score. | Routing, optimization | More passengers (3→6), floors include negatives (basement levels), must calculate total distance traveled, express rules (can't stop at every floor) | Building cross-section with floor numbers, elevator sprite, passenger icons at floors, movement animation, floor counter |

---

### 19. Build a Structure
**Math:** Model shapes by combining components — geometry and composition.
**Shared:** Shape palette, placement grid, perimeter/area calculation.

| Option | ID | Gameplay | Feel | Difficulty 1→5 | Phaser Features |
|---|---|---|---|---|---|
| **Shape Matcher** | `shape-matcher` | A blueprint shows a target shape. Pick shapes from a palette and place them to recreate the blueprint exactly. | Matching, assembly | More complex blueprints, more shapes in palette (including distractors), shapes must be rotated, overlapping shapes | Blueprint overlay, shape palette, drag-to-place, rotation controls, match percentage |
| **Free Build** | `free-build` | Given N shapes and a target perimeter (or area). Build any structure that hits the target measurement. | Creative, open-ended | Tighter targets, more shapes, must hit BOTH area and perimeter, shapes include triangles and irregular polygons | Shape palette with measurements, free-place on grid, live perimeter/area counter, target display |
| **Shape Decomposer** | `shape-decomposer` | A complex shape appears. Draw lines to break it into basic shapes (rectangles, triangles). Then calculate the total area. | Analytical, breaking-down | More complex shapes (L→T→irregular), must identify which cuts produce calculable shapes, area calculation required after decomposition | Complex shape sprite, click-to-draw cut lines, shape labeling after cuts, area input per sub-shape, total area validation |

---

## Circuit Board Builder Changes

The card builder slots become:
1. **Background** — sprite picker (10 options)
2. **Character** — sprite picker (10 options)
3. **Game Option** — 3 cards per mechanic (name + short description)
4. **Items** — sprite picker (10 options)

Math Role remains auto-filled. **Win Condition slot removed** (always "Complete 5 rounds").

The `gameOption` ID flows through: Builder → API route → engine registry → engine function.

---

## Migration Order

Start with Collect & Manage (already Phaser), then expand:

| Phase | Mechanics | Why this order |
|---|---|---|
| **Phase 1** | Collect & Manage | Already Phaser. Establishes shared base + pattern. |
| **Phase 2** | Balance & Equalize, Score & Rank, Craft & Combine | High standards count (224, 98, 155). Most learner impact. |
| **Phase 3** | Split & Share, Scale & Transform, Measure & Compare, Bid & Estimate | Medium complexity, good variety of interaction types. |
| **Phase 4** | Pattern & Repeat, Rise & Fall, Build & Measure, Plot & Explore | Mixed interaction types (keyboard input, grids, vertical lines). |
| **Phase 5** | Fit & Rotate, Roll & Predict, Race & Calculate, Grow & Compound | More complex Phaser features (rotation, physics, animation). |
| **Phase 6** | Solve & Eliminate, Navigate & Optimize, Build a Structure | Graph/logic-heavy. Smallest standards counts. |

Each phase is independently deployable. Engines not yet migrated continue working as DOM engines.
