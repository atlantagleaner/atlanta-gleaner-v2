'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// --- Video Data (kept for navbar structure) ---
const ORBITAL_VIDEOS = [
  { id: 'v0', youtubeId: '-l6wrTvMcbY', angle: 0, title: 'Video 01' },
  { id: 'v1', youtubeId: 'jtTjzDTpx8o', angle: 60, title: 'Video 02' },
  { id: 'v2', youtubeId: 'Tg9cN2A7-cA', angle: 120, title: 'Video 03' },
  { id: 'v3', youtubeId: '_GT9SmA1vlI', angle: 180, title: 'Video 04' },
  { id: 'v4', youtubeId: '-W20dfeNCmI', angle: 240, title: 'Video 05' },
  { id: 'v5', youtubeId: '9Y4wk-J3x7w', angle: 300, title: 'Video 06' }
]

// --- 3D Scene Component ---
function EventHorizonScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!containerRef.current) return
    const width = containerRef.current.clientWidth, height = containerRef.current.clientHeight

    // 1. Scene & Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
    camera.position.set(0, 50, 75)
    const webglScene = new THREE.Scene()
    const cssScene = new THREE.Scene()

    // 2. WebGL Renderer
    const webglRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    webglRenderer.setSize(width, height)
    webglRenderer.setPixelRatio(window.devicePixelRatio)
    webglRenderer.domElement.style.position = 'absolute'
    webglRenderer.domElement.style.top = '0'
    webglRenderer.domElement.style.zIndex = '5'
    webglRenderer.domElement.style.pointerEvents = 'none'
    webglRenderer.domElement.style.opacity = '1'
    webglRenderer.domElement.style.transition = 'opacity 0.3s ease'
    containerRef.current.appendChild(webglRenderer.domElement)

    // 3. CSS Renderer
    const cssRenderer = new CSS3DRenderer()
    cssRenderer.setSize(width, height)
    cssRenderer.domElement.style.position = 'absolute'
    cssRenderer.domElement.style.top = '0'
    cssRenderer.domElement.style.zIndex = '1'
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
      pts.renderOrder = 5
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

    // Animation loop
    const animate = (time: number) => {
      accretionDisks.forEach(d => { d.mesh.rotation.z -= d.speed * 0.05 })
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
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(frameRef.current)
      webglRenderer.dispose()
      webglRenderer.domElement.remove()
      cssRenderer.domElement.remove()
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
}

// --- Main Application UI ---
export default function OrbitalPage() {
  const [time, setTime] = useState(new Date())
  const [isTracksOpen, setIsTracksOpen] = useState(false)
  const [isPlusOpen, setIsPlusOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleFlyTo = (id: string) => {
    // Placeholder for future functionality
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

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#020101', overflow: 'hidden', position: 'relative' }}>
      {/* Translucent Saturn-Style Navbar */}
      {isMobile ? (
        // Mobile navbar - centered, stacked in two rows
        <nav style={{
          position: 'fixed', top: '15px', left: '15px', right: '15px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1000,
        }}>
          {/* Row 1: Date/Time + Atlanta Gleaner */}
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

          {/* Row 2: Runway, Tracks, Plus buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => handleFlyTo('overview')} style={{ ...navItemStyle, background: 'rgba(255, 165, 0, 0.1)', borderColor: 'rgba(255, 165, 0, 0.3)' }}>
              RUNWAY
            </button>

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
      ) : (
        // Desktop navbar - original layout
        <nav style={{
          position: 'fixed', top: '25px', left: '25px', right: '25px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000,
        }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {/* Date/Time Link + Title */}
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

            <button onClick={() => handleFlyTo('overview')} style={{ ...navItemStyle, background: 'rgba(255, 165, 0, 0.1)', borderColor: 'rgba(255, 165, 0, 0.3)' }}>
              RUNWAY
            </button>
          </div>

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
      )}

      {/* 3D Scene Container */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        <EventHorizonScene />
      </div>

      {/* Aesthetic Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6,
        background: 'radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.6) 100%)'
      }} />
    </div>
  )
}
