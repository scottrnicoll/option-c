# Option C: Math Standards Knowledge Graph — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a student-facing interactive knowledge graph of 480 CCSS math standards with a game-design-based unlock flow powered by AI.

**Architecture:** Next.js 16 App Router with Sigma.js (WebGL) for the force-directed graph, AI SDK v6 + AI Gateway for the "Literal Genie" chat, Neon Postgres for student progress, Clerk for auth. Standards data is static JSON extracted from Achieve the Core.

**Tech Stack:** Next.js 16, Sigma.js, graphology, AI SDK v6, AI Gateway (OIDC), Neon Postgres, Clerk, shadcn/ui, Tailwind CSS, Geist fonts

**Design Doc:** `docs/plans/2026-03-28-knowledge-graph-design.md`

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx`, `.gitignore`, `tailwind.config.ts`

**Step 1: Create Next.js app**

Run:
```bash
cd "/Users/md/Option C"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

Select defaults. This scaffolds the App Router project with Tailwind and Turbopack.

**Step 2: Install core dependencies**

Run:
```bash
npm install graphology graphology-layout-forceatlas2 sigma @sigma/edge-curve
npm install ai @ai-sdk/react @ai-sdk/gateway
npm install @neondatabase/serverless
npm install @clerk/nextjs
```

**Step 3: Install shadcn/ui**

Run:
```bash
npx shadcn@latest init
```

Select: New York style, Zinc color, CSS variables yes, dark mode.

Then add core components:
```bash
npx shadcn@latest add button card dialog sheet tooltip progress badge
```

**Step 4: Set up Geist fonts**

Edit `src/app/layout.tsx` to use `next/font` with Geist Sans and Geist Mono:

```tsx
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata = {
  title: 'Option C',
  description: 'Explore math through game design',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

Run: `npm install geist`

**Step 5: Verify dev server starts**

Run: `npm run dev`

Expected: App loads at `http://localhost:3000` with dark theme.

**Step 6: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js 16 project with shadcn/ui, graph libs, AI SDK"
```

---

## Task 2: Extract Standards Data from ATC Coherence Map

**Files:**
- Create: `scripts/extract-standards.ts`
- Create: `src/data/standards.json`
- Create: `src/lib/graph-types.ts`

**Step 1: Write the TypeScript types for the graph data**

Create `src/lib/graph-types.ts`:

```ts
export interface StandardNode {
  id: string
  description: string
  domain: string
  domainCode: string
  cluster: string
  grade: string
  classification: "major" | "supporting" | "additional"
  isHub: boolean
}

export interface StandardEdge {
  source: string
  target: string
  type: "prerequisite" | "related"
}

export interface StandardsGraph {
  nodes: StandardNode[]
  edges: StandardEdge[]
}

export type NodeStatus = "locked" | "available" | "in_progress" | "unlocked"
```

**Step 2: Write the extraction script**

Create `scripts/extract-standards.ts`. This script:

1. Clones the ATC repo (or fetches `data.js` from the website)
2. Evaluates the JS to extract `window.cc`
3. Transforms standards, clusters, domains, edges, nd_edges into our `StandardsGraph` schema
4. Computes `isHub` (6+ outgoing prerequisite edges)
5. Writes `src/data/standards.json`

```ts
// scripts/extract-standards.ts
import { execSync } from "child_process"
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs"
import path from "path"

const REPO_URL = "https://github.com/achievethecore/atc-coherence-map.git"
const CLONE_DIR = "/tmp/atc-coherence-map"
const OUTPUT_PATH = path.resolve("src/data/standards.json")

// Step 1: Clone repo if not already present
if (!existsSync(CLONE_DIR)) {
  console.log("Cloning ATC coherence map repo...")
  execSync(`git clone ${REPO_URL} ${CLONE_DIR}`, { stdio: "inherit" })
}

// Step 2: Read and evaluate standards.js and spreadsheet.js
// These files export default objects — we need to extract them
const standardsJs = readFileSync(path.join(CLONE_DIR, "standards.js"), "utf-8")
const spreadsheetJs = readFileSync(path.join(CLONE_DIR, "spreadsheet.js"), "utf-8")

// Extract the default export object from each file
// standards.js: export default { math: [...], ela: [...], major: "...", ... }
// spreadsheet.js: export default { feed: { entry: [...] } }
function extractDefaultExport(code: string): any {
  // Remove 'export default' and evaluate the object
  const objStr = code.replace(/export\s+default\s+/, "")
  return new Function(`return ${objStr}`)()
}

const standardsData = extractDefaultExport(standardsJs)
const spreadsheetData = extractDefaultExport(spreadsheetJs)

