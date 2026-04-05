# Option C2: Auth, Peer Reviews, Mastery & UX Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Firebase authentication (class codes for students, invite-only guides), peer game reviews, mastery-through-play, teacher dashboard, and UX fixes from user testing feedback.

**Architecture:** Firebase Auth (anonymous + Google link) for students, email/Google for guides. Firestore for all persistent data (users, classes, progress, games). New `/guide` route group for teacher dashboard. Existing components updated to read/write from auth context instead of localStorage.

**Tech Stack:** Firebase Auth, Firestore, Next.js 16 App Router, React 19, Tailwind CSS, shadcn/ui

**Design doc:** `docs/plans/2026-04-05-auth-reviews-mastery-design.md`

---

## Task 1: Firebase Auth Setup

**Files:**
- Modify: `src/lib/firebase.ts`
- Create: `src/lib/auth.tsx`
- Create: `src/lib/auth-types.ts`
- Modify: `package.json` (no new deps — firebase already includes auth)

**Step 1: Add Firebase Auth export to firebase.ts**

```ts
// src/lib/firebase.ts — add getAuth import and export
import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const db = getFirestore(app)
export const auth = getAuth(app)
```

**Step 2: Create auth types**

```ts
// src/lib/auth-types.ts
export interface UserProfile {
  uid: string
  name: string
  role: "student" | "guide" | "admin"
  grade: string
  interests: string[]
  classId: string
  tokens: number
  linkedGoogleUid?: string
  createdAt: number
  lastLoginAt: number
}

export interface ClassDoc {
  name: string
  code: string
  guideUid: string
  createdAt: number
}

export interface ProgressDoc {
  status: "locked" | "available" | "in_progress" | "unlocked" | "mastered"
  unlockedAt?: number
  masteredAt?: number
  masteryWins?: number
}
```

**Step 3: Create AuthProvider context**

Create `src/lib/auth.tsx` — a React context that:
- Listens to Firebase `onAuthStateChanged`
- Loads user profile from `users/{uid}` Firestore doc
- Exposes: `user`, `profile`, `loading`, `signInStudent(classCode, name)`, `signInGuide(email, password)`, `signInWithGoogle()`, `signOut()`
- `signInStudent`: queries `classes` collection for matching code, then calls `signInAnonymously`, creates/matches user doc in that class
- Session persists via Firebase's built-in `browserLocalPersistence`

Key functions:
- `signInStudent(code, name)`: query classes where code matches → signInAnonymously → create or match user doc (query users where classId + name match, if found, use custom token or re-link; if not, create new)
- `signInGuide(email, pw)`: signInWithEmailAndPassword
- `signInWithGoogle()`: signInWithPopup(GoogleAuthProvider) — for guide signup or student linking
- `linkGoogleAccount()`: linkWithPopup for students who want cross-device
- `updateTokens(delta)`: increment tokens in Firestore user doc
- `loadProgress()`: fetch all docs from `progress/{uid}/standards/`
- `saveProgress(standardId, status)`: set doc in `progress/{uid}/standards/{standardId}`

**Step 4: Wrap app in AuthProvider**

Modify `src/app/layout.tsx` to wrap children in `<AuthProvider>`.

**Step 5: Enable Firebase Auth in Firebase Console**

User must enable Anonymous auth and Google auth providers in their Firebase project console. Add a note in the plan output.

**Step 6: Commit**

```bash
git add src/lib/firebase.ts src/lib/auth.tsx src/lib/auth-types.ts src/app/layout.tsx
git commit -m "feat: add Firebase Auth provider with student/guide login support"
```

---

## Task 2: Student Login Flow

**Files:**
- Modify: `src/components/onboarding/onboarding-flow.tsx`
- Modify: `src/components/graph/graph-page.tsx`

**Step 1: Update OnboardingFlow to handle auth**

The onboarding flow currently captures name, grade, interests and passes them to GraphPage. Update it to:
- Add a new first step: "Join a class" with class code input
- After class code + name, call `signInStudent(code, name)` from auth context
- If user is already authenticated (returning visit), skip onboarding entirely
- After grade + interests steps, save to Firestore user doc

Flow becomes: Class Code → Name → Grade → Intro → Interests → Done

**Step 2: Update GraphPage to load from auth**

