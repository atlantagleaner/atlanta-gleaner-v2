'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// --- Video Data ---
const ORBITAL_VIDEOS = [
  { id: 'v0', youtubeId: '-l6wrTvMcbY', angle: 0 },
  { id: 'v1', youtubeId: 'jtTjzDTpx8o', angle: 60 },
  { id: 'v2', youtubeId: 'Tg9cN2A7-cA', angle: 120 },
  { id: 'v3', youtubeId: '_GT9SmA1vlI', angle: 180 },
  { id: 'v4', youtubeId: '-W20dfeNCmI', angle: 240 },
  { id: 'v5', youtubeId: '9Y4wk-J3x7w', angle: 300 }
]

// --- Internal Tween Logic to avoid "tween.js" errors ---
class SimpleTween {
  private start: any; private end: any; private duration: number; private startTime: number
  private onUpdate: (v: any) => void; private easing: (t: number) => number; public active = true

  constructor(start: any, end: any, duration: number, onUpdate: (v: any) => void) {
    this.start = { ...start }; this.end = { ...end }; this.duration = duration
    this.startTime = performance.now(); this.onUpdate = onUpdate
    this.easing = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  update(now: number) {
    if (!this.active) return
    const elapsed = now - this.startTime
    const progress = Math.min(elapsed / this.duration, 1)
    const eased = this.easing(progress)
    const current: any = {}
    for (const key in this.start) current[key] = this.start[key] + (this.end[key] - this.start[key]) * eased
    this.onUpdate(current)
    if (progress === 1) this.active = false
  }
}

// --- 3D Scene Component ---
function EventHorizonScene({ videos }: { videos: typeof ORBITAL_VIDEOS }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tweens = useRef<SimpleTween[]>([])
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!containerRef.current) return
    const width = containerRef.current.clientWidth, height = containerRef.current.clientHeight
    
    // 1. Scene & Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
    camera.position.set(0, 50, 140)
    const webglScene = new THREE.Scene()
    const cssScene = new THREE.Scene()

    // 2. WebGL Renderer (Top Layer, Transparent)
    const webglRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    webglRenderer.setSize(width, height)
    webglRenderer.setPixelRatio(window.devicePixelRatio)
    webglRenderer.domElement.style.position = 'absolute'
    webglRenderer.domElement.style.top = '0'; webglRenderer.domElement.style.zIndex = '5'
    webglRenderer.domElement.style.pointerEvents = 'none' // Allow clicks to pass to CSS
    containerRef.current.appendChild(webglRenderer.domElement)

    // 3. CSS Renderer (Bottom Layer, Interactive)
    const cssRenderer = new CSS3DRenderer()
    cssRenderer.setSize(width, height)
    cssRenderer.domElement.style.position = 'absolute'
    cssRenderer.domElement.style.top = '0'; cssRenderer.domElement.style.zIndex = '1'
    containerRef.current.appendChild(cssRenderer.domElement)

    // 4. Controls
    const controls = new OrbitControls(camera, cssRenderer.domElement)
    controls.enableDamping = true

    // 5. Black Hole & Accretion (WebGL)
    const bhRadius = 8.5
    const bh = new THREE.Mesh(new THREE.SphereGeometry(bhRadius, 64, 64), new THREE.MeshBasicMaterial({ color: 0x000000 }))
    bh.renderOrder = 1000
    webglScene.add(bh)

    const accretionDisks: any[] = []
    const addRing = (inner: number, outer: number, count: number, color: number, speed: number) => {
      const geo = new THREE.BufferGeometry(), pos = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const r = inner + Math.random() * (outer - inner), theta = Math.random() * Math.PI * 2
        pos[i*3] = Math.cos(theta) * r; pos[i*3+1] = (Math.random() - 0.5) * 2; pos[i*3+2] = Math.sin(theta) * r
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const mat = new THREE.PointsMaterial({ size: 0.18, color, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending })
      const pts = new THREE.Points(geo, mat)
      pts.rotation.x = -Math.PI / 3.5
      accretionDisks.push({ mesh: pts, speed }); webglScene.add(pts)
    }
    addRing(bhRadius * 2, bhRadius * 5, 12000, 0xffa500, 0.035)
    addRing(bhRadius * 4, bhRadius * 8.5, 15000, 0xff4500, 0.015)

