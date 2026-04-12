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
        "Diagonally is a galaxy of math skills. It contains 66 planets (math domains) and 535 moons (math skills — one per Common Core standard).",
        "Click a planet to zoom in and explore its moons. Click a moon to learn the concept and build a game.",
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
        "1. Click a blue moon. Read \"This is about...\" and \"Where you'll use this\".",
        "2. Click \"Build Your Game\" to open the Game Assembler.",
        "3. Pick your components: Background, Character, Game Option, Items, and Win Condition.",
        "4. Watch the 3 criteria lights — when all 3 are lit, click \"Build my game\".",
        "5. Name your game and write an optional dare. Test it in the Game Testing Lab.",
        "6. Submit for review. Your guide will approve or send it back with feedback.",
        "7. When approved, you earn tokens — but the moon is still YELLOW.",
        "8. Play your own game and win 3 times IN A ROW. The moon turns GREEN.",
      ],
    },
    {
      heading: "The 3 game criteria",
      body: [
        "As you fill the Game Assembler, 3 criteria lights illuminate one by one:",
        "🧠 MATH WELL APPLIED — Lights up when you pick a Game Option. The math is built into the game mechanic.",
        "💎 MATH ESSENTIAL — Lights up when you pick a Game Option AND set a Win Condition. The math is essential to winning.",
        "🎮 PLAYABLE GAME — Lights up when all 5 components are filled (Background, Character, Game Option, Items, Win Condition).",
        "When all 3 lights are on, your game is ready to build!",
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
        "You have two token balances: Lifetime Tokens (total ever earned, used for ranking) and Spendable Tokens (available to use).",
        "+2,000 tokens when your guide approves a game you built.",
        "+100 tokens when you master a skill (3 wins on others' games).",
        "+10 tokens every time a unique learner plays your game.",
        "Tokens persist across sessions when you sign back in with your personal code.",
      ],
    },
    {
      heading: "\"I had a Diagonal Idea!\"",
      body: [
        "See something that could make Diagonally better? Click the blue feedback button and share your idea!",
        "If your idea is practical enough for us to build, you win a Diagonal Idea prize:",
        "Diagonal Spark — a good, practical idea (1,000 tokens).",
        "Diagonal Idea — a really impactful idea (5,000 tokens).",
        "Diagonal Vision — a transformative idea (10,000 tokens).",
        "You can win prizes multiple times. Your prizes show up as badges next to your name on My Stuff.",
        "The key: your idea needs to be something we can actually build into the app!",
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