GraphPage currently stores onboarding state and progress in local state. Update to:
- Check auth context on mount — if user exists, load their profile + progress from Firestore
- Skip onboarding if already authenticated
- Replace localStorage token reads with Firestore profile.tokens
- Replace fire-and-forget progress API with Firestore writes via auth context
- On unlock, call `saveProgress(standardId, "unlocked")` + `updateTokens(5)`

**Step 3: Handle returning users**

- If Firebase auth state exists on mount → load profile → skip onboarding → show galaxy
- If no auth state → show onboarding starting with class code step

**Step 4: Commit**

```bash
git add src/components/onboarding/onboarding-flow.tsx src/components/graph/graph-page.tsx
git commit -m "feat: student login via class code, persist progress to Firestore"
```

---

## Task 3: Guide Login & Admin Invite Flow

**Files:**
- Create: `src/app/guide/page.tsx`
- Create: `src/app/guide/login/page.tsx`
- Create: `src/app/guide/layout.tsx`
- Create: `src/app/api/admin/invite-guide/route.ts`
- Create: `src/app/api/admin/create-class/route.ts`

**Step 1: Guide login page**

Create `src/app/guide/login/page.tsx`:
- Email + password form
- "Sign in with Google" button
- On success, redirect to `/guide`
- If user.role !== "guide", show error

**Step 2: Guide layout with auth guard**

Create `src/app/guide/layout.tsx`:
- Check auth context — if not guide role, redirect to `/guide/login`
- Sidebar or top nav: Class, Students, Pending Reviews, Game Library

**Step 3: Admin invite API**

Create `src/app/api/admin/invite-guide/route.ts`:
- POST with `{ email, className }` 
- Uses Firebase Admin SDK (server-side) to create user with email
- Creates class doc with generated code
- Sets user doc with role: "guide"
- Returns the class code

Note: This requires `firebase-admin` package and a service account key. Add `FIREBASE_SERVICE_ACCOUNT_KEY` env var (JSON string of the service account).

**Step 4: Create class API**

Create `src/app/api/admin/create-class/route.ts`:
- POST with `{ name, guideUid }`
- Generates a unique 6-char class code (e.g., "MATH7B")
- Creates class doc in Firestore
- Returns `{ classId, code }`

**Step 5: Install firebase-admin**

```bash
npm install firebase-admin
```

Create `src/lib/firebase-admin.ts` for server-side Firebase usage.

**Step 6: Commit**

```bash
git add src/app/guide/ src/app/api/admin/ src/lib/firebase-admin.ts package.json package-lock.json
git commit -m "feat: guide login, admin invite flow, class creation API"
```

---

## Task 4: Migrate Tokens & Progress to Firestore

**Files:**
- Modify: `src/lib/tokens.ts`
- Delete fire-and-forget calls in: `src/components/graph/graph-page.tsx`
- Modify: `src/app/api/progress/unlock/route.ts`

**Step 1: Rewrite tokens.ts**

Replace localStorage implementation with Firestore-backed functions that use auth context:

```ts
// src/lib/tokens.ts
import { db } from "./firebase"
import { doc, updateDoc, increment } from "firebase/firestore"

export async function addTokensFirestore(uid: string, n: number): Promise<void> {
  await updateDoc(doc(db, "users", uid), { tokens: increment(n) })
}

// Keep getTokens/addTokens as sync wrappers for backward compat during migration
// They read from the profile in auth context, not localStorage
```

**Step 2: Update graph-page.tsx token handling**

Replace all `addTokens()` / `getTokens()` / `setTokens()` calls with auth context methods that write to Firestore.

**Step 3: Update progress unlock**

Replace fire-and-forget `fetch("/api/progress/unlock")` with direct Firestore write via auth context:
```ts
saveProgress(standardId, { status: "unlocked", unlockedAt: Date.now() })
```

**Step 4: Update progress loading**

On mount, load all progress docs from `progress/{uid}/standards/*` and populate the progressMap.

**Step 5: Commit**

```bash
git add src/lib/tokens.ts src/components/graph/graph-page.tsx src/app/api/progress/
git commit -m "feat: migrate tokens and progress from localStorage to Firestore"
```

---

## Task 5: Update Game Model for Auth

**Files:**
- Modify: `src/lib/game-types.ts`
- Modify: `src/app/api/game/save/route.ts`
- Modify: `src/components/game/workshop.tsx`
- Modify: `src/components/graph/graph-page.tsx`

