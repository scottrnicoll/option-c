"use client"

import { useState, useMemo } from "react"
import { Loader2 } from "lucide-react"
import type { MechanicAnimation } from "@/lib/mechanic-animations"
import { matchMechanics } from "@/lib/mechanic-animations"
import { MECHANIC_OPTIONS_MAP } from "@/lib/mechanic-card-options"
import { SPRITE_CHARACTERS, SPRITE_ITEMS, SPRITE_BACKGROUNDS } from "@/lib/sprite-library"
import type { GameDesignDoc } from "@/lib/game-types"

// The circuit board game builder.
// Replaces the old card builder + mechanic selection.
// Learner drags components into slots on a circuit board visual.

interface CircuitBoardBuilderProps {
  standardId: string
  standardDescription: string
  standardGrade: string
  standardDomainCode: string
  planetId: string
  onBuildGame: (designDoc: GameDesignDoc, summary: string, vibe: string, mechanicId: string) => void
  onBack: () => void
}

const BACKGROUNDS = SPRITE_BACKGROUNDS
const CHARACTERS = SPRITE_CHARACTERS
const ITEMS = SPRITE_ITEMS

interface GameOptionInfo {
  mechanicId: string
  mechanicTitle: string
  mechanicDescription: string
  variantKey: "classic" | "variantB" | "variantC"
  optionName: string
  optionDescription: string
}

// Map game options to friendly names and descriptions
const VARIANT_NAMES: Record<string, Record<string, { name: string; desc: string }>> = {
  "resource-management": { classic: { name: "Free Collect", desc: "Click items to hit exact target sum" }, variantB: { name: "Conveyor Belt", desc: "Items scroll past — grab before they disappear" }, variantC: { name: "Split the Loot", desc: "Divide items into 2 bins, each with its own target" } },
  "partitioning": { classic: { name: "Cut the Bar", desc: "Cut a bar into equal parts and shade the fraction" }, variantB: { name: "Pour the Liquid", desc: "Drag slider to pour exactly the right fraction" }, variantC: { name: "Share the Pizza", desc: "Give each plate equal pieces" } },
  "balance-systems": { classic: { name: "Free Balance", desc: "Drag weights to make both sides equal" }, variantB: { name: "Mystery Side", desc: "One side is hidden — figure out its value" }, variantC: { name: "Chain Scales", desc: "Balance 3 connected scales in sequence" } },
  "spatial-puzzles": { classic: { name: "Rotate to Match", desc: "Rotate the shape to match the target" }, variantB: { name: "Tangram Fill", desc: "Pick shapes that add up to the target area" }, variantC: { name: "Mirror Puzzle", desc: "Click where the mirror reflection goes" } },
  "probability-systems": { classic: { name: "Find the Stat", desc: "Identify mode, median, or mean from data" }, variantB: { name: "Bet the Spinner", desc: "Bet on the most likely outcome" }, variantC: { name: "Build the Chart", desc: "Build a histogram matching given stats" } },
  "path-optimization": { classic: { name: "Shortest Route", desc: "Pick the route with the smallest total" }, variantB: { name: "Map Builder", desc: "Draw a path through nodes under a limit" }, variantC: { name: "Delivery Run", desc: "Visit all stops minimizing total distance" } },
  "construction-systems": { classic: { name: "Stack to Target", desc: "Stack blocks to match target height" }, variantB: { name: "Fill the Floor", desc: "Place tiles to cover area exactly" }, variantC: { name: "Box Packer", desc: "Fill a 3D box volume with blocks" } },
  "motion-simulation": { classic: { name: "Launch to Target", desc: "Set speed to hit target distance" }, variantB: { name: "Speed Trap", desc: "Calculate speed from distance and time" }, variantC: { name: "Catch Up", desc: "Set speed to close a gap in time" } },
  "constraint-puzzles": { classic: { name: "Elimination Grid", desc: "Use clues to eliminate wrong answers" }, variantB: { name: "20 Questions", desc: "Ask yes/no questions to find the number" }, variantC: { name: "Logic Chain", desc: "Each clue reveals the next" } },
  "strategy-economy": { classic: { name: "Investment Sim", desc: "Pick multipliers to reach target" }, variantB: { name: "Population Boom", desc: "Grow without overshooting" }, variantC: { name: "Doubling Maze", desc: "Pick multipliers at each fork" } },
  "measurement-challenges": { classic: { name: "Size Picker", desc: "Compare two items, pick bigger" }, variantB: { name: "Ruler Race", desc: "Measure objects and type the length" }, variantC: { name: "Unit Converter", desc: "Convert units to compare" } },
  "scoring-ranking": { classic: { name: "Sorting Lane", desc: "Drag items into ascending order" }, variantB: { name: "Number Line Drop", desc: "Drop numbers onto correct position" }, variantC: { name: "Leaderboard Fix", desc: "Fix errors in a scoreboard" } },
  "timing-rhythm": { classic: { name: "Sequence Builder", desc: "Find the next number in a pattern" }, variantB: { name: "Pattern Machine", desc: "Identify the rule generating a sequence" }, variantC: { name: "Broken Pattern", desc: "Find which number is wrong" } },
  "scaling-resizing": { classic: { name: "Resize Tool", desc: "Resize to match target ratio" }, variantB: { name: "Recipe Scaler", desc: "Scale a recipe to different servings" }, variantC: { name: "Map Distance", desc: "Use map scale to find real distances" } },
  "inventory-crafting": { classic: { name: "Recipe Mixer", desc: "Set amounts to match recipe" }, variantB: { name: "Potion Lab", desc: "Ingredients get multiplied in the cauldron" }, variantC: { name: "Assembly Line", desc: "Grab groups from a conveyor to fill orders" } },
  "terrain-generation": { classic: { name: "Coordinate Hunter", desc: "Click (x,y) to find targets" }, variantB: { name: "Battleship", desc: "Call coordinates to find hidden items" }, variantC: { name: "Treasure Trail", desc: "Follow coordinate clues" } },
  "bidding-auction": { classic: { name: "Auction House", desc: "Estimate value and bid within 20%" }, variantB: { name: "Price is Right", desc: "Guess without going over" }, variantC: { name: "Round It!", desc: "Round to the nearest 10 or 100" } },
  "above-below-zero": { classic: { name: "Depth Navigator", desc: "Move to target on number line" }, variantB: { name: "Temperature Swing", desc: "Stay in the target zone" }, variantC: { name: "Elevator Operator", desc: "Pick up passengers at +/- floors" } },
  "build-structure": { classic: { name: "Shape Matcher", desc: "Pick shapes to match blueprint" }, variantB: { name: "Free Build", desc: "Build with shapes matching target sides" }, variantC: { name: "Shape Decomposer", desc: "Break total area into basic shapes" } },
}

