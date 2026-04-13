// Hardcoded mapping: domain code → allowed mechanic IDs.
// This OVERRIDES the keyword-based matchMechanics() to ensure
// only genuinely appropriate mechanics are offered for each standard.
//
// The mapping is based on: which game mechanics actually test the
// math concept in the standard? A mechanic is allowed ONLY if
// playing the game requires using that specific math skill.

// Domain code → array of mechanic IDs (in priority order)
export const DOMAIN_MECHANIC_MAP: Record<string, string[]> = {
  // ─── K-8 Domains ───────────────────────────────────────────

  // Counting & Cardinality (K only)
  "CC": ["scoring-ranking", "resource-management"],

  // Operations & Algebraic Thinking
  "OA": ["resource-management", "inventory-crafting", "balance-systems"],

  // Number & Operations in Base Ten
  "NBT": ["bidding-auction", "resource-management", "scoring-ranking"],

  // Number & Operations — Fractions
  "NF": ["partitioning", "scaling-resizing", "inventory-crafting"],

  // Measurement & Data (measurement standards get build/measure; data standards handled by keywords)
  "MD": ["construction-systems", "measurement-challenges"],

  // Geometry (K-8)
  "G": ["spatial-puzzles", "construction-systems", "build-structure"],

  // Ratios & Proportional Relationships
  "RP": ["scaling-resizing", "inventory-crafting", "resource-management"],

  // The Number System
  "NS": ["above-below-zero", "scoring-ranking", "resource-management"],

  // Expressions & Equations
  "EE": ["balance-systems", "resource-management", "timing-rhythm"],

  // Statistics & Probability
  "SP": ["probability-systems", "scoring-ranking", "bidding-auction"],

  // Functions (8th grade)
  "F": ["motion-simulation", "timing-rhythm", "strategy-economy"],

  // ─── High School Domains ───────────────────────────────────

  // Number & Quantity
  "N-RN": ["strategy-economy", "scaling-resizing"],
  "N-Q": ["measurement-challenges", "bidding-auction"],
  "N-CN": ["terrain-generation", "balance-systems"],
  "N-VM": ["terrain-generation", "spatial-puzzles"],

  // Algebra
  "A-SSE": ["balance-systems", "inventory-crafting"],
  "A-APR": ["balance-systems", "timing-rhythm"],
  "A-CED": ["balance-systems", "motion-simulation"],
  "A-REI": ["balance-systems", "terrain-generation", "constraint-puzzles"],

  // Functions
  "F-IF": ["motion-simulation", "timing-rhythm", "terrain-generation"],
  "F-BF": ["timing-rhythm", "strategy-economy"],
  "F-LE": ["strategy-economy", "motion-simulation"],
  "F-TF": ["timing-rhythm", "spatial-puzzles"],

  // Geometry
  "G-CO": ["spatial-puzzles", "construction-systems"],
  "G-SRT": ["spatial-puzzles", "scaling-resizing"],
  "G-C": ["spatial-puzzles", "construction-systems"],
  "G-GPE": ["terrain-generation", "spatial-puzzles"],
  "G-GMD": ["construction-systems", "measurement-challenges"],
  "G-MG": ["construction-systems", "measurement-challenges"],

  // Statistics & Probability
  "S-ID": ["probability-systems", "scoring-ranking"],
  "S-IC": ["probability-systems", "bidding-auction"],
  "S-CP": ["probability-systems", "resource-management"],
  "S-MD": ["probability-systems", "bidding-auction"],

  // Mathematical Practices (shouldn't be moons, but just in case)
  "MP": ["constraint-puzzles", "balance-systems"],
}

// Get allowed mechanics for a standard based on its domain code.
// Falls back to keyword matching if domain not in the map.
export function getAllowedMechanics(domainCode: string): string[] | null {
  // Try exact match first (e.g. "A-REI")
  if (DOMAIN_MECHANIC_MAP[domainCode]) return DOMAIN_MECHANIC_MAP[domainCode]
  // Try prefix match for compound codes (e.g. "G" matches "G-CO")
  // But we want the MORE specific match, so only fall back to base if no specific exists
  const base = domainCode.split("-")[0]
  if (DOMAIN_MECHANIC_MAP[base]) return DOMAIN_MECHANIC_MAP[base]
  return null // No mapping — fall back to keyword matching
}
