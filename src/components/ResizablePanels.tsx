'use client'

// ─────────────────────────────────────────────────────────────────────────────
// ResizablePanels — three-column desktop layout with drag handles.
// On mobile (< 768px): stacked layout with tap-to-collapse per panel.
// Future Solito: strip desktop drag logic; use React Native ScrollView + Accordion
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback, type ReactNode, type CSSProperties } from 'react'

const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }

const MIN_PCT = 16
const MAX_PCT = 62

interface Panel {
  label: string
  node: ReactNode
}

interface ResizablePanelsProps {
  left: Panel
  center: Panel
  right: Panel
}

// ── Mobile accordion panel ──────────────────────────────────────────────────
function MobilePanel({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ marginBottom: '12px' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          background: '#111',
          border: 'none',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <span style={{ ...mono, fontSize: '9px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.22em' }}>
          {label}
        </span>
        <span style={{
          ...mono,
          fontSize: '11px',
          color: '#555',
          transition: 'transform 0.2s',
          display: 'inline-block',
          transform: open ? 'rotate(90deg)' : 'rotate(0)',
        }}>
          ▶
        </span>
      </button>
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? '9999px' : '0',
        transition: 'max-height 0.3s ease',
      }}>
        {children}
      </div>
    </div>
  )
}

// ── Desktop drag handle ───────────────────────────────────────────────────────
function DragHandle({ onMouseDown }: { onMouseDown: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Drag to resize"
      style={{
        width: hovered ? '6px' : '4px',
        cursor: 'col-resize',
        flexShrink: 0,
        background: hovered ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.08)',
        transition: 'all 0.15s',
        alignSelf: 'stretch',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Grip dots */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: '2px',
            height: '2px',
            borderRadius: '50%',
            background: hovered ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)',
          }} />
        ))}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function ResizablePanels({ left, center, right }: ResizablePanelsProps) {
  const [widths, setWidths] = useState([24, 50, 26]) // percentages, sum = 100
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<'left' | 'right' | null>(null)

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const startDrag = useCallback((side: 'left' | 'right') => {
    dragging.current = side
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100

    setWidths(prev => {
      const [l, c, r] = prev
      if (dragging.current === 'left') {
        const newL = Math.max(MIN_PCT, Math.min(MAX_PCT - MIN_PCT * 2, pct))
        const newC = l + c - newL
        if (newC < MIN_PCT) return prev
        return [newL, newC, r]
      } else {
        const newR = Math.max(MIN_PCT, Math.min(MAX_PCT - MIN_PCT * 2, 100 - pct))
        const newC = c + r - newR
        if (newC < MIN_PCT) return prev
        return [l, newC, newR]
      }
    })
  }, [])

  const stopDrag = useCallback(() => {
    dragging.current = null
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', stopDrag)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', stopDrag)
    }
  }, [handleMouseMove, stopDrag])

  // ── Mobile layout ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ padding: '0 12px 48px' }}>
        <MobilePanel label={left.label}>{left.node}</MobilePanel>
        <MobilePanel label={center.label}>{center.node}</MobilePanel>
        <MobilePanel label={right.label}>{right.node}</MobilePanel>
      </div>
    )
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        padding: '0 20px 60px',
        maxWidth: '1600px',
        margin: '0 auto',
        gap: '0',
        userSelect: dragging.current ? 'none' : 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: `${widths[0]}%`, minWidth: 0 }}>
        {left.node}
      </div>

      <DragHandle onMouseDown={() => startDrag('left')} />

      <div style={{ width: `${widths[1]}%`, minWidth: 0, padding: '0 4px' }}>
        {center.node}
      </div>

      <DragHandle onMouseDown={() => startDrag('right')} />

      <div style={{ width: `${widths[2]}%`, minWidth: 0 }}>
        {right.node}
      </div>
    </div>
  )
}
