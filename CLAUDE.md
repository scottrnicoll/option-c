@AGENTS.md

# Diagonally (formerly Option C)

Educational math app where kids build browser games to master Common Core standards.

## Quick Reference

- **Live:** https://option-c-pi.vercel.app (Vercel, auto-deploys from main)
- **Repo:** https://github.com/mrdavola/option-c
- **Local dev:** `cd C:/projects/option-c && npm run dev` -> http://localhost:3000
- **Firebase project:** option-c-14d3b

## Tech Stack

Next.js 16 (App Router) + TypeScript + Tailwind 4 + Firebase (Auth + Firestore) + Anthropic Claude API + Three.js/react-force-graph-3d for 3D galaxy. Hosted on Vercel.

## How the App Works

**The Galaxy:** A 3D force-directed graph where planets = math concepts and moons = math skills (Common Core standards). Kids navigate this to find skills to learn.

**The Flow:**
1. Learner picks a moon (skill) -> reads the Explore card (concept explanation)
2. Designs a game with AI mentor chat (must meet 3 criteria)
3. AI generates playable HTML game from design doc
4. Submits game for guide (teacher) review
5. Guide plays the game, approves (+2000 tokens) or rejects with feedback
6. Learner demonstrates mastery by winning own game 3x in a row -> "unlocked"
7. Learner plays others' games, wins 3 total -> "mastered"
8. Mastering all moons on a planet triggers supernova animation

**Moon Status States:**
locked -> available (blue) -> in_progress (yellow) -> in_review -> approved_unplayed -> unlocked (green) -> mastered (green + gold)

**Tokens:** +2000 per game approved, +100 per skill mastered. Displayed in top bar.

**Roles:** learner (builds/plays games), guide (reviews games, manages class), admin (setup, invites)

## Key Directories

- `src/app/` — Pages: `/` (galaxy), `/learner`, `/guide`, `/admin`, `/library`
- `src/app/api/` — API routes: game generation, chat, progress, admin
- `src/components/graph/` — Galaxy view, planet view, knowledge graph
- `src/components/game/` — Build screen, workshop, game player, library, leaderboard
- `src/data/standards.json` — Math standards graph (nodes + edges)
- `src/lib/auth.tsx` — Auth context, sign-in flows, token management
- `src/lib/app-rules.ts` — In-app Rules popover content (KEEP IN SYNC with behavior changes)

## Important Patterns

- Progress stored in Firestore: `progress/{uid}/standards/{standardId}`
- Games stored in: `games/{gameId}` with HTML in Cloud Storage
- Learner auth: anonymous Firebase auth + personal code (cosmos words like NOVA-42)
- Returning learners: data migrates from old UID to new anonymous UID each session
- Guides can impersonate learners to test their experience
- Game generation uses AI self-test loop (generates -> playtests -> fixes)
- All AI calls use Anthropic Claude (chat, generation, judging, explanations)

## Session Notes

<!-- Update this section at the end of each work session -->

**Last session (2026-04-10):**
Major session — many features shipped:
- Admin: token economy editor, broadcast messaging, learner class assignment
- Galaxy: moon dots on planets, search bar, color fixes (blue=my grade, purple=previous)
- Game builder: split-screen redesign (chat left, criteria + game card right)
- Library: ranking tab, grade label fix, removed pending games
- Login: "How Diagonally works" bullets
- Feedback: bug icon for Fix, inbox query fix, UID migration for feedback docs
- Build screen: compact layout (no scroll needed)
- Logo header added to guide + learner pages
- Teleprompter page for demo recording at /teleprompter.html
- Demo prep for Worldwide Venture Fellowship (Friday April 10 at 1pm)
- Info buttons added throughout app
- Screenshot + URL on feedback submissions
- Guide page fully restructured to match admin (tabs, games sub-tabs, learner progress grid, weekly progress charts)
- Admin page: play-first flow, Needs Fix + Approve in player top bar, approval records
- WeeklyProgressChart component (reusable, SVG line chart, cumulative + per-week)
- LearnerProgressGrid component (reusable, planet/moon status view)
- Game Card Builder replaces TemplateChat — visual card with 5 slots, 3 options each + mad libs
- Mechanic selection with stick figures (no AI-generated templates)
- 19 mechanics with hardcoded creative options per slot
- Game generation: SVG-only characters (no emoji) + game juice effects
- HTML sanitizer for security on pasted games
- Mechanic descriptions added to all 19 animations
- Card slots redesigned: 3 pre-made buttons + "Write your own" mad-lib (mutually exclusive)
- Criteria renamed: Playable Game, Math Well Applied, Math Essential
- Cascading AI-enhanced card builder (slots reveal one at a time, AI themes each pick)
- Hint Card play mode (practice vs real play)
- Game naming + dare after generation
- Generation prompt fixed to honor learner's theme/character/win choices
- NEXT: Building 19 pre-built game engines (one per mechanic) to replace AI-generated HTML
  - Each engine: 5 rounds, progressive difficulty, game juice, SVG characters
  - AI only generates theme config JSON (names, colors) — no game logic
  - 3 variants per engine (classic/timed/challenge) — infrastructure done
  - Fail tracking: 3 wrong answers = game over (triggers Hint Card)
  - Theme fidelity: card builder choices pass directly to engine API
  - Hint Card content cached in Firestore
  - Diagonally Blueprint updated with all specs
