// Shared types for all pre-built game engines.

export interface ThemeConfig {
  title: string           // game title (learner-chosen)
  character: string       // who you play as
  itemName: string        // what you interact with (e.g. "cursed bricks", "gems")
  targetName: string      // what you're building/filling/matching (e.g. "tower", "potion")
  worldName: string       // the setting (e.g. "haunted castle")
  colors: {
    bg: string            // background color
    primary: string       // main interactive element color
    secondary: string     // secondary element color
    accent: string        // highlights, score, success
    danger: string        // wrong/failure color
    text: string          // text color
  }
  vibe: "kawaii" | "stickman" | "c64"
  winMessage: string      // shown on victory
  loseMessage: string     // shown on defeat
  dare?: string           // optional dare from the learner
  // Sprite overrides (Phase 1: Phaser engines)
  characterSprite?: string   // sprite library ID or upload URL
  itemSprite?: string        // sprite library ID or upload URL
  backgroundImage?: string   // sprite library ID or upload URL
}

// What the AI generates from the card builder choices
export interface ThemeConfigRequest {
  mechanic: string
  theme: string
  character: string
  action: string
  winCondition: string
  mathSkill: string
  vibe: "kawaii" | "stickman" | "c64"
  title: string
  dare?: string
}

// Game variants — each engine supports 3 modes
export type GameVariant = "classic" | "timed" | "challenge"

// Each engine exports this function signature
export type GameEngine = (config: ThemeConfig, mathParams: MathParams, variant?: GameVariant) => string

// Math parameters — what numbers/difficulty to use
export interface MathParams {
  grade: string           // K, 1, 2, ... 8, HS
  standardId: string      // e.g. "6.EE.B.7"
  standardDescription: string
  difficulty: "easy" | "medium" | "hard"
}

// Color palettes per vibe
export const VIBE_PALETTES: Record<string, ThemeConfig["colors"]> = {
  kawaii: {
    bg: "#fff1f2",
    primary: "#f9a8d4",
    secondary: "#c4b5fd",
    accent: "#fbbf24",
    danger: "#f87171",
    text: "#6b21a8",
  },
  stickman: {
    bg: "#18181b",
    primary: "#60a5fa",
    secondary: "#e4e4e7",
    accent: "#fbbf24",
    danger: "#ef4444",
    text: "#e4e4e7",
  },
  c64: {
    bg: "#4040E0",
    primary: "#FFFFFF",
    secondary: "#FFFF99",
    accent: "#88FF88",
    danger: "#FF7777",
    text: "#FFFFFF",
  },
}
