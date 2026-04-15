'use client'

import React, {
  useState, useRef, useCallback, useEffect,
  type ReactNode, type PointerEvent as ReactPointerEvent,
} from 'react'
import { flushSync } from 'react-dom'
import { SPACING, ANIMATION, Z_INDEX, PAGE_MAX_W, PALETTE } from '@/src/styles/tokens'
import { useMobileDetect } from '@/src/hooks'
import { MobilePanel, ResizeHandle, DragBar } from '@/src/components/common'

const MIN_PCT = 16
const MAX_PCT = 62

interface Panel { label: string; node: ReactNode }
interface ResizablePanelsProps {
  left: Panel
  center: Panel
  right: Panel
  mobileInitialOpen?: Record<number, boolean>
  mobileOrder?: number[]
}

// ── Main component ─────────────────────────────────────────────────────────
export function ResizablePanels({ left, center, right, mobileInitialOpen, mobileOrder }: ResizablePanelsProps) {
  const panels = [left, center, right]
  const { isMobile, mounted } = useMobileDetect(768)

  // Only apply mobile layout after hydration to prevent mismatch
  const effectiveIsMobile = mounted ? isMobile : false

  const [widths,   setWidths]   = useState([24, 50, 26])
  const [order,    setOrder]    = useState([0, 1, 2])
  const [dragSlot, setDragSlot] = useState<number | null>(null)

  const containerRef   = useRef<HTMLDivElement>(null)
  const colRefs        = useRef<(HTMLDivElement | null)[]>([null, null, null])
  const resizeDragging = useRef<'left' | 'right' | null>(null)

  // Drag tracking — all refs so the pointer handler (mounted once) always reads fresh values
  const isDraggingRef  = useRef(false)
  const dragSlotRef    = useRef<number | null>(null)
  const dragStartX     = useRef(0)
  const dragStartY     = useRef(0)
  const dragAdjX       = useRef(0)
  const naturalLefts   = useRef<number[]>([0, 0, 0])

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

  // Resize listeners
  const setupResizeListeners = useCallback(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup',   stopResize)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup',   stopResize)
    }
  }, [handleMouseMove, stopResize])

  // Pointer drag listeners (mounted once, use refs for all mutable state)
  const setupDragListeners = useCallback(() => {
    function onMove(e: PointerEvent) {
      if (!isDraggingRef.current) return
      const slot = dragSlotRef.current
      if (slot === null) return
      const col = colRefs.current[slot]
      if (!col) return

      const dx = e.clientX - dragStartX.current - dragAdjX.current
      const dy = e.clientY - dragStartY.current

      col.style.transform = `translate(${dx}px, ${dy}px) rotate(-0.3deg) scale(1.01)`

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

        const naturalS = naturalLefts.current[slot]
        const naturalI = naturalLefts.current[i]

        dragAdjX.current += (naturalI - naturalS)
        const newDx = e.clientX - dragStartX.current - dragAdjX.current
        dragSlotRef.current = i

        flushSync(() => {
          setOrder(prev => {
            const next = [...prev]
            ;[next[slot], next[i]] = [next[i], next[slot]]
            return next
          })
          setDragSlot(i)
        })

        const displaced = colRefs.current[slot]
        if (displaced) {
          displaced.style.transition = 'transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)'
          requestAnimationFrame(() => {
            if (displaced) displaced.style.transform = 'none'
          })
          setTimeout(() => { if (displaced) displaced.style.transition = '' }, 240)
        }

        const dragCol = colRefs.current[i]
        if (dragCol) {
          dragCol.style.transition = 'none'
          dragCol.style.transform  = `translate(${newDx}px, ${dy}px) rotate(-0.3deg) scale(1.01)`
          dragCol.style.zIndex     = String(Z_INDEX.DROPDOWN)
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
  }, [])

  // Mount listeners on client
  useEffect(() => {
    const cleanupResize = setupResizeListeners()
    const cleanupDrag = setupDragListeners()
    return () => {
      cleanupResize()
      cleanupDrag()
    }
  }, [setupResizeListeners, setupDragListeners])

  // ── Start drag ───────────────────────────────────────────────────────────
  const startDrag = useCallback((slot: number, e: ReactPointerEvent<HTMLDivElement>) => {
    if (resizeDragging.current || isDraggingRef.current) return

    naturalLefts.current = colRefs.current.map(c => c?.getBoundingClientRect().left ?? 0)

    dragSlotRef.current  = slot
    dragStartX.current   = e.clientX
    dragStartY.current   = e.clientY
    dragAdjX.current     = 0
    isDraggingRef.current = true

    const col = colRefs.current[slot]
    if (col) {
      col.style.position  = 'relative'
      col.style.zIndex    = String(Z_INDEX.DROPDOWN)
      col.style.transition = 'box-shadow 0.12s'
      col.style.boxShadow = '0 20px 56px rgba(0,0,0,0.18), 0 4px 14px rgba(0,0,0,0.10)'
    }

    setDragSlot(slot)
    e.preventDefault()
  }, [])

  // ── Mobile ───────────────────────────────────────────────────────────────
  if (effectiveIsMobile) {
    const finalOrder = mobileOrder ?? [0, 1, 2]
    return (
      <div style={{ padding: '0 12px 48px' }}>
        {finalOrder.map(idx => (
          <MobilePanel key={idx} label={panels[idx].label} initialOpen={mobileInitialOpen?.[idx] ?? true}>
            {panels[idx].node}
          </MobilePanel>
        ))}
      </div>
    )
  }

  // ── Desktop ──────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex', flexDirection: 'row',
        width: '100%', padding: `0 ${SPACING.lg} ${SPACING.xxxl}`,
        maxWidth: PAGE_MAX_W, margin: '0 auto',
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
