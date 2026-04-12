"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, increment } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Copy, Check, Users, GamepadIcon, Clock, Plus, ChevronDown, Eye, Play, X, Bug, MessageCircle, LayoutDashboard, GraduationCap, RefreshCw, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Game } from "@/lib/game-types"
import { getTokenConfig } from "@/lib/token-config"
import { GameIframe } from "@/components/game/game-iframe"
import { UserMenu } from "@/components/user-menu"
import { LearnerEditModal } from "@/components/learner-edit-modal"
import { FeedbackInbox } from "@/components/feedback/feedback-inbox"
import { Logo } from "@/components/logo"
import { LearnerProgressGrid } from "@/components/learner-progress-grid"
import { WeeklyProgressChart } from "@/components/weekly-progress-chart"

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

type Tab = "overview" | "learners" | "games" | "feedback"
type GamesSubTab = "to_review" | "needs_fix" | "approved"

export default function GuideDashboard() {
  const { profile, startImpersonating } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("overview")
  const [gamesSubTab, setGamesSubTab] = useState<GamesSubTab>("to_review")
  const [classData, setClassData] = useState<ClassInfo | null>(null)
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([])
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [allGames, setAllGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null)
  const [studentGames, setStudentGames] = useState<Game[]>([])
  const [showClassPicker, setShowClassPicker] = useState(false)
  const [showNewClass, setShowNewClass] = useState(false)
  const [previewGame, setPreviewGame] = useState<Game | null>(null)
  const [feedbackGameId, setFeedbackGameId] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [editingLearner, setEditingLearner] = useState<StudentSummary | null>(null)
  const [newClassName, setNewClassName] = useState("")
  const [creatingClass, setCreatingClass] = useState(false)
  const [feedbackCount, setFeedbackCount] = useState(0)

  // Derived game lists
  const pendingGames = allGames.filter(g => g.status === "pending_review")
  const needsFixGames = allGames.filter(g => g.status === "needs_work")
  const approvedGames = allGames.filter(g => g.status === "published")

  async function handleImpersonate(studentUid: string) {
    await startImpersonating(studentUid)
    router.push("/")
  }

  async function handleCreateDemoStudent() {
    if (!profile?.classId) return
    const demoRef = doc(collection(db, "users"))
    await setDoc(demoRef, {
      uid: demoRef.id,
      name: `Demo ${Date.now() % 1000}`,
      role: "student",
      grade: "6",
      interests: [],
      classId: profile.classId,
      tokens: 0,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    })
    loadDashboard(classData?.id)
  }

  // Load all classes this guide has access to
  useEffect(() => {
    if (!profile) return
    const classIds = profile.classIds || (profile.classId ? [profile.classId] : [])
    if (classIds.length === 0) return
    Promise.all(
      classIds.map(async (id: string) => {
        const snap = await getDoc(doc(db, "classes", id))
        if (!snap.exists()) return null
        const d = snap.data()
        return { id, name: d.name, code: d.code } as ClassInfo
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
    loadDashboard(classId)
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

      // Load ALL games for this class
      const gamesSnap = await getDocs(query(collection(db, "games"), where("classId", "==", activeClassId)))
      const games = gamesSnap.docs.map(g => ({ ...g.data(), id: g.id }) as Game)
      setAllGames(games)

      // Load feedback count
      try {
        const fbSnap = await getDocs(query(collection(db, "feedback"), where("toUid", "==", profile?.uid)))
        setFeedbackCount(fbSnap.size)
      } catch { setFeedbackCount(0) }
    } catch (err) {
      console.error("Dashboard load error:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleStudentClick(student: StudentSummary) {
    setSelectedStudent(student)
    const q = query(collection(db, "games"), where("authorUid", "==", student.uid))
    const snap = await getDocs(q)
    setStudentGames(snap.docs.map(d => ({ ...d.data(), id: d.id }) as Game))
  }

  async function handleApproveGame(gameId: string) {
    if (!profile) return
    try {
      const gameRef = doc(db, "games", gameId)
      const gameSnap = await getDoc(gameRef)
      if (!gameSnap.exists()) return
      const game = gameSnap.data()

      await updateDoc(gameRef, {
        status: "published",
        approvedBy: profile.uid,
        approvedByName: profile.name,
        approvedAt: Date.now(),
        reviews: arrayUnion({ reviewerUid: profile.uid, reviewerName: profile.name, approved: true, createdAt: Date.now() }),
      })

      await setDoc(
        doc(db, "progress", game.authorUid, "standards", game.standardId),
        { status: "approved_unplayed", approvedAt: Date.now() },
        { merge: true }
      )

      const tokenCfg = await getTokenConfig()
      await updateDoc(doc(db, "users", game.authorUid), { tokens: increment(tokenCfg.gameApproved), lifetimeTokens: increment(tokenCfg.gameApproved) })

      try {
        const fbId = doc(collection(db, "feedback")).id
        const now = Date.now()
        await setDoc(doc(db, "feedback", fbId), {
          id: fbId, fromUid: profile.uid, fromName: profile.name, fromRole: "guide",
          target: "game", gameId, gameTitle: game.title, toUid: game.authorUid,
          type: "improvement",
          message: `🎉 Your game "${game.title}" was approved! +${tokenCfg.gameApproved} tokens earned.\n\nNext step: open the moon for this skill and win your own game 3 times in a row to turn the moon green and demonstrate the skill.`,
          status: "open", replies: [], unreadForRecipient: true, unreadForSender: false, createdAt: now, updatedAt: now,
        })
      } catch {}

      setPreviewGame(null)
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
        reviews: arrayUnion({ reviewerUid: profile.uid, reviewerName: profile.name, approved: false, comment: feedbackText.trim(), createdAt: Date.now() }),
      })

      if (game.authorUid && game.standardId) {
        await setDoc(doc(db, "progress", game.authorUid, "standards", game.standardId), { status: "available" }, { merge: true })
      }

      if (game.authorUid) {
        try {
          const fbId = doc(collection(db, "feedback")).id
          const now = Date.now()
          await setDoc(doc(db, "feedback", fbId), {
            id: fbId, fromUid: profile.uid, fromName: profile.name, fromRole: "guide",
            target: "game", gameId, gameTitle: game.title, toUid: game.authorUid,
            type: "improvement",
            message: `Your game "${game.title}" needs work. Feedback from your guide:\n\n${feedbackText.trim()}`,
            status: "open", replies: [], unreadForRecipient: true, unreadForSender: false, createdAt: now, updatedAt: now,
          })
        } catch {}
      }

      setFeedbackGameId(null)
      setFeedbackText("")
      setPreviewGame(null)
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

  const formatDate = (ts: number) => {
    if (!ts) return "Never"
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  if (!profile) return null

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <LayoutDashboard className="size-4" /> },
    { key: "learners", label: "Learners", icon: <GraduationCap className="size-4" /> },
    { key: "games", label: "Games", icon: <GamepadIcon className="size-4" /> },
    { key: "feedback", label: `Feedback${feedbackCount > 0 ? ` (${feedbackCount})` : ""}`, icon: <MessageCircle className="size-4" /> },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={28} className="text-blue-400" />
            <h1 className="text-lg font-bold">Diagonally</h1>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
              Guide
            </span>
          </div>
          <UserMenu />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Class switcher */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <button
              onClick={() => allClasses.length > 1 ? setShowClassPicker(!showClassPicker) : undefined}
              className={`flex items-center gap-2 ${allClasses.length > 1 ? "cursor-pointer hover:opacity-80" : ""}`}
            >
              <h2 className="text-xl font-bold text-white">{classData?.name || "Your Class"}</h2>
              {allClasses.length > 1 && <ChevronDown className="size-4 text-zinc-400" />}
            </button>
            {showClassPicker && (
              <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 w-72 overflow-hidden">
                {allClasses.map(c => (
                  <button key={c.id} onClick={() => switchClass(c.id)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-800 transition-colors flex items-center justify-between ${c.id === classData?.id ? "text-blue-400" : "text-zinc-300"}`}
                  >
                    <span>{c.name}</span>
                    <span className="font-mono text-xs text-zinc-500">{c.code}</span>
                  </button>
                ))}
                <div className="border-t border-zinc-800">
                  {showNewClass ? (
                    <form onSubmit={(e) => { e.preventDefault(); createNewClass() }} className="p-3 flex gap-2">
                      <input autoFocus value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="Class name..."
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                      <button type="submit" disabled={creatingClass || !newClassName.trim()}
                        className="bg-blue-500 hover:bg-blue-600 disabled:opacity-30 text-white rounded-lg px-3 py-2 text-sm transition-colors">
                        {creatingClass ? "..." : "Create"}
                      </button>
                    </form>
                  ) : (
                    <button onClick={() => setShowNewClass(true)} className="w-full text-left px-4 py-3 text-sm text-blue-400 hover:bg-zinc-800 transition-colors flex items-center gap-2">
                      <Plus className="size-4" /> Create Another Class
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {classData && (
              <button onClick={copyCode} className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors">
                <span className="font-mono font-bold tracking-wider">{classData.code}</span>
                {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
              </button>
            )}
            <button onClick={() => loadDashboard(classData?.id)} className="p-2 text-zinc-400 hover:text-white transition-colors" title="Refresh data">
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-zinc-900 rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setSelectedStudent(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Learners" value={students.length} icon={<GraduationCap className="size-5" />} onClick={() => setTab("learners")} />
                  <StatCard label="To Review" value={pendingGames.length} icon={<Clock className="size-5" />} onClick={() => { setTab("games"); setGamesSubTab("to_review") }} />
                  <StatCard label="Approved Games" value={approvedGames.length} icon={<GamepadIcon className="size-5" />} onClick={() => { setTab("games"); setGamesSubTab("approved") }} />
                  <StatCard label="Feedback" value={feedbackCount} icon={<MessageCircle className="size-5" />} onClick={() => setTab("feedback")} />
                </div>

                {/* Class code card */}
                {classData && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-sm text-zinc-400">Share this code with your students</p>
                      <p className="text-3xl font-mono font-bold text-white tracking-widest mt-1">{classData.code}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-center sm:items-end">
                      <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                        {copied ? "Copied!" : "Copy student link"}
                      </button>
                      <p className="text-xs text-zinc-500 max-w-xs text-center sm:text-right">
                        Students enter this code at the app homepage to join your class
                      </p>
                    </div>
                  </div>
                )}

                <button onClick={handleCreateDemoStudent} className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                  <Plus className="size-4" /> Create Demo Learner
                </button>
              </div>
            )}

            {/* Learners Tab */}
            {tab === "learners" && !selectedStudent && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Learners ({students.length})</h2>

                {/* Class-wide progress chart */}
                {students.length > 0 && (
                  <WeeklyProgressChart
                    learners={students.map(s => ({ uid: s.uid, name: s.name }))}
                  />
                )}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400">
                        <th className="text-left px-4 py-3 font-medium">Name</th>
                        <th className="text-left px-4 py-3 font-medium">Grade</th>
                        <th className="text-right px-4 py-3 font-medium">Tokens</th>
                        <th className="text-right px-4 py-3 font-medium">Demonstrated</th>
                        <th className="text-right px-4 py-3 font-medium">Mastered</th>
                        <th className="text-right px-4 py-3 font-medium">Last Active</th>
                        <th className="text-right px-4 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                            No learners yet. Share the class code to get started.
                          </td>
                        </tr>
                      ) : (
                        students.map((s) => (
                          <tr key={s.uid} onClick={() => handleStudentClick(s)} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer">
                            <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                            <td className="px-4 py-3 text-zinc-400">{s.grade || "-"}</td>
                            <td className="px-4 py-3 text-right text-amber-400 font-mono">{s.tokens}</td>
                            <td className="px-4 py-3 text-right text-blue-400">{s.skillsUnlocked}</td>
                            <td className="px-4 py-3 text-right text-emerald-400">{s.skillsMastered}</td>
                            <td className="px-4 py-3 text-right text-zinc-400">{formatDate(s.lastLoginAt)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center gap-1 justify-end">
                                <button onClick={(e) => { e.stopPropagation(); setEditingLearner(s) }}
                                  className="text-zinc-400 hover:text-blue-300 hover:bg-blue-500/10 rounded p-1.5 transition-colors" title="Edit learner">
                                  <Pencil className="size-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleImpersonate(s.uid) }}
                                  className="text-zinc-400 hover:text-white transition-colors p-1.5" title="View as this student">
                                  <Eye className="size-4" />
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

            {/* Learner Detail */}
            {tab === "learners" && selectedStudent && (
              <div className="space-y-4">
                <button onClick={() => setSelectedStudent(null)} className="text-sm text-zinc-400 hover:text-white transition-colors">
                  ← Back to roster
                </button>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-white">{selectedStudent.name}</h2>
                      {selectedStudent.grade && (
                        <p className="text-xs text-zinc-500 mt-0.5">Grade <span className="text-zinc-300 font-medium">{selectedStudent.grade}</span></p>
                      )}
                    </div>
                    <button onClick={() => setEditingLearner(selectedStudent)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700 transition-colors">
                      <Pencil className="size-3" /> Edit
                    </button>
                  </div>
                  <div className="flex gap-6 mt-3">
                    <div><p className="text-xs text-zinc-500">Tokens</p><p className="text-lg font-mono text-amber-400">{selectedStudent.tokens}</p></div>
                    <div><p className="text-xs text-zinc-500">Demonstrated</p><p className="text-lg font-mono text-blue-400">{selectedStudent.skillsUnlocked}</p></div>
                    <div><p className="text-xs text-zinc-500">Mastered</p><p className="text-lg font-mono text-emerald-400">{selectedStudent.skillsMastered}</p></div>
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
                        <StatusBadge status={g.status} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Individual progress chart */}
                <h3 className="text-sm font-medium text-zinc-300">Weekly Progress</h3>
                <WeeklyProgressChart
                  learners={[{ uid: selectedStudent.uid, name: selectedStudent.name }]}
                  highlightUid={selectedStudent.uid}
                />

                {/* Progress grid — all planets and moons for this learner's grade */}
                <h3 className="text-sm font-medium text-zinc-300">Skill Progress</h3>
                <LearnerProgressGrid uid={selectedStudent.uid} grade={selectedStudent.grade} />

                {/* Multiplication mastery */}
                <h3 className="text-sm font-medium text-zinc-300">Multiplication Tables (2-12)</h3>
                <MultiplicationMastery uid={selectedStudent.uid} />
              </div>
            )}

            {/* Games Tab */}
            {tab === "games" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Games</h2>
                {/* Sub-tabs */}
                <div className="flex gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800 w-fit">
                  {([
                    { key: "to_review" as GamesSubTab, label: `To Review (${pendingGames.length})` },
                    { key: "needs_fix" as GamesSubTab, label: `Awaiting Fix (${needsFixGames.length})` },
                    { key: "approved" as GamesSubTab, label: `Approved (${approvedGames.length})` },
                  ]).map(({ key, label }) => (
                    <button key={key} onClick={() => setGamesSubTab(key)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        gamesSubTab === key ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Game list */}
                <GameList
                  games={gamesSubTab === "to_review" ? pendingGames : gamesSubTab === "needs_fix" ? needsFixGames : approvedGames}
                  emptyMessage={gamesSubTab === "to_review" ? "No games waiting for review." : gamesSubTab === "needs_fix" ? "No games awaiting fixes." : "No approved games yet."}
                  onPlay={(g) => setPreviewGame(g)}
                />
              </div>
            )}

            {/* Feedback Tab */}
            {tab === "feedback" && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Feedback</h2>
                <p className="text-sm text-zinc-400">
                  Messages from learners. Reply directly — they&apos;ll see your reply in their inbox.
                </p>
                <FeedbackInbox mode="received" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Game player — full-screen with Approve/Needs Fix in top bar */}
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
                  <Button variant="outline" className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                    onClick={() => setFeedbackGameId(feedbackGameId === previewGame.id ? null : previewGame.id)}>
                    <Bug className="size-3.5 mr-1" /> Needs Fix
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => handleApproveGame(previewGame.id)}>
                    Approve
                  </Button>
                </>
              )}
              <button onClick={() => { setPreviewGame(null); setFeedbackGameId(null); setFeedbackText("") }}
                className="text-zinc-400 hover:text-white transition-colors p-2 ml-2" aria-label="Close">
                <X className="size-6" />
              </button>
            </div>
          </div>
          {/* Feedback textarea — slides down when Needs Fix is clicked */}
          {feedbackGameId === previewGame.id && (
            <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-900/80">
              <textarea autoFocus value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="What should the student improve?" rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
              <div className="flex justify-end gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => { setFeedbackGameId(null); setFeedbackText("") }}>Cancel</Button>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-500" disabled={!feedbackText.trim()}
                  onClick={() => handleRejectGame(previewGame.id)}>Send Feedback</Button>
              </div>
            </div>
          )}
          <div className="flex-1 min-h-0">
            <GameIframe html={previewGame.gameHtml} className="w-full h-full" />
          </div>
        </div>
      )}

      {/* Edit learner modal */}
      {editingLearner && (
        <LearnerEditModal open uid={editingLearner.uid} currentName={editingLearner.name}
          currentGrade={editingLearner.grade} currentClassId={classData?.id}
          onClose={() => setEditingLearner(null)}
          onSaved={(newName, newGrade) => {
            setStudents(prev => prev.map(s => s.uid === editingLearner.uid ? { ...s, name: newName, grade: newGrade } : s))
            if (selectedStudent?.uid === editingLearner.uid) setSelectedStudent({ ...selectedStudent, name: newName, grade: newGrade })
          }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, icon, onClick }: { label: string; value: number; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-left hover:border-blue-500/50 hover:bg-zinc-800/50 cursor-pointer transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-zinc-400 text-sm">{label}</span>
        <span className="text-zinc-500">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "bg-emerald-500/20 text-emerald-400",
    pending_review: "bg-amber-500/20 text-amber-400",
    needs_work: "bg-red-500/20 text-red-400",
    draft: "bg-zinc-700/50 text-zinc-400",
  }
  const labels: Record<string, string> = {
    published: "Approved",
    pending_review: "Pending Review",
    needs_work: "Needs Fix",
    draft: "Draft",
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  )
}

function GameList({ games, emptyMessage, onPlay }: { games: Game[]; emptyMessage: string; onPlay: (g: Game) => void }) {
  if (games.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <p className="text-zinc-500 text-sm">{emptyMessage}</p>
      </div>
    )
  }
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-400">
            <th className="text-left px-4 py-3 font-medium">Title</th>
            <th className="text-left px-4 py-3 font-medium">Author</th>
            <th className="text-left px-4 py-3 font-medium">Skill</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-right px-4 py-3 font-medium">Plays</th>
            <th className="text-right px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => (
            <tr key={g.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
              <td className="px-4 py-3 text-white">{g.title}</td>
              <td className="px-4 py-3 text-zinc-300">{g.designerName}</td>
              <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{g.standardId}</td>
              <td className="px-4 py-3"><StatusBadge status={g.status} /></td>
              <td className="px-4 py-3 text-right text-zinc-300">{g.playCount || 0}</td>
              <td className="px-4 py-3 text-right">
                <Button size="sm" variant="outline" onClick={() => onPlay(g)}>
                  <Play className="size-3 mr-1" /> Play
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MultiplicationMastery({ uid }: { uid: string }) {
  const [data, setData] = useState<{ mastered: string[]; struggles: string[]; totalCorrect: number; totalAttempts: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDoc(doc(db, "multiplicationProgress", uid))
      .then((snap) => {
        if (snap.exists()) setData(snap.data() as any)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [uid])

  if (loading) return <p className="text-sm text-zinc-500">Loading...</p>
  if (!data) return <p className="text-sm text-zinc-500">No multiplication practice data yet.</p>

  const totalFacts = 121 // 11x11 (2-12)
  const masteredCount = data.mastered?.length || 0
  const struggleCount = data.struggles?.length || 0

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex gap-6">
        <div><p className="text-xs text-zinc-500">Mastered</p><p className="text-lg font-mono text-emerald-400">{masteredCount}/{totalFacts}</p></div>
        <div><p className="text-xs text-zinc-500">Struggling</p><p className="text-lg font-mono text-amber-400">{struggleCount}</p></div>
        <div><p className="text-xs text-zinc-500">Accuracy</p><p className="text-lg font-mono text-blue-400">{data.totalAttempts > 0 ? Math.round((data.totalCorrect / data.totalAttempts) * 100) : 0}%</p></div>
      </div>
      {struggleCount > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">Struggling with:</p>
          <div className="flex flex-wrap gap-1">
            {data.struggles.map((s) => (
              <span key={s} className="text-xs bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full font-mono">{s.replace("x", " x ")}</span>
            ))}
          </div>
        </div>
      )}
      {/* Mastery grid — 11x11 for tables 2-12 */}
      <div>
        <p className="text-xs text-zinc-500 mb-2">Mastery grid (2-12):</p>
        <div className="grid gap-px" style={{ gridTemplateColumns: "auto repeat(11, 1fr)" }}>
          <div className="text-[9px] text-zinc-600 p-1"></div>
          {Array.from({ length: 11 }, (_, i) => (
            <div key={i} className="text-[9px] text-zinc-500 text-center p-1 font-mono">{i + 2}</div>
          ))}
          {Array.from({ length: 11 }, (_, row) => (
            <>
              <div key={`r${row}`} className="text-[9px] text-zinc-500 p-1 font-mono text-right">{row + 2}</div>
              {Array.from({ length: 11 }, (_, col) => {
                const key = `${row + 2}x${col + 2}`
                const isMastered = data.mastered?.includes(key)
                const isStruggle = data.struggles?.includes(key)
                return (
                  <div
                    key={key}
                    className={`w-full aspect-square rounded-sm ${
                      isMastered ? "bg-emerald-500/60" : isStruggle ? "bg-amber-500/40" : "bg-zinc-800/50"
                    }`}
                    title={`${row + 2} x ${col + 2} = ${(row + 2) * (col + 2)}${isMastered ? " (mastered)" : isStruggle ? " (struggling)" : ""}`}
                  />
                )
              })}
            </>
          ))}
        </div>
        <div className="flex gap-3 mt-2 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500/60" /> Mastered</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500/40" /> Struggling</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-zinc-800/50" /> Not practiced</span>
        </div>
      </div>
    </div>
  )
}
