# Student Experience: Dashboard, Game Saves Fix, Navigation & Review Flow

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix broken game saves, add a student dashboard, student navigation, and a complete post-review flow so students can track their games and progress.

**Architecture:** Client-side Firestore writes replace broken API routes. New `/student` page for dashboard. Minimal top nav for students. New `in_review` concept status for pending games. Notifications computed from game data, not a separate system.

**Tech Stack:** Firebase Auth + Firestore, Next.js 16 App Router, React 19, Tailwind CSS, shadcn/ui

---

## Fix: Game Saves (500 errors)

Move all `fetch("/api/game/save")` calls to direct client-side Firestore `setDoc` calls. The client SDK has the user's auth token so Firestore rules pass. Matches how tokens and progress already work.

Affected files: `graph-page.tsx` (handleBackToPlanet, handleSendForReview), `workshop.tsx` (saveDraft).

---

## Student Navigation

Minimal top nav with two items:
- **"Explore"** — links to `/` (galaxy view)
- **"My Stuff"** — links to `/student` (dashboard)

Placement: top-left, small and unobtrusive. Galaxy should still feel immersive.

Only shows for students (guides have their own nav). Persists across galaxy and planet views. Hides during fullscreen flows (game building, workshop).

---

## Student Dashboard (`/student`)

Three sections on one page:

### My Games
- List of all games the student has built (query `games` where `authorUid` matches)
- Each card: game title, concept name, status badge (draft / pending review / approved / needs work), date
- Click draft → back to workshop to keep editing
- Click approved game → play it

### Notifications
- Computed from game status changes, not a separate data model
- "Your game [title] was approved!" — when status is `published`
- "New games to review from your class" — when `pending_review` games from classmates exist
- Simple list, newest first

### Progress Stats
- Skills explored, skills unlocked, skills mastered
- Tokens earned
- Games built count
- Simple number cards, no charts

---

## "Pending" Concept State on Galaxy

New status `in_review` between `in_progress` and `unlocked`:
- Flow: available → in_progress → in_review → unlocked → mastered
- Moon gets amber/yellow color in galaxy view
- Standard panel shows "Your game is being reviewed" with link to My Games
- When game is approved (existing approve API), concept moves to `unlocked`

---

## What's deliberately excluded (YAGNI)
- No real-time push notifications — computed on page load
- No separate notifications collection in Firestore
- No chat/messaging between students and reviewers
- No charts or complex analytics on student dashboard
