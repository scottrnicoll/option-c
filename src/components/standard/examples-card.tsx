"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ExamplesCardProps {
  standardId: string
  standardDescription: string
  grade: string
  interests?: string[]
  onReady: () => void
}

interface GameExample {
  game: string
  explanation: string
}

export function ExamplesCard({ standardId, standardDescription, grade, interests, onReady }: ExamplesCardProps) {
  const [examples, setExamples] = useState<GameExample[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch("/api/examples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        standardId,
        description: standardDescription,
        grade,
        interests,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.examples)) setExamples(data.examples)
      })
      .catch(() => setExamples(null))
      .finally(() => setLoading(false))
  }, [standardId, standardDescription, grade, interests])

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Where you've seen this</h3>
      <p className="text-sm text-muted-foreground">
        This math concept shows up in games and apps you might already know.
      </p>

      {loading ? (
        <div className="space-y-3">
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-500">Finding real examples...</p>
          </div>
          <div className="h-16 bg-zinc-700/30 rounded-lg animate-pulse" />
          <div className="h-16 bg-zinc-700/30 rounded-lg animate-pulse" />
          <div className="h-16 bg-zinc-700/30 rounded-lg animate-pulse" />
        </div>
      ) : examples ? (
        <div className="flex flex-col gap-3">
          {examples.map((ex, i) => (
            <Card key={i}>
              <CardContent className="pt-3 pb-3">
                <p className="text-sm font-medium text-zinc-200 mb-1">{ex.game}</p>
                <p className="text-sm text-muted-foreground">{ex.explanation}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Couldn't load examples — but you can still share your game idea!</p>
      )}

      <Button onClick={onReady} size="lg" className="w-full">
        I have a game idea →
      </Button>
    </div>
  )
}
