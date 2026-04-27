'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { flightHUD, flightInput, queueFlightMessage, resetFlightInput } from './flightInput'

export interface FlightSceneProps {
  isMobile?: boolean
}

const THRUST_ACC = 0.03
const REVERSE_ACC = 0.043
const MAX_SPEED = 2.2
const MAX_REVERSE_SPEED = 1.15
const WARP_MULT = 22
const ROTATE_RATE = 0.028
const PITCH_RATE = 0.02
const PITCH_LIMIT = Math.PI / 2 - 0.05
const SHIP_COLLISION_RADIUS = 1.3

const FOV_NORMAL = 60
const FOV_WARP = 78
const STAR_SIZE_NORMAL = 0.9
const STAR_SIZE_WARP = 3.5
const CRASH_DURATION_MS = 1150

function mulberry32(seed: number) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface BodyInfo {
  name: string
  root: THREE.Object3D
  core: THREE.Mesh
  glow: THREE.Mesh
  radius: number
  baseScale: number
  approachRange: number
  baseGlowOpacity: number
}

interface RingHazard {
  name: string
  ring: THREE.Mesh
  inner: number
  outer: number
  thickness: number
}

export default function FlightScene({ isMobile = false }: FlightSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#000008')
    scene.fog = new THREE.Fog(0x000010, 1800, 4500)

    const camera = new THREE.PerspectiveCamera(FOV_NORMAL, width / height, 0.1, 8000)

    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      powerPreference: 'high-performance',
      alpha: false,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.2 : 1.5))
    renderer.setSize(width, height)
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.left = '0'
    renderer.domElement.style.zIndex = '5'
    renderer.domElement.style.pointerEvents = 'none'
    renderer.domElement.style.transition = 'filter 0.18s ease'
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0x20263c, 0.48))
    const sunLight = new THREE.PointLight(0xffeecc, 2.5, 4500, 1.1)
    sunLight.position.set(0, 0, 0)
    scene.add(sunLight)
    const fillLight = new THREE.DirectionalLight(0x4a689b, 0.28)
    fillLight.position.set(1, 0.45, 0.28)
    scene.add(fillLight)

    const namedBodies: BodyInfo[] = []
    const ringHazards: RingHazard[] = []
    const planetSeg = isMobile ? 14 : 20
    const tmpBodyPos = new THREE.Vector3()

    function makeGlowShell(radius: number, color: number, opacity: number) {
      return new THREE.Mesh(
        new THREE.SphereGeometry(radius, planetSeg, planetSeg),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity,
          side: THREE.BackSide,
          depthWrite: false,
        })
      )
    }

    function registerBody(
      name: string,
      root: THREE.Object3D,
      core: THREE.Mesh,
      glow: THREE.Mesh,
      radius: number,
      approachRange: number,
      baseScale = 1,
      baseGlowOpacity = 0
    ) {
      const body: BodyInfo = { name, root, core, glow, radius, baseScale, approachRange, baseGlowOpacity }
      root.scale.setScalar(baseScale)
      namedBodies.push(body)
      return body
    }

    function makePlanet(opts: {
      name: string
      x: number
      radius: number
      color: number
      emissive?: number
      emissiveIntensity?: number
      shininess?: number
      glowColor?: number
      glowOpacity?: number
      atmosphereScale?: number
      approachRange?: number
    }) {
      const {
        name,
        x,
        radius,
        color,
        emissive = 0x000000,
        emissiveIntensity = 0,
        shininess = 20,
        glowColor = color,
        glowOpacity = 0.05,
        atmosphereScale = 1.18,
        approachRange = 210,
      } = opts

      const root = new THREE.Group()
      root.position.set(x, 0, 0)
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(radius, planetSeg, planetSeg),
        new THREE.MeshPhongMaterial({
          color,
          emissive,
          emissiveIntensity,
          shininess,
          flatShading: false,
        })
      )
      const glow = makeGlowShell(radius * atmosphereScale, glowColor, glowOpacity)
      root.add(core)
      root.add(glow)
      scene.add(root)
      return registerBody(name, root, core, glow, radius, approachRange, 1, glowOpacity)
    }

    const sunRoot = new THREE.Group()
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(8, planetSeg, planetSeg),
      new THREE.MeshBasicMaterial({ color: 0xfff2a8 })
    )
    const corona = makeGlowShell(10.8, 0xffd88a, 0.18)
    sunRoot.add(sun)
    sunRoot.add(corona)
    scene.add(sunRoot)
    const sunBody = registerBody('SUN', sunRoot, sun, corona, 8, 320, 1, 0.18)

    makePlanet({ name: 'MERCURY', x: 120, radius: 1.0, color: 0x999999, shininess: 5, glowOpacity: 0.02, approachRange: 120 })
    makePlanet({
      name: 'VENUS',
      x: 200,
      radius: 2.5,
      color: 0xe8c878,
      emissive: 0x442a10,
      emissiveIntensity: 0.4,
      glowColor: 0xf7d89a,
      glowOpacity: 0.06,
      approachRange: 160,
    })

    const earthRoot = new THREE.Group()
    earthRoot.position.set(280, 0, 0)
    const earthCore = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, planetSeg, planetSeg),
      new THREE.MeshPhongMaterial({
        color: 0x3370cc,
        emissive: 0x113355,
        emissiveIntensity: 0.25,
        shininess: 24,
      })
    )
    const earthGlow = makeGlowShell(3.3, 0x7ddcff, 0.08)
    earthRoot.add(earthCore)
    earthRoot.add(earthGlow)
    const continents = new THREE.Mesh(
      new THREE.SphereGeometry(2.82, planetSeg, planetSeg),
      new THREE.MeshPhongMaterial({
        color: 0x336633,
        transparent: true,
        opacity: 0.72,
        emissive: 0x112211,
        emissiveIntensity: 0.3,
      })
    )
    const earthPos = continents.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < earthPos.count; i++) {
      const x = earthPos.getX(i)
      const y = earthPos.getY(i)
      const z = earthPos.getZ(i)
      const n = Math.sin(x * 1.3) * Math.cos(y * 1.7) + Math.sin(z * 2.1)
      if (n <= 0.2) earthPos.setXYZ(i, x * 0.92, y * 0.92, z * 0.92)
    }
    earthPos.needsUpdate = true
    earthRoot.add(continents)
    scene.add(earthRoot)
    const earthBody = registerBody('EARTH', earthRoot, earthCore, earthGlow, 2.8, 180, 1, 0.08)

    makePlanet({
      name: 'MARS',
      x: 400,
      radius: 2.0,
      color: 0xbb4422,
      emissive: 0x331100,
      emissiveIntensity: 0.3,
      glowColor: 0xff8a61,
      glowOpacity: 0.05,
      approachRange: 150,
    })

    {
      const radius = 7
      const root = new THREE.Group()
      root.position.set(620, 0, 0)
      const geo = new THREE.SphereGeometry(radius, isMobile ? 16 : 24, isMobile ? 16 : 24)
      const colors = new Float32Array(geo.attributes.position.count * 3)
      const pos = geo.attributes.position as THREE.BufferAttribute
      const bandColors = [
        new THREE.Color(0xc9a875),
        new THREE.Color(0xa07040),
        new THREE.Color(0xddc090),
        new THREE.Color(0x885530),
        new THREE.Color(0xc9a060),
      ]
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i) / radius
        const noise = Math.sin(y * 14) * 0.3 + Math.sin(y * 7 + 1.3) * 0.4
        const t = (y + noise * 0.15 + 1) * 0.5
        const idx = Math.min(bandColors.length - 1, Math.floor(t * bandColors.length))
        const c = bandColors[idx]
        colors[i * 3] = c.r
        colors[i * 3 + 1] = c.g
        colors[i * 3 + 2] = c.b
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      const core = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 8 }))
      const glow = makeGlowShell(radius * 1.14, 0xe2b46d, 0.06)
      root.add(core)
      root.add(glow)
      scene.add(root)
      registerBody('JUPITER', root, core, glow, radius, 260, 1, 0.06)
    }

    {
      const radius = 5
      const saturnRoot = new THREE.Group()
      saturnRoot.position.set(900, 0, 0)
      saturnRoot.rotation.z = (26.73 * Math.PI) / 180
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(radius, planetSeg, planetSeg),
        new THREE.MeshPhongMaterial({
          color: 0xd4b870,
          shininess: 12,
          emissive: 0x221100,
          emissiveIntensity: 0.15,
        })
      )
      body.scale.set(1, 0.92, 1)
      const glow = makeGlowShell(radius * 1.22, 0xf7cf86, 0.08)
      const ringGeo = new THREE.RingGeometry(radius * 1.4, radius * 2.3, 64)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xd4c890,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2 - 0.45
      ring.rotation.y = 0.1
      saturnRoot.add(body)
      saturnRoot.add(glow)
      saturnRoot.add(ring)
      scene.add(saturnRoot)
      registerBody('SATURN', saturnRoot, body, glow, radius, 220, 1, 0.08)
      ringHazards.push({ name: 'SATURN RING', ring, inner: radius * 1.4, outer: radius * 2.3, thickness: 0.7 })
    }

    makePlanet({
      name: 'URANUS',
      x: 1250,
      radius: 4.0,
      color: 0x80ccdd,
      emissive: 0x0a2a33,
      emissiveIntensity: 0.3,
      glowColor: 0x9de7ff,
      glowOpacity: 0.06,
      approachRange: 220,
    })
    makePlanet({
      name: 'NEPTUNE',
      x: 1650,
      radius: 3.8,
      color: 0x2244bb,
      emissive: 0x081844,
      emissiveIntensity: 0.35,
      glowColor: 0x63b0ff,
      glowOpacity: 0.07,
      approachRange: 230,
    })

    const ship = new THREE.Group()
    const bodyMat = new THREE.MeshPhongMaterial({
      color: 0xc8b070,
      shininess: 90,
      specular: 0x886633,
      emissive: 0x221809,
      emissiveIntensity: 0.2,
    })
    const accentMat = new THREE.MeshPhongMaterial({
      color: 0x8a3030,
      shininess: 60,
      emissive: 0x220505,
    })
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff7733, transparent: true, opacity: 0.92 })
    const reverseGlowMat = new THREE.MeshBasicMaterial({ color: 0x6fc6ff, transparent: true, opacity: 0.1 })

    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.55, 2.3, 10), bodyMat)
    fuselage.rotation.x = Math.PI / 2
    ship.add(fuselage)

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.1, 10), bodyMat)
    nose.rotation.x = -Math.PI / 2
    nose.position.set(0, 0, -1.7)
    ship.add(nose)

    const cockpit = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshPhongMaterial({
        color: 0x66ddff,
        emissive: 0x113344,
        emissiveIntensity: 0.6,
        shininess: 100,
        transparent: true,
        opacity: 0.85,
      })
    )
    cockpit.position.set(0, 0.18, -0.7)
    ship.add(cockpit)

    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.9), accentMat)
    wing.position.set(-0.05, -0.05, 0.2)
    wing.rotation.z = 0.18
    wing.rotation.y = 0.12
    ship.add(wing)

    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.02, 0.15),
      new THREE.MeshBasicMaterial({ color: 0xffaa44 })
    )
    stripe.position.set(0, 0, 0.5)
    ship.add(stripe)

    const engine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.6, 0.7, 10),
      new THREE.MeshPhongMaterial({ color: 0x444444, shininess: 30 })
    )
    engine.rotation.x = Math.PI / 2
    engine.position.set(0, 0, 1.3)
    ship.add(engine)

    const thrusterGlow = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), glowMat)
    thrusterGlow.position.set(0, 0, 1.65)
    thrusterGlow.scale.set(1, 1, 0.6)
    ship.add(thrusterGlow)

    const reverseGlow = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), reverseGlowMat)
    reverseGlow.position.set(0, 0.04, -1.95)
    reverseGlow.scale.set(0.8, 0.8, 0.55)
    ship.add(reverseGlow)

    const enginePointLight = new THREE.PointLight(0xff7733, 0, 14)
    enginePointLight.position.set(0, 0, 1.8)
    ship.add(enginePointLight)

    const reverseLight = new THREE.PointLight(0x72cbff, 0, 8)
    reverseLight.position.set(0, 0, -2)
    ship.add(reverseLight)

    const headlamp = new THREE.PointLight(0xffeedd, 0.8, 60)
    headlamp.position.set(0, 0, -2)
    ship.add(headlamp)

    scene.add(ship)

    const starCount = isMobile ? 1500 : 2500
    const starGeo = new THREE.BufferGeometry()
    const starPos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const r = 1500 + Math.random() * 2000
      const t = Math.random() * Math.PI * 2
      const p = Math.acos(2 * Math.random() - 1)
      starPos[i * 3] = r * Math.sin(p) * Math.cos(t)
      starPos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t)
      starPos[i * 3 + 2] = r * Math.cos(p)
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({
      size: STAR_SIZE_NORMAL,
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: false,
      depthWrite: false,
    })
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)

    const PROCEDURAL_START = 1900
    const ZONE_WIDTH = 600
    const proceduralZones = new Map<number, { bodies: BodyInfo[]; rings: RingHazard[] }>()

    function createProceduralBody(zone: number, rng: () => number) {
      const distFromOrigin = PROCEDURAL_START + zone * ZONE_WIDTH + rng() * ZONE_WIDTH
      const angle = rng() * Math.PI * 2
      const yOff = (rng() - 0.5) * 220
      const radius = 1.5 + rng() * 6
      const hue = rng()
      const color = new THREE.Color().setHSL(hue, 0.55 + rng() * 0.3, 0.4 + rng() * 0.25)
      const root = new THREE.Group()
      root.position.set(Math.cos(angle) * distFromOrigin, yOff, Math.sin(angle) * distFromOrigin)
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 12, 12),
        new THREE.MeshPhongMaterial({
          color,
          emissive: color.clone().multiplyScalar(0.2),
          emissiveIntensity: 0.4,
          shininess: 12,
        })
      )
      const glow = makeGlowShell(radius * 1.18, color.clone().lerp(new THREE.Color(0xffffff), 0.25).getHex(), 0.06)
      root.add(core)
      root.add(glow)
      scene.add(root)
      const body: BodyInfo = {
        name: `ZONE ${zone + 1} BODY`,
        root,
        core,
        glow,
        radius,
        baseScale: 1,
        approachRange: 220,
        baseGlowOpacity: 0.06,
      }

      let ringInfo: RingHazard | null = null
      if (rng() < 0.25) {
        const inner = radius * 1.4
        const outer = radius * 2.2
        const ringGeo = new THREE.RingGeometry(inner, outer, 32)
        const ringMat = new THREE.MeshBasicMaterial({
          color: color.clone().lerp(new THREE.Color(0xffffff), 0.4),
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.rotation.x = Math.PI / 2 - rng() * 0.6
        ring.rotation.y = rng() * 0.5
        root.add(ring)
        ringInfo = { name: `${body.name} RING`, ring, inner, outer, thickness: 0.55 }
      }

      return { body, ringInfo }
    }

    function generateZone(zone: number) {
      const rng = mulberry32(zone * 1337 + 42)
      const bodies: BodyInfo[] = []
      const rings: RingHazard[] = []
      const bodyCount = 3 + Math.floor(rng() * 3)
      for (let i = 0; i < bodyCount; i++) {
        const result = createProceduralBody(zone, rng)
        bodies.push(result.body)
        if (result.ringInfo) rings.push(result.ringInfo)
      }
      proceduralZones.set(zone, { bodies, rings })
    }

    function disposeZone(zone: number) {
      const data = proceduralZones.get(zone)
      if (!data) return
      data.bodies.forEach((body) => {
        scene.remove(body.root)
        body.root.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose()
            const mat = obj.material as THREE.Material | THREE.Material[]
            if (Array.isArray(mat)) mat.forEach((entry) => entry.dispose())
            else mat.dispose()
          }
        })
      })
      proceduralZones.delete(zone)
    }

    function updateProceduralZones(shipPos: THREE.Vector3) {
      const dist = shipPos.length()
      if (dist < PROCEDURAL_START - ZONE_WIDTH) {
        proceduralZones.forEach((_, zone) => disposeZone(zone))
        flightHUD.zone = 0
        return
      }
      const currentZone = Math.max(0, Math.floor((dist - PROCEDURAL_START) / ZONE_WIDTH))
      const wanted = new Set<number>()
      for (let z = currentZone - 1; z <= currentZone + 2; z++) {
        if (z >= 0) wanted.add(z)
      }
      wanted.forEach((zone) => {
        if (!proceduralZones.has(zone)) generateZone(zone)
      })
      proceduralZones.forEach((_, zone) => {
        if (!wanted.has(zone)) disposeZone(zone)
      })
      flightHUD.zone = currentZone
    }

    const velocity = new THREE.Vector3()
    const tmpForward = new THREE.Vector3()
    const tmpOffset = new THREE.Vector3()
    const tmpLookAt = new THREE.Vector3()
    const desiredCamPos = new THREE.Vector3()
    const tmpVelForward = new THREE.Vector3()
    const tmpVelLateral = new THREE.Vector3()
    const localPoint = new THREE.Vector3()
    const camOffsetLocal = new THREE.Vector3(0, 3, 9)

    const spawnPosition = new THREE.Vector3(940, 0, 30)
    let yaw = Math.PI / 2
    let pitch = 0
    let warpVisualLerp = 0
    const crashState = { active: false, elapsed: 0 }
    let lastTick = performance.now()

    const dialogueFlags = {
      intro: false,
      thrust: false,
      reverse: false,
      warp: false,
      leftSystem: false,
      deepSpace: false,
      earth: false,
      sun: false,
    }

    function emitMessageOnce(flag: keyof typeof dialogueFlags, message: string) {
      if (dialogueFlags[flag]) return
      dialogueFlags[flag] = true
      queueFlightMessage(message)
    }

    function positionShipAtSpawn() {
      ship.position.copy(spawnPosition)
      yaw = Math.PI / 2
      pitch = 0
      ship.rotation.set(pitch, yaw, 0, 'YXZ')
      velocity.set(0, 0, 0)
      warpVisualLerp = 0
      flightHUD.speed = 0
      flightHUD.nearest = 'SATURN'
      flightHUD.earthDist = Math.max(0, spawnPosition.distanceTo(bodyWorldPosition(earthBody)) - earthBody.radius)
      flightHUD.warpActive = false
      flightHUD.phase = 'flying'
      flightHUD.crashFlash = 0
      resetFlightInput()
      renderer.domElement.style.filter = ''
      ship.visible = true
      tmpOffset.copy(camOffsetLocal).applyQuaternion(ship.quaternion)
      camera.position.copy(ship.position).add(tmpOffset)
      ship.getWorldDirection(tmpForward)
      tmpLookAt.copy(ship.position).addScaledVector(tmpForward, 5)
      camera.lookAt(tmpLookAt)
    }

    function startCrash() {
      if (crashState.active) return
      crashState.active = true
      crashState.elapsed = 0
      flightHUD.phase = 'crashing'
      resetFlightInput()
    }

    function bodyWorldPosition(body: BodyInfo) {
      return body.root.getWorldPosition(tmpBodyPos)
    }

    function getAllBodies() {
      const proceduralBodies: BodyInfo[] = []
      proceduralZones.forEach((data) => proceduralBodies.push(...data.bodies))
      return namedBodies.concat(proceduralBodies)
    }

    function getAllRings() {
      const proceduralRings: RingHazard[] = []
      proceduralZones.forEach((data) => proceduralRings.push(...data.rings))
      return ringHazards.concat(proceduralRings)
    }

    function detectCollision(allBodies: BodyInfo[], allRings: RingHazard[]) {
      for (const body of allBodies) {
        const dist = ship.position.distanceTo(bodyWorldPosition(body))
        if (dist <= body.radius + SHIP_COLLISION_RADIUS) return true
      }

      for (const hazard of allRings) {
        hazard.ring.worldToLocal(localPoint.copy(ship.position))
        const radial = Math.hypot(localPoint.x, localPoint.y)
        if (Math.abs(localPoint.z) <= hazard.thickness && radial >= hazard.inner && radial <= hazard.outer) {
          return true
        }
      }

      return false
    }

    positionShipAtSpawn()

    const animate = () => {
      const now = performance.now()
      const dt = Math.min(40, now - lastTick)
      lastTick = now

      const input = flightInput
      const allBodies = getAllBodies()
      const allRings = getAllRings()

      if (!dialogueFlags.intro) {
        dialogueFlags.intro = true
        queueFlightMessage('Saturn departure ready. Drift is real. Use reverse thrust to bleed speed.')
      }
      if (input.thrust) emitMessageOnce('thrust', 'Forward thrusters online. Release and you will keep coasting.')
      if (input.reverse) emitMessageOnce('reverse', 'Reverse thrusters are cooler and stronger. Use them early on approach.')
      if (input.warp) emitMessageOnce('warp', 'Warp engages only while you already have momentum.')

      if (!crashState.active) {
        const jx = Math.abs(input.joystick.x) < 0.08 ? 0 : input.joystick.x
        const jy = Math.abs(input.joystick.y) < 0.08 ? 0 : input.joystick.y
        yaw += -jx * ROTATE_RATE
        pitch += -jy * PITCH_RATE
        if (pitch > PITCH_LIMIT) pitch = PITCH_LIMIT
        if (pitch < -PITCH_LIMIT) pitch = -PITCH_LIMIT
        ship.rotation.set(pitch, yaw, 0, 'YXZ')

        ship.getWorldDirection(tmpForward)

        if (input.thrust) velocity.addScaledVector(tmpForward, THRUST_ACC)
        if (input.reverse) velocity.addScaledVector(tmpForward, -REVERSE_ACC)

        if (velocity.lengthSq() > MAX_SPEED * MAX_SPEED) velocity.setLength(MAX_SPEED)

        const forwardVelocity = velocity.dot(tmpForward)
        if (forwardVelocity < -MAX_REVERSE_SPEED) {
          tmpVelForward.copy(tmpForward).multiplyScalar(forwardVelocity)
          tmpVelLateral.copy(velocity).sub(tmpVelForward)
          velocity.copy(tmpVelLateral).addScaledVector(tmpForward, -MAX_REVERSE_SPEED)
        }

        const warpActive = input.warp && velocity.lengthSq() > 0.001
        ship.position.addScaledVector(velocity, warpActive ? WARP_MULT : 1)

        warpVisualLerp += ((warpActive ? 1 : 0) - warpVisualLerp) * 0.12
        const desiredFOV = FOV_NORMAL + (FOV_WARP - FOV_NORMAL) * warpVisualLerp
        if (Math.abs(camera.fov - desiredFOV) > 0.05) {
          camera.fov = desiredFOV
          camera.updateProjectionMatrix()
        }

        starMat.size = STAR_SIZE_NORMAL + (STAR_SIZE_WARP - STAR_SIZE_NORMAL) * warpVisualLerp
        renderer.domElement.style.filter =
          warpVisualLerp > 0.05
            ? `blur(${(warpVisualLerp * 1.1).toFixed(2)}px) saturate(${(1 + warpVisualLerp * 0.25).toFixed(2)})`
            : ''

        const thrustStrength = input.thrust ? 1 : 0
        const reverseStrength = input.reverse ? 1 : 0
        ;(thrusterGlow.material as THREE.MeshBasicMaterial).opacity = Math.min(1, 0.36 + thrustStrength * 0.65 + warpVisualLerp * 0.3)
        thrusterGlow.scale.z = 0.6 + thrustStrength * 1.2 + warpVisualLerp * 1.5
        enginePointLight.intensity = thrustStrength * 1.4 + warpVisualLerp * 1.25
        ;(reverseGlow.material as THREE.MeshBasicMaterial).opacity = 0.08 + reverseStrength * 0.7
        reverseGlow.scale.z = 0.55 + reverseStrength * 1.15
        reverseLight.intensity = reverseStrength * 1.1

        updateProceduralZones(ship.position)

        if (flightHUD.zone >= 1) emitMessageOnce('leftSystem', 'We are leaving Saturns neighborhood. The solar system is still behind us if you want it.')
        if (flightHUD.zone >= 3) emitMessageOnce('deepSpace', 'Uncatalogued bodies ahead. Beyond here, space gets imaginative.')

        sun.rotation.y += 0.0005

        let nearestBody = sunBody
        let nearestDist = Infinity
        for (const body of allBodies) {
          const dist = ship.position.distanceTo(bodyWorldPosition(body)) - body.radius
          if (dist < nearestDist) {
            nearestDist = dist
            nearestBody = body
          }

          const proximity = THREE.MathUtils.clamp(1 - dist / body.approachRange, 0, 1)
          const scaleBoost = 1 + proximity * 0.16
          body.root.scale.setScalar(body.baseScale * scaleBoost)
          const glowMaterial = body.glow.material as THREE.MeshBasicMaterial
          glowMaterial.opacity = body.baseGlowOpacity + proximity * 0.22
          const coreMaterial = body.core.material as THREE.MeshPhongMaterial | THREE.MeshStandardMaterial | THREE.MeshBasicMaterial
          if ('emissiveIntensity' in coreMaterial) {
            coreMaterial.emissiveIntensity = Math.min(0.85, (coreMaterial.emissiveIntensity ?? 0) * 0.86 + proximity * 0.28)
          }
        }

        const earthDistance = Math.max(0, ship.position.distanceTo(bodyWorldPosition(earthBody)) - earthBody.radius)
        flightHUD.speed = parseFloat(velocity.length().toFixed(2))
        flightHUD.nearest = nearestBody.name
        flightHUD.earthDist = earthDistance
        flightHUD.warpActive = warpActive
        flightHUD.crashFlash = Math.max(0, flightHUD.crashFlash - 0.08)

        const nearestProximity = THREE.MathUtils.clamp(1 - nearestDist / nearestBody.approachRange, 0, 1)
        headlamp.intensity = 0.8 + nearestProximity * 0.55

        if (earthDistance < 150) emitMessageOnce('earth', 'Earth is close enough to feel familiar again. You can always turn back.')
        const sunDistance = Math.max(0, ship.position.distanceTo(bodyWorldPosition(sunBody)) - sunBody.radius)
        if (sunDistance < 120) emitMessageOnce('sun', 'Radiation bloom rising. The sun is beautiful and extremely final.')

        if (detectCollision(allBodies, allRings)) startCrash()
      } else {
        crashState.elapsed += dt
        const progress = THREE.MathUtils.clamp(crashState.elapsed / CRASH_DURATION_MS, 0, 1)
        const flash = progress < 0.45 ? progress / 0.45 : 1 - (progress - 0.45) / 0.55
        flightHUD.crashFlash = THREE.MathUtils.clamp(flash, 0, 1)
        warpVisualLerp *= 0.86
        velocity.multiplyScalar(0.9)
        ship.rotation.z += 0.12
        ship.rotation.x += 0.05
        ship.rotation.y += 0.04
        renderer.domElement.style.filter = `blur(${(2 + flash * 5).toFixed(2)}px) brightness(${(1.2 + flash * 0.9).toFixed(2)}) saturate(1.4)`
        if (progress >= 1) {
          crashState.active = false
          positionShipAtSpawn()
        }
      }

      tmpOffset.copy(camOffsetLocal).applyQuaternion(ship.quaternion)
      desiredCamPos.copy(ship.position).add(tmpOffset)
      const cameraLerp = crashState.active ? 0.16 : flightHUD.warpActive ? 0.18 : 0.12
      camera.position.lerp(desiredCamPos, cameraLerp)
      ship.getWorldDirection(tmpForward)
      tmpLookAt.copy(ship.position).addScaledVector(tmpForward, 5)
      if (crashState.active) {
        tmpLookAt.x += Math.sin(now * 0.04) * 0.9
        tmpLookAt.y += Math.cos(now * 0.05) * 0.7
      }
      camera.lookAt(tmpLookAt)

      stars.position.copy(ship.position)
      renderer.render(scene, camera)
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      flightHUD.warpActive = false
      flightHUD.phase = 'flying'
      flightHUD.crashFlash = 0
      proceduralZones.forEach((_, zone) => disposeZone(zone))
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          const material = obj.material as THREE.Material | THREE.Material[]
          if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
          else material.dispose()
        } else if (obj instanceof THREE.Points) {
          obj.geometry.dispose()
          ;(obj.material as THREE.Material).dispose()
        }
      })
      renderer.dispose()
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [isMobile])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }} />
}
