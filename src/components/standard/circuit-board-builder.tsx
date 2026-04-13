"use client"

import { useState, useMemo } from "react"
import { Loader2 } from "lucide-react"
import type { MechanicAnimation } from "@/lib/mechanic-animations"
import { matchMechanics } from "@/lib/mechanic-animations"
import { MECHANIC_OPTIONS_MAP } from "@/lib/mechanic-card-options"
import { SPRITE_CHARACTERS, SPRITE_ITEMS, SPRITE_BACKGROUNDS, CHARACTER_CATEGORIES, BACKGROUND_CATEGORIES, ITEM_CATEGORIES } from "@/lib/sprite-library"
import { SpritePicker } from "@/components/sprite-picker"
import { getGameOptions, getOptionDef } from "@/lib/game-engines/game-option-registry"
import { getGameOptionsForStandard } from "@/lib/standard-game-options"
import { getRecommendedItems } from "@/lib/item-recommendations"
import { ConsoleAnimation } from "@/components/game/console-animation"
import type { GameDesignDoc } from "@/lib/game-types"

// The circuit board game builder.
// Replaces the old card builder + mechanic selection.
// Learner drags components into slots on a circuit board visual.

interface CircuitBoardBuilderProps {
  // Moon mode (standard known)
  standardId?: string
  standardDescription?: string
  standardGrade?: string
  standardDomainCode?: string
  planetId?: string
  // Eureka mode (standard unknown — AI will match)
  mode?: "moon" | "eureka"
  learnerGrade?: string
  learnerUid?: string
  // Callbacks
  onBuildGame: (designDoc: GameDesignDoc, summary: string, vibe: string, mechanicId: string) => void
  onBack: () => void
}


interface GameOptionInfo {
  mechanicId: string
  mechanicTitle: string
  mechanicDescription: string
  optionId: string           // game option ID from registry, e.g. "free-collect"
  optionName: string
  optionDescription: string
}