// Step 3: Parse math standards
// standardsData.math is an array of { id, description }
// We need to cross-reference with the runtime data structure
// The ID format from standards.js is like "K.CC.1" (grade.domain.ordinal)
// But the full ID including cluster needs the cluster mapping

// Build classification lookup
const majorSet = new Set(standardsData.major.split(",").map((s: string) => s.trim()))
const supportingSet = new Set(standardsData.supporting.split(",").map((s: string) => s.trim()))

interface RawMathStandard {
  id: string
  description: string
}

// Parse the edges from spreadsheet
const entries = spreadsheetData.feed.entry
interface RawEdge {
  type: string
  begin: string
  end: string
}

const rawEdges: RawEdge[] = entries.map((entry: any) => ({
  type: entry["gsx$edgedesc"]["$t"],
  begin: entry["gsx$begin"]["$t"],
  end: entry["gsx$end"]["$t"],
}))

// Map the math standards into our node format
const nodes = standardsData.math.map((std: RawMathStandard) => {
  const id = std.id
  // Determine grade from ID
  const grade = id.startsWith("0.") ? "K" : id.split(".")[0]
  // Determine domain code
  const parts = id.split(".")
  const domainCode = parts.length >= 2 ? parts[1] : parts[0]

  let classification: "major" | "supporting" | "additional" = "additional"
  if (majorSet.has(id)) classification = "major"
  else if (supportingSet.has(id)) classification = "supporting"

  return {
    id,
    description: std.description.replace(/<[^>]*>/g, "").trim(), // strip HTML
    domain: domainCode,
    domainCode,
    cluster: "",
    grade: grade === "0" ? "K" : grade,
    classification,
    isHub: false, // computed below
  }
})

// Parse edges — normalize IDs (strip || annotations)
const normalizeId = (id: string) => id.split("||")[0].trim()

const edges = rawEdges
  .filter((e) => e.begin && e.end)
  .map((e) => ({
    source: normalizeId(e.begin),
    target: normalizeId(e.end),
    type: e.type === "Arrow" ? ("prerequisite" as const) : ("related" as const),
  }))

// Compute hub status (6+ outgoing prerequisite edges)
const outgoingCount = new Map<string, number>()
for (const edge of edges) {
  if (edge.type === "prerequisite") {
    outgoingCount.set(edge.source, (outgoingCount.get(edge.source) || 0) + 1)
  }
}
for (const node of nodes) {
  node.isHub = (outgoingCount.get(node.id) || 0) >= 6
}

// Write output
if (!existsSync(path.dirname(OUTPUT_PATH))) {
  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
}

const graph = { nodes, edges }
writeFileSync(OUTPUT_PATH, JSON.stringify(graph, null, 2))

console.log(`Extracted ${nodes.length} nodes and ${edges.length} edges`)
console.log(`Hub standards: ${nodes.filter((n: any) => n.isHub).length}`)
console.log(`Written to ${OUTPUT_PATH}`)
```

**Step 3: Run the extraction script**

Run:
```bash
npx tsx scripts/extract-standards.ts
```

Expected: `Extracted ~480 nodes and ~540 edges` (after dedup). File written to `src/data/standards.json`.

**Step 4: Verify the data**

Run:
```bash
node -e "const d = require('./src/data/standards.json'); console.log('Nodes:', d.nodes.length, 'Edges:', d.edges.length, 'Hubs:', d.nodes.filter(n => n.isHub).length)"
```

Expected: Nodes ~480, Edges ~540, Hubs ~10-20.

**Step 5: Commit**

```bash
git add scripts/extract-standards.ts src/data/standards.json src/lib/graph-types.ts
git commit -m "feat: extract 480 math standards + 1040 edges from ATC coherence map"
```

---

## Task 3: Build the Graph Visualization Component

**Files:**
- Create: `src/components/graph/knowledge-graph.tsx`
- Create: `src/components/graph/use-graph.ts`
- Create: `src/lib/graph-utils.ts`
- Modify: `src/app/page.tsx`

**Step 1: Write graph utility functions**

Create `src/lib/graph-utils.ts`:

```ts
import Graph from "graphology"
import forceAtlas2 from "graphology-layout-forceatlas2"
import type { StandardsGraph, StandardNode, NodeStatus } from "./graph-types"

export function buildGraph(data: StandardsGraph): Graph {
  const graph = new Graph()

  for (const node of data.nodes) {
    graph.addNode(node.id, {
      label: node.description.slice(0, 60),
      ...node,
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      size: node.isHub ? 8 : 4,
    })
  }

  for (const edge of data.edges) {
    // Skip edges where source or target doesn't exist
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue
    // Avoid duplicate edges
    const edgeKey = `${edge.source}->${edge.target}`
    if (graph.hasEdge(edgeKey)) continue
    graph.addEdgeWithKey(edgeKey, edge.source, edge.target, {
      type: edge.type,
    })
  }

  return graph
}

