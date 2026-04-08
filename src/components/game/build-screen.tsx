"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { GameDesignDoc } from "@/lib/game-types"
import { MatrixRain } from "./matrix-rain"

interface BuildScreenProps {
  designDoc: GameDesignDoc
  onComplete: (
    html: string,
    designChoices: Record<string, string>,
    visualConcept: string[]
  ) => void
}

interface NarrationItem {
  type: "narration"
  text: string
}

// We dropped the multiple-choice questions — they didn't actually
// influence the generated game and were always the same. The build flow
// now goes: brief narration → visual-concept preview → generation.
function buildNarrationSequence(designDoc: GameDesignDoc): NarrationItem[] {
  return [
    { type: "narration", text: `Reading your idea for "${designDoc.title}"...` },
    { type: "narration", text: "Sketching the visuals..." },
  ]
}

type Phase = "narration" | "visualConcept" | "vibe" | "generating" | "done"

type Vibe = "arcade" | "c64" | "cute" | "sketch"

export function BuildScreen({ designDoc, onComplete }: BuildScreenProps) {
  const narrationSequence = buildNarrationSequence(designDoc)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<Phase>("narration")
  const [visualBullets, setVisualBullets] = useState<string[]>([])
  const [conceptLoading, setConceptLoading] = useState(false)
  const [conceptError, setConceptError] = useState<string | null>(null)
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null)
  const [vibe, setVibe] = useState<Vibe | null>(null)
  const visualBulletsRef = useRef<string[]>([])
  const designChoicesRef = useRef<Record<string, string>>({})
  const startGenTimeRef = useRef<number>(0)

  const currentItem = narrationSequence[currentIndex] ?? null

  // Fetch the visual concept bullets for the learner to approve.
  const fetchVisualConcept = useCallback(async () => {
    setConceptLoading(true)
    setConceptError(null)
    try {
      const res = await fetch("/api/game/visual-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designDoc }),
      })
      const data = await res.json()
      if (Array.isArray(data.bullets) && data.bullets.length > 0) {
        setVisualBullets(data.bullets)
        visualBulletsRef.current = data.bullets
      } else {
        setConceptError("Couldn't draft the visual concept. Building anyway.")
        setPhase("generating")
      }
    } catch {
      setConceptError("Couldn't draft the visual concept. Building anyway.")
      setPhase("generating")
    } finally {
      setConceptLoading(false)
    }
  }, [designDoc])

  // Kick off code generation. Uses the approved visual bullets + vibe.
  const startGeneration = useCallback(async (approvedBullets: string[], pickedVibe: Vibe) => {
    startGenTimeRef.current = Date.now()
    try {
      const res = await fetch("/api/game/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designDoc,
          designChoices: designChoicesRef.current,
          visualConcept: approvedBullets.join("\n"),
          vibe: pickedVibe,
        }),
      })
      const data = await res.json()
      if (data.html) {
        setGeneratedHtml(data.html)
      }
    } catch {
      // ignore
    } finally {
      // Make sure we leave the loading screen even if the API fails
      setProgress(1)
      setTimeout(() => {
        setPhase("done")
      }, 600)
    }
  }, [designDoc])

  // Auto-advance narration → after the last narration item, fetch the
  // visual concept and move to the approval phase.
  useEffect(() => {
    if (phase !== "narration") return
    if (!currentItem) return
    const isLast = currentIndex >= narrationSequence.length - 1
    const timer = setTimeout(() => {
      if (isLast) {
        setPhase("visualConcept")
        fetchVisualConcept()
      } else {
        setCurrentIndex((i) => i + 1)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [currentIndex, currentItem, phase, narrationSequence.length, fetchVisualConcept])

  // Progress bar fills during generation phase
  useEffect(() => {
    if (phase !== "generating") return
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startGenTimeRef.current) / 1000
      const p = Math.min(elapsed / 25, 0.95)
      setProgress(p)
    }, 200)
    return () => clearInterval(interval)
  }, [phase])

  // When phase becomes "done", call the parent onComplete handler
  useEffect(() => {
    if (phase !== "done") return
    onComplete(generatedHtml || "", designChoicesRef.current, visualBulletsRef.current)
  }, [phase, generatedHtml, onComplete])

  const handleConceptApprove = () => {
    // After approving the visual concept, the learner picks a vibe
    // (Arcade or Commodore 64). Generation starts after the pick.
    setPhase("vibe")
  }

  const handleVibePick = (pickedVibe: Vibe) => {
    setVibe(pickedVibe)
    setPhase("generating")
    startGeneration(visualBullets, pickedVibe)
  }


  return (
    <div className="fixed inset-0 z-50 flex bg-zinc-950">
      {/* Left: Matrix rain */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden">
        <MatrixRain className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-950/80" />
      </div>

      {/* Right: Phase content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="absolute inset-0 md:hidden opacity-20 overflow-hidden">
          <MatrixRain className="absolute inset-0" />
        </div>

        <div className="relative z-10 max-w-md w-full space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-1">
              {phase === "narration" && "Building your game"}
              {phase === "visualConcept" && "How it'll look"}
              {phase === "vibe" && "Pick the look"}
              {phase === "generating" && "Building your game"}
              {phase === "done" && "Done!"}
            </h2>
            <p className="text-zinc-400 text-sm">{designDoc.title}</p>
          </div>

          {/* Phase: narration */}
          {phase === "narration" && (
            <div className="min-h-[140px] flex flex-col items-center justify-center">
              {currentItem && (
                <div className="text-center animate-fade-in">
                  <p className="text-lg text-emerald-400">{currentItem.text}</p>
                </div>
              )}
            </div>
          )}

          {/* Phase: visual concept preview — bullets */}
          {phase === "visualConcept" && (
            <div className="space-y-4">
              {conceptLoading && (
                <div className="text-center space-y-3 py-6">
                  <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-zinc-300">Sketching the visuals...</p>
                </div>
              )}
              {visualBullets.length > 0 && !conceptLoading && (
                <>
                  <div className="bg-zinc-900 border-2 border-emerald-500/30 rounded-xl p-5 space-y-2">
                    {visualBullets.map((b, i) => (
                      <p key={i} className="text-base text-zinc-100 leading-relaxed">
                        {b}
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={handleConceptApprove}
                    className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                  >
                    Build it! →
                  </button>
                </>
              )}
              {conceptError && (
                <p className="text-amber-400 text-sm text-center">{conceptError}</p>
              )}
            </div>
          )}

          {/* Phase: vibe picker */}
          {phase === "vibe" && (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <p className="text-center text-sm text-zinc-300">
                Pick the look you want for your game.
              </p>
              {/* Arcade */}
              <button
                onClick={() => handleVibePick("arcade")}
                className="w-full p-4 rounded-xl border-2 border-cyan-500/40 bg-black hover:border-cyan-400 hover:shadow-[0_0_24px_rgba(0,255,255,0.3)] transition-all text-left"
                style={{ fontFamily: "monospace" }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">🕹️</span>
                  <div>
                    <p className="text-sm font-bold text-cyan-300" style={{ textShadow: "0 0 8px rgba(0,255,255,0.6)" }}>ARCADE</p>
                    <p className="text-xs text-zinc-400">Neon, scanlines, retro arcade glow</p>
                  </div>
                </div>
              </button>
              {/* Retro Game */}
              <button
                onClick={() => handleVibePick("c64")}
                className="w-full p-4 rounded-xl border-2 border-blue-400/40 bg-blue-950 hover:border-blue-300 transition-all text-left"
                style={{ fontFamily: "monospace" }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">💻</span>
                  <div>
                    <p className="text-sm font-bold text-white">RETRO GAME</p>
                    <p className="text-xs text-blue-200">1980s home computer aesthetic</p>
                  </div>
                </div>
              </button>
              {/* Cute */}
              <button
                onClick={() => handleVibePick("cute")}
                className="w-full p-4 rounded-xl border-2 border-pink-300/60 hover:border-pink-300 transition-all text-left"
                style={{
                  background: "linear-gradient(135deg, #fef9c3 0%, #ffe4e6 100%)",
                  fontFamily: "'Quicksand', sans-serif",
                  boxShadow: "0 4px 12px rgba(244, 114, 182, 0.2)",
                }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">🎀</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#9d174d" }}>Cute</p>
                    <p className="text-xs" style={{ color: "#831843" }}>Soft pastels, sparkles, pretty things</p>
                  </div>
                </div>
              </button>
              {/* Sketch */}
              <button
                onClick={() => handleVibePick("sketch")}
                className="w-full p-4 rounded-xl border-2 border-zinc-600 hover:border-zinc-400 transition-all text-left"
                style={{
                  background: "#fdfcf7",
                  fontFamily: "'Patrick Hand', cursive",
                }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">✏️</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#1f2937" }}>Sketch</p>
                    <p className="text-xs" style={{ color: "#374151" }}>Hand-drawn stick figures on paper</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Phase: generating */}
          {phase === "generating" && (
            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1.5">
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Building this in {vibe === "arcade" ? "Arcade" : vibe === "c64" ? "Retro Game" : vibe === "cute" ? "Cute" : "Sketch"} style:</p>
                {visualBullets.map((b, i) => (
                  <p key={i} className="text-sm text-zinc-200">{b}</p>
                ))}
              </div>
              <div className="text-center space-y-2 py-2">
                <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-emerald-400 animate-pulse">
                  {progress < 0.3 ? "Drawing characters..." :
                   progress < 0.6 ? "Wiring up the math..." :
                   progress < 0.9 ? "Adding polish..." : "Almost ready..."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Progress bar (only during generating) */}
        {phase === "generating" && (
          <div className="absolute bottom-8 left-8 right-8">
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