export function CircuitBoardBuilder({
  standardId = "",
  standardDescription = "",
  standardGrade = "",
  standardDomainCode = "",
  planetId = "",
  mode = "moon",
  learnerGrade,
  learnerUid,
  onBuildGame,
  onBack,
}: CircuitBoardBuilderProps) {
  const isEureka = mode === "eureka"

  // Get matching mechanics (used for math role display)
  const mechanics = useMemo(
    () => isEureka ? [] : matchMechanics(standardDescription, standardDomainCode),
    [standardDescription, standardDomainCode, isEureka]
  )

  // Get game options — per-standard hardcoded mapping (most accurate)
  const gameOptions: GameOptionInfo[] = useMemo(() => {
    if (isEureka) return []
    // Try per-standard mapping first (466 moons individually mapped)
    const standardOptions = standardId ? getGameOptionsForStandard(standardId) : null
    if (standardOptions && standardOptions.length > 0) {
      return standardOptions.map(optId => {
        const opt = getOptionDef(optId)
        if (!opt) return null
        return {
          mechanicId: opt.mechanicId,
          mechanicTitle: "",
          mechanicDescription: "",
          optionId: opt.id,
          optionName: opt.name,
          optionDescription: opt.description,
        }
      }).filter(Boolean) as GameOptionInfo[]
    }
    // Fallback: mechanic-based matching
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
  }, [isEureka, standardId, mechanics])

  // Selected components
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [selectedGameOption, setSelectedGameOption] = useState<GameOptionInfo | null>(null)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)
  const [expandedMechanic, setExpandedMechanic] = useState<string | null>(null)

  // Eureka mode state
  const [eurekaIdea, setEurekaIdea] = useState("")
  const [eurekaMatching, setEurekaMatching] = useState(false)
  const [eurekaSuggestions, setEurekaSuggestions] = useState<Array<{ optionId: string; optionName: string; description: string; mechanicId: string; standardId: string; standardDescription: string }>>([])
  const [eurekaStandardId, setEurekaStandardId] = useState("")
  const [eurekaStandardDesc, setEurekaStandardDesc] = useState("")

  const allFilled = selectedBackground && selectedCharacter && selectedGameOption && selectedItem
  const filledCount = [selectedBackground, selectedCharacter, selectedGameOption, selectedItem].filter(Boolean).length

  // Eureka: submit idea to AI for matching
  const handleEurekaMatch = async () => {
    if (!eurekaIdea.trim() || eurekaMatching) return
    setEurekaMatching(true)
    try {
      const res = await fetch("/api/game/eureka-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          background: selectedBackground,
          character: selectedCharacter,
          item: selectedItem,
          gameIdea: eurekaIdea.trim(),
          grade: learnerGrade || "6",
          uid: learnerUid || "",
        }),
      })
      const data = await res.json()
      if (data.match) {
        setSelectedGameOption({
          mechanicId: data.match.mechanicId,
          mechanicTitle: data.match.mechanicTitle || "",
          mechanicDescription: "",
          optionId: data.match.optionId,
          optionName: data.match.optionName,
          optionDescription: data.match.optionDescription,
        })
        setEurekaStandardId(data.match.standardId)
        setEurekaStandardDesc(data.match.standardDescription)
        setEurekaSuggestions([])
      } else if (data.suggestions) {
        setEurekaSuggestions(data.suggestions)
      }
    } catch {}
    setEurekaMatching(false)
  }

  const handlePickEurekaSuggestion = (s: typeof eurekaSuggestions[0]) => {
    setSelectedGameOption({
      mechanicId: s.mechanicId,
      mechanicTitle: "",
      mechanicDescription: "",
      optionId: s.optionId,
      optionName: s.optionName,
      optionDescription: s.description,
    })
    setEurekaStandardId(s.standardId)
    setEurekaStandardDesc(s.standardDescription)
    setEurekaSuggestions([])
  }

  // Game Criteria lights
  const criteriaWellApplied = !!selectedGameOption  // Math Well Applied: game option selected
  const criteriaEssential = !!selectedGameOption  // Math Essential: game option selected (win condition is always "complete 5 rounds")
  const criteriaPlayable = !!selectedBackground && !!selectedCharacter && !!selectedGameOption && !!selectedItem  // Playable: all 4 slots filled

  const handleBuild = async () => {
    if (!allFilled || !selectedGameOption) return
    setBuilding(true)
    try {
      const effectiveStandardId = isEureka ? eurekaStandardId : standardId
      const effectiveStandardDesc = isEureka ? eurekaStandardDesc : standardDescription
      const effectivePlanetId = isEureka ? "" : planetId

      const summary = `Game Option: ${selectedGameOption.optionName}
Mechanic: ${selectedGameOption.mechanicTitle}
Background: ${selectedBackground}
Character: ${selectedCharacter}
Item: ${selectedItem}
Math: ${effectiveStandardDesc}`

      const res = await fetch("/api/game/design-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatHistory: summary,
          standardId: effectiveStandardId,
          standardDescription: effectiveStandardDesc,
          planetId: effectivePlanetId,
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
      <ConsoleAnimation
        hasBackground={!!selectedBackground}
        hasCharacter={!!selectedCharacter}
        hasGameOption={!!selectedGameOption}
        hasItem={!!selectedItem}
        allFilled={!!allFilled}
        onBuildStart={handleBuild}
      >
      {/* Circuit board layout inside console */}
      <div className="space-y-4">
        {/* Math Role — static, already filled */}
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">🧮</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">Math Role</span>
            <span className="text-[9px] text-emerald-300/80 uppercase bg-emerald-500/15 px-1.5 py-0.5 rounded font-semibold">auto</span>
          </div>
          <p className="text-sm text-zinc-200">{isEureka ? (eurekaStandardDesc || "Will be matched from your game idea") : (mechanics[0]?.mathDomain || standardDescription)}</p>
        </div>

        {/* SLOT 1: Background */}
        <SlotSection
          icon="🌍"
          label="Background"
          selected={selectedBackground}
          onClear={() => setSelectedBackground(null)}
        >
          <SpritePicker
            type="backgrounds"
            libraryItems={SPRITE_BACKGROUNDS}
            categories={BACKGROUND_CATEGORIES}
            selected={selectedBackground}
            onSelect={setSelectedBackground}
          />
        </SlotSection>

        {/* SLOT 2: Character */}
        <SlotSection
          icon="🧑"
          label="Character"
          selected={selectedCharacter}
          onClear={() => setSelectedCharacter(null)}
        >
          <SpritePicker
            type="characters"
            libraryItems={SPRITE_CHARACTERS}
            categories={CHARACTER_CATEGORIES}
            selected={selectedCharacter}
            onSelect={setSelectedCharacter}
          />
        </SlotSection>

        {/* In Eureka mode: Items come BEFORE Game Option (learner picks items first, then describes idea) */}
        {isEureka && (
          <SlotSection
            icon="⭐"
            label="Items"
            selected={selectedItem}
            onClear={() => setSelectedItem(null)}
          >
            <SpritePicker
              type="items"
              libraryItems={SPRITE_ITEMS}
              categories={ITEM_CATEGORIES}
              selected={selectedItem}
              onSelect={setSelectedItem}
              recommended={[]}
            />
          </SlotSection>
        )}

        {/* SLOT 3: Game Option */}
        <SlotSection
          icon="🎮"
          label={isEureka ? "What does your character do?" : "Game Option"}
          selected={selectedGameOption ? selectedGameOption.optionName : null}
          onClear={() => { setSelectedGameOption(null); setEurekaSuggestions([]) }}
        >
          {isEureka ? (
            /* EUREKA MODE: write-in + AI match */
            <div className="space-y-3">
              {!selectedGameOption && (
                <>
                  <textarea
                    value={eurekaIdea}
                    onChange={(e) => setEurekaIdea(e.target.value)}
                    placeholder="Describe what happens in your game... Example: The pirate sails between islands collecting treasure, but has to figure out the shortest route"
                    className="w-full h-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none"
                  />
                  <button
                    onClick={handleEurekaMatch}
                    disabled={!eurekaIdea.trim() || eurekaMatching}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white text-sm font-semibold transition-colors"
                  >
                    {eurekaMatching ? "Finding the perfect match..." : "Match my idea!"}
                  </button>
                </>
              )}
              {/* Show suggestions if no direct match */}
              {eurekaSuggestions.length > 0 && !selectedGameOption && (
                <div className="space-y-1.5">
                  <p className="text-xs text-amber-300">Your character could do one of these:</p>
                  {eurekaSuggestions.map((s) => (
                    <button
                      key={s.optionId}
                      onClick={() => handlePickEurekaSuggestion(s)}
                      className="w-full text-left px-3 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:border-emerald-500/50 transition-all"
                    >
                      <span className="text-sm font-semibold text-white">{s.optionName}</span>
                      <p className="text-xs text-zinc-400 mt-0.5">{s.description}</p>
                    </button>
                  ))}
                </div>
              )}
              {/* Show matched standard + game summary */}
              {selectedGameOption && eurekaStandardDesc && (
                <div className="space-y-2">
                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                    <p className="text-xs text-blue-400 uppercase tracking-wide font-semibold mb-1">The math behind this</p>
                    <p className="text-sm text-zinc-200">{eurekaStandardDesc.split(".")[0]}.</p>
                  </div>
                  <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 uppercase tracking-wide font-semibold mb-1">In your game</p>
                    <p className="text-sm text-zinc-300">
                      Your {selectedCharacter || "character"} in {selectedBackground || "the world"} will use{" "}
                      {selectedItem ? selectedItem + "s" : "items"} to {selectedGameOption.optionDescription.toLowerCase()}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* MOON MODE: pick from mechanic options */
            mechanics.length === 0 ? (
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
            )
          )}
        </SlotSection>

        {/* SLOT 4: Items (moon mode only — in Eureka, items are above game option) */}
        {!isEureka && (
          <SlotSection
            icon="⭐"
            label="Items"
            selected={selectedItem}
            onClear={() => setSelectedItem(null)}
          >
            <SpritePicker
              type="items"
              libraryItems={SPRITE_ITEMS}
              categories={ITEM_CATEGORIES}
              selected={selectedItem}
              onSelect={setSelectedItem}
              recommended={[]}
            />
          </SlotSection>
        )}

      </div>

      </ConsoleAnimation>

      <button onClick={onBack} className="mt-3 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        ← Back
      </button>
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

