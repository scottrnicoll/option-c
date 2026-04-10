// Best-effort admin notification when a user submits feedback.
// Uses Resend (https://resend.com) if RESEND_API_KEY + ADMIN_EMAIL are set,
// otherwise does nothing (the message is still saved to Firestore).
//
// To enable email:
//   1. Sign up at https://resend.com (free tier = 100 emails/day)
//   2. Add to .env.local:
//        RESEND_API_KEY=re_xxxxx
//        ADMIN_EMAIL=yourname@example.com
//   3. Restart dev server.

export async function POST(req: Request) {
  try {
    const { fromName, type, message } = await req.json()

    const apiKey = process.env.RESEND_API_KEY
    const adminEmail = process.env.ADMIN_EMAIL

    if (!apiKey || !adminEmail) {
      // Not configured — silently succeed; message is already in Firestore
      return Response.json({ ok: true, emailed: false })
    }

    const subject = `[Diagonally] ${type === "bug" ? "Fix request" : "Idea"} from ${fromName}`
    const body = `${fromName} sent a ${type === "bug" ? "fix request" : "idea"}:

${message}

— Reply in the admin dashboard: feedback tab`

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Diagonally <feedback@resend.dev>",
        to: adminEmail,
        subject,
        text: body,
      }),
    })

    if (!res.ok) {
      return Response.json({ ok: true, emailed: false, error: "send failed" })
    }
    return Response.json({ ok: true, emailed: true })
  } catch (err) {
    return Response.json({ ok: true, emailed: false, error: String(err) })
  }
}
