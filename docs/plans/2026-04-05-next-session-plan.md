# Next Session: Student Onboarding, Multi-Class Guides & Cleanup

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix student onboarding flow post-auth, add multi-class support for guides, and clean up debug code.

**Architecture:** Minimal changes — fix the onboarding flow that was disrupted by auth integration, expand the guide data model from single classId to multiple classes, remove debug logging.

**Tech Stack:** Next.js 16, React 19, Firebase Auth + Firestore, Tailwind CSS, shadcn/ui

---

### Task 1: Fix Student Onboarding Flow After Class Code

**Files:**
- Modify: `src/components/onboarding/onboarding-flow.tsx`
- Modify: `src/components/graph/graph-page.tsx`

**Problem:** After adding auth, the onboarding flow has: ClassCode → Name → (auth) → Grade → Intro → Interests. But when a returning student logs in, the grade/interests steps may not show. And for first-time students, the onboarding data (grade, interests) needs to reliably save to Firestore.

**Steps:**

1. Read `onboarding-flow.tsx` and `graph-page.tsx` to understand current flow
2. Verify that first-time students see ALL steps: ClassCode → Name → (join class) → Grade → Intro → Interests
3. Verify that after completing interests, `grade` and `interests` are written to the Firestore user doc via `updateDoc`
4. Verify that returning students (profile exists with grade + interests) skip onboarding entirely and go straight to the galaxy
5. If a returning student has no grade/interests in their profile (incomplete onboarding), show the remaining steps
6. Test the flow end-to-end
7. Commit: `fix: ensure full onboarding flow for first-time students, skip for returning`

---

### Task 2: Multi-Class Support for Guides

**Files:**
- Modify: `src/lib/auth-types.ts`
- Modify: `src/app/guide/page.tsx`
- Modify: `src/app/guide/signup/page.tsx`
- Modify: `src/components/graph/graph-page.tsx` (student class assignment)

**Problem:** Currently each guide has a single `classId` field. Guides should be able to create and manage multiple classes.

**Steps:**

1. Update `UserProfile` in `auth-types.ts`: keep `classId` as the "active" class, add `classIds: string[]` for all classes the guide owns

2. Update guide signup (`guide/signup/page.tsx`): when creating a class, add the classId to both `classId` and `classIds` array

3. Update guide dashboard (`guide/page.tsx`):
   - Add a class selector dropdown at the top (if guide has multiple classes)
   - "Create Another Class" button that opens an inline form (class name → generates code → creates class doc → adds to classIds)
   - When switching classes, update the active `classId` on the user doc and reload data
   - Show the currently selected class's students, games, reviews

4. Test: guide creates a second class, switches between them, each shows correct students/games

5. Commit: `feat: multi-class support for guides with class switcher`

---

### Task 3: Guide Dashboard — Add Class Code Display for Students

**Files:**
- Modify: `src/app/guide/page.tsx`

**Problem:** The guide dashboard shows the class code but should make it very prominent and easy to share with students.

**Steps:**

1. Add a "Share with students" section at the top of the dashboard with:
   - Large class code display
   - "Copy link" button that copies the student onboarding URL
   - Brief instruction text: "Students enter this code at option-c-pi.vercel.app to join your class"

2. Commit: `feat: prominent class code sharing on guide dashboard`

---

### Task 4: Remove Debug Console Logging

**Files:**
- Modify: `src/lib/auth.tsx`
- Modify: `src/app/guide/signup/page.tsx`
- Modify: `src/app/guide/login/page.tsx`

**Steps:**

1. Remove all `console.log("[Auth]..."` statements from `auth.tsx`
2. Remove all `console.log("[GuideSignup]..."` statements from `guide/signup/page.tsx`
3. Keep `console.error` and `console.warn` statements (those are useful for production debugging)
4. Commit: `chore: remove debug console logging from auth and signup`

---

### Task 5: Fix Guide Login — Handle Edge Cases

**Files:**
- Modify: `src/app/guide/login/page.tsx`

**Problem:** Several edge cases discovered during testing:
- Anonymous users from student testing interfere with guide login
- After Google redirect, page sometimes doesn't react

**Steps:**

1. Ensure guide login page clears any anonymous session on load
2. After successful Google sign-in redirect, auto-redirect to `/guide` if profile has guide role
3. Show clear error messages for: wrong role, no account, auth failure
4. Add "Forgot password?" link that sends reset email
5. Test: fresh browser → guide login → Google → dashboard
6. Commit: `fix: guide login edge cases — clear anon sessions, handle redirects`

---

### Task 6: Verify Full Flow End-to-End

**No code changes — just verification.**

1. **Admin flow:** Login at `/admin/login` → generate invite link → copy it
2. **Guide flow:** Open invite link → sign up with Google → name class → get code → see dashboard
3. **Student flow:** Go to `/` → enter class code → enter name → complete onboarding → see galaxy
4. **Guide checks:** Guide dashboard shows the student in roster
5. **Student builds game:** Pick a planet → learn → earn → build game → send for review
6. **Guide reviews:** Guide sees pending game → approves it
7. **Student masters:** Student plays approved game → wins 3 rounds → mastery

Run `next build` to verify no TypeScript errors. Report any issues found.

---

## Execution Order

```
Task 1 (Student onboarding) — most critical, students can't use the app without it
Task 2 (Multi-class) — important for guides
Task 3 (Class code display) — quick UX win
Task 4 (Debug cleanup) — housekeeping
Task 5 (Guide login fixes) — polish
Task 6 (E2E verification) — final check
```

Tasks 1 and 2 are the priority. Tasks 3-5 can be done in parallel. Task 6 is last.
