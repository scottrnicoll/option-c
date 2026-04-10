"use client"

import { Check, Circle } from "lucide-react"

// 3-column layout for the game builder.
// Left (wide): AI chat. Middle: 3 criteria. Right: game card.
// Everything fits on one screen without scrolling.

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
    description: "Could a kid play this in a browser? Clear rules, clear win condition.",
  },
  {
    key: "authentic",
    icon: "🧠",
    name: "Authentic",
    description: "The math shows up in a real way — not just decorating the game.",
  },
  {
    key: "essential",
    icon: "💎",
    name: "Essential",
    description: "Math is the core. Remove it and the game breaks.",
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
    <div className="flex gap-3 h-full">
      {/* Left: chat (takes most space) */}
      <div className="flex-1 min-w-0 flex flex-col">
        {children}
      </div>

      {/* Middle: criteria (narrow) */}
      <div className="w-56 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wide">Criteria</p>
          <p className="text-[10px] text-zinc-400">{metCount}/3</p>
        </div>
        {CRITERIA_INFO.map(({ key, icon, name, description }) => {
          const met = criteria[key]
          const isPre = preSet.has(key)
          const reason = criteriaReasons?.[key]
          return (
            <div
              key={key}
              className={`rounded-lg border p-2 transition-all duration-500 ${
                met
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-zinc-800 bg-zinc-950/50"
              }`}
            >
              <div className="flex items-start gap-1.5">
                <div className="mt-0.5">
                  {met ? (
                    <Check className="size-3.5 text-emerald-400" />
                  ) : (
                    <Circle className="size-3.5 text-zinc-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{icon}</span>
                    <span className={`text-[11px] font-semibold ${met ? "text-emerald-400" : "text-zinc-400"}`}>
                      {name}
                    </span>
                    {isPre && (
                      <span className="text-[8px] text-emerald-300/70 uppercase tracking-wide bg-emerald-500/10 px-1 rounded">
                        auto
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-snug">{description}</p>
                  {met && reason && (
                    <p className="text-[10px] text-emerald-300/80 mt-0.5 leading-snug italic">{reason}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Right: game card (narrow) */}
      <div className="w-52 shrink-0 flex flex-col gap-2">
        <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wide">Game Card</p>
        <GameCardSlot label="Character" value={gameCard?.character} icon="🧑" />
        <GameCardSlot label="Theme" value={gameCard?.theme} icon="🎨" />
        <GameCardSlot label="Action" value={gameCard?.action} icon="🛠️" />
        <GameCardSlot label="Win" value={gameCard?.win} icon="🎯" />
        <GameCardSlot label="Math" value={gameCard?.mathRole} icon="🧮" />
      </div>
    </div>
  )
}

function GameCardSlot({ label, value, icon }: { label: string; value?: string; icon: string }) {
  return (
    <div className={`rounded-lg p-2 transition-all duration-300 ${value ? "bg-zinc-800/60 border border-zinc-700/50" : "bg-zinc-950/30 border border-dashed border-zinc-800"}`}>
      <div className="flex items-start gap-1.5">
        <span className="text-xs leading-tight">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] text-zinc-500 uppercase tracking-wide">{label}</p>
          {value ? (
            <p className="text-[11px] text-zinc-200 leading-snug">{value}</p>
          ) : (
            <p className="text-[10px] text-zinc-600 italic">...</p>
          )}
        </div>
      </div>
    </div>
  )
}
