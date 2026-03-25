'use client'

// ─────────────────────────────────────────────────────────────────────────────
// AnalogShell — Web-only. Wraps page content with the microfiche hardware
// simulation: randomized grain seed, scanline offset, bulb hotspot position.
// Note: This component is intentionally NOT portable to React Native.
// Future Solito app: skip this wrapper on native; use plain View instead.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, ReactNode } from 'react'

interface AnalogState {
  seed: number
  freq: string
  offset: number
  x: string
  y: string
}

const DEFAULT: AnalogState = { seed: 0, freq: '0.75', offset: 0, x: '50', y: '38' }

export function AnalogShell({ children }: { children: ReactNode }) {
  const [a, setA] = useState<AnalogState>(DEFAULT)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setA({
      seed:   Math.floor(Math.random() * 9999),
      freq:   (Math.random() * 0.25 + 0.62).toFixed(2),
      offset: Math.floor(Math.random() * 8),
      x:      (50 + (Math.random() * 8 - 4)).toFixed(1),
      y:      (38 + (Math.random() * 6 - 3)).toFixed(1),
    })
    setMounted(true)
  }, [])

  const bg = `radial-gradient(ellipse at ${a.x}% ${a.y}%, #FFFFFF 0%, #F7F2EA 45%, #EBE5D8 100%)`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flicker {
          0%   { opacity: 0.980; }
          30%  { opacity: 1.000; }
          60%  { opacity: 0.972; }
          100% { opacity: 0.985; }
        }
        .ag-shell { animation: flicker 9s infinite ease-in-out; }
      `}} />

      <div
        className="ag-shell"
        style={{
          minHeight: '100vh',
          width: '100%',
          background: bg,
          position: 'relative',
        }}
      >
        {/* ── Fresnel lens rings ── */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10,
          background: 'repeating-radial-gradient(circle at center, transparent 0, transparent 3px, rgba(0,0,0,0.008) 3px, rgba(0,0,0,0.008) 4px)',
        }} />

        {/* ── Scanlines — randomized vertical offset ── */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 11,
          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.022) 50%, rgba(0,0,0,0.022))',
          backgroundSize: '100% 4px',
          backgroundPosition: `0 ${a.offset}px`,
        }} />

        {/* ── Film grain — unique every load ── */}
        {mounted && (
          <div style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 12, opacity: 0.07,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${a.freq}' numOctaves='3' seed='${a.seed}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }} />
        )}

        {/* ── Lens flare / bulb hotspot ── */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 13, mixBlendMode: 'screen',
          background: `radial-gradient(circle at ${a.x}% ${a.y}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 50%)`,
        }} />

        {/* ── Page content ── */}
        <div style={{ position: 'relative', zIndex: 20 }}>
          {children}
        </div>
      </div>
    </>
  )
}
