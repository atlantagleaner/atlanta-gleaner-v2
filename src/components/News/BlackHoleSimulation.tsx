'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface BlackHoleSimulationProps {
  controlsEnabled?: boolean
  onSceneReady?: (camera: THREE.PerspectiveCamera) => void
}

export function BlackHoleSimulation({
  controlsEnabled = true,
  onSceneReady,
}: BlackHoleSimulationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)
  const controlsRef = useRef<OrbitControls | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
    camera.position.set(0, 50, 75)

    const webglScene = new THREE.Scene()
    const cssScene = new THREE.Scene()

    const webglRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    webglRenderer.setSize(width, height)
    webglRenderer.setPixelRatio(window.devicePixelRatio)
    webglRenderer.domElement.style.position = 'absolute'
    webglRenderer.domElement.style.top = '0'
    webglRenderer.domElement.style.zIndex = '5'
    webglRenderer.domElement.style.pointerEvents = 'none'
    containerRef.current.appendChild(webglRenderer.domElement)

    const cssRenderer = new CSS3DRenderer()
    cssRenderer.setSize(width, height)
    cssRenderer.domElement.style.position = 'absolute'
    cssRenderer.domElement.style.top = '0'
    cssRenderer.domElement.style.zIndex = '1'
    containerRef.current.appendChild(cssRenderer.domElement)

    const controls = new OrbitControls(camera, cssRenderer.domElement)
    controls.enableDamping = true
    controls.enabled = controlsEnabled
    controlsRef.current = controls

    onSceneReady?.(camera)

    const bhRadius = 8.5
    const bh = new THREE.Mesh(
      new THREE.SphereGeometry(bhRadius, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x000000 }),
    )
    bh.renderOrder = 1000
    webglScene.add(bh)

    const accretionDisks: Array<{ mesh: THREE.Points; speed: number }> = []
    const addRing = (inner: number, outer: number, count: number, color: number, speed: number) => {
      const geo = new THREE.BufferGeometry()
      const pos = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const r = inner + Math.random() * (outer - inner)
        const theta = Math.random() * Math.PI * 2
        pos[i * 3] = Math.cos(theta) * r
        pos[i * 3 + 1] = (Math.random() - 0.5) * 2
        pos[i * 3 + 2] = Math.sin(theta) * r
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const mat = new THREE.PointsMaterial({
        size: 0.18,
        color,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      })
      const pts = new THREE.Points(geo, mat)
      pts.rotation.x = -Math.PI / 3.5
      pts.renderOrder = 5
      accretionDisks.push({ mesh: pts, speed })
      webglScene.add(pts)
    }

    addRing(bhRadius * 2, bhRadius * 5, 12000, 0xffa500, 0.035)
    addRing(bhRadius * 4, bhRadius * 8.5, 15000, 0xff4500, 0.015)

    const starGeo = new THREE.BufferGeometry()
    const starPos = new Float32Array(3000 * 3)
    for (let i = 0; i < 3000; i++) {
      const r = 400 + Math.random() * 400
      const t = Math.random() * 2 * Math.PI
      const p = Math.acos(2 * Math.random() - 1)
      starPos[i * 3] = r * Math.sin(p) * Math.cos(t)
      starPos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t)
      starPos[i * 3 + 2] = r * Math.cos(p)
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    webglScene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ size: 1.0, color: 0xffffff, transparent: true, opacity: 0.4 }),
      ),
    )

    const animate = () => {
      accretionDisks.forEach((disk) => {
        disk.mesh.rotation.z -= disk.speed * 0.05
      })
      controls.update()
      webglRenderer.render(webglScene, camera)
      cssRenderer.render(cssScene, camera)
      frameRef.current = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      const newWidth = containerRef.current?.clientWidth ?? width
      const newHeight = containerRef.current?.clientHeight ?? height
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      webglRenderer.setSize(newWidth, newHeight)
      cssRenderer.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(frameRef.current)
      controls.dispose()
      webglRenderer.dispose()
      webglRenderer.domElement.remove()
      cssRenderer.domElement.remove()
    }
  }, [])

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = controlsEnabled
    }
  }, [controlsEnabled])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
}
