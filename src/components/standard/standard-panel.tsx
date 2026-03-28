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
}

export function StandardPanel({
  standard,
  open,
  onClose,
  onUnlock,
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
          <SheetTitle>{standard.description}</SheetTitle>
          <SheetDescription>{standard.id} &middot; {standard.domain}</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4">
          {step === "learn" && (
            <ConceptCard
              standard={standard}
              onReady={() => setStep("examples")}
            />
          )}

          {step === "examples" && (
            <ExamplesCard
              standardDescription={standard.description}
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
