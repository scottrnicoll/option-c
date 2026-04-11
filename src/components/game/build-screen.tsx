"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { GameDesignDoc } from "@/lib/game-types"
import { MatrixRain } from "./matrix-rain"
import { FunnyStickFigure } from "./funny-stick-figure"
import { BuildWaitMiniGame } from "./build-wait-mini-game"
import { useAuth } from "@/lib/auth"

interface BuildScreenProps {
  designDoc: GameDesignDoc
  onComplete: (
    html: string,
    designChoices: Record<string, string>,
    visualConcept: string[]
  ) => void
  // If provided, skip narration/visualConcept/vibe phases and go straight to generating
  preSelectedVibe?: string
  // If provided, try pre-built engine first (instant generation)
  mechanicId?: string
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

type Vibe = "arcade" | "c64" | "kawaii" | "stickman"

// The standardized Game Card structure. Same 5 fields for every game,
// rendered with fixed labels and icons in the BuildScreen UI. The
// /api/game/visual-concept endpoint fills these in from the design doc.
interface GameCard {
  playAs: string
  goal: string
  action: string
  mathRole: string
  watchOut: string
}

export function BuildScreen({ designDoc, onComplete, preSelectedVibe, mechanicId }: BuildScreenProps) {
  const { activeProfile } = useAuth()
  const narrationSequence = buildNarrationSequence(designDoc)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  // If vibe is pre-selected from card builder, skip straight to generating
  const [phase, setPhase] = useState<Phase>(preSelectedVibe ? "generating" : "narration")
  const [visualBullets, setVisualBullets] = useState<string[]>([])
  const [gameCard, setGameCard] = useState<GameCard | null>(null)
  const [conceptLoading, setConceptLoading] = useState(false)
  const [conceptError, setConceptError] = useState<string | null>(null)
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null)
  const [vibe, setVibe] = useState<Vibe | null>((preSelectedVibe as Vibe) || null)
  const visualBulletsRef = useRef<string[]>([])
  const designChoicesRef = useRef<Record<string, string>>({})
  const startGenTimeRef = useRef<number>(0)

  const currentItem = narrationSequence[currentIndex] ?? null
  const autoStartedRef = useRef(false)

