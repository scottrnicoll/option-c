"use client"

import { useState } from "react"
import type { GameDesignDoc } from "@/lib/game-types"
import { doc, setDoc, collection, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { GameIframe } from "./game-iframe"
import { MathMomentOverlay } from "./math-moment-overlay"
import { ArrowLeft, MessageCircle, X, Wrench, Pencil, RotateCcw } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { sanitizeGameHtml } from "@/lib/html-sanitizer"
import posthog from "posthog-js"

interface WorkshopProps {
  initialHtml: string
  designDoc: GameDesignDoc
  gameId: string | null
  onBackToPlanet: (html: string, gameId: string | null) => void
  onSendForReview: (html: string, gameId: string | null) => void
}

export function Workshop({
  initialHtml,
  designDoc,
  gameId,
  onBackToPlanet,
  onSendForReview,
}: WorkshopProps) {
  const { activeProfile } = useAuth()
  const [html, setHtml] = useState(initialHtml)
  const [input, setInput] = useState("")
  const [isRefining, setIsRefining] = useState(false)
  // Track whether the learner has won their own game at least once.
  // The "Send for Review" button stays disabled until they have, so we
  // know they actually understood what they built.
  const [hasWon, setHasWon] = useState(false)
  // First play is always hint mode (productive struggle)
  const [hintMode, setHintMode] = useState<"hint" | "prompt_real" | "real">("hint")
  const [hasWonHint, setHasWonHint] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  // Lock in a stable game id immediately on mount so every save (auto, back,
  // submit-for-review) refers to the SAME Firestore doc — preventing the
  // "draft + approved" duplicate that used to happen when the user clicked
  // back/submit before the first auto-save resolved.
  const [currentGameId] = useState<string>(() => gameId ?? doc(collection(db, "games")).id)
  const [mobileChat, setMobileChat] = useState(false)
  const [showMathMoment, setShowMathMoment] = useState(false)

  // Auto-save draft to Firebase. Uses the stable currentGameId (locked
  // in on mount) so every save targets the same Firestore doc. createdAt
  // and the play/rating counters are only set the FIRST time the doc is
  // created — subsequent saves just merge the editable fields.
  const saveDraft = async (rawHtml: string) => {
    const gameHtml = sanitizeGameHtml(rawHtml)
    try {
      const ref = doc(db, "games", currentGameId)
      const existing = await getDoc(ref)
      const isNew = !existing.exists()

      // Editable fields written on every save
      const update: Record<string, unknown> = {
        id: currentGameId,
        title: designDoc.title,
        designerName: activeProfile?.name || "Learner",
        authorUid: activeProfile?.uid || "",
        classId: activeProfile?.classId || "",
        standardId: designDoc.standardId,
        planetId: designDoc.planetId,
        gameHtml,
        designDoc,
        updatedAt: Date.now(),
      }

      if (isNew) {
        // First save — initialise counters and timestamps
        update.status = "draft"
        update.playCount = 0
        update.ratingSum = 0
        update.ratingCount = 0
        update.reviews = []
        update.createdAt = Date.now()
      } else {
        // Existing doc — only flip status back to "draft" if it was already
        // a draft. Don't blow away pending_review / published / needs_work.
        const data = existing.data() as { status?: string }
        if (data.status === "draft" || data.status === undefined) {
          update.status = "draft"
        }
      }

      await setDoc(ref, update, { merge: true })
    } catch {
      // Silent fail — draft saving is best-effort
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
        <button
          onClick={() => onBackToPlanet(html, currentGameId)}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Planet
        </button>
        <h2 className="text-sm font-medium text-white truncate max-w-[200px]">
          {designDoc.title}
        </h2>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Game iframe — 65% on desktop, full on mobile */}
        <div className="flex-1 md:w-[65%] md:flex-none relative">
          {/* Prompt to play for real after winning in hint mode */}
          {hintMode === "prompt_real" && (
            <div className="absolute inset-0 z-30 bg-zinc-950/90 flex items-center justify-center">
              <div className="max-w-sm text-center space-y-4 p-6">
                <p className="text-2xl font-bold text-emerald-400">Nice practice run!</p>
                <p className="text-sm text-zinc-300">Ready to play for real? Wins count this time.</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { setHintMode("real"); setIframeKey(k => k + 1) }}
                    className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors"
                  >
                    Play for real!
                  </button>
                  <button
                    onClick={() => { setHintMode("hint"); setIframeKey(k => k + 1) }}
                    className="px-6 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
                  >
                    Practice again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hint mode banner */}
          {hintMode === "hint" && (
            <div className="absolute top-0 left-0 right-0 z-20 bg-blue-600/90 text-white text-center py-1.5 text-xs font-medium">
              Practice mode — wins don&apos;t count. Hint Card is available!
            </div>
          )}

          <GameIframe
            key={iframeKey}
            html={html}
            className="w-full h-full"
            onLose={() => {
              posthog.capture("game_tested_in_workshop", { game_id: currentGameId, standard_id: designDoc.standardId, outcome: "lose", hint_mode: hintMode })
              setShowMathMoment(true)
            }}
            onWin={() => {
              posthog.capture("game_tested_in_workshop", { game_id: currentGameId, standard_id: designDoc.standardId, outcome: "win", hint_mode: hintMode })
              if (hintMode === "hint") {
                setHasWonHint(true)
                setHintMode("prompt_real")
              } else {
                setHasWon(true)
              }
            }}
          />
          {showMathMoment && (
            <MathMomentOverlay
              concept={designDoc.concept}
              onDismiss={() => setShowMathMoment(false)}
            />
          )}

          {/* Mobile panel toggle */}
          <button
            onClick={() => setMobileChat(true)}
            className="md:hidden absolute bottom-4 right-4 p-3 rounded-full bg-emerald-600 text-white shadow-lg"
          >
            <MessageCircle className="size-5" />
          </button>
        </div>

        {/* Testing Lab panel — 35% on desktop, overlay on mobile */}
        <div
          className={`${
            mobileChat
              ? "fixed inset-0 z-60 bg-zinc-950"
              : "hidden md:flex"
          } md:w-[35%] flex-col border-l border-zinc-800`}
        >
          {/* Mobile close */}
          {mobileChat && (
            <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-zinc-800">
              <span className="text-sm text-white font-medium">Game Testing Lab</span>
              <button onClick={() => setMobileChat(false)} className="text-zinc-400 hover:text-white">
                <X className="size-5" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <h3 className="text-sm font-semibold text-white">Game Testing Lab</h3>
            <p className="text-xs text-zinc-400">Play your game on the left. If something&apos;s wrong, fix it below.</p>

            {/* Fix something — category buttons */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Wrench className="size-3.5" />
                <span className="font-semibold uppercase tracking-wide">Fix something</span>
              </div>
              {isRefining ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
                  <RotateCcw className="size-5 text-emerald-400 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-zinc-300">Rebuilding your game...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { label: "Game is not showing", issue: "The game is not rendering or showing a blank screen. Regenerate the game HTML making sure it renders properly." },
                    { label: "Can't click or tap anything", issue: "The interactive elements (buttons, draggable items) are not responding to clicks or taps. Fix the event handlers and make sure all interactive elements work." },
                    { label: "Game doesn't make sense", issue: "The game logic is confusing or broken. The rounds, scoring, or win/lose conditions don't work properly. Regenerate with clearer game logic." },
                    { label: "Game gives you the answer", issue: "The game reveals the correct answer before the player solves it, or the answer is obvious without doing math. Fix so the player must figure out the answer." },
                  ].map((fix) => (
                    <button
                      key={fix.label}
                      onClick={async () => {
                        setIsRefining(true)
                        posthog.capture("fix_this_clicked", { game_id: currentGameId, issue: fix.label })
                        try {
                          const res = await fetch("/api/game/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              currentHtml: html,
                              message: fix.issue,
                              designDoc,
                              chatHistory: [],
                            }),
                          })
                          const data = await res.json()
                          if (data.html) {
                            setHtml(data.html)
                            saveDraft(data.html)
                          }
                        } catch {}
                        setIsRefining(false)
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-sm text-zinc-300 transition-colors"
                    >
                      {fix.label}
                    </button>
                  ))}
                  {/* Other — write-in */}
                  <div className="mt-1">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Other issue..."
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && input.trim()) {
                          setIsRefining(true)
                          posthog.capture("fix_this_clicked", { game_id: currentGameId, issue: "other: " + input })
                          try {
                            const res = await fetch("/api/game/chat", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                currentHtml: html,
                                message: input.trim(),
                                designDoc,
                                chatHistory: [],
                              }),
                            })
                            const data = await res.json()
                            if (data.html) { setHtml(data.html); saveDraft(data.html) }
                          } catch {}
                          setInput("")
                          setIsRefining(false)
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Change something — write-in */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Pencil className="size-3.5" />
                <span className="font-semibold uppercase tracking-wide">I want to change something</span>
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe what you want different..."
                disabled={isRefining}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none disabled:opacity-50"
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && input.trim() && !isRefining) {
                    setIsRefining(true)
                    posthog.capture("change_request", { game_id: currentGameId, request: input })
                    try {
                      const res = await fetch("/api/game/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          currentHtml: html,
                          message: input.trim(),
                          designDoc,
                          chatHistory: [],
                        }),
                      })
                      const data = await res.json()
                      if (data.html) { setHtml(data.html); saveDraft(data.html) }
                    } catch {}
                    setInput("")
                    setIsRefining(false)
                  }
                }}
              />
            </div>
          </div>

          {/* Send for Review — gated until the learner wins */}
          <div className="p-3 border-t border-zinc-700">
            <p className="text-xs text-zinc-400 text-center mb-2">
              {hasWon
                ? "Nice — you won! Submit for your guide to review."
                : "Play your game and win at least once before submitting."}
            </p>
            <button
              onClick={() => {
                posthog.capture("game_submitted_for_review", { game_id: currentGameId, standard_id: designDoc.standardId })
                onSendForReview(html, currentGameId)
              }}
              disabled={!hasWon}
              className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              title={!hasWon ? "Win your own game first" : undefined}
            >
              {hasWon ? "Send for Review" : "Win your game first"}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
