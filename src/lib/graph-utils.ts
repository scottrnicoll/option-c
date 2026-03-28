import type { StandardsGraph, StandardNode, NodeStatus } from "./graph-types"

// Domain color map — subtle nebula-like hues
const DOMAIN_COLORS: Record<string, string> = {
  // K-8 domains
  "CC": "#f59e0b",   // Counting & Cardinality → amber
  "OA": "#f59e0b",   // Operations & Algebraic Thinking → warm amber
  "NBT": "#14b8a6",  // Number & Operations Base Ten → teal
  "NF": "#2dd4bf",   // Number & Operations Fractions → teal (lighter)
  "G": "#60a5fa",    // Geometry → soft blue
  "MD": "#a78bfa",   // Measurement & Data → muted purple
  "RP": "#fb7185",   // Ratios & Proportional → coral
  "NS": "#14b8a6",   // The Number System → teal
  "EE": "#fbbf24",   // Expressions & Equations → amber (lighter)
  "SP": "#86efac",   // Statistics & Probability → sage green
  "F": "#22d3ee",    // Functions → cyan
  // HS domains (use prefix before the dash)
  "A-SSE": "#eab308", "A-APR": "#eab308", "A-CED": "#eab308", "A-REI": "#eab308",
  "F-IF": "#22d3ee", "F-BF": "#22d3ee", "F-LE": "#22d3ee", "F-TF": "#22d3ee",
  "G-CO": "#60a5fa", "G-SRT": "#60a5fa", "G-C": "#60a5fa", "G-GPE": "#60a5fa", "G-GMD": "#60a5fa", "G-MG": "#60a5fa",
  "N-RN": "#14b8a6", "N-Q": "#14b8a6", "N-CN": "#14b8a6", "N-VM": "#14b8a6",
  "S-ID": "#86efac", "S-IC": "#86efac", "S-CP": "#86efac", "S-MD": "#86efac",
}

function getDomainColor(node: StandardNode): string {
  // Try full domainCode first (for HS like "A-SSE"), then just the code
  return DOMAIN_COLORS[node.domainCode] || DOMAIN_COLORS[node.domainCode.split("-")[0]] || "#888888"
}

// Blend a domain color with the status brightness
function blendColor(hex: string, brightness: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r * brightness)}, ${Math.round(g * brightness)}, ${Math.round(b * brightness)})`
}

export function getNodeColor(node: StandardNode, status: NodeStatus): string {
  const domainColor = getDomainColor(node)
  switch (status) {
    case "locked": return blendColor(domainColor, 0.25)      // faint starfield
    case "available": return blendColor(domainColor, 0.7)     // bright
    case "in_progress": return blendColor(domainColor, 0.85)  // brighter
    case "unlocked": return blendColor(domainColor, 1.0)      // full color
  }
}

export function getNodeSize(status: NodeStatus, isHub: boolean): number {
  const base = isHub ? 1.5 : 0.8
  switch (status) {
    case "locked": return base * 0.3
    case "available": return base * 1.0
    case "in_progress": return base * 1.2
    case "unlocked": return base * 0.9
  }
}

export function getEdgeColor(sourceStatus: NodeStatus, targetStatus: NodeStatus): string {
  if (sourceStatus === "unlocked" && targetStatus === "unlocked") return "rgba(34,197,94,0.4)"
  if (sourceStatus === "unlocked" && targetStatus === "available") return "rgba(74,158,255,0.3)"
  return "rgba(255,255,255,0.03)"
}

export interface GraphNode {
  id: string
  name: string
  description: string
  domain: string
  domainCode: string
  grade: string
  isHub: boolean
  classification: string
  cluster: string
  color: string
  size: number
  status: NodeStatus
  // 3d force graph uses val for node size
  val: number
}

export interface GraphLink {
  source: string
  target: string
  edgeType: "prerequisite" | "related"
  color: string
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export function buildGraphData(
  data: StandardsGraph,
  progressMap: Map<string, NodeStatus>
): GraphData {
  const nodeSet = new Set(data.nodes.map(n => n.id))

  const nodes: GraphNode[] = data.nodes.map(node => {
    const status = progressMap.get(node.id) ?? "locked"
    return {
      id: node.id,
      name: node.description.slice(0, 50),
      description: node.description,
      domain: node.domain,
      domainCode: node.domainCode,
      grade: node.grade,
      isHub: node.isHub,
      classification: node.classification,
      cluster: node.cluster,
      color: getNodeColor(node, status),
      size: getNodeSize(status, node.isHub),
      status,
      val: getNodeSize(status, node.isHub),
    }
  })

  const links: GraphLink[] = data.edges
    .filter(e => nodeSet.has(e.source) && nodeSet.has(e.target))
    .map(edge => ({
      source: edge.source,
      target: edge.target,
      edgeType: edge.type,
      color: getEdgeColor(
        progressMap.get(edge.source) ?? "locked",
        progressMap.get(edge.target) ?? "locked"
      ),
    }))

  return { nodes, links }
}
