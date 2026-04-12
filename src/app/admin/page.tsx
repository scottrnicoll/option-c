"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth"
import { collection, getDocs, query, where, doc, getDoc, updateDoc, setDoc, deleteDoc, arrayUnion, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  Gamepad2,
  MessageCircle,
  Plus,
  X,
  Check,
  Copy,
  RefreshCw,
  Trash2,
  Pencil,
  Coins,
  Megaphone,
  Send,
} from "lucide-react"
import { FeedbackInbox } from "@/components/feedback/feedback-inbox"
import { LearnerEditModal } from "@/components/learner-edit-modal"
import { UserMenu } from "@/components/user-menu"
import { Logo } from "@/components/logo"
import { GameIframe } from "@/components/game/game-iframe"
import { Play, Bug, FileText } from "lucide-react"
import { getTokenConfig, saveTokenConfig, TOKEN_DEFAULTS, type TokenConfig } from "@/lib/token-config"

type Tab = "overview" | "guides" | "classes" | "students" | "games" | "feedback" | "tokens" | "broadcast" | "blueprint"

interface GuideRow {
  uid: string
  name: string
  email: string
  className: string
  classCode: string
  studentCount: number
}

interface ClassRow {
  id: string
  name: string
  code: string
  guideName: string
  studentCount: number
  gameCount: number
}

interface StudentRow {
  uid: string
  name: string
  className: string
  classId: string
  grade: string
  tokens: number
  lastLoginAt: number
}

interface GameRow {
  id: string
  title: string
  authorName: string
  authorUid: string
  className: string
  classId: string
  standardId: string
  status: string
  plays: number
  rating: number
  ratingCount: number
}

