"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
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
import { Send, MessageCircle, Archive, ArchiveRestore, Flag, Wrench } from "lucide-react"
import { useRouter } from "next/navigation"

interface FeedbackInboxProps {
  // "received": messages sent to me (admin sees all admin-targeted msgs;
  //              students/guides see msgs sent to a game they own)
  // "sent": messages I sent (so I can see replies)
  mode: "received" | "sent"
}

type FilterKey = "all" | "ideas" | "fixes" | "action" | "archived"

export function FeedbackInbox({ mode }: FeedbackInboxProps) {
  const { activeProfile } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<FeedbackDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({})
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>("all")
  const [busyId, setBusyId] = useState<string | null>(null)

  const isAdmin = activeProfile?.role === "admin"
  // Show inbox-management controls (filters, archive, flag) on the
  // "received" side only — they don't make sense on the sent view.
  const showFilters = mode === "received"

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
          // Single-field query to avoid needing a composite index.
          // Filter by target client-side.
          q = query(
            collection(db, "feedback"),
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

  // Helper: a fix-type message is "unanswered" if there's no reply at all,
  // or the most recent reply is from the original sender (i.e. nobody on
  // the receiving side has answered yet).
  const isUnansweredFix = useCallback((item: FeedbackDoc) => {
    if (item.type !== "bug") return false
    if (item.replies.length === 0) return true
    const last = item.replies[item.replies.length - 1]
    return last.fromUid === item.fromUid
  }, [])

  // Counts for filter pills (computed off the unfiltered list).
  const counts = useMemo(() => {
    let ideas = 0,
      fixes = 0,
      action = 0,
      archived = 0,
      live = 0
    for (const it of items) {
      if (it.archived) {
        archived++
        continue
      }
      live++
      if (it.type === "improvement") ideas++
      if (it.type === "bug") fixes++
      if (it.actionFlagged || isUnansweredFix(it)) action++
    }
    return { all: live, ideas, fixes, action, archived }
  }, [items, isUnansweredFix])

  const visibleItems = useMemo(() => {
    return items.filter((it) => {
      if (filter === "archived") return !!it.archived
      if (it.archived) return false
      if (filter === "ideas") return it.type === "improvement"
      if (filter === "fixes") return it.type === "bug"
      if (filter === "action") return it.actionFlagged || isUnansweredFix(it)
      return true // "all"
    })
  }, [items, filter, isUnansweredFix])

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

  const handleArchive = async (item: FeedbackDoc, archived: boolean) => {
    setBusyId(item.id)
    try {
      await updateDoc(doc(db, "feedback", item.id), {
        archived,
        updatedAt: Date.now(),
      })
      // Optimistic local update so the UI flips immediately.
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, archived } : x))
      )
    } catch (err) {
      console.warn("archive failed:", err)
    } finally {
      setBusyId(null)
    }
  }

  const handleFlag = async (item: FeedbackDoc, flagged: boolean) => {
    setBusyId(item.id)
    try {
      await updateDoc(doc(db, "feedback", item.id), {
        actionFlagged: flagged,
        updatedAt: Date.now(),
      })
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, actionFlagged: flagged } : x))
      )
    } catch (err) {
      console.warn("flag failed:", err)
    } finally {
      setBusyId(null)
    }
  }

  // Creator-side: open the game in the Workshop to fix it. Flips the
  // game's status to needs_work, then navigates to the galaxy with a
  // ?fix=<gameId> query param that graph-page picks up.
  const handleFixGame = async (item: FeedbackDoc) => {
    if (!item.gameId) return
    setBusyId(item.id)
    try {
      await updateDoc(doc(db, "games", item.gameId), {
        status: "needs_work",
        updatedAt: Date.now(),
      })
      // Also revert the author's progress for this standard back to
      // "in_progress" so the moon doesn't claim to be demonstrated while
      // the game is being fixed. The author IS the active profile here.
      // (We don't have the standardId on the feedback doc, so we leave
      // progress alone — the planet view will catch up next refresh.)
      router.push(`/?fix=${encodeURIComponent(item.gameId)}`)
    } catch (err) {
      console.warn("fix-game failed:", err)
    } finally {
      setBusyId(null)
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

  return (
    <div className="space-y-3">
      {/* Filter pills (received view only) */}
      {showFilters && items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <FilterPill label="All" count={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterPill label="💡 Ideas" count={counts.ideas} active={filter === "ideas"} onClick={() => setFilter("ideas")} />
          <FilterPill label="🐛 Fixes" count={counts.fixes} active={filter === "fixes"} onClick={() => setFilter("fixes")} />
          <FilterPill label="🚩 Action needed" count={counts.action} active={filter === "action"} onClick={() => setFilter("action")} />
          <FilterPill label="📦 Archived" count={counts.archived} active={filter === "archived"} onClick={() => setFilter("archived")} />
        </div>
      )}

      {visibleItems.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <MessageCircle className="size-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-400 text-sm">
            {mode === "sent"
              ? "You haven't sent any messages."
              : filter === "all"
                ? "No messages yet."
                : "Nothing in this view."}
          </p>
        </div>
      ) : (
        visibleItems.map((item) => {
          const lastReply = item.replies[item.replies.length - 1]
          const iAmSender = item.fromUid === activeProfile.uid
          // Creator-side fix button: this is a fix message about a game
          // I own and I'm looking at the received view.
          const showFixButton =
            mode === "received" &&
            item.target === "game" &&
            item.type === "bug" &&
            !!item.gameId &&
            item.toUid === activeProfile.uid
          // Either party can keep replying after the thread is "answered".
          // We always show the reply box on the received view (for the
          // recipient) and on threads where someone has replied to me.
          const otherIsLastSender = lastReply
            ? lastReply.fromUid !== activeProfile.uid
            : !iAmSender
          const showReplyBox = mode === "received" || otherIsLastSender
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
                      {item.type === "bug" ? "🔧 Fix" : "💡 Idea"}
                    </span>
                    {item.actionFlagged && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-300">
                        🚩 Action needed
                      </span>
                    )}
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

              {/* Action row: Fix this game (creator), Flag (admin/guide), Archive (admin) */}
              {(showFixButton || showFilters) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {showFixButton && (
                    <button
                      onClick={() => handleFixGame(item)}
                      disabled={busyId === item.id}
                      className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-white text-xs font-semibold rounded-md px-3 py-1.5 transition-colors"
                      title="Open this game in the Workshop and fix it"
                    >
                      <Wrench className="size-3.5" />
                      Fix this game
                    </button>
                  )}
                  {showFilters && (activeProfile.role === "admin" || activeProfile.role === "guide") && (
                    <button
                      onClick={() => handleFlag(item, !item.actionFlagged)}
                      disabled={busyId === item.id}
                      className={`flex items-center gap-1.5 text-xs font-medium rounded-md px-3 py-1.5 transition-colors ${
                        item.actionFlagged
                          ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                      }`}
                      title={item.actionFlagged ? "Unflag" : "Flag as needing action"}
                    >
                      <Flag className="size-3.5" />
                      {item.actionFlagged ? "Flagged" : "Flag"}
                    </button>
                  )}
                  {showFilters && isAdmin && (
                    <button
                      onClick={() => handleArchive(item, !item.archived)}
                      disabled={busyId === item.id}
                      className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-medium rounded-md px-3 py-1.5 transition-colors"
                      title={item.archived ? "Unarchive" : "Archive"}
                    >
                      {item.archived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
                      {item.archived ? "Unarchive" : "Archive"}
                    </button>
                  )}
                </div>
              )}

              {/* Reply box — both parties can keep replying after the
                  thread has been answered. */}
              {showReplyBox && (
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
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
      }`}
    >
      {label}
      <span className={`ml-1.5 ${active ? "text-blue-200" : "text-zinc-500"}`}>
        {count}
      </span>
    </button>
  )
}
