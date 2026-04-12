"use client"

import { useAuth } from "@/lib/auth"
import { LearnerNav } from "@/components/learner-nav"
import { UserMenu } from "@/components/user-menu"
import { Logo } from "@/components/logo"
import { Zap } from "lucide-react"
import { CircuitBoardBuilder } from "@/components/standard/circuit-board-builder"
import type { GameDesignDoc } from "@/lib/game-types"

// Eureka / "Build NOW!" page.
// Uses the same Game Assembler as the moon pathway, but in eureka mode:
// the Game Option slot has a write-in field instead of a picker.

export default function BuildPage() {
  const { activeProfile } = useAuth()

  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Sign in to build a game!</p>
      </div>
    )
  }

  const handleBuildGame = (designDoc: GameDesignDoc, summary: string, vibe: string, mechanicId: string) => {
    // Navigate to the galaxy with the standard pre-selected to trigger the build flow
    const stdId = (designDoc as any).standardId || ""
    const gameOption = (designDoc as any).gameOption || ""
    window.location.href = `/?moon=${encodeURIComponent(stdId)}&mechanic=${encodeURIComponent(mechanicId)}&option=${encodeURIComponent(gameOption)}`
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={28} className="text-blue-400" />
            <h1 className="text-lg font-bold">Build NOW!</h1>
            <Zap className="size-4 text-emerald-400" />
          </div>
          <UserMenu />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-4">
        <LearnerNav />
        <div className="mt-4 pb-8">
          <CircuitBoardBuilder
            mode="eureka"
            learnerGrade={activeProfile.grade || "6"}
            learnerUid={activeProfile.uid}
            onBuildGame={handleBuildGame}
            onBack={() => window.history.back()}
          />
        </div>
      </div>
    </div>
  )
}
