'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface SaturnSceneProps {
  onSceneReady?: (camera: THREE.PerspectiveCamera) => void
  isInteractive?: boolean
  isMobile?: boolean
}

const JWST_DATA = {
  darkBand: '#3b2518',
  midBand: '#8a6544',
  brightEquator: '#c99e71',
  ringGlow: '#b8e1f0',
  spaceBackground: '#010102'
}

export default function SaturnScene({ onSceneReady, isInteractive = true, isMobile = false }: SaturnSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)
  const controlsRef = useRef<OrbitControls | null>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
    planetMesh?: THREE.Mesh
    ringParticles?: THREE.Points
    planetGroup?: THREE.Group
  } | null>(null)

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = isInteractive
    }
  }, [isInteractive])

  useEffect(() => {
    if (!containerRef.current) return
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    // 1. Scene & Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 2000)
    camera.position.set(0, 18, 65)
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(JWST_DATA.spaceBackground)

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.zIndex = '5'
    renderer.domElement.style.pointerEvents = 'none'
    containerRef.current.appendChild(renderer.domElement)

    // 3. Create invisible control layer for OrbitControls
    const controlLayer = document.createElement('div')
    controlLayer.style.position = 'absolute'
    controlLayer.style.top = '0'
    controlLayer.style.left = '0'
    controlLayer.style.right = '0'
    controlLayer.style.bottom = '0'
    controlLayer.style.zIndex = '4'
    controlLayer.style.pointerEvents = 'auto'
    containerRef.current.appendChild(controlLayer)

    // 4. Controls
    const controls = new OrbitControls(camera, controlLayer)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 12
    controls.maxDistance = 200
    controls.enabled = isInteractive
    controlsRef.current = controls
    sceneRef.current = { scene, camera, renderer, controls }

    // Expose camera to parent
    onSceneReady?.(camera)

    // 5. Scientific Lighting (Sunlight is mostly absorbed by the planet in JWST views)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.5)
    sunLight.position.set(40, 15, 20)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    scene.add(sunLight)

    // 6. Build Saturn
    function createScientificTexture() {
      const width = 2048
      const height = 1024
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!

      // Methane absorption layering
      const grad = ctx.createLinearGradient(0, 0, 0, height)
      grad.addColorStop(0.0, '#2b211a') // Dark pole
      grad.addColorStop(0.25, JWST_DATA.darkBand)
      grad.addColorStop(0.45, JWST_DATA.midBand)
      grad.addColorStop(0.5, JWST_DATA.brightEquator)
      grad.addColorStop(0.55, JWST_DATA.midBand)
      grad.addColorStop(0.75, JWST_DATA.darkBand)
      grad.addColorStop(1.0, '#2b211a')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      // Turbulent Atmospheric Detail (Micro-banding)
      for (let i = 0; i < 6000; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.03})`
        ctx.fillRect(0, Math.random() * height, width, 1 + Math.random())
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.05})`
        ctx.fillRect(0, Math.random() * height, width, 1 + Math.random())
      }

      // North Pole Hexagon Detail (JWST reveals the dark center clearly)
      const poleR = height * 0.06
      ctx.beginPath()
      ctx.fillStyle = 'rgba(20, 15, 10, 0.5)'
      for (let x = 0; x <= width; x += 2) {
        const theta = (x / width) * Math.PI * 2
        const sector = Math.PI / 3
        const hexRadius = poleR * (Math.cos(Math.PI / 6) / Math.cos((theta % sector) - Math.PI / 6))
        ctx.lineTo(x, hexRadius)
      }
      ctx.lineTo(width, 0)
      ctx.lineTo(0, 0)
      ctx.fill()

      return new THREE.CanvasTexture(canvas)
    }

    const planetGroup = new THREE.Group()

    // Planet Geometry
    const planetRadius = 6.5
    const planetGeo = new THREE.SphereGeometry(planetRadius, 128, 128)
    const planetMat = new THREE.MeshStandardMaterial({
      map: createScientificTexture(),
      roughness: 0.95,
      metalness: 0.0
    })
    const planetMesh = new THREE.Mesh(planetGeo, planetMat)
    planetMesh.scale.set(1, 0.9, 1) // Real Saturn is flattened at the poles
    planetMesh.castShadow = true
    planetMesh.receiveShadow = true
    planetGroup.add(planetMesh)

    // Ring System using particles (optimized for mobile)
    const particleCount = isMobile ? 8000 : 22000
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    const ringColor = new THREE.Color(JWST_DATA.ringGlow)
    const innerR = planetRadius * 1.25
    const outerR = planetRadius * 2.35

    let particleIndex = 0
    for (let i = 0; i < particleCount; i++) {
      const r = innerR + Math.random() * (outerR - innerR)
      const theta = Math.random() * Math.PI * 2

      // Density Filter (Scientific Gap Alignment)
      const normR = (r - innerR) / (outerR - innerR)
      let density = 1.0

      // C Ring (Inner, Faint)
      if (normR < 0.15) density = 0.2
      // B Ring (Main, Dense)
      else if (normR < 0.6) density = 0.95
      // Cassini Division
      else if (normR < 0.68) density = 0.02
      // A Ring (Outer)
      else if (normR < 0.9) density = 0.6
      // Encke Gap
      else if (normR < 0.92) density = 0.05
      // Keeler Gap / Outer Fringe
      else density = 0.2

      if (Math.random() > density) {
        i--
        continue
      }

      positions[particleIndex * 3] = Math.cos(theta) * r
      positions[particleIndex * 3 + 1] = (Math.random() - 0.5) * 0.08
      positions[particleIndex * 3 + 2] = Math.sin(theta) * r

      // Color varies with density
      const intensity = 0.7 + density * 0.3
      colors[particleIndex * 3] = ringColor.r * intensity
      colors[particleIndex * 3 + 1] = ringColor.g * intensity
      colors[particleIndex * 3 + 2] = ringColor.b * intensity

      sizes[particleIndex] = 0.05 + Math.random() * 0.15
      particleIndex++
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    })

    const ringParticles = new THREE.Points(geometry, particleMat)
    planetGroup.add(ringParticles)

    // True Axial Tilt (26.73 degrees)
    planetGroup.rotation.z = (26.73 * Math.PI) / 180
    scene.add(planetGroup)

    // 7. Starfield (JWST views often show distant galaxies) - optimized for mobile
    const count = isMobile ? 500 : 1500
    const starGeo = new THREE.BufferGeometry()
    const starPos = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) {
      starPos[i] = (Math.random() - 0.5) * 600
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({
      size: 0.5,
      color: 0xffffff,
      transparent: true,
      opacity: 0.3
    })
    scene.add(new THREE.Points(starGeo, starMat))

    if (sceneRef.current) {
      sceneRef.current.planetMesh = planetMesh
      sceneRef.current.ringParticles = ringParticles
      sceneRef.current.planetGroup = planetGroup
    }

    // Animation loop
    const animate = () => {
      if (planetMesh) planetMesh.rotation.y += 0.0015
      if (ringParticles) ringParticles.rotation.y += 0.0004
      if (planetGroup) planetGroup.rotation.y += 0.0001
      controls.update()
      renderer.render(scene, camera)
      frameRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      const newWidth = containerRef.current?.clientWidth ?? width
      const newHeight = containerRef.current?.clientHeight ?? height
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(frameRef.current)
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])


  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
}
