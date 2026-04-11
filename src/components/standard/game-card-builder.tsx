"use client"

import { useState, useCallback } from "react"
import { Loader2, Check, Circle } from "lucide-react"
import type { MechanicAnimation } from "@/lib/mechanic-animations"
import { MECHANIC_OPTIONS_MAP } from "@/lib/mechanic-card-options"
import type { GameDesignDoc } from "@/lib/game-types"
import { ArtworkPicker } from "@/components/game/artwork-picker"

type Vibe = "kawaii" | "stickman" | "c64"

const VIBE_OPTIONS: { id: Vibe; label: string; desc: string }[] = [
  { id: "kawaii", label: "🎀 Cute", desc: "Soft pastels, chubby characters" },
  { id: "stickman", label: "✏️ Stick Man", desc: "Hand-drawn notebook style" },
  { id: "c64", label: "👾 Retro", desc: "Blocky pixel art, classic game feel" },
]

interface GameCardBuilderProps {
  mechanic: MechanicAnimation
  standardId: string
  standardDescription: string
  planetId: string
  onBuildGame: (designDoc: GameDesignDoc, summary: string, vibe: string) => void
  onBack: () => void
}

interface SlotValue {
  raw: string       // what the learner picked
  enhanced: string   // AI-enhanced version
}

// Generic win patterns (used as initial options before AI generates themed ones)
const GENERIC_WIN_OPTIONS = [
  "Complete 5 rounds — each one harder than the last",
  "Finish everything before a 60-second timer runs out",
  "Get a perfect score with zero mistakes",
]

// Generic character options (used when theme is custom/"Write your own")
const GENERIC_CHARACTERS = ["explorer", "robot", "wizard"]

