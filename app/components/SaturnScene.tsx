'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  flightCompanion,
  flightHUD,
  flightInput,
  queueFlightMessage,
  resetFlightInput,
  type DriveGear,
  type FlightMarkerCategory,
} from './flightInput'

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

const REAL_RADII_KM = {
  SUN: 695700,
  MERCURY: 2439.7,
  VENUS: 6051.8,
  EARTH: 6371,
  MOON: 1737.4,
  MARS: 3389.5,
  CERES: 473,
  JUPITER: 69911,
  IO: 1821.6,
  EUROPA: 1560.8,
  SATURN: 58232,
  TITAN: 2574.7,
  ENCELADUS: 252.1,
  URANUS: 25362,
  NEPTUNE: 24622,
  PLUTO: 1188.3,
} as const

const CHARTED_BODY_FLIGHT_SCALE = 3.8
const MOON_STYLE_EXPONENT = 0.68
const MOON_STYLE_OFFSET = 0.22
const MOON_STYLE_MULTIPLIER = 2.05
const DWARF_BODY_STYLE_EXPONENT = 0.72
const DWARF_BODY_STYLE_OFFSET = 0.14
const DWARF_BODY_STYLE_MULTIPLIER = 1.45
const SOLAR_SYSTEM_DISTANCE_SCALE = 1.75
const SUB_WARP_GEAR_SPEEDS = {
  R: -0.42,
  '1': 0.46,
  '2': 0.78,
  '3': 1.12,
} as const

function strictRadiusFromSaturn(bodyKmRadius: number) {
  return SATURN.radius * (bodyKmRadius / REAL_RADII_KM.SATURN)
}

function stylizedMoonRadiusFromSaturn(bodyKmRadius: number) {
  const strictRadius = strictRadiusFromSaturn(bodyKmRadius)
  return MOON_STYLE_OFFSET + MOON_STYLE_MULTIPLIER * Math.pow(strictRadius, MOON_STYLE_EXPONENT)
}

function stylizedDwarfRadiusFromSaturn(bodyKmRadius: number) {
  const strictRadius = strictRadiusFromSaturn(bodyKmRadius)
  return DWARF_BODY_STYLE_OFFSET + DWARF_BODY_STYLE_MULTIPLIER * Math.pow(strictRadius, DWARF_BODY_STYLE_EXPONENT)
}

function scaleSolarDistance(distance: number) {
  return distance * SOLAR_SYSTEM_DISTANCE_SCALE
}

