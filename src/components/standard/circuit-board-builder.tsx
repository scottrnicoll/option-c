"use client"

import { useState, useMemo } from "react"
import { Loader2 } from "lucide-react"
import type { MechanicAnimation } from "@/lib/mechanic-animations"
import { matchMechanics } from "@/lib/mechanic-animations"
import { MECHANIC_OPTIONS_MAP } from "@/lib/mechanic-card-options"
import { SPRITE_CHARACTERS, SPRITE_ITEMS, SPRITE_BACKGROUNDS } from "@/lib/sprite-library"
import { getGameOptions } from "@/lib/game-engines/game-option-registry"
import { getRecommendedItems } from "@/lib/item-recommendations"
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
  optionId: string           // game option ID from registry, e.g. "free-collect"
  optionName: string
  optionDescription: string
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
      const regOptions = getGameOptions(m.id)
      for (const opt of regOptions) {
        options.push({
          mechanicId: m.id,
          mechanicTitle: m.title,
          mechanicDescription: m.description,
          optionId: opt.id,
          optionName: opt.name,
          optionDescription: opt.description,
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
  const [building, setBuilding] = useState(false)
  const [expandedMechanic, setExpandedMechanic] = useState<string | null>(mechanics[0]?.id || null)

  const allFilled = selectedBackground && selectedCharacter && selectedGameOption && selectedItem
  const filledCount = [selectedBackground, selectedCharacter, selectedGameOption, selectedItem].filter(Boolean).length

  // Game Criteria lights
  const criteriaWellApplied = !!selectedGameOption  // Math Well Applied: game option selected
  const criteriaEssential = !!selectedGameOption  // Math Essential: game option selected (win condition is always "complete 5 rounds")
  const criteriaPlayable = !!selectedBackground && !!selectedCharacter && !!selectedGameOption && !!selectedItem  // Playable: all 4 slots filled

  const handleBuild = async () => {
    if (!allFilled || !selectedGameOption) return
    setBuilding(true)
    try {
      const summary = `Game Option: ${selectedGameOption.optionName}
Mechanic: ${selectedGameOption.mechanicTitle}
Background: ${selectedBackground}
Character: ${selectedCharacter}
Item: ${selectedItem}
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
        win: "Complete all 5 rounds",
      }
      ;(designDoc as any).sprites = {
        characterSprite: selectedCharacter,
        itemSprite: selectedItem,
        backgroundImage: selectedBackground,
      }
      ;(designDoc as any).gameOption = selectedGameOption.optionId

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
          <h2 className="text-lg font-bold text-white">Game Assembler</h2>
          <span className="text-xs text-zinc-400">{filledCount}/4</span>
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
                const regOptions = getGameOptions(m.id)
                if (regOptions.length === 0) return null
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
                        {regOptions.map((opt) => {
                          const isSelected = selectedGameOption?.optionId === opt.id
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setSelectedGameOption({
                                mechanicId: m.id, mechanicTitle: m.title, mechanicDescription: m.description,
                                optionId: opt.id, optionName: opt.name, optionDescription: opt.description,
                              })}
                              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all border-2 ${
                                isSelected
                                  ? "border-emerald-500/60 bg-emerald-500/10"
                                  : "border-transparent hover:bg-zinc-800"
                              }`}
                            >
                              <span className={`text-sm font-semibold ${isSelected ? "text-emerald-300" : "text-white"}`}>{opt.name}</span>
                              <p className="text-xs text-zinc-400 mt-0.5">{opt.description}</p>
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
          <ItemGrid
            items={ITEMS.length > 0 ? [...ITEMS] : [
              { id: "coin", label: "Coin" }, { id: "gem", label: "Gem" },
              { id: "treasure-chest", label: "Chest" }, { id: "crystal", label: "Crystal" },
              { id: "potion", label: "Potion" }, { id: "fruit", label: "Fruit" },
              { id: "star", label: "Star" }, { id: "shell", label: "Shell" },
              { id: "mushroom", label: "Mushroom" }, { id: "key", label: "Key" },
            ]}
            recommended={selectedGameOption ? getRecommendedItems(selectedGameOption.mechanicId) : []}
            selected={selectedItem}
            onSelect={setSelectedItem}
          />
        </SlotSection>

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
            `Select all components (${filledCount}/4)`
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

function ItemGrid({ items, recommended, selected, onSelect }: {
  items: Array<{ id: string; label?: string; name?: string }>
  recommended: string[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  // Sort: recommended items first, then the rest
  const sorted = [...items].sort((a, b) => {
    const aRec = recommended.includes(a.id) ? 0 : 1
    const bRec = recommended.includes(b.id) ? 0 : 1
    return aRec - bRec
  })

  return (
    <div>
      {recommended.length > 0 && (
        <p className="text-[10px] text-emerald-400/70 mb-1.5">Recommended for this game option:</p>
      )}
      <div className="grid grid-cols-5 gap-2">
        {sorted.map((item) => {
          const isRec = recommended.includes(item.id)
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`p-2 rounded-lg border-2 text-center transition-all ${
                selected === item.id
                  ? "border-blue-500 bg-blue-500/10"
                  : isRec
                    ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
              }`}
            >
              <img src={`/sprites/items/${item.id}.svg`} alt={item.label || item.name || item.id} className="w-8 h-8 mx-auto mb-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <span className="text-[10px] text-zinc-300">{item.label || item.name || item.id}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