export function applyLayout(graph: Graph): void {
  forceAtlas2.assign(graph, {
    iterations: 500,
    settings: {
      gravity: 1,
      scalingRatio: 10,
      barnesHutOptimize: true,
      slowDown: 5,
    },
  })
}

export function getNodeColor(status: NodeStatus): string {
  switch (status) {
    case "locked": return "#333333"
    case "available": return "#4a9eff"
    case "in_progress": return "#f59e0b"
    case "unlocked": return "#22c55e"
  }
}

export function getEdgeColor(
  sourceStatus: NodeStatus,
  targetStatus: NodeStatus,
  edgeType: string
): string {
  if (sourceStatus === "unlocked" && targetStatus === "unlocked") return "#22c55e80"
  if (sourceStatus === "unlocked" && targetStatus === "available") return "#4a9eff60"
  if (edgeType === "related") return "#ffffff15"
  return "#ffffff08"
}
```

**Step 2: Write the Sigma.js React wrapper hook**

Create `src/components/graph/use-graph.ts`:

```ts
"use client"

import { useEffect, useRef, useState } from "react"
import Graph from "graphology"
import Sigma from "sigma"
import type { StandardsGraph, NodeStatus } from "@/lib/graph-types"
import { buildGraph, applyLayout, getNodeColor, getEdgeColor } from "@/lib/graph-utils"

interface UseGraphOptions {
  container: HTMLElement | null
  data: StandardsGraph
  progressMap: Map<string, NodeStatus>
  onNodeClick?: (nodeId: string, status: NodeStatus) => void
}

export function useGraph({ container, data, progressMap, onNodeClick }: UseGraphOptions) {
  const sigmaRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)

  useEffect(() => {
    if (!container) return

    const graph = buildGraph(data)
    applyLayout(graph)
    graphRef.current = graph

    // Apply visual states based on progress
    graph.forEachNode((nodeId, attrs) => {
      const status = progressMap.get(nodeId) || "locked"
      graph.setNodeAttribute(nodeId, "color", getNodeColor(status))
      graph.setNodeAttribute(nodeId, "size", status === "locked" ? 3 : attrs.isHub ? 10 : 5)
    })

    graph.forEachEdge((edgeId, attrs, source, target) => {
      const sourceStatus = progressMap.get(source) || "locked"
      const targetStatus = progressMap.get(target) || "locked"
      graph.setEdgeAttribute(edgeId, "color", getEdgeColor(sourceStatus, targetStatus, attrs.type))
    })

    const sigma = new Sigma(graph, container, {
      renderLabels: true,
      labelRenderedSizeThreshold: 12,
      labelColor: { color: "#e2e8f0" },
      defaultEdgeType: "line",
    })

    sigma.on("clickNode", ({ node }) => {
      const status = progressMap.get(node) || "locked"
      onNodeClick?.(node, status)
    })

    sigmaRef.current = sigma

    return () => {
      sigma.kill()
    }
  }, [container, data, progressMap, onNodeClick])

  return { sigma: sigmaRef, graph: graphRef }
}
```

**Step 3: Write the KnowledgeGraph component**

Create `src/components/graph/knowledge-graph.tsx`:

```tsx
"use client"

import { useRef, useCallback, useState } from "react"
import type { StandardsGraph, NodeStatus } from "@/lib/graph-types"
import { useGraph } from "./use-graph"

interface KnowledgeGraphProps {
  data: StandardsGraph
  progressMap: Map<string, NodeStatus>
  onNodeClick: (nodeId: string, status: NodeStatus) => void
}

export function KnowledgeGraph({ data, progressMap, onNodeClick }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGraph({
    container: containerRef.current,
    data,
    progressMap,
    onNodeClick,
  })

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-zinc-950 rounded-lg"
      style={{ minHeight: "100vh" }}
    />
  )
}
```

**Step 4: Wire up the page**

Edit `src/app/page.tsx`:

```tsx
import standardsData from "@/data/standards.json"
import { GraphPage } from "@/components/graph/graph-page"

export default function Home() {
  return <GraphPage data={standardsData} />
}
```

Create `src/components/graph/graph-page.tsx` (client component that manages state):

```tsx
"use client"

import { useState, useCallback } from "react"
import type { StandardsGraph, NodeStatus } from "@/lib/graph-types"
import { KnowledgeGraph } from "./knowledge-graph"

interface GraphPageProps {
  data: StandardsGraph
}

