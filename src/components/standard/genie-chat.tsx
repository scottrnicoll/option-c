"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, isToolUIPart, getToolName } from "ai"
import { CriteriaProgress } from "./criteria-progress"
import { cn } from "@/lib/utils"
import { Send, Loader2 } from "lucide-react"

interface GenieChatProps {
  standardDescription: string
  standardId?: string
  planetId?: string
  // Optional pre-filled first message — used by the personalized pitch
  // cards on the concept screen. When set, it auto-sends on mount as
  // the learner's opening turn so the chat starts with their pitch.
  seedMessage?: string
  onUnlock: () => void
  onBuildGame?: (designDoc: import("@/lib/game-types").GameDesignDoc, chatHistory: string) => void
}

export function GenieChat({ standardDescription, standardId, planetId, seedMessage, onUnlock, onBuildGame }: GenieChatProps) {
  const [criteria, setCriteria] = useState({
    playable: false,
    authentic: false,
    essential: false,
  })
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const transport = new DefaultChatTransport({
    api: "/api/chat",
    body: { standardDescription },
  })

  const { messages, sendMessage, status } = useChat({ transport })

  // Auto-send the seed message (from a pitch card click) as the first
  // user turn. We track this with a ref so it only fires once even if
  // status changes flap on mount. The seed appears in the chat as the
  // learner's own message — they can immediately follow up to refine.
  const seedSentRef = useRef(false)
  useEffect(() => {
    if (seedSentRef.current) return
    if (!seedMessage) return
    if (status !== "ready") return
    seedSentRef.current = true
    sendMessage({ text: seedMessage })
  }, [seedMessage, status, sendMessage])

  // Count user messages as exchanges
  const exchangeCount = messages.filter((m) => m.role === "user").length

  // Extract criteria from tool parts
  useEffect(() => {
    for (const message of messages) {
      for (const part of message.parts) {
        if (
          isToolUIPart(part) &&
          getToolName(part) === "evaluate_criteria" &&
          part.state === "output-available"
        ) {
          const result = part.output as {
            criteria: { playable: boolean; authentic: boolean; essential: boolean }
            allMet: boolean
          }
          setCriteria(result.criteria)
          if (result.allMet && !unlocked) {
            setUnlocked(true)
          }
        }
      }
    }
  }, [messages, unlocked])

  // No longer auto-unlock — student clicks the launch button instead

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status !== "ready") return
    sendMessage({ text: input })
    setInput("")
  }

  return (
    <div className="flex flex-col gap-3">
      <CriteriaProgress criteria={criteria} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-300">
          Exchange {exchangeCount}/5
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex max-h-[360px] flex-col gap-2 overflow-y-auto rounded-lg border border-zinc-800 p-3"
      >
        {/* Initial prompt */}
        <div className="max-w-[85%] self-start rounded-lg bg-zinc-900 px-3 py-2 text-sm">
          What&apos;s your game idea? How does this math concept show up in it? (Math concept: {standardDescription})
        </div>

        {messages.map((message) => {
          const textParts = message.parts.filter(
            (part) => part.type === "text" && part.text.trim()
          )
          if (textParts.length === 0) return null

          return (
            <div
              key={message.id}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                message.role === "user"
                  ? "self-end bg-zinc-800 text-zinc-100"
                  : "self-start bg-zinc-900 text-zinc-300"
              )}
            >
              {textParts.map((part, i) =>
                part.type === "text" ? <p key={i}>{part.text}</p> : null
              )}
            </div>
          )
        })}

        {status !== "ready" && (
          <div className="self-start text-sm text-zinc-300">
            Thinking...
          </div>
        )}
      </div>

      {unlocked ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-sm text-emerald-400">
            All 3 criteria met. When you're ready, hit the button below.
          </div>
          <button
            onClick={async () => {
              if (onBuildGame) {
                setIsExtracting(true)
                try {
                  // Extract chat history as text
                  const chatText = messages
                    .map((m) => {
                      const texts = m.parts
                        .filter((p) => p.type === "text" && p.text.trim())
                        .map((p) => (p.type === "text" ? p.text : ""))
                      return `${m.role}: ${texts.join(" ")}`
                    })
                    .join("\n")

                  // Call design-doc extraction API
                  const res = await fetch("/api/game/design-doc", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      chatHistory: chatText,
                      standardId: standardId || "",
                      standardDescription,
                      planetId: planetId || "",
                    }),
                  })
                  const designDoc = await res.json()
                  onBuildGame(designDoc, chatText)
                } catch {
                  // Fall back to unlock if extraction fails
                  onUnlock()
                } finally {
                  setIsExtracting(false)
                }
              } else {
                onUnlock()
              }
            }}
            disabled={isExtracting}
            className="w-full py-3 text-base font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-70"
          >
            {isExtracting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Preparing...
              </span>
            ) : (
              <>Build my Game &rarr;</>
            )}
          </button>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Or keep refining your idea..."
              disabled={status !== "ready"}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-600 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status !== "ready" || !input.trim()}
              className="rounded-lg bg-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your game idea..."
            disabled={status !== "ready"}
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-600 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status !== "ready" || !input.trim()}
            className="rounded-lg bg-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </form>
      )}
    </div>
  )
}
