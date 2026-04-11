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
import { Lock, CheckCircle, ChevronLeft, Trophy, Play, X } from "lucide-react"
import Link from "next/link"
import { ConceptCard } from "./concept-card"
import { GenieChat } from "./genie-chat"
import { GameCardBuilder } from "./game-card-builder"
import type { MechanicAnimation } from "@/lib/mechanic-animations"
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

type FlowStep = "learn" | "earn" | "unlocked" | "demonstrate"

interface StandardPanelProps {
  standard: StandardNode | null
  open: boolean
  onClose: () => void
  onUnlock: (standardId: string) => void
  onDemonstrated?: (standardId: string) => void
  onBuildGame?: (designDoc: import("@/lib/game-types").GameDesignDoc, chatHistory: string, vibe?: string) => void
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
  // When the learner picks a template card, store it here and route
  // to the chip-driven TemplateChat (auto-fills theme/action/win
  // through clicks). When they pick "describe your own game", this
  // stays null and we route to the free-form GenieChat.
  const [pickedMechanic, setPickedMechanic] = useState<MechanicAnimation | null>(null)

  // Reset step when standard changes
  useEffect(() => {
    setStep("learn")
    setPickedMechanic(null)
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
                  <ConceptCard
                    standard={standard}
                    onReady={(mechanic) => {
                      if (mechanic) {
                        setPickedMechanic(mechanic)
                      } else {
                        setPickedMechanic(null)
                      }
                      setStep("earn")
                    }}
                  />
                  {/* Alternate path: skip the AI build flow and paste your own HTML */}
                  {onImportHtml && (
                    <button
                      onClick={() => onImportHtml(standard)}
                      className="w-full py-3 rounded-lg border-2 border-dashed border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 text-sm font-medium transition-colors"
                    >
                      Or paste your own HTML game →
                    </button>
                  )}
                </div>
              )}

              {/* Chat steps render as full-page overlay below */}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>

    {/* Full-page game builder — renders OUTSIDE the sheet */}
    {step === "earn" && standard && open && (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
          <div>
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wide">{getPlanetLabel(standard)}</p>
            <h2 className="text-lg font-bold text-white">{getMoonName(standard)}</h2>
          </div>
          <button
            onClick={() => setStep("learn")}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="size-4" /> Back to concept
          </button>
        </div>
        {/* Chat area — fills remaining space */}
        <div className="flex-1 min-h-0 p-4">
          {pickedMechanic ? (
            <GameCardBuilder
              mechanic={pickedMechanic}
              standardDescription={standard.description}
              standardId={standard.id}
              planetId={`${standard.grade}.${standard.domainCode}`}
              onBuildGame={(designDoc, summary, vibe) => {
                if (onBuildGame) onBuildGame(designDoc, summary, vibe)
              }}
              onBack={() => setStep("learn")}
            />
          ) : (
            <GenieChat
              standardDescription={standard.description}
              standardId={standard.id}
              planetId={`${standard.grade}.${standard.domainCode}`}
              onUnlock={() => {
                setStep("unlocked")
                onUnlock(standard.id)
              }}
              onBuildGame={onBuildGame}
            />
          )}
        </div>
      </div>
    )}

    {/* Full-page concept view — learn step */}
    {step === "learn" && standard && open && (
      <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
          <div>
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wide">{getPlanetLabel(standard)}</p>
            <h2 className="text-lg font-bold text-white">{getMoonName(standard)}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-2"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-sm text-zinc-400">{standard.description}</p>
            {playToMasterButton}
            <ConceptCard
              standard={standard}
              onReady={(mechanic) => {
                if (mechanic) {
                  setPickedMechanic(mechanic)
                } else {
                  setPickedMechanic(null)
                }
                setStep("earn")
              }}
            />
            {onImportHtml && (
              <button onClick={() => onImportHtml(standard)}
                className="w-full py-3 rounded-lg border-2 border-dashed border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 text-sm font-medium transition-colors">
                Or paste your own HTML game →
              </button>
            )}
          </div>
        </div>
      </div>
    )}
  </>
  )
}
