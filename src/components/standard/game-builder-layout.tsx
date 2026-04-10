"use client"

import { Check, Circle } from "lucide-react"

interface GameBuilderLayoutProps {
  children: React.ReactNode
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
    <div className="flex gap-4 flex-1 min-h-0">
      {/* Left: chat (takes most space) */}
      <div className="flex-1 min-w-0 flex flex-col">
        {children}
      </div>

      {/* Middle: criteria */}
      <div className="w-64 shrink-0 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Criteria</p>
          <p className="text-xs text-zinc-300 font-bold">{metCount}/3</p>
        </div>
        {CRITERIA_INFO.map(({ key, icon, name, description }) => {
          const met = criteria[key]
          const isPre = preSet.has(key)
          const reason = criteriaReasons?.[key]
          return (
            <div
              key={key}
              className={`rounded-xl border p-3 transition-all duration-500 ${
                met
                  ? "border-emerald-500/50 bg-emerald-500/15"
                  : "border-zinc-700 bg-zinc-900"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {met ? (
                    <Check className="size-4 text-emerald-400" />
                  ) : (
                    <Circle className="size-4 text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{icon}</span>
                    <span className={`text-sm font-bold ${met ? "text-emerald-300" : "text-zinc-200"}`}>
                      {name}
                    </span>
                    {isPre && (
                      <span className="text-[9px] text-emerald-300/80 uppercase tracking-wide bg-emerald-500/15 px-1.5 py-0.5 rounded font-semibold">
                        auto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-snug">{description}</p>
                  {met && reason && (
                    <p className="text-xs text-emerald-300/90 mt-1 leading-snug italic">{reason}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Right: game card */}
      <div className="w-56 shrink-0 flex flex-col gap-2.5">
        <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">Game Card</p>
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
    <div className={`rounded-xl p-3 transition-all duration-300 ${value ? "bg-zinc-800 border border-zinc-700" : "bg-zinc-900 border border-dashed border-zinc-700"}`}>
      <div className="flex items-start gap-2">
        <span className="text-base leading-tight">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-zinc-400 uppercase tracking-wide font-semibold">{label}</p>
          {value ? (
            <p className="text-sm text-zinc-100 mt-0.5 leading-snug">{value}</p>
          ) : (
            <p className="text-xs text-zinc-600 mt-0.5">...</p>
          )}
        </div>
      </div>
    </div>
  )
}
