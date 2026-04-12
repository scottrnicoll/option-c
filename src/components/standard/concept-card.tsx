"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { StandardNode } from "@/lib/graph-types"
import { matchMechanics, type MechanicAnimation } from "@/lib/mechanic-animations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Volume2, VolumeX, Sparkles } from "lucide-react"
import posthog from "posthog-js"

type ReadingLevel = "simpler" | "default" | "challenge"

interface Explanation {
  whatIsThis: string
  commonMistakes: string | string[]
  realWorldUse: string
  formula?: string
}

interface ConceptCardProps {
  standard: StandardNode
  // onReady is called when the learner picks a mechanic (or clicks "I have my own idea").
  // If they picked a mechanic, it's passed so the parent can route to the card builder.
  // If they click "I have my own idea", mechanic is undefined and we go to GenieChat.
  onReady: (mechanic?: MechanicAnimation) => void
  readOnly?: boolean
}

export function ConceptCard({ standard, onReady, readOnly }: ConceptCardProps) {
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>("default")
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [loading, setLoading] = useState(true)
  const [labelFlipped, setLabelFlipped] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [selectedMechanic, setSelectedMechanic] = useState<MechanicAnimation | null>(null)

  // Match mechanics for this standard
  const mechanics = useMemo(
    () => matchMechanics(standard.description, standard.domainCode),
    [standard.description, standard.domainCode]
  )

  const fetchExplanation = useCallback(async (level: ReadingLevel) => {
    setLoading(true)
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standardId: standard.id,
          description: standard.description,
          grade: standard.grade,
          readingLevel: level,
        }),
      })
      const data = await res.json()
      setExplanation(data)
    } catch {
      setExplanation({
        whatIsThis: standard.description,
        commonMistakes: "Take your time with this one — it's worth understanding well.",
        realWorldUse: "You'll use this in real life more than you think!",
      })
    } finally {
      setLoading(false)
    }
  }, [standard.id, standard.description, standard.grade])

  useEffect(() => {
    fetchExplanation(readingLevel)
  }, [readingLevel, fetchExplanation])

  const handleLevelChange = (level: ReadingLevel) => {
    if (level !== readingLevel) setReadingLevel(level)
  }

  const handleReadAloud = () => {
    if (!explanation) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const mistakes = Array.isArray(explanation.commonMistakes)
      ? explanation.commonMistakes.join(". ")
      : explanation.commonMistakes.replace(/[•|]/g, "")
    const text = [
      explanation.whatIsThis,
      explanation.formula ? `Formula: ${explanation.formula}` : "",
      mistakes,
      explanation.realWorldUse,
    ].filter(Boolean).join(". ")
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header: domain badge + standard ID label + read aloud */}
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="text-xs">
          {standard.domain}
        </Badge>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLabelFlipped(f => !f)}
            className="group relative px-2 py-1 rounded text-xs border border-dashed border-zinc-600 text-zinc-400 hover:border-zinc-400 hover:text-zinc-200 transition-colors"
            title="Show standard code"
          >
            {labelFlipped ? standard.id : "📋 Standard"}
          </button>
          <button
            onClick={handleReadAloud}
            disabled={loading}
            className={`p-1.5 rounded border transition-colors ${
              speaking
                ? "border-blue-500/50 text-blue-400 bg-blue-500/10"
                : "border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500"
            } disabled:opacity-30`}
            title={speaking ? "Stop reading" : "Read aloud"}
          >
            {speaking ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-400 animate-pulse">Loading...</p>
          </div>
        </div>
      ) : explanation ? (
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">What is this?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {explanation.whatIsThis}
              </p>
            </CardContent>
          </Card>

          {explanation.formula && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-4">
                <p className="text-sm font-mono text-amber-300 text-center">
                  {explanation.formula}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Watch out for</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(explanation.commonMistakes) ? (
                <ul className="space-y-1">
                  {explanation.commonMistakes.map((m, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-amber-500 shrink-0">•</span>
                      {m}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {explanation.commonMistakes}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Where you&apos;ll use this</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {explanation.realWorldUse}
              </p>
            </CardContent>
          </Card>

          {/* Reading level switcher */}
          <div className="flex justify-center">
            <button
              onClick={() => handleLevelChange("simpler")}
              className={`px-3 py-1.5 rounded-l-lg text-xs border transition-colors ${
                readingLevel === "simpler"
                  ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                  : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              I don&apos;t get it — say it simpler
            </button>
            <button
              onClick={() => handleLevelChange("challenge")}
              className={`px-3 py-1.5 rounded-r-lg text-xs border-t border-b border-r transition-colors ${
                readingLevel === "challenge"
                  ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                  : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Challenge me
            </button>
          </div>
        </div>
      ) : null}

      {/* Game mechanics — each with its stick figure */}
      {mechanics.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-300 font-medium flex items-center gap-1.5">
            <Sparkles className="size-4 text-blue-400" />
            Choose the game mechanic
          </p>
          <p className="text-xs text-zinc-500 -mt-1">
            Each mechanic has the math built in. Pick one and you&apos;ll customize it next.
          </p>

          <div className="space-y-2">
            {mechanics.map((m) => {
              const isSelected = selectedMechanic?.id === m.id
              if (readOnly) {
                return (
                  <div key={m.id} className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 opacity-75 flex gap-3">
                    <div className="w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-zinc-800">
                      {m.svg}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{m.title}</p>
                      <p className="text-xs text-zinc-300 mt-0.5">{m.description}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{m.mathDomain}</p>
                    </div>
                  </div>
                )
              }
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (!isSelected) posthog.capture("mechanic_selected", { mechanic_id: m.id, mechanic_title: m.title, standard_id: standard.id })
                    setSelectedMechanic(isSelected ? null : m)
                  }}
                  className={`w-full text-left rounded-xl p-3 transition-all border-2 flex gap-3 ${
                    isSelected
                      ? "bg-blue-500/10 border-blue-500/60"
                      : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="w-28 h-20 shrink-0 rounded-lg overflow-hidden bg-zinc-800">
                    {m.svg}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${isSelected ? "text-blue-300" : "text-white"}`}>{m.title}</p>
                    <p className="text-xs text-zinc-300 mt-0.5">{m.description}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{m.mathDomain}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Build buttons */}
      {!readOnly && (
        <div className="flex gap-2">
          <Button
            onClick={() => onReady(selectedMechanic || undefined)}
            size="lg"
            disabled={!selectedMechanic}
            className="flex-[2] text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {selectedMechanic ? `${selectedMechanic.title} →` : "Pick a game mechanic above"}
          </Button>
          <Button
            onClick={() => onReady()}
            size="lg"
            variant="outline"
            className="text-zinc-300 border-zinc-700 hover:border-zinc-500"
          >
            I have my own idea →
          </Button>
        </div>
      )}
    </div>
  )
}