export function GraphPage({ data }: GraphPageProps) {
  // For now, all nodes start as "available" for testing the graph renders
  const [progressMap] = useState(() => {
    const map = new Map<string, NodeStatus>()
    for (const node of data.nodes) {
      map.set(node.id, "locked")
    }
    // Set entry points (no incoming prerequisite edges) as available
    const hasPrereq = new Set<string>()
    for (const edge of data.edges) {
      if (edge.type === "prerequisite") {
        hasPrereq.add(edge.target)
      }
    }
    for (const node of data.nodes) {
      if (!hasPrereq.has(node.id)) {
        map.set(node.id, "available")
      }
    }
    return map
  })

  const handleNodeClick = useCallback((nodeId: string, status: NodeStatus) => {
    console.log("Clicked:", nodeId, status)
    // TODO: open standard detail panel
  }, [])

  return (
    <main className="h-screen w-screen bg-zinc-950">
      <KnowledgeGraph
        data={data}
        progressMap={progressMap}
        onNodeClick={handleNodeClick}
      />
    </main>
  )
}
```

**Step 5: Verify the graph renders**

Run: `npm run dev`

Expected: Full-screen dark canvas with ~480 nodes arranged in a force-directed web. Entry-point nodes glow blue. Locked nodes are dim gray. You can zoom, pan, and click.

**Step 6: Commit**

```bash
git add src/components/graph/ src/lib/graph-utils.ts src/app/page.tsx
git commit -m "feat: render interactive knowledge graph with 480 standards and force layout"
```

---

## Task 4: Standard Detail Panel

**Files:**
- Create: `src/components/standard/standard-panel.tsx`
- Create: `src/components/standard/concept-card.tsx`
- Create: `src/components/standard/examples-card.tsx`
- Modify: `src/components/graph/graph-page.tsx`

**Step 1: Write the concept card (LEARN step)**

Create `src/components/standard/concept-card.tsx`:

```tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { StandardNode } from "@/lib/graph-types"

interface ConceptCardProps {
  standard: StandardNode
  onReady: () => void
}

export function ConceptCard({ standard, onReady }: ConceptCardProps) {
  return (
    <div className="space-y-4">
      <div>
        <Badge variant="outline" className="mb-2">{standard.domain}</Badge>
        <h2 className="text-xl font-semibold text-zinc-100">{standard.description}</h2>
        <p className="text-sm text-zinc-400 font-mono mt-1">{standard.id}</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-300">What is this?</CardTitle>
        </CardHeader>
        <CardContent className="text-zinc-400 text-sm">
          {/* MVP: show the standard description. Content team fills in later. */}
          <p>{standard.description}</p>
        </CardContent>
      </Card>

      <Button onClick={onReady} className="w-full">
        I'm ready — show me examples
      </Button>
    </div>
  )
}
```

**Step 2: Write the examples card (EXAMPLES step)**

Create `src/components/standard/examples-card.tsx`:

```tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ExamplesCardProps {
  standardDescription: string
  onReady: () => void
}

