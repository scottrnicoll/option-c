"use client"

import { useEffect, useState, useCallback } from "react"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth"
import type { FeedbackDoc, FeedbackReply } from "@/lib/feedback-types"
import { Send, MessageCircle } from "lucide-react"

interface FeedbackInboxProps {
  // "received": messages sent to me (admin sees all admin-targeted msgs;
  //              students/guides see msgs sent to a game they own)
  // "sent": messages I sent (so I can see replies)
  mode: "received" | "sent"
}

export function FeedbackInbox({ mode }: FeedbackInboxProps) {
  const { activeProfile } = useAuth()
  const [items, setItems] = useState<FeedbackDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({})
  const [sendingId, setSendingId] = useState<string | null>(null)

  const isAdmin = activeProfile?.role === "admin"

  const load = useCallback(async () => {
    if (!activeProfile) return
    setLoading(true)
    try {
      // NOTE: deliberately no orderBy in any of these queries — combining
      // where(...) + orderBy(...) requires a Firestore composite index
      // that we haven't deployed. Without it, the query silently returns
      // nothing. We sort client-side instead.
      let q
      if (mode === "received") {
        if (isAdmin) {
          q = query(collection(db, "feedback"), where("target", "==", "admin"))
        } else {
          q = query(
            collection(db, "feedback"),
            where("target", "==", "game"),
            where("toUid", "==", activeProfile.uid)
          )
        }
      } else {
        q = query(collection(db, "feedback"), where("fromUid", "==", activeProfile.uid))
      }
      const snap = await getDocs(q)
      const docs = snap.docs.map((d) => d.data() as FeedbackDoc)
      docs.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      setItems(docs)
    } catch (err) {
      console.warn("feedback load failed:", err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [activeProfile, mode, isAdmin])

  useEffect(() => {
    load()
  }, [load])

  const handleReply = async (item: FeedbackDoc) => {
    const text = (replyDraft[item.id] ?? "").trim()
    if (!text || !activeProfile) return
    setSendingId(item.id)
    try {
      const reply: FeedbackReply = {
        fromUid: activeProfile.uid,
        fromName: activeProfile.name,
        fromRole: activeProfile.role,
        text,
        createdAt: Date.now(),
      }
      // Recipient of this reply is the OTHER party
      const replyingToSender = item.fromUid !== activeProfile.uid
      await updateDoc(doc(db, "feedback", item.id), {
        replies: arrayUnion(reply),
        status: "answered",
        unreadForRecipient: replyingToSender ? false : true,
        unreadForSender: replyingToSender ? true : false,
        updatedAt: Date.now(),
      })
      setReplyDraft((prev) => ({ ...prev, [item.id]: "" }))
      // Refresh
      await load()
    } catch (err) {
      console.warn("reply failed:", err)
    } finally {
      setSendingId(null)
    }
  }

  if (!activeProfile) return null

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <MessageCircle className="size-8 text-zinc-600 mx-auto mb-2" />
        <p className="text-zinc-400 text-sm">
          {mode === "received" ? "No messages yet." : "You haven't sent any messages."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const lastReply = item.replies[item.replies.length - 1]
        const iAmSender = item.fromUid === activeProfile.uid
        return (
          <div
            key={item.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.type === "bug"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {item.type === "bug" ? "🐛 Bug" : "💡 Idea"}
                  </span>
                  {item.target === "game" && (
                    <span className="text-xs text-zinc-500 truncate">
                      about: {item.gameTitle}
                    </span>
                  )}
                  <span className="text-xs text-zinc-600">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  from {item.fromName}
                  {iAmSender && " (you)"}
                </p>
              </div>
              {item.unreadForRecipient && !iAmSender && (
                <span className="bg-blue-500 w-2 h-2 rounded-full mt-2 shrink-0" />
              )}
              {item.unreadForSender && iAmSender && (
                <span className="bg-emerald-500 w-2 h-2 rounded-full mt-2 shrink-0" />
              )}
            </div>

            <p className="text-sm text-zinc-200 whitespace-pre-wrap">{item.message}</p>

            {/* Replies */}
            {item.replies.length > 0 && (
              <div className="space-y-2 border-t border-zinc-800 pt-3">
                {item.replies.map((r, i) => (
                  <div key={i} className="bg-zinc-800/60 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 mb-1">
                      {r.fromName} {r.fromRole === "admin" && "(admin)"} ·{" "}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap">{r.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply box — show if I'm the recipient of the most recent activity */}
            {(() => {
              const otherIsLastSender =
                lastReply ? lastReply.fromUid !== activeProfile.uid : !iAmSender
              if (!otherIsLastSender) return null
              return (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={replyDraft[item.id] ?? ""}
                    onChange={(e) =>
                      setReplyDraft((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    placeholder="Write a reply..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                  <button
                    onClick={() => handleReply(item)}
                    disabled={!(replyDraft[item.id] ?? "").trim() || sendingId === item.id}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <Send className="size-4" />
                    {sendingId === item.id ? "..." : "Send"}
                  </button>
                </div>
              )
            })()}
          </div>
        )
      })}
    </div>
  )
}
