"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, isToolUIPart, getToolName } from "ai"
import { CriteriaProgress } from "./criteria-progress"
import { cn } from "@/lib/utils"
import { Send } from "lucide-react"

interface GenieChatProps {
  standardDescription: string
  onUnlock: () => void
}

export function GenieChat({ standardDescription, onUnlock }: GenieChatProps) {
  const [criteria, setCriteria] = useState({
    playable: false,
    authentic: false,
    essential: false,
  })
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const transport = new DefaultChatTransport({
    api: "/api/chat",
    body: { standardDescription },
  })

  const { messages, sendMessage, status } = useChat({ transport })

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

  // Call onUnlock after a short delay when all criteria met
  useEffect(() => {
    if (unlocked) {
      const timer = setTimeout(() => onUnlock(), 1500)
      return () => clearTimeout(timer)
    }
  }, [unlocked, onUnlock])

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
        <p className="text-xs text-muted-foreground">
          Exchange {exchangeCount}/5
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex max-h-[360px] flex-col gap-2 overflow-y-auto rounded-lg border border-zinc-800 p-3"
      >
        {/* Initial prompt */}
        <div className="max-w-[85%] self-start rounded-lg bg-zinc-900 px-3 py-2 text-sm">
          What&apos;s your game idea? How does {standardDescription.toLowerCase()} show up in it?
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
          <div className="self-start text-xs text-muted-foreground">
            Thinking...
          </div>
        )}
      </div>

      {unlocked ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-sm text-emerald-400">
          All criteria met! Nice work — your game idea is solid.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your game idea..."
            disabled={status !== "ready"}
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none disabled:opacity-50"
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
