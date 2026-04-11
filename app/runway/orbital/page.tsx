'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// --- Video Data ---
const ORBITAL_VIDEOS = [
  { id: 'v0', youtubeId: '-l6wrTvMcbY', angle: 0, title: 'Video 01' },
  { id: 'v1', youtubeId: 'jtTjzDTpx8o', angle: 60, title: 'Video 02' },
  { id: 'v2', youtubeId: 'Tg9cN2A7-cA', angle: 120, title: 'Video 03' },
  { id: 'v3', youtubeId: '_GT9SmA1vlI', angle: 180, title: 'Video 04' },
  { id: 'v4', youtubeId: '-W20dfeNCmI', angle: 240, title: 'Video 05' },
  { id: 'v5', youtubeId: '9Y4wk-J3x7w', angle: 300, title: 'Video 06' }
]

// --- Internal Tween Logic to avoid "tween.js" errors ---
class SimpleTween {
  private start: any; private end: any; private duration: number; private startTime: number
  private onUpdate: (v: any) => void; private onComplete?: () => void; private easing: (t: number) => number; public active = true

  constructor(start: any, end: any, duration: number, onUpdate: (v: any) => void, onComplete?: () => void) {
    this.start = { ...start }; this.end = { ...end }; this.duration = duration
    this.startTime = performance.now(); this.onUpdate = onUpdate; this.onComplete = onComplete
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
    if (progress === 1) {
      this.active = false
      if (this.onComplete) this.onComplete()
    }
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
    camera.position.set(0, 50, 75)
    const webglScene = new THREE.Scene()
    const cssScene = new THREE.Scene()

    // 2. WebGL Renderer (Top Layer, Transparent)
    const webglRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    webglRenderer.setSize(width, height)
    webglRenderer.setPixelRatio(window.devicePixelRatio)
    webglRenderer.domElement.style.position = 'absolute'
    webglRenderer.domElement.style.top = '0'; webglRenderer.domElement.style.zIndex = '5'
    webglRenderer.domElement.style.pointerEvents = 'none' // Allow clicks to pass to CSS
    webglRenderer.domElement.style.opacity = '1'
    webglRenderer.domElement.style.transition = 'opacity 0.3s ease'
    containerRef.current.appendChild(webglRenderer.domElement)
    const webglCanvas = webglRenderer.domElement

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
      pts.renderOrder = 5 // Render after mask, before black hole
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
    const targets: any = { overview: { anchor: null, videoObj: null } }
    const orbitRadius = 75, scale = 0.018

    // State for iframe swapping (proximity-based)
    const videoRefs = new Map<string, { div: HTMLDivElement; obj: CSS3DObject; pos: THREE.Vector3 }>()
    let currentActiveVideo: string | null = null
    let activeVideoId: string | null = null  // Track current video at proximity

    // Canvas opacity management
    let targetOpacity = 1.0
    let currentOpacity = 1.0
    const opacityTransitionSpeed = 0.02

    // Helper: Check if camera is perpendicular to video plane (focus rule)
    const isFocused = (videoPos: THREE.Vector3, threshold = Math.PI / 6) => {
      const camToVideo = videoPos.clone().sub(camera.position).normalize()
      const planeNormal = videoPos.clone().normalize() // Normal points outward from origin
      const angle = Math.acos(Math.max(-1, Math.min(1, camToVideo.dot(planeNormal))))
      return angle < threshold
    }

    // Helper: Check if video is in front of camera (frustum gating)
    const isInFrustum = (videoPos: THREE.Vector3): boolean => {
      const camDir = camera.getWorldDirection(new THREE.Vector3())
      const camToVideo = videoPos.clone().sub(camera.position).normalize()
      const dotProduct = camDir.dot(camToVideo)
      return dotProduct > 0 // Positive dot product = video is in front
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

      // Mask Mesh (Occlusion) - Disabled for inside-ring theater mode
      const maskEnabled = false
      if (maskEnabled) {
        const mask = new THREE.Mesh(new THREE.PlaneGeometry(800 * scale, 450 * scale), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true }))
        mask.position.copy(pos); mask.rotation.copy(obj.rotation); mask.renderOrder = 0 // Render first for depth
        webglScene.add(mask)
      }

