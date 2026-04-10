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

export default function EventHorizonScene({ videos }: EventHorizonSceneProps) {
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
    animationId?: number
  }>({})

  useEffect(() => {
    if (!containerRef.current) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    // ─────────────────────────────────────────────────────────────────────────────
    // Setup Camera
    // ─────────────────────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
    camera.position.set(0, 15, 45)

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
    buildVideoBillboards(webglScene, cssScene, videos, videoTargets)

    // Save overview position
    videoTargets['overview'] = {
      camPos: new THREE.Vector3(0, 15, 45),
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
  }, [videos])

  return (
    <div
      ref={containerRef}
      data-orbital-scene
      style={{
        width: '100%',
        height: '100%',
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

  // Accretion Disks (three concentric rings with different colors and speeds)
  createParticleRing(scene, bhRadius * 1.2, bhRadius * 2.0, 15000, 0xffaa44, 0.04, accretionDisks)
  createParticleRing(scene, bhRadius * 1.8, bhRadius * 3.5, 20000, 0xff5511, 0.02, accretionDisks)
  createParticleRing(scene, bhRadius * 3.0, bhRadius * 6.0, 15000, 0x551111, 0.01, accretionDisks)
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
    size: 0.3,
    color: 0xffddcc,
    transparent: true,
    opacity: 0.8
  })
  const starMesh = new THREE.Points(starsGeo, starsMat)
  scene.add(starMesh)
}

function buildVideoBillboards(
  webglScene: THREE.Scene,
  cssScene: THREE.Scene,
  videos: Video[],
  videoTargets: Record<string, { camPos: THREE.Vector3; targetPos: THREE.Vector3 }>
) {
  const orbitRadius = 22
  const scale = 0.012
  const width = 800
  const height = 450

  videos.forEach((video) => {
    const radians = video.angle * (Math.PI / 180)
    const x = Math.cos(radians) * orbitRadius
    const z = Math.sin(radians) * orbitRadius
    const y = Math.sin(radians * 3) * 3

    const position = new THREE.Vector3(x, y, z)

    // CSS3D Element (YouTube iframe)
    const div = document.createElement('div')
    div.className = 'ag-orbital-video'
    div.style.width = '800px'
    div.style.height = '450px'
    div.style.background = '#000000'
    div.style.boxShadow = '0 0 50px rgba(255, 150, 50, 0.15)'
    div.style.borderRadius = '4px'

    const iframe = document.createElement('iframe')
    iframe.src = `https://www.youtube.com/embed/${video.youtubeId}?rel=0`
    iframe.title = video.title
    iframe.setAttribute('allowfullscreen', '')
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture')
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.border = 'none'
    iframe.style.borderRadius = '4px'

    div.appendChild(iframe)

    const cssObject = new CSS3DObject(div)
    cssObject.position.copy(position)
    cssObject.lookAt(new THREE.Vector3(0, y, 0))
    cssObject.scale.set(scale, scale, scale)
    cssScene.add(cssObject)

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
}
