import Anthropic from "@anthropic-ai/sdk"

// 60s was too tight — refining a full HTML game can take 40-90 seconds
// when the existing game is large. Some kids were seeing "connection
// error" because the route timed out mid-generation. Vercel's hard limit
// for hobby/free plans is 60s; pro plans allow up to 300. 120s is the
// safe middle ground.
export const maxDuration = 120

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const QUESTION_PREFIXES = /^(what|why|how|can|does|is|are|help|explain|tell|understand)\b/i

function isQuestion(message: string): boolean {
  return QUESTION_PREFIXES.test(message.trim())
}

async function callAnthropic(
  system: string,
  userContent: string,
  retries = 1
): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        // Bumped from 8000 → 12000 because some games were getting
        // truncated mid-HTML, leaving the kid with broken markup
        // they couldn't recover from.
        max_tokens: 12000,
        system,
        messages: [{ role: "user", content: userContent }],
      })
      return response.content[0].type === "text" ? response.content[0].text : ""
    } catch (error) {
      if (attempt < retries) continue
      throw error
    }
  }
  throw new Error("Unreachable")
}

export async function POST(req: Request) {
  try {
    const { currentHtml, message, designDoc, chatHistory } = await req.json()

    const historyText = (chatHistory as { role: string; text: string }[])
      .map((m) => `${m.role}: ${m.text}`)
      .join("\n")

    if (isQuestion(message)) {
      const questionSystem = `You are a helpful math and game design tutor. A student is building a game about "${designDoc.concept}" and asked a question.

Do NOT give away the answer to the current round of the game. Instead, explain the concept or mechanics clearly so they understand it better and can figure it out themselves.

Respond in 2-4 sentences. Be clear, warm, and age-appropriate.`

      const questionPrompt = `The student's game is called "${designDoc.title}".
How it works: ${designDoc.howItWorks}

Previous conversation:
${historyText}

Student's question: "${message}"`

      const reply = await callAnthropic(questionSystem, questionPrompt)
      return Response.json({ reply })
    }

    // Change request — generate updated HTML with guardrails
    const changeSystem = `You are a game refinement assistant. A student built a browser game and wants to improve it.

CRITICAL RULES — never break these:
1. The math concept (${designDoc.concept}) must remain essential — players must use it to make decisions or win.
2. The math must be applied realistically, not decoratively.
3. The game must remain understandable and playable by others.
4. The game must have a clear end (win/lose screen after completing rounds or reaching a goal).
5. Never use overflow:hidden on body or main container — the game must be scrollable.

If the request would break a rule, explain why you can't make that exact change and make the closest version that still follows the rules.

Output ONLY the complete HTML file. No markdown. No code fences. Start with <!DOCTYPE html>.
After the HTML, on a new line write "---REPLY---" followed by a brief 1-2 sentence summary of what you changed.`

    const changePrompt = `Previous refinement conversation:
${historyText}

Current game HTML:
${currentHtml}

Original design:
- Title: ${designDoc.title}
- Math concept: ${designDoc.concept}
- How it works: ${designDoc.howItWorks}

Student's latest request: "${message}"

Generate an updated complete HTML file incorporating the requested changes.
Output ONLY the complete HTML file first, then "---REPLY---" followed by a short summary.
Keep all existing functionality that wasn't mentioned in the request.
All CSS and JavaScript must remain inline.`

    const text = await callAnthropic(changeSystem, changePrompt)

    let html: string
    let reply: string | undefined

    if (text.includes("---REPLY---")) {
      const parts = text.split("---REPLY---")
      html = parts[0].trim()
      reply = parts[1].trim()
    } else {
      html = text
    }

    if (html.startsWith("```")) {
      html = html.replace(/^```html?\n?/, "").replace(/\n?```$/, "")
    }

    return Response.json({ html, ...(reply ? { reply } : {}) })
  } catch (error) {
    console.error("Chat API error:", error)
    // Tell the kid what's actually happening so they can decide whether
    // to wait, retry, or try a smaller change. The old "Connection
    // error. Please try again." was vague and unhelpful.
    const errMsg = error instanceof Error ? error.message : String(error)
    const isTimeout = errMsg.toLowerCase().includes("timeout") || errMsg.toLowerCase().includes("aborted")
    return Response.json(
      {
        error: isTimeout
          ? "That took too long. Try a smaller change — describe one thing at a time."
          : "Something went wrong on my end. Try sending your message again in a few seconds.",
      },
      { status: 500 }
    )
  }
}
