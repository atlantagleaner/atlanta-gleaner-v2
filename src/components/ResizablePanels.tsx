'use client'

import {
  useState, useRef, useEffect, useCallback,
  type ReactNode, type CSSProperties, type PointerEvent as ReactPointerEvent,
} from 'react'
import { flushSync } from 'react-dom'

const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const MIN_PCT = 16
const MAX_PCT = 62

interface Panel { label: string; node: ReactNode }
interface ResizablePanelsProps { left: Panel; center: Panel; right: Panel }

// ── Mobile accordion ──────────────────────────────────────────────────────────
function MobilePanel({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ marginBottom: '12px' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', background: '#000000', border: 'none',
        padding: '10px 14px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
      }}>
        <span style={{ ...mono, fontSize: '9px', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.22em' }}>
          {label}
        </span>
        <span style={{
          ...mono, fontSize: '11px', color: '#FFFFFF',
          transition: 'transform 0.2s', display: 'inline-block',
          transform: open ? 'rotate(90deg)' : 'rotate(0)',
        }}>▶</span>
      </button>
      <div style={{ overflow: 'hidden', maxHeight: open ? '9999px' : '0', transition: 'max-height 0.3s ease' }}>
        {children}
      </div>
    </div>
  )
}

// ── Resize handle ─────────────────────────────────────────────────────────────
function ResizeHandle({ onMouseDown }: { onMouseDown: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Drag to resize"
      style={{
        width: hovered ? '6px' : '4px', cursor: 'col-resize', flexShrink: 0,
        background: hovered ? '#000000' : '#EEEDEB',
        transition: 'all 0.15s', alignSelf: 'stretch', position: 'relative', userSelect: 'none',
      }}
    >
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        display: 'flex', flexDirection: 'column', gap: '4px',
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: '2px', height: '2px', borderRadius: '50%', background: '#000000' }} />
        ))}
      </div>
    </div>
  )
}