export function GameCardBuilder({
  mechanic,
  standardId,
  standardDescription,
  planetId,
  onBuildGame,
  onBack,
}: GameCardBuilderProps) {
  const [theme, setTheme] = useState<SlotValue | null>(null)
  const [character, setCharacter] = useState<SlotValue | null>(null)
  const [action, setAction] = useState<SlotValue | null>(null)
  const [win, setWin] = useState<SlotValue | null>(null)
  const [vibe, setVibe] = useState<Vibe | "">("")
  const [summary, setSummary] = useState("")
  const [enhancing, setEnhancing] = useState(false)
  const [building, setBuilding] = useState(false)
  const [showArtwork, setShowArtwork] = useState(false)
  const [sprites, setSprites] = useState<{ characterSprite?: string; itemSprite?: string; backgroundImage?: string }>({})

  // AI-generated options for the next slot
  const [charOptions, setCharOptions] = useState<string[]>([])
  const [actionOptions, setActionOptions] = useState<string[]>([])
  const [winOptions, setWinOptions] = useState<string[]>([])

  // Custom input state per slot
  const [customOpen, setCustomOpen] = useState<string | null>(null)
  const [customText, setCustomText] = useState("")

  const options = MECHANIC_OPTIONS_MAP.get(mechanic.id)
  const allFilled = theme && character && action && win && vibe
  const filledCount = [theme, character, action, win, vibe].filter(Boolean).length

  // Call the AI to enhance a slot and get next options
  const enhance = useCallback(async (
    slot: "theme" | "character" | "action" | "win",
    picked: string,
  ) => {
    setEnhancing(true)
    try {
      const res = await fetch("/api/game/card-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mechanic: `${mechanic.title} — ${mechanic.mathDomain}`,
          mathSkill: standardDescription,
          slot,
          picked,
          theme: slot !== "theme" ? theme?.raw : picked,
          character: slot !== "character" ? character?.raw : (slot === "character" ? picked : undefined),
          action: slot !== "action" ? action?.raw : (slot === "action" ? picked : undefined),
        }),
      })
      const data = await res.json()
      return data as { enhanced: string; summary: string; nextOptions: string[] }
    } catch {
      return { enhanced: picked, summary: "", nextOptions: [] }
    } finally {
      setEnhancing(false)
    }
  }, [mechanic, standardDescription, theme, character, action])

  const pickTheme = async (value: string) => {
    const result = await enhance("theme", value)
    setTheme({ raw: value, enhanced: result.enhanced })
    setSummary(result.summary)
    setCharOptions(result.nextOptions.length > 0 ? result.nextOptions : GENERIC_CHARACTERS)
    // Reset downstream
    setCharacter(null)
    setAction(null)
    setWin(null)
    setActionOptions([])
    setWinOptions([])
  }

  const pickCharacter = async (value: string) => {
    const result = await enhance("character", value)
    setCharacter({ raw: value, enhanced: result.enhanced })
    setSummary(result.summary)
    setActionOptions(result.nextOptions.length > 0 ? result.nextOptions : (options?.action.options || []))
    // Reset downstream
    setAction(null)
    setWin(null)
    setWinOptions([])
  }

  const pickAction = async (value: string) => {
    const result = await enhance("action", value)
    setAction({ raw: value, enhanced: result.enhanced })
    setSummary(result.summary)
    setWinOptions(result.nextOptions.length > 0 ? result.nextOptions : GENERIC_WIN_OPTIONS)
    setWin(null)
  }

  const pickWin = async (value: string) => {
    const result = await enhance("win", value)
    setWin({ raw: value, enhanced: result.enhanced })
    setSummary(result.summary)
  }

  const handleBuild = useCallback(async (selectedSprites?: typeof sprites) => {
    if (!allFilled || !theme || !character || !action || !win) return
    setBuilding(true)
    try {
      const gameSummary = `Game Mechanic: ${mechanic.title} — ${mechanic.mathDomain}
Theme: ${theme.enhanced}
Character: ${character.enhanced}
Player action: ${action.enhanced}
Win condition: ${win.enhanced}
Math skill: ${standardDescription}`

      const res = await fetch("/api/game/design-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatHistory: gameSummary,
          standardId,
          standardDescription,
          planetId,
        }),
      })
      const designDoc = (await res.json()) as GameDesignDoc
      // Attach raw card choices for theme config generation
      ;(designDoc as any).cardChoices = { theme: theme?.enhanced, character: character?.enhanced, action: action?.enhanced, win: win?.enhanced }
      // Attach sprite selections if provided
      const spritesToUse = selectedSprites ?? sprites
      if (spritesToUse && Object.keys(spritesToUse).length > 0) {
        ;(designDoc as any).sprites = spritesToUse
      }
      onBuildGame(designDoc, gameSummary, vibe)
    } catch {
      onBuildGame({
        title: "My Game",
        concept: standardDescription,
        standardId,
        planetId,
        howItWorks: `${character.enhanced} must ${action.enhanced} to ${win.enhanced}`,
        rules: [],
        winCondition: win.enhanced,
        mathRole: options?.mathRole || mechanic.mathDomain,
        designChoices: {},
        visualConcept: [],
      } as GameDesignDoc, "", vibe)
    } finally {
      setBuilding(false)
    }
  }, [allFilled, theme, character, action, win, mechanic, standardDescription, standardId, planetId, sprites, vibe, onBuildGame, options])

  if (!options) {
    return <div className="text-center py-12 text-zinc-500"><p>No options for this mechanic.</p></div>
  }

  // Artwork step — shown after all slots + vibe are filled, before building
  if (showArtwork) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <ArtworkPicker
          onSelect={(selected) => {
            setSprites(selected)
            setShowArtwork(false)
            handleBuild(selected)
          }}
          onSkip={() => {
            setShowArtwork(false)
            handleBuild({})
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mechanic header */}
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <div className="w-28 h-20 shrink-0 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
          {mechanic.svg}
        </div>
        <div className="flex-1">
          <p className="text-xs text-blue-400 uppercase tracking-wide font-semibold">Game Mechanic</p>
          <h3 className="text-lg font-bold text-white">{mechanic.title}</h3>
          <p className="text-sm text-zinc-400">{mechanic.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-zinc-500">{filledCount}/5</p>
          <div className="flex gap-1 mt-1">
            {[theme, character, action, win, vibe].map((v, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${v ? "bg-emerald-500" : "bg-zinc-700"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Criteria badges next to mechanic */}
      <div className="flex gap-3 mb-4 shrink-0">
        <CriteriaBadge icon="🧠" name="Math Well Applied" met={!!theme} showNext="Game Mechanic" />
        <CriteriaBadge icon="💎" name="Math Essential" met={!!action} showNext="Player Action" />
        <CriteriaBadge icon="🎮" name="Playable Game" met={!!(theme && character && action && win)} showNext="Win Condition" />
      </div>

      {/* Slots — cascading */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
        {/* THEME — always visible */}
        <SlotPicker
          icon="🌍"
          label="Theme"
          options={options.theme.options}
          hint={options.theme.hint}
          value={theme}
          onPick={pickTheme}
          disabled={enhancing}
          customOpen={customOpen === "theme"}
          onCustomOpen={() => { setCustomOpen("theme"); setCustomText("") }}
          onCustomClose={() => setCustomOpen(null)}
          customText={customText}
          onCustomTextChange={setCustomText}
        />

        {/* CHARACTER — visible after theme */}
        {theme && (
          <SlotPicker
            icon="🧑"
            label="Character"
            options={charOptions.length > 0 ? charOptions : options.character.options}
            hint={options.character.hint}
            value={character}
            onPick={pickCharacter}
            disabled={enhancing}
            customOpen={customOpen === "character"}
            onCustomOpen={() => { setCustomOpen("character"); setCustomText("") }}
            onCustomClose={() => setCustomOpen(null)}
            customText={customText}
            onCustomTextChange={setCustomText}
          />
        )}

        {/* ACTION — visible after character */}
        {character && (
          <SlotPicker
            icon="🎯"
            label="Player Action"
            options={actionOptions.length > 0 ? actionOptions : options.action.options}
            hint={options.action.hint}
            value={action}
            onPick={pickAction}
            disabled={enhancing}
            customOpen={customOpen === "action"}
            onCustomOpen={() => { setCustomOpen("action"); setCustomText("") }}
            onCustomClose={() => setCustomOpen(null)}
            customText={customText}
            onCustomTextChange={setCustomText}
          />
        )}

        {/* WIN — visible after action */}
        {action && (
          <SlotPicker
            icon="🏆"
            label="Win Condition"
            options={winOptions.length > 0 ? winOptions : GENERIC_WIN_OPTIONS}
            hint="You win by ___(doing what?)___"
            value={win}
            onPick={pickWin}
            disabled={enhancing}
            customOpen={customOpen === "win"}
            onCustomOpen={() => { setCustomOpen("win"); setCustomText("") }}
            onCustomClose={() => setCustomOpen(null)}
            customText={customText}
            onCustomTextChange={setCustomText}
          />
        )}

        {/* MATH ROLE — auto */}
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🧮</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">Math Role</span>
            <span className="text-[9px] text-emerald-300/80 uppercase tracking-wide bg-emerald-500/15 px-1.5 py-0.5 rounded font-semibold ml-1">auto</span>
          </div>
          <p className="text-sm text-zinc-200">{options.mathRole}</p>
        </div>

        {/* VIBE — visible after win */}
        {win && (
          <div className={`rounded-xl border-2 p-4 transition-all ${vibe ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-700 bg-zinc-900"}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎨</span>
              <span className="text-xs text-zinc-400 uppercase tracking-wide font-semibold">Game Style</span>
              {vibe && <span className="text-emerald-400 text-xs">✓</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {VIBE_OPTIONS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVibe(v.id)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all border ${
                    vibe === v.id
                      ? "bg-blue-500/20 border-blue-500/60 text-blue-300 font-semibold"
                      : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
                  }`}
                >
                  <span className="block">{v.label}</span>
                  <span className="block text-[10px] text-zinc-500 mt-0.5">{v.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary sentence — builds progressively */}
      {summary && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 shrink-0">
          <p className="text-sm text-zinc-300 italic leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Loading indicator */}
      {enhancing && (
        <div className="mt-2 flex items-center gap-2 text-xs text-blue-400 shrink-0">
          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Adapting your choices...
        </div>
      )}

      {/* Build button */}
      <div className="flex gap-2 mt-3 shrink-0">
        <button
          onClick={onBack}
          className="px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => setShowArtwork(true)}
          disabled={!allFilled || building || enhancing}
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
            `Fill all slots to build (${filledCount}/5)`
          )}
        </button>
      </div>
    </div>
  )
}

function CriteriaBadge({ icon, name, met, showNext }: { icon: string; name: string; met: boolean; showNext: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
      met ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400" : "bg-zinc-900 border border-zinc-800 text-zinc-500"
    }`}>
      {met ? <Check className="size-3" /> : <Circle className="size-3" />}
      <span>{icon}</span>
      <span className="font-semibold">{name}</span>
    </div>
  )
}

function SlotPicker({
  icon, label, options, hint, value, onPick, disabled,
  customOpen, onCustomOpen, onCustomClose, customText, onCustomTextChange,
}: {
  icon: string
  label: string
  options: string[]
  hint: string
  value: SlotValue | null
  onPick: (v: string) => void
  disabled: boolean
  customOpen: boolean
  onCustomOpen: () => void
  onCustomClose: () => void
  customText: string
  onCustomTextChange: (v: string) => void
}) {
  const hintMatch = hint.match(/^(.+?)___\((.+?)\)___(.*)$/)
  const hintBefore = hintMatch ? hintMatch[1] : ""
  const hintPlaceholder = hintMatch ? hintMatch[2] : "type here"
  const hintAfter = hintMatch ? hintMatch[3] : ""

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${
      value ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-700 bg-zinc-900"
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-zinc-400 uppercase tracking-wide font-semibold">{label}</span>
        {value && <span className="text-emerald-400 text-xs">✓</span>}
      </div>

      {/* Show enhanced value if picked */}
      {value && (
        <p className="text-sm text-emerald-300 font-medium mb-2 animate-fade-in">{value.enhanced}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => { if (!disabled) onPick(opt) }}
            disabled={disabled}
            className={`px-3 py-2 rounded-lg text-sm transition-all border disabled:opacity-50 ${
              value?.raw === opt
                ? "bg-blue-500/20 border-blue-500/60 text-blue-300 font-semibold"
                : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
            }`}
          >
            {opt}
          </button>
        ))}

        {!customOpen ? (
          <button
            onClick={onCustomOpen}
            disabled={disabled}
            className="px-3 py-2 rounded-lg text-sm transition-all border border-dashed bg-zinc-800/50 border-zinc-600 text-zinc-400 hover:border-zinc-400 hover:text-zinc-200 disabled:opacity-50"
          >
            ✏️ Write your own
          </button>
        ) : (
          <div className="w-full mt-1 rounded-lg border-2 border-blue-500/40 bg-blue-500/5 p-3">
            <p className="text-sm text-zinc-300 leading-relaxed">
              {hintBefore}
              <input
                type="text"
                autoFocus
                value={customText}
                onChange={(e) => onCustomTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customText.trim()) { onPick(customText.trim()); onCustomClose() }
                  if (e.key === "Escape") onCustomClose()
                }}
                placeholder={hintPlaceholder}
                className="inline-block w-48 mx-1 px-2 py-1 rounded border-b-2 border-blue-400 bg-zinc-800 text-blue-300 text-sm font-semibold placeholder:text-zinc-600 focus:outline-none"
              />
              {hintAfter}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { if (customText.trim()) { onPick(customText.trim()); onCustomClose() } }}
                disabled={!customText.trim()}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-30 transition-colors"
              >
                Done
              </button>
              <button onClick={onCustomClose} className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