export function ExamplesCard({ standardDescription, onReady }: ExamplesCardProps) {
  // MVP: placeholder examples. AI-generated or curated per standard later.
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-zinc-100">Real-World Examples</h3>
      <p className="text-sm text-zinc-400">
        See how this concept shows up in real games and apps:
      </p>

      <div className="space-y-3">
        {[
          "In strategy games, players use this concept to optimize their decisions",
          "In building games, this math determines the best approach to a challenge",
          "In puzzle games, understanding this concept is the key to winning",
        ].map((example, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-4 text-sm text-zinc-300">
              {example}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={onReady} className="w-full">
        I have an idea — let me prove it
      </Button>
    </div>
  )
}
```

**Step 3: Write the standard panel (orchestrates the flow)**

Create `src/components/standard/standard-panel.tsx`:

```tsx
"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { StandardNode } from "@/lib/graph-types"
import { ConceptCard } from "./concept-card"
import { ExamplesCard } from "./examples-card"

type FlowStep = "learn" | "examples" | "earn" | "unlocked"

interface StandardPanelProps {
  standard: StandardNode | null
  open: boolean
  onClose: () => void
  onUnlock: (standardId: string) => void
}

export function StandardPanel({ standard, open, onClose, onUnlock }: StandardPanelProps) {
  const [step, setStep] = useState<FlowStep>("learn")

  if (!standard) return null

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[480px] bg-zinc-950 border-zinc-800 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-zinc-100">{standard.description}</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {step === "learn" && (
            <ConceptCard standard={standard} onReady={() => setStep("examples")} />
          )}
          {step === "examples" && (
            <ExamplesCard
              standardDescription={standard.description}
              onReady={() => setStep("earn")}
            />
          )}
          {step === "earn" && (
            <div className="text-zinc-400">
              {/* Task 6 will implement the AI chat here */}
              <p>AI Chat — coming in Task 6</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

**Step 4: Wire panel into graph page**

Update `src/components/graph/graph-page.tsx` to add state for the selected standard and render `StandardPanel`. When an available node is clicked, open the panel. When a locked node is clicked, show a tooltip.

**Step 5: Verify the flow**

Run: `npm run dev`

Expected: Click an available (blue) node → panel slides in from right → shows concept card → click "I'm ready" → shows examples → click "I have an idea" → shows placeholder for AI chat.

**Step 6: Commit**

```bash
git add src/components/standard/
git commit -m "feat: add standard detail panel with learn and examples flow"
```

---

## Task 5: Database Setup + Progress Tracking

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/lib/progress.ts`
- Create: `src/app/api/progress/route.ts`
- Create: `src/app/api/progress/unlock/route.ts`

**Step 1: Set up Vercel + Neon**

Run:
```bash
vercel link
vercel integration add neon
vercel env pull .env.local
```

Note: `vercel integration add neon` may require terminal interaction for terms acceptance — user must run this manually if it blocks.

**Step 2: Create the database client**

Create `src/lib/db.ts`:

```ts
import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)
```

**Step 3: Create the schema**

Create `scripts/setup-db.ts`:

```ts
import { neon } from "@neondatabase/serverless"
import "dotenv/config"

const sql = neon(process.env.DATABASE_URL!)

async function setup() {
  await sql`
    CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clerk_id TEXT UNIQUE NOT NULL,
      email TEXT,
      name TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS student_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID REFERENCES students(id) ON DELETE CASCADE,
      standard_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'in_progress', 'unlocked')),
      unlocked_at TIMESTAMPTZ,
      chat_history JSONB DEFAULT '[]',
      criteria_met JSONB DEFAULT '{"playable": false, "authentic": false, "essential": false}',
      game_submission TEXT,
      UNIQUE(student_id, standard_id)
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_progress_student ON student_progress(student_id)
  `

  console.log("Database schema created successfully")
}

setup().catch(console.error)
```

Run:
```bash
npx tsx scripts/setup-db.ts
```

**Step 4: Write progress utility functions**

Create `src/lib/progress.ts`:

```ts
import { sql } from "./db"
import standardsData from "@/data/standards.json"
import type { NodeStatus } from "./graph-types"

// Compute entry points (standards with no incoming prerequisite edges)
const entryPoints = new Set<string>()
const hasPrereq = new Set<string>()
for (const edge of standardsData.edges) {
  if (edge.type === "prerequisite") {
    hasPrereq.add(edge.target)
  }
}
for (const node of standardsData.nodes) {
  if (!hasPrereq.has(node.id)) {
    entryPoints.add(node.id)
  }
}

// Build prerequisite lookup: for each node, what are its prerequisite sources?
const prerequisitesOf = new Map<string, string[]>()
for (const edge of standardsData.edges) {
  if (edge.type === "prerequisite") {
    const existing = prerequisitesOf.get(edge.target) || []
    existing.push(edge.source)
    prerequisitesOf.set(edge.target, existing)
  }
}

// Build "unlocks" lookup: for each node, what nodes does it unlock?
const unlocksOf = new Map<string, string[]>()
for (const edge of standardsData.edges) {
  if (edge.type === "prerequisite") {
    const existing = unlocksOf.get(edge.source) || []
    existing.push(edge.target)
    unlocksOf.set(edge.source, existing)
  }
}

export async function getStudentProgress(studentId: string): Promise<Map<string, NodeStatus>> {
  const rows = await sql`
    SELECT standard_id, status FROM student_progress WHERE student_id = ${studentId}
  `

  const map = new Map<string, NodeStatus>()

  // Start with all nodes locked
  for (const node of standardsData.nodes) {
    map.set(node.id, "locked")
  }

  // Set entry points as available
  for (const ep of entryPoints) {
    map.set(ep, "available")
  }

  // Apply saved progress
  for (const row of rows) {
    map.set(row.standard_id as string, row.status as NodeStatus)
  }

  return map
}

export async function unlockStandard(studentId: string, standardId: string): Promise<string[]> {
  // Mark as unlocked
  await sql`
    INSERT INTO student_progress (student_id, standard_id, status, unlocked_at)
    VALUES (${studentId}, ${standardId}, 'unlocked', now())
    ON CONFLICT (student_id, standard_id)
    DO UPDATE SET status = 'unlocked', unlocked_at = now()
  `

  // Find newly available nodes
  const newlyAvailable: string[] = []
  const downstream = unlocksOf.get(standardId) || []

  // Get all currently unlocked standards for this student
  const unlocked = await sql`
    SELECT standard_id FROM student_progress
    WHERE student_id = ${studentId} AND status = 'unlocked'
  `
  const unlockedSet = new Set(unlocked.map((r) => r.standard_id as string))

  for (const candidateId of downstream) {
    const prereqs = prerequisitesOf.get(candidateId) || []
    const allMet = prereqs.every((p) => unlockedSet.has(p))
    if (allMet) {
      newlyAvailable.push(candidateId)
      await sql`
        INSERT INTO student_progress (student_id, standard_id, status)
        VALUES (${studentId}, ${candidateId}, 'available')
        ON CONFLICT (student_id, standard_id)
        DO UPDATE SET status = 'available'
      `
    }
  }

  return newlyAvailable
}

export { entryPoints, prerequisitesOf, unlocksOf }
```

**Step 5: Write API routes**

Create `src/app/api/progress/route.ts`:

```ts
import { auth } from "@clerk/nextjs/server"
import { getStudentProgress } from "@/lib/progress"
import { sql } from "@/lib/db"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  // Ensure student record exists
  await sql`
    INSERT INTO students (clerk_id) VALUES (${userId})
    ON CONFLICT (clerk_id) DO NOTHING
  `

  const student = await sql`SELECT id FROM students WHERE clerk_id = ${userId}`
  const progressMap = await getStudentProgress(student[0].id as string)

  // Convert Map to object for JSON
  const progress: Record<string, string> = {}
  progressMap.forEach((v, k) => { progress[k] = v })

  return Response.json({ progress })
}
```

Create `src/app/api/progress/unlock/route.ts`:

```ts
import { auth } from "@clerk/nextjs/server"
import { unlockStandard } from "@/lib/progress"
import { sql } from "@/lib/db"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { standardId } = await req.json()

  const student = await sql`SELECT id FROM students WHERE clerk_id = ${userId}`
  const newlyAvailable = await unlockStandard(student[0].id as string, standardId)

  return Response.json({ newlyAvailable })
}
```

**Step 6: Commit**

```bash
git add src/lib/db.ts src/lib/progress.ts src/app/api/progress/ scripts/setup-db.ts
git commit -m "feat: add Neon Postgres progress tracking with unlock cascade logic"
```

---

## Task 6: AI "Literal Genie" Chat

**Files:**
- Create: `src/app/api/chat/route.ts`
- Create: `src/components/standard/genie-chat.tsx`
- Create: `src/components/standard/criteria-progress.tsx`
- Modify: `src/components/standard/standard-panel.tsx`

**Step 1: Set up Vercel project for AI Gateway**

Run:
```bash
vercel link   # if not already linked
# Enable AI Gateway in Vercel dashboard, then:
vercel env pull .env.local
```

**Step 2: Write the chat API route**

Create `src/app/api/chat/route.ts`:

```ts
import { streamText, Output } from "ai"
import { convertToModelMessages, toUIMessageStreamResponse } from "ai"
import { z } from "zod"