const FLIGHT = {
  gearSpeeds: {
    // Keep sub-warp deliberate for close observation while leaving WARP unchanged.
    R: SUB_WARP_GEAR_SPEEDS.R,
    '0': 0,
    '1': SUB_WARP_GEAR_SPEEDS['1'],
    '2': SUB_WARP_GEAR_SPEEDS['2'],
    '3': SUB_WARP_GEAR_SPEEDS['3'],
    WARP: 2.3 * SOLAR_SYSTEM_DISTANCE_SCALE,
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
  chartedRadius: scaleSolarDistance(36000),
  sectorSize: scaleSolarDistance(22000),
  keepRadius: 1,
  bodyMin: 1,
  bodyMax: 4,
  announceCooldownMs: 52000,
}

const SOLAR = {
  orbitTimeScale: 0.000018,
  earthOrbitRadius: scaleSolarDistance(1360),
  heliopauseRadius: scaleSolarDistance(78000),
}

const CHARTED_MARKER_NAMES = new Set([
  'SUN',
  'MERCURY',
  'VENUS',
  'EARTH',
  'MOON',
  'MARS',
  'CERES',
  'JUPITER',
  'IO',
  'EUROPA',
  'SATURN',
  'TITAN',
  'ENCELADUS',
  'URANUS',
  'NEPTUNE',
  'PLUTO',
])

const PLANET_MARKER_NAMES = new Set(['SUN', 'MERCURY', 'VENUS', 'EARTH', 'MARS', 'JUPITER', 'SATURN', 'URANUS', 'NEPTUNE'])
const MOON_MARKER_NAMES = new Set(['MOON', 'IO', 'EUROPA', 'TITAN', 'ENCELADUS'])
const PHENOMENA_MARKER_NAMES = new Set(['CERES', 'PLUTO', 'PSYCHE'])

const COMPANION_REGION_COOLDOWN_MS = 180000

function getMarkerCategory(bodyName: string): FlightMarkerCategory {
  if (PLANET_MARKER_NAMES.has(bodyName)) return 'planet'
  if (MOON_MARKER_NAMES.has(bodyName)) return 'moon'
  if (PHENOMENA_MARKER_NAMES.has(bodyName) || bodyName.startsWith('UNKNOWN SECTOR')) return 'phenomena'
  return 'phenomena'
}

const REGION_DIALOGUE = {
  sun: [
    'The Sun is a G-type main-sequence star. In vacuum, it reads white.',
    'The Sun contains 99.86% of the total mass of this solar system.',
    'Its core fuses roughly 600 million tons of hydrogen into helium every second.',
    'Energy made in the core can take between 10,000 and 170,000 years to reach the surface.',
    'The corona is hotter than the photosphere, reaching over one million degrees Celsius.',
    'The solar wind carries charged particles outward at roughly 400 to 800 kilometers per second.',
    'Solar rotation is differential. The equator turns in about 25 days. The poles take closer to 35.',
    'The Sun converts roughly four million tons of matter into energy every second.',
    'Its magnetic field reverses polarity about every eleven years.',
    'Solar flares can reach temperatures near 100 million degrees Celsius.',
    'The heliospheric current sheet is the largest structure in the solar system. It is shaped like a spinning skirt.',
    'The Sun should remain on the main sequence for another five billion years.',
  ],
  mercury: [
    'Mercury has a metallic core accounting for about 85% of the planet’s radius.',
    'Mercury is locked in a 3:2 spin-orbit resonance. It rotates three times for every two orbits of the Sun.',
    'Water ice survives inside permanently shadowed polar craters.',
    'Surface temperatures run from about negative 180 degrees Celsius at night to 430 in daylight.',
    'Mercury has the most eccentric orbit of the major planets.',
    'It is the second-densest planet in the solar system, behind Earth.',
    'Mercury has a global magnetic field about one percent as strong as Earth’s.',
    'Its exosphere contains sodium, magnesium, and calcium, continually replenished by the solar wind.',
    'Mercury trails a sodium tail that extends millions of kilometers away from the Sun.',
    'The Caloris Basin is roughly 1,550 kilometers wide, formed by a major early impact.',
    'Hollows on Mercury are bright, shallow depressions likely formed by sublimation.',
    'Mercury’s average orbital speed is 47.36 kilometers per second, the fastest in the system.',
  ],
  venus: [
    'Venus rotates retrograde, opposite the direction of most planets.',
    'A day on Venus is longer than its year. Rotation takes 243 Earth days. Orbit takes 225.',
    'Its atmosphere is about 96.5% carbon dioxide with clouds of sulfuric acid.',
    'Surface pressure is roughly 9.2 megapascals, comparable to pressure 900 meters underwater on Earth.',
    'Venus is the hottest planet in the solar system because of a runaway greenhouse effect.',
    'Its mean surface temperature is about 464 degrees Celsius, hot enough to melt lead.',
    'Venus reflects most of the sunlight that hits it. Its albedo is about 0.7.',
    'Upper-atmosphere winds reach around 360 kilometers per hour, far faster than the planet rotates.',
    'Venus has no intrinsic magnetic field.',
    'The planet likely underwent large-scale resurfacing between 300 and 600 million years ago.',
    'Venus and Earth are close in size, mass, and composition. Similar ingredients. Different outcome.',
    'The atmosphere super-rotates around the planet in about four Earth days.',
  ],
  earthMoon: [
    'Earth is the only known planet with stable bodies of liquid water on its surface.',
    'Its atmosphere is roughly 78% nitrogen, 21% oxygen, and 1% other gases.',
    'Earth’s magnetosphere helps shield the surface from high-energy solar and cosmic radiation.',
    'Earth is the only known planet with active plate tectonics.',
    'The Moon is in synchronous rotation with Earth, always showing one face.',
    'Tidal friction causes the Moon to recede from Earth at roughly 3.8 centimeters per year.',
    'The Moon helps stabilize Earth’s axial tilt.',
    'Lunar regolith is made of sharp abrasive fragments produced by billions of years of impacts.',
    'The Giant Impact Hypothesis proposes the Moon formed from debris after a collision with a Mars-sized body.',
    'Earth’s geocorona extends roughly 100,000 kilometers into space.',
    'The South Pole-Aitken basin is the largest and oldest confirmed impact basin on the Moon.',
    'The Moon’s gravity is about 16.6% of Earth’s.',
    'Earth’s orbital speed is about 29.78 kilometers per second.',
    'The Moon has only an exosphere, too thin to count as an atmosphere in any ordinary sense.',
  ],
  mars: [
    'Mars gets its color from oxidized iron-rich minerals.',
    'Olympus Mons is the largest shield volcano in the solar system, about 21 kilometers high.',
    'Valles Marineris stretches about 4,000 kilometers and cuts as deep as seven.',
    'Mars has a thin atmosphere, roughly 95% carbon dioxide, with a surface pressure about 0.6% of Earth’s.',
    'Phobos orbits closer to its planet than any other major moon in the solar system.',
    'Martian dust makes the sky appear pinkish-red, while sunsets can look blue.',
    'Geomorphology on Mars indicates it once held standing bodies of liquid water.',
    'Global dust storms can shroud the entire planet for months.',
    'Mars has surface gravity about 38% that of Earth.',
    'The InSight lander detected marsquakes, confirming the planet is still seismically active.',
    'Curiosity found organic molecules preserved in three-billion-year-old mudstones.',
    'Mars has no global magnetic field, only localized crustal anomalies.',
    'Its axial tilt is 25.19 degrees, close to Earth’s.',
    'The MOXIE instrument on Perseverance successfully produced oxygen from Martian carbon dioxide.',
  ],
  asteroidBelt: [
    'The average distance between major asteroids in the belt is roughly one million kilometers.',
    'The total mass of the asteroid belt is only about four percent of the Moon’s mass.',
    'Ceres contains roughly 31% of the belt’s total mass.',
    'Vesta is the second most massive object there and can be seen with the naked eye under the right conditions.',
    'The main asteroid classes are carbonaceous, silicaceous, and metallic.',
    'Sixteen Psyche may be the exposed metallic core of a failed protoplanet.',
    'Kirkwood Gaps are carved by orbital resonances with Jupiter.',
    'Many asteroids are rubble piles, fragments held together by gravity rather than strength.',
    'Bright spots in Ceres’ Occator Crater are composed of sodium carbonate salts.',
    'The belt marks the frost line, where volatile compounds could condense into solid ice during system formation.',
    'Hydrothermal activity may once have occurred on Ceres.',
    'Active asteroids keep asteroid-like orbits while showing comet-like behavior.',
  ],
  jupiterSystem: [
    'Jupiter is 318 times more massive than Earth.',
    'It is more than two and a half times as massive as all the other planets combined.',
    'The Great Red Spot is an anticyclonic storm larger than Earth’s diameter.',
    'Jupiter rotates in about 9 hours and 55 minutes, the shortest day of any planet.',
    'Its magnetic field is generated by a deep layer of liquid metallic hydrogen.',
    'Io is the most geologically active body in the solar system, with hundreds of active volcanoes.',
    'Europa’s ice crust is thought to overlie a liquid ocean.',
    'Ganymede is the largest moon in the solar system and has its own magnetic field.',
    'Callisto is among the most heavily cratered surfaces known.',
    'Jupiter radiates about 1.6 times the energy it receives from the Sun.',
    'Its magnetotail extends all the way to the orbit of Saturn.',
    'Radiation near the inner Jovian system is lethal to unshielded biology and electronics.',
    'Jupiter’s atmosphere is about 90% hydrogen and 10% helium by number of atoms.',
    'Jupiter’s gravity strongly influences the trajectories of comets and asteroids throughout the inner system.',
  ],
  saturnSystem: [
    'Saturn is the least dense planet in the solar system. Its average density is lower than water.',
    'The ring system extends out to roughly 282,000 kilometers from the planet.',
    'The rings are composed of about 99.9% water ice.',
    'Though broad, the main rings are typically only about ten meters thick.',
    'Enceladus ejects water vapor and ice into space, feeding the E-ring.',
    'Titan is the only moon in the solar system with a dense atmosphere and stable surface liquids.',
    'Titan’s lakes and seas are made of liquid methane and ethane.',
    'A persistent hexagonal cloud pattern sits over Saturn’s north pole.',
    'Equatorial wind speeds on Saturn can reach about 1,800 kilometers per hour.',
    'The Cassini Division is roughly 4,800 kilometers wide between the A and B rings.',
    'Saturn’s magnetic field is almost perfectly aligned with its rotation axis.',
    'Spokes in Saturn’s rings are likely caused by electrostatic levitation of dust.',
    'The rings may be only 10 to 100 million years old and are expected to dissipate over time.',
    'Hyperion rotates chaotically, and Iapetus carries a dramatic two-tone surface.',
  ],
  uranusSystem: [
    'Uranus has an axial tilt of 97.77 degrees, effectively rolling around the Sun on its side.',
    'It was the first planet discovered with a telescope, by William Herschel in 1781.',
    'Uranus takes 84 Earth years to orbit the Sun.',
    'Sunlight there is about 400 times dimmer than at Earth’s orbit.',
    'It is classified as an ice giant because of its high fraction of water, methane, and ammonia ices.',
    'The magnetic field is tilted 59 degrees from the rotation axis and offset from the center.',
    'Its magnetic tail forms a corkscrew shape because of the planet’s extreme tilt.',
    'Carbon may compress into diamond rain deep inside Uranus.',
    'Unlike Jupiter and Saturn, Uranus does not appear to radiate a strong internal heat surplus.',
    'Its major moon Miranda shows some of the strangest geology in the outer solar system, including canyons about 20 kilometers deep.',
    'Ariel appears to have a bright surface with evidence of recent tectonic resurfacing.',
    'Uranus’s ring system is relatively opaque compared with Jupiter’s dusty rings.',
  ],
  neptuneSystem: [
    'Neptune has the strongest sustained winds in the solar system, measured at up to 2,100 kilometers per hour.',
    'Its deep blue color likely requires something beyond methane alone.',
    'Neptune was predicted mathematically before it was ever observed.',
    'It is the most distant major planet, orbiting at about 30 astronomical units from the Sun.',
    'Neptune takes about 164.8 Earth years to complete one orbit.',
    'Its magnetic field is tilted 47 degrees relative to the rotation axis.',
    'Neptune radiates about 2.6 times the energy it receives from the Sun.',
    'Triton is the only large moon in the solar system with a retrograde orbit.',
    'Triton erupts nitrogen geysers and remains geologically active.',
    'Voyager 2 is still the only spacecraft to have flown past Neptune.',
    'Neptune’s ring arcs are named Liberté, Égalité, Fraternité, and Courage.',
    'Triton may eventually cross Neptune’s Roche limit and break apart into a ring.',
  ],
  kuiperBeltPluto: [
    'The Kuiper Belt begins beyond Neptune and extends to roughly 50 astronomical units.',
    'Pluto’s surface includes a nitrogen-ice glacier called Sputnik Planitia.',
    'Pluto and Charon are tidally locked, always facing one another.',
    'Water ice on Pluto behaves like bedrock at those temperatures.',
    'Pluto’s atmosphere expands near perihelion and collapses back out as it moves away from the Sun.',
    'New Horizons passed within about 12,500 kilometers of Pluto in July 2015.',
    'Short-period comets generally originate in the Kuiper Belt.',
    'Sunlight at Pluto is about one fifteen-hundredth as intense as it is at Earth.',
    'Pluto has cryovolcanoes, including features such as Wright Mons.',
    'Charon’s northern polar region is reddened by tholins derived from Pluto.',
    'Most Kuiper Belt objects are reddish from radiation processing of methane-rich ices.',
    'Arrokoth was the first contact-binary Kuiper Belt object visited by spacecraft.',
    'Haumea has a ring. Quaoar has a ring outside its Roche limit.',
    'The belt contains hundreds of thousands of objects larger than 100 kilometers across.',
  ],
  cometsOort: [
    'A comet’s ion tail always points directly away from the Sun.',
    'The coma forms as volatile material sublimates from the nucleus near the Sun.',
    'The Oort Cloud is a theoretical spherical reservoir of icy bodies at the outer edge of the system.',
    'Its outer limit may approximate the gravitational boundary of the solar system.',
    'Long-period comets can take millions of years to complete a single orbit.',
    'Comet nuclei are among the darkest objects in the solar system.',
    'Comets contain complex organic molecules, including amino acids such as glycine.',
    'Most meteor showers occur when Earth moves through debris left by a comet.',
    'Passing stars can perturb Oort Cloud objects inward.',
    'Comet tails can extend more than 100 million kilometers.',
    'The nucleus of comet 67P was measured as low density, light enough to float in water.',
    'Centaurs orbit between Jupiter and Neptune and behave like hybrids of asteroids and comets.',
    'The heliopause is where the outward pressure of the solar wind yields to the interstellar medium.',
    'Objects in the Oort Cloud may be separated by tens of millions of kilometers.',
  ],
  deepAstrophysics: [
    'Gravity follows the inverse-square law. Double the distance and the pull falls to one quarter.',
    'Quantum tunneling is one reason fusion can proceed in the Sun’s core.',
    'Blackbody radiation sets planetary equilibrium temperature as a function of distance and reflectivity.',
    'Conservation of angular momentum is why the solar system formed from a flattened disk.',
    'Hydrostatic equilibrium is the balance between gravity and internal pressure.',
    'The Roche limit defines how close a self-gravitating body can approach before tides can tear it apart.',
    'A barycenter is the center of mass around which two or more bodies orbit.',
    'The Jupiter-Sun barycenter lies just outside the Sun’s surface.',
    'Lagrange points are positions where gravity and orbital motion create relatively stable geometry.',
    'The Poynting-Robertson effect causes dust to slowly spiral inward toward the Sun.',
    'Differential rotation means different latitudes of a fluid body can rotate at different speeds.',
    'Spectroscopy is how chemistry is extracted from light.',
    'The solar system formed about 4.6 billion years ago from a giant molecular cloud.',
    'The solar system moves through the Milky Way at about 220 kilometers per second.',
    'The heliosphere is a protective bubble carved out by the solar wind.',
    'The Parker spiral is the shape of the Sun’s magnetic field as rotation drags it through space.',
    'Plasma makes up most of the visible universe.',
    'A parsec is about 3.26 light-years.',
    'The astronomical unit is defined as 149,597,870.7 kilometers.',
    'The solar system takes about 230 million years to orbit the galactic center once.',
    'Precession is the slow change in the orientation of a rotating axis.',
    'Earth’s precession cycle takes about 26,000 years.',
    'A Hill sphere is the region where a planet’s gravity dominates the motion of satellites.',
    'Cryovolcanism is the eruption of volatiles such as water, ammonia, or methane instead of molten rock.',
    'Dark matter dominates galactic mass budgets, but within the solar system its dynamical effect is negligible.',
    'The cosmic microwave background is relic radiation from the early universe.',
    'Gravitational lensing is light bent by mass.',
    'Redshift shifts light toward longer wavelengths when source and observer separate, or when space itself stretches.',
    'The local interstellar medium beyond the heliopause is called the Very Local Interstellar Medium.',
    'The interstellar medium is mostly gas with a small fraction of dust, but the dust matters far beyond its mass.',
  ],
} as const

type RegionKey = keyof typeof REGION_DIALOGUE

function shuffleLines(lines: readonly string[]) {
  const shuffled = [...lines]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

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
  orbit?: {
    center?: THREE.Vector3
    centerBody?: BodyInfo
    radius: number
    periodDays: number
    phase: number
    vertical?: number
    inclination?: number
  }
  baseGlowOpacity?: number
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

function createCraterTexture(base: string, accent: string, width = 512, height = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  ctx.fillStyle = base
  ctx.fillRect(0, 0, width, height)

  for (let i = 0; i < 90; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const r = 3 + Math.random() * 18
    ctx.strokeStyle = Math.random() > 0.45 ? accent : 'rgba(0,0,0,0.35)'
    ctx.lineWidth = 1 + Math.random() * 2
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.stroke()
    if (Math.random() > 0.65) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.beginPath()
      ctx.arc(x + r * 0.25, y + r * 0.25, r * 0.55, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.16)'
    ctx.fillRect(Math.random() * width, Math.random() * height, 1 + Math.random() * 2, 1 + Math.random() * 2)
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

function createMarsTexture(width = 1024, height = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  ctx.fillStyle = '#b76543'
  ctx.fillRect(0, 0, width, height)

  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = i % 3 === 0 ? 'rgba(232,170,105,0.34)' : 'rgba(78,41,28,0.26)'
    ctx.beginPath()
    ctx.ellipse(Math.random() * width, Math.random() * height, 18 + Math.random() * 80, 4 + Math.random() * 18, Math.random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.strokeStyle = 'rgba(42,24,22,0.76)'
  ctx.lineWidth = 10
  ctx.beginPath()
  for (let i = 0; i < 11; i++) {
    const x = width * (0.18 + i * 0.066)
    const y = height * (0.5 + Math.sin(i * 1.3) * 0.075)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  ctx.fillStyle = 'rgba(245,214,178,0.82)'
  ctx.beginPath()
  ctx.ellipse(width * 0.72, height * 0.42, 46, 18, -0.4, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function createEuropaTexture(width = 768, height = 384) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  ctx.fillStyle = '#e9edf0'
  ctx.fillRect(0, 0, width, height)

  for (let i = 0; i < 32; i++) {
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(116,58,45,0.7)' : 'rgba(150,86,64,0.42)'
    ctx.lineWidth = 1 + Math.random() * 3
    ctx.beginPath()
    const y = Math.random() * height
    ctx.moveTo(0, y)
    for (let x = 0; x <= width; x += 70) ctx.lineTo(x, y + Math.sin(x * 0.018 + i) * 20 + (Math.random() - 0.5) * 18)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function createIoTexture(width = 768, height = 384) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  ctx.fillStyle = '#d9bd55'
  ctx.fillRect(0, 0, width, height)
  for (let i = 0; i < 180; i++) {
    ctx.fillStyle = ['rgba(50,44,24,0.32)', 'rgba(236,214,82,0.38)', 'rgba(118,153,67,0.28)'][i % 3]
    ctx.beginPath()
    ctx.ellipse(Math.random() * width, Math.random() * height, 8 + Math.random() * 42, 5 + Math.random() * 22, Math.random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
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

function getOrbitPosition({
  center,
  radius,
  phase,
  vertical = 0,
  inclination = 0,
}: {
  center: THREE.Vector3
  radius: number
  phase: number
  vertical?: number
  inclination?: number
}) {
  return new THREE.Vector3(
    center.x + Math.cos(phase) * radius,
    center.y + vertical + Math.sin(phase) * radius * Math.sin(inclination),
    center.z + Math.sin(phase) * radius * Math.cos(inclination)
  )
}

function createPlume({
  color,
  height,
  count,
}: {
  color: string
  height: number
  count: number
}) {
  const group = new THREE.Group()
  const plumeColor = new THREE.Color(color)

  for (let i = 0; i < count; i++) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        color: plumeColor,
        transparent: true,
        opacity: 0.08 + Math.random() * 0.09,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    sprite.position.set((Math.random() - 0.5) * 0.4, height * (0.32 + Math.random() * 0.68), (Math.random() - 0.5) * 0.4)
    const scale = height * (0.16 + Math.random() * 0.2)
    sprite.scale.set(scale, scale * 1.8, 1)
    group.add(sprite)
  }

  return group
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
  const companionRegionRef = useRef<RegionKey | null>(null)
  const pendingRegionRef = useRef<RegionKey | null>(null)
  const lastCompanionAtRef = useRef(-COMPANION_REGION_COOLDOWN_MS)
  const lastCompanionLineRef = useRef<string | null>(null)
  const regionPoolRef = useRef(new Map<RegionKey, string[]>())

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
      companionRegionRef.current = null
      pendingRegionRef.current = null
      lastCompanionAtRef.current = -COMPANION_REGION_COOLDOWN_MS
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
      companionRegionRef.current = null
      pendingRegionRef.current = null
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

    const solarCenter = new THREE.Vector3(-scaleSolarDistance(13800), 20, 0)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xfff6e0, 1.45)
    sunLight.position.copy(solarCenter)
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
      orbit?: BodyInfo['orbit']
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
        orbit: opts.orbit,
        baseGlowOpacity: opts.glowOpacity ?? 0,
      })
    }

    const sun = makePlanet({
      name: 'SUN',
      position: solarCenter.clone(),
      radius: strictRadiusFromSaturn(REAL_RADII_KM.SUN),
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1.18,
      roughness: 0.5,
      glowColor: 0xffffff,
      glowOpacity: 0.32,
      mapColor: '#ffffff',
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      spinRate: 0.0003,
      approachRange: 180,
    })

    const sunCoronaRadius = sun.radius * 3
    const corona = createPlanetGlow(sunCoronaRadius, 0xdff5ff, 0.11, Math.max(32, sphereSegments / 2))
    sun.root.add(corona)
    for (let i = 0; i < 5; i++) {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(
          sun.radius * (1.33 + i * 0.22),
          Math.max(0.08, sun.radius * 0.0045),
          6,
          40,
          Math.PI * (0.55 + Math.random() * 0.35)
        ),
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xffffff : 0xffd7a0,
          transparent: true,
          opacity: 0.18,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
      arc.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      sun.root.add(arc)
    }

    makePlanet({
      name: 'MERCURY',
      position: getOrbitPosition({
        center: solarCenter,
        radius: scaleSolarDistance(520),
        phase: -0.42,
        vertical: scaleSolarDistance(8),
        inclination: 0.07,
      }),
      radius: strictRadiusFromSaturn(REAL_RADII_KM.MERCURY),
      texture: createCraterTexture('#5b5750', '#d8d0c3'),
      mapColor: '#9f9488',
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      roughness: 1,
      spinRate: 0.0018,
      approachRange: 180,
      orbit: {
        center: solarCenter,
        radius: scaleSolarDistance(520),
        periodDays: 88,
        phase: -0.42,
        vertical: scaleSolarDistance(8),
        inclination: 0.07,
      },
    })

    makePlanet({
      name: 'VENUS',
      position: getOrbitPosition({
        center: solarCenter,
        radius: scaleSolarDistance(920),
        phase: 0.28,
        vertical: scaleSolarDistance(-16),
        inclination: 0.02,
      }),
      radius: strictRadiusFromSaturn(REAL_RADII_KM.VENUS),
      texture: createGradientTexture([
        { at: 0, color: '#f7efd7' },
        { at: 0.46, color: '#f0dfad' },
        { at: 1, color: '#fff7dc' },
      ]),
      emissive: 0x6d542b,
      emissiveIntensity: 0.18,
      mapColor: '#fff0bd',
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      roughness: 0.92,
      glowColor: 0xfff0bd,
      glowOpacity: 0.13,
      atmosphereColor: 0xfff0bd,
      atmosphereOpacity: 0.09,
      spinRate: 0.0011,
      approachRange: 240,
      orbit: {
        center: solarCenter,
        radius: scaleSolarDistance(920),
        periodDays: 224.7,
        phase: 0.28,
        vertical: scaleSolarDistance(-16),
        inclination: 0.02,
      },
    })

    const earth = makePlanet({
      name: 'EARTH',
      position: getOrbitPosition({
        center: solarCenter,
        radius: SOLAR.earthOrbitRadius,
        phase: 0.95,
        vertical: scaleSolarDistance(6),
        inclination: 0.03,
      }),
      radius: strictRadiusFromSaturn(REAL_RADII_KM.EARTH),
      texture: createEarthTexture(),
      emissive: 0x0f2a55,
      emissiveIntensity: 0.14,
      mapColor: '#73b7ff',
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      roughness: 0.84,
      glowColor: 0x8ad6ff,
      glowOpacity: 0.09,
      atmosphereColor: 0x91dcff,
      atmosphereOpacity: 0.075,
      spinRate: 0.0019,
      approachRange: 300,
      orbit: {
        center: solarCenter,
        radius: SOLAR.earthOrbitRadius,
        periodDays: 365.25,
        phase: 0.95,
        vertical: scaleSolarDistance(6),
        inclination: 0.03,
      },
    })

    makePlanet({
      name: 'MOON',
      position: getOrbitPosition({
        center: earth.root.position as THREE.Vector3,
        radius: scaleSolarDistance(90),
        phase: 1.1,
        vertical: scaleSolarDistance(2),
        inclination: 0.08,
      }),
      radius: stylizedMoonRadiusFromSaturn(REAL_RADII_KM.MOON),
      texture: createCraterTexture('#777a80', '#c4c8cc', 512, 256),
      mapColor: '#b4b7bb',
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      roughness: 1,
      spinRate: 0.0008,
      approachRange: 120,
      orbit: {
        centerBody: earth,
        radius: scaleSolarDistance(90),
        periodDays: 27.3,
        phase: 1.1,
        vertical: scaleSolarDistance(2),
        inclination: 0.08,
      },
    })

    makePlanet({
      name: 'MARS',
      position: getOrbitPosition({
        center: solarCenter,
        radius: scaleSolarDistance(2120),
        phase: -0.62,
        vertical: scaleSolarDistance(-30),
        inclination: 0.06,
      }),
      radius: strictRadiusFromSaturn(REAL_RADII_KM.MARS),
      texture: createMarsTexture(),
      emissive: 0x2c120a,
      emissiveIntensity: 0.08,
      mapColor: '#d06d4b',
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      glowColor: 0xcc724a,
      glowOpacity: 0.05,
      atmosphereColor: 0xd46f4b,
      atmosphereOpacity: 0.035,
      spinRate: 0.0014,
      approachRange: 220,
      orbit: {
        center: solarCenter,
        radius: scaleSolarDistance(2120),
        periodDays: 687,
        phase: -0.62,
        vertical: scaleSolarDistance(-30),
        inclination: 0.06,
      },
    })

    const ceres = makePlanet({
      name: 'CERES',
      position: getOrbitPosition({
        center: solarCenter,
        radius: scaleSolarDistance(4100),
        phase: 1.52,
        vertical: scaleSolarDistance(42),
        inclination: 0.18,
      }),
      radius: stylizedDwarfRadiusFromSaturn(REAL_RADII_KM.CERES),
      texture: createCraterTexture('#4d4e50', '#8a8d90', 512, 256),
      mapColor: '#85888c',
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      roughness: 1,
      spinRate: 0.0013,
      approachRange: 160,
      orbit: {
        center: solarCenter,
        radius: scaleSolarDistance(4100),
        periodDays: 1682,
        phase: 1.52,
        vertical: scaleSolarDistance(42),
        inclination: 0.18,
      },
    })
    ceres.root.scale.set(1.16, 0.92, 1)

    makePlanet({
      name: 'PSYCHE',
      position: getOrbitPosition({
        center: solarCenter,
        radius: scaleSolarDistance(4550),
        phase: -1.05,
        vertical: scaleSolarDistance(-70),
        inclination: 0.13,
      }),
      radius: 0.72,
      texture: createRockTexture('#594338', '#b47d5c', 512, 256),
      mapColor: '#b47d5c',
      flightScale: 3.9,
      roughness: 0.72,
      metalness: 0.22,
      spinRate: 0.0021,
      approachRange: 130,
      orbit: {
        center: solarCenter,
        radius: scaleSolarDistance(4550),
        periodDays: 1825,
        phase: -1.05,
        vertical: scaleSolarDistance(-70),
        inclination: 0.13,
      },
    })

    const jupiter = makePlanet({
      name: 'JUPITER',
      position: getOrbitPosition({
        center: solarCenter,
        radius: scaleSolarDistance(7800),
        phase: -0.31,
        vertical: scaleSolarDistance(70),
        inclination: 0.05,
      }),
      radius: strictRadiusFromSaturn(REAL_RADII_KM.JUPITER),
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
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      roughness: 0.95,
      glowColor: 0xe4c28e,
      glowOpacity: 0.06,
      atmosphereColor: 0xf0c98f,
      atmosphereOpacity: 0.05,
      spinRate: 0.001,
      approachRange: 540,
      orbit: {
        center: solarCenter,
        radius: scaleSolarDistance(7800),
        periodDays: 4332.6,
        phase: -0.31,
        vertical: scaleSolarDistance(70),
        inclination: 0.05,
      },
    })

    const redSpot = new THREE.Mesh(
      new THREE.SphereGeometry(1, 18, 10),
      new THREE.MeshBasicMaterial({ color: 0xa64232, transparent: true, opacity: 0.72 })
    )
    redSpot.position.set(2.4, -1.2, 8.72)
    redSpot.scale.set(1.9, 0.72, 0.14)
    jupiter.root.add(redSpot)

    const io = makePlanet({
      name: 'IO',
      position: getOrbitPosition({
        center: jupiter.root.position as THREE.Vector3,
        radius: scaleSolarDistance(125),
        phase: 1.8,
        vertical: scaleSolarDistance(4),
        inclination: 0.04,
      }),
      radius: stylizedMoonRadiusFromSaturn(REAL_RADII_KM.IO),
      texture: createIoTexture(),
      emissive: 0x4d3a14,
      emissiveIntensity: 0.12,
      mapColor: '#d9bd55',
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      roughness: 0.9,
      spinRate: 0.0011,
      approachRange: 130,
      orbit: {
        centerBody: jupiter,
        radius: scaleSolarDistance(125),
        periodDays: 1.77,
        phase: 1.8,
        vertical: scaleSolarDistance(4),
        inclination: 0.04,
      },
    })
    const ioPlume = createPlume({ color: '#fff0a8', height: 2.4, count: isMobile ? 6 : 12 })
    ioPlume.position.set(0, io.radius * 0.9, 0)
    io.root.add(ioPlume)

    makePlanet({
      name: 'EUROPA',
      position: getOrbitPosition({
        center: jupiter.root.position as THREE.Vector3,
        radius: scaleSolarDistance(178),
        phase: -0.65,
        vertical: scaleSolarDistance(-6),
        inclination: 0.05,
      }),
      radius: stylizedMoonRadiusFromSaturn(REAL_RADII_KM.EUROPA),
      texture: createEuropaTexture(),
      mapColor: '#f2f0e9',
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      roughness: 0.96,
      glowColor: 0xcfe8ff,
      glowOpacity: 0.035,
      spinRate: 0.0009,
      approachRange: 125,
      orbit: {
        centerBody: jupiter,
        radius: scaleSolarDistance(178),
        periodDays: 3.55,
        phase: -0.65,
        vertical: scaleSolarDistance(-6),
        inclination: 0.05,
      },
    })

    const saturnRoot = new THREE.Group()
    saturnRoot.position.copy(
      getOrbitPosition({
        center: solarCenter,
        radius: scaleSolarDistance(13800),
        phase: 0,
        vertical: scaleSolarDistance(-20),
        inclination: 0.015,
      })
    )
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

    const saturn = registerBody({
      name: 'SATURN',
      root: saturnRoot,
      radius: SATURN.radius,
      approachRange: 42,
      mapColor: '#e4c897',
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      spinTarget: saturnMesh,
      spinRate: 0.0015,
      orbit: {
        center: solarCenter,
        radius: scaleSolarDistance(13800),
        periodDays: 10759,
        phase: 0,
        vertical: scaleSolarDistance(-20),
        inclination: 0.015,
      },
    })

    ringHazards.push({
      name: 'SATURN RING',
      root: saturnRoot,
      inner: SATURN.ringInner,
      outer: SATURN.ringOuter,
      thickness: 0.7,
    })

    makePlanet({
      name: 'TITAN',
      position: getOrbitPosition({
        center: saturn.root.position as THREE.Vector3,
        radius: scaleSolarDistance(155),
        phase: 2.25,
        vertical: scaleSolarDistance(-6),
        inclination: 0.08,
      }),
      radius: stylizedMoonRadiusFromSaturn(REAL_RADII_KM.TITAN),
      texture: createGradientTexture([
        { at: 0, color: '#c56f2e' },
        { at: 0.5, color: '#f0a24f' },
        { at: 1, color: '#9e5428' },
      ], 768, 384),
      emissive: 0x3b1d0b,
      emissiveIntensity: 0.14,
      mapColor: '#f0a24f',
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      glowColor: 0xffb26a,
      glowOpacity: 0.09,
      atmosphereColor: 0xff9d52,
      atmosphereOpacity: 0.12,
      roughness: 0.94,
      spinRate: 0.0007,
      approachRange: 150,
      orbit: {
        centerBody: saturn,
        radius: scaleSolarDistance(155),
        periodDays: 15.95,
        phase: 2.25,
        vertical: scaleSolarDistance(-6),
        inclination: 0.08,
      },
    })

    const enceladus = makePlanet({
      name: 'ENCELADUS',
      position: getOrbitPosition({
        center: saturn.root.position as THREE.Vector3,
        radius: scaleSolarDistance(96),
        phase: -1.35,
        vertical: scaleSolarDistance(7),
        inclination: 0.05,
      }),
      radius: stylizedMoonRadiusFromSaturn(REAL_RADII_KM.ENCELADUS),
      texture: createCraterTexture('#f3fbff', '#d7e5ee', 512, 256),
      emissive: 0xdcecff,
      emissiveIntensity: 0.18,
      mapColor: '#f4fbff',
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      glowColor: 0xdaf4ff,
      glowOpacity: 0.06,
      roughness: 0.78,
      spinRate: 0.001,
      approachRange: 110,
      orbit: {
        centerBody: saturn,
        radius: scaleSolarDistance(96),
        periodDays: 1.37,
        phase: -1.35,
        vertical: scaleSolarDistance(7),
        inclination: 0.05,
      },
    })
    const icePlume = createPlume({ color: '#dff8ff', height: 2.0, count: isMobile ? 7 : 14 })
    icePlume.position.set(0, -enceladus.radius * 0.9, 0)
    icePlume.rotation.x = Math.PI
    enceladus.root.add(icePlume)

    makePlanet({
      name: 'URANUS',
      position: getOrbitPosition({
        center: solarCenter,
        radius: scaleSolarDistance(27800),
        phase: 0.07,
        vertical: scaleSolarDistance(160),
        inclination: 0.04,
      }),
      radius: strictRadiusFromSaturn(REAL_RADII_KM.URANUS),
      texture: createGradientTexture([
        { at: 0, color: '#a0d8e6' },
        { at: 0.5, color: '#77bccf' },
        { at: 1, color: '#9de4f0' },
      ]),
      mapColor: '#9de4f0',
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      roughness: 0.9,
      glowColor: 0xa2eeff,
      glowOpacity: 0.07,
      atmosphereColor: 0xa2eeff,
      atmosphereOpacity: 0.055,
      spinRate: 0.001,
      approachRange: 380,
      orbit: {
        center: solarCenter,
        radius: scaleSolarDistance(27800),
        periodDays: 30688,
        phase: 0.07,
        vertical: scaleSolarDistance(160),
        inclination: 0.04,
      },
    })

    makePlanet({
      name: 'NEPTUNE',
      position: getOrbitPosition({
        center: solarCenter,
        radius: scaleSolarDistance(43800),
        phase: -0.15,
        vertical: scaleSolarDistance(-220),
        inclination: 0.03,
      }),
      radius: strictRadiusFromSaturn(REAL_RADII_KM.NEPTUNE),
      texture: createGradientTexture([
        { at: 0, color: '#365dc6' },
        { at: 0.45, color: '#28469c' },
        { at: 1, color: '#5c8df0' },
      ]),
      emissive: 0x11234d,
      emissiveIntensity: 0.12,
      mapColor: '#5c8df0',
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      roughness: 0.86,
      glowColor: 0x74acff,
      glowOpacity: 0.06,
      atmosphereColor: 0x74acff,
      atmosphereOpacity: 0.06,
      spinRate: 0.001,
      approachRange: 360,
      orbit: {
        center: solarCenter,
        radius: scaleSolarDistance(43800),
        periodDays: 60182,
        phase: -0.15,
        vertical: scaleSolarDistance(-220),
        inclination: 0.03,
      },
    })

    makePlanet({
      name: 'PLUTO',
      position: getOrbitPosition({
        center: solarCenter,
        radius: scaleSolarDistance(56400),
        phase: 0.41,
        vertical: scaleSolarDistance(310),
        inclination: 0.22,
      }),
      radius: stylizedDwarfRadiusFromSaturn(REAL_RADII_KM.PLUTO),
      texture: createGradientTexture([
        { at: 0, color: '#cda87a' },
        { at: 0.42, color: '#f0d8b9' },
        { at: 0.7, color: '#8d6f63' },
        { at: 1, color: '#d9c7ba' },
      ], 768, 384),
      emissive: 0x241913,
      emissiveIntensity: 0.08,
      mapColor: '#d9c7ba',
      flightScale: CHARTED_BODY_FLIGHT_SCALE,
      roughness: 0.96,
      glowColor: 0xe8d9cf,
      glowOpacity: 0.05,
      spinRate: 0.0005,
      approachRange: 180,
      orbit: {
        center: solarCenter,
        radius: scaleSolarDistance(56400),
        periodDays: 90560,
        phase: 0.41,
        vertical: scaleSolarDistance(310),
        inclination: 0.22,
      },
    })

    const beltParticleCount = isMobile ? 1700 : 4200
    const beltGeometry = new THREE.BufferGeometry()
    const beltPositions = new Float32Array(beltParticleCount * 3)
    const beltColors = new Float32Array(beltParticleCount * 3)
    const beltPalette = ['#262626', '#7a7470', '#8d5943', '#9a8775']
    const beltColor = new THREE.Color()
    for (let i = 0; i < beltParticleCount; i++) {
      const radius = scaleSolarDistance(3300 + Math.random() * 2700)
      const theta = Math.random() * Math.PI * 2
      beltPositions[i * 3] = solarCenter.x + Math.cos(theta) * radius
      beltPositions[i * 3 + 1] = solarCenter.y + scaleSolarDistance((Math.random() - 0.5) * 260)
      beltPositions[i * 3 + 2] = solarCenter.z + Math.sin(theta) * radius
      beltColor.set(beltPalette[Math.floor(Math.random() * beltPalette.length)])
      const brightness = 0.32 + Math.random() * 0.42
      beltColors[i * 3] = beltColor.r * brightness
      beltColors[i * 3 + 1] = beltColor.g * brightness
      beltColors[i * 3 + 2] = beltColor.b * brightness
    }
    beltGeometry.setAttribute('position', new THREE.BufferAttribute(beltPositions, 3))
    beltGeometry.setAttribute('color', new THREE.BufferAttribute(beltColors, 3))
    const asteroidBelt = new THREE.Points(
      beltGeometry,
      new THREE.PointsMaterial({
        size: isMobile ? 2.8 : 2.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.46,
        depthWrite: false,
      })
    )
    scene.add(asteroidBelt)

    const zodiacalLight = new THREE.Mesh(
      new THREE.RingGeometry(420, 6500, 96),
      new THREE.MeshBasicMaterial({
        color: 0xfff1c2,
        transparent: true,
        opacity: 0.045,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    zodiacalLight.position.copy(solarCenter)
    zodiacalLight.rotation.x = Math.PI / 2
    scene.add(zodiacalLight)

    const milkyWayBand = new THREE.Mesh(
      new THREE.TorusGeometry(72000, 720, 8, 160),
      new THREE.MeshBasicMaterial({
        color: 0xbddcff,
        transparent: true,
        opacity: 0.035,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    milkyWayBand.rotation.set(1.18, 0.18, -0.42)
    scene.add(milkyWayBand)

    const hydrogenWall = new THREE.Mesh(
      new THREE.SphereGeometry(SOLAR.heliopauseRadius, 48, 24),
      new THREE.MeshBasicMaterial({
        color: 0x86dfff,
        transparent: true,
        opacity: 0.016,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
    hydrogenWall.position.copy(solarCenter)
    scene.add(hydrogenWall)

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
    const rcsLeftMaterial = new THREE.MeshBasicMaterial({ color: 0xcff8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    const rcsRightMaterial = rcsLeftMaterial.clone()
    const rcsUpMaterial = rcsLeftMaterial.clone()
    const rcsDownMaterial = rcsLeftMaterial.clone()

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

    const rcsGeometry = new THREE.SphereGeometry(0.28, 10, 8)
    const rcsLeft = new THREE.Mesh(rcsGeometry, rcsLeftMaterial)
    rcsLeft.position.set(-2.62, 0.03, -0.55)
    rcsLeft.scale.set(2.45, 0.58, 0.58)
    ship.add(rcsLeft)

    const rcsRight = new THREE.Mesh(rcsGeometry, rcsRightMaterial)
    rcsRight.position.set(2.62, 0.03, -0.55)
    rcsRight.scale.set(2.45, 0.58, 0.58)
    ship.add(rcsRight)

    const rcsUp = new THREE.Mesh(rcsGeometry, rcsUpMaterial)
    rcsUp.position.set(0, 0.64, -0.86)
    rcsUp.scale.set(0.58, 2.05, 0.58)
    ship.add(rcsUp)

    const rcsDown = new THREE.Mesh(rcsGeometry, rcsDownMaterial)
    rcsDown.position.set(0, -0.42, -0.86)
    rcsDown.scale.set(0.58, 2.05, 0.58)
    ship.add(rcsDown)

    ship.visible = false
    ship.scale.setScalar(isMobile ? 0.11 : 0.22)
    scene.add(ship)

    const tmpForward = new THREE.Vector3()
    const tmpCameraPos = new THREE.Vector3()
    const tmpLookAt = new THREE.Vector3()
    const localPoint = new THREE.Vector3()
    const shipForwardLocal = new THREE.Vector3(0, 0, -1)
    const saturnCenter = new THREE.Vector3()
    const orbitCenter = new THREE.Vector3()
    const frontierBodies: BodyInfo[] = []
    const frontierRingHazards: RingHazard[] = []
    const frontierSectors = new Map<string, FrontierSector>()
    const getFlightScale = (body: BodyInfo) => body.flightScale * FLIGHT.planetScaleMult
    const collisionScaleMult = isMobile ? 0.86 : 1
    const collisionShipRadius = isMobile ? FLIGHT.shipCollisionRadius * 0.72 : FLIGHT.shipCollisionRadius
    let flightElapsedMs = 0

    const updateChartedOrbits = (now: number) => {
      const orbitTime = now * SOLAR.orbitTimeScale
      bodies.forEach((body) => {
        if (!body.orbit) return
        const center = body.orbit.centerBody
          ? body.orbit.centerBody.root.getWorldPosition(orbitCenter)
          : body.orbit.center ?? solarCenter
        const phase = body.orbit.phase + (orbitTime / body.orbit.periodDays) * Math.PI * 2
        body.root.position.copy(
          getOrbitPosition({
            center,
            radius: body.orbit.radius,
            phase,
            vertical: body.orbit.vertical,
            inclination: body.orbit.inclination,
          })
        )
      })
    }

    const updateSolarLighting = () => {
      const solarDistance = Math.max(220, ship.position.distanceTo(solarCenter))
      const inverseSquare = Math.pow(SOLAR.earthOrbitRadius / solarDistance, 2)
      const displayLight = 0.14 + Math.min(2.8, Math.sqrt(inverseSquare) * 1.2)
      sunLight.intensity = THREE.MathUtils.lerp(sunLight.intensity, displayLight, 0.05)
      ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, 0.05 + displayLight * 0.08, 0.05)
      fillLight.intensity = THREE.MathUtils.lerp(fillLight.intensity, 0.04 + Math.min(0.22, displayLight * 0.06), 0.05)

      const frontierDarkness = THREE.MathUtils.clamp((solarDistance - 18000) / 62000, 0, 1)
      starLayers.forEach(({ material }, index) => {
        const baseOpacity = [0.32, 0.56, 0.84, 0.62, 0.22][index] ?? 0.4
        material.opacity = THREE.MathUtils.lerp(material.opacity, baseOpacity + frontierDarkness * 0.34, 0.045)
      })

      const hydrogenMaterial = hydrogenWall.material as THREE.MeshBasicMaterial
      const boundaryProximity = THREE.MathUtils.clamp((solarDistance - SOLAR.heliopauseRadius * 0.62) / (SOLAR.heliopauseRadius * 0.38), 0, 1)
      hydrogenMaterial.opacity = THREE.MathUtils.lerp(hydrogenMaterial.opacity, 0.016 + boundaryProximity * 0.085, 0.04)
      zodiacalLight.visible = solarDistance < 9000
    }

    const drawRegionLine = (region: RegionKey) => {
      let pool = regionPoolRef.current.get(region)
      if (!pool || pool.length === 0) {
        pool = shuffleLines(REGION_DIALOGUE[region])
      }
      if (pool.length > 1 && pool[0] === lastCompanionLineRef.current) {
        pool.push(pool.shift()!)
      }
      const line = pool.shift() ?? ''
      regionPoolRef.current.set(region, pool)
      lastCompanionLineRef.current = line
      return line
    }

    const getRegionForFlightContext = (nearestBody: BodyInfo, nearestDistance: number) => {
      const solarDistance = ship.position.distanceTo(solarCenter)
      const chartedDistance = ship.position.length()
      const nearThreshold = nearestBody.approachRange * getFlightScale(nearestBody) * 1.5
      const nearBody = nearestDistance <= nearThreshold

      if (solarDistance >= SOLAR.heliopauseRadius * 0.82) return 'cometsOort'
      if (solarDistance >= 50000) {
        if (nearBody && nearestBody.name === 'PLUTO') return 'kuiperBeltPluto'
        return solarDistance >= 66000 ? 'cometsOort' : 'kuiperBeltPluto'
      }

      if (nearBody) {
        switch (nearestBody.name) {
          case 'SUN':
            return 'sun'
          case 'MERCURY':
            return 'mercury'
          case 'VENUS':
            return 'venus'
          case 'EARTH':
          case 'MOON':
            return 'earthMoon'
          case 'MARS':
            return 'mars'
          case 'CERES':
            return 'asteroidBelt'
          case 'JUPITER':
          case 'IO':
          case 'EUROPA':
            return 'jupiterSystem'
          case 'SATURN':
          case 'TITAN':
          case 'ENCELADUS':
            return 'saturnSystem'
          case 'URANUS':
            return 'uranusSystem'
          case 'NEPTUNE':
            return 'neptuneSystem'
          case 'PLUTO':
            return 'kuiperBeltPluto'
          default:
            if (nearestBody.name.startsWith('UNKNOWN SECTOR')) return 'deepAstrophysics'
        }
      }

      if (solarDistance >= 3300 && solarDistance <= 6200) return 'asteroidBelt'
      if (chartedDistance > FRONTIER.chartedRadius) return 'deepAstrophysics'
      return 'deepAstrophysics'
    }

    const maybeQueueRegionalFact = (region: RegionKey) => {
      if (flightCompanion.visible) return
      if (region !== companionRegionRef.current) {
        companionRegionRef.current = region
        pendingRegionRef.current = region
      }
      if (!pendingRegionRef.current) return
      if (flightElapsedMs - lastCompanionAtRef.current < COMPANION_REGION_COOLDOWN_MS) return
      const line = drawRegionLine(pendingRegionRef.current)
      if (!line) return
      queueFlightMessage(line)
      lastCompanionAtRef.current = flightElapsedMs
      pendingRegionRef.current = null
    }

    const positionShipAtSpawn = () => {
      saturn.root.getWorldPosition(saturnCenter)
      ship.position.copy(saturnCenter).add(FLIGHT.spawn)
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

      updateChartedOrbits(now)

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
        ship.position.addScaledVector(velocityRef.current, 1)

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
        const rcsPulse = 0.82 + Math.sin(now * 0.028) * 0.3
        const yawLeft = Math.max(0, jx)
        const yawRight = Math.max(0, -jx)
        const pitchUp = Math.max(0, jy)
        const pitchDown = Math.max(0, -jy)
        rcsLeftMaterial.opacity = THREE.MathUtils.lerp(rcsLeftMaterial.opacity, yawLeft * 0.92 * rcsPulse, 0.42)
        rcsRightMaterial.opacity = THREE.MathUtils.lerp(rcsRightMaterial.opacity, yawRight * 0.92 * rcsPulse, 0.42)
        rcsUpMaterial.opacity = THREE.MathUtils.lerp(rcsUpMaterial.opacity, pitchUp * 0.82 * rcsPulse, 0.42)
        rcsDownMaterial.opacity = THREE.MathUtils.lerp(rcsDownMaterial.opacity, pitchDown * 0.82 * rcsPulse, 0.42)
        rcsLeft.scale.set(1.85 + yawLeft * 1.95, 0.58 + yawLeft * 0.24, 0.58 + yawLeft * 0.24)
        rcsRight.scale.set(1.85 + yawRight * 1.95, 0.58 + yawRight * 0.24, 0.58 + yawRight * 0.24)
        rcsUp.scale.set(0.58 + pitchUp * 0.24, 1.55 + pitchUp * 2.15, 0.58 + pitchUp * 0.24)
        rcsDown.scale.set(0.58 + pitchDown * 0.24, 1.55 + pitchDown * 2.15, 0.58 + pitchDown * 0.24)
        updateSolarLighting()

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

        const activeRegion = getRegionForFlightContext(nearestBody, nearestDistance)
        maybeQueueRegionalFact(activeRegion)

        if (detectCollision()) {
          positionShipAtSpawn()
        }

        tmpCameraPos.copy(FLIGHT.chaseOffset).applyQuaternion(ship.quaternion)
        const desiredCamera = ship.position.clone().add(tmpCameraPos)
        camera.position.copy(desiredCamera)
        tmpLookAt.copy(FLIGHT.lookAhead).applyQuaternion(ship.quaternion).add(ship.position)
        camera.lookAt(tmpLookAt)

        flightHUD.speed = parseFloat(nextSpeed.toFixed(2))
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
          ...bodies.filter((body) => CHARTED_MARKER_NAMES.has(body.name) || body.name === nearestBody.name),
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
            category: getMarkerCategory(body.name),
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
