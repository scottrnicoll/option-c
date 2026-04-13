// Hardcoded mapping: standard ID → game option IDs that genuinely teach that standard.
// Each standard maps to 1-4 game options where the math is intrinsic to gameplay.
//
// Game option groups by math concept:
//   Adding to target sum:       free-collect, conveyor-belt, split-the-loot
//   Fractions/partitioning:     cut-the-bar, pour-the-liquid, share-the-pizza
//   Equations/balancing:        free-balance, mystery-side, chain-scales
//   Geometry transformations:   rotate-to-match, tangram-fill, mirror-puzzle
//   Statistics/probability:     find-the-stat, bet-the-spinner, build-the-chart
//   Optimization/graphs:        shortest-route, map-builder, delivery-run
//   Area/volume/measurement:    stack-to-target, fill-the-floor, box-packer
//   Rate/speed/distance:        launch-to-target, speed-trap, catch-up
//   Logic/deduction:            elimination-grid, twenty-questions, logic-chain
//   Exponents/growth:           investment-sim, population-boom, doubling-maze
//   Measurement/units:          size-picker, ruler-race, unit-converter
//   Ordering/comparing:         sorting-lane, number-line-drop, leaderboard-fix
//   Patterns/sequences:         sequence-builder, pattern-machine, broken-pattern
//   Ratios/proportions:         resize-tool, recipe-scaler, map-distance
//   Addition/multiplication:    recipe-mixer, potion-lab, assembly-line
//   Coordinate plane:           coordinate-hunter, battleship, treasure-trail
//   Estimation/rounding:        auction-house, price-is-right, round-and-win
//   Negative numbers/integers:  depth-navigator, temperature-swing, elevator-operator
//   Composing/decomposing shapes: shape-matcher, free-build, shape-decomposer

