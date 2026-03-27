'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PALETTE, T, SIZE_SM } from '@/src/styles/tokens'

const NAV_LINKS = [
  { label: 'Archive', href: '/archive' },
  { label: 'Runway',  href: '/runway'  },
  { label: 'Comics',  href: '/comics'  },
  { label: 'Vault',   href: '/vault'   },
  { label: 'About',   href: '/about'   },
]

export function NavBar({ publishedDate }: { publishedDate?: string } = {}) {
  const pathname    = usePathname()
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState<Date | null>(null)
  const navRef      = useRef<HTMLElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Show date/time on homepage or on case pages with publishedDate
  const isHomepage = pathname === '/'
  const showDatetime = (isHomepage || publishedDate) && now
  const dateStr = showDatetime
    ? (publishedDate
        ? new Date(publishedDate + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      )
    : ''
  const timeStr = now
    ? now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
    : ''

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node
      if (!navRef.current?.contains(t) && !dropdownRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ag-plus-btn { transition: opacity 0.15s; }
        .ag-plus-btn:hover { opacity: 0.5; }
        .ag-plus-icon {
          display: inline-block;
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ag-plus-icon--open { transform: rotate(45deg); }
        .ag-dropdown {
          position: fixed; top: 48px; left: 0; right: 0; z-index: 190;
          background: ${PALETTE.white};
          border-bottom: 1px solid rgba(0,0,0,0.10);
          transform-origin: top center;
          transition: transform 0.24s cubic-bezier(0.4,0,0.2,1),
                      opacity   0.20s cubic-bezier(0.4,0,0.2,1);
        }
        .ag-dropdown--closed { transform: scaleY(0); opacity: 0; pointer-events: none; visibility: hidden; }
        .ag-dropdown-link { transition: background 0.1s; }
        .ag-dropdown-link:hover { background: ${PALETTE.warm} !important; }
        @media (max-width: 767px) { .ag-dropdown-link { padding: 16px 20px !important; } }
        @media (min-width: 768px) {
          .ag-dropdown {
            left: auto; right: 16px; width: 160px; top: 52px;
            border-radius: 2px; border: 1px solid rgba(0,0,0,0.12);
            box-shadow: 0 4px 16px rgba(0,0,0,0.10);
          }
          .ag-dropdown-link { padding: 11px 14px !important; }
        }
      `}} />

      <nav ref={navRef} style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: PALETTE.white,
        borderBottom: '1px solid rgba(0,0,0,0.10)',
        minHeight: showDatetime ? '64px' : '48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
      }}>
        {showDatetime ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ ...T.site, color: PALETTE.black, fontSize: SIZE_SM }}>
              {dateStr}
            </div>
            <div style={{ ...T.nav, color: PALETTE.black, fontSize: SIZE_SM, opacity: 0.6, fontVariantNumeric: 'tabular-nums' }}>
              {timeStr}
            </div>
          </div>
        ) : (
          <Link href="/" style={{
            ...T.site, color: PALETTE.black, textDecoration: 'none',
          }}>
            The Atlanta Gleaner
          </Link>
        )}

        <button
          className="ag-plus-btn"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle navigation"
          aria-expanded={open}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 8px', color: PALETTE.black,
            fontSize: '24px', fontWeight: 300, lineHeight: 1,
            display: 'flex', alignItems: 'center',
          }}
        >
          <span className={`ag-plus-icon${open ? ' ag-plus-icon--open' : ''}`}>+</span>
        </button>
      </nav>

      <div ref={dropdownRef} className={`ag-dropdown${open ? '' : ' ag-dropdown--closed'}`} aria-hidden={!open}>
        {NAV_LINKS.map(({ label, href }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} className="ag-dropdown-link" onClick={() => setOpen(false)}
              style={{
                ...T.nav,
                display: 'block',
                fontWeight: active ? 700 : 500,
                color: PALETTE.black,
                textDecoration: 'none',
                borderBottom: '1px solid rgba(0,0,0,0.07)',
              }}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </>
  )
}
