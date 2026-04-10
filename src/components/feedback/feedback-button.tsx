"use client"

import { useState, useRef } from "react"
import { MessageSquarePlus, X, Send, Camera, Link2 } from "lucide-react"
import { collection, doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth"
import type { FeedbackType, FeedbackDoc } from "@/lib/feedback-types"

interface FeedbackButtonProps {
  // If set, the message goes to this game's author instead of the admin
  targetGame?: { id: string; title: string; authorUid: string }
}

export function FeedbackButton({ targetGame }: FeedbackButtonProps) {
  const { activeProfile } = useAuth()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>("improvement")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [capturingScreenshot, setCapturingScreenshot] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Current page URL is auto-captured when the form opens
  const pageUrl = typeof window !== "undefined" ? window.location.href : ""

  const handleScreenshot = async () => {
    setCapturingScreenshot(true)
    try {
      // Try using the native screen capture API
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("No canvas context")

      // Use html2canvas-style approach: capture via media stream
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "browser" } as any })
      const video = document.createElement("video")
      video.srcObject = stream
      await video.play()

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      stream.getTracks().forEach(t => t.stop())

      // Compress to JPEG, max 800px wide
      const maxW = 800
      if (canvas.width > maxW) {
        const ratio = maxW / canvas.width
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = maxW
        tempCanvas.height = canvas.height * ratio
        const tempCtx = tempCanvas.getContext("2d")!
        tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height)
        setScreenshot(tempCanvas.toDataURL("image/jpeg", 0.7))
      } else {
        setScreenshot(canvas.toDataURL("image/jpeg", 0.7))
      }
    } catch {
      // If screen capture fails (denied or unsupported), fall back to file picker
      fileInputRef.current?.click()
    } finally {
      setCapturingScreenshot(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setScreenshot(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  if (!activeProfile) return null

  const isGameMessage = !!targetGame

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    setError(null)
    try {
      const now = Date.now()
      const trimmedMessage = message.trim()

      // Game messages go to the creator AND a copy to admin so admins
      // (and the creator's guide via the game-target path) all see it.
      // App-feedback messages are admin-only.
      const docs: Record<string, unknown>[] = []
      const baseDoc: Record<string, unknown> = {
        fromUid: activeProfile.uid,
        fromName: activeProfile.name,
        fromRole: activeProfile.role,
        type,
        message: trimmedMessage,
        status: "open",
        replies: [],
        unreadForRecipient: true,
        unreadForSender: false,
        createdAt: now,
        updatedAt: now,
        pageUrl: pageUrl || null,
      }
      // Screenshot excluded from Firestore doc to avoid 1MB limit.
      // TODO: upload to Cloud Storage and store URL instead.

      if (isGameMessage) {
        // 1) creator-facing copy (target=game, toUid=authorUid)
        const gameId = doc(collection(db, "feedback")).id
        const gameDocData: Record<string, unknown> = {
          ...baseDoc,
          id: gameId,
          target: "game",
        }
        if (targetGame?.id) gameDocData.gameId = targetGame.id
        if (targetGame?.title) gameDocData.gameTitle = targetGame.title
        if (targetGame?.authorUid) gameDocData.toUid = targetGame.authorUid
        docs.push(gameDocData)

        // 2) admin copy (target=admin, but tagged with the game info so
        //    admins see what game it's about)
        const adminId = doc(collection(db, "feedback")).id
        const adminDocData: Record<string, unknown> = {
          ...baseDoc,
          id: adminId,
          target: "admin",
        }
        if (targetGame?.id) adminDocData.gameId = targetGame.id
        if (targetGame?.title) adminDocData.gameTitle = targetGame.title
        docs.push(adminDocData)
      } else {
        // App feedback — admin-only
        const id = doc(collection(db, "feedback")).id
        docs.push({ ...baseDoc, id, target: "admin" })
      }

      // Write all docs in parallel
      await Promise.all(
        docs.map((d) => setDoc(doc(db, "feedback", d.id as string), d))
      )

      // Best-effort: ping the admin email API
      fetch("/api/feedback/notify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromName: activeProfile.name,
          type,
          message: trimmedMessage,
        }),
      }).catch(() => {})

      setSent(true)
      setMessage("")
      setScreenshot(null)
      setTimeout(() => {
        setSent(false)
        setOpen(false)
      }, 5000)
    } catch (err) {
      console.error("[feedback] send failed:", err)
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || "Couldn't send. Try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-900/40 px-4 py-3 text-sm font-medium transition-colors"
          aria-label={isGameMessage ? "Message the game creator" : "Suggest a fix or idea"}
        >
          <MessageSquarePlus className="size-4" />
          {isGameMessage ? "Message creator, guide, and admins" : "Suggest a fix or idea"}
        </button>
      )}

      {/* Popup */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 w-[360px] max-w-[calc(100vw-3rem)] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white">
              {isGameMessage ? `Message ${targetGame?.title}` : "Suggest a fix or idea"}
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-white transition-colors p-1"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {sent ? (
            <div className="p-6 text-center">
              <p className="text-emerald-400 text-sm font-medium">Sent! Thanks.</p>
              <p className="text-zinc-400 text-xs mt-1">
                {isGameMessage
                  ? "The creator will see this in their inbox."
                  : "The team will see this and reply in your inbox."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Type selector */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("improvement")}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    type === "improvement"
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  💡 Idea
                </button>
                <button
                  type="button"
                  onClick={() => setType("bug")}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    type === "bug"
                      ? "bg-red-500/20 border-red-500/50 text-red-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  🐛 Fix
                </button>
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isGameMessage
                    ? "Tell the creator what you think..."
                    : type === "improvement"
                      ? "What could be better?"
                      : "What's broken?"
                }
                rows={4}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
                required
              />

              {/* Screenshot + URL */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleScreenshot}
                  disabled={capturingScreenshot}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors disabled:opacity-30"
                >
                  <Camera className="size-3.5" />
                  {screenshot ? "Retake" : "Screenshot"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 flex-1 min-w-0 truncate">
                  <Link2 className="size-3 shrink-0" />
                  <span className="truncate">{pageUrl}</span>
                </div>
              </div>

              {/* Screenshot preview */}
              {screenshot && (
                <div className="relative">
                  <img src={screenshot} alt="Screenshot" className="w-full rounded-lg border border-zinc-700" />
                  <button
                    type="button"
                    onClick={() => setScreenshot(null)}
                    className="absolute top-1 right-1 bg-zinc-900/80 text-zinc-400 hover:text-white rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={!message.trim() || sending}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg py-2 text-sm font-medium transition-colors"
              >
                <Send className="size-4" />
                {sending ? "Sending..." : "Send"}
              </button>
              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      )}
    </>
  )
}