// ── Drag handle bar ───────────────────────────────────────────────────────────
function DragBar({ label, onPointerDown, isDragging }: {
  label: string
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void
  isDragging: boolean
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '5px 10px',
        background: isDragging ? '#EEEDEB' : '#FFFFFF',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        transition: 'background 0.12s',
      }}
    >
      <div style={{ display: 'flex', gap: '3px', opacity: 0.4 }}>
        {[0,1].map(col => (
          <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {[0,1,2].map(row => (
              <div key={row} style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#000' }} />
            ))}
          </div>
        ))}
      </div>
      <span style={{ ...mono, fontSize: '9px', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
        {label}
      </span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ResizablePanels({ left, center, right }: ResizablePanelsProps) {
  const panels = [left, center, right]

  const [widths,   setWidths]   = useState([24, 50, 26])
  const [order,    setOrder]    = useState([0, 1, 2])
  const [isMobile, setIsMobile] = useState(false)
  const [dragSlot, setDragSlot] = useState<number | null>(null)

  const containerRef   = useRef<HTMLDivElement>(null)
  const colRefs        = useRef<(HTMLDivElement | null)[]>([null, null, null])
  const resizeDragging = useRef<'left' | 'right' | null>(null)

  // Drag tracking — all refs so the pointer handler (mounted once) always reads fresh values
  const isDraggingRef  = useRef(false)
  const dragSlotRef    = useRef<number | null>(null)
  const dragStartX     = useRef(0)
  const dragStartY     = useRef(0)
  const dragAdjX       = useRef(0)          // accumulated offset correction after each swap
  const naturalLefts   = useRef<number[]>([0, 0, 0])

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Column resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizeDragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct  = ((e.clientX - rect.left) / rect.width) * 100
    setWidths(prev => {
      const [l, c, r] = prev
      if (resizeDragging.current === 'left') {
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

  const stopResize = useCallback(() => { resizeDragging.current = null }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup',   stopResize)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup',   stopResize)
    }
  }, [handleMouseMove, stopResize])

  // ── Pointer drag listeners (mounted once, use refs for all mutable state) ──
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!isDraggingRef.current) return
      const slot = dragSlotRef.current
      if (slot === null) return
      const col = colRefs.current[slot]
      if (!col) return

      const dx = e.clientX - dragStartX.current - dragAdjX.current
      const dy = e.clientY - dragStartY.current

      // Move the real column — no ghost, all content inside travels with it
      col.style.transform = `translate(${dx}px, ${dy}px) rotate(-0.3deg) scale(1.01)`

      // Check if the column's visual centre has crossed another column's midpoint
      const rect        = col.getBoundingClientRect()
      const visualCentre = rect.left + rect.width / 2

      for (let i = 0; i < 3; i++) {
        if (i === slot) continue
        const other = colRefs.current[i]
        if (!other) continue
        const otherRect = other.getBoundingClientRect()
        const otherMid  = otherRect.left + otherRect.width / 2

        const crossed = (i > slot && visualCentre > otherMid) ||
                        (i < slot && visualCentre < otherMid)

        if (!crossed) continue

        // ── Swap ─────────────────────────────────────────────────────────────
        const naturalS = naturalLefts.current[slot]
        const naturalI = naturalLefts.current[i]

        // Recalculate the drag offset so the column stays visually continuous
        // after its "home" container changes from slot → i
        dragAdjX.current += (naturalI - naturalS)
        const newDx = e.clientX - dragStartX.current - dragAdjX.current
        dragSlotRef.current = i

        // Commit the order change synchronously so colRefs reflect new content
        flushSync(() => {
          setOrder(prev => {
            const next = [...prev]
            ;[next[slot], next[i]] = [next[i], next[slot]]
            return next
          })
          setDragSlot(i)
        })

        // After re-render: `colRefs.current[slot]` now holds the displaced column.
        // Its current transform (~translate(dx,dy)) puts it visually near naturalI.
        // Animate it sliding back to its natural position (translateX 0).
        const displaced = colRefs.current[slot]
        if (displaced) {
          displaced.style.transition = 'transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)'
          requestAnimationFrame(() => {
            if (displaced) displaced.style.transform = 'none'
          })
          // Clean up transition after animation so resize etc. work cleanly
          setTimeout(() => { if (displaced) displaced.style.transition = '' }, 240)
        }

        // `colRefs.current[i]` is now the dragged column — apply the corrected transform
        const dragCol = colRefs.current[i]
        if (dragCol) {
          dragCol.style.transition = 'none'
          dragCol.style.transform  = `translate(${newDx}px, ${dy}px) rotate(-0.3deg) scale(1.01)`
          dragCol.style.zIndex     = '10'
          dragCol.style.boxShadow  = '0 20px 56px rgba(0,0,0,0.18), 0 4px 14px rgba(0,0,0,0.10)'
          dragCol.style.position   = 'relative'
        }

        break
      }
    }

    function onUp() {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false

      const slot = dragSlotRef.current
      if (slot !== null) {
        const col = colRefs.current[slot]
        if (col) {
          // Snap back to natural position with a short ease
          col.style.transition = 'transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.2s'
          col.style.transform  = 'none'
          col.style.boxShadow  = ''
          col.style.zIndex     = ''
          setTimeout(() => {
            if (col) { col.style.transition = ''; col.style.position = '' }
          }, 220)
        }
      }

      setDragSlot(null)
      dragSlotRef.current = null
      dragAdjX.current    = 0
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup',   onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup',   onUp)
    }
  }, []) // mounted once — all state accessed through refs

  // ── Start drag ───────────────────────────────────────────────────────────────
  const startDrag = useCallback((slot: number, e: ReactPointerEvent<HTMLDivElement>) => {
    if (resizeDragging.current || isDraggingRef.current) return

    // Snapshot natural column positions before any transforms are applied
    naturalLefts.current = colRefs.current.map(c => c?.getBoundingClientRect().left ?? 0)

    dragSlotRef.current  = slot
    dragStartX.current   = e.clientX
    dragStartY.current   = e.clientY
    dragAdjX.current     = 0
    isDraggingRef.current = true

    const col = colRefs.current[slot]
    if (col) {
      col.style.position  = 'relative'
      col.style.zIndex    = '10'
      col.style.transition = 'box-shadow 0.12s'
      col.style.boxShadow = '0 20px 56px rgba(0,0,0,0.18), 0 4px 14px rgba(0,0,0,0.10)'
    }

    setDragSlot(slot)
    e.preventDefault()
  }, [])

  // ── Mobile ───────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ padding: '0 12px 48px' }}>
        {order.map(idx => (
          <MobilePanel key={idx} label={panels[idx].label}>{panels[idx].node}</MobilePanel>
        ))}
      </div>
    )
  }

  // ── Desktop ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex', flexDirection: 'row',
        width: '100%', padding: '0 20px 60px',
        maxWidth: '1600px', margin: '0 auto',
        userSelect: 'none', boxSizing: 'border-box',
        cursor: dragSlot !== null ? 'grabbing' : 'auto',
      }}
    >
      <div
        ref={el => { colRefs.current[0] = el }}
        style={{ width: `${widths[0]}%`, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}
      >
        <DragBar label={panels[order[0]].label} onPointerDown={e => startDrag(0, e)} isDragging={dragSlot === 0} />
        {panels[order[0]].node}
      </div>

      <ResizeHandle onMouseDown={() => { resizeDragging.current = 'left' }} />

      <div
        ref={el => { colRefs.current[1] = el }}
        style={{ width: `${widths[1]}%`, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}
      >
        <DragBar label={panels[order[1]].label} onPointerDown={e => startDrag(1, e)} isDragging={dragSlot === 1} />
        {panels[order[1]].node}
      </div>

      <ResizeHandle onMouseDown={() => { resizeDragging.current = 'right' }} />

      <div
        ref={el => { colRefs.current[2] = el }}
        style={{ width: `${widths[2]}%`, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}
      >
        <DragBar label={panels[order[2]].label} onPointerDown={e => startDrag(2, e)} isDragging={dragSlot === 2} />
        {panels[order[2]].node}
      </div>
    </div>
  )
}
