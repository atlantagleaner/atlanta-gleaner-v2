'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { flightCompanion, flightHUD, flightInput, queueFlightMessage, resetFlightInput, type DriveGear } from './flightInput'

export interface SaturnSceneProps {
  onSceneReady?: (camera: THREE.PerspectiveCamera, resetOrbit: () => void) => void
  isInteractive?: boolean
  isMobile?: boolean
  isGamePortalOpen?: boolean
  mode?: 'orbit' | 'flight'
}

const WORLD = {
  background: '#010102',
  fogNear: 260,
  fogFar: 900,
  flightFogNear: 18000,
  flightFogFar: 96000,
}

const SATURN = {
  radius: 6.5,
  tilt: (26.73 * Math.PI) / 180,
  ringInner: 8.1,
  ringOuter: 15.4,
}

const FLIGHT = {
  gearSpeeds: {
    R: -0.55,
    '0': 0,
    '1': 0.58,
    '2': 0.96,
    '3': 1.36,
    WARP: 2.3,
  } as const,
  gearResponse: {
    R: 0.18,
    '0': 0.2,
    '1': 0.1,
    '2': 0.085,
    '3': 0.075,
    WARP: 0.06,
  } as const,
  yawRate: 0.0135,
  pitchRate: 0.0098,
  rollAmount: 0.28,
  pitchLimit: Math.PI / 3,
  shipCollisionRadius: 1.2,
  fovNormal: 46,
  fovWarp: 60,
  chaseOffset: new THREE.Vector3(0, 2.4, 8.8),
  lookAhead: new THREE.Vector3(0, 0.35, -28),
  spawn: new THREE.Vector3(0, 8, 88),
  planetScaleMult: 1.32,
}

const FRONTIER = {
  chartedRadius: 36000,
  sectorSize: 22000,
  keepRadius: 1,
  bodyMin: 1,
  bodyMax: 4,
  announceCooldownMs: 52000,
}

const ROBOT_DIALOGUE = {
  launch: [
    'Bweeoop. Pilot, look at Saturn. We are officially inside a postcard.',
    'Okay. Deep breath. Tiny robot ready. Beautiful planet ready. Heroic pilot definitely ready.',
    'Saturn is filling the whole sky and I am one hundred percent emotionally equipped for that. Probably.',
    'We made it to the ringed giant. I would clap, but I am mostly antennas.',
    'Hello, impossible view. Hello, brave pilot. I love this already.',
    'Saturn ahead. Systems green. Feelings extremely sparkly.',
    'This is not a drill. This is better than a drill. This is Saturn.',
    'Pilot, if you need a moment to stare at the rings, I support that deeply.',
    'Bloop. Welcome to the prettiest neighborhood in the solar system.',
    'I checked the instruments and they all agree: wow.',
    'We are parked beside a giant ringed planet. This is the kind of thing storybooks get smug about.',
    'All right, space ace. Nice and gentle. The universe is huge, but we have excellent vibes.',
  ],
  mechanics: [
    'Tiny reminder: gear 1 is for sightseeing, not panic. It is meant to feel gentle.',
    'If a planet starts filling the whole canopy, that is your cue to turn before physics says hello.',
    'Warp is best when you already have a clean heading. It is less heroic when aimed badly.',
    'Shift the lever with intention. The ship likes clear instructions.',
    'R is your dignity gear. Use it before a planet becomes the entire plan.',
    'The edge markers are not decoration. They are me, lovingly pointing at expensive destinations.',
    'If Earth drifts off center, correct a little. Space rewards patience more than wrestling.',
    'You do not need to oversteer. The ship listens better when you are smooth with it.',
    'Point first, then burn. That is the whole secret and also most of flying.',
    'When the stars begin to smear, double-check your direction before committing to warp.',
    'If you feel lost, find Saturn or Earth and build your heading from there.',
    'A clean turn is prettier than a frantic one. I know because I am watching.',
    'If a world looks huge and peaceful, please remember the huge part.',
    'Quick pilot note: planets are solid. I wish that sounded less obvious and more useful.',
    'You can stay in a lower gear. We are not required to launch ourselves at every problem.',
    'When the nose is where you want it, let the ship glide a second. It feels better.',
    'Reverse gear is excellent for changing your mind without announcing it dramatically.',
    'If the approach feels too fast, it probably is. Space loves subtle mistakes.',
    'Line up your turn before you accelerate. Momentum is stylish but stubborn.',
    'If Saturn disappears behind you, the HUD will still help, but your eyes are the real magic.',
    'You can absolutely fly by instinct. I just prefer instinct with minor supervision.',
    'The safest approach is almost always the calmer one. I know, deeply disappointing.',
    'Treat warp like punctuation, not a personality.',
    'Bweeoop. Warp is not just speed. It is the universe making the road shorter.',
    'The ship stays the same brave little ship. Space just folds kindly around it.',
    'If the speed number looks shy during warp, that is because the shortcut is happening in the road, not the engine.',
    'I think of warp as stretching the map with very polite science.',
    'We are not racing the stars. We are persuading spacetime to take the scenic shortcut.',
    'A gentle climb or dive is easier to control than a sudden yank on the stick.',
    'If you overshoot a heading, ease off and come back. Do not argue with inertia.',
    'A good pilot is mostly tiny corrections stacked on top of patience.',
    'If you are aiming for Earth, let the nose settle before adding more speed.',
    'There is no shame in backing off a close approach. I call it strategic admiration.',
    'Use the stars as a texture for motion. If they barely move, you are sightseeing beautifully.',
    'The ship behaves best when you ask clearly. Panic is not a clear instruction.',
    'If a marker hugs the screen edge, turn toward it first and accelerate second.',
    'You are allowed to coast. Space still counts that as flying.',
    'Approach vectors are like jokes. If you force them, everyone suffers.',
    'If you lose the line to Earth, widen your turn. Tiny circles waste time.',
    'Do not wait for the crash warning to become a teaching moment.',
    'The calmest pilot in the cockpit is still you, which is terrific news for me.',
  ],
  facts: [
    'Saturn is so light for its size that, in a ridiculously large ocean, it would float.',
    'Those rings look solid from far away, but they are made of countless icy fragments.',
    'Saturn is the second-largest planet in the solar system and still somehow an overachiever in style.',
    'The Cassini Division is the dark gap in Saturns rings. Gravity sculpted that like a very picky artist.',
    'Earth is the only world we know that writes poetry and invents sandwiches.',
    'Jupiter is so massive it helps shape the architecture of the whole solar system.',
    'Sunlight out here is still sunlight from the same star that warms your skin on Earth.',
    'Space is mostly empty, but gravity makes emptiness act busy.',
    'A day on Saturn is only about ten and a half hours long. Very spinny planet.',
    'Saturn has more than a hundred known moons. It does not enjoy being lonely.',
    'Titan, Saturns largest moon, has lakes and seas made of liquid methane.',
    'Enceladus throws icy plumes into space from an ocean hidden beneath its crust.',
    'The light reaching us has already traveled millions to billions of miles. The universe loves long deliveries.',
    'Venus is closer to Earth than Mars on average, even though Mars gets all the road-trip posters.',
    'Mars has the tallest volcano in the solar system. Olympus Mons is outrageously large.',
    'Mercury has almost no atmosphere, so the temperature swings there are wild.',
    'Neptune has winds faster than the strongest hurricanes on Earth.',
    'Uranus rotates tipped on its side, as if the planet fell over and decided to commit to it.',
    'The asteroid belt is mostly empty space too. Films have been lying for drama.',
    'Saturns rings are incredibly broad but surprisingly thin compared with their width.',
    'Earths atmosphere is a fragile little blue membrane from far away. That is one reason it looks precious.',
    'The solar system is not arranged like a tidy classroom diagram. The gaps between worlds are enormous.',
    'Gravity never really turns off. It just gets quieter with distance.',
    'Jupiter has a magnetic field so huge it would dwarf the Sun in the sky if you could see it.',
    'The Great Red Spot on Jupiter is a storm that has lasted for centuries.',
    'Light from the Sun takes a little over eight minutes to reach Earth.',
    'Light takes much longer to reach Saturn. We are looking at sunlight with patience.',
    'Comets can grow long tails because solar radiation and charged particles push material away from them.',
    'Our Moon likely formed after a colossal impact early in Earths history. Calm origin story, obviously.',
    'The outer planets are sometimes called gas giants and ice giants, but their insides are far stranger than the names sound.',
    'If Earth were the size of a marble, Jupiter would be closer to a basketball.',
    'The stars here are not sprinkled on a ceiling. Each one is its own sun or system.',
    'Most of the visible matter in this scene is still tiny compared with the darkness around it.',
    'A perfectly straight line in space is harder than it sounds because everything keeps moving.',
    'The same physics that guides galaxies is quietly helping you steer a little fighter right now.',
    'Astronomy is mostly learning that things are bigger, older, hotter, and stranger than expected.',
  ],
  humor: [
    'This is the part of the voyage where a sensible species would stay home and write about it instead.',
    'Space travel is wonderful if you enjoy beauty, danger, and being very far from decent snacks.',
    'According to my calculations, we are extremely small and doing our best anyway.',
    'The universe has a charming habit of being gorgeous exactly where it is least convenient.',
    'If anyone asks, we are not lost. We are conducting a loose survey of magnificence.',
    'There is no traffic out here, just consequences.',
    'I would like to file a polite complaint about how large planets insist on being.',
    'The stars make this look serene. That is an old cosmic trick.',
    'Very few problems are improved by flying directly at them. Space has many of those problems.',
    'I support bold exploration right up until the exact moment it becomes impact.',
    'The guidebook says the universe is big. That feels technically accurate and emotionally insufficient.',
    'Nothing makes a little robot feel alive like surviving a questionable maneuver.',
    'If wonder had a maintenance schedule, I would still miss it for views like this.',
    'The official mission tone is majestic. My personal tone is majestic with mild squeaking.',
    'If there is intelligent life watching us, I hope they appreciate style over efficiency.',
    'One comforting truth about the cosmos is that no one can hear me overexplain orbital drama.',
    'Space is mostly dark, which I think is very confident of it.',
    'I admire your flying in the same way a teacup might admire a thunderstorm.',
    'The universe is full of ancient mysteries and absolutely no handrails.',
    'If I were writing a travel brochure for this route, I would include the phrase thrillingly inadvisable.',
    'Saturn looks like royalty. We look like two runaways with excellent taste.',
    'A giant ringed planet behind us and home somewhere ahead. Very cinematic. Very under-budget for the danger involved.',
    'Please keep all limbs, thoughts, and existential crises inside the cockpit at all times.',
    'If courage is just fear in a better outfit, we are dressed fantastically.',
    'Nothing says friendship like sharing a vacuum while pretending this was always the plan.',
    'I am beginning to suspect the cosmos has no concern for neat travel times.',
    'The stars are lovely, but they do not help with parking.',
    'There should be a phrase for when something is beautiful enough to make your knees weak, except I do not have knees.',
    'This journey is proof that terrible ideas and magnificent ideas sometimes wear the same coat.',
    'If home is where the heart is, then space travel is what happens when the heart gets ambitious.',
    'I am tiny, the ship is tiny, and the planets are showing off again.',
    'The odds of elegance increase sharply when we do not crash into the scenery.',
    'I would never say the universe is dramatic, but it did invent Saturns entrance.',
    'Somewhere, a philosopher would call this humbling. I call it alarmingly gorgeous.',
    'We are either making history or making a very vivid cautionary tale.',
    'At least if we get dramatically lost, the view remains first-rate.',
  ],
  frontier: [
    'Bweeoop. The charted map ends here. Everything after this is freshly discovered.',
    'I think this is where the atlas becomes a rumor. Splendid and slightly alarming.',
    'New stars are appearing. I am thrilled, and also a tiny bit concerned in a charming way.',
    'We have reached the part of space where the universe stops being helpful on purpose.',
    'Fresh sector online. I did not know this place five seconds ago, and I already like it.',
  ],
  discovery: [
    'Bweep. New sector detected. Same tiny crew, different sky, very dramatic.',
    'A new neighborhood! The cosmos is improvising now.',
    'Oh. This is unknown. I love unknown. Unknown is where the wonder lives.',
    'Fresh sky acquired. Please remain seated for the astonishment.',
  ],
} as const

