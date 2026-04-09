'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PALETTE, T, SIZE_SM } from '@/src/styles/tokens'
import { useDateTime } from '@/src/hooks'

// Saturn detection — uses CSS variables defined in globals.css [data-saturn]
// No need for hardcoded SATURN_COLORS; styles use var(--saturn-gold), var(--saturn-surface), etc.

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
  const [isSaturn,  setIsSaturn]  = useState(false)
  const { dateStr: defaultDateStr, timeStr: defaultTimeStr, now } = useDateTime(publishedDate)
  const navRef      = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Detect Saturn presence and listen for changes
  useEffect(() => {
    const checkSaturn = () => {
      setIsSaturn(document.querySelector('[data-saturn]') !== null)
    }

    checkSaturn()

    const observer = new MutationObserver(checkSaturn)
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['data-saturn'] })

    return () => observer.disconnect()
  }, [])

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
          background: ${isSaturn ? 'var(--saturn-surface)' : PALETTE.white};
          border-bottom: 1px solid ${isSaturn ? 'var(--palette-border)' : 'var(--palette-rule-md)'};
          ${isSaturn ? `box-shadow: 0 1px 16px var(--saturn-glow), 0 2px 4px rgba(11,8,32,0.60);` : ''}
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
          background: ${isSaturn ? 'var(--saturn-surface)' : PALETTE.white};
          border-bottom: 1px solid ${isSaturn ? 'var(--palette-border)' : 'var(--palette-rule-md)'};
          transform-origin: top center;
          transition: transform 0.24s cubic-bezier(0.4,0,0.2,1), opacity 0.20s cubic-bezier(0.4,0,0.2,1);
        }
        .ag-dropdown--closed { transform: scaleY(0); opacity: 0; pointer-events: none; visibility: hidden; }

        .ag-dropdown-link {
          transition: background 0.1s;
          display: block;
          text-decoration: none;
          border-bottom: 1px solid ${isSaturn ? 'var(--saturn-glow)' : 'var(--palette-rule)'};
        }
        .ag-dropdown-link:hover { background: ${isSaturn ? 'var(--saturn-glow)' : PALETTE.warm} !important; }

        @media (max-width: 767px) {
          .ag-dropdown-link { padding: 16px 20px !important; }
        }
        @media (min-width: 768px) {
          .ag-dropdown {
            left: auto; right: 16px; width: 160px;
            border-radius: 2px; border: 1px solid ${isSaturn ? 'var(--palette-border)' : 'var(--palette-border)'};
            box-shadow: 0 4px 16px ${isSaturn ? 'var(--saturn-glow)' : 'var(--palette-rule-md)'};
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
                <div style={{ ...T.site, color: isSaturn ? 'var(--saturn-gold)' : PALETTE.black, fontSize: SIZE_SM, textShadow: isSaturn ? `0 0 10px rgba(184,134,11,0.45)` : 'none' }}>
                  {dateStr}
                </div>
                <div style={{ ...T.nav, color: isSaturn ? 'var(--saturn-gold)' : PALETTE.black, fontSize: SIZE_SM, opacity: isSaturn ? 0.75 : 0.6, fontVariantNumeric: 'tabular-nums', textShadow: isSaturn ? `0 0 10px rgba(184,134,11,0.45)` : 'none' }}>
                  {timeStr}
                </div>
              </>
            ) : (
              <span style={{ ...T.site, color: isSaturn ? 'var(--saturn-gold)' : PALETTE.black, textShadow: isSaturn ? `0 0 10px rgba(184,134,11,0.45)` : 'none' }}>
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
              padding: '4px 8px', color: isSaturn ? 'var(--saturn-gold)' : PALETTE.black,
              fontSize: '24px', fontWeight: 300, lineHeight: 1,
              display: 'flex', alignItems: 'center',
              textShadow: isSaturn ? `0 0 10px rgba(184,134,11,0.50)` : 'none',
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
                  color: isSaturn ? 'var(--saturn-gold)' : PALETTE.black,
                  textShadow: isSaturn ? `0 0 8px rgba(184,134,11,0.40)` : 'none',
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