    // 6. Starfield
    const starGeo = new THREE.BufferGeometry(), starPos = new Float32Array(3000 * 3)
    for (let i = 0; i < 3000; i++) {
      const r = 400 + Math.random() * 400, t = Math.random() * 2 * Math.PI, p = Math.acos(2 * Math.random() - 1)
      starPos[i*3] = r * Math.sin(p) * Math.cos(t); starPos[i*3+1] = r * Math.sin(p) * Math.sin(t); starPos[i*3+2] = r * Math.cos(p)
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    webglScene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 1.0, color: 0xffffff, transparent: true, opacity: 0.4 })))

    // 7. Video Billboards
    const targets: any = { overview: { camPos: { x: 0, y: 50, z: 140 }, targetPos: { x: 0, y: 0, z: 0 } } }
    const orbitRadius = 75, scale = 0.018

    // State for iframe swapping & snap/latch
    const videoRefs = new Map<string, { div: HTMLDivElement; pos: THREE.Vector3 }>()
    let currentActiveVideo: string | null = null
    let lastSnapTime = 0
    let pendingVideoSwap: string | null = null
    let tweenCompleteTime = 0

    // State for theater mode (z-index & opacity transitions)
    let theaterModeActive = false
    let focusedVideoId: string | null = null
    let webglOpacity = 1.0
    let theaterModeReadyTime = 0

    // Helper: Check if camera is perpendicular to video plane (focus rule)
    const isFocused = (videoPos: THREE.Vector3, threshold = Math.PI / 6) => {
      const camToVideo = videoPos.clone().sub(camera.position).normalize()
      const planeNormal = videoPos.clone().normalize() // Normal points outward from origin
      const angle = Math.acos(Math.max(-1, Math.min(1, camToVideo.dot(planeNormal))))
      return angle < threshold
    }

    // Helper: Swap thumbnail to iframe
    const swapToIframe = (videoId: string, youtubeId: string) => {
      const ref = videoRefs.get(videoId)
      if (!ref) return
      const { div } = ref
      const img = div.querySelector('img')
      if (img) img.remove()
      const iframe = document.createElement('iframe')
      iframe.src = `https://www.youtube.com/embed/${youtubeId}`
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      iframe.style.border = 'none'
      iframe.style.background = '#000'
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
      iframe.allowFullscreen = true
      div.appendChild(iframe)
      currentActiveVideo = videoId
    }

    // Helper: Swap iframe back to thumbnail
    const swapToThumbnail = (videoId: string, youtubeId: string) => {
      const ref = videoRefs.get(videoId)
      if (!ref) return
      const { div } = ref
      const iframe = div.querySelector('iframe')
      if (iframe) iframe.remove()
      const img = document.createElement('img')
      img.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
      img.style.width = '100%'
      img.style.height = '100%'
      img.style.objectFit = 'cover'
      div.appendChild(img)
    }

    videos.forEach((v) => {
      const rad = (v.angle * Math.PI) / 180
      const pos = new THREE.Vector3(Math.cos(rad) * orbitRadius, Math.sin(rad * 3) * 6, Math.sin(rad) * orbitRadius)
      
      const div = document.createElement('div')
      div.style.width = '800px'; div.style.height = '450px'; div.style.background = '#000'
      div.style.border = '1px solid rgba(255,255,255,0.1)'; div.style.cursor = 'pointer'; div.style.pointerEvents = 'auto'
      
      const img = document.createElement('img')
      img.src = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`
      img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'cover'
      div.appendChild(img)

      const obj = new CSS3DObject(div)
      obj.position.copy(pos); obj.lookAt(0, 0, 0); obj.scale.set(scale, scale, scale)
      cssScene.add(obj)

      // Mask Mesh (Occlusion)
      const mask = new THREE.Mesh(new THREE.PlaneGeometry(800 * scale, 450 * scale), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true }))
      mask.position.copy(pos); mask.rotation.copy(obj.rotation); webglScene.add(mask)

      div.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        e.stopImmediatePropagation()
      }, true)  // Capture phase to intercept before OrbitControls

      div.onclick = (e) => {
        e.stopPropagation()
        document.dispatchEvent(new CustomEvent('flyTo', { detail: { targetId: v.id } }))
      }

      // Store video ref for iframe swapping
      videoRefs.set(v.id, { div, pos: pos.clone() })

      const offset = pos.clone().normalize().multiplyScalar(28)
      targets[v.id] = { camPos: { x: pos.x + offset.x, y: pos.y + offset.y, z: pos.z + offset.z }, targetPos: { x: pos.x, y: pos.y, z: pos.z } }
    })

    // Helper: Update theater mode (opacity & z-index)
    const updateTheaterMode = (focusedPos: THREE.Vector3 | null) => {
      if (!focusedPos) {
        // No focused video, reset theater mode
        if (theaterModeActive) {
          cssRenderer.domElement.style.zIndex = '1'
          theaterModeActive = false
          focusedVideoId = null
          theaterModeReadyTime = 0
        }
        // Fade opacity back to normal
        if (webglOpacity < 1.0) {
          webglOpacity = Math.min(1.0, webglOpacity + 0.02)
          webglRenderer.domElement.style.opacity = webglOpacity.toString()
        }
        return
      }

      const dist = camera.position.distanceTo(focusedPos)

      // Progressive opacity based on distance
      if (dist > 30) {
        webglOpacity = Math.min(1.0, webglOpacity + 0.02)
        theaterModeReadyTime = 0
      } else if (dist > 20) {
        const fadeProgress = (30 - dist) / 10
        webglOpacity = 1.0 - fadeProgress * 0.7
        theaterModeReadyTime = 0
      } else {
        webglOpacity = 0.3
        // Check if conditions met for theater mode (focused + distance)
        if (isFocused(focusedPos)) {
          theaterModeReadyTime += 16
          if (theaterModeReadyTime > 100 && !theaterModeActive) {
            cssRenderer.domElement.style.zIndex = '10'
            theaterModeActive = true
          }
        } else {
          theaterModeReadyTime = 0
          if (theaterModeActive) {
            cssRenderer.domElement.style.zIndex = '1'
            theaterModeActive = false
          }
        }
      }

      webglRenderer.domElement.style.opacity = webglOpacity.toString()
    }

    const handleFly = (e: any) => {
      const targetId = e.detail?.targetId
      const d = targets[targetId]
      if (!d) return

      // Garbage collect previous iframe if switching videos
      if (currentActiveVideo && currentActiveVideo !== targetId && currentActiveVideo !== 'overview') {
        const prevVideo = videos.find(v => v.id === currentActiveVideo)
        if (prevVideo) swapToThumbnail(currentActiveVideo, prevVideo.youtubeId)
      }

      // Reset theater mode when going to overview
      if (targetId === 'overview') {
        theaterModeActive = false
        focusedVideoId = null
        theaterModeReadyTime = 0
      }

      // Mark this video for swap after animation completes
      pendingVideoSwap = targetId

      tweens.current.push(new SimpleTween({ x: camera.position.x, y: camera.position.y, z: camera.position.z }, d.camPos, 1200, (v) => camera.position.set(v.x, v.y, v.z)))
      tweens.current.push(new SimpleTween({ x: controls.target.x, y: controls.target.y, z: controls.target.z }, d.targetPos, 1200, (v) => controls.target.set(v.x, v.y, v.z)))
      tweenCompleteTime = 0
    }
    document.addEventListener('flyTo', handleFly)

    const animate = (time: number) => {
      tweens.current = tweens.current.filter(t => t.active); tweens.current.forEach(t => t.update(time))

      // Handle swap after animation completes
      if (pendingVideoSwap && tweens.current.length === 0) {
        tweenCompleteTime += 16 // Approximate frame time
        if (tweenCompleteTime > 50) { // 50ms buffer after tweens finish
          const targetVideo = videos.find(v => v.id === pendingVideoSwap)
          const targetPos = videoRefs.get(pendingVideoSwap)?.pos
          if (targetVideo && targetPos && isFocused(targetPos)) {
            swapToIframe(pendingVideoSwap, targetVideo.youtubeId)
            focusedVideoId = pendingVideoSwap
          }
          pendingVideoSwap = null
        }
      } else if (pendingVideoSwap && tweens.current.length > 0) {
        tweenCompleteTime = 0 // Reset buffer if new animation started
      }

      // Snap/latch: auto-animate to perfect viewing position if close but not perpendicular
      const now = performance.now()
      if (now - lastSnapTime > 1000) { // 1 second cooldown
        for (const [videoId, ref] of videoRefs) {
          const dist = camera.position.distanceTo(ref.pos)
          if (dist < 60 && !isFocused(ref.pos, Math.PI / 6 + 0.1)) { // Distance threshold + angle threshold (30°)
            // Trigger snap/latch animation to this video
            const d = targets[videoId]
            if (d) {
              tweens.current.push(new SimpleTween({ x: camera.position.x, y: camera.position.y, z: camera.position.z }, d.camPos, 800, (v) => camera.position.set(v.x, v.y, v.z)))
              tweens.current.push(new SimpleTween({ x: controls.target.x, y: controls.target.y, z: controls.target.z }, d.targetPos, 800, (v) => controls.target.set(v.x, v.y, v.z)))
              pendingVideoSwap = videoId
              tweenCompleteTime = 0
              lastSnapTime = now
            }
            break // Only snap to one video per frame
          }
        }
      }

      // Theater mode: manage z-index & opacity based on focused video distance
      const focusedVideoPos = focusedVideoId ? videoRefs.get(focusedVideoId)?.pos : null
      updateTheaterMode(focusedVideoPos || null)

      accretionDisks.forEach(d => { d.mesh.rotation.z -= d.speed * 0.05 })
      controls.update()
      webglRenderer.render(webglScene, camera); cssRenderer.render(cssScene, camera)
      frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)

    const handleResize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth, h = containerRef.current.clientHeight
      camera.aspect = w / h; camera.updateProjectionMatrix()
      webglRenderer.setSize(w, h); cssRenderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('flyTo', handleFly)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(frameRef.current)
      webglRenderer.dispose(); webglRenderer.domElement.remove(); cssRenderer.domElement.remove()
    }
  }, [videos])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
}

// --- Main Application UI ---
export default function OrbitalPage() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleFlyTo = (id: string) => {
    document.dispatchEvent(new CustomEvent('flyTo', { detail: { targetId: id } }))
  }

  const navItemStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.04)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '100px',
    padding: '10px 24px',
    color: '#FFF',
    fontSize: '11px',
    letterSpacing: '0.15em',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    transition: 'all 0.2s ease',
    userSelect: 'none'
  }

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#020101', overflow: 'hidden', position: 'relative' }}>
      {/* Translucent Saturn-Style Navbar */}
      <nav style={{
        position: 'fixed', top: '25px', left: '25px', right: '25px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000,
      }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Back/Metadata Hybrid */}
          <div style={navItemStyle} onClick={() => window.history.back()}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
              <span style={{ fontWeight: 600 }}>{time.toLocaleString('en-US', { month: 'short' }).toUpperCase()} {time.getDate()}</span>
              <span style={{ opacity: 0.4, fontSize: '9px' }}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
            
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
              <span style={{ fontWeight: 800, color: '#FFB347', fontSize: '12px' }}>ORBITAL — EVENT HORIZON</span>
              <span style={{ opacity: 0.5, fontSize: '8px', letterSpacing: '0.2em' }}>THE ATLANTA GLEANER • EDITED BY GEORGE WASHINGTON</span>
            </div>
          </div>
          
          <button onClick={() => handleFlyTo('overview')} style={{ ...navItemStyle, background: 'rgba(255, 165, 0, 0.1)', borderColor: 'rgba(255, 165, 0, 0.3)' }}>
            RESET VIEW
          </button>
        </div>

        {/* Quick-Jump Track Selectors */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {ORBITAL_VIDEOS.map((v, i) => (
            <button key={v.id} onClick={() => handleFlyTo(v.id)} style={{ ...navItemStyle, padding: '10px 18px', minWidth: '45px', justifyContent: 'center' }}>
              {i + 1}
            </button>
          ))}
          <button style={{ ...navItemStyle, padding: '10px 15px', background: 'rgba(255,255,255,0.08)' }}>+</button>
        </div>
      </nav>

      {/* 3D Scene Container */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <EventHorizonScene videos={ORBITAL_VIDEOS} />
      </div>

      {/* Aesthetic Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6,
        background: 'radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.6) 100%)'
      }} />
    </div>
  )
}
