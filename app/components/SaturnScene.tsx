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

const SOLAR = {
  orbitTimeScale: 0.000018,
  earthOrbitRadius: 1360,
  heliopauseRadius: 78000,
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
])

const ROBOT_DIALOGUE = {
  launch: [
    'Saturn dead ahead. Rings on full display. Try not to make me sound impressed by surviving the parking job.',
    'Welcome back to the ringed giant, pilot. Beautiful view. Catastrophic place to get careless.',
    'Saturn is filling the glass. Take a second if you need one. Men have crossed oceans for less.',
    'We are sitting beside six hundred million miles of perspective. Systems are green. So are your chances if you stay calm.',
    'That would be Saturn, in case the universe had not made itself obvious.',
    'Good news, pilot. The machine still flies. Better news, Saturn still knows how to make an entrance.',
    'You are looking at the finest piece of intimidation in the solar system. Hold the line and enjoy it.',
    'Saturn ahead. Light discipline, steady hands, no dramatics unless they improve the view.',
    'Ringed giant in sight. Old service habit says salute it. Practical habit says mind your heading.',
    'There it is. Saturn. Cold, huge, and entirely indifferent. Try to take that as encouragement.',
    'Beautiful theater out there. Let us avoid becoming the cautionary tale that completes the performance.',
    'Pilot, breathe. You are not late, lost, or failing. You are at Saturn. Start from there.',
    'Saturn off the bow. If that does not quiet the mind for a second, nothing built by man will.',
    'The rings are catching sunlight like a blade edge. Keep the nose honest and you can stare all you like.',
    'Mission clock says we are on station. My professional opinion says this is one hell of a station.',
    'You have a ship, a horizon, and a world worth crossing for. That is enough to begin.',
  ],
  mechanics: [
    'Gear one is for seeing the country. If you panic in gear one, that is a character issue, not a ship issue.',
    'Point the nose first. Then add speed. That order has kept better pilots alive.',
    'A planet filling the canopy is not scenery anymore. It is paperwork.',
    'Use reverse before the approach becomes a confession.',
    'Smooth input, smooth turn. The ship responds better to discipline than wrestling.',
    'You can rotate at zero thrust. Those are attitude jets, not magic. Use them with some self-respect.',
    'If you are drifting, good. Drift is information. Panic is static.',
    'The edge markers are me being polite. You can listen now or learn later.',
    'Do not chase the target with the whole ship. Nudge the nose. Let the line come to you.',
    'Hold your correction a second longer than your nerves prefer. That is usually the right answer.',
    'When the heading is clean, then you may feel heroic about the lever.',
    'A tidy turn saves more time than a sloppy burn.',
    'If Earth slips off center, make a small correction. This is flight, not fencing.',
    'You do not need to win against inertia. You need to work with it before it makes a point.',
    'Reverse is not retreat. Reverse is judgment with mechanical support.',
    'Treat the ship like a rifle range lesson. Slow is smooth. Smooth is fast. Fast is still not an excuse to be stupid.',
    'If the stars start smearing under warp, verify the nose and then commit. In that order.',
    'The calm pilot usually gets home first. Infuriating, I know.',
    'If you overshoot, relax and widen the correction. Tiny frantic circles are for insects.',
    'A marker on the edge of the HUD means turn first, accelerate second. The machine is trying to spare us both.',
    'The ship will coast if you let it. Space does not demand constant theatrics.',
    'There is no medal for taking a close approach too hot.',
    'Line up, breathe, move. Flight is mostly sequence discipline with better scenery.',
    'If a world looks peaceful, remember that peace and impact can share the same horizon.',
    'A clean heading solves problems before speed makes them expensive.',
    'You can absolutely trust instinct. Just make sure it is trained instinct, not decorative instinct.',
    'If the approach feels fast, it is already faster than your conscience likes.',
    'Zero thrust is still a valid moment to think. Use the jets, square the nose, then decide.',
    'This ship likes clear orders. Indecision reads like turbulence.',
    'The prettiest maneuver is usually the least desperate one.',
    'You are allowed to back off an approach. Pride is heavier than fuel.',
    'When in doubt, take the calmer vector. Space punishes ego more reliably than error.',
    'Think of warp as altering the road, not the driver. You still have to know where you are going.',
    'Warp does not forgive a foolish heading. It just helps you arrive at the mistake faster.',
    'If the speed readout seems modest in warp, that is because the map is bending more than the engine is boasting.',
    'Spacetime is doing part of the travel for us in warp. Show some gratitude by not aiming badly.',
    'Those reaction jets are there so you can think with the ship standing still. Use that privilege.',
    'If you lose the line to Earth, open the turn. The long arc is usually the merciful one.',
    'Do not overcorrect because the silence feels judgmental. The silence always feels judgmental.',
    'A veteran habit: make one good correction, then observe. Do not stack three bad ones out of fear.',
    'If Saturn is behind you and Earth is ahead, congratulations. You have already solved the philosophical part.',
    'Flight remains simple under stress: orient, commit, reassess.',
    'Use lower gears without shame. Every wreck started with someone certain they needed more speed.',
    'You do not need constant thrust to stay in command. You need composure and a working sense of direction.',
    'A ship this small survives on pilot judgment. Fortunately, you brought some.',
  ],
  facts: [
    'Saturn would float in an ocean large enough to hold it. Ridiculous image. Accurate physics.',
    'The rings are not sheets. They are billions of icy fragments keeping absurdly good formation.',
    'Saturn spins so fast its day is only about ten and a half hours. Giant planet, short attention span.',
    'The Cassini Division is not empty. It is a structured gap shaped by gravity and orbital resonance.',
    'Titan has rivers, lakes, and rain, except the chemistry is methane and the weather wants nothing to do with you.',
    'Enceladus vents ice from a hidden ocean. Small moon, serious internal life.',
    'Io is under so much tidal stress from Jupiter that it turns strain into volcanoes.',
    'Europa looks scored with rust-colored fractures because its ice shell keeps shifting over an ocean below.',
    'Mercury has almost no atmosphere, so sunlight and shadow there do not negotiate with each other.',
    'Venus is bright because its cloud deck reflects sunlight brutally well. Friendly from a distance. Murderous up close.',
    'Mars is rarely truly red at close range. More butterscotch, tan, and iron-stained dust.',
    'Olympus Mons on Mars is the tallest known volcano in the solar system. Scale out here has poor manners.',
    'Earths blue limb comes from Rayleigh scattering in the atmosphere. Thin gas, extraordinary effect.',
    'The Moon looks simple until you get close enough to see maria, highlands, ejecta, and every bad day it ever had.',
    'Jupiter is massive enough to reorganize the rest of the solar system just by existing.',
    'The Great Red Spot has outlived nations, languages, and several scientific arguments.',
    'Jupiter also throws moon shadows across its own cloud tops. Sharp black circles. Very clean geometry.',
    'Uranus rotates on its side like a world that got knocked flat and refused to recover its posture.',
    'Neptune is darker blue than Uranus and wears bright high clouds of methane ice over deeper weather.',
    'The asteroid belt is not crowded. It is mostly vacancy with occasional rock.',
    'Ceres is the largest object in the asteroid belt and still only counts as a dwarf planet. Harsh neighborhood.',
    'Sunlight reaching Earth is about eight minutes old. Sunlight reaching Saturn is far older and no less real.',
    'The farther you go, the dimmer the Sun gets by the inverse square law. It does not fade linearly. It falls off hard.',
    'By Jupiter, sunlight is only a small fraction of what Earth gets. By the outer boundary, it feels like memory with illumination.',
    'Comet tails do not stream behind them because of speed alone. Radiation pressure and solar wind do the pushing.',
    'Earth and Moon likely came out of a colossal early impact. Even our home began as wreckage and heat.',
    'Saturn has more than a hundred known moons. The planet has range issues.',
    'The ring plane from inside would not look like a solid record. It would look like ice dust pretending to be architecture.',
    'Neptune has winds faster than the worst hurricanes on Earth. Distance from the Sun does not guarantee calm.',
    'Mercurys craters hold black shadows because there is no air there to soften light. Vacuum is a hard critic.',
    'Venus hides its surface so completely that the idea of seeing the ground becomes more theory than travel plan.',
    'The heliopause is less a wall than a shifting boundary where solar wind finally loses the argument.',
    'Out near the edge, the Sun stops being a ruler and becomes one bright star among others.',
    'Most of the solar system is gap. The planets are punctuation marks in a very large sentence.',
    'Gravity never switches off. It just gets quieter until you stop respecting it and then it gets loud again.',
    'If Earth were a marble, Jupiter would be closer to a basketball and the empty floor between them would still dominate the room.',
    'The stars overhead are not points on a ceiling. They are suns, systems, ruins, and futures.',
    'Astronomy is the repeated discovery that reality is under no obligation to feel proportionate to us.',
    'Titan keeps an atmosphere thicker than Earths. A moon with weather. The universe does enjoy an upset.',
    'Enceladus shines so bright because fresh ice reflects light like it was ordered to.',
    'Uranus and Neptune are called ice giants, but that label hides a lot of violent interior strangeness.',
    'The Milky Way from vacuum is not a haze. It is structure, dust lanes, and light piled on light.',
    'Zodiacal light comes from sunlight scattering off interplanetary dust in the plane of the system. Even emptiness has residue.',
    'The so-called hydrogen wall near the heliosphere is one of those names that sounds invented until the data keeps insisting.',
  ],
  astrophysics: [
    'Warp aside, ordinary travel still answers to momentum. Turn the ship and inertia keeps the previous opinion.',
    'Orbital resonance is gravity keeping time. Moons and particles fall into repeating ratios and the system starts to compose itself.',
    'The Cassini Division exists in part because Mimas keeps tugging ring particles into unstable rhythms. Gravity is a patient sculptor.',
    'Tidal heating is what happens when gravity kneads a moon until rock or ice starts behaving like a furnace.',
    'Blackbody radiation is why the Sun is fundamentally white in space even if atmospheres and eyes editorialize the experience.',
    'Rayleigh scattering favors shorter wavelengths, which is why Earth wears blue around the edge like a quiet flag of life.',
    'Specular reflection off an ocean can make Earth flash like a signal mirror. Whole planet, one sharp glint.',
    'An atmosphere does not glow in vacuum. Light only shows where it strikes matter. Useful rule out here.',
    'Inverse square law means double the distance, quarter the light. The universe charges interest on every mile.',
    'A gravity well is not really a hole in anything. It is a way of saying spacetime makes certain paths expensive.',
    'Escape velocity is just the speed required to stop falling back. Nothing mystical. Plenty unforgiving.',
    'Lagrange points are places where gravities and motion balance just enough for order to pretend it is permanent.',
    'Accretion is the long habit of dust and rock deciding to become something harder to ignore.',
    'Protoplanetary disks are what solar systems look like before the furniture settles.',
    'Angular momentum is why collapsing clouds flatten into disks instead of becoming tidy spheres. Nature dislikes wasted spin.',
    'The heliosphere is a moving bubble carved by the solar wind. Home field advantage, on a stellar scale.',
    'Solar prominences are magnetic structures carrying incandescent plasma far above the Suns limb. Not fire. Far stranger.',
    'A corona runs hotter than the Suns visible surface, which is one of those facts astrophysicists keep politely wrestling.',
    'Magnetospheres redirect charged particles into invisible architecture around planets. Some worlds carry their own weather shield.',
    'Jupiters magnetic field is so enormous that if human eyes could read it, the sky would look occupied.',
    'Redshift is not always speed. Sometimes it is space itself stretching the light on the way to us.',
    'When we say vacuum, we still do not mean nothing. Space carries fields, particles, dust, and consequences.',
    'Relativity matters most when speed, gravity, or precision stop being casual. The universe has no problem with any of the three.',
    'Neutron stars are what happens when matter loses every argument except density.',
    'Black holes are less cosmic vacuum cleaners than regions where exit routes become unavailable.',
    'An event horizon is not a surface you strike. It is a boundary after which return stops being a meaningful option.',
    'Even in open space, navigation is a choreography of reference frames. Position depends on what you are measuring against.',
    'Planetary atmospheres filter, scatter, absorb, and betray chemistry. Every color out there is testimony.',
    'Methane can make a world blue. Sulfur can make a moon look diseased. Chemistry has a dramatic streak.',
    'Heliocentric distance changes not just brightness but mood, shadow hardness, thermal balance, and what kind of mistakes survive.',
    'A ring system is a gravitational negotiation between collision, resonance, and material too dispersed to become a moon.',
    'The further out you go, the more the Sun turns from sovereign to reference point.',
    'Procedural or not, any believable sky needs hierarchy: foreground dust, stellar depth, and light that obeys distance.',
    'Astrophysics is often the art of accepting that invisible forces are the main characters.',
  ],
  humor: [
    'This is the sort of mission sensible civilizations discuss at memorial services.',
    'Space remains beautiful mainly because it has no interest in accommodating us.',
    'We are very small, very outnumbered, and carrying on anyway. Respectable work.',
    'If anyone asks, we are not lost. We are operating outside the limits of lesser maps.',
    'There is no traffic out here. Only distance and the occasional consequence.',
    'The stars always make poor decisions look noble. Do not be fooled by presentation.',
    'A giant ringed planet behind us and home somewhere ahead. You could charge admission for this anxiety.',
    'The universe is magnificent and has the bedside manner of an artillery piece.',
    'I admire your confidence. I admire it most when it coincides with caution.',
    'If boldness were fuel, we would never need a resupply.',
    'Please keep all limbs, ambitions, and sudden theories inside the cockpit.',
    'Space has a way of making every plan feel handwritten.',
    'I have served in rougher conditions, but very few prettier ones.',
    'The cosmos does not hand out second chances. Fortunately, I am willing to improvise some.',
    'If this goes poorly, at least the view will complicate the autopsy report.',
    'Saturn looks like royalty. We look like two professionals pretending this was straightforward.',
    'The official assessment is majestic. My unofficial assessment is that majesty often comes with impact risk.',
    'This would be less stressful if the planets agreed to be smaller out of courtesy.',
    'I support wonder. I simply object to wonder at terminal velocity.',
    'Somewhere, somebody would call this humbling. I call it first-rate intimidation.',
    'There should be medals for surviving beautiful mistakes. We are trying not to qualify.',
    'A good day in space is one where the scenery stays outside the cockpit.',
    'You fly like someone with both instincts and unfinished arguments. Useful combination.',
    'No one mentioned snacks in the mission brief. That remains a failure of leadership.',
    'The stars are excellent company if you do not expect help from them.',
    'This route is equal parts pilgrimage and bad influence.',
    'If courage is fear in uniform, we are dressed correctly.',
    'Nothing says companionship like mutual survival in an indifferent vacuum.',
    'At least if we drift into legend, the legend will have production value.',
    'The universe is old enough to know better and dramatic enough not to care.',
    'We are either making history or providing future pilots with educational material.',
    'I would complain about the danger if it were not so visually persuasive.',
    'That horizon could make a poet honest or a soldier quiet. Same result, really.',
    'Home is a long way off, which is terrible for morale and excellent for perspective.',
    'I have no ego to bruise, pilot. That leaves me free to be correct.',
    'The odds improve noticeably when we refrain from ramming celestial landmarks.',
  ],
  frontier: [
    'Charted space ends here. Everything beyond this point is earned the hard way.',
    'The atlas just ran out of confidence. Maintain yours.',
    'Unknown sector ahead. Keep your curiosity. Tighten your discipline.',
    'We have crossed from navigation into reconnaissance.',
    'Fresh sky. No promises. Good. Promises make people lazy.',
    'This is where maps turn into witness statements.',
    'New stars on the board. Same rules apply: observe first, assume nothing.',
    'Beyond this line, the universe stops being polite about context.',
    'Uncharted space. Old Corps phrase for this would be proceed intelligently.',
    'Everything ahead is unfamiliar. That does not make it hostile. It just removes excuses.',
    'The frontier is mostly silence, scale, and consequences. Keep flying.',
    'This is the kind of darkness that rewards steady nerves and punishes storytelling.',
  ],
  discovery: [
    'New sector acquired. Different sky. Same duty.',
    'Another patch of the universe has introduced itself. Rude of it not to send coordinates first.',
    'Unknown terrain, now slightly less unknown.',
    'Fresh stars on the canopy. Keep your hands steady and your mind open.',
    'New neighborhood. No local customs, no local mercy, excellent view.',
    'Sector logged. The sky just changed uniforms on us.',
    'That is a new piece of creation. Try to appreciate it without colliding with anything.',
    'Unknown space always arrives in silence first.',
    'Another sector on the books. We remain alive enough to enjoy the bookkeeping.',
    'New sky. Same instruction: look closely and do not get sentimental at the controls.',
  ],
  impactWarning: [
    'Pilot, that body is growing faster than I like. Back us off now.',
    'Range is collapsing. Admire from farther out.',
    'Easy. Nose away. You are about to make geology personal.',
    'That is close enough for awe. Pull back before it becomes impact.',
    'Course correction, now. The planet is not moving for us.',
    'Stand by. You are converting a beautiful approach into a bad report.',
    'Less romance, more separation. We are closing too hard.',
    'If you can feel your pulse in the turn, the vector is already wrong.',
    'Break it off, pilot. This is no longer a pass. It is a warning.',
    'Back away with dignity while dignity remains available.',
  ],
  recovery: [
    'Impact confirmed. We will call that reconnaissance by direct contact and not repeat it.',
    'Well. That was the wrong amount of planet. Resetting.',
    'Ship reset underway. No sermon. Just do better on the next run.',
    'We struck the scenery. Fortunately, I planned for your occasional sincerity.',
    'That approach ended in a lesson. We are resetting before it turns into a habit.',
    'Collision logged. Pride can file its complaint after we respawn.',
    'Bad vector. Short ending. Fresh start.',
    'All right. We hit it. That settles whether it was solid.',
    'Reset complete in spirit, if not in pilot dignity.',
    'We have conducted enough close inspection for one life. Starting over.',
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

    const solarCenter = new THREE.Vector3(-13800, 20, 0)

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
      radius: 18,
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1.18,
      roughness: 0.5,
      glowColor: 0xffffff,
      glowOpacity: 0.32,
      mapColor: '#ffffff',
      flightScale: 1.4,
      spinRate: 0.0003,
      approachRange: 180,
    })

    const corona = createPlanetGlow(54, 0xdff5ff, 0.11, Math.max(32, sphereSegments / 2))
    sun.root.add(corona)
    for (let i = 0; i < 5; i++) {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(24 + i * 4, 0.08, 6, 40, Math.PI * (0.55 + Math.random() * 0.35)),
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
      position: getOrbitPosition({ center: solarCenter, radius: 520, phase: -0.42, vertical: 8, inclination: 0.07 }),
      radius: 1.4,
      texture: createCraterTexture('#5b5750', '#d8d0c3'),
      mapColor: '#9f9488',
      flightScale: 2.8,
      roughness: 1,
      spinRate: 0.0018,
      approachRange: 180,
      orbit: { center: solarCenter, radius: 520, periodDays: 88, phase: -0.42, vertical: 8, inclination: 0.07 },
    })

    makePlanet({
      name: 'VENUS',
      position: getOrbitPosition({ center: solarCenter, radius: 920, phase: 0.28, vertical: -16, inclination: 0.02 }),
      radius: 2.8,
      texture: createGradientTexture([
        { at: 0, color: '#f7efd7' },
        { at: 0.46, color: '#f0dfad' },
        { at: 1, color: '#fff7dc' },
      ]),
      emissive: 0x6d542b,
      emissiveIntensity: 0.18,
      mapColor: '#fff0bd',
      flightScale: 3.8,
      roughness: 0.92,
      glowColor: 0xfff0bd,
      glowOpacity: 0.13,
      atmosphereColor: 0xfff0bd,
      atmosphereOpacity: 0.09,
      spinRate: 0.0011,
      approachRange: 240,
      orbit: { center: solarCenter, radius: 920, periodDays: 224.7, phase: 0.28, vertical: -16, inclination: 0.02 },
    })

    const earth = makePlanet({
      name: 'EARTH',
      position: getOrbitPosition({ center: solarCenter, radius: SOLAR.earthOrbitRadius, phase: 0.95, vertical: 6, inclination: 0.03 }),
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
      orbit: { center: solarCenter, radius: SOLAR.earthOrbitRadius, periodDays: 365.25, phase: 0.95, vertical: 6, inclination: 0.03 },
    })

    makePlanet({
      name: 'MOON',
      position: getOrbitPosition({ center: earth.root.position as THREE.Vector3, radius: 90, phase: 1.1, vertical: 2, inclination: 0.08 }),
      radius: 0.82,
      texture: createCraterTexture('#777a80', '#c4c8cc', 512, 256),
      mapColor: '#b4b7bb',
      flightScale: 3.2,
      roughness: 1,
      spinRate: 0.0008,
      approachRange: 120,
      orbit: { centerBody: earth, radius: 90, periodDays: 27.3, phase: 1.1, vertical: 2, inclination: 0.08 },
    })

    makePlanet({
      name: 'MARS',
      position: getOrbitPosition({ center: solarCenter, radius: 2120, phase: -0.62, vertical: -30, inclination: 0.06 }),
      radius: 2.2,
      texture: createMarsTexture(),
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
      orbit: { center: solarCenter, radius: 2120, periodDays: 687, phase: -0.62, vertical: -30, inclination: 0.06 },
    })

    const ceres = makePlanet({
      name: 'CERES',
      position: getOrbitPosition({ center: solarCenter, radius: 4100, phase: 1.52, vertical: 42, inclination: 0.18 }),
      radius: 0.95,
      texture: createCraterTexture('#4d4e50', '#8a8d90', 512, 256),
      mapColor: '#85888c',
      flightScale: 4.1,
      roughness: 1,
      spinRate: 0.0013,
      approachRange: 160,
      orbit: { center: solarCenter, radius: 4100, periodDays: 1682, phase: 1.52, vertical: 42, inclination: 0.18 },
    })
    ceres.root.scale.set(1.16, 0.92, 1)

    makePlanet({
      name: 'PSYCHE',
      position: getOrbitPosition({ center: solarCenter, radius: 4550, phase: -1.05, vertical: -70, inclination: 0.13 }),
      radius: 0.72,
      texture: createRockTexture('#594338', '#b47d5c', 512, 256),
      mapColor: '#b47d5c',
      flightScale: 3.9,
      roughness: 0.72,
      metalness: 0.22,
      spinRate: 0.0021,
      approachRange: 130,
      orbit: { center: solarCenter, radius: 4550, periodDays: 1825, phase: -1.05, vertical: -70, inclination: 0.13 },
    })

    const jupiter = makePlanet({
      name: 'JUPITER',
      position: getOrbitPosition({ center: solarCenter, radius: 7800, phase: -0.31, vertical: 70, inclination: 0.05 }),
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
      orbit: { center: solarCenter, radius: 7800, periodDays: 4332.6, phase: -0.31, vertical: 70, inclination: 0.05 },
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
      position: getOrbitPosition({ center: jupiter.root.position as THREE.Vector3, radius: 125, phase: 1.8, vertical: 4, inclination: 0.04 }),
      radius: 0.9,
      texture: createIoTexture(),
      emissive: 0x4d3a14,
      emissiveIntensity: 0.12,
      mapColor: '#d9bd55',
      flightScale: 3.5,
      roughness: 0.9,
      spinRate: 0.0011,
      approachRange: 130,
      orbit: { centerBody: jupiter, radius: 125, periodDays: 1.77, phase: 1.8, vertical: 4, inclination: 0.04 },
    })
    const ioPlume = createPlume({ color: '#fff0a8', height: 2.4, count: isMobile ? 6 : 12 })
    ioPlume.position.set(0, io.radius * 0.9, 0)
    io.root.add(ioPlume)

    makePlanet({
      name: 'EUROPA',
      position: getOrbitPosition({ center: jupiter.root.position as THREE.Vector3, radius: 178, phase: -0.65, vertical: -6, inclination: 0.05 }),
      radius: 0.78,
      texture: createEuropaTexture(),
      mapColor: '#f2f0e9',
      flightScale: 3.4,
      roughness: 0.96,
      glowColor: 0xcfe8ff,
      glowOpacity: 0.035,
      spinRate: 0.0009,
      approachRange: 125,
      orbit: { centerBody: jupiter, radius: 178, periodDays: 3.55, phase: -0.65, vertical: -6, inclination: 0.05 },
    })

    const saturnRoot = new THREE.Group()
    saturnRoot.position.copy(getOrbitPosition({ center: solarCenter, radius: 13800, phase: 0, vertical: -20, inclination: 0.015 }))
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
      flightScale: 3.8,
      spinTarget: saturnMesh,
      spinRate: 0.0015,
      orbit: { center: solarCenter, radius: 13800, periodDays: 10759, phase: 0, vertical: -20, inclination: 0.015 },
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
      position: getOrbitPosition({ center: saturn.root.position as THREE.Vector3, radius: 155, phase: 2.25, vertical: -6, inclination: 0.08 }),
      radius: 1.15,
      texture: createGradientTexture([
        { at: 0, color: '#c56f2e' },
        { at: 0.5, color: '#f0a24f' },
        { at: 1, color: '#9e5428' },
      ], 768, 384),
      emissive: 0x3b1d0b,
      emissiveIntensity: 0.14,
      mapColor: '#f0a24f',
      flightScale: 4.2,
      glowColor: 0xffb26a,
      glowOpacity: 0.09,
      atmosphereColor: 0xff9d52,
      atmosphereOpacity: 0.12,
      roughness: 0.94,
      spinRate: 0.0007,
      approachRange: 150,
      orbit: { centerBody: saturn, radius: 155, periodDays: 15.95, phase: 2.25, vertical: -6, inclination: 0.08 },
    })

    const enceladus = makePlanet({
      name: 'ENCELADUS',
      position: getOrbitPosition({ center: saturn.root.position as THREE.Vector3, radius: 96, phase: -1.35, vertical: 7, inclination: 0.05 }),
      radius: 0.58,
      texture: createCraterTexture('#f3fbff', '#d7e5ee', 512, 256),
      emissive: 0xdcecff,
      emissiveIntensity: 0.18,
      mapColor: '#f4fbff',
      flightScale: 3.5,
      glowColor: 0xdaf4ff,
      glowOpacity: 0.06,
      roughness: 0.78,
      spinRate: 0.001,
      approachRange: 110,
      orbit: { centerBody: saturn, radius: 96, periodDays: 1.37, phase: -1.35, vertical: 7, inclination: 0.05 },
    })
    const icePlume = createPlume({ color: '#dff8ff', height: 2.0, count: isMobile ? 7 : 14 })
    icePlume.position.set(0, -enceladus.radius * 0.9, 0)
    icePlume.rotation.x = Math.PI
    enceladus.root.add(icePlume)

    makePlanet({
      name: 'URANUS',
      position: getOrbitPosition({ center: solarCenter, radius: 27800, phase: 0.07, vertical: 160, inclination: 0.04 }),
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
      orbit: { center: solarCenter, radius: 27800, periodDays: 30688, phase: 0.07, vertical: 160, inclination: 0.04 },
    })

    makePlanet({
      name: 'NEPTUNE',
      position: getOrbitPosition({ center: solarCenter, radius: 43800, phase: -0.15, vertical: -220, inclination: 0.03 }),
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
      orbit: { center: solarCenter, radius: 43800, periodDays: 60182, phase: -0.15, vertical: -220, inclination: 0.03 },
    })

    const beltParticleCount = isMobile ? 1700 : 4200
    const beltGeometry = new THREE.BufferGeometry()
    const beltPositions = new Float32Array(beltParticleCount * 3)
    const beltColors = new Float32Array(beltParticleCount * 3)
    const beltPalette = ['#262626', '#7a7470', '#8d5943', '#9a8775']
    const beltColor = new THREE.Color()
    for (let i = 0; i < beltParticleCount; i++) {
      const radius = 3300 + Math.random() * 2700
      const theta = Math.random() * Math.PI * 2
      beltPositions[i * 3] = solarCenter.x + Math.cos(theta) * radius
      beltPositions[i * 3 + 1] = solarCenter.y + (Math.random() - 0.5) * 260
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
    const rcsLeftMaterial = new THREE.MeshBasicMaterial({ color: 0xb8f4ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
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

    const rcsGeometry = new THREE.SphereGeometry(0.18, 8, 6)
    const rcsLeft = new THREE.Mesh(rcsGeometry, rcsLeftMaterial)
    rcsLeft.position.set(-2.62, 0.03, -0.55)
    rcsLeft.scale.set(1.75, 0.34, 0.34)
    ship.add(rcsLeft)

    const rcsRight = new THREE.Mesh(rcsGeometry, rcsRightMaterial)
    rcsRight.position.set(2.62, 0.03, -0.55)
    rcsRight.scale.set(1.75, 0.34, 0.34)
    ship.add(rcsRight)

    const rcsUp = new THREE.Mesh(rcsGeometry, rcsUpMaterial)
    rcsUp.position.set(0, 0.64, -0.86)
    rcsUp.scale.set(0.36, 1.4, 0.36)
    ship.add(rcsUp)

    const rcsDown = new THREE.Mesh(rcsGeometry, rcsDownMaterial)
    rcsDown.position.set(0, -0.42, -0.86)
    rcsDown.scale.set(0.36, 1.4, 0.36)
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
    let hasShownCrashWarning = false
    let suppressInitialSaturnWarning = true
    let flightElapsedMs = 0
    let nextAmbientDialogueAtMs = 0
    let lastAmbientLine: string | null = null

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
      if (warpActive) pools.push(ROBOT_DIALOGUE.mechanics, ROBOT_DIALOGUE.astrophysics)
      if (CHARTED_MARKER_NAMES.has(nearestBody.name)) {
        pools.push(ROBOT_DIALOGUE.facts)
      }
      if (nearestBody.name.startsWith('UNKNOWN SECTOR')) {
        pools.push(ROBOT_DIALOGUE.frontier, ROBOT_DIALOGUE.discovery)
      }
      if (Math.random() < 0.45) pools.push(ROBOT_DIALOGUE.mechanics)
      if (Math.random() < 0.33) pools.push(ROBOT_DIALOGUE.astrophysics)

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
        const rcsPulse = 0.65 + Math.sin(now * 0.028) * 0.22
        rcsLeftMaterial.opacity = THREE.MathUtils.lerp(rcsLeftMaterial.opacity, Math.max(0, jx) * 0.58 * rcsPulse, 0.34)
        rcsRightMaterial.opacity = THREE.MathUtils.lerp(rcsRightMaterial.opacity, Math.max(0, -jx) * 0.58 * rcsPulse, 0.34)
        rcsUpMaterial.opacity = THREE.MathUtils.lerp(rcsUpMaterial.opacity, Math.max(0, jy) * 0.46 * rcsPulse, 0.34)
        rcsDownMaterial.opacity = THREE.MathUtils.lerp(rcsDownMaterial.opacity, Math.max(0, -jy) * 0.46 * rcsPulse, 0.34)
        rcsLeft.scale.x = 1.1 + Math.max(0, jx) * 1.15
        rcsRight.scale.x = 1.1 + Math.max(0, -jx) * 1.15
        rcsUp.scale.y = 0.9 + Math.max(0, jy) * 1.05
        rcsDown.scale.y = 0.9 + Math.max(0, -jy) * 1.05
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

        saturn.root.getWorldPosition(saturnCenter)
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
          const line = pickRobotLine(ROBOT_DIALOGUE.impactWarning, lastAmbientLine)
          lastAmbientLine = line
          queueFlightMessage(line)
          hasShownCrashWarning = true
        }

        maybeQueueAmbientDialogue(nearestBody, warpActive)

        if (detectCollision()) {
          const line = pickRobotLine(ROBOT_DIALOGUE.recovery, lastAmbientLine)
          lastAmbientLine = line
          queueFlightMessage(line)
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
