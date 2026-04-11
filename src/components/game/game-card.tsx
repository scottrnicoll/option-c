"use client"

import type { Game } from "@/lib/game-types"

interface GameCardProps {
  game: Omit<Game, "gameHtml">
  onPlay: (gameId: string) => void
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= rating ? "text-amber-400" : "text-zinc-600"
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function GameCard({ game, onPlay }: GameCardProps) {
  const avgRating = game.ratingCount > 0
    ? Math.round(game.ratingSum / game.ratingCount)
    : 0

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-3 hover:border-zinc-700 transition-colors">
      {/* Live game preview — small non-interactive iframe pointing at the
          game's HTML endpoint. The pointer-events:none + overlay ensures
          clicks go to the Play button below, not into the iframe. */}
      <div
        className="relative h-32 rounded-lg overflow-hidden border border-zinc-800 bg-black cursor-pointer"
        onClick={() => onPlay(game.id)}
      >
        <iframe
          src={`/api/game/${game.id}/html`}
          sandbox="allow-scripts"
          className="absolute inset-0 w-full h-full"
          style={{
            border: "none",
            transform: "scale(0.5)",
            transformOrigin: "top left",
            width: "200%",
            height: "200%",
            pointerEvents: "none",
          }}
          title={game.title}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-medium text-white truncate">
          {game.title}
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          by {game.designerName}
        </p>
        <p className="text-xs text-zinc-500 mt-1 truncate">
          {game.designDoc?.concept || game.standardId}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StarRating rating={avgRating} />
          <span className="text-xs text-zinc-500">
            {game.playCount} {game.playCount === 1 ? "play" : "plays"}
          </span>
        </div>
      </div>

      {(game as any).dare && (
        <p className="text-xs text-amber-400/80 italic truncate">
          &ldquo;{(game as any).dare}&rdquo;
        </p>
      )}

      <button
        onClick={() => onPlay(game.id)}
        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
      >
        Play
      </button>
    </div>
  )
}