const criteriaSchema = z.object({
  playable: z.boolean().describe("Can others understand and play the game?"),
  authentic: z.boolean().describe("Is the math concept applied as it would be in real life?"),
  essential: z.boolean().describe("Does math help the player decide, optimize, or win?"),
  feedback: z.string().describe("1-2 sentence direct feedback for the student"),
})

export async function POST(req: Request) {
  const { messages, standardDescription } = await req.json()

  const result = streamText({
    model: "anthropic/claude-sonnet-4.5",
    system: `You are a game design mentor evaluating whether a student's game idea meaningfully applies this math concept: "${standardDescription}"

CRITERIA (evaluate each independently after every student message):
1. Playable: Can others understand and play it?
2. Authentic math: Is the concept applied as it would be in real life?
3. Math is essential: Does math help the player decide, optimize, or win?

RULES:
- Keep responses to 1-2 sentences. Be direct.
- Don't ask Socratic questions. Give specific, actionable feedback.
- If an idea meets a criterion, say so explicitly.
- If it doesn't, tell them exactly what's missing and suggest one concrete fix.
- After 5 exchanges, make a final pass/fail decision with clear reasoning.
- Be encouraging but honest. You're helping them succeed, not testing them.`,
    messages: await convertToModelMessages(messages),
    output: Output.object({ schema: criteriaSchema }),
  })

  return toUIMessageStreamResponse(result)
}
```

**Step 3: Write the criteria progress bar**

Create `src/components/standard/criteria-progress.tsx`:

```tsx
"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CriteriaProgressProps {
  criteria: {
    playable: boolean
    authentic: boolean
    essential: boolean
  }
}

const criteriaLabels = [
  { key: "playable" as const, label: "Others can play it" },
  { key: "authentic" as const, label: "Real-world math" },
  { key: "essential" as const, label: "Math helps you win" },
]