**Step 1: Update Game type**

Add to `game-types.ts`:
```ts
export interface GameReview {
  reviewerUid: string
  reviewerName: string
  approved: boolean
  comment?: string
  createdAt: number
}

export interface Game {
  // ...existing fields
  authorUid: string
  classId: string
  status: "draft" | "pending_review" | "published"
  reviews: GameReview[]
  approvedBy?: string
}
```

**Step 2: Update game save API**

Update `src/app/api/game/save/route.ts` to include `authorUid` and `classId` fields.

**Step 3: Update Workshop save calls**

Workshop and GraphPage pass `authorUid` and `classId` from auth context when saving games.

**Step 4: Update "Send for Review"**

Change `handleSendForReview` in graph-page.tsx:
- Save with status `pending_review` (not `in_review`)
- Remove the automatic AI review call — review is now peer/guide-driven
- Show a "Sent for review!" confirmation instead

**Step 5: Commit**

```bash
git add src/lib/game-types.ts src/app/api/game/save/route.ts src/components/game/workshop.tsx src/components/graph/graph-page.tsx
git commit -m "feat: update game model with authorUid, classId, peer review fields"
```

---

## Task 6: Peer Review System

**Files:**
- Create: `src/app/api/game/[id]/approve/route.ts`
- Create: `src/components/game/review-panel.tsx`
- Modify: `src/app/api/games/route.ts`
- Modify: `src/components/game/game-library.tsx`
- Modify: `src/components/game/game-player.tsx`

**Step 1: Create approve/comment API**

`src/app/api/game/[id]/approve/route.ts`:
- POST with `{ reviewerUid, reviewerName, approved, comment? }`
- Validates reviewer is in same class, not the author
- Adds review to game's reviews array
- If approved: set status to "published", set approvedBy, increment author's tokens by 1
- Returns updated game status

**Step 2: Update games list API**

Update `src/app/api/games/route.ts` to accept `?classId=X&status=pending_review` query params so the library can show pending games for the class.

**Step 3: Create ReviewPanel component**

`src/components/game/review-panel.tsx`:
- Shows after playing a pending game
- "Approve" button and "Needs Work" button
- Optional comment textarea
- Calls approve API
- Shows confirmation

**Step 4: Update GameLibrary**

Update `src/components/game/game-library.tsx`:
- Add "Needs Review" tab/filter showing pending_review games from student's class
- Badge showing "Needs Review" on pending games
- Hide student's own pending games from review (can't review your own)
- After playing a pending game, show ReviewPanel

**Step 5: Update GamePlayer**

Update `src/components/game/game-player.tsx`:
- Accept `isPendingReview` prop
- After playing (instead of/alongside rating), show ReviewPanel if pending
- Pass reviewer info from auth context

**Step 6: Commit**

```bash
git add src/app/api/game/[id]/approve/ src/components/game/review-panel.tsx src/app/api/games/route.ts src/components/game/game-library.tsx src/components/game/game-player.tsx
git commit -m "feat: peer review system with approve/comment flow"
```

---

## Task 7: Mastery-Through-Play

**Files:**
- Modify: `src/components/standard/standard-panel.tsx`
- Modify: `src/lib/graph-types.ts`
- Create: `src/components/standard/mastery-play.tsx`
- Modify: `src/components/graph/graph-page.tsx`

**Step 1: Add "mastered" status to NodeStatus**

Update `src/lib/graph-types.ts`:
```ts
export type NodeStatus = "locked" | "available" | "in_progress" | "unlocked" | "mastered"
```

**Step 2: Create MasteryPlay component**

`src/components/standard/mastery-play.tsx`:
- Shows approved games for this skill (from class)
- Fetches from `/api/games?classId=X&planetId=Y&status=published`
- Each game card with "Play to master" button
- Tracks wins (0/3) — uses `postMessage` from iframe to detect wins (game already posts win/lose events)
- After 3 wins: calls `saveProgress(standardId, { status: "mastered", masteredAt: Date.now() })` and `updateTokens(5)`
- Shows celebration message

**Step 3: Update StandardPanel with "master" step**

