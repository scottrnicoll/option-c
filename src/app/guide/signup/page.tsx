"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, collection } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

const googleProvider = new GoogleAuthProvider()

export default function GuideSignupPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const inviteCode = searchParams.get("invite")

  const [valid, setValid] = useState<boolean | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [className, setClassName] = useState("")
  const [step, setStep] = useState<"account" | "class">("account")
  const [uid, setUid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [done, setDone] = useState<{ classCode: string } | null>(null)

  // Verify invite code
  useEffect(() => {
    if (!inviteCode) { setValid(false); return }
    getDoc(doc(db, "invites", inviteCode)).then(snap => {
      setValid(snap.exists() && !snap.data()?.used)
    }).catch(() => setValid(false))
  }, [inviteCode])

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      setUid(cred.user.uid)
      setName(name || email.split("@")[0])
      setStep("class")
    } catch (err: any) {
      if (err.message?.includes("email-already-in-use")) {
        setError("This email already has an account. Try logging in at /guide/login instead.")
      } else {
        setError(err.message || "Failed to create account.")
      }
    } finally {
      setCreating(false)
    }
  }

  const handleGoogleSignup = async () => {
    setCreating(true)
    setError(null)
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      setUid(cred.user.uid)
      setName(cred.user.displayName || "Guide")
      setStep("class")
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.")
    } finally {
      setCreating(false)
    }
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uid || !inviteCode) return
    setCreating(true)
    setError(null)
    try {
      const code = Array.from({ length: 6 }, () =>
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
      ).join("")

      const classRef = doc(collection(db, "classes"))
      await setDoc(classRef, { name: className, code, guideUid: uid, createdAt: Date.now() })

      await setDoc(doc(db, "users", uid), {
        uid, name: name.trim(), role: "guide", grade: "", interests: [],
        classId: classRef.id, tokens: 0, createdAt: Date.now(), lastLoginAt: Date.now(),
      })

      await updateDoc(doc(db, "invites", inviteCode), { used: true, usedBy: uid, usedAt: Date.now() })

      setDone({ classCode: code })
    } catch (err: any) {
      setError(err.message || "Failed to create class.")
    } finally {
      setCreating(false)
    }
  }

  if (valid === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Invalid Invite</h1>
          <p className="text-zinc-400 text-sm">This invite link is invalid or has already been used. Contact your administrator for a new one.</p>
          <a href="/guide/login" className="text-blue-400 text-sm hover:text-blue-300">Already have an account? Sign in</a>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-emerald-400">You're all set!</h1>
          <p className="text-zinc-300 text-sm">Your class code is:</p>
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-6 py-4">
            <span className="text-3xl font-mono font-bold text-white tracking-widest">{done.classCode}</span>
          </div>
          <p className="text-zinc-400 text-sm">Share this code with your students so they can join your class.</p>
          <Button onClick={() => router.push("/guide")} className="w-full" size="lg">
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6">
        {step === "account" ? (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Create Your Guide Account</h1>
              <p className="text-zinc-400 text-sm mt-1">Sign up to get started</p>
            </div>

            <form onSubmit={handleEmailSignup} className="space-y-3">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" required minLength={6} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              <Button type="submit" className="w-full" size="lg" disabled={creating}>
                {creating ? "Creating..." : "Continue"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Name Your Class</h1>
              <p className="text-zinc-400 text-sm mt-1">Students will see this when they join.</p>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Ms. Smith's 5th Grade Math" required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
              <Button type="submit" className="w-full" size="lg" disabled={creating}>
                {creating ? "Creating..." : "Create Class"}
              </Button>
            </form>
          </>
        )}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    </div>
  )
}
