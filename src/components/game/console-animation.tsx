"use client"

import { useState, useEffect } from "react"

// Game Console Assembly Animation
// The console explodes into components, learner fills slots,
// components reassemble, screen lights up, beam shoots upward.
//
// States: closed → exploding → assembling → assembled → beam → playing

type ConsoleState = "closed" | "exploded" | "assembling" | "assembled" | "beam"

interface ConsoleAnimationProps {
  // Which slots are filled
  hasBackground: boolean
  hasCharacter: boolean
  hasGameOption: boolean
  hasItem: boolean
  allFilled: boolean
  // When all criteria met and user clicks build
  onBuildStart?: () => void
  // Children = the assembler slots content
  children: React.ReactNode
}

export function ConsoleAnimation({
  hasBackground,
  hasCharacter,
  hasGameOption,
  hasItem,
  allFilled,
  onBuildStart,
  children,
}: ConsoleAnimationProps) {
  const [state, setState] = useState<ConsoleState>("closed")
  const [showBeam, setShowBeam] = useState(false)

  // Auto-open on mount
  useEffect(() => {
    const timer = setTimeout(() => setState("exploded"), 600)
    return () => clearTimeout(timer)
  }, [])

  // When all filled, trigger assembly animation
  useEffect(() => {
    if (allFilled && state === "exploded") {
      setState("assembling")
      setTimeout(() => setState("assembled"), 800)
    }
  }, [allFilled, state])

  const handleBuild = () => {
    setState("beam")
    setShowBeam(true)
    setTimeout(() => {
      onBuildStart?.()
    }, 1500)
  }

  const filledCount = [hasBackground, hasCharacter, hasGameOption, hasItem].filter(Boolean).length

  return (
    <div className="relative">
      {/* Console frame */}
      <div className={`relative transition-all duration-700 ${
        state === "closed" ? "scale-90 opacity-0" : "scale-100 opacity-100"
      }`}>
        {/* Console body — rounded rectangle like a handheld */}
        <div className="relative bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl border-2 border-zinc-700 overflow-hidden shadow-2xl shadow-black/50">
          {/* Console top bar — looks like device bezel */}
          <div className="bg-zinc-800 border-b border-zinc-700 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Power LED */}
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                state === "assembled" || state === "beam"
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  : filledCount > 0
                    ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]"
                    : "bg-zinc-600"
              }`} />
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Game Assembler</span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Criteria LEDs */}
              <CriteriaLED lit={hasGameOption} label="Math" />
              <CriteriaLED lit={hasGameOption} label="Essential" />
              <CriteriaLED lit={allFilled} label="Playable" />
            </div>
          </div>

          {/* Screen area — where the circuit board / slots are */}
          <div className={`relative transition-all duration-500 ${
            state === "exploded" ? "min-h-[400px]" : "min-h-[200px]"
          }`}>
            {/* Circuit board background */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(52,211,153,0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(52,211,153,0.3) 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
              }}
            />

            {/* Circuit traces — decorative lines connecting slots */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" xmlns="http://www.w3.org/2000/svg">
              <line x1="20%" y1="25%" x2="50%" y2="25%" stroke="#34d399" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="50%" y1="25%" x2="80%" y2="25%" stroke="#34d399" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="50%" y1="25%" x2="50%" y2="75%" stroke="#34d399" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="20%" y1="75%" x2="80%" y2="75%" stroke="#34d399" strokeWidth="1" strokeDasharray="4,4" />
            </svg>

            {/* Slot content from parent */}
            <div className={`relative z-10 p-4 transition-all duration-500 ${
              state === "exploded" ? "opacity-100" : state === "assembling" ? "opacity-50 scale-95" : "opacity-100"
            }`}>
              {children}
            </div>

            {/* Assembly overlay — shown briefly during assembly */}
            {state === "assembling" && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 z-20">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-emerald-400 animate-pulse">Assembling...</p>
                </div>
              </div>
            )}
          </div>

          {/* Console bottom bar — build button area */}
          <div className="bg-zinc-800 border-t border-zinc-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* D-pad decoration */}
              <div className="grid grid-cols-3 gap-0.5 opacity-20">
                <div /><div className="w-2 h-2 bg-zinc-500 rounded-sm" /><div />
                <div className="w-2 h-2 bg-zinc-500 rounded-sm" /><div className="w-2 h-2 bg-zinc-600 rounded-sm" /><div className="w-2 h-2 bg-zinc-500 rounded-sm" />
                <div /><div className="w-2 h-2 bg-zinc-500 rounded-sm" /><div />
              </div>
              <span className="text-[10px] text-zinc-600">{filledCount}/4 components</span>
            </div>

            {state === "assembled" || state === "beam" ? (
              <button
                onClick={handleBuild}
                disabled={state === "beam"}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60"
              >
                {state === "beam" ? "Launching..." : "Build my game →"}
              </button>
            ) : (
              <span className="text-xs text-zinc-600">Fill all components to build</span>
            )}

            {/* Action buttons decoration */}
            <div className="flex gap-1.5 opacity-20">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-blue-500/50" />
            </div>
          </div>
        </div>

        {/* Beam shooting upward when game is built */}
        {showBeam && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-1 pointer-events-none z-30"
            style={{ animation: "beam-shoot 1.2s ease-out forwards" }}
          >
            <div className="w-1 bg-gradient-to-t from-emerald-400 via-blue-400 to-transparent rounded-full"
              style={{ height: "200px", boxShadow: "0 0 20px rgba(52,211,153,0.5), 0 0 40px rgba(96,165,250,0.3)" }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes beam-shoot {
          0% { height: 0; opacity: 0; }
          20% { opacity: 1; }
          100% { height: 300px; opacity: 0; transform: translateY(-200px); }
        }
      `}</style>
    </div>
  )
}

function CriteriaLED({ lit, label }: { lit: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1" title={label}>
      <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
        lit
          ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
          : "bg-zinc-700"
      }`} />
      <span className={`text-[8px] uppercase tracking-wide ${lit ? "text-emerald-400" : "text-zinc-600"}`}>{label}</span>
    </div>
  )
}