export function CriteriaProgress({ criteria }: CriteriaProgressProps) {
  const metCount = Object.values(criteria).filter(Boolean).length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">Criteria met</span>
        <span className="text-xs font-mono text-zinc-400">{metCount}/3</span>
      </div>
      <div className="flex gap-2">
        {criteriaLabels.map(({ key, label }) => (
          <Badge
            key={key}
            variant={criteria[key] ? "default" : "outline"}
            className={cn(
              "text-xs transition-all duration-500",
              criteria[key]
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "text-zinc-500 border-zinc-700"
            )}
          >
            {criteria[key] ? "✓" : "○"} {label}
          </Badge>
        ))}
      </div>
    </div>
  )
}
```

**Step 4: Write the Genie chat component**

Create `src/components/standard/genie-chat.tsx`. This uses `useChat` from `@ai-sdk/react` with `DefaultChatTransport`. The component:

- Renders the chat messages
- Shows the criteria progress bar (updated from structured output in each AI response)
- Limits to 5 exchanges
- Calls `onUnlock` when all 3 criteria are met

Check AI SDK v6 docs for exact `useChat` + `DefaultChatTransport` API before implementing. The structured output from the route (criteria JSON) should be extracted from the message parts to update the progress bar.

**Step 5: Wire chat into standard panel**

Update `src/components/standard/standard-panel.tsx` to render `GenieChat` when `step === "earn"`. Pass the standard description and an `onUnlock` callback.

**Step 6: Verify the chat flow**

Run: `npm run dev`

Expected: Click available node → Learn → Examples → Chat opens with Genie prompt → Student types game idea → AI responds with criteria evaluation → Progress bar updates → When 3/3 met, unlock triggers.

**Step 7: Commit**

```bash
git add src/app/api/chat/ src/components/standard/genie-chat.tsx src/components/standard/criteria-progress.tsx
git commit -m "feat: add AI Literal Genie chat with criteria evaluation and progress bar"
```

---

## Task 7: Graph Ripple Unlock Animation

**Files:**
- Create: `src/components/graph/use-ripple-animation.ts`
- Modify: `src/components/graph/knowledge-graph.tsx`
- Modify: `src/components/graph/graph-page.tsx`

**Step 1: Write the ripple animation hook**

Create `src/components/graph/use-ripple-animation.ts`:

```ts
"use client"

import { useCallback } from "react"
import type Sigma from "sigma"
import type Graph from "graphology"
import { getNodeColor } from "@/lib/graph-utils"

interface RippleOptions {
  sigma: Sigma | null
  graph: Graph | null
  durationMs?: number
}

