'use client'

import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  DRIVE_GEARS,
  clearFlightMessage,
  flightCompanion,
  flightHUD,
  flightInput,
  resetFlightInput,
} from './flightInput'

export interface FlightControlsProps {
  isMobile?: boolean
}

const JOY_RADIUS = 44
const DRIVE_GEAR_ORDER = DRIVE_GEARS
const GEAR_TRAVEL_INSET = 0.16
const DRIVE_GEAR_LABELS: Record<(typeof DRIVE_GEARS)[number], string> = {
  R: 'R',
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  WARP: 'WARP',
}

function gearIndex(gear: (typeof DRIVE_GEARS)[number]) {
  return DRIVE_GEAR_ORDER.indexOf(gear)
}

function gearFromIndex(index: number) {
  return DRIVE_GEAR_ORDER[Math.max(0, Math.min(DRIVE_GEAR_ORDER.length - 1, index))]
}

function gearTopPercent(index: number) {
  const t = index / (DRIVE_GEAR_ORDER.length - 1)
  const travel = 1 - GEAR_TRAVEL_INSET * 2
  return (GEAR_TRAVEL_INSET + (1 - t) * travel) * 100
}

export default function FlightControls({ isMobile = false }: FlightControlsProps) {
  const joyBaseRef = useRef<HTMLDivElement>(null)
  const joyThumbRef = useRef<HTMLDivElement>(null)
  const gearRailRef = useRef<HTMLDivElement>(null)
  const gearHandleRef = useRef<HTMLDivElement>(null)
  const speedRef = useRef<HTMLSpanElement>(null)
  const nearestRef = useRef<HTMLSpanElement>(null)
  const earthDistRef = useRef<HTMLSpanElement>(null)
  const warpBadgeRef = useRef<HTMLSpanElement>(null)
  const warpVignetteRef = useRef<HTMLDivElement>(null)
  const crashFlashRef = useRef<HTMLDivElement>(null)
  const messageTimerRef = useRef<number | null>(null)
  const messageTypeTimerRef = useRef<number | null>(null)
  const [companionMessage, setCompanionMessage] = useState('')
  const [companionVisible, setCompanionVisible] = useState(false)
  const [driveGear, setDriveGear] = useState<(typeof DRIVE_GEARS)[number]>('0')
  const driveGearRef = useRef<(typeof DRIVE_GEARS)[number]>('0')
  const [, setHudTick] = useState(0)
  const selectedGearIndex = gearIndex(driveGear)

  useEffect(() => {
    resetFlightInput()
    setDriveGear('0')
    driveGearRef.current = '0'
    const prevOverflow = document.body.style.overflow
    const prevTouchAction = document.body.style.touchAction
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    return () => {
      resetFlightInput()
      document.body.style.overflow = prevOverflow
      document.body.style.touchAction = prevTouchAction
      if (messageTimerRef.current) window.clearTimeout(messageTimerRef.current)
      if (messageTypeTimerRef.current) window.clearTimeout(messageTypeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const base = joyBaseRef.current
    const thumb = joyThumbRef.current
    if (!base || !thumb) return

    let activePointerId: number | null = null
    let baseRect: DOMRect | null = null

    const setThumb = (dx: number, dy: number) => {
      const dist = Math.hypot(dx, dy)
      const clamped = Math.min(dist, JOY_RADIUS)
      const angle = Math.atan2(dy, dx)
      const x = Math.cos(angle) * clamped
      const y = Math.sin(angle) * clamped
      thumb.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
      flightInput.joystick.x = x / JOY_RADIUS
      flightInput.joystick.y = y / JOY_RADIUS
    }

    const reset = () => {
      activePointerId = null
      baseRect = null
      thumb.style.transform = 'translate(-50%, -50%)'
      flightInput.joystick.x = 0
      flightInput.joystick.y = 0
    }

    const onDown = (e: PointerEvent) => {
      if (activePointerId !== null) return
      e.preventDefault()
      activePointerId = e.pointerId
      baseRect = base.getBoundingClientRect()
      base.setPointerCapture?.(e.pointerId)
      const dx = e.clientX - (baseRect.left + baseRect.width / 2)
      const dy = e.clientY - (baseRect.top + baseRect.height / 2)
      setThumb(dx, dy)
    }

    const onMove = (e: PointerEvent) => {
      if (activePointerId !== e.pointerId || !baseRect) return
      e.preventDefault()
      const dx = e.clientX - (baseRect.left + baseRect.width / 2)
      const dy = e.clientY - (baseRect.top + baseRect.height / 2)
      setThumb(dx, dy)
    }

    const onUp = (e: PointerEvent) => {
      if (activePointerId !== e.pointerId) return
      e.preventDefault()
      try {
        base.releasePointerCapture?.(e.pointerId)
      } catch {}
      reset()
    }

    base.addEventListener('pointerdown', onDown)
    base.addEventListener('pointermove', onMove)
    base.addEventListener('pointerup', onUp)
    base.addEventListener('pointercancel', onUp)

    return () => {
      base.removeEventListener('pointerdown', onDown)
      base.removeEventListener('pointermove', onMove)
      base.removeEventListener('pointerup', onUp)
      base.removeEventListener('pointercancel', onUp)
      reset()
    }
  }, [])

  useEffect(() => {
    const rail = gearRailRef.current
    const handle = gearHandleRef.current
    if (!rail || !handle) return

    let activePointerId: number | null = null
    let railRect: DOMRect | null = null

    const applyGear = (nextGear: (typeof DRIVE_GEARS)[number]) => {
      flightInput.driveGear = nextGear
      driveGearRef.current = nextGear
      setDriveGear(nextGear)
    }

    const gearFromClientY = (clientY: number) => {
      if (!railRect) return driveGearRef.current
      const raw = (clientY - railRect.top) / railRect.height
      const travel = 1 - GEAR_TRAVEL_INSET * 2
      const clamped = Math.max(0, Math.min(1, (raw - GEAR_TRAVEL_INSET) / travel))
      const index = Math.round((1 - clamped) * (DRIVE_GEAR_ORDER.length - 1))
      return gearFromIndex(index)
    }

    const onDown = (e: PointerEvent) => {
      if (activePointerId !== null) return
      e.preventDefault()
      activePointerId = e.pointerId
      railRect = rail.getBoundingClientRect()
      rail.setPointerCapture?.(e.pointerId)
      applyGear(gearFromClientY(e.clientY))
    }

    const onMove = (e: PointerEvent) => {
      if (activePointerId !== e.pointerId || !railRect) return
      e.preventDefault()
      applyGear(gearFromClientY(e.clientY))
    }

    const onUp = (e: PointerEvent) => {
      if (activePointerId !== e.pointerId) return
      e.preventDefault()
      try {
        rail.releasePointerCapture?.(e.pointerId)
      } catch {}
      activePointerId = null
      railRect = null
    }

    rail.addEventListener('pointerdown', onDown)
    rail.addEventListener('pointermove', onMove)
    rail.addEventListener('pointerup', onUp)
    rail.addEventListener('pointercancel', onUp)

    return () => {
      rail.removeEventListener('pointerdown', onDown)
      rail.removeEventListener('pointermove', onMove)
      rail.removeEventListener('pointerup', onUp)
      rail.removeEventListener('pointercancel', onUp)
    }
  }, [])

  useEffect(() => {
    const keyState = { left: false, right: false, up: false, down: false }
    const updateJoystickFromKeys = () => {
      const x = (keyState.right ? 1 : 0) - (keyState.left ? 1 : 0)
      const y = (keyState.down ? 1 : 0) - (keyState.up ? 1 : 0)
      flightInput.joystick.x = x
      flightInput.joystick.y = y
    }

    const setGear = (nextGear: (typeof DRIVE_GEARS)[number]) => {
      flightInput.driveGear = nextGear
      setDriveGear(nextGear)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          keyState.left = true
          updateJoystickFromKeys()
          break
        case 'ArrowRight':
          keyState.right = true
          updateJoystickFromKeys()
          break
        case 'ArrowUp':
        case 'w':
        case 'W':
          keyState.up = true
          updateJoystickFromKeys()
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          keyState.down = true
          updateJoystickFromKeys()
          break
        case '0':
          setGear('0')
          break
        case '1':
          setGear('1')
          break
        case '2':
          setGear('2')
          break
        case '3':
          setGear('3')
          break
        case 'r':
        case 'R':
          setGear('R')
          break
        case 'e':
        case 'E':
        case 'End':
          setGear('WARP')
          break
        case 'PageUp': {
          const nextIndex = Math.min(DRIVE_GEAR_ORDER.length - 1, gearIndex(driveGearRef.current) + 1)
          setGear(gearFromIndex(nextIndex))
          break
        }
        case 'PageDown': {
          const nextIndex = Math.max(0, gearIndex(driveGearRef.current) - 1)
          setGear(gearFromIndex(nextIndex))
          break
        }
        case 'Home':
          setGear('R')
          break
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          keyState.left = false
          updateJoystickFromKeys()
          break
        case 'ArrowRight':
          keyState.right = false
          updateJoystickFromKeys()
          break
        case 'ArrowUp':
        case 'w':
        case 'W':
          keyState.up = false
          updateJoystickFromKeys()
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          keyState.down = false
          updateJoystickFromKeys()
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    let raf = 0
    let lastMessageId = 0
    let lastHudRefresh = 0

    const tick = () => {
      if (speedRef.current) speedRef.current.textContent = flightHUD.speed.toFixed(2)
      if (nearestRef.current) nearestRef.current.textContent = flightHUD.nearest || 'UNKNOWN'
      if (earthDistRef.current) earthDistRef.current.textContent = `${Math.round(flightHUD.earthDist)}u`
      if (warpBadgeRef.current) warpBadgeRef.current.style.opacity = flightHUD.warpActive ? '1' : '0'
      if (warpVignetteRef.current) warpVignetteRef.current.style.opacity = flightHUD.warpActive ? '1' : '0'
      if (crashFlashRef.current) crashFlashRef.current.style.opacity = flightHUD.crashFlash.toFixed(2)

      if (flightCompanion.id !== lastMessageId && flightCompanion.visible) {
        lastMessageId = flightCompanion.id
        setCompanionVisible(true)
        if (messageTimerRef.current) window.clearTimeout(messageTimerRef.current)
        if (messageTypeTimerRef.current) window.clearTimeout(messageTypeTimerRef.current)

        const fullMessage = flightCompanion.message
        let charIndex = 0
        setCompanionMessage('')

        const typeNext = () => {
          charIndex += 1
          setCompanionMessage(fullMessage.slice(0, charIndex))
          if (charIndex >= fullMessage.length) {
            messageTypeTimerRef.current = null
            messageTimerRef.current = window.setTimeout(() => {
              setCompanionVisible(false)
              clearFlightMessage()
            }, 2800)
            return
          }

          const current = fullMessage[charIndex - 1]
          const nextDelay = current === '.' || current === '?' || current === '!' ? 220 : current === ',' ? 120 : 42
          messageTypeTimerRef.current = window.setTimeout(typeNext, nextDelay)
        }

        messageTypeTimerRef.current = window.setTimeout(typeNext, 220)
      }

      if (performance.now() - lastHudRefresh > 120) {
        lastHudRefresh = performance.now()
        setHudTick((value) => value + 1)
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <style>{`
        .flight-overlay {
          font-family: monospace;
          color: #fff;
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .joy-base {
          touch-action: none;
        }
        .gear-rail {
          touch-action: none;
          cursor: grab;
        }
        .gear-rail:active {
          cursor: grabbing;
        }
        .gear-stop {
          transition: opacity 0.15s ease, color 0.15s ease, transform 0.15s ease;
        }
        .gear-handle {
          transition: top 0.12s ease, transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease, border-color 0.12s ease;
        }
        .warp-badge,
        .warp-vignette,
        .crash-flash {
          transition: opacity 0.25s ease;
        }
        @keyframes warpPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(102, 221, 255, 0.7); }
          50% { box-shadow: 0 0 28px rgba(102, 221, 255, 0.95); }
        }
      `}</style>

      <div className="flight-overlay" style={{ position: 'fixed', inset: 0, zIndex: 30, pointerEvents: 'none' }}>
        <div
          ref={crashFlashRef}
          className="crash-flash"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            background:
              'radial-gradient(circle at center, rgba(255, 244, 220, 0.94) 0%, rgba(255, 170, 80, 0.7) 30%, rgba(18, 8, 4, 0.88) 100%)',
          }}
        />

        <div
          ref={warpVignetteRef}
          className="warp-vignette"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            background:
              'radial-gradient(ellipse at center, transparent 35%, rgba(0, 40, 120, 0.35) 70%, rgba(0, 10, 40, 0.72) 100%)',
          }}
        />

        {companionVisible && (
          <div
            style={{
              position: 'absolute',
              top: isMobile ? 186 : 146,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              maxWidth: isMobile ? 'calc(100vw - 36px)' : 440,
              padding: '12px 14px',
              background: 'rgba(8, 10, 18, 0.74)',
              border: '1px solid rgba(149, 214, 255, 0.34)',
              borderRadius: 18,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 18px 40px rgba(0, 0, 0, 0.34)',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(180deg, rgba(173, 236, 255, 0.95), rgba(94, 170, 255, 0.85))',
                border: '1px solid rgba(210, 245, 255, 0.95)',
                position: 'relative',
                flex: '0 0 auto',
                boxShadow: '0 0 16px rgba(110, 198, 255, 0.48)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -7,
                  left: '50%',
                  width: 2,
                  height: 10,
                  background: 'rgba(190, 240, 255, 0.95)',
                  transform: 'translateX(-50%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: -10,
                  left: '50%',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#f8fcff',
                  transform: 'translateX(-50%)',
                }}
              />
              <div style={{ position: 'absolute', top: 15, left: 11, width: 7, height: 7, borderRadius: '50%', background: '#07243d' }} />
              <div style={{ position: 'absolute', top: 15, right: 11, width: 7, height: 7, borderRadius: '50%', background: '#07243d' }} />
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: 10,
                  width: 16,
                  height: 8,
                  borderBottom: '2px solid #0b3558',
                  borderRadius: '0 0 12px 12px',
                  transform: 'translateX(-50%)',
                }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.22em', color: 'rgba(164, 227, 255, 0.86)', marginBottom: 4 }}>
                COMPANION
              </div>
              <div style={{ fontSize: isMobile ? 11 : 12, lineHeight: 1.45, color: '#f3f7fb' }}>{companionMessage}</div>
            </div>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            top: isMobile ? 122 : 88,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: isMobile ? 10 : 14,
            alignItems: 'stretch',
            background: 'rgba(3, 4, 10, 0.58)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(184, 134, 11, 0.26)',
            borderRadius: 22,
            padding: isMobile ? '10px 12px' : '10px 16px',
            fontSize: 10,
            letterSpacing: '0.18em',
            whiteSpace: 'nowrap',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.26)',
          }}
        >
          <HudStat label="SPD" valueRef={speedRef} suffix="u/s" minWidth={44} />
          <HudDivider />
          <HudStat label="NEAR" valueRef={nearestRef} minWidth={66} />
          <HudDivider />
          <HudStat label="EARTH" valueRef={earthDistRef} minWidth={58} />
          <span
            ref={warpBadgeRef}
            className="warp-badge"
            style={{
              opacity: 0,
              color: '#88efff',
              fontWeight: 700,
              animation: 'warpPulse 0.7s infinite',
              padding: '2px 8px',
              borderRadius: 999,
              border: '1px solid rgba(136, 239, 255, 0.85)',
              fontSize: 9,
              alignSelf: 'center',
            }}
          >
            WARP
          </span>
        </div>

        <HudMarkers isMobile={isMobile} />
        <div
          ref={joyBaseRef}
          className="joy-base"
          style={{
            position: 'absolute',
            bottom: isMobile ? 22 : 28,
            left: isMobile ? 18 : 28,
            width: isMobile ? 138 : 130,
            height: isMobile ? 138 : 130,
            borderRadius: '50%',
            border: '1.5px dashed rgba(184, 134, 11, 0.52)',
            background: 'rgba(2, 1, 1, 0.34)',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 14px 26px rgba(0, 0, 0, 0.24)',
          }}
          aria-label="Flight joystick"
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'rgba(184, 134, 11, 0.42)',
            }}
          />
          <div
            ref={joyThumbRef}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #ffd680, #b8860b 60%, #5a3f00 100%)',
              border: '1px solid rgba(255, 200, 100, 0.72)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.56), inset 0 1px 4px rgba(255, 255, 255, 0.3)',
              pointerEvents: 'none',
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            right: isMobile ? 12 : 18,
            bottom: isMobile ? 18 : 26,
            width: isMobile ? 92 : 104,
            height: isMobile ? 136 : 150,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            alignItems: 'stretch',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              padding: '0 4px',
              color: 'rgba(255, 241, 210, 0.82)',
              fontSize: 7,
              letterSpacing: '0.18em',
            }}
          >
            <span>GEAR</span>
            <span style={{ color: driveGear === 'WARP' ? '#9bf7ff' : '#f7ecd0' }}>{DRIVE_GEAR_LABELS[driveGear]}</span>
          </div>
          <div
            ref={gearRailRef}
            className="gear-rail"
            style={{
              position: 'relative',
              flex: 1,
              borderRadius: 26,
              background:
                'linear-gradient(180deg, rgba(12, 12, 18, 0.82) 0%, rgba(14, 13, 20, 0.7) 18%, rgba(6, 6, 10, 0.84) 100%)',
              border: '1px solid rgba(184, 134, 11, 0.28)',
              boxShadow: '0 18px 34px rgba(0, 0, 0, 0.32), inset 0 0 22px rgba(184, 134, 11, 0.08)',
              backdropFilter: 'blur(12px)',
              overflow: 'hidden',
            }}
            aria-label="Gear selector"
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 8,
                bottom: 8,
                width: 2,
                transform: 'translateX(-50%)',
                background: 'linear-gradient(180deg, rgba(255, 236, 200, 0.12), rgba(255, 236, 200, 0.04), rgba(255, 236, 200, 0.12))',
              }}
            />
            {DRIVE_GEAR_ORDER.map((gear, index) => {
              const t = index / (DRIVE_GEAR_ORDER.length - 1)
              const isActive = driveGear === gear
              const isAbove = index > selectedGearIndex
              const isBelow = index < selectedGearIndex
              const isWarp = gear === 'WARP'
              return (
                <div
                  key={gear}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${gearTopPercent(index)}%`,
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 7px',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    className="gear-stop"
                    style={{
                      width: isActive ? 14 : 10,
                      height: 2,
                      borderRadius: 999,
                      background: isWarp
                        ? 'rgba(155, 247, 255, 0.9)'
                        : isActive
                          ? 'rgba(255, 241, 210, 0.92)'
                          : 'rgba(184, 134, 11, 0.34)',
                      boxShadow: isWarp && isActive ? '0 0 12px rgba(155, 247, 255, 0.72)' : 'none',
                      opacity: isActive ? 1 : isAbove ? 0.72 : isBelow ? 0.58 : 0.86,
                    }}
                  />
                  <div
                    className="gear-stop"
                    style={{
                      fontSize: isWarp ? 6 : 8,
                      letterSpacing: '0.08em',
                      color: isActive ? '#fff5d8' : isWarp ? 'rgba(155, 247, 255, 0.72)' : 'rgba(236, 222, 196, 0.58)',
                      textShadow: isActive ? '0 0 8px rgba(255, 241, 210, 0.22)' : 'none',
                    }}
                  >
                    {DRIVE_GEAR_LABELS[gear]}
                  </div>
                </div>
              )
            })}
            <div
              ref={gearHandleRef}
              className="gear-handle"
              style={{
                position: 'absolute',
                left: '50%',
                top: `${gearTopPercent(selectedGearIndex)}%`,
                transform: 'translate(-50%, -50%)',
                width: isMobile ? 48 : 54,
                height: isMobile ? 24 : 26,
                borderRadius: 999,
                border: `1px solid ${driveGear === 'WARP' ? 'rgba(155, 247, 255, 0.9)' : 'rgba(255, 232, 190, 0.58)'}`,
                background:
                  driveGear === 'WARP'
                    ? 'linear-gradient(180deg, rgba(77, 245, 255, 0.7), rgba(20, 110, 130, 0.58))'
                    : driveGear === '0'
                      ? 'linear-gradient(180deg, rgba(255, 244, 223, 0.7), rgba(122, 94, 28, 0.45))'
                      : 'linear-gradient(180deg, rgba(255, 214, 132, 0.72), rgba(125, 92, 10, 0.55))',
                boxShadow:
                  driveGear === 'WARP'
                    ? '0 0 28px rgba(155, 247, 255, 0.55), inset 0 0 10px rgba(255, 255, 255, 0.22)'
                    : '0 0 18px rgba(255, 214, 132, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 4,
                  borderRadius: 999,
                  background: driveGear === 'WARP' ? 'rgba(233, 255, 255, 0.95)' : 'rgba(255, 248, 230, 0.95)',
                  boxShadow: driveGear === 'WARP' ? '0 0 10px rgba(155, 247, 255, 0.82)' : '0 0 10px rgba(255, 248, 230, 0.32)',
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 4px',
              color: 'rgba(255, 241, 210, 0.58)',
              fontSize: 6,
              letterSpacing: '0.08em',
            }}
          >
            <span>SHIFT</span>
            <span style={{ color: driveGear === 'WARP' ? '#9bf7ff' : '#f1e4c2' }}>STOP AT 0</span>
          </div>
        </div>

        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 9,
              letterSpacing: '0.18em',
              opacity: 0.46,
              color: '#fff',
              whiteSpace: 'nowrap',
            }}
          >
            ARROWS OR WASD TO STEER  |  DRAG GEAR LEVER  |  0 STOP  |  1-3 GEAR  |  R REVERSE  |  END WARP
          </div>
        )}
      </div>
    </>
  )
}

function HudMarkers({ isMobile }: { isMobile: boolean }) {
  const markers = flightHUD.hudMarkers
  const priorityNames = new Set(['SATURN', 'EARTH', 'SUN'])

  return (
    <>
      {markers.map((marker) => {
        const isPriority = priorityNames.has(marker.name) || marker.name === flightHUD.nearest
        const baseColor = marker.color
        const commonStyle = {
          position: 'absolute' as const,
          left: `${(marker.x * 100).toFixed(3)}%`,
          top: `${(marker.y * 100).toFixed(3)}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none' as const,
          zIndex: 32,
        }

        if (marker.onScreen) {
          return (
            <div key={marker.name} style={commonStyle}>
              <div
                style={{
                  position: 'relative',
                  width: isPriority ? 28 : 22,
                  height: isPriority ? 28 : 22,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    border: `1px solid ${baseColor}`,
                    borderRadius: '50%',
                    opacity: marker.behind ? 0.28 : isPriority ? 0.82 : 0.56,
                    boxShadow: `0 0 12px ${baseColor}33`,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: isPriority ? 5 : 4,
                    height: isPriority ? 5 : 4,
                    borderRadius: '50%',
                    background: baseColor,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 0 10px ${baseColor}`,
                    opacity: marker.behind ? 0.4 : 1,
                  }}
                />
              </div>
              {isPriority ? (
                <div
                  style={{
                    marginTop: 5,
                    padding: '2px 6px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.14)',
                    background: 'rgba(3, 6, 14, 0.64)',
                    color: '#f2ede4',
                    fontSize: isMobile ? 8 : 9,
                    letterSpacing: '0.16em',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {marker.name}
                </div>
              ) : null}
            </div>
          )
        }

        const angle = Math.atan2(marker.y - 0.5, marker.x - 0.5)
        return (
          <div key={marker.name} style={commonStyle}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transform: `translate(-50%, -50%) rotate(${angle}rad)`,
                opacity: marker.behind ? 0.38 : isPriority ? 0.9 : 0.58,
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: '7px solid transparent',
                  borderBottom: '7px solid transparent',
                  borderLeft: `12px solid ${baseColor}`,
                  filter: `drop-shadow(0 0 6px ${baseColor})`,
                }}
              />
              {isPriority ? (
                <div
                  style={{
                    transform: `rotate(${-angle}rad)`,
                    padding: '2px 5px',
                    borderRadius: 999,
                    background: 'rgba(3, 6, 14, 0.7)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#f2ede4',
                    fontSize: isMobile ? 8 : 9,
                    letterSpacing: '0.14em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {marker.name}
                </div>
              ) : null}
            </div>
          </div>
        )
      })}
    </>
  )
}

function HudDivider() {
  return <span style={{ width: 1, background: 'rgba(255, 255, 255, 0.14)' }} />
}

function HudStat({
  label,
  valueRef,
  suffix,
  minWidth,
}: {
  label: string
  valueRef: RefObject<HTMLSpanElement | null>
  suffix?: string
  minWidth: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 8, color: 'rgba(184, 209, 230, 0.56)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span ref={valueRef as RefObject<HTMLSpanElement>} style={{ color: '#fff', minWidth, fontSize: 11 }}>
          --
        </span>
        {suffix ? <span style={{ color: 'rgba(255, 255, 255, 0.48)', fontSize: 9 }}>{suffix}</span> : null}
      </div>
    </div>
  )
}