export default function AdminDashboardPage() {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>("overview")
  const [loading, setLoading] = useState(true)

  // Data
  const [guides, setGuides] = useState<GuideRow[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [editingLearner, setEditingLearner] = useState<StudentRow | null>(null)
  const [games, setGames] = useState<GameRow[]>([])
  const [feedbackCount, setFeedbackCount] = useState(0)

  // Invite form
  const [showInvite, setShowInvite] = useState(false)
  const [inviteName, setInviteName] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteClassName, setInviteClassName] = useState("")
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ code: string; message: string } | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Copied state
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Guide deletion confirmation state
  const [deletingGuide, setDeletingGuide] = useState<GuideRow | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)

  // Game player state — admin can play any game in the full GamePlayer
  // (which already supports approve / un-approve when the viewer is admin)
  const [playingGame, setPlayingGame] = useState<{
    id: string
    title: string
    html: string
    authorUid: string
    standardId: string
    isPublished: boolean
    isPendingReview: boolean
  } | null>(null)
  const [loadingPlay, setLoadingPlay] = useState<string | null>(null)
  const [adminFeedbackGameId, setAdminFeedbackGameId] = useState<string | null>(null)
  const [adminFeedbackText, setAdminFeedbackText] = useState("")

  const handlePlayAdminGame = async (g: GameRow) => {
    setLoadingPlay(g.id)
    try {
      const snap = await getDoc(doc(db, "games", g.id))
      if (!snap.exists()) return
      const data = snap.data()
      setPlayingGame({
        id: g.id,
        title: g.title,
        html: data.gameHtml || "",
        authorUid: g.authorUid,
        standardId: g.standardId,
        isPublished: g.status === "published",
        isPendingReview: g.status === "pending_review",
      })
    } finally {
      setLoadingPlay(null)
    }
  }

  // Quick-approve a pending game from the admin Games tab.
  // Mirrors the guide flow: flip game status, set the author's standard
  // to "approved_unplayed", award tokens, drop an inbox message.
  const handleApproveGameAdmin = async (g: GameRow) => {
    if (!profile) return
    if (g.status !== "pending_review") return
    try {
      const tokenCfg = await getTokenConfig()
      const gameRef = doc(db, "games", g.id)
      await updateDoc(gameRef, {
        status: "published",
        approvedBy: profile.uid,
        approvedByName: profile.name,
        approvedAt: Date.now(),
        reviews: arrayUnion({
          reviewerUid: profile.uid,
          reviewerName: profile.name,
          approved: true,
          createdAt: Date.now(),
        }),
      })
      if (g.authorUid && g.standardId) {
        await setDoc(
          doc(db, "progress", g.authorUid, "standards", g.standardId),
          { status: "approved_unplayed", approvedAt: Date.now() },
          { merge: true }
        )
        await updateDoc(doc(db, "users", g.authorUid), { tokens: increment(tokenCfg.gameApproved), lifetimeTokens: increment(tokenCfg.gameApproved) }).catch(() => {})
        // Inbox notification
        const fbId = doc(collection(db, "feedback")).id
        const now = Date.now()
        await setDoc(doc(db, "feedback", fbId), {
          id: fbId,
          fromUid: profile.uid,
          fromName: profile.name,
          fromRole: "admin",
          target: "game",
          gameId: g.id,
          gameTitle: g.title,
          toUid: g.authorUid,
          type: "improvement",
          message: `🎉 Your game "${g.title}" was approved by admin! +${tokenCfg.gameApproved} tokens earned.\n\nNext step: open the moon and win your own game 3 times in a row to turn the moon green.`,
          status: "open",
          replies: [],
          unreadForRecipient: true,
          unreadForSender: false,
          createdAt: now,
          updatedAt: now,
        }).catch(() => {})
      }
      fetchData()
    } catch (err) {
      console.error("Admin approve error:", err)
    }
  }

  const handleRejectGameAdmin = async (g: GameRow) => {
    if (!profile || !adminFeedbackText.trim()) return
    try {
      const gameRef = doc(db, "games", g.id)
      await updateDoc(gameRef, {
        status: "needs_work",
        reviews: arrayUnion({
          reviewerUid: profile.uid,
          reviewerName: profile.name,
          approved: false,
          comment: adminFeedbackText.trim(),
          createdAt: Date.now(),
        }),
      })
      if (g.authorUid && g.standardId) {
        await setDoc(doc(db, "progress", g.authorUid, "standards", g.standardId), { status: "available" }, { merge: true })
      }
      if (g.authorUid) {
        const fbId = doc(collection(db, "feedback")).id
        const now = Date.now()
        await setDoc(doc(db, "feedback", fbId), {
          id: fbId, fromUid: profile.uid, fromName: profile.name, fromRole: "admin",
          target: "game", gameId: g.id, gameTitle: g.title, toUid: g.authorUid,
          type: "improvement",
          message: `Your game "${g.title}" needs work. Feedback from admin:\n\n${adminFeedbackText.trim()}`,
          status: "open", replies: [], unreadForRecipient: true, unreadForSender: false, createdAt: now, updatedAt: now,
        }).catch(() => {})
      }
      setAdminFeedbackGameId(null)
      setAdminFeedbackText("")
      setPlayingGame(null)
      fetchData()
    } catch (err) {
      console.error("Admin reject error:", err)
    }
  }

  // Class create / edit / delete state
  const [showClassForm, setShowClassForm] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null)
  const [classFormName, setClassFormName] = useState("")
  const [classFormGuideUid, setClassFormGuideUid] = useState("")          // existing guide
  const [classFormNewGuideName, setClassFormNewGuideName] = useState("")  // OR create new
  const [classFormNewGuideEmail, setClassFormNewGuideEmail] = useState("")
  const [classFormMode, setClassFormMode] = useState<"existing" | "new">("existing")
  const [classFormBusy, setClassFormBusy] = useState(false)
  const [classFormError, setClassFormError] = useState<string | null>(null)
  const [deletingClass, setDeletingClass] = useState<ClassRow | null>(null)
  const [classDeleteConfirmText, setClassDeleteConfirmText] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all users
      const usersSnap = await getDocs(collection(db, "users"))
      const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[]

      // Fetch all classes
      const classesSnap = await getDocs(collection(db, "classes"))
      const allClasses = classesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[]

      // Fetch all games
      const gamesSnap = await getDocs(collection(db, "games"))
      const allGames = gamesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[]

      // Fetch feedback count (admin-targeted messages only)
      try {
        const feedbackSnap = await getDocs(
          query(collection(db, "feedback"), where("target", "==", "admin"))
        )
        setFeedbackCount(feedbackSnap.size)
      } catch {
        setFeedbackCount(0)
      }

      // Build lookup maps
      const classMap = new Map(allClasses.map((c) => [c.id, c]))
      const userMap = new Map(allUsers.map((u) => [u.uid || u.id, u]))

      // Guides
      const guideUsers = allUsers.filter((u) => u.role === "guide")
      const guideRows: GuideRow[] = guideUsers.map((g) => {
        const cls = classMap.get(g.classId)
        const studentCount = allUsers.filter(
          (u) => u.role === "student" && u.classId === g.classId
        ).length
        return {
          uid: g.uid || g.id,
          name: g.name || "Unknown",
          email: g.email || "",
          className: cls?.name || "No class",
          classCode: cls?.code || "",
          studentCount,
        }
      })
      setGuides(guideRows)

      // Classes
      const classRows: ClassRow[] = allClasses.map((c) => {
        const guide = userMap.get(c.guideUid)
        const studentCount = allUsers.filter(
          (u) => u.role === "student" && u.classId === c.id
        ).length
        const gameCount = allGames.filter((g) => g.classId === c.id).length
        return {
          id: c.id,
          name: c.name,
          code: c.code,
          guideName: guide?.name || "Unknown",
          studentCount,
          gameCount,
        }
      })
      setClasses(classRows)

      // Students
      const studentUsers = allUsers.filter((u) => u.role === "student")
      const studentRows: StudentRow[] = studentUsers.map((s) => {
        const cls = classMap.get(s.classId)
        return {
          uid: s.uid || s.id,
          name: s.name || "Unknown",
          className: cls?.name || "No class",
          classId: s.classId || "",
          grade: s.grade || "",
          tokens: s.tokens || 0,
          lastLoginAt: s.lastLoginAt || 0,
        }
      })
      setStudents(studentRows)

      // Games — use the actual field names on the game doc
      const gameRows: GameRow[] = allGames.map((g) => {
        const author = userMap.get(g.authorUid)
        const cls = classMap.get(g.classId)
        const ratingSum = typeof g.ratingSum === "number" ? g.ratingSum : 0
        const ratingCount = typeof g.ratingCount === "number" ? g.ratingCount : 0
        return {
          id: g.id,
          title: g.title || "Untitled",
          authorName: author?.name || g.designerName || "Unknown",
          authorUid: g.authorUid || "",
          className: cls?.name || "No class",
          classId: g.classId || "",
          standardId: g.standardId || "",
          status: g.status || "draft",
          plays: typeof g.playCount === "number" ? g.playCount : 0,
          rating: ratingCount > 0 ? ratingSum / ratingCount : 0,
          ratingCount,
        }
      })
      setGames(gameRows)
    } catch (err) {
      console.error("Failed to fetch admin data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setInviteError(null)
    setInviteResult(null)
    try {
      // Generate invite code
      const inviteId = Array.from({ length: 12 }, () =>
        "abcdefghjkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 32)]
      ).join("")

      // Save invite to Firestore
      await setDoc(doc(db, "invites", inviteId), {
        createdAt: Date.now(),
        createdBy: profile?.uid || "",
        used: false,
      })

      const link = `${window.location.origin}/guide/signup?invite=${inviteId}`
      setInviteResult({
        code: link,
        message: `Send this link to the guide. They'll create their own account and class.`,
      })
      setInviteName("")
      setInviteEmail("")
      setInviteClassName("")
    } catch (err: any) {
      setInviteError(err.message)
    } finally {
      setInviting(false)
    }
  }

  // ==== Class create / edit / delete ====
  const openCreateClass = () => {
    setEditingClass(null)
    setClassFormName("")
    setClassFormGuideUid(guides[0]?.uid ?? "")
    setClassFormNewGuideName("")
    setClassFormNewGuideEmail("")
    setClassFormMode(guides.length > 0 ? "existing" : "new")
    setClassFormError(null)
    setShowClassForm(true)
  }

  const openEditClass = (row: ClassRow) => {
    setEditingClass(row)
    setClassFormName(row.name)
    // Look up the guide uid by name (admin row only stores the name)
    const guide = guides.find((g) => g.name === row.guideName)
    setClassFormGuideUid(guide?.uid ?? "")
    setClassFormMode("existing")
    setClassFormError(null)
    setShowClassForm(true)
  }

  const handleSaveClass = async () => {
    if (!classFormName.trim()) {
      setClassFormError("Class needs a name.")
      return
    }
    setClassFormBusy(true)
    setClassFormError(null)
    try {
      let guideUid = classFormGuideUid

      // Create a new guide inline if requested
      if (classFormMode === "new") {
        if (!classFormNewGuideName.trim() || !classFormNewGuideEmail.trim()) {
          setClassFormError("New guide needs a name and email.")
          setClassFormBusy(false)
          return
        }
        // Create a placeholder guide user doc. The guide will sign in via
        // an invite link the admin sends them separately.
        const guideRef = doc(collection(db, "users"))
        await setDoc(guideRef, {
          uid: guideRef.id,
          name: classFormNewGuideName.trim(),
          email: classFormNewGuideEmail.trim(),
          role: "guide",
          grade: "",
          interests: [],
          classId: "",
          tokens: 0,
          createdAt: Date.now(),
          lastLoginAt: 0,
        })
        guideUid = guideRef.id
      }

      if (editingClass) {
        // Edit: update name + reassign guide
        await updateDoc(doc(db, "classes", editingClass.id), {
          name: classFormName.trim(),
          guideUid,
        })
        // Also point the guide's classId at this class so their dashboard works
        if (guideUid) {
          await updateDoc(doc(db, "users", guideUid), { classId: editingClass.id })
            .catch(() => {})
        }
      } else {
        // Create: generate code + insert
        const code = Array.from({ length: 6 }, () =>
          "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
        ).join("")
        const classRef = doc(collection(db, "classes"))
        await setDoc(classRef, {
          name: classFormName.trim(),
          code,
          guideUid,
          createdAt: Date.now(),
        })
        // Point the guide's classId at the new class so they can sign in
        if (guideUid) {
          await updateDoc(doc(db, "users", guideUid), { classId: classRef.id })
            .catch(() => {})
        }
      }

      setShowClassForm(false)
      fetchData()
    } catch (err) {
      setClassFormError(err instanceof Error ? err.message : "Failed to save class.")
    } finally {
      setClassFormBusy(false)
    }
  }

  const handleDeleteClass = async () => {
    if (!deletingClass) return
    if (classDeleteConfirmText.trim() !== deletingClass.name) return
    try {
      await deleteDoc(doc(db, "classes", deletingClass.id))
      setDeletingClass(null)
      setClassDeleteConfirmText("")
      fetchData()
    } catch (err) {
      console.error("Delete class failed:", err)
    }
  }

  const handleDeleteGuide = async () => {
    if (!deletingGuide) return
    if (deleteConfirmText.trim() !== deletingGuide.name) return
    setDeleting(true)
    try {
      // Just delete the guide's user doc. Classes / students / games stay
      // in place (orphaned but recoverable). The admin can re-invite later
      // and reassign if needed.
      await deleteDoc(doc(db, "users", deletingGuide.uid))
      setDeletingGuide(null)
      setDeleteConfirmText("")
      fetchData()
    } catch (err) {
      console.error("Delete guide failed:", err)
    } finally {
      setDeleting(false)
    }
  }

  const handleApproveGame = async (gameId: string) => {
    try {
      await updateDoc(doc(db, "games", gameId), { status: "approved" })
      setGames((prev) =>
        prev.map((g) => (g.id === gameId ? { ...g, status: "approved" } : g))
      )
    } catch (err) {
      console.error("Failed to approve game:", err)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const formatDate = (ts: number) => {
    if (!ts) return "Never"
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard className="size-4" /> },
    { key: "guides", label: "Guides", icon: <Users className="size-4" /> },
    { key: "classes", label: "Classes", icon: <School className="size-4" /> },
    { key: "students", label: "Learners", icon: <GraduationCap className="size-4" /> },
    { key: "games", label: "Games", icon: <Gamepad2 className="size-4" /> },
    { key: "feedback", label: `Feedback${feedbackCount > 0 ? ` (${feedbackCount})` : ""}`, icon: <MessageCircle className="size-4" /> },
    { key: "tokens", label: "Tokens", icon: <Coins className="size-4" /> },
    { key: "broadcast", label: "Broadcast", icon: <Megaphone className="size-4" /> },
    { key: "blueprint", label: "Blueprint", icon: <FileText className="size-4" /> },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={28} className="text-blue-400" />
            <h1 className="text-lg font-bold">Diagonally</h1>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
              Admin
            </span>
          </div>
          <UserMenu />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-zinc-900 rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
          <button
            onClick={fetchData}
            className="ml-2 p-2 text-zinc-400 hover:text-white transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <StatCard label="Guides" value={guides.length} icon={<Users className="size-5" />} onClick={() => setTab("guides")} />
                  <StatCard label="Classes" value={classes.length} icon={<School className="size-5" />} onClick={() => setTab("classes")} />
                  <StatCard label="Learners" value={students.length} icon={<GraduationCap className="size-5" />} onClick={() => setTab("students")} />
                  <StatCard label="Games" value={games.length} icon={<Gamepad2 className="size-5" />} onClick={() => setTab("games")} />
                  <StatCard label="Feedback" value={feedbackCount} icon={<MessageCircle className="size-5" />} onClick={() => setTab("feedback")} />
                </div>

              </div>
            )}

            {/* Guides Tab */}
            {tab === "guides" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Guides ({guides.length})</h2>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowInvite(!showInvite)
                      setInviteResult(null)
                      setInviteError(null)
                    }}
                  >
                    {showInvite ? (
                      <>
                        <X className="size-4" data-icon="inline-start" /> Cancel
                      </>
                    ) : (
                      <>
                        <Plus className="size-4" data-icon="inline-start" /> Invite New Guide
                      </>
                    )}
                  </Button>
                </div>

                {/* Invite Form */}
                {showInvite && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                    <h3 className="font-medium text-sm text-zinc-300">Generate an invite link</h3>
                    <p className="text-zinc-500 text-xs">The guide will use this link to create their own account and class.</p>
                    <form onSubmit={handleInvite}>
                      <Button type="submit" size="sm" disabled={inviting}>
                        {inviting ? "Generating..." : "Generate Invite Link"}
                      </Button>
                    </form>
                    {inviteResult && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 space-y-2">
                        <p className="text-emerald-400 text-sm font-medium">Invite link ready</p>
                        <p className="text-emerald-300/70 text-xs">{inviteResult.message}</p>
                        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
                          <code className="text-xs text-white flex-1 break-all">{inviteResult.code}</code>
                          <button
                            onClick={() => copyCode(inviteResult.code)}
                            className="text-emerald-400 hover:text-emerald-300 p-1 shrink-0"
                          >
                            {copiedCode === inviteResult.code ? (
                              <Check className="size-4" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    {inviteError && (
                      <p className="text-red-400 text-sm">{inviteError}</p>
                    )}
                  </div>
                )}

                {/* Guides Table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400">
                        <th className="text-left px-4 py-3 font-medium">Name</th>
                        <th className="text-left px-4 py-3 font-medium">Email</th>
                        <th className="text-left px-4 py-3 font-medium">Class</th>
                        <th className="text-left px-4 py-3 font-medium">Code</th>
                        <th className="text-right px-4 py-3 font-medium">Learners</th>
                        <th className="text-right px-4 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {guides.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                            No guides yet. Invite one above.
                          </td>
                        </tr>
                      ) : (
                        guides.map((g) => (
                          <tr key={g.uid} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                            <td className="px-4 py-3 text-white">{g.name}</td>
                            <td className="px-4 py-3 text-zinc-400">{g.email}</td>
                            <td className="px-4 py-3 text-zinc-300">{g.className}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => copyCode(g.classCode)}
                                className="font-mono text-xs bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-700 transition-colors flex items-center gap-1"
                              >
                                {g.classCode}
                                {copiedCode === g.classCode ? (
                                  <Check className="size-3 text-emerald-400" />
                                ) : (
                                  <Copy className="size-3 text-zinc-500" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right text-zinc-300">{g.studentCount}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => { setDeletingGuide(g); setDeleteConfirmText("") }}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded p-1.5 transition-colors"
                                title="Delete guide"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Classes Tab */}
            {tab === "classes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Classes ({classes.length})</h2>
                  <Button size="sm" onClick={openCreateClass}>
                    <Plus className="size-4" data-icon="inline-start" /> Create Class
                  </Button>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400">
                        <th className="text-left px-4 py-3 font-medium">Name</th>
                        <th className="text-left px-4 py-3 font-medium">Code</th>
                        <th className="text-left px-4 py-3 font-medium">Guide</th>
                        <th className="text-right px-4 py-3 font-medium">Learners</th>
                        <th className="text-right px-4 py-3 font-medium">Games</th>
                        <th className="text-right px-4 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                            No classes yet.
                          </td>
                        </tr>
                      ) : (
                        classes.map((c) => (
                          <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                            <td className="px-4 py-3 text-white">{c.name}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => copyCode(c.code)}
                                className="font-mono text-xs bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-700 transition-colors flex items-center gap-1"
                              >
                                {c.code}
                                {copiedCode === c.code ? (
                                  <Check className="size-3 text-emerald-400" />
                                ) : (
                                  <Copy className="size-3 text-zinc-500" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-zinc-300">{c.guideName}</td>
                            <td className="px-4 py-3 text-right text-zinc-300">{c.studentCount}</td>
                            <td className="px-4 py-3 text-right text-zinc-300">{c.gameCount}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center gap-1 justify-end">
                                <button
                                  onClick={() => openEditClass(c)}
                                  className="text-zinc-400 hover:text-blue-300 hover:bg-blue-500/10 rounded p-1.5 transition-colors"
                                  title="Edit class"
                                >
                                  <Pencil className="size-4" />
                                </button>
                                <button
                                  onClick={() => { setDeletingClass(c); setClassDeleteConfirmText("") }}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded p-1.5 transition-colors"
                                  title="Delete class"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Students Tab */}
            {tab === "students" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Learners ({students.length})</h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400">
                        <th className="text-left px-4 py-3 font-medium">Name</th>
                        <th className="text-left px-4 py-3 font-medium">Class</th>
                        <th className="text-left px-4 py-3 font-medium">Grade</th>
                        <th className="text-right px-4 py-3 font-medium">Tokens</th>
                        <th className="text-right px-4 py-3 font-medium">Last Active</th>
                        <th className="text-right px-4 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                            No learners yet.
                          </td>
                        </tr>
                      ) : (
                        students.map((s) => (
                          <tr key={s.uid} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                            <td className="px-4 py-3 text-white">{s.name}</td>
                            <td className="px-4 py-3 text-zinc-300">{s.className}</td>
                            <td className="px-4 py-3 text-zinc-400">{s.grade || "-"}</td>
                            <td className="px-4 py-3 text-right text-zinc-300">{s.tokens}</td>
                            <td className="px-4 py-3 text-right text-zinc-400">{formatDate(s.lastLoginAt)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setEditingLearner(s)}
                                className="flex items-center gap-1.5 ml-auto text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg px-2.5 py-1.5 transition-colors"
                              >
                                <Pencil className="size-3.5" />
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Feedback Tab */}
            {tab === "feedback" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">User Feedback</h2>
                <p className="text-sm text-zinc-400">
                  Messages from users. Reply directly — they&apos;ll see your reply in their inbox.
                </p>
                <FeedbackInbox mode="received" />
              </div>
            )}

            {/* Tokens Tab — edit the token economy */}
            {tab === "tokens" && <TokenEconomyEditor />}

            {/* Broadcast Tab — send message to all users */}
            {tab === "broadcast" && <BroadcastPanel senderUid={profile?.uid || ""} senderName={profile?.name || "Admin"} />}

            {tab === "blueprint" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Diagonally Blueprint</h2>
                  <a
                    href="/api/blueprint"
                    target="_blank"
                    rel="noopener"
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Open in new tab
                  </a>
                </div>
                <div className="rounded-xl border border-zinc-800 overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
                  <iframe
                    src="/api/blueprint"
                    className="w-full h-full border-0"
                    title="Diagonally Blueprint"
                  />
                </div>
              </div>
            )}

            {/* Games Tab */}
            {tab === "games" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Games ({games.length})</h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400">
                        <th className="text-left px-4 py-3 font-medium">Title</th>
                        <th className="text-left px-4 py-3 font-medium">Author</th>
                        <th className="text-left px-4 py-3 font-medium">Class</th>
                        <th className="text-left px-4 py-3 font-medium">Status</th>
                        <th className="text-right px-4 py-3 font-medium">Plays</th>
                        <th className="text-right px-4 py-3 font-medium">Rating</th>
                        <th className="text-right px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {games.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                            No games yet.
                          </td>
                        </tr>
                      ) : (
                        games.map((g) => (
                          <tr key={g.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                            <td className="px-4 py-3 text-white">{g.title}</td>
                            <td className="px-4 py-3 text-zinc-300">{g.authorName}</td>
                            <td className="px-4 py-3 text-zinc-400">{g.className}</td>
                            <td className="px-4 py-3">
                              <StatusBadge status={g.status} />
                            </td>
                            <td className="px-4 py-3 text-right text-zinc-300">{g.plays}</td>
                            <td className="px-4 py-3 text-right text-zinc-300">
                              {g.ratingCount > 0 ? `${g.rating.toFixed(1)} (${g.ratingCount})` : "-"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={loadingPlay === g.id}
                                onClick={() => handlePlayAdminGame(g)}
                              >
                                <Play className="size-3" data-icon="inline-start" />
                                {loadingPlay === g.id ? "..." : "Play"}
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Game player — full-screen with Approve/Needs Fix in top bar */}
      {playingGame && (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900">
            <div>
              <h3 className="text-white font-semibold">{playingGame.title}</h3>
              <p className="text-xs text-zinc-400">{playingGame.standardId}</p>
            </div>
            <div className="flex items-center gap-2">
              {playingGame.isPendingReview && (
                <>
                  <Button variant="outline" className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                    onClick={() => setAdminFeedbackGameId(adminFeedbackGameId === playingGame.id ? null : playingGame.id)}>
                    <Bug className="size-3.5 mr-1" /> Needs Fix
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => {
                      const g = games.find(gg => gg.id === playingGame.id)
                      if (g) handleApproveGameAdmin(g)
                      setPlayingGame(null)
                    }}>
                    Approve
                  </Button>
                </>
              )}
              <button onClick={() => { setPlayingGame(null); setAdminFeedbackGameId(null); setAdminFeedbackText("") }}
                className="text-zinc-400 hover:text-white transition-colors p-2 ml-2" aria-label="Close">
                <X className="size-6" />
              </button>
            </div>
          </div>
          {adminFeedbackGameId === playingGame.id && (
            <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-900/80">
              <textarea autoFocus value={adminFeedbackText} onChange={(e) => setAdminFeedbackText(e.target.value)}
                placeholder="What should the student improve?" rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
              <div className="flex justify-end gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => { setAdminFeedbackGameId(null); setAdminFeedbackText("") }}>Cancel</Button>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-500" disabled={!adminFeedbackText.trim()}
                  onClick={() => {
                    const g = games.find(gg => gg.id === playingGame.id)
                    if (g) handleRejectGameAdmin(g)
                  }}>Send Feedback</Button>
              </div>
            </div>
          )}
          <div className="flex-1 min-h-0">
            <GameIframe html={playingGame.html} className="w-full h-full" />
          </div>
        </div>
      )}

      {/* Edit learner modal — opens from the Learners tab Edit button */}
      {editingLearner && (
        <LearnerEditModal
          open
          uid={editingLearner.uid}
          currentName={editingLearner.name}
          currentGrade={editingLearner.grade}
          currentClassId={editingLearner.classId}
          onClose={() => setEditingLearner(null)}
          onSaved={(newName, newGrade, newClassId) => {
            // Find the class name for display
            const cls = classes.find((c) => c.id === newClassId)
            setStudents((prev) =>
              prev.map((s) =>
                s.uid === editingLearner.uid
                  ? { ...s, name: newName, grade: newGrade, classId: newClassId || s.classId, className: cls?.name || s.className }
                  : s
              )
            )
          }}
        />
      )}

      {/* Class create / edit modal */}
      {showClassForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-blue-500/30 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingClass ? "Edit class" : "Create a new class"}
            </h3>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Class name</label>
              <input
                value={classFormName}
                onChange={(e) => setClassFormName(e.target.value)}
                placeholder="e.g. Ms. Smith's 5th Grade Math"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                autoFocus
              />
            </div>

            {/* Guide picker — existing or create new inline */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 block">Guide</label>
              <div className="bg-zinc-800 rounded-lg p-1 flex gap-1 border border-zinc-700">
                <button
                  onClick={() => setClassFormMode("existing")}
                  disabled={guides.length === 0}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs transition-colors ${
                    classFormMode === "existing" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200"
                  } disabled:opacity-30`}
                >
                  Pick existing
                </button>
                <button
                  onClick={() => setClassFormMode("new")}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs transition-colors ${
                    classFormMode === "new" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Create new guide
                </button>
              </div>

              {classFormMode === "existing" && (
                <select
                  value={classFormGuideUid}
                  onChange={(e) => setClassFormGuideUid(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                >
                  {guides.length === 0 && <option value="">No guides yet</option>}
                  {guides.map((g) => (
                    <option key={g.uid} value={g.uid}>
                      {g.name} ({g.email || "no email"})
                    </option>
                  ))}
                </select>
              )}
              {classFormMode === "new" && (
                <div className="space-y-2">
                  <input
                    value={classFormNewGuideName}
                    onChange={(e) => setClassFormNewGuideName(e.target.value)}
                    placeholder="New guide's name"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                  <input
                    value={classFormNewGuideEmail}
                    onChange={(e) => setClassFormNewGuideEmail(e.target.value)}
                    placeholder="email@example.com"
                    type="email"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Send the guide an invite link from the Guides tab to set their password.
                  </p>
                </div>
              )}
            </div>

            {classFormError && (
              <p className="text-red-400 text-sm">{classFormError}</p>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowClassForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveClass} disabled={classFormBusy}>
                {classFormBusy ? "Saving..." : editingClass ? "Save changes" : "Create class"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete class confirmation modal */}
      {deletingClass && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Delete this class?</h3>
            <p className="text-sm text-zinc-300">
              You&apos;re about to delete <span className="font-semibold text-white">{deletingClass.name}</span>.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-200">
              <p className="font-medium mb-1">What happens:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>The class is removed (no learner can join with its code anymore)</li>
                <li>The {deletingClass.studentCount} learner{deletingClass.studentCount === 1 ? "" : "s"} stay but become orphaned</li>
                <li>The {deletingClass.gameCount} game{deletingClass.gameCount === 1 ? "" : "s"} stay</li>
                <li>The guide account is not deleted</li>
              </ul>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">
                Type <span className="text-white font-semibold">{deletingClass.name}</span> to confirm:
              </label>
              <input
                value={classDeleteConfirmText}
                onChange={(e) => setClassDeleteConfirmText(e.target.value)}
                placeholder={deletingClass.name}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => { setDeletingClass(null); setClassDeleteConfirmText("") }}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-500"
                disabled={classDeleteConfirmText.trim() !== deletingClass.name}
                onClick={handleDeleteClass}
              >
                Delete class
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete guide confirmation modal */}
      {deletingGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Delete this guide?</h3>
              <p className="text-sm text-zinc-300 mt-2">
                You&apos;re about to delete <span className="font-semibold text-white">{deletingGuide.name}</span>.
              </p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-200">
              <p className="font-medium mb-1">What happens:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Their guide account is removed (they can&apos;t sign in)</li>
                <li>Their class &quot;{deletingGuide.className}&quot; stays but becomes orphaned</li>
                <li>{deletingGuide.studentCount} student{deletingGuide.studentCount === 1 ? "" : "s"} stay in that class</li>
                <li>Existing games are not deleted</li>
              </ul>
              <p className="mt-2">You can re-invite them later if needed.</p>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">
                Type <span className="text-white font-semibold">{deletingGuide.name}</span> to confirm:
              </label>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deletingGuide.name}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500/50"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => { setDeletingGuide(null); setDeleteConfirmText("") }}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-500"
                disabled={deleteConfirmText.trim() !== deletingGuide.name || deleting}
                onClick={handleDeleteGuide}
              >
                {deleting ? "Deleting..." : "Delete guide"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  onClick,
}: {
  label: string
  value: number
  icon: React.ReactNode
  onClick?: () => void
}) {
  const Tag = onClick ? "button" : "div"
  return (
    <Tag
      onClick={onClick}
      className={`bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-left ${
        onClick ? "hover:border-blue-500/50 hover:bg-zinc-800/50 cursor-pointer transition-colors" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-zinc-400 text-sm">{label}</span>
        <span className="text-zinc-500">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </Tag>
  )
}

function TokenTopupCard() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{ topped: number; skipped: number; totalAwarded: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    setRunning(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/topup-tokens", { method: "POST" })
      const data = await res.json()
      if (data.ok) {
        setResult({ topped: data.topped, skipped: data.skipped, totalAwarded: data.totalAwarded })
      } else {
        setError(data.error || "Failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-base font-semibold text-white">Token migration</h3>
      <p className="text-sm text-zinc-400 mt-1">
        New token economy: <span className="text-amber-300">+2000</span> per approved game,{" "}
        <span className="text-amber-300">+100</span> per mastered skill.
      </p>
      <p className="text-xs text-zinc-500 mt-2">
        Run this once to retroactively credit existing learners for games they&apos;ve already had approved
        and skills they&apos;ve already mastered. Idempotent — safe to run multiple times.
      </p>
      <div className="mt-3">
        <Button onClick={handleRun} disabled={running} size="sm">
          {running ? "Running..." : "Top up existing learners"}
        </Button>
      </div>
      {result && (
        <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-sm">
          <p className="text-emerald-300">
            Topped up {result.topped} student{result.topped === 1 ? "" : "s"} ·{" "}
            Skipped {result.skipped} (already topped up) ·{" "}
            Total awarded: {result.totalAwarded.toLocaleString()} tokens
          </p>
        </div>
      )}
      {error && (
        <p className="mt-3 text-red-400 text-sm">{error}</p>
      )}
    </div>
  )
}

function TokenEconomyEditor() {
  const [config, setConfig] = useState<TokenConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [gameApproved, setGameApproved] = useState(TOKEN_DEFAULTS.gameApproved)
  const [skillMastered, setSkillMastered] = useState(TOKEN_DEFAULTS.skillMastered)
  const [tokenPerPlay, setTokenPerPlay] = useState(TOKEN_DEFAULTS.tokenPerPlay)
  const [diagonalSpark, setDiagonalSpark] = useState(TOKEN_DEFAULTS.diagonalSpark)
  const [diagonalIdea, setDiagonalIdea] = useState(TOKEN_DEFAULTS.diagonalIdea)
  const [diagonalVision, setDiagonalVision] = useState(TOKEN_DEFAULTS.diagonalVision)

  useEffect(() => {
    getTokenConfig().then((c) => {
      setConfig(c)
      setGameApproved(c.gameApproved)
      setSkillMastered(c.skillMastered)
      setTokenPerPlay(c.tokenPerPlay)
      setDiagonalSpark(c.diagonalSpark)
      setDiagonalIdea(c.diagonalIdea)
      setDiagonalVision(c.diagonalVision)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const newConfig = { gameApproved, skillMastered, tokenPerPlay, diagonalSpark, diagonalIdea, diagonalVision }
      await saveTokenConfig(newConfig)
      setConfig(newConfig)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = config && (
    config.gameApproved !== gameApproved || config.skillMastered !== skillMastered ||
    config.tokenPerPlay !== tokenPerPlay || config.diagonalSpark !== diagonalSpark ||
    config.diagonalIdea !== diagonalIdea || config.diagonalVision !== diagonalVision
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold">Token Economy</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Configure how many tokens learners earn. Changes apply to future awards only — existing tokens are not affected.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
        <div>
          <label className="text-sm text-zinc-300 block mb-1.5">Tokens per approved game</label>
          <p className="text-xs text-zinc-500 mb-2">Awarded when a guide or admin approves a learner&apos;s game.</p>
          <input
            type="number"
            min={0}
            step={100}
            value={gameApproved}
            onChange={(e) => setGameApproved(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-40 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-300 block mb-1.5">Tokens per mastered skill</label>
          <p className="text-xs text-zinc-500 mb-2">Awarded when a learner wins 3 games by other learners on the same skill.</p>
          <input
            type="number"
            min={0}
            step={10}
            value={skillMastered}
            onChange={(e) => setSkillMastered(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-40 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-300 block mb-1.5">Tokens per game play</label>
          <p className="text-xs text-zinc-500 mb-2">Awarded to the game creator each time a unique learner plays their game.</p>
          <input
            type="number"
            min={0}
            step={5}
            value={tokenPerPlay}
            onChange={(e) => setTokenPerPlay(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-40 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        <div className="border-t border-zinc-800 pt-4 mt-2">
          <p className="text-xs text-zinc-400 uppercase tracking-wide font-semibold mb-3">Diagonal Idea Prizes</p>
          <p className="text-xs text-zinc-500 mb-3">Awarded by admin when a learner submits an exceptionally good idea via the feedback button.</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Diagonal Spark</label>
              <input type="number" min={0} step={100} value={diagonalSpark}
                onChange={(e) => setDiagonalSpark(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Diagonal Idea</label>
              <input type="number" min={0} step={100} value={diagonalIdea}
                onChange={(e) => setDiagonalIdea(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Diagonal Vision</label>
              <input type="number" min={0} step={100} value={diagonalVision}
                onChange={(e) => setDiagonalVision(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm">
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {saved && <span className="text-sm text-emerald-400">Saved!</span>}
          {hasChanges && (
            <span className="text-xs text-amber-400">Unsaved changes</span>
          )}
        </div>
      </div>

      {/* Token migration card — moved here from Overview */}
      <TokenTopupCard />
    </div>
  )
}

function BroadcastPanel({ senderUid, senderName }: { senderUid: string; senderName: string }) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<{ count: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    setError(null)
    setSent(null)
    try {
      // Fetch all users (students + guides)
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("role", "in", ["student", "guide"]))
      )
      const recipients = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() })) as any[]

      // Create a feedback doc for each user
      let count = 0
      for (const user of recipients) {
        const fbId = doc(collection(db, "feedback")).id
        const now = Date.now()
        await setDoc(doc(db, "feedback", fbId), {
          id: fbId,
          fromUid: senderUid,
          fromName: senderName,
          fromRole: "admin",
          target: "game",
          toUid: user.uid || user.id,
          type: "improvement",
          message: `📢 ${message.trim()}`,
          status: "open",
          replies: [],
          unreadForRecipient: true,
          unreadForSender: false,
          createdAt: now,
          updatedAt: now,
        })
        count++
      }

      setSent({ count })
      setMessage("")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold">Broadcast Message</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Send a message to all learners and guides. It will appear in their inbox.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-sm text-zinc-300 block mb-1.5">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your announcement here..."
            rows={4}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSend} disabled={sending || !message.trim()} size="sm">
            <Send className="size-3" data-icon="inline-start" />
            {sending ? "Sending..." : "Send to everyone"}
          </Button>
        </div>

        {sent && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-sm text-emerald-300">
            Message sent to {sent.count} user{sent.count === 1 ? "" : "s"}.
          </div>
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "bg-emerald-500/20 text-emerald-400",
    pending: "bg-amber-500/20 text-amber-400",
    draft: "bg-zinc-700/50 text-zinc-400",
    published: "bg-blue-500/20 text-blue-400",
  }
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        styles[status] || styles.draft
      }`}
    >
      {status}
    </span>
  )
}
