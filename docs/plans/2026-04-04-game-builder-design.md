# Game Builder — Design Doc

**Date:** 2026-04-04
**Status:** Approved

---

## Vision

After a student proves their game idea to the Genie (3 criteria met), they hit "Build my Game" and an AI generates a real, playable browser game from their design. The student refines it through conversation, then shares it with the community. The game becomes a portfolio piece — proof they understand the math.

## The Flow

```
Genie Chat (3 criteria met)
    ↓
"Build my Game" button
    ↓
Active Build Screen (15-30 seconds)
  - Matrix-style green code rain (left side)
  - Genie narrating what it's building (right side)
  - Math micro-prompts to keep student engaged
  - Design questions that affect the actual game
  - Progress bar
    ↓
Game Workshop
  - Left: playable game in iframe (~65% width)
  - Right: Genie chat for refinements (~35% width)
  - Student plays, finds issues, chats to fix
  - Game hot-reloads on each refinement
  - Auto-saves as draft
    ↓
"Send for Review" button
    ↓
Review Pipeline
  1. AI review (instant) — does game work? does math hold up?
  2. Peer play-test (async, future) — game factory conveyor belt
  3. Teacher approval (async, future) — teacher dashboard
    ↓
Published to Community Library
  - On the planet it belongs to
  - In the central game library
  - Game card: title, designer, concept, rating, play count
```

## Active Build Screen

Full screen, dark background. The 15-30 seconds while Gemini generates the game.