export const STANDARD_GAME_OPTIONS: Record<string, string[]> = {
  // ═══════════════════════════════════════════════════════════════
  // KINDERGARTEN
  // ═══════════════════════════════════════════════════════════════

  // K.CC — Counting & Cardinality
  "K.CC.A.1": ["sorting-lane", "number-line-drop"],                         // Count to 100 by ones and tens
  "K.CC.A.2": ["sorting-lane", "number-line-drop"],                         // Count forward from a given number
  "K.CC.A.3": ["number-line-drop", "sorting-lane"],                         // Write numbers 0-20
  "K.CC.B.4a": ["sorting-lane", "free-collect"],                            // Counting objects one-to-one
  "K.CC.B.4b": ["free-collect", "assembly-line"],                           // Last number = count
  "K.CC.B.4c": ["number-line-drop", "sorting-lane"],                       // Each successive number is one larger
  "K.CC.B.5": ["free-collect", "assembly-line"],                            // Count to answer "how many?"
  "K.CC.C.6": ["sorting-lane", "size-picker", "leaderboard-fix"],          // Compare groups: greater/less/equal
  "K.CC.C.7": ["sorting-lane", "size-picker", "leaderboard-fix"],          // Compare two written numerals 1-10

  // K.OA — Operations & Algebraic Thinking
  "K.OA.A.1": ["free-collect", "recipe-mixer", "free-balance"],             // Represent addition/subtraction
  "K.OA.A.2": ["free-collect", "recipe-mixer", "split-the-loot"],           // Add/subtract word problems within 10
  "K.OA.A.3": ["split-the-loot", "free-collect"],                          // Decompose numbers ≤10 into pairs
  "K.OA.A.4": ["free-collect", "free-balance", "mystery-side"],             // Find number that makes 10
  "K.OA.A.5": ["free-collect", "conveyor-belt"],                            // Fluently add/subtract within 5

  // K.NBT — Number & Operations in Base Ten
  "K.NBT.A.1": ["free-collect", "split-the-loot"],                         // Compose/decompose 11-19 into ten ones + more

  // K.MD — Measurement & Data
  "K.MD.A.1": ["size-picker", "ruler-race"],                                // Describe measurable attributes
  "K.MD.A.2": ["size-picker", "ruler-race"],                                // Directly compare two objects
  "K.MD.B.3": ["sorting-lane", "build-the-chart"],                          // Classify and count by category

  // K.G — Geometry
  "K.G.A.1": ["shape-matcher", "coordinate-hunter"],                        // Describe shapes and positions
  "K.G.A.2": ["shape-matcher", "rotate-to-match"],                          // Name shapes regardless of orientation
  "K.G.A.3": ["shape-matcher", "shape-decomposer"],                         // Identify 2D vs 3D shapes
  "K.G.B.4": ["shape-matcher", "sorting-lane"],                             // Analyze/compare 2D and 3D shapes
  "K.G.B.5": ["shape-matcher", "free-build"],                               // Model shapes by building/drawing
  "K.G.B.6": ["tangram-fill", "shape-matcher", "free-build"],               // Compose simple shapes into larger shapes

  // ═══════════════════════════════════════════════════════════════
  // GRADE 1
  // ═══════════════════════════════════════════════════════════════

  // 1.OA — Operations & Algebraic Thinking
  "1.OA.A.1": ["free-collect", "free-balance", "mystery-side"],              // Add/subtract within 20 word problems
  "1.OA.A.2": ["free-collect", "recipe-mixer", "assembly-line"],             // Add three whole numbers ≤ 20
  "1.OA.B.3": ["free-collect", "split-the-loot", "free-balance"],            // Properties of operations (commutative, associative)
  "1.OA.B.4": ["mystery-side", "free-balance"],                              // Subtraction as unknown-addend
  "1.OA.C.5": ["number-line-drop", "free-collect"],                          // Relate counting to addition/subtraction
  "1.OA.C.6": ["free-collect", "conveyor-belt", "split-the-loot"],           // Add/subtract within 20 fluently
  "1.OA.D.7": ["free-balance", "mystery-side"],                              // Meaning of equal sign
  "1.OA.D.8": ["mystery-side", "free-balance"],                              // Unknown in addition/subtraction equation

  // 1.NBT — Number & Operations in Base Ten
  "1.NBT.A.1": ["number-line-drop", "sorting-lane"],                         // Count to 120
  "1.NBT.B.2a": ["free-collect", "split-the-loot"],                          // 10 as a bundle of ten ones
  "1.NBT.B.2b": ["free-collect", "split-the-loot"],                          // 11-19 = ten + ones
  "1.NBT.B.2c": ["number-line-drop", "sorting-lane"],                        // Multiples of 10
  "1.NBT.B.3": ["sorting-lane", "size-picker", "leaderboard-fix"],           // Compare two-digit numbers
  "1.NBT.C.4": ["free-collect", "conveyor-belt", "recipe-mixer"],            // Add within 100
  "1.NBT.C.5": ["number-line-drop", "free-collect"],                         // Mentally find 10 more/less
  "1.NBT.C.6": ["free-collect", "conveyor-belt"],                            // Subtract multiples of 10

  // 1.MD — Measurement & Data
  "1.MD.A.1": ["sorting-lane", "size-picker"],                               // Order three objects by length
  "1.MD.A.2": ["ruler-race", "size-picker"],                                 // Measure length in whole units
  "1.MD.B.3": ["number-line-drop", "sorting-lane"],                          // Tell time in hours and half-hours
  "1.MD.C.4": ["build-the-chart", "find-the-stat"],                          // Organize/interpret data, up to 3 categories

  // 1.G — Geometry
  "1.G.A.1": ["shape-matcher", "rotate-to-match"],                           // Defining vs non-defining attributes
  "1.G.A.2": ["tangram-fill", "shape-matcher", "free-build"],                // Compose 2D/3D shapes
  "1.G.A.3": ["cut-the-bar", "share-the-pizza"],                             // Partition circles/rectangles into halves/fourths

  // ═══════════════════════════════════════════════════════════════
  // GRADE 2
  // ═══════════════════════════════════════════════════════════════

  // 2.OA — Operations & Algebraic Thinking
  "2.OA.A.1": ["free-collect", "split-the-loot", "free-balance"],             // Add/subtract within 100 word problems
  "2.OA.B.2": ["free-collect", "conveyor-belt"],                              // Fluently add/subtract within 20
  "2.OA.C.3": ["sorting-lane", "elimination-grid"],                           // Odd/even
  "2.OA.C.4": ["fill-the-floor", "recipe-mixer", "assembly-line"],            // Rectangular arrays, equal addends

  // 2.NBT — Number & Operations in Base Ten
  "2.NBT.A.1a": ["free-collect", "split-the-loot"],                           // 100 = bundle of ten tens
  "2.NBT.A.1b": ["number-line-drop", "sorting-lane"],                         // Hundreds (100-900)
  "2.NBT.A.2": ["sequence-builder", "number-line-drop"],                      // Skip-count by 5s, 10s, 100s
  "2.NBT.A.3": ["number-line-drop", "sorting-lane"],                          // Read/write numbers to 1000
  "2.NBT.A.4": ["sorting-lane", "size-picker", "leaderboard-fix"],            // Compare three-digit numbers
  "2.NBT.B.5": ["free-collect", "conveyor-belt", "split-the-loot"],           // Add/subtract within 100 fluently
  "2.NBT.B.6": ["free-collect", "recipe-mixer", "assembly-line"],             // Add up to four two-digit numbers
  "2.NBT.B.7": ["free-collect", "conveyor-belt"],                             // Add/subtract within 1000
  "2.NBT.B.8": ["number-line-drop", "free-collect"],                          // Mentally add/subtract 10 or 100
  "2.NBT.B.9": ["free-balance", "free-collect"],                              // Explain add/subtract strategies

  // 2.MD — Measurement & Data
  "2.MD.A.1": ["ruler-race", "size-picker"],                                  // Measure with rulers, yardsticks
  "2.MD.A.2": ["ruler-race", "unit-converter"],                               // Measure with different units
  "2.MD.A.3": ["auction-house", "price-is-right"],                            // Estimate lengths
  "2.MD.A.4": ["ruler-race", "size-picker"],                                  // How much longer is one object
  "2.MD.B.5": ["free-collect", "ruler-race", "free-balance"],                 // Add/subtract within 100 with lengths
  "2.MD.B.6": ["number-line-drop", "free-collect"],                           // Number line sums/differences within 100
  "2.MD.C.7": ["number-line-drop", "sorting-lane"],                           // Tell time to nearest 5 min
  "2.MD.C.8": ["free-collect", "recipe-mixer"],                               // Word problems with coins/bills
  "2.MD.D.9": ["build-the-chart", "ruler-race"],                              // Measurement data → line plot
  "2.MD.D.10": ["build-the-chart", "find-the-stat"],                          // Picture/bar graph with up to 4 categories

  // 2.G — Geometry
  "2.G.A.1": ["shape-matcher", "rotate-to-match"],                            // Recognize/draw shapes with attributes
  "2.G.A.2": ["fill-the-floor", "free-build"],                                // Partition rectangle into rows/columns
  "2.G.A.3": ["cut-the-bar", "share-the-pizza", "pour-the-liquid"],           // Partition into halves, thirds, fourths

  // ═══════════════════════════════════════════════════════════════
  // GRADE 3
  // ═══════════════════════════════════════════════════════════════

  // 3.OA — Operations & Algebraic Thinking
  "3.OA.A.1": ["recipe-mixer", "potion-lab", "assembly-line"],                // Interpret products (groups of)
  "3.OA.A.2": ["share-the-pizza", "split-the-loot"],                          // Interpret quotients (partition equally)
  "3.OA.A.3": ["recipe-mixer", "potion-lab", "assembly-line"],                // Multiply/divide within 100 word problems
  "3.OA.A.4": ["mystery-side", "free-balance"],                               // Unknown in multiplication/division equation
  "3.OA.B.5": ["free-collect", "potion-lab", "recipe-mixer"],                 // Properties of operations for ×/÷
  "3.OA.B.6": ["mystery-side", "free-balance"],                               // Division as unknown-factor
  "3.OA.C.7": ["potion-lab", "recipe-mixer", "conveyor-belt"],                // Fluently multiply/divide within 100
  "3.OA.D.8": ["free-balance", "mystery-side", "free-collect"],                // Two-step word problems, four operations
  "3.OA.D.9": ["sequence-builder", "pattern-machine", "broken-pattern"],      // Arithmetic patterns

  // 3.NBT — Number & Operations in Base Ten
  "3.NBT.A.1": ["round-and-win", "auction-house"],                            // Round to nearest 10 or 100
  "3.NBT.A.2": ["free-collect", "conveyor-belt", "split-the-loot"],            // Add/subtract within 1000 fluently
  "3.NBT.A.3": ["potion-lab", "recipe-mixer"],                                 // Multiply one-digit × multiples of 10

  // 3.NF — Number & Operations—Fractions
  "3.NF.A.1": ["cut-the-bar", "pour-the-liquid", "share-the-pizza"],          // Understand fraction 1/b and a/b
  "3.NF.A.2a": ["number-line-drop", "cut-the-bar"],                           // Fraction 1/b on number line
  "3.NF.A.2b": ["number-line-drop", "cut-the-bar"],                           // Fraction a/b on number line
  "3.NF.A.3a": ["cut-the-bar", "pour-the-liquid"],                            // Equivalent fractions (same size)
  "3.NF.A.3b": ["cut-the-bar", "pour-the-liquid", "share-the-pizza"],         // Generate equivalent fractions
  "3.NF.A.3c": ["cut-the-bar", "number-line-drop"],                           // Whole numbers as fractions
  "3.NF.A.3d": ["sorting-lane", "size-picker", "cut-the-bar"],                // Compare fractions same numerator/denominator

  // 3.MD — Measurement & Data
  "3.MD.A.1": ["number-line-drop", "ruler-race"],                              // Tell time to nearest minute
  "3.MD.A.2": ["ruler-race", "size-picker", "unit-converter"],                 // Measure liquid volumes/masses
  "3.MD.B.3": ["build-the-chart", "find-the-stat"],                            // Scaled picture/bar graph
  "3.MD.B.4": ["ruler-race", "build-the-chart"],                               // Measure lengths with fractions → line plot
  "3.MD.C.5a": ["fill-the-floor", "stack-to-target"],                          // Unit square = one square unit
  "3.MD.C.5b": ["fill-the-floor", "stack-to-target"],                          // Area = n unit squares
  "3.MD.C.6": ["fill-the-floor", "stack-to-target"],                           // Measure areas by counting unit squares
  "3.MD.C.7a": ["fill-the-floor", "free-build"],                               // Area of rectangle by tiling
  "3.MD.C.7b": ["fill-the-floor", "potion-lab"],                               // Multiply side lengths for area
  "3.MD.C.7c": ["fill-the-floor", "free-build"],                               // Area and distributive property
  "3.MD.C.7d": ["shape-decomposer", "fill-the-floor", "free-build"],           // Area as additive; rectilinear figures
  "3.MD.D.8": ["free-build", "ruler-race", "fill-the-floor"],                  // Perimeters of polygons

  // 3.G — Geometry
  "3.G.A.1": ["shape-matcher", "sorting-lane", "elimination-grid"],            // Shapes share attributes; quadrilaterals
  "3.G.A.2": ["cut-the-bar", "share-the-pizza", "fill-the-floor"],            // Partition shapes → unit fractions of area

  // ═══════════════════════════════════════════════════════════════
  // GRADE 4
  // ═══════════════════════════════════════════════════════════════

  // 4.OA — Operations & Algebraic Thinking
  "4.OA.A.1": ["potion-lab", "recipe-scaler", "resize-tool"],                  // Multiplicative comparison
  "4.OA.A.2": ["potion-lab", "recipe-mixer", "mystery-side"],                  // Multiply/divide word problems
  "4.OA.A.3": ["free-collect", "free-balance", "mystery-side"],                // Multistep word problems, four operations
  "4.OA.B.4": ["elimination-grid", "logic-chain"],                             // Factor pairs, prime/composite
  "4.OA.C.5": ["sequence-builder", "pattern-machine", "broken-pattern"],       // Number/shape patterns

  // 4.NBT — Number & Operations in Base Ten
  "4.NBT.A.1": ["investment-sim", "potion-lab"],                               // Digit represents 10× place to right
  "4.NBT.A.2": ["sorting-lane", "size-picker", "leaderboard-fix"],             // Read/write/compare multi-digit numbers
  "4.NBT.A.3": ["round-and-win", "auction-house", "price-is-right"],           // Round multi-digit numbers
  "4.NBT.B.4": ["free-collect", "conveyor-belt", "split-the-loot"],            // Fluently add/subtract multi-digit
  "4.NBT.B.5": ["potion-lab", "recipe-mixer", "fill-the-floor"],               // Multiply up to 4-digit × 1-digit
  "4.NBT.B.6": ["share-the-pizza", "split-the-loot", "mystery-side"],          // Divide with up to 4-digit dividends

  // 4.NF — Number & Operations—Fractions
  "4.NF.A.1": ["cut-the-bar", "pour-the-liquid", "resize-tool"],               // Equivalent fractions (n×a)/(n×b)
  "4.NF.A.2": ["sorting-lane", "size-picker", "cut-the-bar"],                  // Compare fractions, different denominators
  "4.NF.B.3a": ["cut-the-bar", "pour-the-liquid"],                             // Add/subtract fractions = join/separate parts
  "4.NF.B.3b": ["cut-the-bar", "split-the-loot"],                              // Decompose fraction into sum
  "4.NF.B.3c": ["cut-the-bar", "pour-the-liquid", "free-collect"],             // Add/subtract mixed numbers
  "4.NF.B.3d": ["cut-the-bar", "pour-the-liquid", "free-collect"],             // Word problems: add/subtract fractions
  "4.NF.B.4a": ["cut-the-bar", "pour-the-liquid"],                             // Fraction a/b as multiple of 1/b
  "4.NF.B.4b": ["potion-lab", "cut-the-bar", "recipe-scaler"],                 // Multiply fraction by whole number
  "4.NF.B.4c": ["recipe-scaler", "potion-lab", "cut-the-bar"],                 // Word problems: fraction × whole number
  "4.NF.C.5": ["cut-the-bar", "pour-the-liquid"],                              // Denominator 10 → equivalent 100
  "4.NF.C.6": ["number-line-drop", "cut-the-bar"],                             // Decimal notation for fractions
  "4.NF.C.7": ["sorting-lane", "size-picker", "number-line-drop"],             // Compare decimals to hundredths

  // 4.MD — Measurement & Data
  "4.MD.A.1": ["unit-converter", "size-picker", "ruler-race"],                  // Measurement unit sizes; conversion tables
  "4.MD.A.2": ["unit-converter", "free-collect", "recipe-mixer"],               // Four operations with measurement
  "4.MD.A.3": ["fill-the-floor", "free-build", "box-packer"],                   // Area and perimeter formulas for rectangles
  "4.MD.B.4": ["build-the-chart", "ruler-race"],                                // Line plot with fractional measurements
  "4.MD.C.5a": ["rotate-to-match", "ruler-race"],                               // Angle measure as fraction of circle
  "4.MD.C.5b": ["rotate-to-match", "ruler-race"],                               // Angle = n one-degree angles
  "4.MD.C.6": ["rotate-to-match", "ruler-race"],                                // Measure/sketch angles with protractor
  "4.MD.C.7": ["rotate-to-match", "free-balance", "mystery-side"],              // Angle measure as additive; find unknown angles

  // 4.G — Geometry
  "4.G.A.1": ["shape-matcher", "free-build", "rotate-to-match"],                // Draw/identify lines, angles, parallel/perpendicular
  "4.G.A.2": ["shape-matcher", "elimination-grid", "sorting-lane"],              // Classify 2D figures by lines/angles
  "4.G.A.3": ["mirror-puzzle", "rotate-to-match"],                               // Line symmetry

  // ═══════════════════════════════════════════════════════════════
  // GRADE 5
  // ═══════════════════════════════════════════════════════════════

  // 5.OA — Operations & Algebraic Thinking
  "5.OA.A.1": ["free-collect", "potion-lab", "chain-scales"],                    // Parentheses/brackets in expressions
  "5.OA.A.2": ["pattern-machine", "potion-lab"],                                 // Write/interpret expressions
  "5.OA.B.3": ["sequence-builder", "pattern-machine", "coordinate-hunter"],      // Two numerical patterns → coordinate plane

  // 5.NBT — Number & Operations in Base Ten
  "5.NBT.A.1": ["investment-sim", "potion-lab"],                                 // Digit = 10× place to right, 1/10 place to left
  "5.NBT.A.2": ["investment-sim", "population-boom", "potion-lab"],              // Powers of 10, zeros in products
  "5.NBT.A.3a": ["number-line-drop", "sorting-lane"],                            // Read/write decimals to thousandths
  "5.NBT.A.3b": ["sorting-lane", "size-picker", "leaderboard-fix"],              // Compare decimals to thousandths
  "5.NBT.A.4": ["round-and-win", "auction-house"],                               // Round decimals to any place
  "5.NBT.B.5": ["potion-lab", "recipe-mixer"],                                   // Fluently multiply multi-digit
  "5.NBT.B.6": ["share-the-pizza", "split-the-loot", "mystery-side"],            // Divide with up to 4-digit ÷ 2-digit
  "5.NBT.B.7": ["free-collect", "potion-lab", "recipe-mixer"],                   // Add/subtract/multiply/divide decimals

  // 5.NF — Number & Operations—Fractions
  "5.NF.A.1": ["cut-the-bar", "pour-the-liquid", "free-collect"],                // Add/subtract fractions unlike denominators
  "5.NF.A.2": ["cut-the-bar", "pour-the-liquid", "auction-house"],               // Word problems: add/subtract fractions
  "5.NF.B.3": ["share-the-pizza", "cut-the-bar"],                                // Fraction as division
  "5.NF.B.4a": ["cut-the-bar", "potion-lab", "recipe-scaler"],                   // (a/b) × q
  "5.NF.B.4b": ["fill-the-floor", "cut-the-bar"],                                // Area of rectangle with fractional sides
  "5.NF.B.5a": ["size-picker", "resize-tool"],                                    // Compare product size to factor size
  "5.NF.B.5b": ["resize-tool", "recipe-scaler"],                                  // Multiply by fraction >/< 1
  "5.NF.B.6": ["recipe-scaler", "potion-lab", "cut-the-bar"],                     // Multiply fractions and mixed numbers
  "5.NF.B.7a": ["cut-the-bar", "share-the-pizza"],                                // Divide unit fraction by whole number
  "5.NF.B.7b": ["cut-the-bar", "share-the-pizza"],                                // Divide whole number by unit fraction
  "5.NF.B.7c": ["share-the-pizza", "cut-the-bar", "recipe-scaler"],               // Word problems: fraction division

  // 5.MD — Measurement & Data
  "5.MD.A.1": ["unit-converter", "size-picker", "ruler-race"],                     // Convert measurement units
  "5.MD.B.2": ["build-the-chart", "ruler-race", "cut-the-bar"],                   // Line plot with fraction measurements
  "5.MD.C.3a": ["box-packer", "stack-to-target"],                                  // Unit cube = one cubic unit
  "5.MD.C.3b": ["box-packer", "stack-to-target"],                                  // Volume = n unit cubes
  "5.MD.C.4": ["box-packer", "stack-to-target"],                                   // Measure volumes by counting unit cubes
  "5.MD.C.5a": ["box-packer", "stack-to-target", "fill-the-floor"],                // Volume of rectangular prism
  "5.MD.C.5b": ["box-packer", "stack-to-target"],                                  // V = l×w×h and V = b×h
  "5.MD.C.5c": ["box-packer", "shape-decomposer"],                                 // Volume as additive (composite prisms)

  // 5.G — Geometry
  "5.G.A.1": ["coordinate-hunter", "battleship", "treasure-trail"],                // Coordinate system, ordered pairs
  "5.G.A.2": ["coordinate-hunter", "battleship", "treasure-trail"],                // Graph points in first quadrant
  "5.G.B.3": ["shape-matcher", "elimination-grid"],                                // Attributes of shape categories
  "5.G.B.4": ["shape-matcher", "sorting-lane", "elimination-grid"],                // Classify 2D figures in hierarchy

  // ═══════════════════════════════════════════════════════════════
  // GRADE 6
  // ═══════════════════════════════════════════════════════════════

  // 6.RP — Ratios & Proportional Relationships
  "6.RP.A.1": ["resize-tool", "recipe-scaler"],                                    // Understand ratio concept
  "6.RP.A.2": ["recipe-scaler", "speed-trap", "resize-tool"],                      // Unit rate a/b
  "6.RP.A.3a": ["recipe-scaler", "coordinate-hunter", "resize-tool"],              // Tables of equivalent ratios
  "6.RP.A.3b": ["speed-trap", "recipe-scaler", "launch-to-target"],               // Unit rate problems, constant speed
  "6.RP.A.3c": ["recipe-scaler", "resize-tool", "investment-sim"],                 // Percent as rate per 100
  "6.RP.A.3d": ["unit-converter", "recipe-scaler", "map-distance"],                // Ratio reasoning for unit conversion

  // 6.NS — The Number System
  "6.NS.A.1": ["cut-the-bar", "share-the-pizza", "pour-the-liquid"],               // Divide fractions by fractions
  "6.NS.B.2": ["split-the-loot", "share-the-pizza"],                               // Fluently divide multi-digit
  "6.NS.B.3": ["free-collect", "potion-lab", "recipe-mixer"],                       // Add/subtract/multiply/divide decimals
  "6.NS.B.4": ["elimination-grid", "logic-chain"],                                  // GCF, LCM, distributive property
  "6.NS.C.5": ["depth-navigator", "temperature-swing", "elevator-operator"],        // Positive/negative numbers in context
  "6.NS.C.6a": ["depth-navigator", "number-line-drop"],                             // Opposites on number line
  "6.NS.C.6b": ["coordinate-hunter", "battleship"],                                  // Signs in ordered pairs, quadrants
  "6.NS.C.6c": ["number-line-drop", "coordinate-hunter"],                            // Position integers/rationals on number line
  "6.NS.C.7a": ["number-line-drop", "depth-navigator", "sorting-lane"],              // Inequality and number line position
  "6.NS.C.7b": ["sorting-lane", "depth-navigator", "temperature-swing"],             // Order rational numbers in context
  "6.NS.C.7c": ["depth-navigator", "number-line-drop"],                              // Absolute value as distance from 0
  "6.NS.C.7d": ["depth-navigator", "sorting-lane", "elimination-grid"],              // Absolute value vs order
  "6.NS.C.8": ["coordinate-hunter", "battleship", "treasure-trail"],                 // Graph in all four quadrants

  // 6.EE — Expressions & Equations
  "6.EE.A.1": ["investment-sim", "population-boom", "doubling-maze"],                // Whole-number exponents
  "6.EE.A.2a": ["pattern-machine", "mystery-side"],                                  // Write expressions with variables
  "6.EE.A.2b": ["elimination-grid", "pattern-machine"],                               // Identify expression parts
  "6.EE.A.2c": ["potion-lab", "recipe-mixer", "free-balance"],                        // Evaluate expressions at values
  "6.EE.A.3": ["pattern-machine", "free-balance"],                                    // Generate equivalent expressions
  "6.EE.A.4": ["pattern-machine", "free-balance", "elimination-grid"],                // Identify equivalent expressions
  "6.EE.B.5": ["mystery-side", "free-balance", "elimination-grid"],                   // Solve equation by substitution
  "6.EE.B.6": ["mystery-side", "free-balance"],                                       // Variables represent unknowns
  "6.EE.B.7": ["mystery-side", "free-balance", "chain-scales"],                       // Solve x+p=q, px=q
  "6.EE.B.8": ["number-line-drop", "elimination-grid"],                               // Write inequalities x>c, x<c
  "6.EE.C.9": ["launch-to-target", "speed-trap", "coordinate-hunter"],                // Two quantities; d=65t

  // 6.G — Geometry
  "6.G.A.1": ["shape-decomposer", "fill-the-floor", "free-build"],                    // Area of triangles, quadrilaterals, polygons
  "6.G.A.2": ["box-packer", "stack-to-target"],                                       // Volume of rectangular prism, fractional edges
  "6.G.A.3": ["coordinate-hunter", "battleship", "free-build"],                        // Draw polygons on coordinate plane
  "6.G.A.4": ["shape-decomposer", "tangram-fill", "free-build"],                       // Nets → surface area

  // 6.SP — Statistics & Probability
  "6.SP.A.1": ["find-the-stat", "build-the-chart"],                                    // Statistical questions
  "6.SP.A.2": ["find-the-stat", "build-the-chart"],                                    // Distribution: center, spread, shape
  "6.SP.A.3": ["find-the-stat", "build-the-chart"],                                    // Measure of center vs variation
  "6.SP.B.4": ["build-the-chart", "number-line-drop"],                                 // Dot plots, histograms, box plots
  "6.SP.B.5a": ["find-the-stat", "build-the-chart"],                                   // Number of observations
  "6.SP.B.5b": ["find-the-stat", "build-the-chart"],                                   // Attribute description, units
  "6.SP.B.5c": ["find-the-stat", "build-the-chart"],                                   // Median, mean, IQR, MAD
  "6.SP.B.5d": ["find-the-stat", "build-the-chart"],                                   // Choosing measures of center/variability

  // ═══════════════════════════════════════════════════════════════
  // GRADE 7
  // ═══════════════════════════════════════════════════════════════

  // 7.RP — Ratios & Proportional Relationships
  "7.RP.A.1": ["recipe-scaler", "resize-tool", "speed-trap"],                          // Unit rates with fractions
  "7.RP.A.2a": ["recipe-scaler", "resize-tool", "coordinate-hunter"],                  // Proportional relationship
  "7.RP.A.2b": ["recipe-scaler", "speed-trap", "resize-tool"],                         // Constant of proportionality
  "7.RP.A.2c": ["recipe-scaler", "resize-tool", "free-balance"],                       // Proportional equations t=pn
  "7.RP.A.2d": ["coordinate-hunter", "recipe-scaler"],                                 // Point (x,y) on proportional graph
  "7.RP.A.3": ["recipe-scaler", "resize-tool", "investment-sim"],                      // Multistep ratio/percent problems

  // 7.NS — The Number System
  "7.NS.A.1a": ["depth-navigator", "temperature-swing", "elevator-operator"],           // Opposite quantities sum to 0
  "7.NS.A.1b": ["depth-navigator", "number-line-drop", "temperature-swing"],            // p+q on number line
  "7.NS.A.1c": ["depth-navigator", "temperature-swing"],                                // Subtraction = adding inverse
  "7.NS.A.1d": ["depth-navigator", "temperature-swing", "elevator-operator"],           // Properties for adding/subtracting rationals
  "7.NS.A.2a": ["potion-lab", "depth-navigator"],                                       // Multiply signed numbers
  "7.NS.A.2b": ["share-the-pizza", "depth-navigator"],                                  // Divide integers
  "7.NS.A.2c": ["potion-lab", "recipe-mixer", "depth-navigator"],                       // Multiply/divide rational numbers
  "7.NS.A.2d": ["number-line-drop", "sorting-lane"],                                    // Convert rational → decimal
  "7.NS.A.3": ["free-collect", "potion-lab", "depth-navigator"],                        // Four operations with rationals

  // 7.EE — Expressions & Equations
  "7.EE.A.1": ["free-balance", "pattern-machine"],                                      // Add/subtract/factor linear expressions
  "7.EE.A.2": ["pattern-machine", "investment-sim"],                                     // Rewrite expressions (a+0.05a=1.05a)
  "7.EE.B.3": ["free-collect", "auction-house", "recipe-mixer"],                         // Multi-step problems, estimation
  "7.EE.B.4a": ["mystery-side", "free-balance", "chain-scales"],                         // Solve px+q=r
  "7.EE.B.4b": ["mystery-side", "free-balance", "number-line-drop"],                     // Solve px+q>r, graph solution

  // 7.G — Geometry
  "7.G.A.1": ["map-distance", "resize-tool", "recipe-scaler"],                           // Scale drawings
  "7.G.A.2": ["free-build", "shape-matcher", "rotate-to-match"],                         // Construct shapes from conditions
  "7.G.A.3": ["shape-decomposer", "box-packer"],                                         // Cross-sections of 3D figures
  "7.G.B.4": ["fill-the-floor", "free-build", "ruler-race"],                             // Area/circumference of circle
  "7.G.B.5": ["mystery-side", "free-balance", "rotate-to-match"],                        // Supplementary/complementary/vertical angles
  "7.G.B.6": ["fill-the-floor", "box-packer", "shape-decomposer"],                      // Area/volume/surface area problems

  // 7.SP — Statistics & Probability
  "7.SP.A.1": ["find-the-stat", "bet-the-spinner"],                                     // Sampling and population
  "7.SP.A.2": ["find-the-stat", "build-the-chart", "bet-the-spinner"],                  // Inferences from random samples
  "7.SP.B.3": ["find-the-stat", "build-the-chart"],                                     // Visual overlap of distributions
  "7.SP.B.4": ["find-the-stat", "build-the-chart"],                                     // Comparative inferences from data
  "7.SP.C.5": ["bet-the-spinner", "find-the-stat"],                                     // Probability between 0 and 1
  "7.SP.C.6": ["bet-the-spinner", "find-the-stat"],                                     // Approximate probability from data
  "7.SP.C.7a": ["bet-the-spinner", "find-the-stat"],                                    // Uniform probability model
  "7.SP.C.7b": ["bet-the-spinner", "find-the-stat", "build-the-chart"],                 // Non-uniform probability model
  "7.SP.C.8a": ["bet-the-spinner", "find-the-stat"],                                    // Compound event probability
  "7.SP.C.8b": ["bet-the-spinner", "build-the-chart", "elimination-grid"],              // Sample spaces: lists, tables, trees
  "7.SP.C.8c": ["bet-the-spinner", "find-the-stat"],                                    // Simulate compound events

  // ═══════════════════════════════════════════════════════════════
  // GRADE 8
  // ═══════════════════════════════════════════════════════════════

  // 8.NS — The Number System
  "8.NS.A.1": ["number-line-drop", "sorting-lane"],                                     // Rational vs irrational; repeating decimals
  "8.NS.A.2": ["number-line-drop", "auction-house", "sorting-lane"],                    // Approximate irrationals on number line

  // 8.EE — Expressions & Equations
  "8.EE.A.1": ["investment-sim", "population-boom", "doubling-maze"],                   // Properties of integer exponents
  "8.EE.A.2": ["mystery-side", "free-balance"],                                         // Square/cube roots, x²=p
  "8.EE.A.3": ["investment-sim", "population-boom", "auction-house"],                   // Scientific notation estimation
  "8.EE.A.4": ["investment-sim", "population-boom"],                                    // Operations with scientific notation
  "8.EE.B.5": ["speed-trap", "launch-to-target", "coordinate-hunter"],                  // Graph proportional; slope = unit rate
  "8.EE.B.6": ["coordinate-hunter", "speed-trap", "resize-tool"],                       // Similar triangles → slope; y=mx+b
  "8.EE.C.7a": ["mystery-side", "free-balance", "elimination-grid"],                    // Linear equations: one/none/infinite solutions
  "8.EE.C.7b": ["mystery-side", "free-balance", "chain-scales"],                        // Solve linear equations with rationals
  "8.EE.C.8a": ["coordinate-hunter", "chain-scales"],                                   // Systems = intersection of graphs
  "8.EE.C.8b": ["chain-scales", "mystery-side", "free-balance"],                        // Solve systems algebraically
  "8.EE.C.8c": ["chain-scales", "mystery-side", "free-balance"],                        // Systems in real-world problems

  // 8.F — Functions
  "8.F.A.1": ["pattern-machine", "coordinate-hunter"],                                  // Function: each input → one output
  "8.F.A.2": ["pattern-machine", "coordinate-hunter", "find-the-stat"],                 // Compare functions (table/graph/equation)
  "8.F.A.3": ["coordinate-hunter", "pattern-machine", "speed-trap"],                    // y=mx+b defines linear function
  "8.F.B.4": ["speed-trap", "launch-to-target", "coordinate-hunter"],                   // Construct linear function; rate of change
  "8.F.B.5": ["coordinate-hunter", "speed-trap", "build-the-chart"],                    // Describe function from graph

  // 8.G — Geometry
  "8.G.A.1a": ["rotate-to-match", "mirror-puzzle"],                                     // Lines → lines of same length
  "8.G.A.1b": ["rotate-to-match", "mirror-puzzle"],                                     // Angles → angles of same measure
  "8.G.A.1c": ["rotate-to-match", "mirror-puzzle"],                                     // Parallel → parallel
  "8.G.A.2": ["rotate-to-match", "mirror-puzzle", "tangram-fill"],                      // Congruence via transformations
  "8.G.A.3": ["rotate-to-match", "mirror-puzzle", "coordinate-hunter"],                 // Dilations/translations/rotations/reflections with coordinates
  "8.G.A.4": ["resize-tool", "rotate-to-match", "mirror-puzzle"],                       // Similarity via transformations
  "8.G.A.5": ["rotate-to-match", "mystery-side", "elimination-grid"],                   // Angle sum, transversals, AA similarity
  "8.G.B.6": ["mystery-side", "free-balance"],                                          // Pythagorean Theorem proof
  "8.G.B.7": ["mystery-side", "coordinate-hunter", "map-distance"],                     // Apply Pythagorean Theorem
  "8.G.B.8": ["coordinate-hunter", "map-distance"],                                     // Pythagorean Theorem → distance
  "8.G.C.9": ["box-packer", "stack-to-target"],                                         // Volume: cones, cylinders, spheres

  // 8.SP — Statistics & Probability
  "8.SP.A.1": ["build-the-chart", "coordinate-hunter", "find-the-stat"],                // Scatter plots, patterns
  "8.SP.A.2": ["build-the-chart", "coordinate-hunter"],                                 // Fit line to scatter plot
  "8.SP.A.3": ["speed-trap", "coordinate-hunter", "find-the-stat"],                     // Linear model: slope/intercept
  "8.SP.A.4": ["build-the-chart", "find-the-stat", "elimination-grid"],                 // Two-way tables, association

  // ═══════════════════════════════════════════════════════════════
  // HIGH SCHOOL — NUMBER & QUANTITY
  // ═══════════════════════════════════════════════════════════════

  // N-RN — The Real Number System
  "N-RN.A.1": ["investment-sim", "population-boom", "doubling-maze"],                   // Rational exponents extend integer exponents
  "N-RN.A.2": ["investment-sim", "population-boom"],                                    // Rewrite radicals ↔ rational exponents
  "N-RN.B.3": ["elimination-grid", "sorting-lane"],                                     // Sum/product of rationals/irrationals

  // N-Q — Quantities
  "N-Q.A.1": ["unit-converter", "recipe-scaler", "map-distance"],                       // Units in multi-step problems
  "N-Q.A.2": ["auction-house", "recipe-scaler"],                                         // Define quantities for modeling
  "N-Q.A.3": ["auction-house", "round-and-win", "ruler-race"],                           // Level of accuracy in measurement

  // N-CN — Complex Numbers
  "N-CN.A.1": ["depth-navigator", "number-line-drop"],                                  // Complex number i; a+bi
  "N-CN.A.2": ["potion-lab", "recipe-mixer"],                                            // Add/subtract/multiply complex numbers
  "N-CN.A.3": ["potion-lab", "elimination-grid"],                                        // Conjugate; moduli; quotients
  "N-CN.B.4": ["coordinate-hunter", "number-line-drop"],                                 // Complex plane, rectangular/polar
  "N-CN.B.5": ["coordinate-hunter", "rotate-to-match"],                                  // Complex operations geometrically
  "N-CN.B.6": ["coordinate-hunter", "map-distance"],                                     // Distance/midpoint in complex plane
  "N-CN.C.7": ["mystery-side", "free-balance"],                                          // Quadratics with complex solutions
  "N-CN.C.8": ["pattern-machine", "mystery-side"],                                       // Polynomial identities → complex
  "N-CN.C.9": ["elimination-grid", "logic-chain"],                                       // Fundamental Theorem of Algebra

  // N-VM — Vector & Matrix Quantities
  "N-VM.A.1": ["coordinate-hunter", "treasure-trail"],                                   // Vector magnitude/direction
  "N-VM.A.2": ["coordinate-hunter", "treasure-trail"],                                   // Vector components
  "N-VM.A.3": ["launch-to-target", "speed-trap", "coordinate-hunter"],                  // Velocity/vector problems
  "N-VM.B.4a": ["coordinate-hunter", "treasure-trail", "free-collect"],                  // Add vectors
  "N-VM.B.4b": ["coordinate-hunter", "treasure-trail"],                                  // Sum magnitude/direction
  "N-VM.B.4c": ["coordinate-hunter", "depth-navigator"],                                 // Vector subtraction
  "N-VM.B.5a": ["resize-tool", "coordinate-hunter"],                                     // Scalar multiplication of vectors
  "N-VM.B.5b": ["resize-tool", "coordinate-hunter"],                                     // Magnitude of scalar multiple
  "N-VM.C.6": ["build-the-chart", "coordinate-hunter"],                                  // Matrices for data
  "N-VM.C.7": ["resize-tool", "potion-lab"],                                              // Scalar × matrix
  "N-VM.C.8": ["potion-lab", "recipe-mixer"],                                             // Add/subtract/multiply matrices
  "N-VM.C.9": ["logic-chain", "elimination-grid"],                                        // Matrix multiplication not commutative
  "N-VM.C.10": ["logic-chain", "elimination-grid"],                                       // Zero/identity matrices, determinant
  "N-VM.C.11": ["coordinate-hunter", "rotate-to-match"],                                  // Matrix × vector
  "N-VM.C.12": ["rotate-to-match", "resize-tool", "coordinate-hunter"],                  // 2×2 matrix transformations, determinant area

  // ═══════════════════════════════════════════════════════════════
  // HIGH SCHOOL — ALGEBRA
  // ═══════════════════════════════════════════════════════════════

  // A-SSE — Seeing Structure in Expressions
  "A-SSE.A.1a": ["pattern-machine", "free-balance"],                                     // Interpret terms, factors, coefficients
  "A-SSE.A.1b": ["investment-sim", "pattern-machine"],                                   // Interpret P(1+r)^n
  "A-SSE.A.2": ["pattern-machine", "elimination-grid"],                                  // Rewrite expressions (factor)
  "A-SSE.B.3a": ["mystery-side", "free-balance", "coordinate-hunter"],                   // Factor quadratic → zeros
  "A-SSE.B.3b": ["mystery-side", "free-balance"],                                        // Complete the square → max/min
  "A-SSE.B.3c": ["investment-sim", "population-boom", "doubling-maze"],                  // Exponent properties for exponentials
  "A-SSE.B.4": ["sequence-builder", "investment-sim"],                                    // Geometric series formula

  // A-APR — Arithmetic with Polynomials & Rational Expressions
  "A-APR.A.1": ["potion-lab", "recipe-mixer", "pattern-machine"],                        // Add/subtract/multiply polynomials
  "A-APR.B.2": ["pattern-machine", "elimination-grid"],                                  // Remainder Theorem
  "A-APR.B.3": ["coordinate-hunter", "elimination-grid", "mystery-side"],                // Zeros of polynomials → graph
  "A-APR.C.4": ["pattern-machine", "logic-chain"],                                       // Polynomial identities
  "A-APR.C.5": ["sequence-builder", "pattern-machine", "investment-sim"],                // Binomial Theorem
  "A-APR.D.6": ["share-the-pizza", "pattern-machine"],                                   // Rewrite rational expressions
  "A-APR.D.7": ["cut-the-bar", "potion-lab"],                                            // Operations on rational expressions

  // A-CED — Creating Equations
  "A-CED.A.1": ["mystery-side", "free-balance", "chain-scales"],                         // Create equations/inequalities in one variable
  "A-CED.A.2": ["coordinate-hunter", "speed-trap", "launch-to-target"],                  // Create equations in two variables; graph
  "A-CED.A.3": ["chain-scales", "elimination-grid", "free-balance"],                     // Constraints as equations/inequalities
  "A-CED.A.4": ["mystery-side", "free-balance", "chain-scales"],                         // Rearrange formulas

  // A-REI — Reasoning with Equations & Inequalities
  "A-REI.A.1": ["free-balance", "mystery-side", "chain-scales"],                         // Explain steps in solving equations
  "A-REI.A.2": ["mystery-side", "free-balance"],                                         // Solve rational/radical equations
  "A-REI.B.3": ["mystery-side", "free-balance", "chain-scales"],                         // Solve linear equations/inequalities
  "A-REI.B.4a": ["mystery-side", "free-balance"],                                        // Completing the square
  "A-REI.B.4b": ["mystery-side", "free-balance", "elimination-grid"],                    // Solve quadratics (multiple methods)
  "A-REI.C.5": ["chain-scales", "free-balance"],                                         // Systems: replacement preserves solutions
  "A-REI.C.6": ["chain-scales", "coordinate-hunter", "free-balance"],                    // Solve systems of linear equations
  "A-REI.C.7": ["coordinate-hunter", "mystery-side"],                                    // System: linear + quadratic
  "A-REI.C.8": ["chain-scales", "free-balance"],                                         // System as matrix equation
  "A-REI.C.9": ["chain-scales", "free-balance"],                                         // Matrix inverse to solve systems
  "A-REI.D.10": ["coordinate-hunter", "battleship"],                                     // Graph of equation = solution set
  "A-REI.D.11": ["coordinate-hunter", "elimination-grid"],                                // Intersection of graphs = solutions
  "A-REI.D.12": ["coordinate-hunter", "elimination-grid"],                                // Graph linear inequalities

  // ═══════════════════════════════════════════════════════════════
  // HIGH SCHOOL — FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  // F-IF — Interpreting Functions
  "F-IF.A.1": ["pattern-machine", "coordinate-hunter"],                                  // Function: domain → range
  "F-IF.A.2": ["pattern-machine", "coordinate-hunter"],                                  // Evaluate functions; notation
  "F-IF.A.3": ["sequence-builder", "pattern-machine"],                                   // Sequences as functions
  "F-IF.B.4": ["coordinate-hunter", "build-the-chart", "speed-trap"],                   // Interpret key features of graphs
  "F-IF.B.5": ["coordinate-hunter", "pattern-machine"],                                  // Domain from graph/context
  "F-IF.B.6": ["speed-trap", "launch-to-target", "catch-up"],                           // Average rate of change
  "F-IF.C.7a": ["coordinate-hunter", "mystery-side"],                                    // Graph linear/quadratic
  "F-IF.C.7b": ["coordinate-hunter", "pattern-machine"],                                 // Graph square root, piecewise
  "F-IF.C.7c": ["coordinate-hunter", "pattern-machine"],                                 // Graph polynomials
  "F-IF.C.7d": ["coordinate-hunter", "elimination-grid"],                                // Graph rational functions
  "F-IF.C.7e": ["coordinate-hunter", "investment-sim", "population-boom"],               // Graph exponential/log/trig
  "F-IF.C.8a": ["mystery-side", "free-balance", "coordinate-hunter"],                    // Factor/complete square for quadratic
  "F-IF.C.8b": ["investment-sim", "population-boom", "doubling-maze"],                   // Interpret exponential expressions
  "F-IF.C.9": ["coordinate-hunter", "pattern-machine", "find-the-stat"],                 // Compare functions in different forms

  // F-BF — Building Functions
  "F-BF.A.1a": ["pattern-machine", "sequence-builder", "speed-trap"],                    // Explicit expression from context
  "F-BF.A.1b": ["potion-lab", "pattern-machine"],                                        // Combine function types
  "F-BF.A.1c": ["pattern-machine", "potion-lab"],                                        // Compose functions
  "F-BF.A.2": ["sequence-builder", "pattern-machine", "investment-sim"],                 // Arithmetic/geometric sequences
  "F-BF.B.3": ["coordinate-hunter", "resize-tool", "pattern-machine"],                  // f(x)+k, kf(x), f(kx), f(x+k)
  "F-BF.B.4a": ["mystery-side", "pattern-machine"],                                      // Inverse: solve f(x)=c
  "F-BF.B.4b": ["pattern-machine", "logic-chain"],                                       // Verify inverse by composition
  "F-BF.B.4c": ["coordinate-hunter", "pattern-machine"],                                  // Read inverse from graph/table
  "F-BF.B.4d": ["pattern-machine", "elimination-grid"],                                   // Restrict domain for invertibility
  "F-BF.B.5": ["investment-sim", "population-boom", "doubling-maze"],                     // Exponents ↔ logarithms

  // F-LE — Linear, Quadratic, & Exponential Models
  "F-LE.A.1a": ["speed-trap", "sequence-builder", "pattern-machine"],                     // Linear = equal differences; exponential = equal factors
  "F-LE.A.1b": ["speed-trap", "launch-to-target", "catch-up"],                            // Constant rate of change
  "F-LE.A.1c": ["investment-sim", "population-boom", "doubling-maze"],                    // Constant percent rate (growth/decay)
  "F-LE.A.2": ["sequence-builder", "coordinate-hunter", "investment-sim"],                // Construct linear/exponential from data
  "F-LE.A.3": ["investment-sim", "population-boom", "coordinate-hunter"],                 // Exponential exceeds polynomial
  "F-LE.A.4": ["investment-sim", "population-boom"],                                      // Logarithm to solve ab^(ct)=d
  "F-LE.B.5": ["speed-trap", "investment-sim", "launch-to-target"],                       // Interpret parameters in linear/exponential

  // F-TF — Trigonometric Functions
  "F-TF.A.1": ["rotate-to-match", "ruler-race"],                                          // Radian measure
  "F-TF.A.2": ["rotate-to-match", "coordinate-hunter"],                                   // Unit circle → trig functions
  "F-TF.A.3": ["rotate-to-match", "coordinate-hunter"],                                   // Special triangle trig values
  "F-TF.A.4": ["rotate-to-match", "mirror-puzzle"],                                       // Symmetry/periodicity of trig
  "F-TF.B.5": ["pattern-machine", "coordinate-hunter"],                                   // Model periodic phenomena
  "F-TF.B.6": ["pattern-machine", "coordinate-hunter"],                                   // Restrict domain → inverse trig
  "F-TF.B.7": ["mystery-side", "coordinate-hunter"],                                      // Solve trig equations
  "F-TF.C.8": ["mystery-side", "free-balance"],                                           // Pythagorean identity
  "F-TF.C.9": ["pattern-machine", "free-balance"],                                        // Addition/subtraction formulas

  // ═══════════════════════════════════════════════════════════════
  // HIGH SCHOOL — GEOMETRY
  // ═══════════════════════════════════════════════════════════════

  // G-CO — Congruence
  "G-CO.A.1": ["shape-matcher", "rotate-to-match", "ruler-race"],                         // Definitions: angle, circle, parallel, perpendicular
  "G-CO.A.2": ["rotate-to-match", "mirror-puzzle", "coordinate-hunter"],                  // Transformations as functions
  "G-CO.A.3": ["rotate-to-match", "mirror-puzzle"],                                       // Symmetries of rectangles/parallelograms/polygons
  "G-CO.A.4": ["rotate-to-match", "mirror-puzzle"],                                       // Define rotations/reflections/translations
  "G-CO.A.5": ["rotate-to-match", "mirror-puzzle", "tangram-fill"],                       // Draw transformed figure
  "G-CO.B.6": ["rotate-to-match", "mirror-puzzle"],                                       // Rigid motions → congruence
  "G-CO.B.7": ["rotate-to-match", "mirror-puzzle", "shape-matcher"],                      // Triangle congruence via rigid motions
  "G-CO.B.8": ["rotate-to-match", "mirror-puzzle", "logic-chain"],                        // ASA, SAS, SSS from rigid motions
  "G-CO.C.9": ["mystery-side", "logic-chain", "elimination-grid"],                        // Prove theorems about lines/angles
  "G-CO.C.10": ["mystery-side", "logic-chain", "free-balance"],                            // Prove theorems about triangles
  "G-CO.C.11": ["mystery-side", "logic-chain", "free-balance"],                            // Prove theorems about parallelograms
  "G-CO.D.12": ["free-build", "rotate-to-match", "ruler-race"],                            // Geometric constructions
  "G-CO.D.13": ["free-build", "rotate-to-match"],                                          // Construct equilateral triangle, square, hexagon

  // G-SRT — Similarity, Right Triangles, & Trigonometry
  "G-SRT.A.1a": ["resize-tool", "rotate-to-match"],                                       // Dilation: parallel lines
  "G-SRT.A.1b": ["resize-tool", "map-distance"],                                          // Dilation: scale factor
  "G-SRT.A.2": ["resize-tool", "rotate-to-match", "mirror-puzzle"],                       // Similarity via transformations
  "G-SRT.A.3": ["resize-tool", "rotate-to-match"],                                        // AA criterion for similarity
  "G-SRT.B.4": ["resize-tool", "mystery-side", "logic-chain"],                             // Theorems: proportional sides, Pythagorean
  "G-SRT.B.5": ["resize-tool", "mystery-side", "shape-matcher"],                           // Use congruence/similarity to solve
  "G-SRT.C.6": ["resize-tool", "recipe-scaler"],                                           // Trig ratios from similar triangles
  "G-SRT.C.7": ["rotate-to-match", "mystery-side"],                                        // Sine/cosine of complementary angles
  "G-SRT.C.8": ["mystery-side", "map-distance", "launch-to-target"],                      // Trig ratios + Pythagorean Theorem applied
  "G-SRT.D.9": ["fill-the-floor", "mystery-side"],                                         // Triangle area = 1/2 ab sin(C)
  "G-SRT.D.10": ["mystery-side", "launch-to-target"],                                      // Laws of Sines and Cosines
  "G-SRT.D.11": ["mystery-side", "launch-to-target", "map-distance"],                     // Apply Law of Sines/Cosines

  // G-C — Circles
  "G-C.A.1": ["resize-tool", "rotate-to-match"],                                           // All circles are similar
  "G-C.A.2": ["rotate-to-match", "mystery-side", "ruler-race"],                            // Inscribed angles, radii, chords
  "G-C.A.3": ["free-build", "rotate-to-match"],                                             // Inscribed/circumscribed circles
  "G-C.A.4": ["free-build", "rotate-to-match"],                                             // Tangent line construction
  "G-C.B.5": ["resize-tool", "ruler-race", "rotate-to-match"],                              // Arc length, radian, sector area

  // G-GPE — Expressing Geometric Properties with Equations
  "G-GPE.A.1": ["coordinate-hunter", "mystery-side"],                                       // Equation of circle (Pythagorean)
  "G-GPE.A.2": ["coordinate-hunter", "mystery-side"],                                       // Equation of parabola
  "G-GPE.A.3": ["coordinate-hunter", "mystery-side"],                                       // Equations of ellipses/hyperbolas
  "G-GPE.B.4": ["coordinate-hunter", "logic-chain"],                                        // Coordinate proofs
  "G-GPE.B.5": ["coordinate-hunter", "speed-trap"],                                         // Slope criteria: parallel/perpendicular
  "G-GPE.B.6": ["coordinate-hunter", "resize-tool", "map-distance"],                       // Partition directed segment in ratio
  "G-GPE.B.7": ["coordinate-hunter", "ruler-race", "map-distance"],                        // Perimeter/area via coordinates

  // G-GMD — Geometric Measurement & Dimension
  "G-GMD.A.1": ["fill-the-floor", "box-packer", "free-build"],                              // Formulas: circumference, area, volume
  "G-GMD.A.2": ["box-packer", "stack-to-target"],                                            // Cavalieri's principle → volume of sphere
  "G-GMD.A.3": ["box-packer", "stack-to-target", "fill-the-floor"],                         // Volume formulas: cylinder, pyramid, cone, sphere
  "G-GMD.B.4": ["shape-decomposer", "box-packer", "rotate-to-match"],                      // Cross-sections; solids of revolution

  // G-MG — Modeling with Geometry
  "G-MG.A.1": ["shape-matcher", "free-build", "box-packer"],                                // Model objects with geometric shapes
  "G-MG.A.2": ["fill-the-floor", "box-packer", "recipe-scaler"],                            // Density based on area/volume
  "G-MG.A.3": ["free-build", "shortest-route", "fill-the-floor"],                           // Design problems with geometric methods

  // ═══════════════════════════════════════════════════════════════
  // HIGH SCHOOL — STATISTICS & PROBABILITY
  // ═══════════════════════════════════════════════════════════════

  // S-ID — Interpreting Categorical & Quantitative Data
  "S-ID.A.1": ["build-the-chart", "number-line-drop"],                                      // Dot plots, histograms, box plots
  "S-ID.A.2": ["find-the-stat", "build-the-chart"],                                          // Compare center/spread
  "S-ID.A.3": ["find-the-stat", "build-the-chart", "elimination-grid"],                     // Shape/center/spread with outliers
  "S-ID.A.4": ["find-the-stat", "build-the-chart", "bet-the-spinner"],                      // Normal distribution, mean/SD
  "S-ID.B.5": ["build-the-chart", "find-the-stat"],                                          // Two-way frequency tables
  "S-ID.B.6a": ["coordinate-hunter", "build-the-chart", "pattern-machine"],                 // Fit function to data
  "S-ID.B.6b": ["build-the-chart", "coordinate-hunter"],                                    // Plot/analyze residuals
  "S-ID.B.6c": ["build-the-chart", "coordinate-hunter"],                                    // Fit linear function to scatter plot
  "S-ID.C.7": ["speed-trap", "coordinate-hunter", "find-the-stat"],                         // Interpret slope/intercept of linear model
  "S-ID.C.8": ["find-the-stat", "build-the-chart"],                                         // Correlation coefficient
  "S-ID.C.9": ["find-the-stat", "logic-chain", "elimination-grid"],                         // Correlation ≠ causation

  // S-IC — Making Inferences & Justifying Conclusions
  "S-IC.A.1": ["find-the-stat", "bet-the-spinner"],                                         // Inference from random sample
  "S-IC.A.2": ["bet-the-spinner", "find-the-stat", "build-the-chart"],                     // Model vs data-generating process
  "S-IC.B.3": ["find-the-stat", "logic-chain"],                                              // Surveys vs experiments vs observational
  "S-IC.B.4": ["find-the-stat", "build-the-chart", "bet-the-spinner"],                     // Estimate mean/proportion; margin of error
  "S-IC.B.5": ["find-the-stat", "bet-the-spinner", "build-the-chart"],                     // Compare treatments; significance
  "S-IC.B.6": ["find-the-stat", "logic-chain", "elimination-grid"],                         // Evaluate data reports

  // S-CP — Conditional Probability & Rules of Probability
  "S-CP.A.1": ["bet-the-spinner", "elimination-grid"],                                      // Events as subsets of sample space
  "S-CP.A.2": ["bet-the-spinner", "find-the-stat"],                                         // Independent events: P(A∩B)=P(A)P(B)
  "S-CP.A.3": ["bet-the-spinner", "find-the-stat"],                                         // Conditional probability P(A|B)
  "S-CP.A.4": ["build-the-chart", "bet-the-spinner", "find-the-stat"],                     // Two-way tables; conditional probability
  "S-CP.A.5": ["bet-the-spinner", "find-the-stat", "logic-chain"],                          // Conditional probability in everyday language
  "S-CP.B.6": ["bet-the-spinner", "find-the-stat"],                                         // P(A|B) as fraction of B
  "S-CP.B.7": ["bet-the-spinner", "find-the-stat"],                                         // Addition Rule P(A∪B)
  "S-CP.B.8": ["bet-the-spinner", "find-the-stat"],                                         // General Multiplication Rule
  "S-CP.B.9": ["bet-the-spinner", "elimination-grid", "logic-chain"],                      // Permutations/combinations

  // S-MD — Using Probability to Make Decisions
  "S-MD.A.1": ["bet-the-spinner", "build-the-chart"],                                       // Random variable; probability distribution
  "S-MD.A.2": ["bet-the-spinner", "find-the-stat"],                                         // Expected value
  "S-MD.A.3": ["bet-the-spinner", "find-the-stat", "build-the-chart"],                     // Theoretical probability → expected value
  "S-MD.A.4": ["bet-the-spinner", "find-the-stat", "build-the-chart"],                     // Empirical probability → expected value
  "S-MD.B.5a": ["bet-the-spinner", "auction-house"],                                        // Expected payoff
  "S-MD.B.5b": ["bet-the-spinner", "auction-house", "investment-sim"],                     // Compare strategies by expected value
  "S-MD.B.6": ["bet-the-spinner", "find-the-stat"],                                         // Fair decisions using probability
  "S-MD.B.7": ["bet-the-spinner", "logic-chain", "elimination-grid"],                      // Analyze decisions with probability
}

/**
 * Returns the game option IDs mapped to a given standard,
 * or null if the standard is not found in the mapping.
 */
export function getGameOptionsForStandard(standardId: string): string[] | null {
  return STANDARD_GAME_OPTIONS[standardId] ?? null
}
