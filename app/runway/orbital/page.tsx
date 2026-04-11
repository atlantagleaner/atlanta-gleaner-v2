'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'

// --- Video Data ---
const ORBITAL_VIDEOS = [
  { id: 'v0', youtubeId: '-l6wrTvMcbY', angle: 0, title: 'Video 01' },
  { id: 'v1', youtubeId: 'jtTjzDTpx8o', angle: 60, title: 'Video 02' },
  { id: 'v2', youtubeId: 'Tg9cN2A7-cA', angle: 120, title: 'Video 03' },
  { id: 'v3', youtubeId: '_GT9SmA1vlI', angle: 180, title: 'Video 04' },
  { id: 'v4', youtubeId: '-W20dfeNCmI', angle: 240, title: 'Video 05' },
  { id: 'v5', youtubeId: '9Y4wk-J3x7w', angle: 300, title: 'Video 06' }
]

// --- Simple Tween ---
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
function EventHorizonScene({ videos, onOrbitModeToggle }: { videos: typeof ORBITAL_VIDEOS; onOrbitModeToggle: (enabled: boolean) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tweens = useRef<SimpleTween[]>([])
  const frameRef = useRef<number>(0)
  const sceneRef = useRef<any>({})

  useEffect(() => {
    if (!containerRef.current) return
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    // Scene setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
    camera.position.set(0, 50, 100)

    const webglScene = new THREE.Scene()
    const cssScene = new THREE.Scene()

    // WebGL Renderer
    const webglRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    webglRenderer.setSize(width, height)
    webglRenderer.setPixelRatio(window.devicePixelRatio)
    webglRenderer.domElement.style.position = 'absolute'
    webglRenderer.domElement.style.top = '0'
    webglRenderer.domElement.style.zIndex = '5'
    webglRenderer.domElement.style.pointerEvents = 'none'
    containerRef.current.appendChild(webglRenderer.domElement)

    // CSS Renderer
    const cssRenderer = new CSS3DRenderer()
    cssRenderer.setSize(width, height)
    cssRenderer.domElement.style.position = 'absolute'
    cssRenderer.domElement.style.top = '0'
    cssRenderer.domElement.style.zIndex = '1'
    containerRef.current.appendChild(cssRenderer.domElement)

    // Controls: TrackballControls for free flight
    const controls = new TrackballControls(camera, cssRenderer.domElement)
    controls.rotateSpeed = 1.0
    controls.zoomSpeed = 0.8
    controls.panSpeed = 0.5
    controls.minDistance = 10
    controls.maxDistance = 500
    controls.enabled = true  // Default: controls enabled (free flight)

    // Black Hole
    const bhRadius = 8.5
    const bh = new THREE.Mesh(
      new THREE.SphereGeometry(bhRadius, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    )
    bh.renderOrder = 1000
    webglScene.add(bh)

    // Dust/Accretion Disk
    const dustCount = 2000
    const dustPos = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount * 3; i += 3) {
      const angle = Math.random() * Math.PI * 2
      const radius = (Math.random() * 15 + 8)
      const y = (Math.random() - 0.5) * 3
      dustPos[i] = Math.cos(angle) * radius
      dustPos[i + 1] = y
      dustPos[i + 2] = Math.sin(angle) * radius
    }
    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
    const dustMat = new THREE.PointsMaterial({ size: 0.3, color: 0xffaa00, transparent: true, opacity: 0.6 })
    const dust = new THREE.Points(dustGeo, dustMat)
    webglScene.add(dust)

    // Store refs
    sceneRef.current = {
      camera, webglScene, cssScene, webglRenderer, cssRenderer, controls,
      activeVideoId: null as string | null,
      viewingPositions: {} as Record<string, { x: number; y: number; z: number }>,
      videoRefs: new Map<string, { container: HTMLDivElement; iframe: HTMLIFrameElement }>()
    }

    // Create video iframes positioned in orbit
    const orbitRadius = 75
    const videoScale = 0.018

    videos.forEach((v) => {
      const angle = (v.angle * Math.PI) / 180
      const pos = new THREE.Vector3(
        Math.cos(angle) * orbitRadius,
        Math.sin(angle * 3) * 6,
        Math.sin(angle) * orbitRadius
      )

      // Create container
      const container = document.createElement('div')
      container.style.width = '800px'
      container.style.height = '450px'
      container.style.background = '#000'
      container.style.border = '1px solid rgba(255,255,255,0.1)'
      container.style.cursor = 'pointer'
      container.style.display = 'none'  // Hidden by default

      // Create iframe (hidden until played)
      const iframe = document.createElement('iframe')
      iframe.src = `https://www.youtube.com/embed/${v.youtubeId}`
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      iframe.style.border = 'none'
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
      iframe.allowFullscreen = true
      iframe.style.display = 'none'
      container.appendChild(iframe)

      // CSS3D object
      const obj = new CSS3DObject(container)
      obj.position.copy(pos)
      obj.lookAt(0, 0, 0)
      obj.scale.set(videoScale, videoScale, videoScale)
      cssScene.add(obj)

      // Store refs
      sceneRef.current.videoRefs.set(v.id, { container, iframe })

      // Calculate viewing position (in front of video, looking at it)
      const dirFromOrigin = pos.clone().normalize()
      const viewingDistance = 35
      sceneRef.current.viewingPositions[v.id] = {
        x: dirFromOrigin.x * viewingDistance,
        y: dirFromOrigin.y * viewingDistance,
        z: dirFromOrigin.z * viewingDistance
      }

      // Click to play
      container.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('playVideo', { detail: { videoId: v.id } }))
      })
    })

    // Stop all videos
    const stopAllVideos = () => {
      sceneRef.current.videoRefs.forEach((ref: any) => {
        ref.container.style.display = 'none'
        ref.iframe.style.display = 'none'
      })
      sceneRef.current.activeVideoId = null
    }

    // Play specific video
    const playVideo = (videoId: string) => {
      stopAllVideos()
      const ref = sceneRef.current.videoRefs.get(videoId)
      if (ref) {
        ref.container.style.display = 'block'
        ref.iframe.style.display = 'block'
        sceneRef.current.activeVideoId = videoId
      }
    }

    // Flight to video
    const flightToVideo = (videoId: string) => {
      stopAllVideos()
      const viewPos = sceneRef.current.viewingPositions[videoId]
      if (!viewPos) return

      controls.enabled = false  // Lock controls during flight

      tweens.current.push(
        new SimpleTween(
          { x: camera.position.x, y: camera.position.y, z: camera.position.z },
          viewPos,
          1200,
          (v) => camera.position.set(v.x, v.y, v.z),
          () => {
            playVideo(videoId)  // Play video when flight completes
            onOrbitModeToggle(false)  // Notify parent that orbit mode is now OFF
          }
        )
      )
    }

    // Flight to overview
    const flightToOverview = () => {
      stopAllVideos()
      controls.enabled = true  // Enable controls for overview
      const viewPos = { x: 0, y: 50, z: 100 }

      tweens.current.push(
        new SimpleTween(
          { x: camera.position.x, y: camera.position.y, z: camera.position.z },
          viewPos,
          1200,
          (v) => camera.position.set(v.x, v.y, v.z)
        )
      )
    }

    // Event listeners
    document.addEventListener('flyTo', (e: any) => {
      const targetId = e.detail?.targetId
      if (targetId === 'overview') {
        flightToOverview()
      } else {
        flightToVideo(targetId)
      }
    })

    // Listen for orbit mode toggle
    const handleOrbitModeChange = (e: any) => {
      controls.enabled = e.detail?.enabled ?? false
    }
    document.addEventListener('orbitModeChanged', handleOrbitModeChange)

    // Animation loop
    const animate = (time: number) => {
      tweens.current = tweens.current.filter(t => t.active)
      tweens.current.forEach(t => t.update(time))

      dust.rotation.z += 0.0001  // Slowly rotate dust

      controls.update()
      webglRenderer.render(webglScene, camera)
      cssRenderer.render(cssScene, camera)
      frameRef.current = requestAnimationFrame(animate)
    }

    animate(0)

    // Handle resize
    const handleResize = () => {
      const newWidth = containerRef.current?.clientWidth ?? width
      const newHeight = containerRef.current?.clientHeight ?? height
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      webglRenderer.setSize(newWidth, newHeight)
      cssRenderer.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      document.removeEventListener('flyTo', () => {})
      document.removeEventListener('orbitModeChanged', handleOrbitModeChange)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(frameRef.current)
      webglRenderer.dispose()
      webglRenderer.domElement.remove()
      cssRenderer.domElement.remove()
    }
  }, [videos, onOrbitModeToggle])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
}

