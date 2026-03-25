'use client'

// ─────────────────────────────────────────────────────────────────────────────
// NavBar — sticky top navigation
// Future Solito: replace <a> with React Navigation links; keep layout logic
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Archive',  href: '/archive' },
  { label: 'Runway',   href: '/runway'  },
  { label: 'Comics',   href: '/comics'  },
  { label: 'Vault',    href: '/vault'   },
  { label: 'About',    href: '/about'   },
]

const mono: CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
}

export function NavBar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ag-nav-link { transition: color 0.15s, background 0.15s; }
        .ag-nav-link:hover { color: #000 !important; background: rgba(0,0,0,0.06) !important; }
        .ag-nav-link.active { color: #000 !important; border-bottom: 2px solid #000; }
        .ag-hamburger:hover { background: rgba(0,0,0,0.06) !important; }
        .ag-mobile-link { transition: background 0.12s; }
        .ag-mobile-link:hover { background: rgba(0,0,0,0.05) !important; }
        @media (max-width: 767px) {
          .ag-desktop-links { display: none !important; }
          .ag-hamburger { display: flex !important; }
        }
        @media (min-width: 768px) {
          .ag-desktop-links { display: flex !important; }
          .ag-hamburger { display: none !important; }
        }
      `}} />

      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        background: 'rgba(247, 242, 234, 0.96)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0,0,0,0.10)',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
      }}>
        {/* Logo */}
        <Link href="/" style={{
          ...mono,
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#000',
          textDecoration: 'none',
        }}>
          The Atlanta Gleaner
        </Link>

        {/* Desktop links */}
        <div className="ag-desktop-links" style={{ gap: '2px', alignItems: 'center' }}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`ag-nav-link${pathname === href ? ' active' : ''}`}
              style={{
                ...mono,
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: pathname === href ? '#000' : '#666',
                textDecoration: 'none',
                padding: '6px 10px',
                borderRadius: '2px',
                borderBottom: pathname === href ? '2px solid #000' : '2px solid transparent',
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Hamburger (mobile) */}
        <button
          className="ag-hamburger"
          onClick={() => setMenuOpen(v => !v)}
          style={{
            display: 'none', // overridden by media query
            flexDirection: 'column',
            gap: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
          }}
          aria-label="Toggle menu"
        >
          {[0,1,2].map(i => (
            <span key={i} style={{
              display: 'block',
              width: '20px',
              height: '1.5px',
              background: '#000',
              transition: 'all 0.2s',
              transformOrigin: 'center',
              transform: menuOpen
                ? i === 0 ? 'translateY(6.5px) rotate(45deg)'
                : i === 2 ? 'translateY(-6.5px) rotate(-45deg)'
                : 'scaleX(0)'
                : 'none',
            }} />
          ))}
        </button>
      </nav>

      {/* Mobile dropdown */}
      <div style={{
        position: 'fixed',
        top: '48px',
        left: 0,
        right: 0,
        zIndex: 190,
        background: 'rgba(247, 242, 234, 0.98)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0,0,0,0.10)',
        overflow: 'hidden',
        maxHeight: menuOpen ? '300px' : '0',
        transition: 'max-height 0.25s ease',
      }}>
        {NAV_LINKS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="ag-mobile-link"
            onClick={() => setMenuOpen(false)}
            style={{
              ...mono,
              display: 'block',
              fontSize: '11px',
              fontWeight: pathname === href ? 700 : 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: pathname === href ? '#000' : '#555',
              textDecoration: 'none',
              padding: '14px 24px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </>
  )
}
