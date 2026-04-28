// Shared input/output refs for Flight mode.
// FlightControls writes; SaturnScene reads each frame. No React state, no re-renders.

export const DRIVE_GEARS = ['R', '0', '1', '2', '3', 'WARP'] as const
export type DriveGear = (typeof DRIVE_GEARS)[number]
export type FlightMarkerCategory = 'planet' | 'moon' | 'phenomena'

export const flightInput = {
  joystick: { x: 0, y: 0 },
  driveGear: '0' as DriveGear,
}

export const flightHUD = {
  speed: 0,
  nearest: 'SATURN',
  earthDist: 0,
  warpActive: false,
  crashFlash: 0,
  heading: 0,
  hudMarkers: [] as Array<{
    name: string
    color: string
    x: number
    y: number
    onScreen: boolean
    behind: boolean
    distance: number
    category: FlightMarkerCategory
  }>,
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
  flightInput.driveGear = '0'
}
