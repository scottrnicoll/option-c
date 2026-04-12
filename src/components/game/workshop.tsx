"use client"

import { useState, useRef, useEffect } from "react"
import type { GameDesignDoc } from "@/lib/game-types"
import { doc, setDoc, collection, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { GameIframe } from "./game-iframe"
import { MathMomentOverlay } from "./math-moment-overlay"
import { Send, ArrowLeft, MessageCircle, X } from "lucide-react"
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

interface ChatMessage {
  role: "user" | "assistant"
  text: string
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: `Your game "${designDoc.title}" is ready! Play it on the left, then tell me what you want to change.`,
    },
  ])
  const [input, setInput] = useState("")
  const [isRefining, setIsRefining] = useState(false)
  // Track whether the learner has won their own game at least once.
  // The "Send for Review" button stays disabled until they have, so we
  // know they actually understood what they built.
  const [hasWon, setHasWon] = useState(false)
  // Lock in a stable game id immediately on mount so every save (auto, back,
  // submit-for-review) refers to the SAME Firestore doc — preventing the
  // "draft + approved" duplicate that used to happen when the user clicked
  // back/submit before the first auto-save resolved.
  const [currentGameId] = useState<string>(() => gameId ?? doc(collection(db, "games")).id)
  const [mobileChat, setMobileChat] = useState(false)
  const [showMathMoment, setShowMathMoment] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const hasInteracted = useRef(false)

  // Auto-scroll chat
  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [chatMessages])

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

  const handleSend = async () => {
    if (!input.trim() || isRefining) return
    hasInteracted.current = true

    const userMessage = input.trim()
    setInput("")
    setChatMessages((prev) => [...prev, { role: "user", text: userMessage }])
    setIsRefining(true)

    try {
      const res = await fetch("/api/game/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentHtml: html,
          message: userMessage,
          designDoc,
          chatHistory: chatMessages,
        }),
      })
      const data = await res.json()

      if (data.html) {
        setHtml(data.html)
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.reply || "Done! I updated the game. Take a look." },
        ])
        saveDraft(data.html)
      } else if (data.reply) {
        // AI answered a question without changing the game
        setChatMessages((prev) => [...prev, { role: "assistant", text: data.reply }])
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", text: "Something went wrong. Try describing the change differently." },
        ])
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Connection error. Please try again.",
        },
      ])
    } finally {
      setIsRefining(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend()
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
          <GameIframe
            html={html}
            className="w-full h-full"
            onLose={() => setShowMathMoment(true)}
            onWin={() => setHasWon(true)}
          />
          {showMathMoment && (
            <MathMomentOverlay
              concept={designDoc.concept}
              onDismiss={() => setShowMathMoment(false)}
            />
          )}

          {/* Mobile chat toggle */}
          <button
            onClick={() => setMobileChat(true)}
            className="md:hidden absolute bottom-4 right-4 p-3 rounded-full bg-emerald-600 text-white shadow-lg"
          >
            <MessageCircle className="size-5" />
          </button>
        </div>

        {/* Chat panel — 35% on desktop, overlay on mobile */}
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
              <span className="text-sm text-white font-medium">Refine</span>
              <button
                onClick={() => setMobileChat(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
          )}

          {/* Chat messages */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "self-end ml-auto bg-zinc-800 text-zinc-100"
                    : "bg-zinc-900 text-zinc-300"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isRefining && (
              <div className="text-sm text-zinc-400 animate-pulse">Thinking...</div>
            )}
          </div>

          {/* Chat input */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-zinc-800"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What should I change?"
                disabled={isRefining}
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isRefining || !input.trim()}
                className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-50 transition-colors"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>

          {/* Send for Review — gated until the learner wins their own game */}
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
              {hasWon ? "Send for Review" : "🔒 Win your game first"}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
