"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, increment } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Copy, Check, Users, GamepadIcon, Clock, Plus, ChevronDown, Eye, Play, X, Wrench } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Game } from "@/lib/game-types"
import { getTokenConfig } from "@/lib/token-config"
import { GameIframe } from "@/components/game/game-iframe"
import { UserMenu } from "@/components/user-menu"
import { LearnerEditModal } from "@/components/learner-edit-modal"
import { Pencil } from "lucide-react"
import { Logo } from "@/components/logo"

interface StudentSummary {
  uid: string
  name: string
  grade: string
  tokens: number
  lastLoginAt: number
  skillsUnlocked: number
  skillsMastered: number
}

interface ClassInfo {
  id: string
  name: string
  code: string
}

export default function GuideDashboard() {
  const { profile, startImpersonating } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<"students" | "reviews" | "games">("students")
  const [classData, setClassData] = useState<ClassInfo | null>(null)
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([])
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [pendingGames, setPendingGames] = useState<Game[]>([])
  const [publishedGames, setPublishedGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null)
  const [studentGames, setStudentGames] = useState<Game[]>([])
  const [showClassPicker, setShowClassPicker] = useState(false)
  const [showNewClass, setShowNewClass] = useState(false)
  const [previewGame, setPreviewGame] = useState<Game | null>(null)
  // Set of game ids the guide has opened in the player at least once.
  // The Approve button is disabled until the guide has clicked Play on
  // the game — they must actually look at it before approving.
  const [playedGameIds, setPlayedGameIds] = useState<Set<string>>(new Set())
  const [feedbackGameId, setFeedbackGameId] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [editingLearner, setEditingLearner] = useState<StudentSummary | null>(null)
  const [newClassName, setNewClassName] = useState("")
  const [creatingClass, setCreatingClass] = useState(false)

  async function handleImpersonate(studentUid: string) {
    await startImpersonating(studentUid)
    router.push("/")
  }

  async function handleCreateDemoStudent() {
    if (!profile?.classId) return
    const demoRef = doc(collection(db, "users"))
    await setDoc(demoRef, {
      uid: demoRef.id,
      role: "student",
      name: "Demo Learner",
      grade: "",
      interests: "",
      classId: profile.classId,
      tokens: 0,
      createdAt: Date.now(),
    })
    await startImpersonating(demoRef.id)
    router.push("/")
  }

  // Load all classes the guide owns
  useEffect(() => {
    if (!profile || profile.role !== "guide") return
    const classIds = profile.classIds || (profile.classId ? [profile.classId] : [])
    if (classIds.length === 0) return
    Promise.all(
      classIds.map(async (id) => {
        const snap = await getDoc(doc(db, "classes", id))
        if (snap.exists()) {
          const d = snap.data()
          return { id, name: d.name, code: d.code } as ClassInfo
        }
        return null
      })
    ).then((results) => {
      setAllClasses(results.filter(Boolean) as ClassInfo[])
    })
  }, [profile])

  useEffect(() => {
    if (!profile?.classId || profile.role !== "guide") return
    loadDashboard(profile.classId)
  }, [profile?.classId, profile?.role])

  const switchClass = useCallback(async (classId: string) => {
    if (!profile) return
    await updateDoc(doc(db, "users", profile.uid), { classId })
    setShowClassPicker(false)
    // Reload with new class
    loadDashboard(classId)
    // Update the local classData immediately
    const info = allClasses.find(c => c.id === classId)
    if (info) setClassData(info)
  }, [profile, allClasses])

  const createNewClass = useCallback(async () => {
    if (!profile || !newClassName.trim()) return
    setCreatingClass(true)
    try {
      const code = Array.from({ length: 6 }, () =>
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
      ).join("")

      const classRef = doc(collection(db, "classes"))
      await setDoc(classRef, { name: newClassName.trim(), code, guideUid: profile.uid, createdAt: Date.now() })

      // Add to guide's classIds and switch to it
      await updateDoc(doc(db, "users", profile.uid), {
        classId: classRef.id,
        classIds: arrayUnion(classRef.id),
      })

      const newClass: ClassInfo = { id: classRef.id, name: newClassName.trim(), code }
      setAllClasses(prev => [...prev, newClass])
      setClassData(newClass)
      setNewClassName("")
      setShowNewClass(false)
      setShowClassPicker(false)
      loadDashboard(classRef.id)
    } catch (err) {
      console.error("Create class error:", err)
    } finally {
      setCreatingClass(false)
    }
  }, [profile, newClassName])

  async function loadDashboard(classId?: string) {
    const activeClassId = classId || profile?.classId
    if (!activeClassId) return
    setLoading(true)
    try {
      // Load class
      const classSnap = await getDoc(doc(db, "classes", activeClassId))
      if (classSnap.exists()) {
        const d = classSnap.data()
        setClassData({ id: activeClassId, name: d.name, code: d.code })
      }

      // Load students
      const studentsQuery = query(
        collection(db, "users"),
        where("classId", "==", activeClassId),
        where("role", "==", "student")
      )
      const studentsSnap = await getDocs(studentsQuery)
      const studentList: StudentSummary[] = []

      for (const studentDoc of studentsSnap.docs) {
        const s = studentDoc.data()
        // Count progress
        const progressSnap = await getDocs(collection(db, "progress", studentDoc.id, "standards"))
        let unlocked = 0, mastered = 0
        progressSnap.forEach(p => {
          const status = p.data().status
          if (status === "unlocked" || status === "mastered") unlocked++
          if (status === "mastered") mastered++
        })
        studentList.push({
          uid: studentDoc.id,
          name: s.name || "Unknown",
          grade: s.grade || "",
          tokens: s.tokens || 0,
          lastLoginAt: s.lastLoginAt || 0,
          skillsUnlocked: unlocked,
          skillsMastered: mastered,
        })
      }
      studentList.sort((a, b) => b.lastLoginAt - a.lastLoginAt)
      setStudents(studentList)

      // Load games
      const gamesQuery = query(
        collection(db, "games"),
        where("classId", "==", activeClassId)
      )
      const gamesSnap = await getDocs(gamesQuery)
      const pending: Game[] = []
      const published: Game[] = []
      gamesSnap.forEach(g => {
        const game = { ...g.data(), id: g.id } as Game
        if (game.status === "pending_review") pending.push(game)
        else if (game.status === "published") published.push(game)
      })
      setPendingGames(pending)
      setPublishedGames(published)
    } catch (err) {
      console.error("Dashboard load error:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleStudentClick(student: StudentSummary) {
    setSelectedStudent(student)
    // Load this student's games
    const q = query(collection(db, "games"), where("authorUid", "==", student.uid))
    const snap = await getDocs(q)
    setStudentGames(snap.docs.map(d => ({ ...d.data(), id: d.id }) as Game))
  }

  async function handleApproveGame(gameId: string) {
    if (!profile) return
    try {
      const gameRef = doc(db, "games", gameId)
      // Read the game doc to get author and standard info
      const gameSnap = await getDoc(gameRef)
      if (!gameSnap.exists()) return
      const game = gameSnap.data()

      await updateDoc(gameRef, {
        status: "published",
        approvedBy: profile.uid,
        reviews: [{ reviewerUid: profile.uid, reviewerName: profile.name, approved: true, createdAt: Date.now() }],
      })

      // Move the standard into "approved_unplayed" — guide-approved but
      // the student still needs to win their own game 3 in a row to flip
      // it to "unlocked" (green).
      await setDoc(
        doc(db, "progress", game.authorUid, "standards", game.standardId),
        { status: "approved_unplayed", approvedAt: Date.now() },
        { merge: true }
      )

      // Award tokens to the author for an approved game (reads admin-configured amount)
      const tokenCfg = await getTokenConfig()
      await updateDoc(doc(db, "users", game.authorUid), {
        tokens: increment(tokenCfg.gameApproved),
      })

      // Drop a message into the student's inbox so they know what to do next
      try {
        const fbId = doc(collection(db, "feedback")).id
        const now = Date.now()
        await setDoc(doc(db, "feedback", fbId), {
          id: fbId,
          fromUid: profile.uid,
          fromName: profile.name,
          fromRole: "guide",
          target: "game",
          gameId,
          gameTitle: game.title,
          toUid: game.authorUid,
          type: "improvement",
          message: `🎉 Your game "${game.title}" was approved! +${tokenCfg.gameApproved} tokens earned.\n\nNext step: open the moon for this skill and win your own game 3 times in a row to turn the moon green and demonstrate the skill.`,
          status: "open",
          replies: [],
          unreadForRecipient: true,
          unreadForSender: false,
          createdAt: now,
          updatedAt: now,
        })
      } catch (inboxErr) {
        console.warn("inbox message failed:", inboxErr)
      }

      // Reload
      loadDashboard(classData?.id)
    } catch (err) {
      console.error("Approve error:", err)
    }
  }

  async function handleRejectGame(gameId: string) {
    if (!profile || !feedbackText.trim()) return
    try {
      const gameRef = doc(db, "games", gameId)
      const gameSnap = await getDoc(gameRef)
      if (!gameSnap.exists()) return
      const game = gameSnap.data()

      await updateDoc(gameRef, {
        status: "needs_work",
        reviews: arrayUnion({
          reviewerUid: profile.uid,
          reviewerName: profile.name,
          approved: false,
          comment: feedbackText.trim(),
          createdAt: Date.now(),
        }),
      })

      // Revert the student's progress for that standard back to "available"
      // (blue moon) so they know they need to try again. They keep any
      // tokens earned previously.
      if (game.authorUid && game.standardId) {
        await setDoc(
          doc(db, "progress", game.authorUid, "standards", game.standardId),
          { status: "available" },
          { merge: true }
        )
      }

      // Drop a message into the student's inbox so they see the feedback
      if (game.authorUid) {
        try {
          const fbId = doc(collection(db, "feedback")).id
          const now = Date.now()
          await setDoc(doc(db, "feedback", fbId), {
            id: fbId,
            fromUid: profile.uid,
            fromName: profile.name,
            fromRole: "guide",
            target: "game",
            gameId,
            gameTitle: game.title,
            toUid: game.authorUid,
            type: "improvement",
            message: `Your game "${game.title}" needs work. Feedback from your guide:\n\n${feedbackText.trim()}`,
            status: "open",
            replies: [],
            unreadForRecipient: true,
            unreadForSender: false,
            createdAt: now,
            updatedAt: now,
          })
        } catch (inboxErr) {
          console.warn("inbox message failed:", inboxErr)
        }
      }

      setFeedbackGameId(null)
      setFeedbackText("")
      loadDashboard(classData?.id)
    } catch (err) {
      console.error("Reject error:", err)
    }
  }

  function copyCode() {
    if (classData?.code) {
      navigator.clipboard.writeText(classData.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function formatTime(ts: number) {
    if (!ts) return "Never"
    const diff = Date.now() - ts
    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={28} className="text-blue-400" />
            <h1 className="text-lg font-bold text-white">Diagonally</h1>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
              Guide
            </span>
          </div>
          <UserMenu />
        </div>
      </header>
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Class header */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => allClasses.length > 1 ? setShowClassPicker(!showClassPicker) : undefined}
              className={`flex items-center gap-2 ${allClasses.length > 1 ? "cursor-pointer hover:opacity-80" : ""}`}
            >
              <h1 className="text-2xl font-bold text-white">
                {classData?.name || "Your Class"}
              </h1>
              {allClasses.length > 1 && <ChevronDown className="size-4 text-zinc-400" />}
            </button>
            <p className="text-zinc-400 text-sm mt-1">
              {students.length} student{students.length !== 1 ? "s" : ""} enrolled
            </p>
            {/* Class picker dropdown */}
            {showClassPicker && (
              <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 w-72 overflow-hidden">
                {allClasses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => switchClass(c.id)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-800 transition-colors flex items-center justify-between ${
                      c.id === classData?.id ? "text-blue-400" : "text-zinc-300"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="font-mono text-xs text-zinc-500">{c.code}</span>
                  </button>
                ))}
                <div className="border-t border-zinc-800">
                  {showNewClass ? (
                    <form
                      onSubmit={(e) => { e.preventDefault(); createNewClass() }}
                      className="p-3 flex gap-2"
                    >
                      <input
                        autoFocus
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="Class name..."
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <button
                        type="submit"
                        disabled={creatingClass || !newClassName.trim()}
                        className="bg-blue-500 hover:bg-blue-600 disabled:opacity-30 text-white rounded-lg px-3 py-2 text-sm transition-colors"
                      >
                        {creatingClass ? "..." : "Create"}
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowNewClass(true)}
                      className="w-full text-left px-4 py-3 text-sm text-blue-400 hover:bg-zinc-800 transition-colors flex items-center gap-2"
                    >
                      <Plus className="size-4" />
                      Create Another Class
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {classData && (
              <button
                onClick={copyCode}
                className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
              >
                <span className="font-mono font-bold tracking-wider">{classData.code}</span>
                {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
              </button>
            )}
            <a
              href="/library"
              className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
            >
              <GamepadIcon className="size-4" />
              Game Library
            </a>
          </div>
        </div>

        {/* Share with students */}
        {classData && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm text-zinc-400">Share this code with your students</p>
              <p className="text-3xl font-mono font-bold text-white tracking-widest mt-1">{classData.code}</p>
            </div>
            <div className="flex flex-col gap-2 items-center sm:items-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}`)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {copied ? "Copied!" : "Copy student link"}
              </button>
              <p className="text-xs text-zinc-500 max-w-xs text-center sm:text-right">
                Students enter this code at the app homepage to join your class
              </p>
            </div>
          </div>
        )}

        {/* Create Demo Student */}
        <button
          onClick={handleCreateDemoStudent}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
        >
          <Plus className="size-4" />
          Create Demo Learner
        </button>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
          {([
            { key: "students", label: "Learners", icon: Users },
            { key: "reviews", label: `Reviews${pendingGames.length > 0 ? ` (${pendingGames.length})` : ""}`, icon: Clock },
            { key: "games", label: "Games", icon: GamepadIcon },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSelectedStudent(null) }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Students Tab */}
            {tab === "students" && !selectedStudent && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left">
                      <th className="px-4 py-3 text-xs text-zinc-400 font-medium">Name</th>
                      <th className="px-4 py-3 text-xs text-zinc-400 font-medium">Last Active</th>
                      <th className="px-4 py-3 text-xs text-zinc-400 font-medium text-center">Tokens</th>
                      <th className="px-4 py-3 text-xs text-zinc-400 font-medium text-center">Unlocked</th>
                      <th className="px-4 py-3 text-xs text-zinc-400 font-medium text-center">Mastered</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr
                        key={s.uid}
                        onClick={() => handleStudentClick(s)}
                        className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-white font-medium">{s.name}</td>
                        <td className="px-4 py-3 text-sm text-zinc-400">{formatTime(s.lastLoginAt)}</td>
                        <td className="px-4 py-3 text-sm text-amber-400 text-center font-mono">{s.tokens}</td>
                        <td className="px-4 py-3 text-sm text-blue-400 text-center">{s.skillsUnlocked}</td>
                        <td className="px-4 py-3 text-sm text-emerald-400 text-center">{s.skillsMastered}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleImpersonate(s.uid) }}
                            title="View as this student"
                            className="text-zinc-500 hover:text-white transition-colors p-1"
                          >
                            <Eye className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 text-sm">
                          No students yet. Share the class code to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Student Detail */}
            {tab === "students" && selectedStudent && (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  ← Back to roster
                </button>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-white">{selectedStudent.name}</h2>
                      {selectedStudent.grade && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Grade <span className="text-zinc-300 font-medium">{selectedStudent.grade}</span>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingLearner(selectedStudent)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700 transition-colors"
                    >
                      <Pencil className="size-3" />
                      Edit
                    </button>
                  </div>
                  <div className="flex gap-6 mt-3">
                    <div>
                      <p className="text-xs text-zinc-500">Tokens</p>
                      <p className="text-lg font-mono text-amber-400">{selectedStudent.tokens}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Skills Unlocked</p>
                      <p className="text-lg font-mono text-blue-400">{selectedStudent.skillsUnlocked}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Skills Mastered</p>
                      <p className="text-lg font-mono text-emerald-400">{selectedStudent.skillsMastered}</p>
                    </div>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-zinc-300">Games Built</h3>
                {studentGames.length === 0 ? (
                  <p className="text-sm text-zinc-500">No games yet.</p>
                ) : (
                  <div className="grid gap-2">
                    {studentGames.map(g => (
                      <div key={g.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white">{g.title}</p>
                          <p className="text-xs text-zinc-500">{g.standardId}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          g.status === "published" ? "bg-emerald-500/20 text-emerald-400" :
                          g.status === "pending_review" ? "bg-amber-500/20 text-amber-400" :
                          "bg-zinc-700 text-zinc-400"
                        }`}>
                          {g.status === "pending_review" ? "Pending Review" : g.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {tab === "reviews" && (
              <div className="space-y-3">
                {pendingGames.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                    <p className="text-zinc-400 text-sm">No games waiting for review.</p>
                  </div>
                ) : (
                  pendingGames.map(g => (
                    <div key={g.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white font-medium">{g.title}</p>
                          <p className="text-xs text-zinc-400">by {g.designerName} · {g.standardId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPreviewGame(g)
                              setPlayedGameIds((prev) => {
                                const next = new Set(prev)
                                next.add(g.id)
                                return next
                              })
                            }}
                          >
                            <Play className="size-3 mr-1" />
                            Play
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                            onClick={() => setFeedbackGameId(feedbackGameId === g.id ? null : g.id)}
                          >
                            <Wrench className="size-3.5" data-icon="inline-start" /> Fix
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={!playedGameIds.has(g.id)}
                            title={!playedGameIds.has(g.id) ? "Open the game first to make sure it works" : undefined}
                            onClick={() => handleApproveGame(g.id)}
                          >
                            {playedGameIds.has(g.id) ? "Approve" : "Open it first"}
                          </Button>
                        </div>
                      </div>
                      {feedbackGameId === g.id && (
                        <div className="px-4 pb-4 border-t border-zinc-800 pt-3">
                          <textarea
                            autoFocus
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="What should the student improve?"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                            rows={2}
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setFeedbackGameId(null); setFeedbackText("") }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-500"
                              disabled={!feedbackText.trim()}
                              onClick={() => handleRejectGame(g.id)}
                            >
                              Send Feedback
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Games Tab */}
            {tab === "games" && (
              <div className="space-y-3">
                {publishedGames.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                    <p className="text-zinc-400 text-sm">No published games yet.</p>
                  </div>
                ) : (
                  publishedGames.map(g => (
                    <div key={g.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white font-medium">{g.title}</p>
                          <p className="text-xs text-zinc-400">by {g.designerName} · {g.standardId}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                          <span>{g.playCount || 0} plays</span>
                          {g.ratingCount > 0 && (
                            <span>{(g.ratingSum / g.ratingCount).toFixed(1)} ★</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Game preview — full-screen so the guide can actually play */}
      {previewGame && (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900">
            <div>
              <h3 className="text-white font-semibold">{previewGame.title}</h3>
              <p className="text-xs text-zinc-400">by {previewGame.designerName} · {previewGame.standardId}</p>
            </div>
            <div className="flex items-center gap-2">
              {previewGame.status === "pending_review" && (
                <>
                  <Button
                    variant="outline"
                    className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                    onClick={() => { setPreviewGame(null); setFeedbackGameId(previewGame.id) }}
                  >
                    Needs Work
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => { handleApproveGame(previewGame.id); setPreviewGame(null) }}
                  >
                    Approve
                  </Button>
                </>
              )}
              <button
                onClick={() => setPreviewGame(null)}
                className="text-zinc-400 hover:text-white transition-colors p-2 ml-2"
                aria-label="Close"
              >
                <X className="size-6" />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <GameIframe html={previewGame.gameHtml} className="w-full h-full" />
          </div>
        </div>
      )}

      {/* Edit learner modal — opens from the student detail panel.
          Saves directly to users/{uid}, then updates local state so
          the panel reflects the new values without a refetch. */}
      {editingLearner && (
        <LearnerEditModal
          open
          uid={editingLearner.uid}
          currentName={editingLearner.name}
          currentGrade={editingLearner.grade}
          currentClassId={classData?.id}
          onClose={() => setEditingLearner(null)}
          onSaved={(newName, newGrade) => {
            // Update the in-memory list so the change appears immediately
            setStudents((prev) =>
              prev.map((s) =>
                s.uid === editingLearner.uid ? { ...s, name: newName, grade: newGrade } : s
              )
            )
            // Also update the currently-selected student so its detail
            // header reflects the new name
            if (selectedStudent?.uid === editingLearner.uid) {
              setSelectedStudent({ ...selectedStudent, name: newName, grade: newGrade })
            }
          }}
        />
      )}
    </div>
  )
}
