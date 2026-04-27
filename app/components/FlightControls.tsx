'use client'

import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  clearFlightMessage,
  flightCompanion,
  flightHUD,
  flightInput,
  resetFlightInput,
} from './flightInput'

export interface FlightControlsProps {
  isMobile?: boolean
  onExit?: () => void
}

const JOY_RADIUS = 44

export default function FlightControls({ isMobile = false, onExit }: FlightControlsProps) {
  const joyBaseRef = useRef<HTMLDivElement>(null)
  const joyThumbRef = useRef<HTMLDivElement>(null)
  const speedRef = useRef<HTMLSpanElement>(null)
  const nearestRef = useRef<HTMLSpanElement>(null)
  const earthDistRef = useRef<HTMLSpanElement>(null)
  const warpBadgeRef = useRef<HTMLSpanElement>(null)
  const warpVignetteRef = useRef<HTMLDivElement>(null)
  const crashFlashRef = useRef<HTMLDivElement>(null)
  const thrustBtnRef = useRef<HTMLButtonElement>(null)
  const reverseBtnRef = useRef<HTMLButtonElement>(null)
  const warpBtnRef = useRef<HTMLButtonElement>(null)
  const messageTimerRef = useRef<number | null>(null)
  const [companionMessage, setCompanionMessage] = useState('')
  const [companionVisible, setCompanionVisible] = useState(false)

  useEffect(() => {
    resetFlightInput()
    const prevOverflow = document.body.style.overflow
    const prevTouchAction = document.body.style.touchAction
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    return () => {
      resetFlightInput()
      document.body.style.overflow = prevOverflow
      document.body.style.touchAction = prevTouchAction
      if (messageTimerRef.current) window.clearTimeout(messageTimerRef.current)
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
    base.addEventListener('pointerleave', onUp)

    return () => {
      base.removeEventListener('pointerdown', onDown)
      base.removeEventListener('pointermove', onMove)
      base.removeEventListener('pointerup', onUp)
      base.removeEventListener('pointercancel', onUp)
      base.removeEventListener('pointerleave', onUp)
      reset()
    }
  }, [])

  useEffect(() => {
    const wire = (
      btn: HTMLButtonElement | null,
      key: 'thrust' | 'reverse' | 'warp',
      activeClass: string
    ) => {
      if (!btn) return () => {}
      let pointerId: number | null = null
      const press = (e: PointerEvent) => {
        if (pointerId !== null) return
        e.preventDefault()
        pointerId = e.pointerId
        btn.setPointerCapture?.(e.pointerId)
        flightInput[key] = true
        btn.classList.add(activeClass)
      }
      const release = (e: PointerEvent) => {
        if (pointerId !== e.pointerId) return
        e.preventDefault()
        try {
          btn.releasePointerCapture?.(e.pointerId)
        } catch {}
        pointerId = null
        flightInput[key] = false
        btn.classList.remove(activeClass)
      }
      btn.addEventListener('pointerdown', press)
      btn.addEventListener('pointerup', release)
      btn.addEventListener('pointercancel', release)
      btn.addEventListener('pointerleave', release)
      return () => {
        btn.removeEventListener('pointerdown', press)
        btn.removeEventListener('pointerup', release)
        btn.removeEventListener('pointercancel', release)
        btn.removeEventListener('pointerleave', release)
      }
    }

    const cleanups = [
      wire(thrustBtnRef.current, 'thrust', 'btn-active-thrust'),
      wire(reverseBtnRef.current, 'reverse', 'btn-active-reverse'),
      wire(warpBtnRef.current, 'warp', 'btn-active-warp'),
    ]
    return () => cleanups.forEach((cleanup) => cleanup())
  }, [])

  useEffect(() => {
    const keyState = { left: false, right: false, up: false, down: false }
    const updateJoystickFromKeys = () => {
      const x = (keyState.right ? 1 : 0) - (keyState.left ? 1 : 0)
      const y = (keyState.down ? 1 : 0) - (keyState.up ? 1 : 0)
      flightInput.joystick.x = x
      flightInput.joystick.y = y
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
        case ' ':
          flightInput.thrust = true
          break
        case 'Shift':
          flightInput.reverse = true
          break
        case 'e':
        case 'E':
          flightInput.warp = true
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
        case ' ':
          flightInput.thrust = false
          break
        case 'Shift':
          flightInput.reverse = false
          break
        case 'e':
        case 'E':
          flightInput.warp = false
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

    const tick = () => {
      if (speedRef.current) speedRef.current.textContent = flightHUD.speed.toFixed(2)
      if (nearestRef.current) nearestRef.current.textContent = flightHUD.nearest || 'UNKNOWN'
      if (earthDistRef.current) earthDistRef.current.textContent = `${Math.round(flightHUD.earthDist)}u`
      if (warpBadgeRef.current) warpBadgeRef.current.style.opacity = flightHUD.warpActive ? '1' : '0'
      if (warpVignetteRef.current) warpVignetteRef.current.style.opacity = flightHUD.warpActive ? '1' : '0'
      if (crashFlashRef.current) crashFlashRef.current.style.opacity = flightHUD.crashFlash.toFixed(2)

      if (flightCompanion.id !== lastMessageId && flightCompanion.visible) {
        lastMessageId = flightCompanion.id
        setCompanionMessage(flightCompanion.message)
        setCompanionVisible(true)
        if (messageTimerRef.current) window.clearTimeout(messageTimerRef.current)
        messageTimerRef.current = window.setTimeout(() => {
          setCompanionVisible(false)
          clearFlightMessage()
        }, 3600)
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
        .flight-btn {
          font-family: monospace;
          letter-spacing: 0.12em;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          background: rgba(184, 134, 11, 0.14);
          border: 1px solid rgba(184, 134, 11, 0.45);
          border-radius: 14px;
          padding: 14px 18px;
          cursor: pointer;
          touch-action: none;
          transition: background 0.08s ease, border-color 0.08s ease, transform 0.06s ease, box-shadow 0.12s ease;
          backdrop-filter: blur(8px);
          pointer-events: auto;
          min-width: 112px;
          text-align: center;
        }
        .flight-btn:active,
        .btn-active-thrust {
          background: rgba(255, 166, 59, 0.52) !important;
          border-color: #ffb35f !important;
          box-shadow: 0 0 22px rgba(255, 177, 95, 0.38);
          transform: scale(0.97);
        }
        .btn-active-reverse {
          background: rgba(74, 164, 255, 0.42) !important;
          border-color: #7ec9ff !important;
          box-shadow: 0 0 20px rgba(126, 201, 255, 0.45);
          transform: scale(0.97);
        }
        .btn-active-warp {
          background: rgba(77, 245, 255, 0.44) !important;
          border-color: #9bf7ff !important;
          box-shadow: 0 0 28px rgba(120, 243, 255, 0.6);
          transform: scale(0.97);
        }
        .joy-base {
          touch-action: none;
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

        {onExit && (
          <button
            onClick={onExit}
            className="flight-btn"
            style={{
              position: 'absolute',
              top: isMobile ? 124 : 90,
              left: isMobile ? 16 : 24,
              minWidth: 94,
              padding: '10px 14px',
              fontSize: 10,
            }}
          >
            EXIT
          </button>
        )}

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
            right: isMobile ? 18 : 22,
            bottom: isMobile ? 22 : 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            alignItems: 'stretch',
            pointerEvents: 'none',
          }}
        >
          <button
            ref={warpBtnRef}
            className="flight-btn"
            style={{
              fontSize: 12,
              color: '#d8fbff',
              background: 'rgba(18, 110, 132, 0.26)',
              borderColor: 'rgba(132, 242, 255, 0.34)',
            }}
          >
            WARP
          </button>
          <button ref={thrustBtnRef} className="flight-btn" style={{ fontSize: 13 }}>
            THRUST
          </button>
          <button
            ref={reverseBtnRef}
            className="flight-btn"
            style={{
              fontSize: 11,
              background: 'rgba(24, 62, 112, 0.28)',
              borderColor: 'rgba(122, 188, 255, 0.38)',
              color: '#d7e9ff',
            }}
          >
            REVERSE
          </button>
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
            ARROWS OR WASD TO STEER  |  SPACE THRUST  |  SHIFT REVERSE  |  E WARP
          </div>
        )}
      </div>
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
