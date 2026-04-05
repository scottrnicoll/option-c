"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { StandardNode } from "@/lib/graph-types"
import { matchMechanics } from "@/lib/mechanic-animations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Volume2, VolumeX } from "lucide-react"

type ReadingLevel = "simpler" | "default" | "challenge"

interface Explanation {
  whatIsThis: string
  commonMistakes: string | string[]
  realWorldUse: string
  formula?: string
}

function ConceptIllustration({ description, grade }: { description: string; grade: string }) {
  const [svg, setSvg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch("/api/illustrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, grade }),
    })
      .then(res => res.text())
      .then(text => {
        if (text.includes("<svg")) setSvg(text)
        else setSvg(null)
      })
      .catch(() => setSvg(null))
      .finally(() => setLoading(false))
  }, [description, grade])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-2 bg-zinc-800/30 rounded-lg">
        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-300">Drawing a picture...</p>
      </div>
    )
  }

  if (!svg) return null

  return (
    <div
      className="rounded-lg overflow-hidden border border-zinc-800"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

function GameMechanics({ description, domainCode }: {
  standardId: string; description: string; grade: string; interests?: string[]; domainCode: string
}) {
  const matched = useMemo(() => matchMechanics(description, domainCode), [description, domainCode])

  if (matched.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-300 font-medium">Game mechanics that use this math</p>
      <div className="grid grid-cols-3 gap-2">
        {matched.map((m) => (
          <div key={m.id} className="flex flex-col items-center gap-1">
            <div className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 w-full">
              {m.svg}
            </div>
            <p className="text-xs text-zinc-400 text-center leading-tight">{m.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function InterestInput({ onSubmit }: { onSubmit: (interest: string) => void }) {
  const [value, setValue] = useState("")
  const [expanded, setExpanded] = useState(false)

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="px-4 py-2 text-sm rounded-full border border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
      >
        Explain it using something I'm into...
      </button>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (value.trim()) {
          onSubmit(value.trim())
          setValue("")
          setExpanded(false)
        }
      }}
      className="flex gap-2 w-full"
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="basketball, Roblox, cooking..."
        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="px-3 py-2 text-sm rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 disabled:opacity-30 transition-colors"
      >
        Go
      </button>
    </form>
  )
}

interface ConceptCardProps {
  standard: StandardNode
  onReady: () => void
  interests?: string[]
  readOnly?: boolean
}

export function ConceptCard({ standard, onReady, interests, readOnly }: ConceptCardProps) {
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>(
    interests && interests.length > 0 ? "challenge" : "default"
  )
  const [showIllustration, setShowIllustration] = useState(false)
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [loading, setLoading] = useState(true)
  const [customInterest, setCustomInterest] = useState<string | null>(
    interests && interests.length > 0 ? interests[0] : null
  )
  const [labelFlipped, setLabelFlipped] = useState(false)
  const [speaking, setSpeaking] = useState(false)

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
          interests: customInterest ? [customInterest] : (interests ?? []),
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
  }, [standard.id, standard.description, standard.grade, interests, customInterest])

  // Fetch on mount and when level changes
  useEffect(() => {
    fetchExplanation(readingLevel)
  }, [readingLevel, fetchExplanation])

  const handleLevelChange = (level: ReadingLevel) => {
    if (level !== readingLevel) {
      setReadingLevel(level)
    }
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
          {/* Peelable standard ID label */}
          <button
            onClick={() => setLabelFlipped(f => !f)}
            className="group relative px-2 py-1 rounded text-xs border border-dashed border-zinc-600 text-zinc-400 hover:border-zinc-400 hover:text-zinc-200 transition-colors"
            title="Show standard code"
          >
            {labelFlipped ? standard.id : "📋 Standard"}
          </button>
          {/* Read aloud button */}
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
            <p className="text-sm text-zinc-400 animate-pulse">
              Writing an explanation just for you...
            </p>
          </div>
          <div className="h-20 bg-zinc-700/30 rounded-lg animate-pulse" />
          <div className="h-14 bg-zinc-700/30 rounded-lg animate-pulse" />
          <div className="h-14 bg-zinc-700/30 rounded-lg animate-pulse" />
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
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-400">Formula</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-mono text-amber-200">{explanation.formula}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Watch out for</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {(Array.isArray(explanation.commonMistakes)
                  ? explanation.commonMistakes
                  : explanation.commonMistakes.split("|").map(s => s.trim())
                ).filter(s => s.length > 0).map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5 shrink-0">•</span>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Where you'll use this</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {explanation.realWorldUse}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Stick figure illustration */}
      {!showIllustration ? (
        <button
          onClick={() => setShowIllustration(true)}
          className="w-full py-3 text-sm rounded-lg border border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors flex items-center justify-center gap-2"
        >
          <Pencil className="size-4" /> Show me what this looks like
        </button>
      ) : (
        <ConceptIllustration description={standard.description} grade={standard.grade} />
      )}

      {/* Game mechanics */}
      {!readOnly && (
        <GameMechanics
          standardId={standard.id}
          description={standard.description}
          grade={standard.grade}
          interests={customInterest ? [customInterest] : interests}
          domainCode={standard.domainCode}
        />
      )}

      {/* Reading level adjustment */}
      <div className="flex flex-col items-center gap-2">
        {readingLevel === "default" && (
          <button
            onClick={() => handleLevelChange("simpler")}
            className="px-4 py-2 text-sm rounded-full border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors"
          >
            I don't get it — say it simpler
          </button>
        )}
        {readingLevel === "simpler" && (
          <button
            onClick={() => handleLevelChange("default")}
            className="px-4 py-2 text-sm rounded-full border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
          >
            OK I think I get it — show me the normal version
          </button>
        )}
        {readingLevel !== "challenge" && (
          <InterestInput
            onSubmit={(interest) => {
              setCustomInterest(interest)
              handleLevelChange("challenge")
            }}
          />
        )}
        {readingLevel === "challenge" && (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => { setCustomInterest(null); handleLevelChange("default") }}
              className="px-4 py-2 text-sm rounded-full border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
            >
              Show me the regular version
            </button>
            <InterestInput
              onSubmit={(interest) => {
                setCustomInterest(interest)
                setReadingLevel("default")
                setTimeout(() => setReadingLevel("challenge"), 50)
              }}
            />
          </div>
        )}
      </div>

      {!readOnly && (
        <Button onClick={onReady} size="lg" className="w-full">
          I have a game idea →
        </Button>
      )}
    </div>
  )
}