Update `src/components/standard/standard-panel.tsx`:
- Add `"master"` to FlowStep type: `"learn" | "earn" | "unlocked" | "master"`
- After "unlocked" status, show MasteryPlay component
- When mastered, show "Mastered" state with different icon/color

**Step 4: Update GraphPage for mastery**

- Update galaxy-utils color mapping to show mastered differently from unlocked
- When mastery completes, trigger mastery animation + token notification

**Step 5: Commit**

```bash
git add src/lib/graph-types.ts src/components/standard/mastery-play.tsx src/components/standard/standard-panel.tsx src/components/graph/graph-page.tsx
git commit -m "feat: mastery-through-play — win 3 rounds to master a skill"
```

---

## Task 8: Teacher Dashboard

**Files:**
- Create: `src/app/guide/page.tsx` (class overview)
- Create: `src/components/guide/class-overview.tsx`
- Create: `src/components/guide/student-roster.tsx`
- Create: `src/components/guide/student-detail.tsx`
- Create: `src/components/guide/pending-reviews.tsx`
- Create: `src/app/api/guide/class/[classId]/route.ts`
- Create: `src/app/api/guide/class/[classId]/students/route.ts`
- Create: `src/app/api/guide/class/[classId]/regenerate-code/route.ts`

**Step 1: Class overview page**

`src/app/guide/page.tsx`:
- Fetch guide's class from Firestore (query classes where guideUid matches)
- Show class name, join code (with copy button), student count
- Tabs: Students | Pending Reviews | Game Library

**Step 2: Student roster component**

`src/components/guide/student-roster.tsx`:
- Table: name, last active, tokens, skills unlocked, skills mastered
- Click row → expand to StudentDetail

**Step 3: Student detail component**

`src/components/guide/student-detail.tsx`:
- Galaxy progress summary (counts by planet)
- List of games built with status badges
- Progress breakdown

**Step 4: Pending reviews component**

`src/components/guide/pending-reviews.tsx`:
- List pending_review games from the class
- Play button → opens GamePlayer
- Approve/comment buttons (guide can always approve)
- Uses same approve API from Task 6

**Step 5: API routes**

- `src/app/api/guide/class/[classId]/route.ts`: GET class details + stats
- `src/app/api/guide/class/[classId]/students/route.ts`: GET all students with progress summaries
- `src/app/api/guide/class/[classId]/regenerate-code/route.ts`: POST generates new class code

**Step 6: Commit**

```bash
git add src/app/guide/ src/components/guide/ src/app/api/guide/
git commit -m "feat: teacher dashboard with roster, progress, and review management"
```

---

## Task 9: UX Fixes — AI Prompt Guardrails

**Files:**
- Modify: `src/app/api/game/chat/route.ts`
- Modify: `src/app/api/game/generate/route.ts`

**Step 1: Update game chat route with guardrails + question detection**

Rewrite `src/app/api/game/chat/route.ts`:
- Detect if message is a question (starts with what/why/how/can/does/is/help/explain) → respond without modifying HTML, return `{ reply }` only
- For change requests → return `{ html, reply }`
- Add system prompt guardrails: "CRITICAL RULES — never break these: 1) Math concept must remain essential to win. 2) Math must be applied realistically. 3) Game must remain playable and understandable. 4) Game must have a clear end (win/lose after rounds). 5) Never use overflow:hidden on body. If the request would break a rule, explain why and make the closest version that still follows them."
- Change loading text to "Thinking..." (already done in workshop.tsx)
- Add retry on error (try up to 2 times before returning error)

**Step 2: Update game generate route**

Add to the generation prompt in `src/app/api/game/generate/route.ts`:
- "The game MUST end after 3-5 rounds with a clear win/lose screen showing the final score."
- "NEVER use overflow:hidden on the body or main container. The game must be scrollable if content exceeds viewport height."
- "Each round must use different numbers/values so the player can't memorize answers."

**Step 3: Commit**

```bash
git add src/app/api/game/chat/route.ts src/app/api/game/generate/route.ts
git commit -m "fix: AI chat guardrails, question detection, game ending + scroll fixes"
```

---

## Task 10: UX Fixes — Mini-Map Redesign

**Files:**
- Modify: `src/components/graph/mini-map.tsx`

**Step 1: Redesign mini-map**

