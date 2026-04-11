// In-app rules content. Surfaced via the "?" button on the galaxy.
//
// !!! KEEP THIS IN SYNC WITH THE ACTUAL APP BEHAVIOR !!!
// See AGENTS.md for the rule about updating this file when behavior changes.

export interface RulesSection {
  heading: string
  // Plain text body. Each entry is a paragraph.
  body: string[]
}

export interface RulesByRole {
  // Sections shown to all roles
  shared: RulesSection[]
  // Sections only shown to learners
  learner: RulesSection[]
  // Sections only shown to guides + admins
  guide: RulesSection[]
}

export const APP_RULES: RulesByRole = {
  shared: [
    {
      heading: "What is Diagonally?",
      body: [
        "Diagonally is a galaxy of math skills. Each planet is a math domain at one grade level (e.g. Geometry Grade 2). Each moon orbiting a planet is a single math skill (one Common Core standard).",
        "Learners pick a moon, learn the concept, build a small game that proves the concept works, and earn tokens once a guide approves the game.",
      ],
    },
    {
      heading: "Moon colors",
      body: [
        "🔵 Blue — at your grade level, ready to explore.",
        "🟡 Yellow — in progress (you've started, submitted a game for review, or your game is approved but you haven't demonstrated it yet).",
        "🟢 Green — demonstrated (you built a game, your guide approved it, AND you won your own game 3 times in a row).",
        "🟣 Purple — available but not at your grade level (only shown when 'My grade' filter is off).",
        "⚫ Grey — locked (prerequisites not met).",
        "🟢 Green with a spinning gold ring — mastered (you played other learners' games on this skill and won 3 times total).",
      ],
    },
    {
      heading: "Planet colors",
      body: [
        "A planet's color summarises the moons inside it. If any moon is yellow, the planet is yellow. If every moon is green, the planet turns green and the supernova fires. If every moon is gold, the planet earns the spinning gold ring.",
      ],
    },
  ],
  learner: [
    {
      heading: "How to demonstrate a skill",
      body: [
        "1. Click a blue moon. Read about the concept.",
        "2. Click 'I have a game idea'. Tell the AI what you want your game to be about.",
        "3. The AI will ask questions to help you nail down the rules. Submit the design when it's ready.",
        "4. Build the game (the AI generates it from your visual concept).",
        "5. Submit your game for review. Your guide will approve or send it back with feedback.",
        "6. When the guide approves, you earn 2000 tokens — but the moon is still YELLOW.",
        "7. Open the moon again and play your own game. Win 3 times IN A ROW. The moon turns GREEN.",
      ],
    },
    {
      heading: "The 3 game criteria",
      body: [
        "Every game you build must meet 3 criteria before you can submit it. As you chat with the AI to design your game, these light up one by one.",
        "🎮 PLAYABLE GAME — Clear idea, clear goal, clear win/lose. A kid can open this, understand the rules in 10 seconds, and know if they won or lost.",
        "🧠 MATH WELL APPLIED — The math skill is used like in the real world. Not simplified, not faked, not just numbers sprinkled on top.",
        "💎 MATH ESSENTIAL — Knowing the math skill is essential to win. Remove the math and the game breaks — the math IS the game.",
        "If you pick one of the game mechanics suggested when you open a moon, MATH WELL APPLIED and MATH ESSENTIAL are already checked for you — those mechanics were designed to embody the math. You only need to work on PLAYABLE GAME.",
        "If you describe your own game from scratch, the AI will check all 3 criteria with you in the chat.",
      ],
    },
    {
      heading: "How to master a skill (gold star)",
      body: [
        "After your moon is green, play other learners' games on the same skill.",
        "Win 3 times total (doesn't have to be in a row, doesn't have to be on the same game).",
        "The moon turns gold. When every moon on a planet is gold, the whole planet earns a spinning gold ring.",
      ],
    },
    {
      heading: "Tokens",
      body: [
        "+2000 tokens when your guide approves a game you built.",
        "+100 tokens when you master a skill (3 wins on others' games).",
        "Tokens persist across sessions when you sign back in with your personal code.",
      ],
    },
    {
      heading: "Sign in / sign out",
      body: [
        "First-time learners join with a class code their guide gives them. They get a personal code (like STAR-742) on their first sign-in.",
        "Returning learners use their NAME + their personal code to come back. All progress, tokens, and games are preserved.",
        "If you forget your code, your guide can look it up.",
      ],
    },
    {
      heading: "Rating other learners' games",
      body: [
        "When a game ends, you'll be asked to rate it 1-5 stars and write a short comment. Your comment is private — only the creator, your guide, and admins can read it.",
      ],
    },
    {
      heading: "Reporting a game",
      body: [
        "If a game is broken or inappropriate, click the 🚩 Report button while playing it. Your guide and the team will see your report.",
      ],
    },
  ],
  guide: [
    {
      heading: "Reviewing learner games",
      body: [
        "When a learner submits a game, it appears in your 'Reviews' tab.",
        "Click 'Play' to play the game and judge whether it actually demonstrates the skill.",
        "Approve: the learner earns 2000 tokens AND their moon goes from blue to YELLOW (not green). They still need to win their own game 3 in a row to turn it green.",
        "Needs Work: the moon goes back to blue and the learner sees your feedback in their inbox.",
      ],
    },
    {
      heading: "Un-approving a published game",
      body: [
        "If a previously-approved game has problems, open it from the Game Library and click 'Un-approve' in the top bar.",
        "You must enter a reason. The learner's standard reverts to 'in progress' (yellow). Tokens are NOT clawed back.",
      ],
    },
    {
      heading: "Inboxes",
      body: [
        "All messages from learners (feedback, reports, replies) land in your inbox. Reply directly inline.",
      ],
    },
  ],
}
