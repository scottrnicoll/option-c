"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function GuideLoginPage() {
  const { signInGuide, signInGuideWithGoogle, user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  // Handle post-login redirect
  useEffect(() => {
    if (loading) return
    if (profile?.role === "guide") {
      router.replace("/guide")
    } else if (profile?.role === "admin") {
      router.replace("/admin")
    } else if (user && !user.isAnonymous && profile && !["guide", "admin"].includes(profile.role)) {
      // Signed in with Google/email but not a guide
      setError("This account doesn't have guide access. Contact your admin for an invite link.")
      signOut()
    } else if (user && !user.isAnonymous && !profile) {
      // Signed in with Google but no user doc at all
      setError("No guide account found for this email. Ask your admin for an invite link to sign up.")
      signOut()
    } else if (user && user.isAnonymous) {
      // Anonymous user (student) — sign them out so guide can log in fresh
      signOut()
    }
  }, [user, profile, loading, router, signOut])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSigningIn(true)
    setError(null)
    try {
      await signInGuide(email, password)
      router.push("/guide")
    } catch (err: any) {
      setError(err.message || "Login failed. Check your credentials.")
    } finally {
      setSigningIn(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    try {
      await signInGuideWithGoogle()
      // Will redirect to Google — auth state picked up on return
    } catch (err: any) {
      setError(err.message || "Google login failed.")
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Guide Login</h1>
          <p className="text-zinc-400 text-sm mt-1">Sign in to view your class</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <input
            type="password"
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-zinc-950 px-2 text-zinc-500">or</span></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-3 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </button>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <p className="text-zinc-500 text-xs text-center">
          Guide accounts are invite-only. Contact your admin for access.
        </p>

        <a
          href="/admin/login"
          className="block text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Admin login &rarr;
        </a>
        <button
          onClick={async () => {
            const guideEmail = (document.querySelector('input[type="email"]') as HTMLInputElement)?.value
            if (!guideEmail) { alert("Enter your email first"); return }
            try {
              await sendPasswordResetEmail(auth, guideEmail)
              alert("Password reset email sent! Check your inbox.")
            } catch { alert("Could not send reset email. Check your email address.") }
          }}
          className="block text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Forgot password?
        </button>
      </div>
    </div>
  )
}
