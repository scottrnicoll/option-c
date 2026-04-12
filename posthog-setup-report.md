<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Diagonally (Next.js 16, App Router). Here is a summary of every change made:

**New files created:**
- `instrumentation-client.ts` — Client-side PostHog initialization using the Next.js 15.3+ `instrumentation-client` pattern. Enables automatic exception capture and session replay.
- `src/lib/posthog-server.ts` — Singleton server-side PostHog client (`posthog-node`) used in API routes.

**Modified files:**
- `next.config.ts` — Added PostHog reverse-proxy rewrites (`/ingest/*` → `us.i.posthog.com`) and `skipTrailingSlashRedirect: true`.
- `.env.local` — Added `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`.

**Event tracking added across 7 files:**

| Event | Description | File |
|---|---|---|
| `learner_signed_in` | Learner signed in via class code or personal code; includes `is_new_learner` and `via` properties. `posthog.identify()` called with UID and role. | `src/lib/auth.tsx` |
| `guide_signed_in` | Guide signed in via email or Google; includes `method` property. `posthog.identify()` called with UID and email. | `src/lib/auth.tsx` |
| `onboarding_started` | New learner clicks "I'm new — I have a class code" on the welcome screen. | `src/components/onboarding/onboarding-flow.tsx` |
| `game_card_completed` | Learner fills all 5 slots on the game card builder and triggers game generation; includes `standard_id`, `mechanic`, `vibe`, `theme`, `character`. | `src/components/standard/game-card-builder.tsx` |
| `game_generated` | Server-side: AI successfully generates a game HTML; includes `standard_id`, `vibe`, `core_verb`, `generation_seconds`. | `src/app/api/game/generate/route.ts` |
| `game_approved` | Server-side: guide approves a learner's game; includes `game_id`, `author_uid`, `standard_id`, `has_comment`. | `src/app/api/game/[id]/approve/route.ts` |
| `game_rejected` | Server-side: guide rejects a learner's game; same properties as `game_approved`. | `src/app/api/game/[id]/approve/route.ts` |
| `own_game_win` | Learner wins a round of their own approved game during the mastery demonstration loop; includes `standard_id`, `streak`. | `src/components/standard/mastery-play.tsx` |
| `standard_unlocked` | Learner wins their own game 3 times in a row — moon flips to green/unlocked; includes `standard_id`. | `src/components/standard/mastery-play.tsx` |
| `library_game_played` | Learner starts playing a published game from the library (non-author only); includes `game_id`, `play_mode`, `standard_id`. | `src/components/game/game-player.tsx` |
| `library_game_won` | Learner wins a library game in "master" play mode; includes `game_id`, `standard_id`. | `src/components/game/game-player.tsx` |

## Next steps

We've built a dashboard and 5 insights for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://us.posthog.com/project/378879/dashboard/1457949
- **Game-building funnel** (onboarding → card complete → game generated): https://us.posthog.com/project/378879/insights/dIOAknCS
- **Daily active learners & guides** (DAU by role): https://us.posthog.com/project/378879/insights/3Tq2uUYt
- **Mastery progression** (own game wins + standards unlocked per week): https://us.posthog.com/project/378879/insights/g6iQuxY7
- **Game review outcomes** (approved vs. rejected per week): https://us.posthog.com/project/378879/insights/bbMfkSA2
- **Library game engagement** (played vs. won per week): https://us.posthog.com/project/378879/insights/uKsg7L6o

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
