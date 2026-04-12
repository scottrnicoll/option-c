// Game Option Registry — all 57 game options across 19 mechanics.
// Each option is a genuinely different gameplay mode, not just a difficulty tweak.
// This registry feeds the Circuit Board Builder UI and engine routing.

export interface GameOptionDef {
  id: string                    // e.g. "free-collect"
  mechanicId: string            // e.g. "resource-management"
  name: string                  // e.g. "Free Collect"
  description: string           // short — shown on option card in builder
  introText: string             // shown on tutorial overlay before play
  helpText: string              // shown in help panel (?) during play
}

export const GAME_OPTIONS: GameOptionDef[] = [
  // ─── 1. Collect & Manage (resource-management) ───
  {
    id: "free-collect",
    mechanicId: "resource-management",
    name: "Free Collect",
    description: "Click items to hit exact target sum",
    introText: "Items appear with numbers. Click to collect — your total must match the target exactly. Click again to put items back. Too many or too few and you lose a life!",
    helpText: "Each round shows a target number.\n\nClick items to collect them — your total must match exactly.\n\n✅ Target is 15 → click 8 + 7 = 15 (correct!)\n❌ Target is 15 → click 8 + 9 = 17 (too much!)",
  },
  {
    id: "conveyor-belt",
    mechanicId: "resource-management",
    name: "Conveyor Belt",
    description: "Items scroll past — grab the right ones before they disappear",
    introText: "Items slide across a belt. Tap the ones you need before they fall off! Your total must match the target. You can't put items back — choose carefully!",
    helpText: "Items scroll across the belt.\n\nTap to grab — they add to your total.\n\n✅ Target is 20 → grab 12 + 8 = 20 (correct!)\n❌ Missed the 8? Too late — it's gone!",
  },
  {
    id: "split-the-loot",
    mechanicId: "resource-management",
    name: "Split the Loot",
    description: "Divide items into 2 bins — each must hit its own target",
    introText: "Two bins, two targets. Drag every item into a bin. Both bins must hit their target exactly. Plan before you place!",
    helpText: "Each bin has its own target number.\n\nDrag items into bins. Both must match.\n\n✅ Left target 10, Right target 15 → split items so left=10, right=15\n❌ Left=12, Right=13 → neither matches!",
  },

  // ─── 2. Split & Share (partitioning) ───
  {
    id: "cut-the-bar",
    mechanicId: "partitioning",
    name: "Cut the Bar",
    description: "Cut a bar into equal parts, shade the fraction",
    introText: "A bar appears on screen. Tap to place cut lines and divide it into equal parts. Then click sections to shade the correct fraction!",
    helpText: "Divide the bar into equal parts, then shade the right amount.\n\n✅ Show 3/4 → cut into 4 equal parts, shade 3 of them\n❌ Unequal cuts don't count — parts must be the same size!",
  },
  {
    id: "pour-the-liquid",
    mechanicId: "partitioning",
    name: "Pour the Liquid",
    description: "Drag slider to pour the right fraction into a glass",
    introText: "A container has a target line showing a fraction. Drag the slider to pour liquid to exactly that level. Watch the fraction update as you pour!",
    helpText: "Pour liquid to match the target fraction.\n\n✅ Target is 2/3 → pour until the fraction reads 2/3\n❌ Over or under the line loses a life!",
  },
  {
    id: "share-the-pizza",
    mechanicId: "partitioning",
    name: "Share the Pizza",
    description: "Drag slices to plates so everyone gets equal amounts",
    introText: "Pizzas are cut into slices. Drag slices to plates so each person gets an equal share. Everyone must get the same amount!",
    helpText: "Give everyone an equal share of pizza.\n\n✅ 8 slices, 4 people → 2 slices each\n❌ 3 slices for one, 1 for another — not fair!",
  },

  // ─── 3. Balance & Equalize (balance-systems) ───
  {
    id: "free-balance",
    mechanicId: "balance-systems",
    name: "Free Balance",
    description: "Drag weights onto both sides to match",
    introText: "A scale with a value on the left side. Drag weights from the bank onto the right side until both sides are equal. The beam tilts to show which side is heavier!",
    helpText: "Make both sides of the scale equal.\n\n✅ Left = 12 → drag 7 + 5 onto right (7+5=12)\n❌ Left = 12, right = 15 → too heavy!",
  },
  {
    id: "mystery-side",
    mechanicId: "balance-systems",
    name: "Mystery Side",
    description: "One side is hidden — figure out its value",
    introText: "One side of the scale is covered with a '?'. Place weights on it, observe how the scale tilts, and figure out the hidden value. Type your answer when you know!",
    helpText: "Figure out the hidden value.\n\n✅ Scale balances when you add 8 → hidden value is 8\n❌ Wrong guess loses a life — observe carefully before answering!",
  },
  {
    id: "chain-scales",
    mechanicId: "balance-systems",
    name: "Chain Scales",
    description: "Balance 3 connected scales — each feeds into the next",
    introText: "Three scales are chained together — what you put on scale 1 affects scale 2, and scale 2 affects scale 3. Balance all three to win the round!",
    helpText: "Balance all connected scales.\n\n✅ Scale 1 output feeds scale 2 — plan your weights across all three\n❌ If any scale is unbalanced, the round fails!",
  },

  // ─── 4. Fit & Rotate (spatial-puzzles) ───
  {
    id: "rotate-to-match",
    mechanicId: "spatial-puzzles",
    name: "Rotate to Match",
    description: "Rotate shape to match target",
    introText: "A target outline appears. Your shape is rotated wrong. Use the rotate and flip buttons to match the target exactly!",
    helpText: "Rotate your shape to match the outline.\n\n✅ Rotate 90° twice and flip → matches target\n❌ Close but not exact — keep rotating!",
  },
  {
    id: "tangram-fill",
    mechanicId: "spatial-puzzles",
    name: "Tangram Fill",
    description: "Drag and rotate multiple pieces to fill an outline",
    introText: "An outline appears on screen. Drag and rotate pieces to fill it completely — no gaps, no overlaps!",
    helpText: "Fill the outline with all the pieces.\n\n✅ All pieces fit with no gaps → round complete\n❌ Gaps or overlaps mean pieces need repositioning!",
  },
  {
    id: "mirror-puzzle",
    mechanicId: "spatial-puzzles",
    name: "Mirror Puzzle",
    description: "Place shape so it mirrors across a line",
    introText: "A mirror line divides the screen. One side has a shape. Place your shape so it's a perfect mirror reflection on the other side!",
    helpText: "Create a perfect mirror image.\n\n✅ Shape is flipped correctly across the line\n❌ Rotated but not reflected — think about the mirror!",
  },

  // ─── 5. Roll & Predict (probability-systems) ───
  {
    id: "find-the-stat",
    mechanicId: "probability-systems",
    name: "Find the Stat",
    description: "Identify mode, median, or mean",
    introText: "A set of numbers appears on cards. The round tells you which stat to find — mode, median, or mean. Type your answer!",
    helpText: "Find the requested statistic.\n\n✅ Numbers: 3, 5, 5, 7, 10 → Mode is 5 (most common)\n❌ Mean is 6, not 5 — read which stat is asked!",
  },
  {
    id: "bet-the-spinner",
    mechanicId: "probability-systems",
    name: "Bet the Spinner",
    description: "See weighted spinner, bet on most likely outcome",
    introText: "A spinner with different-sized sections appears. Place your bet on which section it'll land on. Bigger sections = higher probability!",
    helpText: "Bet on the most likely outcome.\n\n✅ Section covers 50% of spinner → best bet\n❌ Betting on the tiny 10% section is risky!",
  },
  {
    id: "build-the-chart",
    mechanicId: "probability-systems",
    name: "Build the Chart",
    description: "Drag bars to build histogram matching given stats",
    introText: "You're given target stats (like mean=5, range=8). Drag the bars up and down to build a chart that matches those stats exactly!",
    helpText: "Build a chart matching the target stats.\n\n✅ Mean=5, range=8 → bars average to 5, highest minus lowest = 8\n❌ Mean is off by 1 — adjust the bars!",
  },

  // ─── 6. Navigate & Optimize (path-optimization) ───
  {
    id: "shortest-route",
    mechanicId: "path-optimization",
    name: "Shortest Route",
    description: "Pick route with smallest total",
    introText: "A map with paths between locations. Each path has a distance. Click paths to build the shortest route from start to finish!",
    helpText: "Find the shortest path.\n\n✅ Route A→B→D = 12, Route A→C→D = 15 → pick A→B→D\n❌ Shortest single path isn't always shortest total!",
  },
  {
    id: "map-builder",
    mechanicId: "path-optimization",
    name: "Map Builder",
    description: "Draw path through nodes under a limit",
    introText: "Connect all locations by drawing paths between them. Your total path length must stay under the budget shown at the top!",
    helpText: "Connect all nodes within budget.\n\n✅ All nodes connected, total = 18, budget = 20 → success\n❌ Total = 22 exceeds budget of 20 — find shorter connections!",
  },
  {
    id: "delivery-run",
    mechanicId: "path-optimization",
    name: "Delivery Run",
    description: "Visit all stops minimizing total distance",
    introText: "You're a delivery driver! Visit every stop and return to the depot. The shortest total route wins the most points!",
    helpText: "Visit all stops with minimum travel.\n\n✅ A→B→C→D→A = 25 (efficient loop)\n❌ A→D→B→C→A = 38 (lots of backtracking!)",
  },

  // ─── 7. Build & Measure (construction-systems) ───
  {
    id: "stack-to-target",
    mechanicId: "construction-systems",
    name: "Stack to Target",
    description: "Click blocks to reach exact height",
    introText: "Blocks of different heights are available. Click to stack them. Your tower must reach the target height exactly — not taller, not shorter!",
    helpText: "Stack blocks to exact height.\n\n✅ Target 15 → stack 8 + 4 + 3 = 15\n❌ 8 + 4 + 4 = 16 → one unit too tall!",
  },
  {
    id: "fill-the-floor",
    mechanicId: "construction-systems",
    name: "Fill the Floor",
    description: "Drag tiles to cover area exactly",
    introText: "An irregular floor outline sits on a grid. Drag rectangular tiles to cover every square — no gaps, no overlaps!",
    helpText: "Cover the floor exactly.\n\n✅ All squares covered with no overlaps\n❌ Gap in the corner — need a smaller tile!",
  },
  {
    id: "box-packer",
    mechanicId: "construction-systems",
    name: "Box Packer",
    description: "Fit blocks into container — fill volume exactly",
    introText: "A 3D box shown from the side. Fit smaller blocks inside to fill the entire volume. Think about how pieces fit together!",
    helpText: "Fill the box completely.\n\n✅ All blocks fit with no empty space\n❌ Empty space left — try different arrangements!",
  },

  // ─── 8. Race & Calculate (motion-simulation) ───
  {
    id: "launch-to-target",
    mechanicId: "motion-simulation",
    name: "Launch to Target",
    description: "Set speed to hit target distance",
    introText: "Set the launch speed with the slider. Your object will fly and land at a distance based on speed × time. Hit the target zone!",
    helpText: "Set the right speed to hit the target.\n\n✅ Target at 60m, time = 3s → set speed to 20 m/s (20×3=60)\n❌ Speed 25 → lands at 75m, too far!",
  },
  {
    id: "speed-trap",
    mechanicId: "motion-simulation",
    name: "Speed Trap",
    description: "Object passes checkpoints — calculate speed",
    introText: "Watch an object pass two checkpoints. You see the distance between them and the time it took. Calculate the speed!",
    helpText: "Speed = distance ÷ time.\n\n✅ 100m in 5 seconds → speed = 20 m/s\n❌ 100 ÷ 5 = 20, not 25!",
  },
  {
    id: "catch-up",
    mechanicId: "motion-simulation",
    name: "Catch Up",
    description: "Set right speed to catch the leader in time",
    introText: "A leader is ahead of you, moving at a set speed. Set your speed to catch them before they reach the finish line!",
    helpText: "Set speed to catch the leader.\n\n✅ Leader at 10m/s, 50m ahead, finish in 100m → you need faster than 10 m/s to close the gap\n❌ Same speed = you never catch up!",
  },

  // ─── 9. Solve & Eliminate (constraint-puzzles) ───
  {
    id: "elimination-grid",
    mechanicId: "constraint-puzzles",
    name: "Elimination Grid",
    description: "Use clues to eliminate wrong answers",
    introText: "A grid of numbers. Clues appear one at a time — 'it's even', 'it's greater than 20'. Click numbers to eliminate them. The last one standing is the answer!",
    helpText: "Eliminate numbers using clues.\n\n✅ 'It's even' → eliminate all odd numbers\n❌ Don't eliminate numbers that match the clue!",
  },
  {
    id: "twenty-questions",
    mechanicId: "constraint-puzzles",
    name: "20 Questions",
    description: "Ask yes/no to narrow down the number",
    introText: "A mystery number is hidden. Pick yes/no questions from the menu to narrow it down. Fewer questions = more points!",
    helpText: "Ask smart questions to find the number.\n\n✅ 'Is it > 50?' eliminates half the range\n❌ 'Is it 37?' only eliminates one number!",
  },
  {
    id: "logic-chain",
    mechanicId: "constraint-puzzles",
    name: "Logic Chain",
    description: "Each clue eliminates options AND reveals the next clue",
    introText: "Clues are locked in a chain. Solve clue 1 to unlock clue 2, and so on. Each clue eliminates wrong answers and brings you closer!",
    helpText: "Follow the chain of clues.\n\n✅ Clue 1 eliminates 5 options → unlocks Clue 2\n❌ Can't skip ahead — solve them in order!",
  },

  // ─── 10. Grow & Compound (strategy-economy) ───
  {
    id: "investment-sim",
    mechanicId: "strategy-economy",
    name: "Investment Sim",
    description: "Pick multipliers to reach target",
    introText: "Start with a value. Each turn, pick a multiplier (×1.5, ×2, ×3). You must reach the target value in exactly the right number of turns!",
    helpText: "Pick multipliers to hit the target.\n\n✅ Start at 4, target 24 → ×2 then ×3 (4→8→24)\n❌ ×3 then ×3 = 36 — overshot!",
  },
  {
    id: "population-boom",
    mechanicId: "strategy-economy",
    name: "Population Boom",
    description: "Choose growth rate — don't overshoot",
    introText: "Set the growth rate each round. Your population grows by that percentage. Reach the target zone — but don't go over the cap!",
    helpText: "Grow to the target without exceeding the cap.\n\n✅ Target zone 80-100, cap 100 → grow steadily\n❌ 50% growth when you're at 80 → 120, over the cap!",
  },
  {
    id: "doubling-maze",
    mechanicId: "strategy-economy",
    name: "Doubling Maze",
    description: "Each step doubles or triples your value",
    introText: "Navigate a maze where each fork changes your value — ×2, ×3, or ÷2. Reach the exit with exactly the target value!",
    helpText: "Pick the right path to hit the target.\n\n✅ Start at 3, target 12 → take ×2 then ×2 (3→6→12)\n❌ ×3 then ×2 = 18 — wrong path!",
  },

  // ─── 11. Measure & Compare (measurement-challenges) ───
  {
    id: "size-picker",
    mechanicId: "measurement-challenges",
    name: "Size Picker",
    description: "Compare two items — pick bigger/smaller",
    introText: "Two items appear with measurements. Pick the bigger one (or smaller — read the prompt!). Quick-fire rounds!",
    helpText: "Compare and pick correctly.\n\n✅ 1.5m vs 140cm → 1.5m = 150cm, so 1.5m is bigger\n❌ 140 > 1.5 as numbers, but check the units!",
  },
  {
    id: "ruler-race",
    mechanicId: "measurement-challenges",
    name: "Ruler Race",
    description: "Measure objects — type the measurement",
    introText: "An object sits next to a ruler. Read the measurement carefully and type it in. Watch the ruler markings — they get finer each round!",
    helpText: "Read the ruler precisely.\n\n✅ Object ends at 3.5 mark → type 3.5\n❌ Object starts at 1, ends at 3.5 → length is 2.5, not 3.5!",
  },
  {
    id: "unit-converter",
    mechanicId: "measurement-challenges",
    name: "Unit Converter",
    description: "Convert units to find which is bigger",
    introText: "Two items in different units (like meters and centimeters). Convert one to match the other's unit, then pick which is bigger!",
    helpText: "Convert before comparing.\n\n✅ 2.5m vs 230cm → 2.5m = 250cm > 230cm\n❌ Don't compare numbers without matching units!",
  },

  // ─── 12. Score & Rank (scoring-ranking) ───
  {
    id: "sorting-lane",
    mechanicId: "scoring-ranking",
    name: "Sorting Lane",
    description: "Drag items into ascending order",
    introText: "Items with values appear jumbled up. Drag them into the lane in the correct order — ascending or descending as shown!",
    helpText: "Put numbers in order.\n\n✅ Ascending: 3, 7, 12, 25, 41\n❌ 3, 12, 7, 25 — 12 and 7 are swapped!",
  },
  {
    id: "number-line-drop",
    mechanicId: "scoring-ranking",
    name: "Number Line Drop",
    description: "Drop numbers onto correct position",
    introText: "A number line with some positions marked. Drag number tokens and drop them at the right spot on the line!",
    helpText: "Place numbers at the right position.\n\n✅ Drop 7.5 halfway between 7 and 8\n❌ 7.5 placed at 7 — too far left!",
  },
  {
    id: "leaderboard-fix",
    mechanicId: "scoring-ranking",
    name: "Leaderboard Fix",
    description: "Fix errors in a scoreboard ranking",
    introText: "A scoreboard has mistakes — some entries are in the wrong place. Find the errors and swap entries to fix the ranking!",
    helpText: "Find and fix ranking errors.\n\n✅ Score 85 above score 92 — swap them!\n❌ Swapping correct entries creates new errors!",
  },

  // ─── 13. Pattern & Repeat (timing-rhythm) ───
  {
    id: "sequence-builder",
    mechanicId: "timing-rhythm",
    name: "Sequence Builder",
    description: "Find next number in pattern",
    introText: "A number sequence with a blank. Figure out the pattern rule and type the missing number!",
    helpText: "Find the pattern and fill the blank.\n\n✅ 2, 5, 8, 11, ___ → adding 3 each time → 14\n❌ 13 — check the rule: it's +3, not +2!",
  },
  {
    id: "pattern-machine",
    mechanicId: "timing-rhythm",
    name: "Pattern Machine",
    description: "Set the rule — watch it generate",
    introText: "A machine shows input→output examples. Figure out the rule and set it (like ×2+1). Test your rule before locking it in!",
    helpText: "Find the machine's rule.\n\n✅ Input 3→7, Input 5→11 → rule is ×2+1\n❌ ×2+1 works for 3→7 but check ALL examples!",
  },
  {
    id: "broken-pattern",
    mechanicId: "timing-rhythm",
    name: "Broken Pattern",
    description: "Find which number is WRONG",
    introText: "A number sequence looks right but one number is wrong. Find it and fix it!",
    helpText: "Spot the mistake in the pattern.\n\n✅ 3, 6, 9, 11, 15 → 11 should be 12 (adding 3)\n❌ The pattern is +3, not +2 — check from the start!",
  },

  // ─── 14. Scale & Transform (scaling-resizing) ───
  {
    id: "resize-tool",
    mechanicId: "scaling-resizing",
    name: "Resize Tool",
    description: "Drag slider to resize to target ratio",
    introText: "A shape needs to be resized to match the target. Drag the slider to scale it up or down until it matches exactly!",
    helpText: "Resize to the target ratio.\n\n✅ Target is 3:1 scale → make the shape 3× bigger\n❌ 2.5× is close but not exact!",
  },
  {
    id: "recipe-scaler",
    mechanicId: "scaling-resizing",
    name: "Recipe Scaler",
    description: "Scale recipe from 4 servings to 6/8/12",
    introText: "A recipe for 4 servings. Change the serving size and adjust every ingredient to match. Keep the proportions right!",
    helpText: "Scale all ingredients proportionally.\n\n✅ 2 cups for 4 servings → 3 cups for 6 servings (×1.5)\n❌ 2 cups for 6 servings — that's not enough!",
  },
  {
    id: "map-distance",
    mechanicId: "scaling-resizing",
    name: "Map Distance",
    description: "Use map scale to find real distances",
    introText: "A map with a scale bar (like 1cm = 5km). Measure between points and calculate the real-world distance!",
    helpText: "Use the scale to find real distance.\n\n✅ 3cm on map, scale 1cm=5km → 3×5 = 15km\n❌ 3km — don't forget to multiply by the scale!",
  },

  // ─── 15. Craft & Combine (inventory-crafting) ───
  {
    id: "recipe-mixer",
    mechanicId: "inventory-crafting",
    name: "Recipe Mixer",
    description: "Set amounts to match recipe",
    introText: "A recipe shows the amounts needed for each ingredient. Use the +/- buttons to set each one exactly right!",
    helpText: "Match the recipe amounts.\n\n✅ Recipe says 3 eggs → set eggs to 3\n❌ 2 eggs is not enough — check the recipe!",
  },
  {
    id: "potion-lab",
    mechanicId: "inventory-crafting",
    name: "Potion Lab",
    description: "Combine ingredients with multiplied factors",
    introText: "Each ingredient has a multiplier (×2, ×3). Drag ingredients into the cauldron — their multiplied values must add up to the target formula!",
    helpText: "Combine multiplied ingredients to hit the target.\n\n✅ Target 24 → ingredient A (×3, value 6) + ingredient B (×2, value 3) = 18+6 = 24\n❌ Wrong combination — check your multiplication!",
  },
  {
    id: "assembly-line",
    mechanicId: "inventory-crafting",
    name: "Assembly Line",
    description: "Combine groups to hit target count",
    introText: "Groups of items move along a line. Click groups to select them — the selected groups must add up to the target count exactly!",
    helpText: "Select groups that add to the target.\n\n✅ Target 12 → select group of 5 + group of 7 = 12\n❌ 5 + 8 = 13 — one too many!",
  },

  // ─── 16. Plot & Explore (terrain-generation) ───
  {
    id: "coordinate-hunter",
    mechanicId: "terrain-generation",
    name: "Coordinate Hunter",
    description: "Click (x,y) to find targets",
    introText: "Hidden targets are on the grid. You're given coordinates like (3,5) — click that exact spot. Hit = found, miss = lose a life!",
    helpText: "Click the exact coordinate.\n\n✅ (3,5) → go right 3, up 5, click\n❌ (5,3) is a different spot — x first, then y!",
  },
  {
    id: "battleship",
    mechanicId: "terrain-generation",
    name: "Battleship",
    description: "Call coordinates to sink hidden ships",
    introText: "Ships are hidden on the grid. Call a coordinate to fire. Hits show up in red, misses in white. Sink all ships before running out of shots!",
    helpText: "Use hits to find ship orientation.\n\n✅ Hit at (3,4) → try (3,5) to find the ship's direction\n❌ Random shots waste ammo!",
  },
  {
    id: "treasure-trail",
    mechanicId: "terrain-generation",
    name: "Treasure Trail",
    description: "Follow coordinate instructions to find treasure",
    introText: "Follow a trail of coordinate clues: 'Go to (2,3), then move right 4 and up 2.' Each clue leads to the next. Find the treasure!",
    helpText: "Follow each clue step by step.\n\n✅ At (2,3), move right 4 → now at (6,3)\n❌ Right 4 from (2,3) is (6,3), not (2,7)!",
  },

  // ─── 17. Bid & Estimate (bidding-auction) ───
  {
    id: "auction-house",
    mechanicId: "bidding-auction",
    name: "Auction House",
    description: "Estimate value, bid within 20%",
    introText: "An item appears with clues about its value. Estimate the value and place your bid. Win if you're within 20% — but don't overspend your budget!",
    helpText: "Estimate and bid wisely.\n\n✅ True value 50, bid 45 → within 20% (40-60 range)\n❌ Bid 70 → overpaid by 40%!",
  },
  {
    id: "price-is-right",
    mechanicId: "bidding-auction",
    name: "Price is Right",
    description: "Guess without going over",
    introText: "An item has a hidden price. Guess as close as you can WITHOUT going over. Closest guess without exceeding the price wins!",
    helpText: "Get close without going over.\n\n✅ Price is 75, guess 72 → only 3 under, great!\n❌ Guess 80 → over the price, you lose!",
  },
  {
    id: "round-and-win",
    mechanicId: "bidding-auction",
    name: "Round and Win",
    description: "Round to nearest 10/100 — closest wins",
    introText: "A number appears. Round it to the nearest 10 (or 100, or 1000). Pick the correct answer from the options — fastest correct answer gets bonus points!",
    helpText: "Round to the correct place value.\n\n✅ Round 347 to nearest 100 → 300\n❌ 350 is rounding to nearest 50, not 100!",
  },

  // ─── 18. Rise & Fall (above-below-zero) ───
  {
    id: "depth-navigator",
    mechanicId: "above-below-zero",
    name: "Depth Navigator",
    description: "Move to target on number line",
    introText: "A vertical number line with sea level at 0. Use the +/- buttons to move your submarine to the target depth. Above zero = sky, below zero = ocean!",
    helpText: "Navigate to the target depth.\n\n✅ Target is -5 → press minus 5 times from 0\n❌ At -3, target is +2 → you need to go UP 5 steps, not down!",
  },
  {
    id: "temperature-swing",
    mechanicId: "above-below-zero",
    name: "Temperature Swing",
    description: "Add/subtract to stay in target zone",
    introText: "A thermometer shows the current temperature. Add or subtract degrees to reach the target zone. Watch out — random events can push you off target!",
    helpText: "Stay in the target zone.\n\n✅ Target zone: 5° to 10°, current: 3° → add 4° to reach 7°\n❌ A cold front hits (-5°) → now at 2°, adjust quickly!",
  },
  {
    id: "elevator-operator",
    mechanicId: "above-below-zero",
    name: "Elevator Operator",
    description: "Pick up passengers at +/− floors",
    introText: "You're an elevator operator starting at floor 0. Passengers wait at different floors (including basement floors with negative numbers). Pick everyone up!",
    helpText: "Pick up all passengers efficiently.\n\n✅ Passengers at floors -2, +3, +5 → go -2 first, then up to +3, then +5\n❌ Going +5 then -2 then +3 = more travel!",
  },

  // ─── 19. Build a Structure (build-structure) ───
  {
    id: "shape-matcher",
    mechanicId: "build-structure",
    name: "Shape Matcher",
    description: "Pick shapes to match blueprint",
    introText: "A blueprint shows the target shape. Pick shapes from the palette and place them to recreate the blueprint exactly!",
    helpText: "Recreate the blueprint.\n\n✅ Blueprint shows an L-shape → combine a rectangle and a square\n❌ Pieces don't match the outline — try different shapes!",
  },
  {
    id: "free-build",
    mechanicId: "build-structure",
    name: "Free Build",
    description: "Build using N shapes — match target perimeter",
    introText: "You get a set of shapes and a target perimeter (or area). Build any structure you want — as long as it hits the target measurement!",
    helpText: "Build to the target measurement.\n\n✅ Target perimeter 20 → arrange shapes so outer edge = 20 units\n❌ Perimeter is 18 — rearrange to add 2 more units of edge!",
  },
  {
    id: "shape-decomposer",
    mechanicId: "build-structure",
    name: "Shape Decomposer",
    description: "Break complex shape into basic shapes",
    introText: "A complex shape appears. Draw lines to break it into basic shapes (rectangles, triangles). Then calculate the total area from the pieces!",
    helpText: "Decompose and calculate.\n\n✅ L-shape → cut into two rectangles, find each area, add them\n❌ Don't forget to add ALL the pieces' areas!",
  },
]

// ─── Lookup helpers ───

export const GAME_OPTIONS_BY_MECHANIC = new Map<string, GameOptionDef[]>()
GAME_OPTIONS.forEach(opt => {
  const list = GAME_OPTIONS_BY_MECHANIC.get(opt.mechanicId) || []
  list.push(opt)
  GAME_OPTIONS_BY_MECHANIC.set(opt.mechanicId, list)
})

export function getGameOptions(mechanicId: string): GameOptionDef[] {
  return GAME_OPTIONS_BY_MECHANIC.get(mechanicId) || []
}

export function getDefaultOption(mechanicId: string): string {
  const options = GAME_OPTIONS_BY_MECHANIC.get(mechanicId)
  return options?.[0]?.id || "free-collect"
}

export function getOptionDef(optionId: string): GameOptionDef | undefined {
  return GAME_OPTIONS.find(o => o.id === optionId)
}