**Left side: Matrix code rain**
- Green characters falling (Matrix-style)
- Decorative — student can't read it but feels like real code is being written
- Green color theme (#22c55e)

**Right side: Genie interaction**
Three types of messages alternate:
1. **Narration**: "Setting up the game board...", "Adding your scoring rules...", "Creating the win condition..."
2. **Math micro-prompts**: "Quick — your game has 3 rounds with 5 points each. What's the max score?" Student answers, Genie responds.
3. **Design questions**: "I'm drawing the background. Jungle or outer space?" — answers get injected into the Gemini prompt and affect the actual generated game.

**Bottom: Progress bar**
Fills over 15-30 seconds. Labeled with current build phase.

## Game Workshop

Split-screen environment for playing and refining.

**Layout (desktop):**
```
┌──────────────────────────────────────────────────┐
│  ← Back to Planet    [Game Title]    🟢 Draft     │
├────────────────────────┬─────────────────────────┤
│                        │                         │
│    [PLAYABLE GAME]     │  Genie Chat             │
│    iframe              │  for refinements        │
│    ~65% width          │  ~35% width             │
│                        │                         │
├────────────────────────┴─────────────────────────┤
│              [ Send for Review ]                  │
└──────────────────────────────────────────────────┘
```

**Layout (mobile):**
Game takes full screen. Floating chat button in corner. Tap to slide up Genie chat overlay.

**Key behaviors:**
- Each refinement message → new Gemini API call → iframe hot-reloads
- "Send for Review" only enabled after student has played at least once
- "Back to Planet" auto-saves as draft
- Game title auto-generated from design, student can edit

## Design Doc Generation

The structured game design is auto-extracted from the Genie conversation. The AI summarizes the chat into:

```json
{
  "title": "Fraction Pizza Party",
  "concept": "Comparing fractions with unlike denominators",
  "standardId": "5.NF.A.1",
  "howItWorks": "Players take turns splitting pizzas into different fractions...",
  "rules": ["Each player starts with 3 whole pizzas", "..."],
  "winCondition": "First player to correctly compare 10 fractions wins",
  "mathRole": "Players must compare fractions to decide which pizza slice is bigger",
  "designChoices": {
    "vibe": "outer space",
    "color": "dark purple",
    "characters": "aliens"
  }
}
```

This JSON gets sent to the Gemini API as the game generation prompt. The `designChoices` are populated from the Active Build Screen questions.

## Review Pipeline

### Step 1: AI Review (MVP — build now)
When student hits "Send for Review":
- AI reads the game HTML and checks:
  - Does it load without errors? (basic HTML validation)
  - Does it contain interactive elements? (not just static text)
  - Does the game description reference the math concept?
- Pass → status changes to "published" (for MVP, no peer/teacher review yet)
- Fail → specific feedback, student returns to Workshop

### Step 2: Peer Play-Test (future — game factory)
- Games enter a queue (conveyor belt visual)
- Students get prompted: "Want to play-test a classmate's game?"
- 3 questions: "Could you play it?", "Did you use math?", "Was it fun?"
- 2/3 thumbs up → advances. Otherwise → feedback to designer.

### Step 3: Teacher Approval (future)
- Teacher dashboard shows games awaiting approval
- Teacher sees: game, math concept, peer reviews
- Approve or return with notes

## Community Library

### On a planet (contextual)
When viewing a planet's moons, a "Community Games" section shows games built for that planet's standards. "See what classmates built for Fractions."

### Central library (browsable)
A dedicated `/library` page:
- Grid of game cards
- Filter by: grade, domain, rating
- Search by title or concept

### Game Card
```
┌─────────────────────────────┐
│  [Game Preview Thumbnail]   │
│                             │
│  Fraction Pizza Party       │
│  by Mike D. · Grade 5       │
│  ★★★★☆ (12 plays)          │
│                             │
│  [ Play ]                   │
└─────────────────────────────┘
```

Clicking "Play" opens the game in a modal/full-screen iframe.

## Technical Architecture

### Game Generation
- **Gemini API** (gemini-2.5-flash or gemini-3-pro) via `@google/genai` SDK
- Single prompt → single HTML file response
- Prompt includes: design doc JSON + "Generate a complete self-contained HTML file with inline CSS and JS"
- Cost: ~$0.001-0.002 per generation
- Refinements: append student's feedback to the conversation, regenerate

### Storage: Firebase Firestore
```
games (collection)
├── {gameId} (document)
│   ├── title: string
│   ├── designerName: string
│   ├── standardId: string
│   ├── planetId: string
│   ├── gameHtml: string (the full HTML)
│   ├── designDoc: object (the structured design)
│   ├── status: "draft" | "in_review" | "published"
│   ├── playCount: number
│   ├── ratingSum: number
│   ├── ratingCount: number
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── chatHistory: array (refinement conversation)
```

### Game Rendering
- Sandboxed iframe with `sandbox="allow-scripts"` attribute
- No access to parent page, cookies, or navigation
- Game HTML served from a Next.js API route that reads from Firestore

### New Dependencies
- `firebase` / `firebase-admin` — Firestore client
- `@google/genai` — Gemini API client

### New API Routes
- `POST /api/game/generate` — generate game HTML from design doc
- `POST /api/game/refine` — regenerate with refinement instructions
- `POST /api/game/save` — save/update game in Firestore
- `GET /api/game/[id]` — get game data (for playing)
- `GET /api/game/[id]/html` — serve game HTML (for iframe src)
- `POST /api/game/[id]/review` — run AI review
- `POST /api/game/[id]/rate` — submit a rating
- `GET /api/games` — list games (for library)
- `GET /api/games/planet/[planetId]` — games for a specific planet

### New Components
- `src/components/game/build-screen.tsx` — Active Build Screen with Matrix rain
- `src/components/game/workshop.tsx` — Game Workshop (iframe + chat)
- `src/components/game/game-card.tsx` — Game card for library
- `src/components/game/game-library.tsx` — Library grid
- `src/components/game/game-player.tsx` — Full-screen game player modal
- `src/app/library/page.tsx` — Central library page

### Modified Components
- `src/components/standard/genie-chat.tsx` — "Build my Game" button after 3 criteria
- `src/components/graph/graph-page.tsx` — route to Workshop after build
- `src/components/graph/planet-view.tsx` — show community games on planet

## MVP Scope (build now)

1. Design doc auto-extraction from Genie chat
2. Active Build Screen with Matrix rain + narration + design questions
3. Gemini API game generation (single-file HTML)
4. Game Workshop with iframe + chat refinement
5. Firebase Firestore for game storage
6. AI review gate
7. Game cards on planets (community games section)
8. Central library page
9. Play game in iframe modal
10. Rating system (star rating after playing)

## Deferred (build later)

- Peer play-test game factory (conveyor belt UI)
- Teacher approval dashboard
- Comments/discussions on games
- Game thumbnails (screenshot generation)
- Firebase Auth (use onboarding name for now)
- Game versioning (save multiple iterations)
- Multiplayer games
- Game remix ("fork this game and make it your own")
