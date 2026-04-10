'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// --- Constants & Data Types ---

export interface OrbitalVideo {
  id: string
  title: string
  youtubeId: string
  angle: number
}

// --- Utility: Simple Tween Engine ---

class SimpleTween {
  private startValues: any
  private endValues: any
  private duration: number
  private startTime: number
  private onUpdate: (values: any) => void
  private easing: (t: number) => number
  public active: boolean = true

  constructor(start: any, end: any, duration: number, onUpdate: (v: any) => void) {
    this.startValues = { ...start }
    this.endValues = { ...end }
    this.duration = duration
    this.startTime = performance.now()
    this.onUpdate = onUpdate
    this.easing = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  update(now: number) {
    if (!this.active) return
    const elapsed = now - this.startTime
    const progress = Math.min(elapsed / this.duration, 1)
    const eased = this.easing(progress)

    const current: any = {}
    for (const key in this.startValues) {
      current[key] = this.startValues[key] + (this.endValues[key] - this.startValues[key]) * eased
    }
    this.onUpdate(current)

    if (progress === 1) this.active = false
  }
}

// --- Component: EventHorizonScene ---

interface EventHorizonSceneProps {
  videos: OrbitalVideo[]
}

export default function EventHorizonScene({ videos }: EventHorizonSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tweens = useRef<SimpleTween[]>([])
  const sceneRef = useRef<{
    webglRenderer?: THREE.WebGLRenderer
    cssRenderer?: CSS3DRenderer
    webglScene?: THREE.Scene
    cssScene?: THREE.Scene
    camera?: THREE.PerspectiveCamera
    controls?: OrbitControls
    animationId?: number
  }>({})

  useEffect(() => {
    if (!containerRef.current) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
    camera.position.set(0, 50, 120)
    sceneRef.current.camera = camera

    const webglScene = new THREE.Scene()
    const cssScene = new THREE.Scene()

    const webglRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    webglRenderer.setSize(width, height)
    webglRenderer.setPixelRatio(window.devicePixelRatio)
    webglRenderer.domElement.style.position = 'absolute'
    webglRenderer.domElement.style.top = '0'
    webglRenderer.domElement.style.zIndex = '2'
    webglRenderer.domElement.style.pointerEvents = 'none' // CRITICAL: Allow clicks to pass to CSS renderer
    containerRef.current.appendChild(webglRenderer.domElement)

    const cssRenderer = new CSS3DRenderer()
    cssRenderer.setSize(width, height)
    cssRenderer.domElement.style.position = 'absolute'
    cssRenderer.domElement.style.top = '0'
    cssRenderer.domElement.style.zIndex = '1'
    cssRenderer.domElement.style.pointerEvents = 'auto' // CRITICAL: Accept clicks
    containerRef.current.appendChild(cssRenderer.domElement)

    const controls = new OrbitControls(camera, cssRenderer.domElement)
    controls.enableDamping = true
    controls.minDistance = 15
    controls.maxDistance = 500

    const accretionDisks: any[] = []
    const targets: any = {}

    // Build Black Hole
    const bhRadius = 7.0
    const bh = new THREE.Mesh(
      new THREE.SphereGeometry(bhRadius, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    )
    bh.renderOrder = 100
    webglScene.add(bh)

    const createRing = (inner: number, outer: number, count: number, color: number, speed: number) => {
      const geo = new THREE.BufferGeometry()
      const pos = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const r = inner + Math.random() * (outer - inner)
        const theta = Math.random() * Math.PI * 2
        pos[i*3] = Math.cos(theta) * r
        pos[i*3+1] = (Math.random() - 0.5) * 1.8
        pos[i*3+2] = Math.sin(theta) * r
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const mat = new THREE.PointsMaterial({ size: 0.15, color, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending })
      const points = new THREE.Points(geo, mat)
      points.rotation.x = -Math.PI / 3.2
      accretionDisks.push({ mesh: points, speed })
      webglScene.add(points)
    }
    createRing(bhRadius * 2, bhRadius * 5, 15000, 0xff9944, 0.04)
    createRing(bhRadius * 4, bhRadius * 10, 20000, 0xee4411, 0.02)

    // Build Stars
    const starGeo = new THREE.BufferGeometry()
    const starPos = new Float32Array(5000 * 3)
    for (let i = 0; i < 5000; i++) {
      const r = 400 + Math.random() * 400
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      starPos[i*3] = r * Math.sin(phi) * Math.cos(theta)
      starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      starPos[i*3+2] = r * Math.cos(phi)
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    webglScene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.8, color: 0xffffff, transparent: true, opacity: 0.4 })))

    // Build Video Billboards
    const orbitRadius = 70
    const videoScale = 0.018
    videos.forEach((video) => {
      const rad = (video.angle * Math.PI) / 180
      const pos = new THREE.Vector3(Math.cos(rad) * orbitRadius, Math.sin(rad * 2.5) * 6, Math.sin(rad) * orbitRadius)

      const div = document.createElement('div')
      div.style.width = '800px'
      div.style.height = '450px'
      div.style.background = '#000'
      div.style.border = '1px solid rgba(255,255,255,0.1)'
      div.style.cursor = 'pointer'
      div.style.pointerEvents = 'auto'
      div.style.boxShadow = '0 0 40px rgba(0,0,0,0.8)'

      const img = document.createElement('img')
      img.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`
      img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'cover'; img.style.opacity = '0.9'
      div.appendChild(img)

      const playIcon = document.createElement('div')
      playIcon.innerHTML = '▶'
      playIcon.style.position = 'absolute'; playIcon.style.top = '50%'; playIcon.style.left = '50%'; playIcon.style.transform = 'translate(-50%,-50%)'
      playIcon.style.fontSize = '80px'; playIcon.style.color = '#fff'; playIcon.style.textShadow = '0 0 20px rgba(0,0,0,1)'
      div.appendChild(playIcon)

      const obj = new CSS3DObject(div)
      obj.position.copy(pos)
      obj.lookAt(0, 0, 0)
      obj.scale.set(videoScale, videoScale, videoScale)
      cssScene.add(obj)

      // The Occlusion Mesh
      const mask = new THREE.Mesh(
        new THREE.PlaneGeometry(800 * videoScale, 450 * videoScale),
        new THREE.MeshBasicMaterial({ color: 0x000000, colorWrite: false, depthWrite: true })
      )
      mask.position.copy(pos)
      mask.rotation.copy(obj.rotation)
      webglScene.add(mask)

      // CRITICAL: Better event listener for interactivity
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        document.dispatchEvent(new CustomEvent('flyTo', { detail: { targetId: video.id } }))
      })

      // Fix Camera Placement: Offset should be subtracted from pos to be BETWEEN origin and video
      // then facing the black hole (origin)
      const camOffset = pos.clone().normalize().multiplyScalar(22)
      targets[video.id] = { 
        camPos: { x: pos.x - camOffset.x, y: pos.y + 2, z: pos.z - camOffset.z }, 
        targetPos: { x: pos.x, y: pos.y, z: pos.z } 
      }
    })

    targets['overview'] = { camPos: { x: 0, y: 50, z: 120 }, targetPos: { x: 0, y: 0, z: 0 } }

    const animate = (time: number) => {
      tweens.current = tweens.current.filter(t => t.active)
      tweens.current.forEach(t => t.update(time))
      accretionDisks.forEach(d => { d.mesh.rotation.z -= d.speed * 0.05 })
      controls.update()
      webglRenderer.render(webglScene, camera)
      cssRenderer.render(cssScene, camera)
      sceneRef.current.animationId = requestAnimationFrame(animate)
    }
    sceneRef.current.animationId = requestAnimationFrame(animate)

    const handleFly = (e: any) => {
      const data = targets[e.detail?.targetId]
      if (!data) return
      tweens.current.push(new SimpleTween({ x: camera.position.x, y: camera.position.y, z: camera.position.z }, data.camPos, 1500, (v) => camera.position.set(v.x, v.y, v.z)))
      tweens.current.push(new SimpleTween({ x: controls.target.x, y: controls.target.y, z: controls.target.z }, data.targetPos, 1500, (v) => controls.target.set(v.x, v.y, v.z)))
    }
    document.addEventListener('flyTo', handleFly)

    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      webglRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      cssRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('flyTo', handleFly)
      window.removeEventListener('resize', handleResize)
      if (sceneRef.current.animationId) cancelAnimationFrame(sceneRef.current.animationId)
      webglRenderer.dispose()
      if (cssRenderer.domElement.parentNode) cssRenderer.domElement.remove()
      if (webglRenderer.domElement.parentNode) webglRenderer.domElement.remove()
    }
  }, [videos])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }} />
}
