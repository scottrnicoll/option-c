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
import { Lock, CheckCircle, ChevronLeft } from "lucide-react"
import { ConceptCard } from "./concept-card"
import { GenieChat } from "./genie-chat"

type FlowStep = "learn" | "earn" | "unlocked"

interface StandardPanelProps {
  standard: StandardNode | null
  open: boolean
  onClose: () => void
  onUnlock: (standardId: string) => void
  interests?: string[]
  nodeStatus?: "locked" | "available" | "in_progress" | "unlocked"
}

export function StandardPanel({
  standard,
  open,
  onClose,
  onUnlock,
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
          <SheetTitle className="text-lg">{standard.description}</SheetTitle>
          <SheetDescription>{standard.id} · {standard.domain}</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4">
          {step === "earn" && nodeStatus !== "locked" && nodeStatus !== "unlocked" && (
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
                <span>This concept is locked — complete its prerequisites first.</span>
              </div>
              <ConceptCard
                standard={standard}
                onReady={() => {}}
                interests={interests}
                readOnly
              />
            </div>
          ) : nodeStatus === "unlocked" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle className="size-4 shrink-0" />
                <span>You've already unlocked this concept!</span>
              </div>
              <ConceptCard
                standard={standard}
                onReady={() => {}}
                interests={interests}
                readOnly
              />
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
                  onUnlock={() => {
                    setStep("unlocked")
                    onUnlock(standard.id)
                  }}
                />
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
