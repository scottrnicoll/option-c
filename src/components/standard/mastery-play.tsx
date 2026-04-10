"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore"
import { GameIframe } from "@/components/game/game-iframe"
import { Trophy } from "lucide-react"
import type { Game } from "@/lib/game-types"
import type { FeedbackDoc } from "@/lib/feedback-types"
import { useTokenConfig } from "@/lib/token-config"

interface MasteryPlayProps {
  // The standard the student is trying to demonstrate
  standardId: string
  // Called when the student successfully wins 3 in a row → moon goes green
  onDemonstrated: () => void
}

// "Demonstrate" play loop — used after a guide approves a game.
// The student plays THEIR OWN approved game and must win 3 rounds in a row.
// Losing resets the streak. Winning the 3rd flips the standard to "unlocked".
export function MasteryPlay({ standardId, onDemonstrated }: MasteryPlayProps) {
  const { activeProfile, saveProgress } = useAuth()
  const { gameApproved: tokenGameApproved } = useTokenConfig()
  const [ownGame, setOwnGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [wins, setWins] = useState(0)
  const [demonstrated, setDemonstrated] = useState(false)

  // Load the student's own approved/published game for this standard
  useEffect(() => {
    if (!activeProfile?.uid) return
    const q = query(
      collection(db, "games"),
      where("authorUid", "==", activeProfile.uid),
      where("standardId", "==", standardId),
      where("status", "==", "published")
    )
    getDocs(q)
      .then((snap) => {
        if (!snap.empty) {
          setOwnGame({ ...snap.docs[0].data(), id: snap.docs[0].id } as Game)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeProfile?.uid, standardId])

  // Load existing streak so the student picks up where they left off
  useEffect(() => {
    if (!activeProfile?.uid) return
    getDoc(doc(db, "progress", activeProfile.uid, "standards", standardId))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data() as { ownGameWinStreak?: number }
          if (typeof data.ownGameWinStreak === "number") setWins(data.ownGameWinStreak)
        }
      })
      .catch(() => {})
  }, [activeProfile?.uid, standardId])

  const handleWin = async () => {
    const newWins = wins + 1
    setWins(newWins)
    if (newWins >= 3) {
      // Demonstrated! Flip standard to unlocked (green moon).
      setDemonstrated(true)
      setPlaying(false)
      await saveProgress(standardId, {
        status: "unlocked",
        unlockedAt: Date.now(),
        ownGameWinStreak: 3,
      })
      // Notify parent so the planet can refresh / supernova can fire
      setTimeout(() => onDemonstrated(), 1500)
    } else {
      await saveProgress(standardId, { ownGameWinStreak: newWins })
    }
  }

  const handleLose = async () => {
    // Streak resets to 0
    setWins(0)
    await saveProgress(standardId, { ownGameWinStreak: 0 })
  }

  if (demonstrated) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Trophy className="size-12 text-emerald-400" />
        <h3 className="text-xl font-bold text-white">Demonstrated!</h3>
        <p className="text-zinc-300 text-sm text-center">
          Your moon turned green. Keep playing other learners&apos; games for the same skill to earn the gold star.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!ownGame) {
    return (
      <div className="text-center py-8 space-y-2">
        <p className="text-zinc-300 text-sm">
          You need a guide-approved game for this skill before you can demonstrate it.
        </p>
        <p className="text-zinc-500 text-xs">Build one and get it approved first.</p>
      </div>
    )
  }

  if (playing) {
    // Full-screen overlay so the learner can actually play their game
    return (
      <div className="fixed inset-0 z-[60] bg-zinc-950 flex flex-col">
        {/* Top bar — back, title, streak counter */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/90 gap-3">
          <button
            onClick={() => setPlaying(false)}
            className="flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm text-white font-semibold truncate">{ownGame.title}</p>
            <p className="text-xs text-amber-300">Win 3 in a row to turn the moon green</p>
          </div>
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <Trophy
                key={i}
                className={`size-5 ${i < wins ? "text-amber-400 fill-amber-400" : "text-zinc-600"}`}
              />
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <GameIframe
            html={ownGame.gameHtml}
            className="w-full h-full"
            onWin={handleWin}
            onLose={handleLose}
          />
        </div>
        <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/90 text-center">
          <p className="text-[11px] text-zinc-500">
            Lose a round and your streak resets to 0. Streak: {wins}/3
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-1">
        <p className="text-sm text-emerald-300 font-medium">
          Your game was approved! +{tokenGameApproved} tokens earned.
        </p>
        <p className="text-xs text-zinc-300">
          Now win your own game <span className="text-amber-300 font-semibold">3 times in a row</span> to turn this moon green.
        </p>
      </div>

      <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
        <span className="text-sm text-zinc-300">Your streak</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <Trophy
              key={i}
              className={`size-5 ${i < wins ? "text-amber-400 fill-amber-400" : "text-zinc-600"}`}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => setPlaying(true)}
        className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
      >
        Play your game →
      </button>
    </div>
  )
}

// Helper used elsewhere — record a win on someone else's game for the
// "mastery via others' games" loop. Reaches 3 cumulative wins → mastered.
export async function recordOtherGameWin(
  studentUid: string,
  standardId: string
): Promise<{ mastered: boolean; wins: number }> {
  const ref = doc(db, "progress", studentUid, "standards", standardId)
  const snap = await getDoc(ref)
  const data = snap.exists() ? (snap.data() as { othersGameWins?: number; status?: string }) : {}
  const currentWins = data.othersGameWins ?? 0
  const newWins = currentWins + 1
  if (newWins >= 3) {
    await setDoc(
      ref,
      {
        status: "mastered",
        masteredAt: Date.now(),
        othersGameWins: 3,
      },
      { merge: true }
    )
    return { mastered: true, wins: 3 }
  } else {
    await setDoc(ref, { othersGameWins: newWins }, { merge: true })
    return { mastered: false, wins: newWins }
  }
}

// Helper used by the guide approval flow — drop a "you can demonstrate
// this now" message into the student's inbox.
export async function postApprovalInboxMessage(
  studentUid: string,
  studentName: string,
  gameTitle: string,
  guideUid: string,
  guideName: string
) {
  const { getTokenConfig } = await import("@/lib/token-config")
  const tokenCfg = await getTokenConfig()
  const id = doc(collection(db, "feedback")).id
  const now = Date.now()
  const fb: FeedbackDoc = {
    id,
    fromUid: guideUid,
    fromName: guideName,
    fromRole: "guide",
    target: "game",
    gameTitle,
    toUid: studentUid,
    type: "improvement",
    message: `Your game "${gameTitle}" was approved! 🎉\n\nYou earned +${tokenCfg.gameApproved} tokens.\n\nNext step: open the moon and win your own game 3 times in a row to turn it green and demonstrate the skill.`,
    status: "open",
    replies: [],
    unreadForRecipient: true,
    unreadForSender: false,
    createdAt: now,
    updatedAt: now,
  }
  // Suppress unused-warning for studentName param (kept for API symmetry)
  void studentName
  await setDoc(doc(db, "feedback", id), fb)
}
