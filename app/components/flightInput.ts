// Shared input/output refs for Flight mode.
// FlightControls writes; FlightScene reads each frame. No React state, no re-renders.

export const flightInput = {
  joystick: { x: 0, y: 0 },
  thrust: false,
  reverse: false,
  warp: false,
}

export const flightHUD = {
  speed: 0,
  nearest: 'SATURN',
  earthDist: 0,
  warpActive: false,
  zone: 0,
  phase: 'flying' as 'flying' | 'crashing',
  crashFlash: 0,
}

export const flightCompanion = {
  id: 0,
  message: '',
  visible: false,
}

export function queueFlightMessage(message: string) {
  flightCompanion.id += 1
  flightCompanion.message = message
  flightCompanion.visible = true
}

export function clearFlightMessage() {
  flightCompanion.visible = false
}

export function resetFlightInput() {
  flightInput.joystick.x = 0
  flightInput.joystick.y = 0
  flightInput.thrust = false
  flightInput.reverse = false
  flightInput.warp = false
}
