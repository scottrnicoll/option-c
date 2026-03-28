# Option C: Math Standards Knowledge Graph — Design Doc

**Date:** 2026-03-28
**Approach:** Integrated MVP (Approach C)
**Status:** Approved

---

## Vision

A student-facing interactive knowledge graph of all K-HS Common Core math standards (480 nodes, 1,040 connections). Students unlock standards by proving they can apply a math concept through game design. The graph is the centerpiece — a skill-tree/star-map that progressively lights up as students earn the right to build.

### The Problem

Can learners show that they've learned a concept through application? Reverse-engineer to show proof of concept.

### The Differentiator

The Obsidian-style dependency graph IS the product. Not a dashboard bolted on — the map is how students navigate their learning, see their progress, and feel the scale of what's ahead.

---

## Architecture

```
Next.js App (App Router)
├── Graph Engine (Sigma.js / WebGL)     — Client Component
├── Learning Flow (pages/panels)        — Server + Client Components
├── AI Chat "Literal Genie" (AI SDK)    — Client: useChat, Server: streamText
├── Student Progress (dashboard)        — Server Components
└── Data Layer
    ├── Standards Graph (static JSON)   — 480 nodes, 1,040 edges, committed to repo
    ├── Student Progress (Neon Postgres)— auth, progress, chat history, submissions
    └── AI Gateway (OIDC)              — model routing, cost tracking
```

### Key Decisions

- **Standards data is static JSON** — extracted once from ATC's data.js, committed to repo. No DB needed for standards.
- **Student progress in Neon Postgres** — tracks unlock state, chat history, criteria evaluation, game submissions.
- **AI Gateway** for the Genie — provider-agnostic, cost-tracked, OIDC auth.
- **Sigma.js (WebGL)** for graph rendering — handles 10K+ nodes, built-in zoom/pan/hover.
- **Force-directed layout** — no grade-level grid. Topology shaped purely by dependency edges.

---

## Data Sources

### Achieve the Core Coherence Map

- **GitHub:** https://github.com/achievethecore/atc-coherence-map
- **Website:** https://achievethecore.org/coherence-map/
- **Static data file:** `achievethecore.org/coherence-map/data.js` (sets `window.cc`)

### Extracted Data

| Entity | Count | Source |
|--------|-------|--------|
| Math standards (nodes) | 480 | `window.cc.standards` |
| Directional edges (prerequisite/progression) | 757 | `window.cc.edges` |
| Non-directional edges (related standards) | 283 | `window.cc.nd_edges` |
| Domains | 63 | `window.cc.domains` |
| Clusters | 148 | `window.cc.clusters` |
| **Total connections** | **1,040** | |

### Standard ID Encoding

- K-8: `{Grade}.{Domain}.{Cluster}.{Standard}` — e.g., `K.CC.A.1`
- HS: `{Category}-{Domain}.{Cluster}.{Standard}` — e.g., `A-SSE.A.1`
- Sub-standards: append letter — e.g., `K.CC.B.4a`

---

## Graph Visualization

### Layout: Dependency-Driven Web

Force-directed graph where edges are the physics. Connected nodes pull toward each other. No grid, no rows, no grade-level axis. Clusters emerge organically from the math itself.

- Dense dependency chains (like the algebra pipeline) form visible clusters naturally.
- Hub standards (6+ outgoing edges) are slightly larger — they're keystones.
- Students don't feel "behind" because their nodes are in one area. They're exploring a web from wherever they are.

### Node Visual States

| State | Appearance | Meaning |
|-------|-----------|---------|
| **Locked** | Dim gray dot, no label until hover | Prerequisites not yet met |
| **Available** | Soft pulse/glow at edge, label visible | All prerequisites unlocked — can pick this |
| **In Progress** | Brighter glow, accent color ring | Currently working through this standard |
| **Unlocked** | Full bright, solid fill, checkmark | Completed the full flow |

### Edge Visual States

| State | Appearance |
|-------|-----------|
| Between locked nodes | Very faint line, nearly invisible |
| Leading to available node | Dotted line, medium opacity |
| Between unlocked nodes | Solid bright line |
| Non-directional (related) | Thin dashed line, different color |

### Zoom Behavior

- **Zoomed out (full map):** See entire constellation. Only unlocked nodes glow. Star-map feel.
- **Mid-zoom:** Domain-like clusters visible. Available nodes pulse gently.
- **Zoomed in (local graph):** Focused on one standard. See description, prerequisites (incoming), what it unlocks (outgoing), related standards (non-directional). Click "Start Learning."

### Interaction

- **Click locked node** — tooltip: "Unlock [prerequisite names] first" with glowing paths to those prerequisites
- **Click available node** — opens standard detail panel (start of learning flow)
- **Click unlocked node** — shows completion status, game submission, option to revisit

---

## Learning Flow

When a student clicks an **available** node:

### Step 1: LEARN (Concept Card)

- Standard name in plain language (not code)
- What it is (2-3 sentences)
- Common mistakes
- What it's used for (real-world connection)
- Short video/reading (placeholder for MVP, content added over time)
- Student clicks "I'm ready" — no gate, self-paced.

### Step 2: EXAMPLES (Real-World Applications)

2-3 cards showing how this concept exists in real games/apps:
- "In Angry Birds, trajectory = applying angle + force calculations"
- "In Minecraft, area and volume determine how much material you need"
- Curated per standard. For MVP, seed a few + use AI to generate contextual examples.