      div.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        e.stopImmediatePropagation()
      }, true)  // Capture phase to intercept before OrbitControls

      div.onclick = (e) => {
        e.stopPropagation()
        document.dispatchEvent(new CustomEvent('flyTo', { detail: { targetId: v.id } }))
      }

      // Store video ref for iframe swapping (including CSS3DObject for z-index control)
      videoRefs.set(v.id, { div, obj, pos: pos.clone() })

      // Store video object for fly-to calculations
      targets[v.id] = { videoObj: obj }
    })

    // Calculate orbit distance from viewport width (used for camera landing and swap proximity)
    const swapDistance = 30 * Math.max(0.6, Math.min(1.0, width / 1200)) * 1.1

    const handleFly = (e: any) => {
      const targetId = e.detail?.targetId
      if (!targetId) return

      // Garbage collect previous iframe if switching videos
      if (currentActiveVideo && currentActiveVideo !== targetId && currentActiveVideo !== 'overview') {
        const prevVideo = videos.find(v => v.id === currentActiveVideo)
        if (prevVideo) swapToThumbnail(currentActiveVideo, prevVideo.youtubeId)
      }

      // Determine camera position and target based on targetId
      let camPos: { x: number; y: number; z: number }
      let targetPos: { x: number; y: number; z: number }

      if (targetId === 'overview') {
        // Overview mode: standard position looking at origin
        camPos = { x: 0, y: 50, z: 75 }
        targetPos = { x: 0, y: 0, z: 0 }
        activeVideoId = null
        targetOpacity = 1.0
        // Reset all z-indices
        videoRefs.forEach(ref => ref.obj.element.style.zIndex = '1')
      } else {
        // Video mode: position camera at swapDistance from video, along origin->video direction
        const videoObj = targets[targetId]?.videoObj
        if (videoObj) {
          const videoWorldPos = new THREE.Vector3()
          videoObj.getWorldPosition(videoWorldPos)

          // Direction from origin toward video
          const dirFromOrigin = videoWorldPos.clone().normalize()

          // Position camera at swapDistance from origin along that direction
          camPos = {
            x: dirFromOrigin.x * swapDistance,
            y: dirFromOrigin.y * swapDistance,
            z: dirFromOrigin.z * swapDistance
          }

          // Look at video object
          targetPos = { x: videoWorldPos.x, y: videoWorldPos.y, z: videoWorldPos.z }
        } else {
          camPos = { x: 0, y: 0, z: 0 }
          targetPos = { x: 0, y: 0, z: 0 }
        }
        targetOpacity = 0.3 // Fade canvas when approaching video
      }

      // Animate camera position with dynamic near plane adjustment
      tweens.current.push(new SimpleTween(
        { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        camPos,
        1200,
        (v) => {
          camera.position.set(v.x, v.y, v.z)
          // Dynamic near plane adjustment: prevent clipping during close approach to black hole
          const dist = camera.position.length()
          camera.near = dist < 30 ? 8 : 0.1
          camera.updateProjectionMatrix()
        }
      ))

      // Animate controls target to video center (camera looks outward from video)
      tweens.current.push(new SimpleTween({ x: controls.target.x, y: controls.target.y, z: controls.target.z }, targetPos, 1200, (v) => controls.target.set(v.x, v.y, v.z)))
    }
    document.addEventListener('flyTo', handleFly)

    // Process proximity-based swaps and controls.target switching every frame
    const processProximitySwaps = () => {
      let swapProcessed = false // Throttle to 1 swap per frame
      let controlsTargetSet = false

      for (const [videoId, ref] of videoRefs) {
        const videoObj = targets[videoId]?.videoObj
        if (!videoObj) continue

        // Get video world position for distance calculation
        const videoWorldPos = new THREE.Vector3()
        videoObj.getWorldPosition(videoWorldPos)
        const dist = camera.position.distanceTo(videoWorldPos)
        const inFrustum = isInFrustum(ref.pos)

        // Within swapDistance: orbit around video, enable iframe
        if (activeVideoId === null && dist < swapDistance && inFrustum && !swapProcessed) {
          // Switch controls to orbit around video
          if (!controlsTargetSet) {
            controls.target.copy(videoWorldPos)
            controlsTargetSet = true
          }

          // ACTIVATE: Swap to iframe, promote z-index
          const video = videos.find(v => v.id === videoId)
          if (video) {
            swapToIframe(videoId, video.youtubeId)
            ref.obj.element.style.zIndex = '10'  // Per-video z-index
            activeVideoId = videoId
            swapProcessed = true
          }
        } else if (activeVideoId === videoId && dist > 25) {
          // Outside proximity: return to orbiting origin
          controls.target.set(0, 0, 0)
          controlsTargetSet = true

          // DEACTIVATE: Swap to thumbnail, demote z-index
          const video = videos.find(v => v.id === videoId)
          if (video) {
            swapToThumbnail(videoId, video.youtubeId)
            ref.obj.element.style.zIndex = '1'  // Reset z-index
            activeVideoId = null
            swapProcessed = true
          }
        } else if (activeVideoId === videoId) {
          // Maintain active video's z-index and controls.target
          if (!controlsTargetSet) {
            controls.target.copy(videoWorldPos)
            controlsTargetSet = true
          }
          ref.obj.element.style.zIndex = '10'
        } else {
          // Ensure inactive videos are at base z-index
          ref.obj.element.style.zIndex = '1'
        }
      }

      // Ensure controls.target returns to origin if no video is active
      if (!controlsTargetSet && activeVideoId === null && (controls.target.x !== 0 || controls.target.y !== 0 || controls.target.z !== 0)) {
        controls.target.set(0, 0, 0)
      }
    }

    const animate = (time: number) => {
      tweens.current = tweens.current.filter(t => t.active); tweens.current.forEach(t => t.update(time))

      // Process proximity-based swaps every frame
      processProximitySwaps()

      // Update canvas opacity for theater mode safety
      if (Math.abs(currentOpacity - targetOpacity) > 0.01) {
        currentOpacity += (targetOpacity - currentOpacity) * opacityTransitionSpeed
        webglCanvas.style.opacity = currentOpacity.toFixed(3)
      }

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
  const [isTracksOpen, setIsTracksOpen] = useState(false)
  const [isPlusOpen, setIsPlusOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleFlyTo = (id: string) => {
    document.dispatchEvent(new CustomEvent('flyTo', { detail: { targetId: id } }))
    setIsTracksOpen(false)
    setIsPlusOpen(false)
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

  const dropdownMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    marginTop: '8px',
    background: 'rgba(2, 1, 1, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '8px 0',
    color: '#FFF',
    fontSize: '11px',
    letterSpacing: '0.15em',
    fontFamily: 'monospace',
    zIndex: 1100,
    minWidth: '180px'
  }

  const dropdownItemStyle: React.CSSProperties = {
    padding: '8px 16px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s ease',
  }

  const dropdownItemHoverStyle: React.CSSProperties = {
    ...dropdownItemStyle,
    background: 'rgba(255, 165, 0, 0.1)'
  }

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#020101', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        nav > div:last-child {
          margin-left: auto;
        }

        @media (max-width: 768px) {
          nav {
            flex-wrap: wrap !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 12px !important;
            width: calc(100vw - 50px) !important;
            box-sizing: border-box !important;
          }
          nav > div:first-child {
            flex-basis: 100% !important;
            justify-content: center !important;
            gap: 15px !important;
            margin-left: 0 !important;
          }
          nav > button {
            order: 3 !important;
            margin-left: 0 !important;
          }
          nav > div:last-child {
            order: 4 !important;
            margin-left: 0 !important;
            flex-direction: row !important;
            gap: 8px !important;
          }
        }
      `}</style>

      {/* Translucent Saturn-Style Navbar */}
      <nav style={{
        position: 'fixed', top: '25px', left: '25px', right: '25px',
        display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px', zIndex: 1000,
      }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Date/Time Link + Title + Byline */}
          <a href="/archive" style={{...navItemStyle, textDecoration: 'none'}}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
              <span style={{ fontWeight: 600 }}>{time.toLocaleString('en-US', { month: 'short' }).toUpperCase()} {time.getDate()}</span>
              <span style={{ opacity: 0.4, fontSize: '9px' }}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>

            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
              <span style={{ fontWeight: 800, color: '#FFB347', fontSize: '12px' }}>THE ATLANTA GLEANER</span>
              <span style={{ opacity: 0.5, fontSize: '8px', letterSpacing: '0.2em' }}>EDITED BY GEORGE WASHINGTON</span>
            </div>
          </a>
        </div>

        {/* RUNWAY Button (moved to own nav-level item for mobile reflow) */}
        <button onClick={() => handleFlyTo('overview')} style={{ ...navItemStyle, background: 'rgba(255, 165, 0, 0.1)', borderColor: 'rgba(255, 165, 0, 0.3)' }}>
          RUNWAY
        </button>

        {/* Quick-Jump Track Selectors with Dropdowns */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* TRACKS Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setIsTracksOpen(!isTracksOpen)
                setIsPlusOpen(false)
              }}
              style={{ ...navItemStyle, padding: '10px 18px', minWidth: '45px', justifyContent: 'center' }}
            >
              TRACKS {isTracksOpen ? '▴' : '▾'}
            </button>
            {isTracksOpen && (
              <div style={dropdownMenuStyle}>
                {ORBITAL_VIDEOS.map((v, i) => (
                  <div
                    key={v.id}
                    onClick={() => handleFlyTo(v.id)}
                    style={dropdownItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {String(i + 1).padStart(2, '0')} // {v.title}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Plus Menu Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setIsPlusOpen(!isPlusOpen)
                setIsTracksOpen(false)
              }}
              style={{ ...navItemStyle, padding: '10px 15px' }}
            >
              {isPlusOpen ? '−' : '+'}
            </button>
            {isPlusOpen && (
              <div style={{...dropdownMenuStyle, right: '0'}}>
                <a href="/archive" style={{...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>ARCHIVE</a>
                <a href="/runway" style={{...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>RUNWAY</a>
                <a href="/saturn" style={{...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>SATURN</a>
                <a href="/vault" style={{...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>VAULT</a>
                <a href="/about" style={{...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>ABOUT</a>
              </div>
            )}
          </div>
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