export function useRippleAnimation({ sigma, graph, durationMs = 1500 }: RippleOptions) {
  const triggerRipple = useCallback(
    (unlockedNodeId: string, newlyAvailableIds: string[]) => {
      if (!sigma || !graph) return

      // Phase 1: Ignite the unlocked node (0-500ms)
      // Animate from current color to bright white flash, then to unlocked green
      const startTime = performance.now()

      function animate(time: number) {
        const elapsed = time - startTime
        const progress = Math.min(elapsed / durationMs, 1)

        if (progress < 0.33) {
          // Phase 1: Flash white on unlocked node
          const intensity = Math.sin((progress / 0.33) * Math.PI)
          const r = Math.round(34 + (255 - 34) * intensity)
          const g = Math.round(197 + (255 - 197) * intensity)
          const b = Math.round(94 + (255 - 94) * intensity)
          graph.setNodeAttribute(unlockedNodeId, "color", `rgb(${r},${g},${b})`)
        } else if (progress < 0.66) {
          // Phase 2: Ripple along edges to newly available nodes
          graph.setNodeAttribute(unlockedNodeId, "color", getNodeColor("unlocked"))
          const rippleProgress = (progress - 0.33) / 0.33
          for (const nodeId of newlyAvailableIds) {
            const intensity = Math.min(rippleProgress * 2, 1)
            const r = Math.round(51 + (74 - 51) * intensity)
            const g = Math.round(51 + (158 - 51) * intensity)
            const b = Math.round(51 + (255 - 51) * intensity)
            graph.setNodeAttribute(nodeId, "color", `rgb(${r},${g},${b})`)
            graph.setNodeAttribute(nodeId, "size", 3 + 4 * intensity)
          }
        } else {
          // Phase 3: Settle into final state
          graph.setNodeAttribute(unlockedNodeId, "color", getNodeColor("unlocked"))
          for (const nodeId of newlyAvailableIds) {
            graph.setNodeAttribute(nodeId, "color", getNodeColor("available"))
            graph.setNodeAttribute(nodeId, "size", 5)
          }
        }

        sigma.refresh()

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    },
    [sigma, graph, durationMs]
  )

  return { triggerRipple }
}
```

**Step 2: Wire ripple into graph page**

Update `src/components/graph/graph-page.tsx`:

When the unlock API returns `newlyAvailable` node IDs:
1. Update the progress map
2. Call `triggerRipple(unlockedId, newlyAvailableIds)`
3. The graph animates: ignite → ripple → settle

**Step 3: Verify the animation**

Run: `npm run dev`

Expected: After the Genie chat passes a student, the panel closes, the camera zooms to show the graph, and the ripple animation plays — the unlocked node flashes, then newly-available nodes light up along the edges.

**Step 4: Commit**

```bash
git add src/components/graph/use-ripple-animation.ts
git commit -m "feat: add graph ripple animation on standard unlock"
```

---

## Task 8: Clerk Auth + Middleware

**Files:**
- Create: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Create: `src/app/sign-up/[[...sign-up]]/page.tsx`
- Create: `src/proxy.ts`
- Modify: `src/app/layout.tsx`

**Step 1: Set up Clerk**

Run:
```bash
vercel integration add clerk
```

Note: This requires terminal interaction — user must run manually if it blocks. After install, complete setup in Vercel Dashboard. Then:

```bash
vercel env pull .env.local
```

Manually add to `.env.local`:
```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

**Step 2: Add ClerkProvider to layout**

Update `src/app/layout.tsx` to wrap children with `<ClerkProvider>`.

**Step 3: Create sign-in and sign-up pages**

Create `src/app/sign-in/[[...sign-in]]/page.tsx`:
```tsx
import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <SignIn />
    </div>
  )
}
```

Create `src/app/sign-up/[[...sign-up]]/page.tsx` (same pattern with `<SignUp />`).

**Step 4: Create proxy.ts**

Create `src/proxy.ts` (Next.js 16 — replaces `middleware.ts`):

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)"],
}
```

**Step 5: Verify auth flow**

Run: `npm run dev`

Expected: Visiting `/` redirects to `/sign-in`. After signing in, the graph loads.

**Step 6: Commit**

```bash
git add src/proxy.ts src/app/sign-in/ src/app/sign-up/ src/app/layout.tsx
git commit -m "feat: add Clerk auth with sign-in, sign-up, and route protection"
```

---

## Task 9: Connect Progress to Auth + Full Integration

**Files:**
- Modify: `src/components/graph/graph-page.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Fetch real progress on page load**

Update `src/app/page.tsx` to be a Server Component that fetches the student's progress from the API, then passes it to `GraphPage`.

**Step 2: Wire unlock flow end-to-end**

Update `src/components/graph/graph-page.tsx`:

1. When Genie chat passes → call `POST /api/progress/unlock` with the standard ID
2. Receive `newlyAvailable` IDs in response
3. Update local progress map
4. Trigger ripple animation
5. Close the standard panel

**Step 3: Full integration test**

Run: `npm run dev`

Expected full flow:
1. Sign in → see graph with ~15-20 blue available nodes in a web of dim locked nodes
2. Click an available node → panel opens with concept card
3. Click "I'm ready" → examples
4. Click "I have an idea" → Genie chat opens
5. Describe a game idea → Genie evaluates → criteria badges light up
6. All 3 met → panel closes → graph ripple animation plays → new nodes become available
7. Refresh page → progress is persisted

**Step 4: Commit**

```bash
git add src/app/page.tsx src/components/graph/graph-page.tsx
git commit -m "feat: wire end-to-end flow — auth, progress, chat, unlock, ripple"
```

---

## Task 10: Deploy to Vercel

**Step 1: Verify build**

Run:
```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Deploy preview**

Run:
```bash
vercel
```

Expected: Preview URL generated. Test the full flow on the preview deployment.

**Step 3: Deploy production**

Run:
```bash
vercel --prod
```

**Step 4: Commit any build fixes**

```bash
git add .
git commit -m "fix: resolve build issues for production deploy"
```

---

## Task Summary

| Task | What | Depends On |
|------|------|-----------|
| 1 | Scaffold Next.js + deps | — |
| 2 | Extract standards data | 1 |
| 3 | Graph visualization | 1, 2 |
| 4 | Standard detail panel | 3 |
| 5 | Database + progress tracking | 1 |
| 6 | AI Genie chat | 4, 5 |
| 7 | Ripple unlock animation | 3, 6 |
| 8 | Clerk auth | 1 |
| 9 | Full integration | 5, 6, 7, 8 |
| 10 | Deploy | 9 |

**Parallelizable:** Tasks 2, 5, and 8 can run in parallel after Task 1. Tasks 3 and 4 are sequential. Task 6 needs 4+5. Task 7 needs 3+6. Task 9 brings it all together.
