"use client"

import { useState, useEffect } from "react"

interface ExamplesCardProps {
  standardId: string
  standardDescription: string
  grade: string
  interests?: string[]
  onReady: () => void
}

interface GameInspo {
  emoji: string
  mechanic: string
  hook: string
  example: string
}

export function ExamplesCard({ standardId, standardDescription, grade, interests, onReady }: ExamplesCardProps) {
  const [inspos, setInspos] = useState<GameInspo[] | null>(null)
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
        if (Array.isArray(data.inspos)) setInspos(data.inspos)
      })
      .catch(() => setInspos(null))
      .finally(() => setLoading(false))
  }, [standardId, standardDescription, grade, interests])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Game ideas to inspire you</h3>
        <p className="text-xs text-zinc-500">
          Pick one that sparks an idea — or come up with your own!
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-zinc-500">Dreaming up game ideas...</p>
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-zinc-700/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : inspos ? (
        <div className="flex flex-col gap-3">
          {inspos.map((inspo, i) => (
            <button
              key={i}
              onClick={onReady}
              className="group text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{inspo.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                    {inspo.mechanic}
                  </p>
                  <p className="text-xs text-blue-400 mt-0.5">{inspo.hook}</p>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{inspo.example}</p>
                </div>
                <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors mt-1 text-xs shrink-0">
                  Try this →
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Couldn't load ideas — but tell the Genie your own!</p>
      )}

      <button
        onClick={onReady}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-2"
      >
        I already have my own idea →
      </button>
    </div>
  )
}
