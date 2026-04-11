"use client"

import { useState, useRef, useEffect } from "react"
import { Info, X } from "lucide-react"

interface InfoButtonProps {
  title: string
  children: React.ReactNode
  className?: string
}

// A small circled "i" button that opens a popover with info about the
// current screen element. Used throughout the app to explain what
// things are (galaxy, planet, moon, game card, etc.).
export function InfoButton({ title, children, className = "" }: InfoButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handle)
    document.addEventListener("touchstart", handle)
    return () => {
      document.removeEventListener("mousedown", handle)
      document.removeEventListener("touchstart", handle)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-center rounded-full transition-colors ${
          open
            ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
            : "bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-600"
        } w-6 h-6`}
        title={`What is ${title}?`}
        aria-label={`Info about ${title}`}
      >
        <Info className="size-3.5" />
      </button>

      {open && (
        <div className="fixed z-50 top-16 right-4 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/80">
            <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">{title}</p>
            <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white p-0.5">
              <X className="size-3" />
            </button>
          </div>
          <div className="px-3 py-2.5 text-xs text-zinc-400 leading-relaxed space-y-1.5">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
