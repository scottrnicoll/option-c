"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { GalaxyData, GalaxyNode, GalaxyLink } from "@/lib/galaxy-utils"

interface GalaxyViewProps {
  galaxyData: GalaxyData
  onPlanetClick: (planetId: string) => void
  onLockedPlanetClick?: (planetId: string) => void
  currentPlanetId: string | null
  initialGrade: string | null
}

function getGradeBandForGrade(grade: string | null): string | null {
  if (!grade) return null
  if (grade === "K" || grade === "1" || grade === "2") return "K-2"
  if (grade === "3" || grade === "4" || grade === "5") return "3-5"
  if (grade === "6" || grade === "7" || grade === "8") return "6-8"
  return "HS"
}

export function GalaxyView({ galaxyData, onPlanetClick, onLockedPlanetClick, currentPlanetId, initialGrade }: GalaxyViewProps) {
  const fgRef = useRef<any>(null)
  const [ForceGraph3D, setForceGraph3D] = useState<any>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Dynamic import of ForceGraph3D (browser-only)
  useEffect(() => {
    import("react-force-graph-3d").then(mod => {
      setForceGraph3D(() => mod.default)
    })
  }, [])

  // Track window dimensions
  useEffect(() => {
    const update = () => setDimensions({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  // Auto-orbit (gentle rotation) -- stop on first interaction
  const orbitingRef = useRef(true)
  useEffect(() => {
    if (!fgRef.current) return
    const fg = fgRef.current

    const interval = setInterval(() => {
      if (orbitingRef.current && fg.scene) {
        const { x, y, z } = fg.cameraPosition()
        const angle = 0.0008
        fg.cameraPosition({
          x: x * Math.cos(angle) - z * Math.sin(angle),
          y,
          z: x * Math.sin(angle) + z * Math.cos(angle),
        })
      }
    }, 30)

    return () => clearInterval(interval)
  }, [ForceGraph3D])

  // Stop orbiting on interaction
  const handleInteraction = useCallback(() => {
    orbitingRef.current = false
  }, [])

  // Focus camera on a specific planet
  useEffect(() => {
    if (!currentPlanetId || !fgRef.current) return
    const node = galaxyData.nodes.find(n => n.id === currentPlanetId)
    if (node && (node as any).x !== undefined) {
      const n = node as any
      orbitingRef.current = false
      fgRef.current.cameraPosition(
        { x: n.x, y: n.y, z: n.z + 120 },
        { x: n.x, y: n.y, z: n.z },
        1200
      )
    }
  }, [currentPlanetId, galaxyData.nodes])

  // Zoom to student's grade band on first load
  const hasZoomedRef = useRef(false)
  useEffect(() => {
    if (!fgRef.current || hasZoomedRef.current || !ForceGraph3D) return
    const timer = setTimeout(() => {
      if (fgRef.current && !hasZoomedRef.current) {
        hasZoomedRef.current = true
        const band = getGradeBandForGrade(initialGrade)
        const targets = band
          ? galaxyData.nodes.filter(n => n.gradeBand === band)
          : galaxyData.nodes
        const withPos = targets.filter((n: any) => n.x !== undefined)
        if (withPos.length > 0) {
          const cx = withPos.reduce((s: number, n: any) => s + n.x, 0) / withPos.length
          const cy = withPos.reduce((s: number, n: any) => s + n.y, 0) / withPos.length
          const cz = withPos.reduce((s: number, n: any) => s + n.z, 0) / withPos.length
          fgRef.current.cameraPosition(
            { x: cx, y: cy, z: cz + 250 },
            { x: cx, y: cy, z: cz },
            2000
          )
        }
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [ForceGraph3D, galaxyData.nodes, initialGrade])

  // WASD / Arrow key camera controls
  useEffect(() => {
    if (!fgRef.current) return
    const speed = 4
    const keys = new Set<string>()

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "q", "e"].includes(key)) {
        e.preventDefault()
        keys.add(key)
        orbitingRef.current = false
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase())
    }

    let animFrame: number
    const moveCamera = () => {
      if (keys.size > 0 && fgRef.current) {
        const pos = fgRef.current.cameraPosition()
        let dx = 0, dy = 0, dz = 0
        if (keys.has("w") || keys.has("arrowup")) dz -= speed
        if (keys.has("s") || keys.has("arrowdown")) dz += speed
        if (keys.has("a") || keys.has("arrowleft")) dx -= speed
        if (keys.has("d") || keys.has("arrowright")) dx += speed
        if (keys.has("q")) dy += speed
        if (keys.has("e")) dy -= speed
        fgRef.current.cameraPosition({
          x: pos.x + dx,
          y: pos.y + dy,
          z: pos.z + dz,
        })
      }
      animFrame = requestAnimationFrame(moveCamera)
    }
    animFrame = requestAnimationFrame(moveCamera)

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      cancelAnimationFrame(animFrame)
    }
  }, [ForceGraph3D])

  const handleNodeClick = useCallback((node: GalaxyNode) => {
    orbitingRef.current = false

    if (node.access === "locked") {
      onLockedPlanetClick?.(node.id)
      // Still fly camera to it so they can see it
      if (fgRef.current) {
        const n = node as any
        if (n.x !== undefined) {
          fgRef.current.cameraPosition(
            { x: n.x, y: n.y, z: n.z + 120 },
            { x: n.x, y: n.y, z: n.z },
            800
          )
        }
      }
      return
    }

    onPlanetClick(node.id)

    if (fgRef.current) {
      const n = node as any
      if (n.x !== undefined) {
        fgRef.current.cameraPosition(
          { x: n.x, y: n.y, z: n.z + 100 },
          { x: n.x, y: n.y, z: n.z },
          800
        )
      }
    }
  }, [onPlanetClick, onLockedPlanetClick])

  // Custom node rendering for pulse effect on completed planets
  const nodeThreeObject = useCallback((node: GalaxyNode) => {
    if (typeof window === "undefined") return undefined
    const THREE = require("three")

    const group = new THREE.Group()

    // Main planet sphere
    const geometry = new THREE.SphereGeometry(Math.sqrt(node.val) * 1.2, 16, 12)
    const material = new THREE.MeshLambertMaterial({
      color: node.color,
      emissive: node.color,
      emissiveIntensity: node.isCompleted ? 0.6 : 0.2,
      transparent: true,
      opacity: 0.9,
    })
    const sphere = new THREE.Mesh(geometry, material)
    group.add(sphere)

    // Pulse ring for completed planets
    if (node.isCompleted) {
      const ringGeom = new THREE.RingGeometry(
        Math.sqrt(node.val) * 1.6,
        Math.sqrt(node.val) * 1.9,
        32
      )
      const ringMat = new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      })
      const ring = new THREE.Mesh(ringGeom, ringMat)
      ring.userData = { isPulse: true }
      group.add(ring)
    }

    // Text label — truncate long names
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    canvas.width = 512
    canvas.height = 80
    ctx.clearRect(0, 0, 512, 80)

    // Shorten long domain names
    let displayName = node.name
    const shortNames: Record<string, string> = {
      "Operations & Algebraic Thinking": "Algebra",
      "Number & Operations In Base Ten": "Base Ten",
      "Number & Operations-Fractions": "Fractions",
      "Number & Operations - Fractions": "Fractions",
      "Counting & Cardinality": "Counting",
      "Measurement & Data": "Measurement",
      "Ratios & Proportional Relationships": "Ratios",
      "The Number System": "Numbers",
      "Expressions & Equations": "Equations",
      "Statistics & Probability": "Statistics",
    }
    if (shortNames[displayName]) displayName = shortNames[displayName]
    if (displayName.length > 16) displayName = displayName.slice(0, 15) + "..."

    ctx.font = "bold 28px sans-serif"
    ctx.fillStyle = "white"
    ctx.textAlign = "center"
    ctx.fillText(displayName, 256, 32)
    ctx.font = "18px sans-serif"
    ctx.fillStyle = "rgba(255,255,255,0.5)"
    ctx.fillText(`Grade ${node.grade}`, 256, 58)

    const texture = new THREE.CanvasTexture(canvas)
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sprite = new THREE.Sprite(spriteMat)
    sprite.scale.set(18, 3.5, 1)
    sprite.position.set(0, Math.sqrt(node.val) * 1.8 + 3, 0)
    group.add(sprite)

    return group
  }, [])

  // Animate pulse rings
  useEffect(() => {
    if (!fgRef.current || !ForceGraph3D) return
    let frame: number
    const animate = () => {
      const fg = fgRef.current
      if (fg && fg.scene) {
        const time = Date.now() * 0.001
        fg.scene.traverse((obj: any) => {
          if (obj.userData?.isPulse) {
            obj.scale.setScalar(1 + Math.sin(time * 2) * 0.15)
            obj.material.opacity = 0.2 + Math.sin(time * 2) * 0.1
          }
        })
      }
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [ForceGraph3D])

  if (!ForceGraph3D) {
    return (
      <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading galaxy...</div>
      </div>
    )
  }

  return (
    <div
      className="w-full h-full bg-zinc-950"
      onMouseDown={handleInteraction}
      onTouchStart={handleInteraction}
      onWheel={handleInteraction}
    >
      <ForceGraph3D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={galaxyData}
        backgroundColor="#09090b"
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        nodeLabel={(node: GalaxyNode) => {
          if (node.access === "locked") return `${node.name} (Grade ${node.grade})\nKeep exploring to reach here`
          return `${node.name} (Grade ${node.grade})\n${node.unlockedCount}/${node.moonCount} demonstrated`
        }}
        nodeResolution={16}
        linkColor={(link: GalaxyLink) => link.color}
        linkWidth={(link: GalaxyLink) => Math.max(0.5, Math.min(link.edgeCount * 0.5, 4))}
        linkOpacity={0.9}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={(link: GalaxyLink) => link.color}
        onNodeClick={handleNodeClick}
        enableNodeDrag={false}
        warmupTicks={80}
        cooldownTicks={150}
        d3AlphaDecay={0.025}
        d3VelocityDecay={0.3}
      />
    </div>
  )
}
