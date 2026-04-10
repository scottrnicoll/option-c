"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { StandardNode } from "@/lib/graph-types"
import { matchMechanics } from "@/lib/mechanic-animations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Volume2, VolumeX, Sparkles } from "lucide-react"

interface Template {
  title: string
  description: string
  examples: string[]
  // Pre-generated chip menus for the chat-with-chips flow. These come
  // from /api/templates and are passed up to the standard panel when
  // the learner clicks a template card.
  themeChips?: string[]
  actionChips?: string[]
  winChips?: string[]
}

type ReadingLevel = "simpler" | "default" | "challenge"

interface Explanation {
  whatIsThis: string
  commonMistakes: string | string[]
  realWorldUse: string
  formula?: string
}

// Stick-figure example animation. Always shows whenever a mechanic
// matches the standard — even on locked / readOnly moons — because
// it's educational regardless of whether the learner can build a
// game right now. Renders at ~1/3 the previous on-screen size so
// the moon panel doesn't get dominated by it.
function MechanicExample({ standard }: { standard: StandardNode }) {
  const topMechanic = useMemo(() => {
    const matched = matchMechanics(standard.description, standard.domainCode)
    return matched[0] ?? null
  }, [standard.description, standard.domainCode])

  if (!topMechanic) return null

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">
        Example
      </p>
      {/* SVGs use viewBox 180×120 (3:2). Wrapper is a fixed 300×200
          box so the dangerousSvg helper's height:100% has a real
          height to fill. Inline style is more reliable than Tailwind's
          aspect-ratio bracket notation in Tailwind 4. */}
      <div
        className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900"
        style={{ width: 300, height: 200 }}
      >
        {topMechanic.svg}
      </div>
    </div>
  )
}

// Game-mechanic templates — generic player-action blueprints with
// example worlds the kid could place the mechanic in. The learner picks
// a template and then fills in the theme themselves in the chat.
//
// Note: the matched stick-figure animation is rendered separately by
// MechanicExample (above) so it always appears, even when this whole
// templates section is hidden (locked moons, readOnly mode, or template
// API failure).
function GameTemplates({
  standard,
  onPick,
  selectedTemplate,
  onSelect,
  readOnly,
}: {
  standard: StandardNode
  onPick: (template: Template) => void
  selectedTemplate: Template | null
  onSelect: (template: Template | null) => void
  // readOnly = the moon is locked / in_review / already mastered. Show
  // the templates so the learner can SEE what's possible, but disable
  // the build buttons (rendered as a "Locked" pill instead).
  readOnly?: boolean
}) {
  const [templates, setTemplates] = useState<Template[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        standardId: standard.id,
        description: standard.description,
        grade: standard.grade,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (Array.isArray(data?.templates) && data.templates.length > 0) {
          setTemplates(data.templates as Template[])
        } else {
          setError(true)
        }
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [standard.id, standard.description, standard.grade])

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-zinc-300 font-medium flex items-center gap-1.5">
          <Sparkles className="size-4 text-blue-400" />
          Game ideas
        </p>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 bg-zinc-800/50 border border-zinc-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error || !templates || templates.length === 0) {
    // Fall back silently — the "describe your own game" link below
    // still works as an escape hatch.
    return null
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-300 font-medium flex items-center gap-1.5">
        <Sparkles className="size-4 text-blue-400" />
        Game ideas
      </p>
      <p className="text-xs text-zinc-500 -mt-1">
        Pick the basic player action of your game. You&apos;ll decide the specifics in the next step.
      </p>

      <div className="space-y-2">
        {templates.map((t, i) => {
          const isSelected = selectedTemplate?.title === t.title
          if (readOnly) {
            return (
              <div key={i} className="w-full text-left bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 opacity-75">
                <p className="text-sm font-bold text-white">{t.title}</p>
                <p className="text-xs text-zinc-300 mt-1 leading-snug">{t.description}</p>
                {t.examples.length > 0 && (
                  <p className="text-[11px] text-zinc-500 mt-2 leading-snug">
                    <span className="text-zinc-600">You could build:</span> {t.examples.join(" · ")}
                  </p>
                )}
              </div>
            )
          }
          return (
            <button
              key={i}
              onClick={() => onSelect(isSelected ? null : t)}
              className={`w-full text-left rounded-xl p-3 transition-all border-2 ${
                isSelected
                  ? "bg-blue-500/10 border-blue-500/60"
                  : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <p className={`text-sm font-bold ${isSelected ? "text-blue-300" : "text-white"}`}>{t.title}</p>
              <p className="text-xs text-zinc-300 mt-1 leading-snug">{t.description}</p>
              {t.examples.length > 0 && (
                <p className="text-[11px] text-zinc-500 mt-2 leading-snug">
                  <span className="text-zinc-600">You could build:</span> {t.examples.join(" · ")}
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface ConceptCardProps {
  standard: StandardNode
  // onReady is called when the learner is ready to start building. If
  // they picked a template card, the full template is passed (so the
  // panel can route to the chip-driven TemplateChat). If they hit
  // "describe your own game", template is undefined and the panel
  // routes to the free-form GenieChat.
  onReady: (template?: Template) => void
  readOnly?: boolean
}

export function ConceptCard({ standard, onReady, readOnly }: ConceptCardProps) {
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>("default")
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  const [loading, setLoading] = useState(true)
  const [labelFlipped, setLabelFlipped] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
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
              Loading...
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

          {/* Stick-figure example animation. Sits right after "What is this?"
              and before the formula so kids see the verb early — before the
              technical math details. Always renders if a mechanic matches,
              even on locked / read-only moons. */}
          <MechanicExample standard={standard} />

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
              <CardTitle className="text-sm">Where you&apos;ll use this</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {explanation.realWorldUse}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Reading level adjustment — appears right after the explanation */}
      <div className="flex flex-col items-center gap-2">
        {readingLevel === "default" && (
          <button
            onClick={() => handleLevelChange("simpler")}
            className="px-4 py-2 text-sm rounded-full border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors"
          >
            I don&apos;t get it — say it simpler
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
      </div>

      {/* Game templates — generic mechanic blueprints with examples.
          Now also rendered on read-only moons (with disabled "Locked"
          buttons instead of Build) so the learner can preview what
          they could build, even before unlocking. */}
      <GameTemplates
        standard={standard}
        onPick={(template) => onReady(template)}
        selectedTemplate={selectedTemplate}
        onSelect={setSelectedTemplate}
        readOnly={readOnly}
      />

      {!readOnly && (
        <div className="flex gap-2">
          <Button
            onClick={() => onReady(selectedTemplate || undefined)}
            size="lg"
            className={`flex-[2] text-white transition-all ${
              selectedTemplate
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            {selectedTemplate ? `Build "${selectedTemplate.title}" →` : "I have my own game idea →"}
          </Button>
        </div>
      )}
    </div>
  )
}
