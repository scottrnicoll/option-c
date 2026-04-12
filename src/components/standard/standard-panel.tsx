"use client"

import { useState, useEffect } from "react"
import type { StandardNode } from "@/lib/graph-types"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Lock, CheckCircle, ChevronLeft, Trophy, Play, X, ChevronDown, Volume2, VolumeX } from "lucide-react"
import posthog from "posthog-js"
import Link from "next/link"
import { ConceptCard } from "./concept-card"
import { CircuitBoardBuilder } from "./circuit-board-builder"
import { MasteryPlay } from "./mastery-play"
import { GameIframe } from "@/components/game/game-iframe"
import { useAuth } from "@/lib/auth"
import { useTokenConfig } from "@/lib/token-config"
import { InfoButton } from "@/components/info-button"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import type { Game } from "@/lib/game-types"
import moonNames from "@/data/moon-names.json"

const MOON_NAMES = moonNames as Record<string, string>

function InReviewGamePreview({ standardId }: { standardId: string }) {
  const { activeProfile } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!activeProfile?.uid) return
    const q = query(
      collection(db, "games"),
      where("authorUid", "==", activeProfile.uid),
      where("standardId", "==", standardId)
    )
    getDocs(q).then(snap => {
      if (!snap.empty) setGame({ ...snap.docs[0].data(), id: snap.docs[0].id } as Game)
    }).catch(() => {})
  }, [activeProfile?.uid, standardId])

  if (!game) return null

  if (playing) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setPlaying(false)}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ← Close preview
        </button>
        <div className="h-[400px] rounded-lg overflow-hidden border border-zinc-800">
          <GameIframe html={game.gameHtml} className="w-full h-full" />
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-colors text-left"
    >
      <Play className="size-4 text-blue-400 shrink-0" />
      <div>
        <p className="text-sm text-white">{game.title}</p>
        <p className="text-xs text-zinc-400">Play your submitted game</p>
      </div>
    </button>
  )
}

// Pretty planet name for the panel header (e.g. "Geometry · Grade 2")
function getPlanetLabel(standard: StandardNode): string {
  const shortNames: Record<string, string> = {
    "Operations & Algebraic Thinking": "Algebra",
    "Number & Operations In Base Ten": "Base Ten",
    "Number & Operations-Fractions": "Fractions",
    "Number & Operations - Fractions": "Fractions",
    "Counting & Cardinality": "Counting",
    "Measurement & Data": "Measurement",
    "Ratios & Proportional Relationships": "Ratios",
    "The Number System": "Numbers",
    "Expressions & Equations": "Equations",
    "Statistics & Probability": "Statistics",
  }
  const planet = shortNames[standard.domain] ?? standard.domain
  return `${planet} · Grade ${standard.grade}`
}

// AI-generated moon name with description fallback
function getMoonName(standard: StandardNode): string {
  return MOON_NAMES[standard.id] ?? standard.description
}

