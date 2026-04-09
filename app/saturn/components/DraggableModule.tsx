'use client'

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react'

interface DraggableModuleProps {
  id: string
  label: string
  children: ReactNode
  defaultX: number
  defaultY: number
  defaultWidth: number
  defaultHeight: number
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
}

const Z_INDEX_BASE = 10

export function DraggableModule({
  id,
  label,
  children,
  defaultX,
  defaultY,
  defaultWidth,
  defaultHeight,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
}: DraggableModuleProps) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY })
  const [size, setSize] = useState({ w: defaultWidth, h: defaultHeight })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<string | null>(null)
  const [zIndex, setZIndex] = useState(Z_INDEX_BASE)

  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 })
  const resizeStartRef = useRef({ x: 0, y: 0, startW: 0, startH: 0, startX: 0, startY: 0 })

  const handleHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return
    setIsDragging(true)
    setZIndex(Date.now())

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: pos.x,
      startY: pos.y,
    }
    e.preventDefault()
  }, [pos])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    if (!containerRef.current) return
    setIsResizing(direction)
    setZIndex(Date.now())

    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startW: size.w,
      startH: size.h,
      startX: pos.x,
      startY: pos.y,
    }
    e.preventDefault()
  }, [size, pos])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      setPos({
        x: dragStartRef.current.startX + dx,
        y: dragStartRef.current.startY + dy,
      })
    } else if (isResizing) {
      const dx = e.clientX - resizeStartRef.current.x
      const dy = e.clientY - resizeStartRef.current.y
      const { startW, startH, startX, startY } = resizeStartRef.current

      switch (isResizing) {
        case 'se': // bottom-right
          setSize({
            w: Math.min(maxWidth, Math.max(minWidth, startW + dx)),
            h: Math.min(maxHeight, Math.max(minHeight, startH + dy)),
          })
          break
        case 'sw': // bottom-left
          setSize({
            w: Math.min(maxWidth, Math.max(minWidth, startW - dx)),
            h: Math.min(maxHeight, Math.max(minHeight, startH + dy)),
          })
          setPos({ x: startX + dx, y: pos.y })
          break
        case 'ne': // top-right
          setSize({
            w: Math.min(maxWidth, Math.max(minWidth, startW + dx)),
            h: Math.min(maxHeight, Math.max(minHeight, startH - dy)),
          })
          setPos({ x: pos.x, y: startY + dy })
          break
        case 'nw': // top-left
          setSize({
            w: Math.min(maxWidth, Math.max(minWidth, startW - dx)),
            h: Math.min(maxHeight, Math.max(minHeight, startH - dy)),
          })
          setPos({
            x: startX + dx,
            y: startY + dy,
          })
          break
        case 'n': // top
          setSize({
            w: size.w,
            h: Math.min(maxHeight, Math.max(minHeight, startH - dy)),
          })
          setPos({ x: pos.x, y: startY + dy })
          break
        case 's': // bottom
          setSize({ w: size.w, h: Math.min(maxHeight, Math.max(minHeight, startH + dy)) })
          break
        case 'e': // right
          setSize({ w: Math.min(maxWidth, Math.max(minWidth, startW + dx)), h: size.h })
          break
        case 'w': // left
          setSize({ w: Math.min(maxWidth, Math.max(minWidth, startW - dx)), h: size.h })
          setPos({ x: startX + dx, y: pos.y })
          break
      }
    }
  }, [isDragging, isResizing, minWidth, minHeight, maxWidth, maxHeight, pos])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(null)
  }, [])

  // Mount listeners
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [handleMouseMove, handleMouseUp])

  const ResizeHandle = ({ direction }: { direction: string }) => (
    <div
      onMouseDown={(e) => handleResizeMouseDown(e, direction)}
      style={{
        position: 'absolute',
        cursor: {
          se: 'nwse-resize',
          sw: 'nesw-resize',
          ne: 'nesw-resize',
          nw: 'nwse-resize',
          n: 'ns-resize',
          s: 'ns-resize',
          e: 'ew-resize',
          w: 'ew-resize',
        }[direction] as string,
        ...({
          se: { bottom: 0, right: 0, width: '16px', height: '16px' },
          sw: { bottom: 0, left: 0, width: '16px', height: '16px' },
          ne: { top: 0, right: 0, width: '16px', height: '16px' },
          nw: { top: 0, left: 0, width: '16px', height: '16px' },
          n: { top: 0, left: '16px', right: '16px', height: '6px' },
          s: { bottom: 0, left: '16px', right: '16px', height: '6px' },
          e: { top: '16px', right: 0, width: '6px', bottom: '16px' },
          w: { top: '16px', left: 0, width: '6px', bottom: '16px' },
        }[direction] as React.CSSProperties),
      }}
    />
  )

  return (
    <div
      ref={containerRef}
      onClick={() => setZIndex(Date.now())}
      style={{
        position: 'absolute',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${size.w}px`,
        height: `${size.h}px`,
        zIndex,
        border: '1px solid rgba(184,134,11,0.20)',
        backgroundColor: '#1A1A2E',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'inset 0 0 40px rgba(11,8,32,0.6), 0 0 24px rgba(184,134,11,0.15)',
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s ease',
        cursor: isDragging ? 'grabbing' : 'auto',
      }}
    >
      {/* Header/drag bar */}
      <div
        onMouseDown={handleHeaderMouseDown}
        style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(184,134,11,0.08)',
          borderBottom: '1px solid rgba(184,134,11,0.15)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Drag handle dots */}
        <div style={{ display: 'flex', gap: '3px', opacity: 0.5 }}>
          {[0, 1].map(col => (
            <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {[0, 1, 2].map(row => (
                <div
                  key={row}
                  style={{
                    width: '2px',
                    height: '2px',
                    borderRadius: '50%',
                    background: '#B8860B',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#B8860B',
            textShadow: '0 0 8px rgba(184,134,11,0.40)',
            flex: 1,
          }}
        >
          {label}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </div>

      {/* Resize handles */}
      <ResizeHandle direction="nw" />
      <ResizeHandle direction="n" />
      <ResizeHandle direction="ne" />
      <ResizeHandle direction="w" />
      <ResizeHandle direction="e" />
      <ResizeHandle direction="sw" />
      <ResizeHandle direction="s" />
      <ResizeHandle direction="se" />
    </div>
  )
}
