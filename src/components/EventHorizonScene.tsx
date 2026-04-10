'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// @ts-expect-error - tween.js lacks proper types
import TWEEN from 'tween.js'

interface Video {
  id: string
  title: string
  youtubeId: string
  angle: number
}

interface EventHorizonSceneProps {
  videos: Video[]
  showTitles?: boolean
  onVideoSelect?: (videoId: string) => void
}

// Helper to get CSS variable color
function getCSSVariableColor(varName: string): number {
  const computed = getComputedStyle(document.documentElement)
  const value = computed.getPropertyValue(varName).trim()

  if (!value) return 0xFFAA55 // Fallback warm color

  // Handle hex color
  if (value.startsWith('#')) {
    return parseInt(value.substring(1), 16)
  }

  // Handle rgb/rgba
  const rgbMatch = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1])
    const g = parseInt(rgbMatch[2])
    const b = parseInt(rgbMatch[3])
    return (r << 16) | (g << 8) | b
  }

  return 0xFFAA55 // Fallback
}

export default function EventHorizonScene({ videos, showTitles = true, onVideoSelect }: EventHorizonSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    webglRenderer?: THREE.WebGLRenderer
    cssRenderer?: CSS3DRenderer
    webglScene?: THREE.Scene
    cssScene?: THREE.Scene
    camera?: THREE.PerspectiveCamera
    controls?: OrbitControls
    accretionDisks?: Array<{ mesh: THREE.Points; speed: number }>
    videoTargets?: Record<string, { camPos: THREE.Vector3; targetPos: THREE.Vector3 }>
    cssVideoObjects?: CSS3DObject[]
    animationId?: number
  }>({})

  useEffect(() => {
    if (!containerRef.current) return

    // Get dimensions with fallbacks for when layout isn't computed yet
    let width = containerRef.current.clientWidth
    let height = containerRef.current.clientHeight

    // If container has no height, try to get parent's dimensions
    if (height === 0 && containerRef.current.parentElement) {
      const rect = containerRef.current.parentElement.getBoundingClientRect()
      if (rect.height > 0) height = rect.height
    }

    // Fallback to window size if still invalid
    if (width === 0) width = window.innerWidth
    if (height === 0) height = window.innerHeight - 140

    // ─────────────────────────────────────────────────────────────────────────────
    // Setup Camera
    // ─────────────────────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
    camera.position.set(0, 30, 90)

    // ─────────────────────────────────────────────────────────────────────────────
    // Setup Scenes
    // ─────────────────────────────────────────────────────────────────────────────
    const webglScene = new THREE.Scene()
    webglScene.background = new THREE.Color(0x020101)
    webglScene.fog = new THREE.FogExp2(0x020101, 0.005)

    const cssScene = new THREE.Scene()

    // ─────────────────────────────────────────────────────────────────────────────
    // WebGL Renderer
    // ─────────────────────────────────────────────────────────────────────────────
    const webglRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    webglRenderer.setSize(width, height)
    webglRenderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(webglRenderer.domElement)

    // ─────────────────────────────────────────────────────────────────────────────
    // CSS3D Renderer
    // ─────────────────────────────────────────────────────────────────────────────
    const cssRenderer = new CSS3DRenderer()
    cssRenderer.setSize(width, height)
    const cssElement = cssRenderer.domElement
    cssElement.style.position = 'absolute'
    cssElement.style.top = '0'
    cssElement.style.left = '0'
    cssElement.style.pointerEvents = 'none'
    containerRef.current.appendChild(cssElement)

    // ─────────────────────────────────────────────────────────────────────────────
    // OrbitControls
    // ─────────────────────────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, cssElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 8
    controls.maxDistance = 150
    controls.enablePan = false

    // ─────────────────────────────────────────────────────────────────────────────
    // Scene Setup
    // ─────────────────────────────────────────────────────────────────────────────
    const accretionDisks: Array<{ mesh: THREE.Points; speed: number }> = []
    const videoTargets: Record<string, { camPos: THREE.Vector3; targetPos: THREE.Vector3 }> = {}

    // Build black hole
    buildBlackHole(webglScene, accretionDisks)

    // Build stars
    buildStars(webglScene)

    // Build video billboards
    const cssVideoObjects = buildVideoBillboards(webglScene, cssScene, videos, videoTargets)

    // Build titles in 3D space
    if (showTitles) {
      buildTitles(cssScene)
    }

    // Save overview position
    videoTargets['overview'] = {
      camPos: new THREE.Vector3(0, 30, 90),
      targetPos: new THREE.Vector3(0, 0, 0)
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Animation Loop
    // ─────────────────────────────────────────────────────────────────────────────
    let time = 0
    const animate = (currentTime: number) => {
      time = currentTime
      requestAnimationFrame(animate)

      TWEEN.update(currentTime)

      // Update video depth ordering (hide when behind black hole)
      cssVideoObjects.forEach((cssObject) => {
        // Calculate distance from camera along z-axis
        const cameraZ = camera.position.z
        const videoZ = cssObject.position.z

        // If video is significantly behind camera (and thus black hole), hide it
        // Black hole is at origin, so negative Z means behind from camera's perspective
        if (videoZ < cameraZ - 5) {
          // Behind the black hole - reduce interactivity
          cssObject.element.style.zIndex = '-1'
          cssObject.element.style.pointerEvents = 'none'
          cssObject.element.style.opacity = '0'
        } else {
          // In front - normal rendering
          cssObject.element.style.zIndex = '10'
          cssObject.element.style.pointerEvents = 'auto'
          cssObject.element.style.opacity = '1'
        }
      })

      // Spin accretion disks
      accretionDisks.forEach(diskObj => {
        diskObj.mesh.rotation.z -= diskObj.speed * 0.05
      })

      controls.update()
      webglRenderer.render(webglScene, camera)
      cssRenderer.render(cssScene, camera)
    }

    const animationId = requestAnimationFrame(animate)

    // ─────────────────────────────────────────────────────────────────────────────
    // Event Handlers
    // ─────────────────────────────────────────────────────────────────────────────
    const handleResize = () => {
      const newWidth = containerRef.current?.clientWidth || width
      const newHeight = containerRef.current?.clientHeight || height

      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      webglRenderer.setSize(newWidth, newHeight)
      cssRenderer.setSize(newWidth, newHeight)
    }

    const handleFlyTo = (event: Event) => {
      const customEvent = event as CustomEvent
      const { targetId } = customEvent.detail

      const targetData = videoTargets[targetId]
      if (!targetData) return

      new TWEEN.Tween(camera.position)
        .to({
          x: targetData.camPos.x,
          y: targetData.camPos.y,
          z: targetData.camPos.z
        }, 2500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start()

      new TWEEN.Tween(controls.target)
        .to({
          x: targetData.targetPos.x,
          y: targetData.targetPos.y,
          z: targetData.targetPos.z
        }, 2500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start()
    }

    window.addEventListener('resize', handleResize)
    document.addEventListener('flyTo', handleFlyTo)

    sceneRef.current = {
      webglRenderer,
      cssRenderer,
      webglScene,
      cssScene,
      camera,
      controls,
      accretionDisks,
      videoTargets,
      cssVideoObjects,
      animationId
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Cleanup
    // ─────────────────────────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('flyTo', handleFlyTo)

      if (animationId) cancelAnimationFrame(animationId)

      webglRenderer.dispose()
      cssRenderer.domElement.remove()
      webglRenderer.domElement.remove()
    }
  }, [videos, showTitles])

  return (
    <div
      ref={containerRef}
      data-orbital-scene
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function buildBlackHole(scene: THREE.Scene, accretionDisks: Array<{ mesh: THREE.Points; speed: number }>) {
  const bhRadius = 5.0

  // Event Horizon (pure black sphere)
  const eventHorizonGeo = new THREE.SphereGeometry(bhRadius, 64, 64)
  const eventHorizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 })
  const eventHorizon = new THREE.Mesh(eventHorizonGeo, eventHorizonMat)
  scene.add(eventHorizon)

  // Gravitational Lensing Glow
  const glowGeo = new THREE.SphereGeometry(bhRadius * 1.05, 64, 64)
  const glowMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * vec4(vPosition, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 viewDirection = normalize(-vPosition);
        float intensity = pow(0.6 - dot(vNormal, viewDirection), 3.0);
        vec3 glowColor = vec3(1.0, 0.4, 0.1) * intensity * 2.5;
        gl_FragColor = vec4(glowColor, intensity * 1.5);
      }
    `,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  })
  const glowRing = new THREE.Mesh(glowGeo, glowMat)
  scene.add(glowRing)

  // Accretion Disks (three concentric rings with different colors and speeds) - 2x scaled
  createParticleRing(scene, bhRadius * 2.4, bhRadius * 4.0, 15000, 0xffaa44, 0.04, accretionDisks)
  createParticleRing(scene, bhRadius * 3.6, bhRadius * 7.0, 20000, 0xff5511, 0.02, accretionDisks)
  createParticleRing(scene, bhRadius * 6.0, bhRadius * 12.0, 15000, 0x551111, 0.01, accretionDisks)
}

function createParticleRing(
  scene: THREE.Scene,
  innerRad: number,
  outerRad: number,
  count: number,
  colorHex: number,
  speedMult: number,
  accretionDisks: Array<{ mesh: THREE.Points; speed: number }>
) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const baseColor = new THREE.Color(colorHex)

  for (let i = 0; i < count; i++) {
    const radius = innerRad + Math.random() * (outerRad - innerRad)
    const theta = Math.random() * Math.PI * 2
    const ySpread = (Math.random() - 0.5) * (1.5 - (radius - innerRad) / (outerRad - innerRad))

    positions[i * 3] = Math.cos(theta) * radius
    positions[i * 3 + 1] = ySpread
    positions[i * 3 + 2] = Math.sin(theta) * radius

    const mixedColor = baseColor.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.2)
    colors[i * 3] = mixedColor.r
    colors[i * 3 + 1] = mixedColor.g
    colors[i * 3 + 2] = mixedColor.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.8,
    depthWrite: false
  })

  const particleSystem = new THREE.Points(geometry, material)
  particleSystem.rotation.x = -Math.PI / 3

  accretionDisks.push({ mesh: particleSystem, speed: speedMult })
  scene.add(particleSystem)
}

function buildStars(scene: THREE.Scene) {
  const starsGeo = new THREE.BufferGeometry()
  const starsCount = 4000
  const posArray = new Float32Array(starsCount * 3)

  for (let i = 0; i < starsCount; i++) {
    const r = 100 + Math.random() * 200
    const theta = Math.random() * 2 * Math.PI
    const phi = Math.acos(2 * Math.random() - 1)

    posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    posArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    posArray[i * 3 + 2] = r * Math.cos(phi)
  }

  starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
  const starsMat = new THREE.PointsMaterial({
    size: 0.8,
    color: 0xffddcc,
    transparent: true,
    opacity: 1.0
  })
  const starMesh = new THREE.Points(starsGeo, starsMat)
  scene.add(starMesh)
}

function buildVideoBillboards(
  webglScene: THREE.Scene,
  cssScene: THREE.Scene,
  videos: Video[],
  videoTargets: Record<string, { camPos: THREE.Vector3; targetPos: THREE.Vector3 }>
): CSS3DObject[] {
  const orbitRadius = 44
  const scale = 0.012
  const width = 800
  const height = 450
  const cssObjects: CSS3DObject[] = []

  videos.forEach((video) => {
    const radians = video.angle * (Math.PI / 180)
    const x = Math.cos(radians) * orbitRadius
    const z = Math.sin(radians) * orbitRadius
    const y = Math.sin(radians * 3) * 3

    const position = new THREE.Vector3(x, y, z)

    // CSS3D Element (YouTube thumbnail with play button overlay)
    const div = document.createElement('div')
    div.className = 'ag-orbital-video'
    div.style.width = '800px'
    div.style.height = '450px'
    div.style.background = '#000000'
    div.style.boxShadow = '0 0 50px rgba(255, 150, 50, 0.15)'
    div.style.borderRadius = '4px'
    div.style.position = 'relative'
    div.style.cursor = 'pointer'
    div.style.overflow = 'hidden'

    // Thumbnail image
    const img = document.createElement('img')
    img.src = `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`
    img.alt = video.title
    img.style.width = '100%'
    img.style.height = '100%'
    img.style.objectFit = 'cover'
    img.style.borderRadius = '4px'
    img.style.display = 'block'

    // Play button overlay with responsive sizing
    const playButton = document.createElement('div')
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const playSize = isMobile ? 60 : 80
    const playFontSize = isMobile ? 28 : 40

    playButton.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${playSize}px;
      height: ${playSize}px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `

    const playIcon = document.createElement('span')
    playIcon.textContent = '▶'
    playIcon.style.fontSize = `${playFontSize}px`
    playIcon.style.color = '#FF0000'
    playIcon.style.marginLeft = `${isMobile ? 2 : 6}px`

    playButton.appendChild(playIcon)

    // Play button interaction effects
    const showPlayState = () => {
      playButton.style.background = 'rgba(255, 255, 255, 1)'
      playButton.style.transform = 'translate(-50%, -50%) scale(1.1)'
      playButton.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)'
    }

    const hidePlayState = () => {
      playButton.style.background = 'rgba(255, 255, 255, 0.9)'
      playButton.style.transform = 'translate(-50%, -50%) scale(1)'
      playButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)'
    }

    playButton.addEventListener('mouseenter', showPlayState)
    playButton.addEventListener('mouseleave', hidePlayState)
    playButton.addEventListener('touchstart', showPlayState)
    playButton.addEventListener('touchend', hidePlayState)

    div.appendChild(img)
    div.appendChild(playButton)

    const cssObject = new CSS3DObject(div)
    cssObject.position.copy(position)
    cssObject.lookAt(new THREE.Vector3(0, y, 0))
    cssObject.scale.set(scale, scale, scale)
    cssScene.add(cssObject)
    cssObjects.push(cssObject)

    // Add click handlers to trigger fly-to animation
    div.addEventListener('click', (e) => {
      e.stopPropagation()
      const event = new CustomEvent('flyTo', { detail: { targetId: video.id } })
      document.dispatchEvent(event)
    })

    // Enhance hover effect for visual feedback
    div.addEventListener('mouseenter', () => {
      div.style.boxShadow = '0 0 80px rgba(255, 150, 50, 0.3)'
    })

    div.addEventListener('mouseleave', () => {
      div.style.boxShadow = '0 0 50px rgba(255, 150, 50, 0.15)'
    })

    // WebGL hole puncher
    const holeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      opacity: 0.0,
      blending: THREE.NoBlending,
      side: THREE.DoubleSide
    })
    const holeGeometry = new THREE.PlaneGeometry(width * scale, height * scale)
    const holeMesh = new THREE.Mesh(holeGeometry, holeMaterial)
    holeMesh.position.copy(cssObject.position)
    holeMesh.rotation.copy(cssObject.rotation)
    webglScene.add(holeMesh)

    // Glowing Frame
    const frameGeo = new THREE.EdgesGeometry(
      new THREE.PlaneGeometry((width * scale) + 0.5, (height * scale) + 0.5)
    )
    const frameMat = new THREE.LineBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.8
    })
    const frameMesh = new THREE.LineSegments(frameGeo, frameMat)
    frameMesh.position.copy(cssObject.position)
    frameMesh.rotation.copy(cssObject.rotation)
    webglScene.add(frameMesh)

    // Camera position for this video
    const offsetDistance = 14
    const normal = new THREE.Vector3(0, 0, 1).applyEuler(cssObject.rotation)
    const camPos = position.clone().add(normal.multiplyScalar(offsetDistance))
    camPos.y += 2

    videoTargets[video.id] = {
      camPos,
      targetPos: position.clone()
    }
  })

  return cssObjects
}

