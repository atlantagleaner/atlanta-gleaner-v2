'use client'

import React, { useState, useRef, useEffect, useCallback, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import { flushSync } from 'react-dom'

const mono = { fontFamily: "'IBM Plex Mono', monospace" }
const MIN_PCT = 12 
const MAX_PCT = 64

interface Panel { label: string; node: ReactNode }
interface FourPanelsProps { col1: Panel; col2: Panel; col3: Panel; col4: Panel }

// ── 1. The Mobile "Surprise" Box (Accordion) ───────────────────
function MobilePanel({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
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
      <div style={{ 
        overflow: 'hidden', 
        maxHeight: open ? '9999px' : '0', 
        transition: 'max-height 0.3s ease',
        background: '#fff',
        border: '1px solid #eee'
      }}>
        {children}
      </div>
    </div>
  )
}

// ── 2. Resize Handle (For Desktop) ──────────────────────────────
function ResizeHandle({ onMouseDown }: { onMouseDown: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseDown={onMouseDown} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ width: hovered ? '6px' : '4px', cursor: 'col-resize', flexShrink: 0, background: hovered ? '#000000' : '#EEEDEB', transition: 'all 0.15s', alignSelf: 'stretch', position: 'relative', userSelect: 'none' }}>
    </div>
  )
}

// ── 3. Drag Handle (For Desktop) ────────────────────────────────
function DragBar({ label, onPointerDown, isDragging }: { label: string, onPointerDown: any, isDragging: boolean }) {
  return (
    <div onPointerDown={onPointerDown} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 10px', background: isDragging ? '#EEEDEB' : '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)', cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none' }}>
      <span style={{ ...mono, fontSize: '9px', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.18em' }}>{label}</span>
    </div>
  )
}

export function FourResizablePanels({ col1, col2, col3, col4 }: FourPanelsProps) {
  const panels = [col1, col2, col3, col4]
  
  const [widths, setWidths] = useState([25, 25, 25, 25]) 
  const [order, setOrder] = useState([0, 1, 2, 3])
  const [isMobile, setIsMobile] = useState(false)
  const [dragSlot, setDragSlot] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const colRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null])
  const resizeDragging = useRef<number | null>(null)

  const isDraggingRef = useRef(false)
  const dragSlotRef = useRef<number | null>(null)
  const dragStartX = useRef(0)
  const dragStartY = useRef(0)
  const dragAdjX = useRef(0)
  const naturalLefts = useRef<number[]>([0, 0, 0, 0])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (resizeDragging.current === null || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    setWidths(prev => {
      const next = [...prev]
      const idx = resizeDragging.current! 
      const abs = [0, prev[0], prev[0]+prev[1], prev[0]+prev[1]+prev[2], 100]
      let newB = pct
      if (newB < abs[idx] + MIN_PCT) newB = abs[idx] + MIN_PCT
      if (newB > abs[idx+2] - MIN_PCT) newB = abs[idx+2] - MIN_PCT
      next[idx] = newB - abs[idx]; next[idx+1] = abs[idx+2] - newB; return next
    })
  }, [])

  const stopResize = useCallback(() => { resizeDragging.current = null }, [])
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', stopResize)
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', stopResize) }
  }, [handleMouseMove, stopResize])

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!isDraggingRef.current || dragSlotRef.current === null) return
      const slot = dragSlotRef.current; const col = colRefs.current[slot]
      if (!col) return
      const dx = e.clientX - dragStartX.current - dragAdjX.current; const dy = e.clientY - dragStartY.current
      col.style.transform = `translate(${dx}px, ${dy}px) rotate(-0.3deg) scale(1.01)`
      const visualCentre = col.getBoundingClientRect().left + col.getBoundingClientRect().width / 2
      for (let i = 0; i < 4; i++) {
        if (i === slot) continue
        const other = colRefs.current[i]; if (!other) continue
        const otherMid = other.getBoundingClientRect().left + other.getBoundingClientRect().width / 2
        if ((i > slot && visualCentre > otherMid) || (i < slot && visualCentre < otherMid)) {
          dragAdjX.current += (naturalLefts.current[i] - naturalLefts.current[slot])
          const newDx = e.clientX - dragStartX.current - dragAdjX.current; dragSlotRef.current = i
          flushSync(() => { setOrder(prev => { const next = [...prev]; [next[slot], next[i]] = [next[i], next[slot]]; return next }); setDragSlot(i) })
          const displaced = colRefs.current[slot]
          if (displaced) { displaced.style.transition = 'transform 0.22s'; requestAnimationFrame(() => { if (displaced) displaced.style.transform = 'none' }); setTimeout(() => { if (displaced) displaced.style.transition = '' }, 240) }
          const dragCol = colRefs.current[i]
          if (dragCol) { dragCol.style.transition = 'none'; dragCol.style.transform = `translate(${newDx}px, ${dy}px) rotate(-0.3deg) scale(1.01)`; dragCol.style.zIndex = '10'; dragCol.style.position = 'relative' }
          break
        }
      }
    }
    function onUp() {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false; const slot = dragSlotRef.current
      if (slot !== null && colRefs.current[slot]) {
        const col = colRefs.current[slot]!; col.style.transition = 'transform 0.2s'; col.style.transform = 'none'; col.style.zIndex = ''; setTimeout(() => { col.style.transition = ''; col.style.position = '' }, 220)
      }
      setDragSlot(null); dragSlotRef.current = null; dragAdjX.current = 0
    }
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [])

  const startDrag = useCallback((slot: number, e: ReactPointerEvent<HTMLDivElement>) => {
    if (resizeDragging.current !== null || isDraggingRef.current) return
    naturalLefts.current = colRefs.current.map(c => c?.getBoundingClientRect().left ?? 0)
    dragSlotRef.current = slot; dragStartX.current = e.clientX; dragStartY.current = e.clientY; dragAdjX.current = 0; isDraggingRef.current = true
    const col = colRefs.current[slot]; if (col) { col.style.position = 'relative'; col.style.zIndex = '10'; }
    setDragSlot(slot); e.preventDefault()
  }, [])

  if (isMobile) {
    return (
      <div style={{ padding: '0 12px 48px' }}>
        {order.map(idx => (
          <MobilePanel key={idx} label={panels[idx].label}>
            {panels[idx].node}
          </MobilePanel>
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'row', width: '100%', padding: '0 20px 60px', maxWidth: '1800px', margin: '0 auto', userSelect: 'none', boxSizing: 'border-box', cursor: dragSlot !== null ? 'grabbing' : 'auto' }}>
      {[0, 1, 2, 3].map((slot, idx) => (
        <React.Fragment key={slot}>
          <div ref={el => { colRefs.current[slot] = el }} style={{ width: `${widths[slot]}%`, display: 'flex', flexDirection: 'column' }}>
            <DragBar label={panels[order[slot]].label} onPointerDown={e => startDrag(slot, e)} isDragging={dragSlot === slot} />
            {panels[order[slot]].node}
          </div>
          {idx < 3 && <ResizeHandle onMouseDown={() => { resizeDragging.current = idx }} />}
        </React.Fragment>
      ))}
    </div>
  )
}