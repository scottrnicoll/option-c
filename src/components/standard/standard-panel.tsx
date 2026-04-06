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
import { Lock, CheckCircle, ChevronLeft, Trophy, Play } from "lucide-react"
import { ConceptCard } from "./concept-card"
import { GenieChat } from "./genie-chat"
import { MasteryPlay } from "./mastery-play"
import { GameIframe } from "@/components/game/game-iframe"
import { useAuth } from "@/lib/auth"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import type { Game } from "@/lib/game-types"

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

function getShortTitle(standard: StandardNode): string {
  const id = standard.id.toUpperCase()
  const domain = standard.domainCode?.toUpperCase() ?? ""

  // Map domain codes and ID patterns to short descriptors
  if (domain === "CC") return "Counting"
  if (domain === "OA") {
    if (/ADD|SUM|PLUS/i.test(standard.description)) return "Addition"
    if (/SUBTRACT|MINUS|DIFFER/i.test(standard.description)) return "Subtraction"
    if (/MULTIPLY|FACTOR|PRODUCT/i.test(standard.description)) return "Multiplication"
    if (/DIVIDE|DIVISOR|QUOTIENT/i.test(standard.description)) return "Division"
    return "Algebra"
  }
  if (domain === "NBT") return "Base Ten"
  if (domain === "NF") return "Fractions"
  if (domain === "MD") {
    if (/AREA/i.test(standard.description)) return "Area"
    if (/VOLUME/i.test(standard.description)) return "Volume"
    if (/TIME|CLOCK|HOUR/i.test(standard.description)) return "Time"
    if (/MEASURE|LENGTH|INCH|METER/i.test(standard.description)) return "Measurement"
    return "Measurement"
  }
  if (domain === "G") return "Geometry"
  if (domain === "RP") return "Ratios"
  if (domain === "NS") return "Numbers"
  if (domain === "EE") return "Equations"
  if (domain === "SP") return "Statistics"
  if (domain === "F") return "Functions"

  // HS domains
  if (id.includes("A-")) return "Algebra"
  if (id.includes("F-")) return "Functions"
  if (id.includes("G-")) return "Geometry"
  if (id.includes("N-")) return "Numbers"
  if (id.includes("S-")) return "Statistics"

  // Fallback: first 4 words of description
  const words = standard.description.split(/\s+/)
  return words.slice(0, 4).join(" ")
}

type FlowStep = "learn" | "earn" | "unlocked" | "master"

interface StandardPanelProps {
  standard: StandardNode | null
  open: boolean
  onClose: () => void
  onUnlock: (standardId: string) => void
  onMastered?: (standardId: string) => void
  onBuildGame?: (designDoc: import("@/lib/game-types").GameDesignDoc, chatHistory: string) => void
  interests?: string[]
  nodeStatus?: "locked" | "available" | "in_progress" | "unlocked" | "mastered" | "in_review"
}

export function StandardPanel({
  standard,
  open,
  onClose,
  onUnlock,
  onMastered,
  onBuildGame,
  interests,
  nodeStatus,
}: StandardPanelProps) {
  const [step, setStep] = useState<FlowStep>("learn")

  // Reset step when standard changes
  useEffect(() => {
    setStep("learn")
  }, [standard?.id])

  if (!standard) return null

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:w-[75vw] lg:w-[60vw] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-lg">{getShortTitle(standard)}</SheetTitle>
          <SheetDescription>
            {standard.description}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4">
          {(step === "earn" || step === "master") && nodeStatus !== "locked" && nodeStatus !== "mastered" && (
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
                <span>You haven't started this one yet — complete its prerequisites first.</span>
              </div>
              <ConceptCard
                standard={standard}
                onReady={() => {}}
                interests={interests}
                readOnly
              />
            </div>
          ) : nodeStatus === "unlocked" ? (
            step === "master" ? (
              <MasteryPlay
                standardId={standard.id}
                planetId={`${standard.grade}.${standard.domainCode}`}
                onMastered={() => onMastered?.(standard.id)}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle className="size-4 shrink-0" />
                  <span>You've demonstrated this concept — nice work.</span>
                </div>
                <button
                  onClick={() => setStep("master")}
                  className="w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trophy className="size-4" /> Play to Master
                </button>
                <ConceptCard
                  standard={standard}
                  onReady={() => {}}
                  interests={interests}
                  readOnly
                />
              </div>
            )
          ) : nodeStatus === "mastered" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <Trophy className="size-4 shrink-0" />
                <span>You've mastered this skill!</span>
              </div>
              <ConceptCard
                standard={standard}
                onReady={() => {}}
                interests={interests}
                readOnly
              />
            </div>
          ) : nodeStatus === "in_review" ? (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                <p className="text-amber-300 font-medium">Your game is being reviewed</p>
                <p className="text-zinc-400 text-sm mt-1">You'll unlock this skill when your game is approved.</p>
                <a
                  href="/student"
                  className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-block"
                >
                  Check status in My Stuff →
                </a>
              </div>
              <InReviewGamePreview standardId={standard.id} />
            </div>
          ) : (
            <>
              {step === "learn" && (
                <ConceptCard
                  standard={standard}
                  onReady={() => setStep("earn")}
                  interests={interests}
                />
              )}

              {step === "earn" && (
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
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