export function CircuitBoardBuilder({
  standardId,
  standardDescription,
  standardGrade,
  standardDomainCode,
  planetId,
  onBuildGame,
  onBack,
}: CircuitBoardBuilderProps) {
  // Get matching mechanics and their game options
  const mechanics = useMemo(
    () => matchMechanics(standardDescription, standardDomainCode),
    [standardDescription, standardDomainCode]
  )

  const gameOptions: GameOptionInfo[] = useMemo(() => {
    const options: GameOptionInfo[] = []
    for (const m of mechanics) {
      const variants = VARIANT_NAMES[m.id]
      if (!variants) continue
      for (const [key, info] of Object.entries(variants)) {
        options.push({
          mechanicId: m.id,
          mechanicTitle: m.title,
          mechanicDescription: m.description,
          variantKey: key as "classic" | "variantB" | "variantC",
          optionName: info.name,
          optionDescription: info.desc,
        })
      }
    }
    return options
  }, [mechanics])

  // Selected components
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [selectedGameOption, setSelectedGameOption] = useState<GameOptionInfo | null>(null)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [winCondition, setWinCondition] = useState("")
  const [building, setBuilding] = useState(false)
  const [expandedMechanic, setExpandedMechanic] = useState<string | null>(mechanics[0]?.id || null)

  const allFilled = selectedBackground && selectedCharacter && selectedGameOption && selectedItem && winCondition.trim()
  const filledCount = [selectedBackground, selectedCharacter, selectedGameOption, selectedItem, winCondition.trim()].filter(Boolean).length

  // Game Criteria lights
  const criteriaWellApplied = !!selectedGameOption  // Math Well Applied: game option selected
  const criteriaEssential = !!selectedGameOption && !!winCondition.trim()  // Math Essential: game option + win condition
  const criteriaPlayable = !!selectedBackground && !!selectedCharacter && !!selectedGameOption && !!selectedItem && !!winCondition.trim()  // Playable: all slots filled

  const handleBuild = async () => {
    if (!allFilled || !selectedGameOption) return
    setBuilding(true)
    try {
      const summary = `Game Option: ${selectedGameOption.optionName}
Mechanic: ${selectedGameOption.mechanicTitle}
Background: ${selectedBackground}
Character: ${selectedCharacter}
Item: ${selectedItem}
Win: ${winCondition || "Complete all rounds"}
Math: ${standardDescription}`

      const res = await fetch("/api/game/design-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatHistory: summary,
          standardId,
          standardDescription,
          planetId,
        }),
      })
      const designDoc = (await res.json()) as GameDesignDoc
      ;(designDoc as any).cardChoices = {
        theme: selectedBackground,
        character: selectedCharacter,
        action: selectedGameOption.optionDescription,
        win: winCondition || "Complete all rounds",
      }
      ;(designDoc as any).sprites = {
        characterSprite: selectedCharacter,
        itemSprite: selectedItem,
        backgroundImage: selectedBackground,
      }
      ;(designDoc as any).gameVariant = selectedGameOption.variantKey

      onBuildGame(designDoc, summary, "default", selectedGameOption.mechanicId)
    } catch {
      // Fallback
    } finally {
      setBuilding(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header with criteria lights */}
      <div className="mb-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Build Your Game</h2>
          <span className="text-xs text-zinc-400">{filledCount}/5</span>
        </div>
        <div className="flex gap-3">
          <CriteriaLight
            lit={criteriaWellApplied}
            label="Math Well Applied"
            icon="🧠"
          />
          <CriteriaLight
            lit={criteriaEssential}
            label="Math Essential"
            icon="💎"
          />
          <CriteriaLight
            lit={criteriaPlayable}
            label="Playable Game"
            icon="🎮"
          />
        </div>
      </div>

      {/* Circuit board layout */}
      <div className="flex-1 space-y-4 min-h-0">
        {/* Math Role — static, already filled */}
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">🧮</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">Math Role</span>
            <span className="text-[9px] text-emerald-300/80 uppercase bg-emerald-500/15 px-1.5 py-0.5 rounded font-semibold">auto</span>
          </div>
          <p className="text-sm text-zinc-200">{mechanics[0]?.mathDomain || standardDescription}</p>
        </div>

        {/* SLOT 1: Background */}
        <SlotSection
          icon="🌍"
          label="Background"
          selected={selectedBackground}
          onClear={() => setSelectedBackground(null)}
        >
          <div className="grid grid-cols-5 gap-2">
            {(BACKGROUNDS.length > 0 ? BACKGROUNDS : [
              { id: "underwater", name: "Underwater" }, { id: "space", name: "Space" },
              { id: "forest", name: "Forest" }, { id: "castle", name: "Castle" },
              { id: "kitchen", name: "Kitchen" }, { id: "cave", name: "Cave" },
              { id: "city", name: "City" }, { id: "volcano", name: "Volcano" },
              { id: "arctic", name: "Arctic" }, { id: "jungle", name: "Jungle" },
            ]).map((bg: any) => (
              <button
                key={bg.id}
                onClick={() => setSelectedBackground(bg.id)}
                className={`p-2 rounded-lg border-2 text-center transition-all ${
                  selectedBackground === bg.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                }`}
              >
                <img src={`/sprites/backgrounds/${bg.id}.svg`} alt={bg.label || bg.name || bg.id} className="w-full h-12 object-cover rounded mb-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <span className="text-[10px] text-zinc-300">{bg.label || bg.name || bg.id}</span>
              </button>
            ))}
          </div>
        </SlotSection>

        {/* SLOT 2: Character */}
        <SlotSection
          icon="🧑"
          label="Character"
          selected={selectedCharacter}
          onClear={() => setSelectedCharacter(null)}
        >
          <div className="grid grid-cols-5 gap-2">
            {(CHARACTERS.length > 0 ? CHARACTERS : [
              { id: "pirate", name: "Pirate" }, { id: "robot", name: "Robot" },
              { id: "astronaut", name: "Astronaut" }, { id: "knight", name: "Knight" },
              { id: "chef", name: "Chef" }, { id: "diver", name: "Diver" },
              { id: "ghost", name: "Ghost" }, { id: "ninja", name: "Ninja" },
              { id: "wizard", name: "Wizard" }, { id: "explorer", name: "Explorer" },
            ]).map((ch: any) => (
              <button
                key={ch.id}
                onClick={() => setSelectedCharacter(ch.id)}
                className={`p-2 rounded-lg border-2 text-center transition-all ${
                  selectedCharacter === ch.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                }`}
              >
                <img src={`/sprites/characters/${ch.id}.svg`} alt={ch.label || ch.name || ch.id} className="w-10 h-10 mx-auto mb-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <span className="text-[10px] text-zinc-300">{ch.label || ch.name || ch.id}</span>
              </button>
            ))}
          </div>
        </SlotSection>

        {/* SLOT 3: Game Option — grouped by mechanic */}
        <SlotSection
          icon="🎮"
          label="Game Option"
          selected={selectedGameOption ? selectedGameOption.optionName : null}
          onClear={() => setSelectedGameOption(null)}
        >
          {mechanics.length === 0 ? (
            <p className="text-sm text-zinc-500">No game options available for this standard.</p>
          ) : (
            <div className="space-y-3">
              {mechanics.map((m) => {
                const variants = VARIANT_NAMES[m.id]
                if (!variants) return null
                const isExpanded = expandedMechanic === m.id
                return (
                  <div key={m.id} className="rounded-lg border border-zinc-700 overflow-hidden">
                    <button
                      onClick={() => setExpandedMechanic(isExpanded ? null : m.id)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="text-left">
                        <span className="text-sm font-semibold text-zinc-200">{m.title}</span>
                        <span className="text-xs text-zinc-500 ml-2">{m.description}</span>
                      </div>
                      <svg className={`size-4 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div className="p-2 space-y-1.5 bg-zinc-900/50">
                        {Object.entries(variants).map(([key, info]) => {
                          const isSelected = selectedGameOption?.mechanicId === m.id && selectedGameOption?.variantKey === key
                          return (
                            <button
                              key={key}
                              onClick={() => setSelectedGameOption({
                                mechanicId: m.id, mechanicTitle: m.title, mechanicDescription: m.description,
                                variantKey: key as any, optionName: info.name, optionDescription: info.desc,
                              })}
                              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all border-2 ${
                                isSelected
                                  ? "border-emerald-500/60 bg-emerald-500/10"
                                  : "border-transparent hover:bg-zinc-800"
                              }`}
                            >
                              <span className={`text-sm font-semibold ${isSelected ? "text-emerald-300" : "text-white"}`}>{info.name}</span>
                              <p className="text-xs text-zinc-400 mt-0.5">{info.desc}</p>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </SlotSection>

        {/* SLOT 4: Items */}
        <SlotSection
          icon="⭐"
          label="Items"
          selected={selectedItem}
          onClear={() => setSelectedItem(null)}
        >
          <div className="grid grid-cols-5 gap-2">
            {(ITEMS.length > 0 ? ITEMS : [
              { id: "coin", name: "Coin" }, { id: "gem", name: "Gem" },
              { id: "treasure-chest", name: "Chest" }, { id: "crystal", name: "Crystal" },
              { id: "potion", name: "Potion" }, { id: "fruit", name: "Fruit" },
              { id: "star", name: "Star" }, { id: "shell", name: "Shell" },
              { id: "mushroom", name: "Mushroom" }, { id: "key", name: "Key" },
            ]).map((item: any) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item.id)}
                className={`p-2 rounded-lg border-2 text-center transition-all ${
                  selectedItem === item.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                }`}
              >
                <img src={`/sprites/items/${item.id}.svg`} alt={item.label || item.name || item.id} className="w-8 h-8 mx-auto mb-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <span className="text-[10px] text-zinc-300">{item.label || item.name || item.id}</span>
              </button>
            ))}
          </div>
        </SlotSection>

        {/* Win Condition — required */}
        <div className={`rounded-xl border-2 transition-all p-3 ${winCondition.trim() ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-700 bg-zinc-900"}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🏆</span>
            <span className="text-xs text-zinc-400 uppercase tracking-wide font-semibold">Win Condition</span>
            {winCondition.trim() && <span className="text-emerald-400 text-xs">✓</span>}
          </div>
          <input
            type="text"
            value={winCondition}
            onChange={(e) => setWinCondition(e.target.value)}
            placeholder="e.g. Complete 5 rounds before time runs out"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      {/* Build button */}
      <div className="flex gap-2 mt-4 shrink-0">
        <button onClick={onBack} className="px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-colors">
          ← Back
        </button>
        <button
          onClick={handleBuild}
          disabled={!allFilled || building}
          className="flex-1 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
        >
          {building ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Building...
            </span>
          ) : allFilled ? (
            "Build my game →"
          ) : (
            `Select all components (${filledCount}/5)`
          )}
        </button>
      </div>
    </div>
  )
}

function SlotSection({
  icon, label, selected, onClear, children,
}: {
  icon: string; label: string; selected: string | null; onClear: () => void; children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(!selected)

  return (
    <div className={`rounded-xl border-2 transition-all ${selected ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-700 bg-zinc-900"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="text-xs text-zinc-400 uppercase tracking-wide font-semibold">{label}</span>
          {selected && <span className="text-emerald-400 text-xs">✓ {selected}</span>}
        </div>
        <div className="flex items-center gap-2">
          {selected && (
            <button onClick={(e) => { e.stopPropagation(); onClear(); setExpanded(true); }} className="text-xs text-zinc-500 hover:text-zinc-300">Change</button>
          )}
          <svg className={`size-4 text-zinc-500 transition-transform ${expanded ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
      {expanded && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}

function CriteriaLight({ lit, label, icon }: { lit: boolean; label: string; icon: string }) {
  return (
    <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
      lit
        ? "border-emerald-500/40 bg-emerald-500/10"
        : "border-zinc-800 bg-zinc-900/50"
    }`}>
      <div className={`w-3 h-3 rounded-full transition-all ${
        lit ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-zinc-700"
      }`} />
      <span className="text-sm">{icon}</span>
      <span className={`text-[10px] font-semibold uppercase tracking-wide ${lit ? "text-emerald-300" : "text-zinc-600"}`}>
        {label}
      </span>
    </div>
  )
}
