'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { T, SIZE_SM } from '@/src/styles/tokens'
import { useDateTime } from '@/src/hooks'

// Theme cascade handled entirely by CSS variables in globals.css
// [data-saturn] selector automatically overrides palette when Saturn page is active

const NAV_LINKS = [
  { label: 'Archive', href: '/archive' },
  { label: 'Runway',  href: '/runway'  },
  { label: 'Saturn',  href: '/saturn'  },
  { label: 'Vault',   href: '/vault'   },
  { label: 'About',   href: '/about'   },
]

export function NavBar({ publishedDate }: { publishedDate?: string } = {}) {
  const pathname    = usePathname()
  const [open, setOpen] = useState(false)
  const { dateStr: defaultDateStr, timeStr: defaultTimeStr, now } = useDateTime(publishedDate)
  const navRef      = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Isolated routes that should not show the global navbar
  const isIsolated = pathname === '/saturn' || pathname === '/runway/orbital'
  if (isIsolated) return null

  // Show date/time on all pages (today's date unless publishedDate provided for case pages)
  const showDatetime = now
  const dateStr = defaultDateStr
  const timeStr = defaultTimeStr

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
        /* Plus button icon and animations */
        .ag-plus-btn { transition: opacity 0.15s; }
        .ag-plus-btn:hover { opacity: 0.5; }
        .ag-plus-icon {
          display: inline-block;
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .ag-plus-icon--open { transform: rotate(45deg); }

        /* Wrapper: positioning context, sticky on mobile */
        .ag-nav-wrapper {
          position: relative;
          z-index: 200;
          background: var(--palette-white);
          border-bottom: 1px solid var(--palette-rule-md);
        }
        @media (max-width: 767px) {
          .ag-nav-wrapper { position: sticky; top: 0; }
        }

        /* Dropdown menu */
        .ag-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 10;
          background: var(--palette-white);
          border-bottom: 1px solid var(--palette-rule-md);
          transform-origin: top center;
          transition: transform 0.24s cubic-bezier(0.4,0,0.2,1), opacity 0.20s cubic-bezier(0.4,0,0.2,1);
        }
        .ag-dropdown--closed { transform: scaleY(0); opacity: 0; pointer-events: none; visibility: hidden; }

        .ag-dropdown-link {
          transition: background 0.1s;
          display: block;
          text-decoration: none;
          border-bottom: 1px solid var(--palette-rule);
        }
        .ag-dropdown-link:hover { background: var(--palette-warm) !important; }

        @media (max-width: 767px) {
          .ag-dropdown-link { padding: 16px 20px !important; }
        }
        @media (min-width: 768px) {
          .ag-dropdown {
            left: auto; right: 16px; width: 160px;
            border-radius: 2px; border: 1px solid var(--palette-border);
            box-shadow: 0 4px 16px var(--palette-rule-md);
          }
          .ag-dropdown-link { padding: 11px 14px !important; }
        }
      `}} />

      {/* Wrapper provides the stacking context — dropdown positions relative to this */}
      <div ref={navRef} className="ag-nav-wrapper">
        <nav className="ag-nav" style={{
          minHeight: showDatetime ? '64px' : '48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px',
        }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {showDatetime ? (
              <>
                <div style={{ ...T.site, color: 'var(--palette-black)', fontSize: SIZE_SM }}>
                  {dateStr}
                </div>
                <div style={{ ...T.nav, color: 'var(--palette-black)', fontSize: SIZE_SM, opacity: 0.6, fontVariantNumeric: 'tabular-nums' }}>
                  {timeStr}
                </div>
              </>
            ) : (
              <span style={{ ...T.site, color: 'var(--palette-black)' }}>
                The Atlanta Gleaner
              </span>
            )}
          </Link>

          <button
            className="ag-plus-btn"
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle navigation"
            aria-expanded={open}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 8px', color: 'var(--palette-black)',
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
                  fontWeight: active ? 700 : 500,
                  color: 'var(--palette-black)',
                }}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}