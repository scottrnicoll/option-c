"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

export default function AdminLoginPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    if (!loading && profile?.role === "admin") {
      router.replace("/admin")
    }
  }, [profile, loading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSigningIn(true)
    setError(null)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, "users", cred.user.uid))
      if (!snap.exists() || snap.data().role !== "admin") {
        await auth.signOut()
        setError("This account does not have admin access.")
        return
      }
      router.push("/admin")
    } catch (err: any) {
      setError(err.message || "Login failed.")
    } finally {
      setSigningIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-zinc-400 text-sm mt-1">Sign in to manage Option C</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <Button type="submit" className="w-full" size="lg" disabled={signingIn}>
            {signingIn ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    </div>
  )
}
