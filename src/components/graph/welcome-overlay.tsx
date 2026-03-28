"use client"

import { Button } from "@/components/ui/button"

export function WelcomeOverlay({ availableCount, onDismiss }: { availableCount: number; onDismiss: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm">
      <div className="max-w-md text-center space-y-4 p-8">
        <h1 className="text-2xl font-bold text-zinc-100">Welcome to your galaxy</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Every dot is a math concept. The bright ones are yours to explore —
          pick one, learn it, then prove you can use it by designing a game.
        </p>
        <p className="text-zinc-500 text-xs">
          You have <span className="text-blue-400 font-bold">{availableCount}</span> concepts ready to explore.
          Unlock more by completing the ones that glow.
        </p>
        <Button onClick={onDismiss} className="mt-4">
          Let&apos;s go →
        </Button>
      </div>
    </div>
  )
}