// Simplified moon card: Title → "This is about..." → "Where you'll use this" → Learn more → Build
function MoonCardView({
  standard,
  planetLabel,
  moonName,
  playToMasterButton,
  onClose,
  onBuild,
  onImportHtml,
}: {
  standard: StandardNode
  planetLabel: string
  moonName: string
  playToMasterButton: React.ReactNode
  onClose: () => void
  onBuild: () => void
  onImportHtml?: () => void
}) {
  const [explanation, setExplanation] = useState<{
    whatIsThis: string; commonMistakes: string | string[]; realWorldUse: string; formula?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [learnMoreOpen, setLearnMoreOpen] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        standardId: standard.id,
        description: standard.description,
        grade: standard.grade,
        readingLevel: "default",
      }),
    })
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setExplanation(data); posthog.capture("explore_card_viewed", { standard_id: standard.id }) } })
      .catch(() => {
        if (!cancelled) setExplanation({
          whatIsThis: standard.description,
          commonMistakes: "Take your time with this one.",
          realWorldUse: "You'll use this in real life more than you think!",
        })
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [standard.id, standard.description, standard.grade])

  const handleReadAloud = () => {
    if (!explanation) return
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    const mistakes = Array.isArray(explanation.commonMistakes)
      ? explanation.commonMistakes.join(". ")
      : explanation.commonMistakes
    const text = [explanation.whatIsThis, explanation.formula ? `Formula: ${explanation.formula}` : "", mistakes, explanation.realWorldUse].filter(Boolean).join(". ")
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <div>
          <p className="text-xs text-blue-400 font-medium uppercase tracking-wide">{planetLabel}</p>
          <h2 className="text-lg font-bold text-white">{moonName}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReadAloud}
            disabled={loading}
            className={`p-2 rounded transition-colors ${speaking ? "text-blue-400 bg-blue-500/10" : "text-zinc-400 hover:text-zinc-200"} disabled:opacity-30`}
            title={speaking ? "Stop reading" : "Read aloud"}
          >
            {speaking ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-2" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-400 animate-pulse">Loading...</p>
            </div>
          ) : explanation ? (
            <>
              {/* This is about... */}
              <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-2">This is about...</p>
                <p className="text-sm text-zinc-200 leading-relaxed">{explanation.whatIsThis}</p>
              </div>

              {/* Where you'll use this */}
              <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-2">Where you&apos;ll use this</p>
                <p className="text-sm text-zinc-200 leading-relaxed">{explanation.realWorldUse}</p>
              </div>

              {/* Learn more — expandable */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <button
                  onClick={() => { const next = !learnMoreOpen; setLearnMoreOpen(next); if (next) posthog.capture("learn_more_expanded", { standard_id: standard.id }) }}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="text-xs text-zinc-400 uppercase tracking-wide font-semibold">Learn more</span>
                  <ChevronDown className={`size-4 text-zinc-500 transition-transform ${learnMoreOpen ? "rotate-180" : ""}`} />
                </button>
                {learnMoreOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-zinc-800">
                    {explanation.formula && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <p className="text-xs text-zinc-500 mb-1">Formula</p>
                        <p className="text-sm font-mono text-amber-300 text-center">{explanation.formula}</p>
                      </div>
                    )}
                    <div className="mt-3">
                      <p className="text-xs text-zinc-500 mb-1">Watch out for</p>
                      {Array.isArray(explanation.commonMistakes) ? (
                        <ul className="space-y-1">
                          {explanation.commonMistakes.map((m, i) => (
                            <li key={i} className="text-sm text-zinc-300 flex gap-2">
                              <span className="text-amber-500 shrink-0">•</span>{m}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-zinc-300">{explanation.commonMistakes}</p>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-600 text-center">{standard.id}</p>
                  </div>
                )}
              </div>

              {playToMasterButton}

              {/* Build Your Game button */}
              <button
                onClick={onBuild}
                className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-base font-bold transition-colors shadow-lg shadow-emerald-900/30"
              >
                Build Your Game →
              </button>

              {onImportHtml && (
                <button
                  onClick={onImportHtml}
                  className="w-full py-3 rounded-lg border-2 border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm font-medium transition-colors"
                >
                  Or paste your own HTML game →
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

type FlowStep = "learn" | "earn" | "unlocked" | "demonstrate"

interface StandardPanelProps {
  standard: StandardNode | null
  open: boolean
  onClose: () => void
  onUnlock: (standardId: string) => void
  onDemonstrated?: (standardId: string) => void
  onBuildGame?: (designDoc: import("@/lib/game-types").GameDesignDoc, chatHistory: string, vibe?: string, mechanicId?: string) => void
  // Called when the learner clicks "Paste my own HTML" — opens the import flow.
  onImportHtml?: (standard: StandardNode) => void
  nodeStatus?: "locked" | "available" | "in_progress" | "in_review" | "approved_unplayed" | "unlocked" | "mastered"
}

export function StandardPanel({
  standard,
  open,
  onClose,
  onUnlock,
  onDemonstrated,
  onBuildGame,
  onImportHtml,
  nodeStatus,
}: StandardPanelProps) {
  const { gameApproved: tokenGameApproved } = useTokenConfig()
  const [step, setStep] = useState<FlowStep>("learn")
  const [approvedGameCount, setApprovedGameCount] = useState(0)

  // Reset step when standard changes
  useEffect(() => {
    setStep("learn")
  }, [standard?.id])

  // Count published games for this exact skill (across all classes), so we
  // know whether to show the "Play to Master" button.
  useEffect(() => {
    if (!standard?.id) return
    let cancelled = false
    const q = query(
      collection(db, "games"),
      where("standardId", "==", standard.id),
      where("status", "==", "published")
    )
    getDocs(q)
      .then((snap) => { if (!cancelled) setApprovedGameCount(snap.size) })
      .catch(() => { if (!cancelled) setApprovedGameCount(0) })
    return () => { cancelled = true }
  }, [standard?.id])

  if (!standard) return null

  // Inline component: orange "Play to Master" button → filtered library
  const playToMasterButton = approvedGameCount > 0 ? (
    <Link
      href={`/library?skill=${encodeURIComponent(standard.id)}`}
      onClick={() => onClose()}
      className="w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
    >
      <Trophy className="size-4" />
      Play to Master ({approvedGameCount} {approvedGameCount === 1 ? "game" : "games"})
    </Link>
  ) : null

  return (
    <>
    <Sheet open={open && step !== "earn" && step !== "learn"} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:w-[75vw] lg:w-[60vw] overflow-y-auto"
      >
        <SheetHeader>
          <div className="flex items-center justify-between">
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wide">
              {getPlanetLabel(standard)}
            </p>
            <InfoButton title="Read Me!">
              <p>A <span className="text-zinc-200">Moon</span> is a single math skill — one Common Core standard.</p>
              <p>Read the skill, then design a game that uses the math. The AI helps you build it.</p>
              <p>Your guide reviews and approves your game. Then play it 3 times to demonstrate the skill.</p>
            </InfoButton>
          </div>
          <SheetTitle className="text-xl leading-tight">{getMoonName(standard)}</SheetTitle>
          <SheetDescription>
            {standard.description}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4">
          {(step === "earn" || step === "demonstrate") && nodeStatus !== "locked" && nodeStatus !== "mastered" && (
            <button
              onClick={() => setStep("learn")}
              className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 mb-3 transition-colors"
            >
              <ChevronLeft className="size-4" />
              Back
            </button>
          )}

          {nodeStatus === "locked" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <Lock className="size-4 shrink-0" />
                <span>You haven&apos;t completed its prerequisites. Go back to the galaxy and complete them first.</span>
              </div>
              {playToMasterButton}
              <ConceptCard
                standard={standard}
                onReady={() => {}}
                readOnly
              />
            </div>
          ) : nodeStatus === "approved_unplayed" ? (
            // Guide approved the game; student must win their own game
            // 3 in a row to flip the moon to green.
            step === "demonstrate" ? (
              <MasteryPlay
                standardId={standard.id}
                onDemonstrated={() => onDemonstrated?.(standard.id)}
              />
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-1">
                  <p className="text-sm text-emerald-300 font-medium">Your game was approved! +{tokenGameApproved} tokens earned.</p>
                  <p className="text-xs text-zinc-300">
                    Now win your own game <span className="text-amber-300 font-semibold">3 times in a row</span> to turn this moon green.
                  </p>
                </div>
                <button
                  onClick={() => setStep("demonstrate")}
                  className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                >
                  Play your game →
                </button>
                <ConceptCard
                  standard={standard}
                  onReady={() => {}}
                  readOnly
                />
              </div>
            )
          ) : nodeStatus === "unlocked" || nodeStatus === "mastered" ? (
            <div className="space-y-4">
              <div className={`flex items-center gap-2 text-sm ${nodeStatus === "mastered" ? "text-amber-400" : "text-emerald-400"}`}>
                {nodeStatus === "mastered" ? <Trophy className="size-4 shrink-0" /> : <CheckCircle className="size-4 shrink-0" />}
                <span>
                  {nodeStatus === "mastered"
                    ? "You've mastered this skill — gold star!"
                    : "Demonstrated! Play other learners' games on this skill 3 times to earn the gold star."}
                </span>
              </div>
              {playToMasterButton}
              <ConceptCard
                standard={standard}
                onReady={() => {}}
                readOnly
              />
            </div>
          ) : nodeStatus === "in_review" ? (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                <p className="text-amber-300 font-medium">Your game is being reviewed</p>
                <p className="text-zinc-400 text-sm mt-1">You&apos;ll get +{tokenGameApproved} tokens when your guide approves it.</p>
                <a
                  href="/learner"
                  className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-block"
                >
                  Check status in My Stuff →
                </a>
              </div>
              {playToMasterButton}
              <InReviewGamePreview standardId={standard.id} />
            </div>
          ) : (
            <>
              {step === "learn" && (
                <div className="space-y-4">
                  {playToMasterButton}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>

    {/* Full-page circuit board builder — renders OUTSIDE the sheet */}
    {step === "earn" && standard && open && (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
          <div>
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wide">{getPlanetLabel(standard)}</p>
            <h2 className="text-lg font-bold text-white">{getMoonName(standard)}</h2>
          </div>
          <button
            onClick={() => setStep("learn")}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="size-4" /> Back
          </button>
        </div>
        <div className="flex-1 min-h-0 p-4 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <CircuitBoardBuilder
              standardId={standard.id}
              standardDescription={standard.description}
              standardGrade={standard.grade}
              standardDomainCode={standard.domainCode}
              planetId={`${standard.grade}.${standard.domainCode}`}
              onBuildGame={(designDoc, summary, vibe, mechanicId) => {
                if (onBuildGame) onBuildGame(designDoc, summary, vibe, mechanicId)
              }}
              onBack={() => setStep("learn")}
            />
          </div>
        </div>
      </div>
    )}

    {/* Full-page moon card — learn step (only for available/in_progress nodes) */}
    {step === "learn" && standard && open && (!nodeStatus || nodeStatus === "available" || nodeStatus === "in_progress") && (
      <MoonCardView
        standard={standard}
        planetLabel={getPlanetLabel(standard)}
        moonName={getMoonName(standard)}
        playToMasterButton={playToMasterButton}
        onClose={onClose}
        onBuild={() => setStep("earn")}
        onImportHtml={onImportHtml ? () => onImportHtml(standard) : undefined}
      />
    )}
  </>
  )
}
