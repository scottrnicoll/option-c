// Hardcoded game card options for each mechanic.
// Each mechanic has 3 options per slot + a mad-lib hint for custom input.
// Order: Theme → Character → Player Action → Win Condition.
// Math Role auto-fills from the mechanic.

export interface CardSlotOptions {
  options: string[]
  hint: string // mad-lib placeholder, e.g. "a ___(place)___"
}

export interface MechanicCardOptions {
  mechanicId: string
  theme: CardSlotOptions
  character: CardSlotOptions
  action: CardSlotOptions
  win: CardSlotOptions
  mathRole: string // auto-fills
}

export const MECHANIC_CARD_OPTIONS: MechanicCardOptions[] = [
  {
    mechanicId: "resource-management",
    theme: {
      options: ["sunken shipwreck", "dragon's hoard cave", "space cargo bay"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["salvage diver", "goblin treasure hunter", "cargo robot"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["drag loot into sacks by value", "sort gems into enchanted chests", "load crates onto the right shuttle"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["fill every sack to the exact target", "sort all gems before the tide rises", "load the shuttle without going over weight"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Add, subtract, and manage quantities to hit exact targets",
  },
  {
    mechanicId: "partitioning",
    theme: {
      options: ["royal bakery", "gemstone mine", "potion lab"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["master baker", "dwarf gem cutter", "alchemist apprentice"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["slice cakes into equal servings", "cut crystals along fracture lines", "pour potions into equal vials"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["serve every customer equal slices", "cut all crystals to the exact fraction", "fill every vial to the same level"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Split wholes into equal parts — fractions in action",
  },
  {
    mechanicId: "balance-systems",
    theme: {
      options: ["wizard's scales", "robot factory calibration", "pirate trading post"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["scale keeper wizard", "calibration bot", "pirate merchant"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["drag enchanted weights onto both sides", "add gears until the machine balances", "trade goods to make both sides equal"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["balance all 5 scales in a row", "calibrate every machine before shutdown", "complete 5 fair trades"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Keep both sides equal — solving equations by balancing",
  },
  {
    mechanicId: "spatial-puzzles",
    theme: {
      options: ["ancient temple floor", "stained glass window", "spaceship hull repair"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["temple architect", "glass artist", "hull repair drone"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["rotate and fit stone tiles into the floor", "drag glass pieces to complete the pattern", "snap hull plates into damaged sections"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["fill the entire floor with no gaps", "complete the window before sunset", "seal all hull breaches"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Rotate, flip, and fit shapes — geometry in action",
  },
  {
    mechanicId: "probability-systems",
    theme: {
      options: ["fortune teller's tent", "monster battle arena", "weather control station"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["fortune teller", "monster trainer", "weather scientist"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["bet coins on which crystal ball lights up", "choose attack moves based on hit chance", "set weather shields based on storm probability"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["double your coins in 5 rounds", "defeat 3 monsters using smart odds", "protect the city from all 5 storms"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Predict outcomes and weigh chances — probability and statistics",
  },
  {
    mechanicId: "path-optimization",
    theme: {
      options: ["delivery drone routes", "underground tunnel network", "enchanted forest maze"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["delivery drone pilot", "tunnel mole explorer", "forest spirit guide"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["draw the shortest delivery route between stops", "dig tunnels connecting all chambers", "light torches to mark the fastest path"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["deliver all packages under the distance limit", "connect every chamber with minimum digging", "light all torches before the darkness spreads"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Find the best path — graph reasoning and optimization",
  },
  {
    mechanicId: "construction-systems",
    theme: {
      options: ["sand castle contest", "ice sculpture studio", "cardboard fort builder"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["sand sculptor", "ice carver", "fort engineer"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["stack sand blocks to match the target volume", "carve ice to the exact dimensions", "arrange boxes to build the fort blueprint"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["match the volume target exactly", "carve 3 sculptures to spec", "build the fort matching all measurements"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Build to exact measurements — area, volume, and dimensions",
  },
  {
    mechanicId: "motion-simulation",
    theme: {
      options: ["rocket launch pad", "ski jump mountain", "roller coaster designer"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["rocket engineer", "ski jumper", "coaster tester"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["set thrust and angle to hit the orbit", "adjust speed and ramp angle for distance", "tune track slope for the target speed"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["reach orbit on 3 launches", "land in the target zone 3 times", "hit the target speed at every checkpoint"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Control speed, distance, and rate of change — rates and slopes",
  },
  {
    mechanicId: "constraint-puzzles",
    theme: {
      options: ["detective case board", "escape room", "spy code breaker"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["detective", "escape artist", "spy agent"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["eliminate suspects using clue logic", "unlock doors by solving constraint chains", "crack codes by narrowing possibilities"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["solve the case in under 10 moves", "escape all 3 rooms", "crack all codes before time runs out"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Use logic to eliminate and deduce — mathematical reasoning",
  },
  {
    mechanicId: "strategy-economy",
    theme: {
      options: ["mushroom farm", "crystal mine empire", "space colony"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["mushroom farmer", "mine overseer", "colony commander"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["reinvest harvest to grow the farm faster", "choose which veins to mine for compound growth", "allocate resources to grow the colony"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["reach 1000 mushrooms in 10 rounds", "mine 500 crystals through smart reinvestment", "grow the colony to 100 settlers"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Grow and compound — exponential growth and investment",
  },
  {
    mechanicId: "measurement-challenges",
    theme: {
      options: ["tailor's workshop", "bridge building site", "giant's kitchen"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["master tailor", "bridge engineer", "giant's cook"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["measure and cut fabric to exact lengths", "compare beam lengths to find the right fit", "measure ingredients with oversized tools"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["complete 3 outfits with perfect measurements", "build the bridge with no measurement errors", "cook 3 recipes with exact amounts"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Measure, compare, and convert units accurately",
  },
  {
    mechanicId: "scoring-ranking",
    theme: {
      options: ["talent show judges' table", "race track finish line", "treasure sorting vault"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["head judge", "race official", "vault keeper"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["rank performances by score from highest to lowest", "place racers in order by finish time", "sort treasures by value on the shelves"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["rank all performers correctly", "order all racers with zero mistakes", "sort every treasure before the vault locks"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Order, compare, and rank numbers — counting and cardinality",
  },
  {
    mechanicId: "timing-rhythm",
    theme: {
      options: ["music box factory", "firefly signal tower", "clock repair shop"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["music box tuner", "firefly keeper", "clockmaker"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["set the gears to play the right note pattern", "time the firefly flashes to match the sequence", "place clock hands to continue the time pattern"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["tune 3 music boxes to the right pattern", "signal the correct sequence 5 times", "repair all clocks by completing their patterns"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Recognize and extend patterns — sequences and functions",
  },
  {
    mechanicId: "scaling-resizing",
    theme: {
      options: ["shrink ray lab", "map maker's studio", "giant ant colony"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["shrink ray scientist", "cartographer", "ant architect"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["resize objects to fit through portals", "scale the map to match real distances", "build tunnels at the right proportions"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["shrink all objects to the exact ratio", "make 3 accurate maps", "build 5 tunnels at correct scale"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Scale, resize, and keep proportions — ratios and proportional reasoning",
  },
  {
    mechanicId: "inventory-crafting",
    theme: {
      options: ["witch's brewing station", "robot assembly line", "survival camp workshop"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["apprentice witch", "assembly line robot", "camp crafter"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["combine ingredients in the right amounts", "snap robot parts together by count", "gather and combine camp supplies"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["brew 3 potions with perfect recipes", "assemble 5 robots correctly", "craft all camp gear before nightfall"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Add, group, and combine — addition and grouping",
  },
  {
    mechanicId: "terrain-generation",
    theme: {
      options: ["star chart observatory", "submarine sonar room", "treasure map grid"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["astronomer", "submarine navigator", "treasure hunter"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["plot stars by coordinate to reveal constellations", "ping sonar at coordinates to find submarines", "mark X on the grid where treasure is buried"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["map all 5 constellations", "find all submarines before fuel runs out", "dig up all treasure with minimum guesses"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Navigate and plot by coordinates — the coordinate plane",
  },
  {
    mechanicId: "bidding-auction",
    theme: {
      options: ["alien marketplace", "monster auction house", "time traveler's bazaar"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["alien trader", "monster collector", "time merchant"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["estimate values and bid the right amount", "guess monster worth and place your bid", "appraise artifacts and set fair prices"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["win 3 auctions without overpaying", "build the best monster collection on budget", "profit on 5 trades in a row"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Estimate, round, and judge place value",
  },
  {
    mechanicId: "above-below-zero",
    theme: {
      options: ["deep sea submarine", "volcano core explorer", "arctic ice station"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["submarine pilot", "volcano diver", "arctic researcher"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["dive below or rise above sea level to the target depth", "navigate through hot and cold zones on a vertical axis", "adjust temperature gauges above and below freezing"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["reach all 5 target depths", "navigate through all zones without overheating", "calibrate all gauges correctly"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Move above and below zero — signed numbers and absolute value",
  },
  {
    mechanicId: "build-structure",
    theme: {
      options: ["gingerbread house contest", "robot body shop", "blanket fort championship"],
      hint: "The game happens in a ___(place)___",
    },
    character: {
      options: ["gingerbread architect", "robot mechanic", "fort builder kid"],
      hint: "The player is a ___(person, animal, or thing)___",
    },
    action: {
      options: ["snap candy pieces into the blueprint shape", "attach robot limbs matching the diagram", "drape blankets over the frame to match the plan"],
      hint: "The player ___(does what on screen?)___",
    },
    win: {
      options: ["build the gingerbread house matching the blueprint", "assemble 3 robots correctly", "build the fort exactly like the plan"],
      hint: "You win by ___(doing what?)___",
    },
    mathRole: "Model shapes by combining components — geometry and composition",
  },
]

// Quick lookup by mechanic ID
export const MECHANIC_OPTIONS_MAP = new Map(
  MECHANIC_CARD_OPTIONS.map(m => [m.mechanicId, m])
)
