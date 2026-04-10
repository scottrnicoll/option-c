"use client"

import { Check, Circle } from "lucide-react"

// Shared split-screen layout for the game builder.
// Left: AI chat (children). Right: criteria (top) + game card (bottom).

interface GameBuilderLayoutProps {
  children: React.ReactNode // the chat UI goes here
  criteria: {
    playable: boolean
    authentic: boolean
    essential: boolean
  }
  criteriaReasons?: {
    playable?: string
    authentic?: string
    essential?: string
  }
  preChecked?: ("playable" | "authentic" | "essential")[]
  gameCard?: {
    theme?: string
    action?: string
    win?: string
    mathRole?: string
    character?: string
  }
}

const CRITERIA_INFO: Array<{
  key: "playable" | "authentic" | "essential"
  icon: string
  name: string
  description: string
}> = [
  {
    key: "playable",
    icon: "🎮",
    name: "Playable",
    description: "Could a kid play this in a browser? Are the rules clear and the game finishable?",
  },
  {
    key: "authentic",
    icon: "🧠",
    name: "Authentic",
    description: "Does the math show up in a real way — not just decorating the game?",
  },
  {
    key: "essential",
    icon: "💎",
    name: "Essential",
    description: "Is math the core of the game? Remove it and the game breaks.",
  },
]

export function GameBuilderLayout({
  children,
  criteria,
  criteriaReasons,
  preChecked,
  gameCard,
}: GameBuilderLayoutProps) {
  const preSet = new Set(preChecked ?? [])
  const metCount = [criteria.playable, criteria.authentic, criteria.essential].filter(Boolean).length

  return (
    <div className="flex gap-4 flex-1 min-h-0">
      {/* Left: chat */}
      <div className="flex-1 min-w-0 flex flex-col">
        {children}
      </div>

      {/* Right: criteria + game card */}
      <div className="w-80 shrink-0 flex flex-col gap-3 overflow-y-auto">
        {/* Criteria */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">Criteria</p>
            <p className="text-xs text-zinc-400">{metCount}/3 passed</p>
          </div>
          {CRITERIA_INFO.map(({ key, icon, name, description }) => {
            const met = criteria[key]
            const isPre = preSet.has(key)
            const reason = criteriaReasons?.[key]
            return (
              <div
                key={key}
                className={`rounded-lg border p-2.5 transition-all duration-500 ${
                  met
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-zinc-800 bg-zinc-950/50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {met ? (
                      <Check className="size-4 text-emerald-400" />
                    ) : (
                      <Circle className="size-4 text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{icon}</span>
                      <span className={`text-xs font-semibold ${met ? "text-emerald-400" : "text-zinc-400"}`}>
                        {name}
                      </span>
                      {isPre && (
                        <span className="text-[9px] text-emerald-300/70 uppercase tracking-wide bg-emerald-500/10 px-1 rounded">
                          auto
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{description}</p>
                    {met && reason && (
                      <p className="text-[11px] text-emerald-300/80 mt-1 leading-snug italic">{reason}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Game card — fills in as conversation progresses */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex-1">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-2.5">Game Card</p>
          <div className="space-y-2">
            <GameCardSlot label="Character" value={gameCard?.character} icon="🧑" />
            <GameCardSlot label="Theme" value={gameCard?.theme} icon="🎨" />
            <GameCardSlot label="Action" value={gameCard?.action} icon="🛠️" />
            <GameCardSlot label="How you win" value={gameCard?.win} icon="🎯" />
            <GameCardSlot label="How math fits" value={gameCard?.mathRole} icon="🧮" />
          </div>
        </div>
      </div>
    </div>
  )
}

function GameCardSlot({ label, value, icon }: { label: string; value?: string; icon: string }) {
  return (
    <div className={`rounded-lg p-2 transition-all duration-300 ${value ? "bg-zinc-800/60" : "bg-zinc-950/30 border border-dashed border-zinc-800"}`}>
      <div className="flex items-start gap-2">
        <span className="text-sm leading-tight">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</p>
          {value ? (
            <p className="text-xs text-zinc-200 mt-0.5 leading-snug">{value}</p>
          ) : (
            <p className="text-[11px] text-zinc-600 mt-0.5 italic">Waiting...</p>
          )}
        </div>
      </div>
    </div>
  )
}
