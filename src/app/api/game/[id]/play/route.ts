// Increment a game's playCount. Called once per session by the game player.
// Awards tokens to the game creator for unique plays.
// Sends inbox notification to creator with rating and tokens earned.

import { getAdminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let playerUid: string | undefined
  try {
    const body = await req.json().catch(() => ({}))
    playerUid = body.playerUid
  } catch {
    // no body is fine for backward compatibility
  }

  try {
    const adminDb = getAdminDb()
    const gameRef = adminDb.collection("games").doc(id)
    const gameSnap = await gameRef.get()

    if (!gameSnap.exists) {
      return Response.json({ ok: false, error: "Game not found" }, { status: 404 })
    }

    const gameData = gameSnap.data()!
    const authorUid = gameData.authorUid as string

    // Always increment playCount
    await gameRef.update({ playCount: FieldValue.increment(1) })

    // Track unique players and award tokens
    if (playerUid && playerUid !== authorUid) {
      const playersRef = gameRef.collection("uniquePlayers").doc(playerUid)
      const playerSnap = await playersRef.get()

      if (!playerSnap.exists) {
        // First time this player played this game — mark and award tokens
        await playersRef.set({ playedAt: Date.now() })

        // Get token config for tokenPerPlay amount
        const configSnap = await adminDb.collection("config").doc("tokens").get()
        const tokenPerPlay = configSnap.exists && typeof configSnap.data()?.tokenPerPlay === "number"
          ? configSnap.data()!.tokenPerPlay
          : 10

        // Award tokens to game creator (both lifetime and spendable)
        if (tokenPerPlay > 0) {
          const authorRef = adminDb.collection("users").doc(authorUid)
          await authorRef.update({
            tokens: FieldValue.increment(tokenPerPlay),
            lifetimeTokens: FieldValue.increment(tokenPerPlay),
          })

          // Send inbox notification to creator
          await adminDb.collection("feedback").add({
            fromUid: "system",
            toUid: authorUid,
            target: "game",
            type: "play-notification",
            message: `Someone played your game "${gameData.title || "your game"}"! You earned ${tokenPerPlay} tokens.`,
            pageUrl: `/library`,
            status: "unread",
            createdAt: Date.now(),
            replies: [],
          })
        }
      }
    }

    return Response.json({ ok: true })
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
