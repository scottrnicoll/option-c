"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { GalaxyData, GalaxyNode, GalaxyLink } from "@/lib/galaxy-utils"

interface GalaxyViewProps {
  galaxyData: GalaxyData
  onPlanetClick: (planetId: string) => void
  onLockedPlanetClick?: (planetId: string) => void
  currentPlanetId: string | null
  initialGrade: string | null
  recommendedPlanetId?: string | null
}

function getGradeBandForGrade(grade: string | null): string | null {
  if (!grade) return null
  if (grade === "K" || grade === "1" || grade === "2") return "K-2"
  if (grade === "3" || grade === "4" || grade === "5") return "3-5"
  if (grade === "6" || grade === "7" || grade === "8") return "6-8"
  return "HS"
}

const ZOOM_MIN_DIST = 80
const ZOOM_MAX_DIST = 600

export function GalaxyView({ galaxyData, onPlanetClick, onLockedPlanetClick, currentPlanetId, initialGrade, recommendedPlanetId }: GalaxyViewProps) {
  const fgRef = useRef<any>(null)
  const [ForceGraph3D, setForceGraph3D] = useState<any>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [zoomLevel, setZoomLevel] = useState(50)
  const [showPinchHint, setShowPinchHint] = useState(false)
  const recommendedPlanetIdRef = useRef(recommendedPlanetId)
  useEffect(() => { recommendedPlanetIdRef.current = recommendedPlanetId }, [recommendedPlanetId])

  // Dynamic import of ForceGraph3D (browser-only)
  useEffect(() => {
    import("react-force-graph-3d").then(mod => {
      setForceGraph3D(() => mod.default)
    })
  }, [])

  // Track window dimensions + show mobile pinch hint
  useEffect(() => {
    const update = () => setDimensions({ width: window.innerWidth, height: window.innerHeight })
    update()
    if (window.innerWidth < 768) {
      setShowPinchHint(true)
      const timer = setTimeout(() => setShowPinchHint(false), 3000)
      window.addEventListener("resize", update)
      return () => { window.removeEventListener("resize", update); clearTimeout(timer) }
    }
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

  // Zoom to student's grade band on first load. If no grade is picked,
  // center on Fractions Grade 5 (planet id "5.NF") so the initial view
  // isn't off-center.
  const hasZoomedRef = useRef(false)
  useEffect(() => {
    if (!fgRef.current || hasZoomedRef.current || !ForceGraph3D) return
    const timer = setTimeout(() => {
      if (fgRef.current && !hasZoomedRef.current) {
        hasZoomedRef.current = true
        orbitingRef.current = false  // stop orbit before zooming to avoid camera fighting
        let targets: any[]
        if (initialGrade) {
          const band = getGradeBandForGrade(initialGrade)
          targets = galaxyData.nodes.filter(n => n.gradeBand === band)
        } else {
          // No grade selected → center on Fractions Grade 5 if it exists
          const fractions5 = galaxyData.nodes.find(n => n.id === "5.NF")
          targets = fractions5 ? [fractions5] : galaxyData.nodes
        }
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

    // Skip camera controls when the user is typing in any text field
    // (otherwise WASD/QE/arrows are eaten by preventDefault and you can't
    // type those letters into a textarea or input).
    const isTyping = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
      if (target.isContentEditable) return true
      return false
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      const key = e.key.toLowerCase()
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "q", "e"].includes(key)) {
        e.preventDefault()
        keys.add(key)
        orbitingRef.current = false
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
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
    const isRecommended = node.id === recommendedPlanetIdRef.current
    if (typeof window === "undefined") return undefined
    const THREE = require("three")

    const group = new THREE.Group()

    // Main planet sphere
    const radius = Math.sqrt(node.val) * 1.2
    const geometry = new THREE.SphereGeometry(radius, 16, 12)
    const isLocked = node.access === "locked"
    const material = new THREE.MeshLambertMaterial({
      color: isLocked ? "#1a1a1a" : node.color,
      emissive: isLocked ? "#000000" : node.color,
      emissiveIntensity: node.isCompleted ? 0.8 : isLocked ? 0 : 0.45,
      transparent: false,
      opacity: 1,
    })
    const sphere = new THREE.Mesh(geometry, material)
    group.add(sphere)

    // Wireframe outline for locked planets so they're visible
    if (isLocked) {
      const wireGeom = new THREE.SphereGeometry(radius * 1.05, 10, 8)
      const wireMat = new THREE.MeshBasicMaterial({
        color: "#555555",
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
      group.add(new THREE.Mesh(wireGeom, wireMat))
    }

    // Inner pulse ring — every "completed" planet (all moons green or gold)
    if (node.isCompleted) {
      const innerGeom = new THREE.RingGeometry(
        Math.sqrt(node.val) * 1.6,
        Math.sqrt(node.val) * 1.9,
        32
      )
      const innerMat = new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      })
      const innerRing = new THREE.Mesh(innerGeom, innerMat)
      innerRing.userData = { isPulse: true }
      group.add(innerRing)
    }

    // Outer spinning gold ring — ONLY when every moon is mastered (gold).
    // Reserved for the "fully mastered" tier per the Z model.
    if (node.isFullyMastered) {
      const outerGeom = new THREE.RingGeometry(
        Math.sqrt(node.val) * 2.1,
        Math.sqrt(node.val) * 2.35,
        32
      )
      const outerMat = new THREE.MeshBasicMaterial({
        color: "#f59e0b",
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
      })
      const outerRing = new THREE.Mesh(outerGeom, outerMat)
      outerRing.userData = { isMasteredRing: true }
      group.add(outerRing)
    }

    // "Start here" indicator for recommended planet
    if (isRecommended) {
      const recRingGeom = new THREE.RingGeometry(
        Math.sqrt(node.val) * 2.0,
        Math.sqrt(node.val) * 2.4,
        32
      )
      const recRingMat = new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      })
      const recRing = new THREE.Mesh(recRingGeom, recRingMat)
      recRing.userData = { isRecommendedRing: true }
      group.add(recRing)
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
    if (isRecommended) {
      ctx.font = "bold 16px sans-serif"
      ctx.fillStyle = "#ffffff"
      ctx.fillText("★ Start here", 256, 76)
    }

    const texture = new THREE.CanvasTexture(canvas)
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true })
    const sprite = new THREE.Sprite(spriteMat)
    sprite.scale.set(18, 3.5, 1)
    sprite.position.set(0, Math.sqrt(node.val) * 1.8 + 3, 0)
    group.add(sprite)

    return group
  }, [])

  // Zoom slider handler
  const handleZoomSlider = useCallback((value: number) => {
    setZoomLevel(value)
    orbitingRef.current = false
    if (!fgRef.current) return
    const { x, y, z } = fgRef.current.cameraPosition()
    const currentDist = Math.sqrt(x * x + y * y + z * z)
    if (currentDist < 0.001) return
    const targetDist = ZOOM_MIN_DIST + ((100 - value) / 100) * (ZOOM_MAX_DIST - ZOOM_MIN_DIST)
    const scale = targetDist / currentDist
    fgRef.current.cameraPosition({
      x: x * scale,
      y: y * scale,
      z: z * scale,
    })
  }, [])

  // Animate pulse rings + sync zoom slider from camera
  useEffect(() => {
    if (!fgRef.current || !ForceGraph3D) return
    let frame: number
    const animate = () => {
      const fg = fgRef.current
      if (fg && typeof fg.scene === "function") {
        // Sync zoom slider from current camera distance
        const pos = fg.cameraPosition()
        const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z)
        const clamped = Math.max(ZOOM_MIN_DIST, Math.min(ZOOM_MAX_DIST, dist))
        const level = 100 - ((clamped - ZOOM_MIN_DIST) / (ZOOM_MAX_DIST - ZOOM_MIN_DIST)) * 100
        setZoomLevel(Math.round(level))

        const time = Date.now() * 0.001
        // In react-force-graph-3d, fg.scene is a method that returns the
        // THREE.Scene, not a property. Older versions exposed it as a
        // property — call it as a function for the current version.
        fg.scene().traverse((obj: any) => {
          if (obj.userData?.isPulse) {
            obj.scale.setScalar(1 + Math.sin(time * 2) * 0.15)
            obj.material.opacity = 0.2 + Math.sin(time * 2) * 0.1
          }
          if (obj.userData?.isMasteredRing) {
            obj.rotation.z = time * 0.4
            obj.material.opacity = 0.4 + Math.sin(time * 1.5) * 0.2
          }
          if (obj.userData?.isRecommendedRing) {
            obj.scale.setScalar(1 + Math.sin(time * 3) * 0.2)
            obj.material.opacity = 0.4 + Math.sin(time * 3) * 0.3
            obj.rotation.z = time * 0.5
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
      {/* Zoom slider */}
      <div className="absolute bottom-20 right-4 z-10 flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => handleZoomSlider(Math.min(100, zoomLevel + 10))}
          className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 text-lg font-bold flex items-center justify-center hover:bg-zinc-700 active:bg-zinc-600 transition-colors"
          aria-label="Zoom in"
        >
          +
        </button>
        <div className="relative h-[120px] w-8 flex items-center justify-center">
          <input
            type="range"
            min={0}
            max={100}
            value={zoomLevel}
            onChange={(e) => handleZoomSlider(Number(e.target.value))}
            className="absolute h-8 w-[120px] -rotate-90 origin-center appearance-none bg-transparent cursor-pointer [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:mt-[-6px] [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-zinc-700 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0"
            aria-label="Zoom level"
          />
        </div>
        <button
          type="button"
          onClick={() => handleZoomSlider(Math.max(0, zoomLevel - 10))}
          className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 text-lg font-bold flex items-center justify-center hover:bg-zinc-700 active:bg-zinc-600 transition-colors"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* Mobile pinch hint */}
      {showPinchHint && (
        <div className="absolute bottom-20 right-16 z-10 bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 rounded-lg px-3 py-1.5 animate-fade-in">
          <span className="text-xs text-zinc-300">Pinch to zoom</span>
        </div>
      )}

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
