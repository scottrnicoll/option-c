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
import { ConceptCard } from "./concept-card"
import { ExamplesCard } from "./examples-card"
import { GenieChat } from "./genie-chat"

type FlowStep = "learn" | "examples" | "earn" | "unlocked"

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
      <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{standard.id.split(".").pop() || standard.id}</SheetTitle>
          <SheetDescription>{standard.id} &middot; {standard.domain}</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4">
          {step !== "learn" && nodeStatus !== "locked" && nodeStatus !== "unlocked" && (
            <button
              onClick={() => {
                if (step === "examples") setStep("learn")
                else if (step === "earn") setStep("examples")
              }}
              className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 mb-3 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 12L6 8l4-4" />
              </svg>
              Back
            </button>
          )}

          {nodeStatus === "locked" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <span>🔒</span>
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
                <span>✓</span>
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
                  onReady={() => setStep("examples")}
                  interests={interests}
                />
              )}

              {step === "examples" && (
                <ExamplesCard
                  standardId={standard.id}
                  standardDescription={standard.description}
                  grade={standard.grade}
                  interests={interests}
                  onReady={() => setStep("earn")}
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
