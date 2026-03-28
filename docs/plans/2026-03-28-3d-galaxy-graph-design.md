# 3D Galaxy Graph Redesign — Design Doc

**Date:** 2026-03-28
**Status:** Approved

---

## Problem

664 nodes as a flat 2D web is overwhelming. A student opens the app and thinks "what am I even looking at?"

## Solution

Replace Sigma.js (2D WebGL) with `react-force-graph-3d` (Three.js-based). Start students zoomed into their neighborhood. The full graph is a galaxy they explore.

## Library

`react-force-graph-3d` — purpose-built for 3D force-directed graphs on Three.js. Handles force layout, zoom, orbit, click, camera animation out of the box.

## First Load Experience

- Camera focused on available nodes (~15-30 clearly visible)
- Graph gently auto-rotates (slow orbit, feels alive)
- Rotation stops on first interaction (mouse/touch)
- Locked nodes: tiny, dim, low opacity — distant stars
- Available nodes: larger, pulsing glow
- Unlocked nodes: full bright, solid

## Domain Color Tinting

Subtle nebula-like hues per domain (not saturated):

| Domain | Color |
|--------|-------|
| Operations & Algebraic Thinking (OA) | Warm amber |
| Number & Operations - Base Ten (NBT) | Teal |
| Number & Operations - Fractions (NF) | Teal (lighter) |
| Geometry (G) | Soft blue |
| Measurement & Data (MD) | Muted purple |
| Ratios & Proportional Relationships (RP) | Coral |
| The Number System (NS) | Teal |
| Expressions & Equations (EE) | Warm amber (lighter) |
| Statistics & Probability (SP) | Sage green |
| Functions (F) | Cyan |
| HS Algebra (A-*) | Gold |
| HS Functions (F-*) | Cyan |
| HS Geometry (G-*) | Soft blue |
| HS Number (N-*) | Teal |
| HS Statistics (S-*) | Sage green |

Colors applied as tint on base state: locked = dim tinted, available = brighter tinted, unlocked = full tinted.

## Zoom Behavior

- Start: zoomed into neighborhood
- Scroll/pinch: zoom out to reveal full galaxy
- Zoomed out: 664-node constellation with visible domain color regions
- Click node: camera smoothly flies to it

## Interaction

Same as before:
- Click locked → tooltip with prerequisites
- Click available → panel slides in (learn flow)
- Click unlocked → show completion, game submission

## Ripple Animation

Same 3-phase animation but in 3D — light burst travels along edges in 3D space.

## Tech Change

| Before | After |
|--------|-------|
| `sigma` (2D WebGL) | `react-force-graph-3d` (Three.js) |
| `graphology` + `graphology-layout-forceatlas2` | Built-in force layout (d3-force-3d) |
| Custom `use-graph.ts` hook | `ForceGraph3D` React component |

Files to replace:
- Delete: `src/components/graph/use-graph.ts`
- Delete: `src/lib/graph-utils.ts` (partially — keep color functions)
- Rewrite: `src/components/graph/knowledge-graph.tsx`
- Modify: `src/components/graph/graph-page.tsx`
- Modify: `src/components/graph/use-ripple-animation.ts`