Update `src/components/graph/mini-map.tsx`:
- Default state: collapsed — small 40x40 icon (tiny galaxy dots) in bottom-left
- On hover (desktop) or tap (mobile): expand to show the full map + stats
- Remove the progress bar
- Keep the two text lines: "X/Y skills available" and "X/Y skills mastered"
- Add smooth expand/collapse transition
- Close on mouse leave (desktop) or tap outside (mobile)

**Step 2: Commit**

```bash
git add src/components/graph/mini-map.tsx
git commit -m "fix: mini-map hidden by default, expands on hover/tap, remove progress bar"
```

---

## Task 11: UX Fixes — Galaxy Zoom Control

**Files:**
- Modify: `src/components/graph/galaxy-view.tsx`

**Step 1: Add zoom slider**

Update `src/components/graph/galaxy-view.tsx`:
- Add a vertical slider in the bottom-right corner (above legend)
- Slider controls camera distance (zoom level)
- Connect to ForceGraph3D's camera z-position
- Add "+" and "-" buttons at top/bottom of slider
- On mobile: show a small hint "Pinch to zoom" that fades after 3 seconds
- Sync slider position when user zooms with scroll/pinch

**Step 2: Commit**

```bash
git add src/components/graph/galaxy-view.tsx
git commit -m "fix: add zoom slider control to galaxy view"
```

---

## Task 12: UX Fixes — Workshop & Concept Card Polish

**Files:**
- Modify: `src/components/game/workshop.tsx`
- Modify: `src/components/standard/concept-card.tsx`
- Modify: `src/components/standard/criteria-progress.tsx`

**Step 1: Move "Send for Review" button**

Update `src/components/game/workshop.tsx`:
- Remove "Send for Review" from top bar
- Add it below the chat panel as a distinct button, separated from chat input by a divider
- Add visual distinction: larger button, different color, with explanatory text "Ready? Submit your game for classmates to review"

**Step 2: Auto-use interests in concept card**

Update `src/components/standard/concept-card.tsx`:
- If `interests` prop is provided and non-empty, start in "challenge" mode by default (not "default")
- Set the first interest as `customInterest` automatically
- User can still switch to "default" or "simpler" modes

**Step 3: Update criteria wording**

The criteria labels in `src/components/standard/criteria-progress.tsx` are already updated:
- "Your game makes sense" (playable) ✓
- "The math is applied like in real life" (authentic) ✓ 
- "You need math to win" (essential) ✓

These look good already. No changes needed here.

**Step 4: Commit**

```bash
git add src/components/game/workshop.tsx src/components/standard/concept-card.tsx
git commit -m "fix: move Send for Review below chat, auto-use interests in explanations"
```

---

## Task 13: Firebase Console Setup & Environment Variables

**Manual steps (not code):**

1. Go to Firebase Console → Authentication → Sign-in Methods
   - Enable "Anonymous" provider
   - Enable "Google" provider
   - Enable "Email/Password" provider

2. Go to Firebase Console → Firestore → Rules
   - Set rules allowing authenticated users to read/write their own data
   - Allow guide role to read class members' data

3. Generate a Firebase Admin service account key:
   - Firebase Console → Project Settings → Service Accounts → Generate New Private Key
   - Add as `FIREBASE_SERVICE_ACCOUNT_KEY` env var in Vercel (JSON string, base64 encoded)

4. Add to `.env.local`:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY=<base64 encoded JSON>
   ```

5. Commit Firestore security rules:

```bash
# Create firestore.rules file
git add firestore.rules
git commit -m "feat: add Firestore security rules for auth"
```

---

## Execution Order & Dependencies

```
Task 1 (Firebase Auth Setup)
  └→ Task 2 (Student Login)
  └→ Task 3 (Guide Login + Admin)
  └→ Task 4 (Migrate Tokens/Progress)
      └→ Task 5 (Game Model for Auth)
          └→ Task 6 (Peer Review)
          └→ Task 7 (Mastery-Through-Play)
          └→ Task 8 (Teacher Dashboard)

Tasks 9-12 (UX Fixes) — independent of each other, can run in parallel
Task 13 (Firebase Console) — do first or alongside Task 1
```

**Recommended order:** 13 → 1 → 2 → 4 → 5 → 3 → 6 → 7 → 8 → 9 → 10 → 11 → 12

Tasks 9-12 can be done any time and in parallel since they're isolated UX fixes.
