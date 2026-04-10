// Centralised token economy configuration.
// Amounts are stored in Firestore at `config/tokens` so admins can
// edit them from the dashboard. This module provides defaults and a
// React hook to read the live values.

"use client"

import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useState, useEffect } from "react"

export interface TokenConfig {
  gameApproved: number   // tokens when guide approves a game (default 2000)
  skillMastered: number  // tokens when learner masters a skill (default 100)
}

export const TOKEN_DEFAULTS: TokenConfig = {
  gameApproved: 2000,
  skillMastered: 100,
}

const CONFIG_DOC = doc(db, "config", "tokens")

// Read the current config from Firestore (falls back to defaults)
export async function getTokenConfig(): Promise<TokenConfig> {
  try {
    const snap = await getDoc(CONFIG_DOC)
    if (snap.exists()) {
      const data = snap.data() as Partial<TokenConfig>
      return {
        gameApproved: typeof data.gameApproved === "number" ? data.gameApproved : TOKEN_DEFAULTS.gameApproved,
        skillMastered: typeof data.skillMastered === "number" ? data.skillMastered : TOKEN_DEFAULTS.skillMastered,
      }
    }
  } catch {}
  return { ...TOKEN_DEFAULTS }
}

// Save updated config to Firestore
export async function saveTokenConfig(config: TokenConfig): Promise<void> {
  await setDoc(CONFIG_DOC, {
    gameApproved: config.gameApproved,
    skillMastered: config.skillMastered,
    updatedAt: Date.now(),
  })
}

// React hook — returns live config (fetched once on mount)
export function useTokenConfig(): TokenConfig & { loading: boolean } {
  const [config, setConfig] = useState<TokenConfig>(TOKEN_DEFAULTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTokenConfig().then((c) => {
      setConfig(c)
      setLoading(false)
    })
  }, [])

  return { ...config, loading }
}