### Step 3: EARN THE RIGHT (AI Chat — the "Literal Genie")

Chat interface with a visual progress bar tied to 3 criteria:

**Criteria:**
1. **Playable** — Can others understand and play the game?
2. **Authentic math** — Is the math concept applied the way it would be in the real world?
3. **Math is essential** — Does math help the player decide, optimize, or win?

**Genie behavior:**
- Opens with: "What's your game idea? How does [concept] show up in it?"
- Short, direct responses (1-2 sentences max)
- Goal-oriented — helping the student meet criteria, not quizzing them
- When a criterion is met, checks the box visually
- When not met, gives specific actionable feedback — not another question
- 3-5 exchanges max, then pass/fail with clear reasoning

**System prompt:**
```
You are a game design mentor evaluating whether a student's game idea
meaningfully applies [STANDARD_DESCRIPTION].

CRITERIA (check each independently):
1. Playable: Can others understand and play it?
2. Authentic math: Is [concept] applied as it would be in real life?
3. Math is essential: Does math help the player decide, optimize, or win?

RULES:
- Keep responses to 1-2 sentences
- Don't ask Socratic questions. Give direct, specific feedback.
- If an idea meets a criterion, say so explicitly
- If it doesn't, tell them exactly what's missing and suggest one fix
- After 5 exchanges, make a final pass/fail decision with clear reasoning
```

**Technical:** AI SDK `streamText` with AI Gateway + `useChat` on client. AI returns both a message AND structured output with criteria scores (drives the progress bar).

### Step 4: UNLOCK (Graph Ripple)

When all 3 criteria are met:
- Camera pulls back to the graph
- Newly unlocked node **ignites** — burst of light radiates outward along edges
- Every newly-available node **catches the light** rippling down connections
- Student's territory of lit nodes visibly grows
- Hub unlocks (6+ outgoing edges) produce dramatic ripple — a whole region wakes up
- Optional: student uploads drawing, photo, video, or text of their game design

The reward IS the graph changing. Not confetti. "I just expanded my world."

---

## Data Model

### Static Data (committed to repo)

**`data/standards.json`**

```ts
{
  nodes: [
    {
      id: "K.CC.A.1",
      description: "Count to 100 by ones and by tens",
      domain: "Counting & Cardinality",
      cluster: "Know number names and the count sequence",
      grade: "K",
      classification: "major" | "supporting" | "additional",
      isHub: boolean,  // computed: 6+ outgoing edges
    }
  ],
  edges: [
    {
      source: "K.CC.A.1",
      target: "1.NBT.A.1",
      type: "prerequisite" | "related",
    }
  ]
}
```

### Dynamic Data (Neon Postgres)

```sql
students
├── id           UUID PRIMARY KEY
├── email        TEXT UNIQUE
├── name         TEXT
├── created_at   TIMESTAMPTZ

student_progress
├── id           UUID PRIMARY KEY
├── student_id   UUID → students.id
├── standard_id  TEXT (references static JSON, e.g., "K.CC.A.1")
├── status       TEXT (locked | available | in_progress | unlocked)
├── unlocked_at  TIMESTAMPTZ
├── chat_history JSONB (the Genie conversation)
├── criteria_met JSONB { playable: bool, authentic: bool, essential: bool }
├── game_submission TEXT (description, image URL, etc.)
```

### Progress Computation

1. **On signup:** Standards with zero incoming prerequisite edges start as `available` (~15-20 entry points). Everything else is `locked`.
2. **On unlock of standard X:**
   - X → `unlocked`
   - For every node Y where X is a prerequisite: if ALL of Y's prerequisites are now unlocked → Y becomes `available`
   - Return list of newly-available nodes (drives the ripple animation)
3. **Client-side merge:** Fetch static graph JSON + student progress rows → compute visual states. No server round-trip for zoom/pan.

---

## Phase Plan (Approach C)

### Phase 1: Graph + Working Flow for Grades 3-5

- Extract all 480 standards into static JSON
- Render full zoomable force-directed graph (all nodes in locked/dark state)
- Student auth (Clerk via Vercel Marketplace)
- Progress tracking (Neon Postgres)
- Full LEARN → EXAMPLES → EARN → UNLOCK flow for grades 3-5 (~120 standards)
- AI Genie chat with criteria evaluation
- Graph ripple unlock animation

### Phase 2: Expand Flow to All Grades

- Enable the learning flow for K-2, 6-8, and HS standards
- Build out curated concept cards and real-world examples per standard
- Visual card system (what it is, common mistakes, what it's used for)

### Phase 3: Polish

- Unlock animations and sound design
- Student progress dashboard (aggregate stats, streaks)
- Game submission gallery (see what other students built)
- Teacher/school view (future — not MVP)

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | Server Components for static data, Client for graph + chat |
| Graph rendering | Sigma.js (WebGL) | Purpose-built for large graphs, zoom/pan/hover built-in |
| Graph layout | Force Atlas 2 (via graphology) | Dependency-driven web, clusters emerge naturally |
| AI | AI SDK v6 + AI Gateway | streamText, useChat, structured output for criteria |
| Database | Neon Postgres (Vercel Marketplace) | Student progress, chat history |
| Auth | Clerk (Vercel Marketplace) | Auto-provisioned, middleware auth |
| Styling | shadcn/ui + Tailwind | Dark mode default, Geist fonts |
| Hosting | Vercel | Zero-config deploy, Fluid Compute |
