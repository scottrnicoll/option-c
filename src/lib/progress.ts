import { getDb } from "@/lib/db"
import type { StandardsGraph, NodeStatus } from "@/lib/graph-types"
import standardsData from "@/data/standards.json"

const graph = standardsData as StandardsGraph

// Build prerequisite lookup: for each node, what are its prerequisite source nodes?
// An edge { source: A, target: B, type: "prerequisite" } means A is a prerequisite of B.
const prerequisitesOf = new Map<string, Set<string>>()
// Build unlocks lookup: for each node, what downstream nodes does it unlock?
const unlocksOf = new Map<string, Set<string>>()

for (const edge of graph.edges) {
  if (edge.type !== "prerequisite") continue

  if (!prerequisitesOf.has(edge.target)) {
    prerequisitesOf.set(edge.target, new Set())
  }
  prerequisitesOf.get(edge.target)!.add(edge.source)

  if (!unlocksOf.has(edge.source)) {
    unlocksOf.set(edge.source, new Set())
  }
  unlocksOf.get(edge.source)!.add(edge.target)
}

// Entry points: nodes with zero incoming prerequisite edges — these start as "available"
const entryPoints = new Set<string>(
  graph.nodes
    .filter((node) => {
      const prereqs = prerequisitesOf.get(node.id)
      return !prereqs || prereqs.size === 0
    })
    .map((node) => node.id)
)

/**
 * Returns a Map of standard ID to NodeStatus for all standards in the graph.
 */
export async function getStudentProgress(
  studentId: string
): Promise<Map<string, NodeStatus>> {
  // Fetch all progress rows for this student
  const rows = await getDb()`
    SELECT standard_id, status
    FROM student_progress
    WHERE student_id = ${studentId}::uuid
  `

  const progressMap = new Map<string, NodeStatus>()

  // Build lookup of existing progress
  const existingProgress = new Map<string, NodeStatus>()
  for (const row of rows) {
    existingProgress.set(
      row.standard_id as string,
      row.status as NodeStatus
    )
  }

  // Assign status for every standard in the graph
  for (const node of graph.nodes) {
    const existing = existingProgress.get(node.id)
    if (existing) {
      progressMap.set(node.id, existing)
    } else if (entryPoints.has(node.id)) {
      progressMap.set(node.id, "available")
    } else {
      progressMap.set(node.id, "locked")
    }
  }

  return progressMap
}

/**
 * Marks a standard as unlocked, then cascades to find newly-available nodes.
 * Returns the list of newly-available node IDs.
 */
export async function unlockStandard(
  studentId: string,
  standardId: string
): Promise<string[]> {
  // Mark the standard as unlocked
  await getDb()`
    INSERT INTO student_progress (student_id, standard_id, status, unlocked_at)
    VALUES (${studentId}::uuid, ${standardId}, 'unlocked', now())
    ON CONFLICT (student_id, standard_id)
    DO UPDATE SET status = 'unlocked', unlocked_at = now()
  `

  // Get the full set of unlocked standards for this student
  const unlockedRows = await getDb()`
    SELECT standard_id FROM student_progress
    WHERE student_id = ${studentId}::uuid AND status = 'unlocked'
  `
  const unlockedSet = new Set(
    unlockedRows.map((r) => r.standard_id as string)
  )

  // Check every downstream node of the newly-unlocked standard
  const downstream = unlocksOf.get(standardId)
  if (!downstream) return []

  const newlyAvailable: string[] = []

  for (const candidateId of downstream) {
    // Skip if already unlocked or available
    if (unlockedSet.has(candidateId)) continue

    const prereqs = prerequisitesOf.get(candidateId)
    if (!prereqs) continue

    // Check if ALL prerequisites are now unlocked
    const allMet = [...prereqs].every((prereqId) => unlockedSet.has(prereqId))
    if (!allMet) continue

    // Mark as available
    await getDb()`
      INSERT INTO student_progress (student_id, standard_id, status)
      VALUES (${studentId}::uuid, ${candidateId}, 'available')
      ON CONFLICT (student_id, standard_id)
      DO UPDATE SET status = 'available'
    `
    newlyAvailable.push(candidateId)
  }

  return newlyAvailable
}
