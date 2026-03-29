# Galaxy Redesign: Planets, Moons & Bridges — Design Doc

**Date:** 2026-03-29
**Status:** Approved

---

## Overview

Replace the flat 664-node force graph with a hierarchical galaxy:
- **Planets** = domains per grade (~63 total, e.g., K.CC, 3.NF, 7.EE)
- **Moons** = individual standards orbiting their planet
- **Bridges** = cross-domain dependency connections between planets
- **Nebulae** = soft spatial grouping by grade band (K-2, 3-5, 6-8, HS)

## Galaxy View (zoomed out)

- ~63 glowing orb planets floating in space
- Domain-colored (existing nebula palette)
- Grade bands cluster softly into regions
- Bridges (glowing lines) connect planets with cross-domain dependencies
- Dim bridges = not yet learned. Bright bridges = skills unlocked on both sides
- Planet size = number of moons (standards) it contains
- Label under each planet: human name (e.g., "Geometry") not code
- Completed planets pulse subtly

## Planet View (zoomed in)

- Planet fills center as large glowing orb
- Moons orbit automatically around it (gentle, slow)
- Moon states: locked (dim, small), available (bright, pulsing), unlocked (full glow)
- Click a moon → opens the standard panel (existing learn flow)
- Bridge paths visible at edges, leading to connected planets
- Click a bridge → fly to that planet

## Mini-Map (always visible, bottom-left)

- Tiny galaxy overview
- Glowing dot = current planet
- Click any planet on mini-map to fly there
- Lit bridges visible on mini-map
- Progress bar: "12/664 unlocked"

## Navigation

- Galaxy view: click planet to zoom in
- Planet view: click bridge to fly to next planet
- Mini-map: click for quick jump
- WASD/arrows: free camera movement
- Scroll: zoom between galaxy and planet views

## Data Mapping

From existing `standards.json`:
- Group nodes by `grade` + `domainCode` = one planet
- Standards within each group = moons
- Edges where source.planet !== target.planet = bridges
- Edges within same planet = internal moon dependencies (determine moon unlock order)

## Lighting Rules

- Unlock a moon → moon glows
- ALL moons on a planet unlocked → planet glows brighter (completed)
- Bridge lights up when at least one standard unlocked on BOTH sides

## Tech

- Keep react-force-graph-3d for galaxy view (planets as nodes, bridges as links)
- Custom Three.js for planet view (orbiting moons)
- Or: use react-force-graph-3d for both levels with camera animation between them

## Files to Create/Modify

- `src/lib/galaxy-utils.ts` — group standards into planets, compute bridges
- `src/components/graph/galaxy-view.tsx` — top-level galaxy (planets + bridges)
- `src/components/graph/planet-view.tsx` — zoomed-in planet with orbiting moons
- `src/components/graph/mini-map.tsx` — corner mini-map overlay
- `src/components/graph/graph-page.tsx` — orchestrate galaxy/planet views
- Modify `src/lib/graph-utils.ts` — add planet-level color/size functions
