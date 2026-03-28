"use client"

interface ProgressOverlayProps {
  total: number
  available: number
  unlocked: number
}

export function ProgressOverlay({ total, available, unlocked }: ProgressOverlayProps) {
  return (
    <div className="absolute top-4 left-4 z-10 bg-zinc-900/80 backdrop-blur-sm rounded-lg p-3 border border-zinc-800">
      <div className="text-xs text-zinc-500 mb-1">Your Journey</div>
      <div className="flex gap-3 text-sm">
        <div>
          <span className="text-emerald-400 font-mono font-bold">{unlocked}</span>
          <span className="text-zinc-500 ml-1">unlocked</span>
        </div>
        <div>
          <span className="text-blue-400 font-mono font-bold">{available}</span>
          <span className="text-zinc-500 ml-1">available</span>
        </div>
        <div>
          <span className="text-zinc-600 font-mono">{total}</span>
          <span className="text-zinc-600 ml-1">total</span>
        </div>
      </div>
      <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-1000"
          style={{ width: `${Math.max(((unlocked + available) / total) * 100, 1)}%` }}
        />
      </div>
    </div>
  )
}
