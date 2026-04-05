const KEY = "option_c_tokens"

export function getTokens(): number {
  if (typeof window === "undefined") return 0
  return parseInt(localStorage.getItem(KEY) || "0", 10)
}

export function addTokens(n: number): number {
  const next = getTokens() + n
  localStorage.setItem(KEY, String(next))
  return next
}