// --- Main Application UI ---
export default function OrbitalPage() {
  const [time, setTime] = useState(new Date())
  const [isTracksOpen, setIsTracksOpen] = useState(false)
  const [isPlusOpen, setIsPlusOpen] = useState(false)
  const [isOrbitMode, setIsOrbitMode] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleFlyTo = (id: string) => {
    document.dispatchEvent(new CustomEvent('flyTo', { detail: { targetId: id } }))
    setIsTracksOpen(false)
    setIsPlusOpen(false)
  }

  const handleOrbitToggle = () => {
    const newMode = !isOrbitMode
    setIsOrbitMode(newMode)
    document.dispatchEvent(new CustomEvent('orbitModeChanged', { detail: { enabled: newMode } }))
  }

  const handleOrbitModeFromScene = (enabled: boolean) => {
    setIsOrbitMode(enabled)
  }

  const navItemStyle = {
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
    userSelect: 'none' as const
  }

  const dropdownMenuStyle = {
    position: 'absolute' as const,
    top: '100%',
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    marginTop: '8px',
    minWidth: '150px',
    zIndex: 2000
  }

  const dropdownItemStyle = {
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '11px',
    color: '#FFF',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    transition: 'background 0.2s ease'
  }

  return (
    <>
      <EventHorizonScene videos={ORBITAL_VIDEOS} onOrbitModeToggle={handleOrbitModeFromScene} />

      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background: #000;
          font-family: monospace;
          overflow: hidden;
        }

        nav {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        button {
          all: unset;
          cursor: pointer;
        }

        button:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }

        @media (max-width: 768px) {
          nav {
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
          }
          nav > button {
            order: 3;
          }
        }
      `}</style>

      <nav style={{
        position: 'fixed',
        top: '25px',
        left: '25px',
        right: '25px',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: '8px',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <a href="/archive" style={{ ...navItemStyle, textDecoration: 'none' }}>
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

        <button onClick={() => handleFlyTo('overview')} style={{ ...navItemStyle, background: 'rgba(255, 165, 0, 0.1)', borderColor: 'rgba(255, 165, 0, 0.3)' }}>
          RUNWAY
        </button>

        <button
          onClick={handleOrbitToggle}
          style={{ ...navItemStyle, background: isOrbitMode ? 'rgba(100, 200, 255, 0.1)' : 'transparent', borderColor: isOrbitMode ? 'rgba(100, 200, 255, 0.3)' : 'rgba(255,255,255,0.1)' }}
        >
          {isOrbitMode ? 'ORBIT ●' : 'ORBIT'}
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setIsTracksOpen(!isTracksOpen)
                setIsPlusOpen(false)
              }}
              style={{ ...navItemStyle }}
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

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setIsPlusOpen(!isPlusOpen)
                setIsTracksOpen(false)
              }}
              style={{ ...navItemStyle }}
            >
              {isPlusOpen ? '−' : '+'}
            </button>
            {isPlusOpen && (
              <div style={{...dropdownMenuStyle, right: '0'}}>
                <a href="/archive" style={{...dropdownItemStyle as any, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>ARCHIVE</a>
                <a href="/runway" style={{...dropdownItemStyle as any, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>RUNWAY</a>
                <a href="/saturn" style={{...dropdownItemStyle as any, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>SATURN</a>
                <a href="/vault" style={{...dropdownItemStyle as any, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>VAULT</a>
                <a href="/about" style={{...dropdownItemStyle as any, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>ABOUT</a>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}
