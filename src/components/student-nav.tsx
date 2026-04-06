"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Compass, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/lib/auth"

export function StudentNav() {
  const { activeProfile, impersonating } = useAuth()
  const pathname = usePathname()

  // Hide on guide/admin pages — show everywhere else (galaxy, student dashboard)
  if (!activeProfile) return null
  if (pathname.startsWith("/guide") || pathname.startsWith("/admin")) return null

  const isExplore = pathname === "/"
  const isDashboard = pathname === "/student"

  return (
    <nav className={`absolute left-4 z-20 flex gap-1 bg-zinc-900/80 backdrop-blur-sm rounded-lg border border-zinc-800 p-1 ${impersonating ? "top-14" : "top-4"}`}>
      <Link
        href="/"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
          isExplore ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <Compass className="size-3.5" />
        Explore
      </Link>
      <Link
        href="/student"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
          isDashboard ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <LayoutDashboard className="size-3.5" />
        My Stuff
      </Link>
    </nav>
  )
}
