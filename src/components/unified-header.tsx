"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Compass, Zap, Gamepad2, LayoutDashboard, Search, HelpCircle } from "lucide-react"
import { RulesPopover } from "./rules-popover"
import { useAuth } from "@/lib/auth"
import { UserMenu } from "./user-menu"
import { Logo } from "./logo"
import { useState, useEffect, useMemo } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import standardsData from "@/data/standards.json"
import type { StandardsGraph } from "@/lib/graph-types"
import { isClusterNode, buildDuplicateParentSet, isValidMoon } from "@/lib/galaxy-utils"

const STANDARDS = standardsData as StandardsGraph

// Unified header for all learner pages.
// Row 1: Logo + role badge + stats + user menu (never changes)
// Row 2: Navigation tabs + search + how to play

export function UnifiedHeader() {
  const { activeProfile, impersonating } = useAuth()
  const pathname = usePathname()

  // Don't show on guide/admin pages or if no profile
  if (!activeProfile) return null
  if (activeProfile.role === "guide" || activeProfile.role === "admin") return null
  if (pathname.startsWith("/guide") || pathname.startsWith("/admin")) return null

  const isExplore = pathname === "/"
  const isBuild = pathname === "/build"
  const isLibrary = pathname.startsWith("/library")
  const isDashboard = pathname === "/learner" || pathname === "/student"
  const isGalaxy = isExplore // Galaxy page — header overlays the 3D view

  return (
    <div className={isGalaxy ? "absolute top-0 left-0 right-0 z-40" : ""}>
      {impersonating && (
        <div className="bg-amber-500/90 text-black px-4 py-1.5 flex items-center justify-between text-sm">
          <span className="font-medium">Viewing as {impersonating.name}</span>
        </div>
      )}
      {/* Single row: Logo + Nav + Stats + Search + User */}
      <div className={`${isGalaxy ? "bg-zinc-950/60" : "bg-zinc-950/90"} backdrop-blur-sm border-b border-zinc-800/50 px-4 py-1.5`}>
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          {/* Left: Logo + name */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Logo size={22} className="text-blue-400" />
            <span className="text-sm font-bold text-white hidden md:inline">Diagonally</span>
          </Link>

          {/* Center: Nav tabs */}
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            <NavLink href="/" active={isExplore} icon={<Compass className="size-3.5" />} label="Explore" />
            <NavLink href="/build" active={isBuild} icon={<Zap className="size-3.5" />} label="Build NOW!" highlight />
            <NavLink href="/library" active={isLibrary} icon={<Gamepad2 className="size-3.5" />} label="Library" />
            <NavLink href="/learner" active={isDashboard} icon={<LayoutDashboard className="size-3.5" />} label="My Stuff" />
          </div>

          {/* Right: Stats + Search + Help + User */}
          <div className="flex items-center gap-2 shrink-0">
            <LearnerStats />
            <SearchToggle />
            <RulesPopover />
            <UserMenu />
          </div>
        </div>
      </div>
    </div>
  )
}

function NavLink({ href, active, icon, label, highlight }: {
  href: string; active: boolean; icon: React.ReactNode; label: string; highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? "text-white border-b-2 border-blue-400 rounded-b-none"
          : highlight ? "text-emerald-400 hover:text-emerald-300" : "text-zinc-400 hover:text-white"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  )
}

function LearnerStats() {
  const { activeProfile } = useAuth()
  const [skillCount, setSkillCount] = useState(0)

  const dupeParents = useMemo(() => buildDuplicateParentSet(STANDARDS.nodes.map(n => n.id)), [])
  const totalForGrade = useMemo(() => {
    if (!activeProfile?.grade) return 0
    return STANDARDS.nodes.filter(n =>
      n.grade === activeProfile.grade && isValidMoon(n.id, dupeParents)
    ).length
  }, [activeProfile?.grade, dupeParents])

  useEffect(() => {
    if (!activeProfile?.uid) return
    getDocs(collection(db, "progress", activeProfile.uid, "standards"))
      .then(snap => {
        let demonstrated = 0
        snap.forEach(d => {
          const status = d.data().status
          if (status === "unlocked" || status === "mastered") demonstrated++
        })
        setSkillCount(demonstrated)
      })
      .catch(() => {})
  }, [activeProfile?.uid])

  if (!activeProfile) return null

  return (
    <div className="flex items-center gap-3 text-xs text-zinc-400">
      {activeProfile.grade && (
        <span className="font-medium">G{activeProfile.grade}</span>
      )}
      <span>{skillCount}/{totalForGrade} skills</span>
      <span className="text-amber-400 font-mono">🪙 {activeProfile.tokens || 0}</span>
    </div>
  )
}

function SearchToggle() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Array<{ id: string; description: string; grade: string; domainCode: string }>>([])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const q = query.trim().toLowerCase()
    const dupeParents = buildDuplicateParentSet((standardsData as any).nodes.map((n: any) => n.id))
    const matches = (standardsData as any).nodes
      .filter((n: any) => {
        if (!isValidMoon(n.id, dupeParents)) return false
        return n.id.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.domain.toLowerCase().includes(q)
      })
      .slice(0, 8)
      .map((n: any) => ({ id: n.id, description: n.description, grade: n.grade, domainCode: n.domainCode }))
    setResults(matches)
  }, [query])

  if (open) {
    return (
      <div className="relative">
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search moons..."
          className="w-48 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          onKeyDown={(e) => {
            if (e.key === "Escape") { setOpen(false); setQuery(""); setResults([]) }
          }}
        />
        {results.length > 0 && (
          <div className="absolute top-8 right-0 w-72 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto z-50 shadow-xl">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setOpen(false); setQuery(""); setResults([])
                  window.location.href = `/?moon=${encodeURIComponent(r.id)}`
                }}
                className="w-full text-left px-3 py-2 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-0"
              >
                <p className="text-sm text-white truncate">{r.description}</p>
                <p className="text-[10px] text-zinc-500">{r.id} · Grade {r.grade}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 transition-colors"
      title="Search"
    >
      <Search className="size-4" />
    </button>
  )
}

