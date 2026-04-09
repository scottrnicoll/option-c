"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { LogOut, User, ChevronDown, KeyRound } from "lucide-react"
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface UserMenuProps {
  // Optional className override for positioning. By default the menu is
  // an inline element — the parent decides where to put it.
  className?: string
}

// Top-right name + sign-out dropdown. Used on the galaxy, the student
// dashboard, the guide dashboard, and the admin dashboard so the active
// user is always visible and can sign out.
export function UserMenu({ className }: UserMenuProps) {
  const { activeProfile, signOut, impersonating } = useAuth()
  const [open, setOpen] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [open])

  const isEmailUser = auth.currentUser?.providerData.some((p) => p.providerId === "password")

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)

    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords don't match.")
      return
    }

    const user = auth.currentUser
    if (!user || !user.email) {
      setPwError("No authenticated user found.")
      return
    }

    setPwLoading(true)
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      setPwSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setShowChangePassword(false), 1500)
    } catch (err: any) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPwError("Current password is incorrect.")
      } else {
        setPwError(err.message || "Failed to change password.")
      }
    } finally {
      setPwLoading(false)
    }
  }

  const closePasswordModal = () => {
    setShowChangePassword(false)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setPwError(null)
    setPwSuccess(false)
  }

  if (!activeProfile) return null

  const roleBadge = activeProfile.role === "admin"
    ? "Admin"
    : activeProfile.role === "guide"
      ? "Guide"
      : "Learner"

  return (
    <>
      <div className={`relative ${className ?? ""}`} ref={ref}>
        <button
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-2 bg-zinc-900/85 backdrop-blur-sm hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg px-3 py-2 transition-colors"
        >
          <User className="size-4 text-zinc-400" />
          <span className="text-sm text-white font-medium max-w-[140px] truncate">
            {activeProfile.name}
          </span>
          <ChevronDown className="size-3.5 text-zinc-400" />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-sm font-semibold text-white truncate">{activeProfile.name}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{roleBadge}</p>
              {impersonating && (
                <p className="text-xs text-amber-400 mt-1">Viewing as student</p>
              )}
            </div>
            {isEmailUser && (
              <button
                onClick={() => {
                  setOpen(false)
                  setShowChangePassword(true)
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <KeyRound className="size-4" />
                Change password
              </button>
            )}
            <button
              onClick={() => {
                setOpen(false)
                signOut()
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        )}
      </div>

      {showChangePassword && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-sm w-full shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white">Change password</h2>
            </div>
            <form onSubmit={handleChangePassword} className="px-6 py-4 space-y-3">
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {pwError && <p className="text-sm text-red-400">{pwError}</p>}
              {pwSuccess && <p className="text-sm text-green-400">Password changed!</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg px-4 py-2 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  {pwLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
