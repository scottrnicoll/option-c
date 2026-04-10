"use client"

import { useState, useRef, useEffect } from "react"
import { Settings } from "lucide-react"
import type { ColorMode } from "@/lib/galaxy-utils"
import { CONCEPT_LEGEND } from "@/lib/galaxy-utils"

interface GalaxySettingsPopoverProps {
  colorMode: ColorMode
  onColorModeChange: (mode: ColorMode) => void
  gradeFilter: "all" | "myGrade"
  onGradeFilterChange: (filter: "all" | "myGrade") => void
  // If true, the grade filter row is hidden (no grade picked yet)
  showGradeFilter: boolean
  // True when the legend swatch for "Available, not your grade" should appear
  showOtherGradeSwatch: boolean
}

// Single popover that bundles every "view setting" the student might want
// to flip — by progress / by concept, my grade / all grades, plus the
// mastery legend. Default-collapsed so the galaxy stays clean.
export function GalaxySettingsPopover({
  colorMode,
  onColorModeChange,
  gradeFilter,
  onGradeFilterChange,
  showGradeFilter,
  showOtherGradeSwatch,
}: GalaxySettingsPopoverProps) {
  const [open, setOpen] = useState(false)
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-2 backdrop-blur-sm border rounded-lg px-3 py-2 text-sm transition-colors ${
          open
            ? "bg-zinc-800 border-zinc-600 text-white"
            : "bg-zinc-900/85 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600"
        }`}
        title="View settings"
      >
        <Settings className="size-4" />
        <span>View</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[500px] max-w-[calc(100vw-2rem)] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="grid grid-cols-2 divide-x divide-zinc-800">
            {/* LEFT — settings (compact, tight) */}
            <div className="p-3 space-y-3">
              {/* Color mode */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wide">
                  Color planets
                </p>
                <div className="bg-zinc-800 rounded-md flex overflow-hidden border border-zinc-700">
                  <button
                    onClick={() => onColorModeChange("mastery")}
                    className={`flex-1 px-2 py-1 text-xs transition-colors ${
                      colorMode === "mastery"
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-300 hover:text-white"
                    }`}
                  >
                    By progress
                  </button>
                  <button
                    onClick={() => onColorModeChange("domain")}
                    className={`flex-1 px-2 py-1 text-xs transition-colors ${
                      colorMode === "domain"
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-300 hover:text-white"
                    }`}
                  >
                    By concept
                  </button>
                </div>
              </div>

              {/* Grade filter — only meaningful in "By progress" mode */}
              {showGradeFilter && colorMode === "mastery" && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wide">
                    Show
                  </p>
                  <div className="bg-zinc-800 rounded-md flex overflow-hidden border border-zinc-700">
                    <button
                      onClick={() => onGradeFilterChange("myGrade")}
                      className={`flex-1 px-2 py-1 text-xs transition-colors ${
                        gradeFilter === "myGrade"
                          ? "bg-zinc-700 text-white"
                          : "text-zinc-300 hover:text-white"
                      }`}
                    >
                      My grade
                    </button>
                    <button
                      onClick={() => onGradeFilterChange("all")}
                      className={`flex-1 px-2 py-1 text-xs transition-colors ${
                        gradeFilter === "all"
                          ? "bg-zinc-700 text-white"
                          : "text-zinc-300 hover:text-white"
                      }`}
                    >
                      All grades
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — legend */}
            <div className="p-3 space-y-2">
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wide">
                What the colors mean
              </p>

              {colorMode === "mastery" && (
                <div className="grid grid-cols-1 gap-1">
                  <LegendRow color="bg-blue-500" label="My grade level — not started" />
                  <LegendRow color="bg-yellow-500" label="Progressing" />
                  <LegendRow color="bg-yellow-700" label="In review" />
                  <LegendRow color="bg-emerald-500" label="Demonstrated" />
                  <LegendRow color="bg-amber-500" label="Mastered" />
                  {showOtherGradeSwatch && (
                    <LegendRow color="bg-purple-600" label="Other grade" />
                  )}
                  <LegendRow color="bg-zinc-500" label="Locked" />
                </div>
              )}

              {colorMode === "domain" && (
                <div className="grid grid-cols-1 gap-1">
                  {CONCEPT_LEGEND.map((c) => (
                    <div key={c.name} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-[11px] text-zinc-200 leading-tight">{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
      <span className="text-[11px] text-zinc-200 leading-tight">{label}</span>
    </div>
  )
}
