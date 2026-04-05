"use client"

import { useEffect, useState } from "react"

interface MasteryAnimationProps {
  planetName: string
  planetColor: string
  tokenGain: number
  onDone: () => void
}

export function MasteryAnimation({ planetName, planetColor, tokenGain, onDone }: MasteryAnimationProps) {
  const [phase, setPhase] = useState<"burst" | "text" | "fade">("burst")

  useEffect(() => {
    // burst → text after 600ms
    const t1 = setTimeout(() => setPhase("text"), 600)
    // text → fade after 2800ms
    const t2 = setTimeout(() => setPhase("fade"), 2800)
    // done after 3400ms
    const t3 = setTimeout(onDone, 3400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center pointer-events-none transition-opacity duration-600 ${
        phase === "fade" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Radial burst layers */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`rounded-full transition-all duration-700 ${
            phase === "burst" ? "scale-0 opacity-100" : "scale-[6] opacity-0"
          }`}
          style={{
            width: 200,
            height: 200,
            background: `radial-gradient(circle, ${planetColor}ff 0%, ${planetColor}88 40%, transparent 70%)`,
            transitionTimingFunction: "cubic-bezier(0.2, 0, 0.2, 1)",
          }}
        />
      </div>

      {/* Secondary burst ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`rounded-full border-4 transition-all duration-1000 ${
            phase === "burst" ? "scale-0 opacity-80" : "scale-[8] opacity-0"
          }`}
          style={{
            width: 160,
            height: 160,
            borderColor: planetColor,
            transitionTimingFunction: "ease-out",
          }}
        />
      </div>

      {/* Star particles — simple CSS circles scattered around */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * 360
        const dist = 120 + (i % 3) * 40
        const rx = Math.cos((angle * Math.PI) / 180) * dist
        const ry = Math.sin((angle * Math.PI) / 180) * dist
        return (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full transition-all duration-1000 ${
              phase === "burst" ? "scale-0 opacity-0" : phase === "text" ? "scale-100 opacity-90" : "scale-0 opacity-0"
            }`}
            style={{
              transform: `translate(${rx}px, ${ry}px) scale(${phase === "text" ? 1 : 0})`,
              backgroundColor: planetColor,
              transitionDelay: `${i * 40}ms`,
            }}
          />
        )
      })}

      {/* Main text */}
      <div
        className={`relative z-10 text-center transition-all duration-500 ${
          phase === "burst" ? "scale-0 opacity-0" : phase === "text" ? "scale-100 opacity-100" : "scale-110 opacity-0"
        }`}
      >
        <div
          className="text-5xl font-black tracking-tight mb-2 drop-shadow-lg"
          style={{ color: planetColor, textShadow: `0 0 40px ${planetColor}88` }}
        >
          Planet Mastered!
        </div>
        <div className="text-xl text-white/80 font-medium mb-3">{planetName}</div>
        <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 rounded-full px-5 py-2">
          <span className="text-amber-300 text-lg font-bold">+{tokenGain}</span>
          <span className="text-amber-200 text-sm">tokens</span>
        </div>
      </div>
    </div>
  )
}