  // Fetch the visual concept (now: Game Card) for the learner to approve.
  // The API returns BOTH the structured card (for UI rendering) AND a
  // legacy bullets list (for the generate prompt that expects strings).
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
      if (data.gameCard) {
        setGameCard(data.gameCard as GameCard)
      }
      if (Array.isArray(data.bullets) && data.bullets.length > 0) {
        setVisualBullets(data.bullets)
        visualBulletsRef.current = data.bullets
      } else if (data.gameCard) {
        // No bullets but we have a card — synthesize bullets from it
        // so the generate prompt has something to work with.
        const c = data.gameCard as GameCard
        const synth = [
          `You play as: ${c.playAs}`,
          `Your goal: ${c.goal}`,
          `What you do: ${c.action}`,
          `How math fits: ${c.mathRole}`,
          `Watch out for: ${c.watchOut}`,
        ]
        setVisualBullets(synth)
        visualBulletsRef.current = synth
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

  // Auto-start generation if vibe was pre-selected from card builder
  useEffect(() => {
    if (preSelectedVibe && !autoStartedRef.current) {
      autoStartedRef.current = true

      // Try pre-built engine first (instant)
      if (mechanicId) {
        fetch("/api/game/generate-engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            designDoc,
            mechanicId,
            vibe: preSelectedVibe,
            standardId: designDoc.standardId,
            standardDescription: designDoc.concept || designDoc.mathRole,
            grade: "6",
            cardChoices: (designDoc as any).cardChoices,
            sprites: (designDoc as any).sprites,
          }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.html && data.hasEngine) {
              // Engine generated instantly!
              setGeneratedHtml(data.html)
              setProgress(1)
              setTimeout(() => setPhase("done"), 600)
            } else {
              // No engine — fall back to AI generation
              const bullets = [
                designDoc.howItWorks || "",
                designDoc.winCondition ? `Win condition: ${designDoc.winCondition}` : "",
                designDoc.mathRole ? `Math role: ${designDoc.mathRole}` : "",
              ].filter(Boolean)
              startGeneration(bullets, preSelectedVibe as Vibe)
            }
          })
          .catch(() => {
            // Fallback to AI generation
            const bullets = [
              designDoc.howItWorks || "",
              designDoc.winCondition ? `Win condition: ${designDoc.winCondition}` : "",
              designDoc.mathRole ? `Math role: ${designDoc.mathRole}` : "",
            ].filter(Boolean)
            startGeneration(bullets, preSelectedVibe as Vibe)
          })
      } else {
        // No mechanic ID — use AI generation
        const bullets = [
          designDoc.howItWorks || "",
          designDoc.winCondition ? `Win condition: ${designDoc.winCondition}` : "",
          designDoc.mathRole ? `Math role: ${designDoc.mathRole}` : "",
        ].filter(Boolean)
        startGeneration(bullets, preSelectedVibe as Vibe)
      }
    }
  }, [preSelectedVibe, mechanicId, designDoc, startGeneration])

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
      <div className="flex-1 flex flex-col items-center p-8 relative overflow-y-auto">
        <div className="absolute inset-0 md:hidden opacity-20 overflow-hidden">
          <MatrixRain className="absolute inset-0" />
        </div>

        <div className="relative z-10 max-w-md w-full space-y-6 my-auto">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-1">
              {phase === "narration" && "Building your game"}
              {phase === "visualConcept" && "Game Specs"}
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

          {/* Phase: visual concept preview — the standardized Game Card.
              Same 5 fields every time, with fixed labels and icons. No
              random per-game emojis. The card is structured so kids
              know exactly what to expect across every game. */}
          {phase === "visualConcept" && (
            <div className="space-y-4">
              {conceptLoading && (
                <div className="text-center space-y-3 py-6">
                  <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-zinc-300">Drafting your Game Card...</p>
                </div>
              )}
              {gameCard && !conceptLoading && (
                <>
                  <div className="bg-zinc-900 border-2 border-emerald-500/30 rounded-xl overflow-hidden">
                    <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2">
                      <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wide">
                        Game Card
                      </p>
                    </div>
                    <div className="p-4 space-y-3">
                      <GameCardField
                        icon="🧑"
                        label="You play as"
                        value={gameCard.playAs}
                      />
                      <GameCardField
                        icon="🎯"
                        label="Your goal"
                        value={gameCard.goal}
                      />
                      <GameCardField
                        icon="🛠️"
                        label="What you do"
                        value={gameCard.action}
                      />
                      <GameCardField
                        icon="🧮"
                        label="How math fits"
                        value={gameCard.mathRole}
                      />
                      <GameCardField
                        icon="⚠️"
                        label="Watch out for"
                        value={gameCard.watchOut}
                      />
                    </div>
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
              {/* Retro */}
              <button
                onClick={() => handleVibePick("c64")}
                className="w-full p-4 rounded-xl border-2 border-blue-400/40 bg-blue-950 hover:border-blue-300 transition-all text-left"
                style={{ fontFamily: "monospace" }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">👾</span>
                  <div>
                    <p className="text-sm font-bold text-white">Retro</p>
                    <p className="text-xs text-blue-200">Blocky pixel art, classic game feel</p>
                  </div>
                </div>
              </button>
              {/* Cute */}
              <button
                onClick={() => handleVibePick("kawaii")}
                className="w-full p-4 rounded-xl border-2 border-pink-300/60 hover:border-pink-300 transition-all text-left"
                style={{
                  background: "linear-gradient(135deg, #fef9c3 0%, #ffe4e6 100%)",
                  fontFamily: "'Quicksand', sans-serif",
                  boxShadow: "0 4px 12px rgba(244, 114, 182, 0.2)",
                }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">🥹</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#9d174d" }}>Cute</p>
                    <p className="text-xs" style={{ color: "#831843" }}>Soft pastels, chubby characters</p>
                  </div>
                </div>
              </button>
              {/* Stick Man (was: Sketch) */}
              <button
                onClick={() => handleVibePick("stickman")}
                className="w-full p-4 rounded-xl border-2 border-zinc-600 hover:border-zinc-400 transition-all text-left"
                style={{
                  background: "#18181b",
                  fontFamily: "'Patrick Hand', cursive",
                }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">✏️</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#e4e4e7" }}>Stick Man</p>
                    <p className="text-xs" style={{ color: "#a1a1aa" }}>Faceless stick figures on dark zinc</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Phase: generating */}
          {phase === "generating" && (
            <div className="space-y-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-3 py-1.5 flex items-center justify-between">
                  <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wide">
                    Game Card
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide">
                    {vibe === "c64" ? "Retro" : vibe === "kawaii" ? "Cute" : vibe === "stickman" ? "Stick Man" : vibe || ""} style
                  </p>
                </div>
                <div className="p-3 space-y-2">
                  {gameCard ? (
                    <>
                      <GameCardField icon="🧑" label="You play as" value={gameCard.playAs} />
                      <GameCardField icon="🎯" label="Your goal" value={gameCard.goal} />
                      <GameCardField icon="🛠️" label="What you do" value={gameCard.action} />
                      <GameCardField icon="🧮" label="How math fits" value={gameCard.mathRole} />
                      <GameCardField icon="⚠️" label="Watch out for" value={gameCard.watchOut} />
                    </>
                  ) : visualBullets.length > 0 ? (
                    visualBullets.map((b, i) => (
                      <p key={i} className="text-sm text-zinc-200">{b}</p>
                    ))
                  ) : (
                    <>
                      <GameCardField icon="🎮" label="Game" value={designDoc.title || "Your game"} />
                      {designDoc.howItWorks && <GameCardField icon="🛠️" label="How it works" value={designDoc.howItWorks} />}
                      {designDoc.winCondition && <GameCardField icon="🎯" label="Win condition" value={designDoc.winCondition} />}
                      {designDoc.mathRole && <GameCardField icon="🧮" label="Math" value={designDoc.mathRole} />}
                    </>
                  )}
                </div>
              </div>
              {/* Stick figure + math practice side by side */}
              <div className="flex gap-3 items-stretch">
                <div className="flex-1">
                  <FunnyStickFigure />
                </div>
                <div className="flex-1">
                  <BuildWaitMiniGame grade={activeProfile?.grade} />
                </div>
              </div>

              <div className="text-center">
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

// One row of the standardized Game Card. Fixed icon + label on the
// left, the AI-generated value on the right. Used 5 times in the
// visualConcept phase, always with the same set of icons.
function GameCardField({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-xl shrink-0 leading-tight w-6 text-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm text-zinc-100 leading-snug">{value}</p>
      </div>
    </div>
  )
}
