// Game engine registry — all 19 engines.

import type { ThemeConfig, MathParams, GameEngine, GameOption, RoundData } from "./engine-types"
import { balanceSystemsPhaserEngine } from "./balance-systems-phaser"
import { riseFallEngine } from "./rise-fall"
import { scoringRankingPhaserEngine } from "./scoring-ranking-phaser"
import { collectManagePhaserEngine } from "./collect-manage-phaser"
import { plotExploreEngine } from "./plot-explore"
import { scalingResizingPhaserEngine } from "./scaling-resizing-phaser"
import { buildMeasureEngine } from "./build-measure"
import { patternRepeatEngine } from "./pattern-repeat"
import { inventoryCraftingPhaserEngine } from "./inventory-crafting-phaser"
import { bidEstimateEngine } from "./bid-estimate"
import { measurementChallengesPhaserEngine } from "./measurement-challenges-phaser"
import { growCompoundEngine } from "./grow-compound"
import { solveEliminateEngine } from "./solve-eliminate"
import { partitioningPhaserEngine } from "./partitioning-phaser"
import { rollPredictEngine } from "./roll-predict"
import { fitRotateEngine } from "./fit-rotate"
import { navigateOptimizeEngine } from "./navigate-optimize"
import { raceCalculateEngine } from "./race-calculate"
import { buildStructureEngine } from "./build-structure"

const ENGINE_REGISTRY: Record<string, GameEngine> = {
  "resource-management": collectManagePhaserEngine,
  "partitioning": partitioningPhaserEngine,
  "balance-systems": balanceSystemsPhaserEngine,
  "spatial-puzzles": fitRotateEngine,
  "probability-systems": rollPredictEngine,
  "path-optimization": navigateOptimizeEngine,
  "construction-systems": buildMeasureEngine,
  "motion-simulation": raceCalculateEngine,
  "constraint-puzzles": solveEliminateEngine,
  "strategy-economy": growCompoundEngine,
  "measurement-challenges": measurementChallengesPhaserEngine,
  "scoring-ranking": scoringRankingPhaserEngine,
  "timing-rhythm": patternRepeatEngine,
  "scaling-resizing": scalingResizingPhaserEngine,
  "inventory-crafting": inventoryCraftingPhaserEngine,
  "terrain-generation": plotExploreEngine,
  "bidding-auction": bidEstimateEngine,
  "above-below-zero": riseFallEngine,
  "build-structure": buildStructureEngine,
}

export function hasEngine(mechanicId: string): boolean {
  return mechanicId in ENGINE_REGISTRY
}

export function generateWithEngine(
  mechanicId: string,
  config: ThemeConfig,
  mathParams: MathParams,
  option?: GameOption
): string | null {
  const engine = ENGINE_REGISTRY[mechanicId]
  if (!engine) return null
  return engine(config, mathParams, option)
}

export function getAvailableEngines(): string[] {
  return Object.keys(ENGINE_REGISTRY)
}

export type { ThemeConfig, MathParams, GameEngine, GameOption, RoundData }
export { DEFAULT_PALETTE } from "./engine-types"