type Mode = 'orbit' | 'flight'

interface BodyInfo {
  name: string
  root: THREE.Object3D
  radius: number
  approachRange: number
  mapColor: string
  flightScale: number
  glow?: THREE.Mesh
  atmosphere?: THREE.Mesh
  spinTarget?: THREE.Object3D
  spinRate?: number
}

interface RingHazard {
  name: string
  root: THREE.Object3D
  inner: number
  outer: number
  thickness: number
}

interface FrontierSector {
  key: string
  coords: { x: number; y: number; z: number }
  root: THREE.Group
  bodies: BodyInfo[]
  ringHazards: RingHazard[]
}

interface SceneState {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  controlLayer: HTMLDivElement
  ship: THREE.Group
  stars: THREE.Points[]
  starMaterials: THREE.PointsMaterial[]
  bodies: BodyInfo[]
  ringHazards: RingHazard[]
  resetOrbit: () => void
}

function createGradientTexture(stops: Array<{ at: number; color: string }>, width = 1024, height = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  stops.forEach((stop) => gradient.addColorStop(stop.at, stop.color))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  for (let i = 0; i < 2200; i++) {
    const alpha = Math.random() * 0.05
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.fillRect(0, Math.random() * height, width, 1 + Math.random() * 2)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function createRockTexture(base: string, accent: string, width = 512, height = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  ctx.fillStyle = base
  ctx.fillRect(0, 0, width, height)

  for (let i = 0; i < 3000; i++) {
    const size = Math.random() * 3 + 1
    ctx.fillStyle = Math.random() > 0.5 ? accent : 'rgba(0,0,0,0.18)'
    ctx.fillRect(Math.random() * width, Math.random() * height, size, size)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function createEarthTexture(width = 1024, height = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  ctx.fillStyle = '#2f6ebf'
  ctx.fillRect(0, 0, width, height)

  for (let i = 0; i < 120; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const w = 30 + Math.random() * 80
    const h = 16 + Math.random() * 40
    ctx.fillStyle = i % 3 === 0 ? '#5ca45b' : '#3f7c3d'
    ctx.beginPath()
    ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < 600; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.16})`
    ctx.fillRect(Math.random() * width, Math.random() * height, 8 + Math.random() * 26, 1 + Math.random() * 3)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function createSaturnTexture() {
  return createGradientTexture([
    { at: 0, color: '#2b211a' },
    { at: 0.2, color: '#3b2518' },
    { at: 0.42, color: '#8a6544' },
    { at: 0.5, color: '#c99e71' },
    { at: 0.58, color: '#8a6544' },
    { at: 0.8, color: '#3b2518' },
    { at: 1, color: '#2b211a' },
  ], 2048, 1024)
}

function createPlanetGlow(radius: number, color: number, opacity: number, segments: number) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, segments, segments),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  )
}

function createAtmosphereShell(radius: number, color: number, opacity: number, segments: number) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, segments, segments),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  )
}

function pickRobotLine(lines: readonly string[], exclude?: string | null) {
  if (lines.length === 0) return ''
  if (lines.length === 1) return lines[0]
  const filtered = exclude ? lines.filter((line) => line !== exclude) : [...lines]
  const pool = filtered.length > 0 ? filtered : [...lines]
  return pool[Math.floor(Math.random() * pool.length)]
}

function shapeFlightAxis(value: number) {
  const magnitude = Math.abs(value)
  if (magnitude < 0.14) return 0

  const normalized = (magnitude - 0.14) / 0.86
  const curved = Math.pow(normalized, 1.9)
  return Math.sign(value) * curved
}

function getGearSpeed(gear: DriveGear) {
  return FLIGHT.gearSpeeds[gear]
}

function getGearResponse(gear: DriveGear) {
  return FLIGHT.gearResponse[gear]
}

function createStarLayer({
  count,
  radiusMin,
  radiusMax,
  size,
  opacity,
  palette,
}: {
  count: number
  radiusMin: number
  radiusMax: number
  size: number
  opacity: number
  palette: string[]
}) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const color = new THREE.Color()

  for (let i = 0; i < count; i++) {
    const radius = radiusMin + Math.random() * (radiusMax - radiusMin)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = radius * Math.cos(phi)

    color.set(palette[Math.floor(Math.random() * palette.length)])
    const brightness = 0.72 + Math.random() * 0.35
    colors[i * 3] = color.r * brightness
    colors[i * 3 + 1] = color.g * brightness
    colors[i * 3 + 2] = color.b * brightness
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const points = new THREE.Points(geometry, material)
  return { points, material }
}

function createClusterStarLayer({
  count,
  centers,
  size,
  opacity,
  palette,
}: {
  count: number
  centers: THREE.Vector3[]
  size: number
  opacity: number
  palette: string[]
}) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const color = new THREE.Color()

  for (let i = 0; i < count; i++) {
    const center = centers[Math.floor(Math.random() * centers.length)]
    const spread = 420 + Math.random() * 920
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    )
    const point = center.clone().add(offset)
    positions[i * 3] = point.x
    positions[i * 3 + 1] = point.y
    positions[i * 3 + 2] = point.z

    color.set(palette[Math.floor(Math.random() * palette.length)])
    const brightness = 0.7 + Math.random() * 0.42
    colors[i * 3] = color.r * brightness
    colors[i * 3 + 1] = color.g * brightness
    colors[i * 3 + 2] = color.b * brightness
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  return { points: new THREE.Points(geometry, material), material }
}

function createNebulaTexture(color: string, size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  const gradient = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.06, size * 0.5, size * 0.5, size * 0.46)
  gradient.addColorStop(0, 'rgba(255,255,255,0.18)')
  gradient.addColorStop(0.22, color)
  gradient.addColorStop(0.62, 'rgba(40,56,120,0.08)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 180; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`
    ctx.beginPath()
    ctx.arc(Math.random() * size, Math.random() * size, 2 + Math.random() * 9, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

function hashSectorCoords(x: number, y: number, z: number) {
  let h = 2166136261
  h ^= Math.imul(x | 0, 374761393)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= Math.imul(y | 0, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= Math.imul(z | 0, 2147483647)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return h >>> 0
}

function createSeededStarLayer({
  rng,
  count,
  radiusMin,
  radiusMax,
  size,
  opacity,
  palette,
}: {
  rng: () => number
  count: number
  radiusMin: number
  radiusMax: number
  size: number
  opacity: number
  palette: string[]
}) {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const color = new THREE.Color()

  for (let i = 0; i < count; i++) {
    const radius = radiusMin + rng() * (radiusMax - radiusMin)
    const theta = rng() * Math.PI * 2
    const phi = Math.acos(2 * rng() - 1)
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = radius * Math.cos(phi)

    color.set(palette[Math.floor(rng() * palette.length)])
    const brightness = 0.7 + rng() * 0.4
    colors[i * 3] = color.r * brightness
    colors[i * 3 + 1] = color.g * brightness
    colors[i * 3 + 2] = color.b * brightness
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  return { points: new THREE.Points(geometry, material), material }
}

function createSectorNebulaTexture(color: string, rng: () => number, size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  const gradient = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.08, size * 0.5, size * 0.5, size * 0.48)
  gradient.addColorStop(0, 'rgba(255,255,255,0.16)')
  gradient.addColorStop(0.24, color)
  gradient.addColorStop(0.66, 'rgba(70, 88, 160, 0.1)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rng() * 0.03})`
    ctx.beginPath()
    ctx.arc(rng() * size, rng() * size, 2 + rng() * 8, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function sectorThemeFromSeed(seed: number) {
  const themes = [
    {
      starPalette: ['#ffffff', '#d8f0ff', '#a7d8ff', '#d0c6ff', '#87f1ff'],
      bodyPalette: ['#c8e8ff', '#8ecbff', '#b1a2ff', '#72dfe8'],
      nebula: 'rgba(92, 130, 255, 0.13)',
      haze: 'rgba(90, 120, 255, 0.07)',
    },
    {
      starPalette: ['#ffffff', '#ffe3b2', '#ffd1dc', '#d4c0ff', '#b9f7ff'],
      bodyPalette: ['#f0c58d', '#e09d7a', '#d9a1d7', '#8ed0ff'],
      nebula: 'rgba(255, 152, 105, 0.12)',
      haze: 'rgba(255, 164, 110, 0.065)',
    },
    {
      starPalette: ['#ffffff', '#d7fff3', '#c1e1ff', '#a7ffe1', '#ffeebd'],
      bodyPalette: ['#92d8d6', '#7cbcd4', '#b9e9ff', '#ebe3a7'],
      nebula: 'rgba(110, 255, 218, 0.1)',
      haze: 'rgba(104, 224, 201, 0.055)',
    },
  ]
  return themes[seed % themes.length]
}

function createSectorPlanet({
  root,
  rng,
  name,
  radius,
  position,
  palette,
  isMobile,
}: {
  root: THREE.Group
  rng: () => number
  name: string
  radius: number
  position: THREE.Vector3
  palette: string[]
  isMobile: boolean
}) {
  const bodyRoot = new THREE.Group()
  bodyRoot.position.copy(position)

  const color = new THREE.Color(palette[Math.floor(rng() * palette.length)])
  const accent = new THREE.Color(palette[Math.floor(rng() * palette.length)])
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color,
    emissive: color.clone().multiplyScalar(0.14),
    emissiveIntensity: 0.18,
    roughness: 0.88,
    metalness: 0.02,
  })

  const segments = isMobile ? 24 : 34
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, segments), bodyMaterial)
  sphere.castShadow = true
  sphere.receiveShadow = true
  bodyRoot.add(sphere)

  const glow = createPlanetGlow(radius * 1.14, accent.getHex(), 0.08 + rng() * 0.08, Math.max(18, segments / 2))
  bodyRoot.add(glow)

  let atmosphere: THREE.Mesh | undefined
  if (rng() > 0.52) {
    atmosphere = createAtmosphereShell(radius * 1.03, accent.getHex(), 0.05 + rng() * 0.05, Math.max(20, segments / 2))
    bodyRoot.add(atmosphere)
  }

  if (rng() > 0.68) {
    const ringInner = radius * (1.45 + rng() * 0.18)
    const ringOuter = radius * (2.15 + rng() * 0.35)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(ringInner, ringOuter, 36),
      new THREE.MeshBasicMaterial({
        color: accent.clone().lerp(new THREE.Color('#ffffff'), 0.3),
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    ring.rotation.x = Math.PI / 2 - rng() * 0.3
    ring.rotation.y = rng() * 0.8
    bodyRoot.add(ring)
  }

  root.add(bodyRoot)

  const body: BodyInfo = {
    name,
    root: bodyRoot,
    radius,
    approachRange: radius * 11,
    mapColor: `#${color.getHexString()}`,
    flightScale: 4 + radius * 0.42,
    glow,
    atmosphere,
    spinTarget: sphere,
    spinRate: 0.0007 + rng() * 0.0012,
  }

  return body
}

export default function SaturnScene({
  onSceneReady,
  isInteractive = true,
  isMobile = false,
  isGamePortalOpen = false,
  mode = 'orbit',
}: SaturnSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)
  const stateRef = useRef<SceneState | null>(null)
  const modeRef = useRef<Mode>(mode)
  const flightInitializedRef = useRef(false)
  const velocityRef = useRef(new THREE.Vector3())
  const yawRef = useRef(Math.PI)
  const pitchRef = useRef(0)
  const lastTickRef = useRef(0)
  const frontierCleanupRef = useRef<(() => void) | null>(null)
  const frontierEntryAnnouncedRef = useRef(false)
  const frontierLastSectorKeyRef = useRef('')
  const frontierLastAnnounceAtRef = useRef(0)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    const orbitEnabled = mode === 'orbit' && isInteractive && !isGamePortalOpen
    state.controls.enabled = orbitEnabled
    state.controlLayer.style.pointerEvents = orbitEnabled ? 'auto' : 'none'
  }, [mode, isInteractive, isGamePortalOpen])

  useEffect(() => {
    const state = stateRef.current
    if (!state) return

    if (mode === 'flight') {
      flightInitializedRef.current = false
      state.scene.fog = new THREE.Fog(WORLD.background, WORLD.flightFogNear, WORLD.flightFogFar)
      frontierEntryAnnouncedRef.current = false
      frontierLastSectorKeyRef.current = ''
      frontierLastAnnounceAtRef.current = 0
    }

    if (mode === 'orbit') {
      resetFlightInput()
      velocityRef.current.set(0, 0, 0)
      state.ship.visible = false
      state.renderer.domElement.style.filter = ''
      state.camera.fov = FLIGHT.fovNormal
      state.camera.updateProjectionMatrix()
      flightHUD.warpActive = false
      flightHUD.crashFlash = 0
      flightHUD.heading = yawRef.current
      state.scene.fog = new THREE.Fog(WORLD.background, WORLD.fogNear, WORLD.fogFar)
      frontierCleanupRef.current?.()
      state.resetOrbit()
    }
  }, [mode])

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(WORLD.background)
    scene.fog = new THREE.Fog(WORLD.background, WORLD.fogNear, WORLD.fogFar)

    const camera = new THREE.PerspectiveCamera(FLIGHT.fovNormal, width / height, 0.1, 220000)
    camera.position.set(0, 18, 65)

    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.75))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.left = '0'
    renderer.domElement.style.zIndex = '5'
    renderer.domElement.style.pointerEvents = 'none'
    renderer.domElement.style.transition = 'filter 0.18s ease'
    container.appendChild(renderer.domElement)

    const controlLayer = document.createElement('div')
    controlLayer.style.position = 'absolute'
    controlLayer.style.inset = '0'
    controlLayer.style.zIndex = '4'
    controlLayer.style.pointerEvents = 'auto'
    container.appendChild(controlLayer)

    const controls = new OrbitControls(camera, controlLayer)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 18
    controls.maxDistance = 280
    controls.target.set(0, 0, 0)
    controls.update()

    const resetOrbit = () => {
      camera.position.set(0, 18, 65)
      camera.lookAt(0, 0, 0)
      controls.target.set(0, 0, 0)
      controls.update()
    }

    onSceneReady?.(camera, resetOrbit)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xfff6e0, 1.45)
    sunLight.position.set(-140, 60, 55)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    scene.add(sunLight)

    const fillLight = new THREE.DirectionalLight(0x7ca3ff, 0.2)
    fillLight.position.set(120, -40, -60)
    scene.add(fillLight)

    const bodies: BodyInfo[] = []
    const ringHazards: RingHazard[] = []
    const sphereSegments = isMobile ? 42 : 80
    const bodyWorldPos = new THREE.Vector3()
    const bodyLocalPos = new THREE.Vector3()

    const registerBody = (body: BodyInfo) => {
      bodies.push(body)
      return body
    }

    const makePlanet = (opts: {
      name: string
      position: THREE.Vector3
      radius: number
      texture?: THREE.Texture
      color?: number
      emissive?: number
      emissiveIntensity?: number
      roughness?: number
      metalness?: number
      glowColor?: number
      glowOpacity?: number
      atmosphereColor?: number
      atmosphereOpacity?: number
      mapColor?: string
      flightScale?: number
      flattenY?: number
      tiltZ?: number
      spinRate?: number
      approachRange?: number
    }) => {
      const root = new THREE.Group()
      root.position.copy(opts.position)
      if (opts.tiltZ) root.rotation.z = opts.tiltZ

      const material = new THREE.MeshStandardMaterial({
        color: opts.color ?? 0xffffff,
        emissive: opts.emissive ?? 0x000000,
        emissiveIntensity: opts.emissiveIntensity ?? 0,
        roughness: opts.roughness ?? 0.9,
        metalness: opts.metalness ?? 0,
      })
      if (opts.texture) {
        material.map = opts.texture
      }

      const mesh = new THREE.Mesh(new THREE.SphereGeometry(opts.radius, sphereSegments, sphereSegments), material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      if (opts.flattenY) mesh.scale.set(1, opts.flattenY, 1)
      root.add(mesh)

      let glow: THREE.Mesh | undefined
      if (opts.glowColor && opts.glowOpacity) {
        glow = createPlanetGlow(opts.radius * 1.16, opts.glowColor, opts.glowOpacity, Math.max(18, sphereSegments / 2))
        root.add(glow)
      }

      let atmosphere: THREE.Mesh | undefined
      if (opts.atmosphereColor && opts.atmosphereOpacity) {
        atmosphere = createAtmosphereShell(
          opts.radius * 1.035,
          opts.atmosphereColor,
          opts.atmosphereOpacity,
          Math.max(24, sphereSegments / 2)
        )
        root.add(atmosphere)
      }

      scene.add(root)
      return registerBody({
        name: opts.name,
        root,
        radius: opts.radius,
        approachRange: opts.approachRange ?? opts.radius * 10,
        mapColor: opts.mapColor ?? '#ffffff',
        flightScale: opts.flightScale ?? 1,
        glow,
        atmosphere,
        spinTarget: mesh,
        spinRate: opts.spinRate,
      })
    }

    makePlanet({
      name: 'SUN',
      position: new THREE.Vector3(-13800, 20, -180),
      radius: 13,
      color: 0xffe89d,
      emissive: 0xffc963,
      emissiveIntensity: 0.9,
      roughness: 0.5,
      glowColor: 0xffd88a,
      glowOpacity: 0.22,
      mapColor: '#ffd77a',
      flightScale: 1.4,
      spinRate: 0.0003,
      approachRange: 110,
    })

    makePlanet({
      name: 'MERCURY',
      position: new THREE.Vector3(-13250, 30, -420),
      radius: 1.4,
      texture: createRockTexture('#726459', '#988b7f'),
      mapColor: '#9f9488',
      flightScale: 2.8,
      roughness: 1,
      spinRate: 0.0018,
      approachRange: 180,
    })

    makePlanet({
      name: 'VENUS',
      position: new THREE.Vector3(-12850, -120, 540),
      radius: 2.8,
      texture: createGradientTexture([
        { at: 0, color: '#b18b4f' },
        { at: 0.45, color: '#ddbe7a' },
        { at: 1, color: '#a67a44' },
      ]),
      emissive: 0x4a2c14,
      emissiveIntensity: 0.12,
      mapColor: '#ddb671',
      flightScale: 3.8,
      roughness: 0.92,
      glowColor: 0xf0d49a,
      glowOpacity: 0.08,
      atmosphereColor: 0xf3d29a,
      atmosphereOpacity: 0.055,
      spinRate: 0.0011,
      approachRange: 240,
    })

    const earth = makePlanet({
      name: 'EARTH',
      position: new THREE.Vector3(-12440, 60, 900),
      radius: 3,
      texture: createEarthTexture(),
      emissive: 0x0f2a55,
      emissiveIntensity: 0.14,
      mapColor: '#73b7ff',
      flightScale: 5.2,
      roughness: 0.84,
      glowColor: 0x8ad6ff,
      glowOpacity: 0.09,
      atmosphereColor: 0x91dcff,
      atmosphereOpacity: 0.075,
      spinRate: 0.0019,
      approachRange: 300,
    })

    makePlanet({
      name: 'MARS',
      position: new THREE.Vector3(-11680, -180, -1200),
      radius: 2.2,
      texture: createRockTexture('#8d492b', '#c76843'),
      emissive: 0x2c120a,
      emissiveIntensity: 0.08,
      mapColor: '#d06d4b',
      flightScale: 4.4,
      glowColor: 0xcc724a,
      glowOpacity: 0.05,
      atmosphereColor: 0xd46f4b,
      atmosphereOpacity: 0.035,
      spinRate: 0.0014,
      approachRange: 220,
    })

    makePlanet({
      name: 'JUPITER',
      position: new THREE.Vector3(-6350, 260, -2400),
      radius: 9,
      texture: createGradientTexture([
        { at: 0, color: '#5f3a2c' },
        { at: 0.12, color: '#b27a4c' },
        { at: 0.22, color: '#e4c08b' },
        { at: 0.35, color: '#7b4d34' },
        { at: 0.5, color: '#f0d29e' },
        { at: 0.64, color: '#9d6542' },
        { at: 0.78, color: '#d8ac77' },
        { at: 1, color: '#6b432f' },
      ]),
      mapColor: '#d8b07b',
      flightScale: 8.5,
      roughness: 0.95,
      glowColor: 0xe4c28e,
      glowOpacity: 0.06,
      atmosphereColor: 0xf0c98f,
      atmosphereOpacity: 0.05,
      spinRate: 0.001,
      approachRange: 540,
    })

    const saturnRoot = new THREE.Group()
    saturnRoot.position.set(0, 0, 0)
    saturnRoot.rotation.z = SATURN.tilt

    const saturnMesh = new THREE.Mesh(
      new THREE.SphereGeometry(SATURN.radius, sphereSegments, sphereSegments),
      new THREE.MeshStandardMaterial({
        map: createSaturnTexture(),
        roughness: 0.95,
        metalness: 0,
      })
    )
    saturnMesh.scale.set(1, 0.9, 1)
    saturnMesh.castShadow = true
    saturnMesh.receiveShadow = true
    saturnRoot.add(saturnMesh)

    const saturnAtmosphere = createAtmosphereShell(SATURN.radius * 1.04, 0xd8b07b, 0.045, Math.max(24, sphereSegments / 2))
    saturnAtmosphere.scale.set(1, 0.9, 1)
    saturnRoot.add(saturnAtmosphere)

    const particleCount = isMobile ? 9000 : 22000
    const ringGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const ringColor = new THREE.Color('#b8e1f0')
    for (let i = 0; i < particleCount; i++) {
      const radius = SATURN.ringInner + Math.random() * (SATURN.ringOuter - SATURN.ringInner)
      const angle = Math.random() * Math.PI * 2
      const normR = (radius - SATURN.ringInner) / (SATURN.ringOuter - SATURN.ringInner)
      let density = 1
      if (normR < 0.16) density = 0.26
      else if (normR < 0.58) density = 0.96
      else if (normR < 0.67) density = 0.03
      else if (normR < 0.9) density = 0.64
      else density = 0.22
      if (Math.random() > density) {
        i -= 1
        continue
      }

      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.08
      positions[i * 3 + 2] = Math.sin(angle) * radius

      const intensity = 0.68 + density * 0.32
      colors[i * 3] = ringColor.r * intensity
      colors[i * 3 + 1] = ringColor.g * intensity
      colors[i * 3 + 2] = ringColor.b * intensity
    }
    ringGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    ringGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const ringParticles = new THREE.Points(
      ringGeometry,
      new THREE.PointsMaterial({
        size: 0.18,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
      })
    )
    saturnRoot.add(ringParticles)
    scene.add(saturnRoot)

    registerBody({
      name: 'SATURN',
      root: saturnRoot,
      radius: SATURN.radius,
      approachRange: 42,
      mapColor: '#e4c897',
      flightScale: 3.8,
      spinTarget: saturnMesh,
      spinRate: 0.0015,
    })

    ringHazards.push({
      name: 'SATURN RING',
      root: saturnRoot,
      inner: SATURN.ringInner,
      outer: SATURN.ringOuter,
      thickness: 0.7,
    })

    makePlanet({
      name: 'URANUS',
      position: new THREE.Vector3(14000, 900, 4200),
      radius: 4.6,
      texture: createGradientTexture([
        { at: 0, color: '#a0d8e6' },
        { at: 0.5, color: '#77bccf' },
        { at: 1, color: '#9de4f0' },
      ]),
      mapColor: '#9de4f0',
      flightScale: 5.4,
      roughness: 0.9,
      glowColor: 0xa2eeff,
      glowOpacity: 0.07,
      atmosphereColor: 0xa2eeff,
      atmosphereOpacity: 0.055,
      spinRate: 0.001,
      approachRange: 380,
    })

    makePlanet({
      name: 'NEPTUNE',
      position: new THREE.Vector3(30000, -1100, -5600),
      radius: 4.3,
      texture: createGradientTexture([
        { at: 0, color: '#365dc6' },
        { at: 0.45, color: '#28469c' },
        { at: 1, color: '#5c8df0' },
      ]),
      emissive: 0x11234d,
      emissiveIntensity: 0.12,
      mapColor: '#5c8df0',
      flightScale: 5.1,
      roughness: 0.86,
      glowColor: 0x74acff,
      glowOpacity: 0.06,
      atmosphereColor: 0x74acff,
      atmosphereOpacity: 0.06,
      spinRate: 0.001,
      approachRange: 360,
    })

    const starLayers = [
      createStarLayer({
        count: isMobile ? 5200 : 11000,
        radiusMin: 1200,
        radiusMax: 9000,
        size: 0.9,
        opacity: 0.32,
        palette: ['#f7f9ff', '#d5e4ff', '#f6deb3', '#c8d3ff'],
      }),
      createStarLayer({
        count: isMobile ? 1800 : 3600,
        radiusMin: 700,
        radiusMax: 4800,
        size: 1.45,
        opacity: 0.56,
        palette: ['#ffffff', '#9fd2ff', '#ffd7a2', '#e8d6ff', '#9ee8ff'],
      }),
      createStarLayer({
        count: isMobile ? 280 : 620,
        radiusMin: 500,
        radiusMax: 2400,
        size: 2.4,
        opacity: 0.84,
        palette: ['#ffffff', '#7dc8ff', '#ffcc94', '#d9a3ff', '#7af0ff', '#ff9fd0'],
      }),
      createClusterStarLayer({
        count: isMobile ? 420 : 900,
        centers: [
          new THREE.Vector3(-1800, 900, -2600),
          new THREE.Vector3(2400, -600, -1900),
          new THREE.Vector3(700, 1500, 2600),
        ],
        size: 1.8,
        opacity: 0.62,
        palette: ['#8de8ff', '#ffd89d', '#d6b2ff', '#ffffff'],
      }),
      createStarLayer({
        count: isMobile ? 1400 : 2800,
        radiusMin: 18000,
        radiusMax: 140000,
        size: 0.72,
        opacity: 0.22,
        palette: ['#ffffff', '#cfe6ff', '#ffe0b4', '#d8c8ff', '#aeeeff'],
      }),
    ]
    starLayers.forEach(({ points }) => scene.add(points))

    const nebulaSprites = [
      new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createNebulaTexture('rgba(88, 118, 255, 0.13)'),
          transparent: true,
          depthWrite: false,
          opacity: 0.18,
          blending: THREE.AdditiveBlending,
        })
      ),
      new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createNebulaTexture('rgba(255, 168, 110, 0.1)'),
          transparent: true,
          depthWrite: false,
          opacity: 0.14,
          blending: THREE.AdditiveBlending,
        })
      ),
      new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createNebulaTexture('rgba(158, 244, 255, 0.09)'),
          transparent: true,
          depthWrite: false,
          opacity: 0.12,
          blending: THREE.AdditiveBlending,
        })
      ),
    ]
    nebulaSprites[0].position.set(-2400, 900, -4200)
    nebulaSprites[0].scale.set(4600, 3200, 1)
    nebulaSprites[1].position.set(3100, -1100, -2800)
    nebulaSprites[1].scale.set(3800, 2600, 1)
    nebulaSprites[2].position.set(900, 1800, 3600)
    nebulaSprites[2].scale.set(3400, 2400, 1)
    nebulaSprites.forEach((sprite) => scene.add(sprite))

    const ship = new THREE.Group()
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0xe4e0d6,
      shininess: 132,
      specular: 0xb8c4de,
      emissive: 0x181d30,
      emissiveIntensity: 0.14,
    })
    const accentMaterial = new THREE.MeshPhongMaterial({
      color: 0xff5abf,
      shininess: 96,
      emissive: 0x4d1738,
    })
    const trimMaterial = new THREE.MeshPhongMaterial({
      color: 0xd4af74,
      shininess: 94,
      emissive: 0x40301c,
      emissiveIntensity: 0.16,
    })
    const undersideMaterial = new THREE.MeshPhongMaterial({
      color: 0x444a63,
      shininess: 54,
      emissive: 0x141827,
      emissiveIntensity: 0.22,
    })
    const engineGlowMaterial = new THREE.MeshBasicMaterial({ color: 0xff7733, transparent: true, opacity: 0.92 })
    const reverseGlowMaterial = new THREE.MeshBasicMaterial({ color: 0x6fc6ff, transparent: true, opacity: 0.1 })

    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.5, 3.3), bodyMaterial)
    fuselage.position.set(0, 0.02, -0.12)
    ship.add(fuselage)

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 3.2, 4), bodyMaterial)
    nose.rotation.x = -Math.PI / 2
    nose.position.set(0, 0.03, -3.2)
    nose.scale.set(1.6, 1, 0.68)
    ship.add(nose)

    const noseTrim = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 2.1), trimMaterial)
    noseTrim.position.set(0, 0.12, -2.18)
    noseTrim.rotation.x = -0.08
    ship.add(noseTrim)

    const dorsal = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.3, 1.4), bodyMaterial)
    dorsal.position.set(0, 0.3, -0.72)
    dorsal.rotation.x = -0.12
    ship.add(dorsal)

    const belly = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 1.7), undersideMaterial)
    belly.position.set(0, -0.2, 0.2)
    ship.add(belly)

    const cockpit = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.2, 0.96),
      new THREE.MeshPhongMaterial({
        color: 0x87c8ff,
        emissive: 0x12385a,
        emissiveIntensity: 0.48,
        shininess: 108,
        transparent: true,
        opacity: 0.82,
      })
    )
    cockpit.position.set(0, 0.24, -1.12)
    cockpit.rotation.x = -0.08
    ship.add(cockpit)

    const canopyTrim = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.05, 1.24), trimMaterial)
    canopyTrim.position.set(0, 0.14, -1)
    ship.add(canopyTrim)

    const wingLeft = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.09, 0.36), bodyMaterial)
    wingLeft.position.set(-2.18, -0.01, -0.28)
    wingLeft.rotation.z = -0.3
    wingLeft.rotation.y = 0.24
    ship.add(wingLeft)

    const wingRight = wingLeft.clone()
    wingRight.position.x = 2.18
    wingRight.rotation.z = 0.3
    wingRight.rotation.y = -0.24
    ship.add(wingRight)

    const wingLeftTip = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.06, 0.22), accentMaterial)
    wingLeftTip.position.set(-4.18, -0.01, -0.92)
    wingLeftTip.rotation.z = -0.12
    wingLeftTip.rotation.y = 0.36
    ship.add(wingLeftTip)

    const wingRightTip = wingLeftTip.clone()
    wingRightTip.position.x = 4.18
    wingRightTip.rotation.z = 0.12
    wingRightTip.rotation.y = -0.34
    ship.add(wingRightTip)

    const rearWingLeft = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.09, 0.3), undersideMaterial)
    rearWingLeft.position.set(-1.42, -0.05, 1.14)
    rearWingLeft.rotation.z = -0.28
    rearWingLeft.rotation.y = -0.1
    ship.add(rearWingLeft)

    const rearWingRight = rearWingLeft.clone()
    rearWingRight.position.x = 1.42
    rearWingRight.rotation.z = 0.28
    rearWingRight.rotation.y = 0.12
    ship.add(rearWingRight)

    const finLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.48, 1.02), accentMaterial)
    finLeft.position.set(-0.92, 1.18, 1.02)
    finLeft.rotation.z = -0.24
    finLeft.rotation.x = 0.16
    ship.add(finLeft)

    const finRight = finLeft.clone()
    finRight.position.x = 0.92
    finRight.rotation.z = 0.24
    finRight.rotation.x = 0.16
    ship.add(finRight)

    const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.42, 1.16), undersideMaterial)
    engineBlock.position.set(0, -0.01, 1.54)
    ship.add(engineBlock)

    const boosterLeft = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 1.22), accentMaterial)
    boosterLeft.position.set(-0.92, -0.02, 1.42)
    ship.add(boosterLeft)

    const boosterRight = boosterLeft.clone()
    boosterRight.position.x = 0.92
    ship.add(boosterRight)

    const centerSpineRear = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 1.2), trimMaterial)
    centerSpineRear.position.set(0, 0.08, 1.36)
    ship.add(centerSpineRear)

    const sideThrusterLeft = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.88), trimMaterial)
    sideThrusterLeft.position.set(-0.48, -0.02, 1.82)
    ship.add(sideThrusterLeft)

    const sideThrusterRight = sideThrusterLeft.clone()
    sideThrusterRight.position.x = 0.48
    ship.add(sideThrusterRight)

    const thrusterGlow = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 6), engineGlowMaterial)
    thrusterGlow.position.set(0, 0, 2.36)
    thrusterGlow.scale.set(1.54, 0.76, 0.68)
    ship.add(thrusterGlow)

    const reverseGlow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), reverseGlowMaterial)
    reverseGlow.position.set(0, 0.02, -3.72)
    reverseGlow.scale.set(0.85, 0.45, 0.3)
    ship.add(reverseGlow)

    const engineLight = new THREE.PointLight(0xff7733, 0, 14)
    engineLight.position.set(0, 0, 2.56)
    ship.add(engineLight)

    const reverseLight = new THREE.PointLight(0x72cbff, 0, 8)
    reverseLight.position.set(0, 0, -3.78)
    ship.add(reverseLight)

    ship.visible = false
    ship.scale.setScalar(isMobile ? 0.11 : 0.22)
    scene.add(ship)

    const tmpForward = new THREE.Vector3()
    const tmpCameraPos = new THREE.Vector3()
    const tmpLookAt = new THREE.Vector3()
    const localPoint = new THREE.Vector3()
    const shipForwardLocal = new THREE.Vector3(0, 0, -1)
    const saturnCenter = new THREE.Vector3(0, 0, 0)
    const frontierBodies: BodyInfo[] = []
    const frontierRingHazards: RingHazard[] = []
    const frontierSectors = new Map<string, FrontierSector>()
    const getFlightScale = (body: BodyInfo) => body.flightScale * FLIGHT.planetScaleMult
    const collisionScaleMult = isMobile ? 0.86 : 1
    const collisionShipRadius = isMobile ? FLIGHT.shipCollisionRadius * 0.72 : FLIGHT.shipCollisionRadius
    let hasShownCrashWarning = false
    let suppressInitialSaturnWarning = true
    let flightElapsedMs = 0
    let nextAmbientDialogueAtMs = 0
    let lastAmbientLine: string | null = null

    const positionShipAtSpawn = () => {
      ship.position.copy(FLIGHT.spawn)
      tmpForward.copy(saturnCenter).sub(ship.position).normalize()
      yawRef.current = Math.atan2(-tmpForward.x, -tmpForward.z)
      pitchRef.current = Math.asin(tmpForward.y)
      ship.rotation.set(pitchRef.current, yawRef.current, 0, 'YXZ')
      velocityRef.current.set(0, 0, 0)
      ship.visible = true
      tmpCameraPos.copy(FLIGHT.chaseOffset).applyQuaternion(ship.quaternion)
      camera.position.copy(ship.position).add(tmpCameraPos)
      tmpLookAt.copy(FLIGHT.lookAhead).applyQuaternion(ship.quaternion).add(ship.position)
      camera.lookAt(tmpLookAt)
      camera.fov = FLIGHT.fovNormal
      camera.updateProjectionMatrix()
      flightHUD.speed = 0
      flightHUD.nearest = 'SATURN'
      flightHUD.earthDist = Math.max(
        0,
        ship.position.distanceTo(earth.root.getWorldPosition(bodyWorldPos)) - earth.radius * getFlightScale(earth)
      )
      flightHUD.warpActive = false
      flightHUD.crashFlash = 0
      flightHUD.heading = yawRef.current
      resetFlightInput()
      renderer.domElement.style.filter = ''
      flightElapsedMs = 0
      nextAmbientDialogueAtMs = 48000 + Math.random() * 22000
      const launchLine = pickRobotLine(ROBOT_DIALOGUE.launch, lastAmbientLine)
      lastAmbientLine = launchLine
      queueFlightMessage(launchLine)
      suppressInitialSaturnWarning = true
    }

    const clearFrontierSectors = () => {
      frontierSectors.forEach((sector) => {
        scene.remove(sector.root)
        sector.root.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose()
            const material = obj.material as THREE.Material | THREE.Material[]
            if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
            else material.dispose()
          } else if (obj instanceof THREE.Points) {
            obj.geometry.dispose()
            ;(obj.material as THREE.Material).dispose()
          } else if (obj instanceof THREE.Sprite) {
            const material = obj.material as THREE.Material
            material.dispose()
          }
        })
      })
      frontierSectors.clear()
      frontierBodies.length = 0
      frontierRingHazards.length = 0
      frontierEntryAnnouncedRef.current = false
      frontierLastSectorKeyRef.current = ''
      frontierLastAnnounceAtRef.current = 0
    }
    frontierCleanupRef.current = clearFrontierSectors

    const getAllBodies = () => bodies.concat(frontierBodies)
    const getAllRings = () => ringHazards.concat(frontierRingHazards)

    const sectorCoordsFromPosition = (position: THREE.Vector3) => ({
      x: Math.floor(position.x / FRONTIER.sectorSize),
      y: Math.floor(position.y / FRONTIER.sectorSize),
      z: Math.floor(position.z / FRONTIER.sectorSize),
    })

    const createFrontierSector = (coords: { x: number; y: number; z: number }) => {
      const key = `${coords.x},${coords.y},${coords.z}`
      const seed = hashSectorCoords(coords.x, coords.y, coords.z)
      const rng = mulberry32(seed)
      const theme = sectorThemeFromSeed(seed)
      const sectorRoot = new THREE.Group()
      sectorRoot.position.set(
        (coords.x + 0.5) * FRONTIER.sectorSize,
        (coords.y + 0.5) * FRONTIER.sectorSize,
        (coords.z + 0.5) * FRONTIER.sectorSize
      )
      sectorRoot.rotation.set((rng() - 0.5) * 0.2, rng() * Math.PI * 2, (rng() - 0.5) * 0.18)
      sectorRoot.scale.setScalar(0.92 + rng() * 0.16)

      const starCloud = createSeededStarLayer({
        rng,
        count: isMobile ? 260 : 560,
        radiusMin: FRONTIER.sectorSize * 0.08,
        radiusMax: FRONTIER.sectorSize * 0.6,
        size: 0.7 + rng() * 0.35,
        opacity: 0.14 + rng() * 0.18,
        palette: theme.starPalette,
      })
      sectorRoot.add(starCloud.points)

      const nebula = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createSectorNebulaTexture(theme.nebula, rng),
          transparent: true,
          depthWrite: false,
          opacity: 0.08 + rng() * 0.12,
          blending: THREE.AdditiveBlending,
        })
      )
      nebula.position.set((rng() - 0.5) * 2800, (rng() - 0.5) * 2200, (rng() - 0.5) * 2800)
      nebula.scale.set(2600 + rng() * 2200, 1800 + rng() * 1800, 1)
      sectorRoot.add(nebula)

      const bodyCount = FRONTIER.bodyMin + Math.floor(rng() * (FRONTIER.bodyMax - FRONTIER.bodyMin + 1))
      const sectorBodies: BodyInfo[] = []
      const sectorRings: RingHazard[] = []
      const localPlacements: Array<{ position: THREE.Vector3; radius: number }> = []
      const sectorLabel = `${coords.x}/${coords.y}/${coords.z}`

      for (let i = 0; i < bodyCount; i++) {
        let radius = 1.2 + rng() * 5.4
        if (i === 0) radius += 1.8

        let position = new THREE.Vector3()
        let attempts = 0
        while (attempts < 12) {
          const spread = i === 0 ? 4200 : 8600
          position = new THREE.Vector3(
            (rng() - 0.5) * spread,
            (rng() - 0.5) * spread * 0.72,
            (rng() - 0.5) * spread
          )
          const separated = localPlacements.every((entry) => entry.position.distanceTo(position) > entry.radius + radius + 1600)
          if (separated) break
          attempts += 1
        }

        const bodyNames = ['ROCKY WORLD', 'ICE WORLD', 'GAS GIANT', 'AURORA WORLD']
        const typeName = bodyNames[Math.min(bodyNames.length - 1, Math.floor(rng() * bodyNames.length))]
        const body = createSectorPlanet({
          root: sectorRoot,
          rng,
          name: `UNKNOWN SECTOR ${sectorLabel} ${String.fromCharCode(65 + i)}`,
          radius,
          position,
          palette: theme.bodyPalette,
          isMobile,
        })

        body.flightScale = Math.max(2.6, 2.2 + radius * 0.8)
        body.approachRange = radius * 13
        if (typeName === 'GAS GIANT') {
          body.flightScale *= 1.18
          if (body.atmosphere) {
            const atmosphereMaterial = body.atmosphere.material as THREE.MeshBasicMaterial
            atmosphereMaterial.opacity = Math.max(atmosphereMaterial.opacity, 0.06)
          }
        }

        localPlacements.push({ position, radius })
        sectorBodies.push(body)
        frontierBodies.push(body)

        if (i === 0 && rng() > 0.58) {
          const ringInner = radius * (1.5 + rng() * 0.2)
          const ringOuter = radius * (2.2 + rng() * 0.4)
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(ringInner, ringOuter, 40),
            new THREE.MeshBasicMaterial({
              color: new THREE.Color(theme.bodyPalette[0]).lerp(new THREE.Color('#ffffff'), 0.25),
              transparent: true,
              opacity: 0.28,
              side: THREE.DoubleSide,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
            })
          )
          ring.rotation.x = Math.PI / 2 - rng() * 0.28
          ring.rotation.y = rng() * 0.75
          body.root.add(ring)
          const ringInfo = {
            name: `UNKNOWN SECTOR ${sectorLabel} RING`,
            root: body.root,
            inner: ringInner,
            outer: ringOuter,
            thickness: 0.62,
          }
          sectorRings.push(ringInfo)
          frontierRingHazards.push(ringInfo)
        }
      }

      if (rng() > 0.4) {
        sectorRoot.add(
          new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: createSectorNebulaTexture(theme.haze, rng),
              transparent: true,
              depthWrite: false,
              opacity: 0.045 + rng() * 0.07,
              blending: THREE.AdditiveBlending,
            })
          )
        )
      }

      scene.add(sectorRoot)
      frontierSectors.set(key, {
        key,
        coords,
        root: sectorRoot,
        bodies: sectorBodies,
        ringHazards: sectorRings,
      })
    }

    const disposeFrontierSector = (key: string) => {
      const sector = frontierSectors.get(key)
      if (!sector) return
      scene.remove(sector.root)
      sector.root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          const material = obj.material as THREE.Material | THREE.Material[]
          if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
          else material.dispose()
        } else if (obj instanceof THREE.Points) {
          obj.geometry.dispose()
          ;(obj.material as THREE.Material).dispose()
        } else if (obj instanceof THREE.Sprite) {
          ;(obj.material as THREE.Material).dispose()
        }
      })

      sector.bodies.forEach((body) => {
        const index = frontierBodies.indexOf(body)
        if (index >= 0) frontierBodies.splice(index, 1)
      })
      sector.ringHazards.forEach((ring) => {
        const index = frontierRingHazards.indexOf(ring)
        if (index >= 0) frontierRingHazards.splice(index, 1)
      })
      frontierSectors.delete(key)
    }

    const updateFrontierSectors = () => {
      const chartedDistance = ship.position.length()
      const frontierActive = chartedDistance > FRONTIER.chartedRadius

      if (!frontierActive) {
        if (frontierSectors.size > 0) clearFrontierSectors()
        return
      }

      if (!frontierEntryAnnouncedRef.current) {
        const line = pickRobotLine(ROBOT_DIALOGUE.frontier, lastAmbientLine)
        lastAmbientLine = line
        queueFlightMessage(line)
        frontierEntryAnnouncedRef.current = true
        frontierLastAnnounceAtRef.current = flightElapsedMs
      }

      const coords = sectorCoordsFromPosition(ship.position)
      const wanted = new Set<string>()
      for (let dx = -FRONTIER.keepRadius; dx <= FRONTIER.keepRadius; dx++) {
        for (let dy = -FRONTIER.keepRadius; dy <= FRONTIER.keepRadius; dy++) {
          for (let dz = -FRONTIER.keepRadius; dz <= FRONTIER.keepRadius; dz++) {
            const key = `${coords.x + dx},${coords.y + dy},${coords.z + dz}`
            wanted.add(key)
            if (!frontierSectors.has(key)) {
              createFrontierSector({ x: coords.x + dx, y: coords.y + dy, z: coords.z + dz })
            }
          }
        }
      }

      frontierSectors.forEach((sector, key) => {
        if (!wanted.has(key)) disposeFrontierSector(key)
      })

      const currentKey = `${coords.x},${coords.y},${coords.z}`
      if (currentKey !== frontierLastSectorKeyRef.current) {
        frontierLastSectorKeyRef.current = currentKey
        if (flightElapsedMs - frontierLastAnnounceAtRef.current > FRONTIER.announceCooldownMs) {
          frontierLastAnnounceAtRef.current = flightElapsedMs
          const line = pickRobotLine(ROBOT_DIALOGUE.discovery, lastAmbientLine)
          lastAmbientLine = line
          queueFlightMessage(line)
        }
      }

    }

    stateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      controlLayer,
      ship,
      stars: starLayers.map((layer) => layer.points),
      starMaterials: starLayers.map((layer) => layer.material),
      bodies,
      ringHazards,
      resetOrbit,
    }

    const detectCollision = () => {
      for (const body of getAllBodies()) {
        const worldPos = body.root.getWorldPosition(bodyWorldPos)
        const bodyScale = modeRef.current === 'flight' ? getFlightScale(body) : 1
        const distance = ship.position.distanceTo(worldPos)
        if (distance <= body.radius * bodyScale * collisionScaleMult + collisionShipRadius) return true
      }

      for (const hazard of getAllRings()) {
        hazard.root.worldToLocal(localPoint.copy(ship.position))
        const radial = Math.hypot(localPoint.x, localPoint.z)
        if (Math.abs(localPoint.y) <= hazard.thickness && radial >= hazard.inner && radial <= hazard.outer) {
          return true
        }
      }

      return false
    }

    const maybeQueueAmbientDialogue = (nearestBody: BodyInfo, warpActive: boolean) => {
      if (flightCompanion.visible) return
      if (flightElapsedMs < nextAmbientDialogueAtMs) return

      const pools: Array<readonly string[]> = [ROBOT_DIALOGUE.facts, ROBOT_DIALOGUE.humor]
      if (warpActive) pools.push(ROBOT_DIALOGUE.mechanics, ROBOT_DIALOGUE.humor)
      if (nearestBody.name === 'SATURN' || nearestBody.name === 'EARTH' || ['VENUS', 'MARS', 'JUPITER', 'SUN'].includes(nearestBody.name)) {
        pools.push(ROBOT_DIALOGUE.facts)
      }
      if (nearestBody.name.startsWith('UNKNOWN SECTOR')) {
        pools.push(ROBOT_DIALOGUE.frontier, ROBOT_DIALOGUE.discovery)
      }
      if (Math.random() < 0.4) pools.push(ROBOT_DIALOGUE.mechanics)

      const selectedPool = pools[Math.floor(Math.random() * pools.length)]
      const line = pickRobotLine(selectedPool, lastAmbientLine)
      lastAmbientLine = line
      queueFlightMessage(line)
      nextAmbientDialogueAtMs = flightElapsedMs + 62000 + Math.random() * 62000
    }

    const animate = (now: number) => {
      const state = stateRef.current
      if (!state) return

      if (!lastTickRef.current) lastTickRef.current = now
      const dt = Math.min(40, now - lastTickRef.current)
      lastTickRef.current = now

      const activeMode = modeRef.current
      const orbitEnabled = activeMode === 'orbit' && isInteractive && !isGamePortalOpen
      state.controls.enabled = orbitEnabled
      state.controlLayer.style.pointerEvents = orbitEnabled ? 'auto' : 'none'

      bodies.forEach((body) => {
        body.root.scale.setScalar(activeMode === 'flight' ? getFlightScale(body) : 1)
        if (body.spinRate) (body.spinTarget ?? body.root).rotation.y += body.spinRate
      })
      ringParticles.rotation.y += 0.0004
      saturnRoot.rotation.y += 0.0001

      if (activeMode === 'flight') {
        if (!flightInitializedRef.current) {
          positionShipAtSpawn()
          flightInitializedRef.current = true
        }

        const input = flightInput
        flightElapsedMs += dt
        const jx = shapeFlightAxis(input.joystick.x)
        const jy = shapeFlightAxis(input.joystick.y)
        const selectedGear = input.driveGear

        yawRef.current += -jx * FLIGHT.yawRate
        pitchRef.current += -jy * FLIGHT.pitchRate
        pitchRef.current = THREE.MathUtils.clamp(pitchRef.current, -FLIGHT.pitchLimit, FLIGHT.pitchLimit)

        const visualRoll = jx * FLIGHT.rollAmount
        ship.rotation.set(pitchRef.current, yawRef.current, visualRoll, 'YXZ')
        tmpForward.copy(shipForwardLocal).applyQuaternion(ship.quaternion).normalize()

        const desiredSpeed = getGearSpeed(selectedGear)
        const currentSpeed = velocityRef.current.dot(tmpForward)
        const nextSpeed = THREE.MathUtils.lerp(currentSpeed, desiredSpeed, getGearResponse(selectedGear))
        velocityRef.current.copy(tmpForward).multiplyScalar(nextSpeed)

        const warpActive = selectedGear === 'WARP'
        ship.position.addScaledVector(velocityRef.current, warpActive ? FLIGHT.gearSpeeds.WARP : 1)

        const desiredFov = warpActive ? FLIGHT.fovWarp : FLIGHT.fovNormal
        camera.fov = THREE.MathUtils.lerp(camera.fov, desiredFov, 0.08)
        camera.updateProjectionMatrix()
        state.starMaterials[0].size = THREE.MathUtils.lerp(state.starMaterials[0].size, warpActive ? 1.2 : 0.9, 0.08)
        state.starMaterials[1].size = THREE.MathUtils.lerp(state.starMaterials[1].size, warpActive ? 2.05 : 1.45, 0.08)
        state.starMaterials[2].size = THREE.MathUtils.lerp(state.starMaterials[2].size, warpActive ? 3.3 : 2.4, 0.08)
        state.starMaterials[3].size = THREE.MathUtils.lerp(state.starMaterials[3].size, warpActive ? 2.7 : 1.8, 0.08)
        renderer.domElement.style.filter = warpActive ? 'blur(0.6px) saturate(1.15)' : ''

        state.stars[0].position.copy(ship.position).multiplyScalar(0.985)
        state.stars[1].position.copy(ship.position).multiplyScalar(0.99)
        state.stars[2].position.copy(ship.position).multiplyScalar(0.995)
        state.stars[3].position.copy(ship.position).multiplyScalar(0.992)
        nebulaSprites[0].position.copy(ship.position).add(new THREE.Vector3(-2400, 900, -4200).multiplyScalar(1))
        nebulaSprites[0].position.sub(ship.position).multiplyScalar(0.1).add(ship.position)
        nebulaSprites[1].position.copy(ship.position).add(new THREE.Vector3(3100, -1100, -2800).multiplyScalar(1))
        nebulaSprites[1].position.sub(ship.position).multiplyScalar(0.18).add(ship.position)
        nebulaSprites[2].position.copy(ship.position).add(new THREE.Vector3(900, 1800, 3600).multiplyScalar(1))
        nebulaSprites[2].position.sub(ship.position).multiplyScalar(0.08).add(ship.position)

        const forwardStrength = THREE.MathUtils.clamp(Math.max(0, nextSpeed) / FLIGHT.gearSpeeds.WARP, 0, 1)
        const reverseStrength = THREE.MathUtils.clamp(Math.max(0, -nextSpeed) / Math.abs(FLIGHT.gearSpeeds.R), 0, 1)
        engineGlowMaterial.opacity = Math.min(1, 0.26 + forwardStrength * 0.58 + (warpActive ? 0.24 : 0))
        thrusterGlow.scale.z = 0.58 + forwardStrength * 1.2 + (warpActive ? 1.1 : 0)
        engineLight.intensity = forwardStrength * 1.35 + (warpActive ? 1.0 : 0)
        reverseGlowMaterial.opacity = 0.08 + reverseStrength * 0.62
        reverseGlow.scale.z = 0.55 + reverseStrength * 1.05
        reverseLight.intensity = reverseStrength * 1.05

        updateFrontierSectors()

        const allBodies = getAllBodies()
        let nearestBody = allBodies[0] ?? bodies[0]
        let nearestDistance = Number.POSITIVE_INFINITY
        allBodies.forEach((body) => {
          const worldPos = body.root.getWorldPosition(bodyWorldPos)
          const scaledRadius = body.radius * getFlightScale(body)
          const distance = Math.max(0, ship.position.distanceTo(worldPos) - scaledRadius)
          if (distance < nearestDistance) {
            nearestDistance = distance
            nearestBody = body
          }

          if (body.glow) {
            const material = body.glow.material as THREE.MeshBasicMaterial
            const proximity = THREE.MathUtils.clamp(1 - distance / (body.approachRange * getFlightScale(body)), 0, 1)
            material.opacity = Math.max(material.opacity * 0.85, proximity * 0.26)
          }
        })

        if (suppressInitialSaturnWarning && (nearestBody.name !== 'SATURN' || ship.position.distanceTo(saturnCenter) > FLIGHT.spawn.length() * 1.25)) {
          suppressInitialSaturnWarning = false
        }

        const crashWarningThreshold = Math.max(
          120,
          nearestBody.approachRange * getFlightScale(nearestBody) * collisionScaleMult * 0.16
        )
        const canWarnForCrash =
          !hasShownCrashWarning && (!suppressInitialSaturnWarning || nearestBody.name !== 'SATURN')
        if (nearestDistance < crashWarningThreshold && canWarnForCrash) {
          queueFlightMessage('Friendly mechanical reminder: planets are solid. Let us admire this one from slightly farther away.')
          hasShownCrashWarning = true
        }

        maybeQueueAmbientDialogue(nearestBody, warpActive)

        if (detectCollision()) {
          queueFlightMessage('Boop. That counted as a crash. Resetting our approach before we embarrass ourselves twice.')
          positionShipAtSpawn()
        }

        tmpCameraPos.copy(FLIGHT.chaseOffset).applyQuaternion(ship.quaternion)
        const desiredCamera = ship.position.clone().add(tmpCameraPos)
        camera.position.copy(desiredCamera)
        tmpLookAt.copy(FLIGHT.lookAhead).applyQuaternion(ship.quaternion).add(ship.position)
        camera.lookAt(tmpLookAt)

        flightHUD.speed = parseFloat((nextSpeed * (warpActive ? FLIGHT.gearSpeeds.WARP : 1)).toFixed(2))
        flightHUD.nearest = nearestBody.name
        flightHUD.earthDist = Math.max(
          0,
          ship.position.distanceTo(earth.root.getWorldPosition(bodyWorldPos)) - earth.radius * getFlightScale(earth)
        )
        flightHUD.warpActive = warpActive
        flightHUD.crashFlash = 0
        flightHUD.heading = yawRef.current
        const frontierMarkerBodies = frontierBodies
          .map((body) => ({
            body,
            distance: ship.position.distanceTo(body.root.getWorldPosition(bodyWorldPos)),
          }))
          .filter(({ distance }) => distance < FRONTIER.sectorSize * 1.8)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 4)
          .map(({ body }) => body)
        const markerBodies = [
          ...bodies.filter((body) => ['SATURN', 'EARTH', 'SUN', 'JUPITER', 'MARS', 'VENUS'].includes(body.name)),
          ...frontierMarkerBodies,
        ]
        flightHUD.hudMarkers = markerBodies.map((body) => {
          const worldPos = body.root.getWorldPosition(bodyWorldPos)
          const distance = Math.max(0, ship.position.distanceTo(worldPos) - body.radius * getFlightScale(body))
          bodyLocalPos.copy(worldPos)
          camera.worldToLocal(bodyLocalPos)
          const behind = bodyLocalPos.z > 0

          const projected = worldPos.clone().project(camera)
          let x = projected.x
          let y = projected.y

          if (behind) {
            x = -x
            y = -y
          }

          const edgePadding = 0.08
          const safeX = THREE.MathUtils.clamp((x + 1) / 2, edgePadding, 1 - edgePadding)
          const safeY = THREE.MathUtils.clamp((1 - y) / 2, edgePadding, 1 - edgePadding)
          const onScreen = !behind && projected.x >= -1 && projected.x <= 1 && projected.y >= -1 && projected.y <= 1

          return {
            name: body.name,
            color: body.mapColor,
            x: safeX,
            y: safeY,
            onScreen,
            behind,
            distance,
          }
        })
      } else {
        ship.visible = false
        flightHUD.hudMarkers = []
        state.controls.update()
      }

      renderer.render(scene, camera)
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    const handleResize = () => {
      const newWidth = container.clientWidth || window.innerWidth
      const newHeight = container.clientHeight || window.innerHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      cancelAnimationFrame(frameRef.current)
      resetFlightInput()
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
      controls.dispose()
      renderer.dispose()
      controlLayer.remove()
      renderer.domElement.remove()
      frontierCleanupRef.current?.()
      stateRef.current = null
      lastTickRef.current = 0
    }
  }, [isInteractive, isMobile, isGamePortalOpen, onSceneReady])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
}
