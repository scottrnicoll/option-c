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

**Last session (2026-04-09):**
Committed and pushed: learner edit modal, build-wait mini-game (math facts during game generation), leaderboard (top-3 podium + per-grade top 10), visual-concept API improvements, planet view polish, auth token support.

All 6 original chunks complete. Recent work focused on: game chat UX (chip-driven flow, criteria tooltips), self-test loop for generation, Google auth popup, bird logo, admin/guide features.
