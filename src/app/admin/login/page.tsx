"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"

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
      // 1. Sign in with Firebase Auth (no Firestore needed)
      const cred = await signInWithEmailAndPassword(auth, email, password)

      // 2. Get the ID token
      const idToken = await cred.user.getIdToken()

      // 3. Verify admin role server-side (uses Firebase Admin SDK, not client Firestore)
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        await auth.signOut()
        setError(data.error || "This account does not have admin access.")
        return
      }

      // 4. Reload to let AuthProvider pick up the session
      window.location.href = "/admin"
    } catch (err: any) {
      const msg = err.message || "Login failed."
      if (msg.includes("invalid-credential")) {
        setError("Invalid email or password.")
      } else {
        setError(msg)
      }
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
          <p className="text-zinc-400 text-sm mt-1">Sign in to manage Diagonally</p>
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

        <button
          onClick={async () => {
            if (!email) { setError("Enter your email first"); return }
            try {
              await sendPasswordResetEmail(auth, email)
              setError(null)
              alert("Password reset email sent! Check your inbox.")
            } catch (err: any) {
              setError(err.message || "Failed to send reset email.")
            }
          }}
          className="w-full text-zinc-400 text-sm hover:text-zinc-200 transition-colors"
        >
          Forgot password? Send reset email
        </button>
      </div>
    </div>
  )
}