function buildTitles(cssScene: THREE.Scene) {
  // Site Title ("The Atlanta Gleaner")
  const siteTitleDiv = document.createElement('div')
  siteTitleDiv.style.cssText = `
    font-family: 'IBM Plex Mono', monospace;
    font-size: 20px;
    font-weight: 400;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #EEEDEB;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(8px);
    padding: 12px 28px;
    text-shadow: 0 0 20px rgba(238, 237, 235, 0.5);
    border: 1px solid rgba(238, 237, 235, 0.1);
    border-radius: 8px;
    white-space: nowrap;
    opacity: 0.8;
  `
  siteTitleDiv.textContent = 'The Atlanta Gleaner'

  const siteTitle = new CSS3DObject(siteTitleDiv)
  siteTitle.position.set(0, 25, 30)
  siteTitle.scale.set(0.012, 0.012, 0.012)
  cssScene.add(siteTitle)

  // Credit Line ("EDITED BY GEORGE WASHINGTON")
  const creditDiv = document.createElement('div')
  creditDiv.style.cssText = `
    font-family: 'IBM Plex Mono', monospace;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #EEEDEB;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(6px);
    padding: 8px 20px;
    text-shadow: 0 0 15px rgba(238, 237, 235, 0.3);
    border: 1px solid rgba(238, 237, 235, 0.08);
    border-radius: 6px;
    white-space: nowrap;
    opacity: 0.6;
    font-style: italic;
  `
  creditDiv.textContent = 'Edited by George Washington'

  const credit = new CSS3DObject(creditDiv)
  credit.position.set(0, 20, 30)
  credit.scale.set(0.012, 0.012, 0.012)
  cssScene.add(credit)

  // Page Title ("Orbital")
  const pageTitleDiv = document.createElement('div')
  pageTitleDiv.style.cssText = `
    font-family: 'IBM Plex Mono', monospace;
    font-size: 36px;
    font-weight: 400;
    letter-spacing: 0.20em;
    text-transform: uppercase;
    color: #EEEDEB;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(10px);
    padding: 16px 40px;
    text-shadow: 0 0 30px rgba(238, 237, 235, 0.6);
    border: 1px solid rgba(238, 237, 235, 0.15);
    border-radius: 10px;
    white-space: nowrap;
  `
  pageTitleDiv.textContent = 'Orbital'

  const pageTitle = new CSS3DObject(pageTitleDiv)
  pageTitle.position.set(0, 12, 35)
  pageTitle.scale.set(0.012, 0.012, 0.012)
  cssScene.add(pageTitle)
}
