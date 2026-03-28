"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Check, Circle } from "lucide-react"

interface CriteriaProgressProps {
  criteria: {
    playable: boolean
    authentic: boolean
    essential: boolean
  }
}

const criteriaLabels = [
  { key: "playable" as const, label: "Others can play it" },
  { key: "authentic" as const, label: "Real-world math" },
  { key: "essential" as const, label: "Math helps you win" },
]

export function CriteriaProgress({ criteria }: CriteriaProgressProps) {
  const metCount = [criteria.playable, criteria.authentic, criteria.essential].filter(Boolean).length

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {criteriaLabels.map(({ key, label }) => {
          const met = criteria[key]
          return (
            <Badge
              key={key}
              variant={met ? "default" : "outline"}
              className={cn(
                "transition-all duration-500",
                met
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                  : "border-zinc-700 text-zinc-500"
              )}
            >
              {met ? (
                <Check className="mr-1 size-3" />
              ) : (
                <Circle className="mr-1 size-3" />
              )}
              {label}
            </Badge>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">{metCount}/3 criteria met</p>
    </div>
  )
}
