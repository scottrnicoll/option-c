"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import type { MechanicAnimation } from "@/lib/mechanic-animations"
import { MECHANIC_OPTIONS_MAP } from "@/lib/mechanic-card-options"
import type { GameDesignDoc } from "@/lib/game-types"

interface GameCardBuilderProps {
  mechanic: MechanicAnimation
  standardId: string
  standardDescription: string
  planetId: string
  onBuildGame: (designDoc: GameDesignDoc, summary: string) => void
  onBack: () => void
}

interface SlotState {
  theme: string
  character: string
  action: string
  win: string
}

// One slot: 3 option buttons + "Write your own" — mutually exclusive.
function CardSlot({
  icon,
  label,
  options,
  hint,
  value,
  onChange,
  autoFill,
}: {
  icon: string
  label: string
  options: string[]
  hint: string
  value: string
  onChange: (v: string) => void
  autoFill?: string
}) {
  const [customOpen, setCustomOpen] = useState(false)
  const [customText, setCustomText] = useState("")
  const isCustomValue = value && !options.includes(value)

  if (autoFill) {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{icon}</span>
          <span className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">{label}</span>
          <span className="text-[9px] text-emerald-300/80 uppercase tracking-wide bg-emerald-500/15 px-1.5 py-0.5 rounded font-semibold ml-1">auto</span>
        </div>
        <p className="text-sm text-zinc-200">{autoFill}</p>
      </div>
    )
  }

  // Parse the hint into before/after text around the blank
  // e.g. "The game happens in a ___(place)___" → ["The game happens in a ", "(place)"]
  const hintMatch = hint.match(/^(.+?)___\((.+?)\)___(.*)$/)
  const hintBefore = hintMatch ? hintMatch[1] : ""
  const hintPlaceholder = hintMatch ? hintMatch[2] : "type here"
  const hintAfter = hintMatch ? hintMatch[3] : ""

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${value ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-700 bg-zinc-900"}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-zinc-400 uppercase tracking-wide font-semibold">{label}</span>
        {value && <span className="text-emerald-400 text-xs">✓</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* 3 pre-made option buttons */}
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => { onChange(opt); setCustomOpen(false); setCustomText("") }}
            className={`px-3 py-2 rounded-lg text-sm transition-all border ${
              value === opt && !customOpen
                ? "bg-blue-500/20 border-blue-500/60 text-blue-300 font-semibold"
                : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
            }`}
          >
            {opt}
          </button>
        ))}

        {/* "Write your own" button / mad-lib */}
        {!customOpen ? (
          <button
            onClick={() => {
              setCustomOpen(true)
              onChange("") // deselect any pre-made option
            }}
            className={`px-3 py-2 rounded-lg text-sm transition-all border border-dashed ${
              isCustomValue
                ? "bg-blue-500/20 border-blue-500/60 text-blue-300 font-semibold"
                : "bg-zinc-800/50 border-zinc-600 text-zinc-400 hover:border-zinc-400 hover:text-zinc-200"
            }`}
          >
            {isCustomValue ? `✏️ ${value}` : "✏️ Write your own"}
          </button>
        ) : (
          <div className="w-full mt-1 rounded-lg border-2 border-blue-500/40 bg-blue-500/5 p-3">
            <p className="text-sm text-zinc-300 leading-relaxed">
              {hintBefore}
              <input
                type="text"
                autoFocus
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customText.trim()) {
                    onChange(customText.trim())
                  }
                  if (e.key === "Escape") {
                    setCustomOpen(false)
                    setCustomText("")
                  }
                }}
                placeholder={hintPlaceholder}
                className="inline-block w-48 mx-1 px-2 py-1 rounded border-b-2 border-blue-400 bg-zinc-800 text-blue-300 text-sm font-semibold placeholder:text-zinc-600 focus:outline-none"
              />
              {hintAfter}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  if (customText.trim()) onChange(customText.trim())
                  else { setCustomOpen(false); setCustomText("") }
                }}
                disabled={!customText.trim()}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-30 transition-colors"
              >
                Done
              </button>
              <button
                onClick={() => { setCustomOpen(false); setCustomText("") }}
                className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function GameCardBuilder({
  mechanic,
  standardId,
  standardDescription,
  planetId,
  onBuildGame,
  onBack,
}: GameCardBuilderProps) {
  const [slots, setSlots] = useState<SlotState>({
    theme: "",
    character: "",
    action: "",
    win: "",
  })
  const [building, setBuilding] = useState(false)

  const options = MECHANIC_OPTIONS_MAP.get(mechanic.id)
  const allFilled = slots.theme && slots.character && slots.action && slots.win
  const filledCount = [slots.theme, slots.character, slots.action, slots.win].filter(Boolean).length

  const handleBuild = async () => {
    if (!allFilled) return
    setBuilding(true)
    try {
      const summary = `Game Mechanic: ${mechanic.title} — ${mechanic.mathDomain}
Theme / world: ${slots.theme}
Character: ${slots.character}
Player action: ${slots.action}
Win condition: ${slots.win}
Math concept: ${standardDescription}`

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
      onBuildGame(designDoc, summary)
    } catch {
      // Fallback design doc
      onBuildGame({
        title: `${slots.theme} Game`,
        concept: standardDescription,
        standardId,
        planetId,
        howItWorks: `${slots.character} must ${slots.action} to ${slots.win}`,
        rules: [`You play as ${slots.character}`, `${slots.action}`, `Win by: ${slots.win}`],
        winCondition: slots.win,
        mathRole: options?.mathRole || mechanic.mathDomain,
        designChoices: {},
        visualConcept: [],
      } as GameDesignDoc, "")
    } finally {
      setBuilding(false)
    }
  }

  const update = (field: keyof SlotState) => (value: string) => {
    setSlots(prev => ({ ...prev, [field]: value }))
  }

  if (!options) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p>No card options for this mechanic. Use &quot;I have my own idea&quot; instead.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mechanic header with stick figure */}
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <div className="w-32 h-24 shrink-0 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
          {mechanic.svg}
        </div>
        <div>
          <p className="text-xs text-blue-400 uppercase tracking-wide font-semibold">Game Mechanic</p>
          <h3 className="text-lg font-bold text-white">{mechanic.title}</h3>
          <p className="text-sm text-zinc-400">{mechanic.mathDomain}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-zinc-500">{filledCount}/4 filled</p>
          <div className="flex gap-1 mt-1">
            {[slots.theme, slots.character, slots.action, slots.win].map((v, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${v ? "bg-emerald-500" : "bg-zinc-700"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Giant game card — all 5 slots visible */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
        <CardSlot
          icon="🌍"
          label="Theme"
          options={options.theme.options}
          hint={options.theme.hint}
          value={slots.theme}
          onChange={update("theme")}
        />
        <CardSlot
          icon="🧑"
          label="Character"
          options={options.character.options}
          hint={options.character.hint}
          value={slots.character}
          onChange={update("character")}
        />
        <CardSlot
          icon="🎯"
          label="Player Action"
          options={options.action.options}
          hint={options.action.hint}
          value={slots.action}
          onChange={update("action")}
        />
        <CardSlot
          icon="🏆"
          label="Win Condition"
          options={options.win.options}
          hint={options.win.hint}
          value={slots.win}
          onChange={update("win")}
        />
        <CardSlot
          icon="🧮"
          label="Math Role"
          options={[]}
          hint=""
          value={options.mathRole}
          onChange={() => {}}
          autoFill={options.mathRole}
        />
      </div>

      {/* Build button */}
      <div className="flex gap-2 mt-4 shrink-0">
        <button
          onClick={onBack}
          className="px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-colors"
        >
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
              Preparing...
            </span>
          ) : allFilled ? (
            "Build my game →"
          ) : (
            `Fill all 4 slots to build (${filledCount}/4)`
          )}
        </button>
      </div>
    </div>
  )
}
