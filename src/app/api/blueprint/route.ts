// Serve the Blueprint HTML — admin only.
// Returns the raw HTML so it can be rendered in an iframe.

import { readFileSync } from "fs"
import { join } from "path"

export async function GET() {
  try {
    const html = readFileSync(join(process.cwd(), "docs", "diagonally-blueprint.html"), "utf-8")
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return new Response("Blueprint not found", { status: 404 })
  }
}
