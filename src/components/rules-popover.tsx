"use client"

import { useState, useRef, useEffect } from "react"
import { HelpCircle, X } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { APP_RULES, type RulesSection } from "@/lib/app-rules"

// Floating "?" button + modal that summarises how the app works.
// Content lives in src/lib/app-rules.ts and MUST be updated whenever
// behavior changes (see AGENTS.md).
export function RulesPopover() {
  const { activeProfile } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open])

  const role = activeProfile?.role ?? "student"
  // Treat "student" as learner, guides + admins see the guide section
  const sections: RulesSection[] = [
    ...APP_RULES.shared,
    ...(role === "guide" || role === "admin" ? APP_RULES.guide : APP_RULES.learner),
  ]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-zinc-900/85 backdrop-blur-sm border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-300 hover:text-white transition-colors font-medium"
        title="How to Play"
        aria-label="How to Play"
      >
        <HelpCircle className="size-3.5" />
        How to Play
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div
            ref={ref}
            className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white">How Diagonally works</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {sections.map((section, i) => (
                <section key={i} className="space-y-2">
                  <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
                    {section.heading}
                  </h3>
                  <div className="space-y-2">
                    {section.body.map((para, j) => (
                      <p key={j} className="text-sm text-zinc-200 leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
