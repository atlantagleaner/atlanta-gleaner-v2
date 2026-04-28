'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties } from 'react'
import { T } from '@/src/styles/tokens'

export type SiteNavLink = {
  label: string
  href: string
}

export const SITE_NAV_LINKS: SiteNavLink[] = [
  { label: 'Archive', href: '/archive' },
  { label: 'Runway', href: '/runway' },
  { label: 'News', href: '/news' },
  { label: 'Saturn', href: '/saturn' },
  { label: 'Vault', href: '/vault' },
  { label: 'About', href: '/about' },
]

type Variant = 'light' | 'dark'

interface SiteDropdownMenuProps {
  open: boolean
  onSelect?: () => void
  align?: 'left' | 'right'
  variant?: Variant
  width?: number
  position?: 'absolute' | 'static'
}

export function SiteDropdownMenu({
  open,
  onSelect,
  align = 'left',
  variant = 'dark',
  width = 180,
  position = 'absolute',
}: SiteDropdownMenuProps) {
  const pathname = usePathname()

  const menuStyle: CSSProperties = {
    position,
    top: position === 'absolute' ? '100%' : 'auto',
    marginTop: position === 'absolute' ? '8px' : 0,
    minWidth: `${width}px`,
    zIndex: 1100,
    padding: '8px 0',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '11px',
    letterSpacing: '0.15em',
    backdropFilter: 'blur(20px)',
    border: variant === 'light'
      ? '1px solid var(--palette-border)'
      : '1px solid rgba(255, 255, 255, 0.1)',
    background: variant === 'light'
      ? 'rgba(255, 255, 255, 0.98)'
      : 'rgba(2, 1, 1, 0.95)',
    color: variant === 'light' ? 'var(--palette-black)' : '#FFF',
    left: align === 'left' ? 0 : undefined,
    right: align === 'right' ? 0 : undefined,
    visibility: open ? 'visible' : 'hidden',
    boxShadow: variant === 'light'
      ? '0 4px 16px var(--palette-rule-md)'
      : '0 4px 16px rgba(0, 0, 0, 0.35)',
  }

  const itemStyle: CSSProperties = {
    padding: '8px 16px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s ease',
    textDecoration: 'none',
    display: 'block',
    color: 'inherit',
  }

  if (!open) return null

  return (
    <div style={menuStyle}>
      {SITE_NAV_LINKS.map(({ label, href }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            onClick={onSelect}
            style={{
              ...itemStyle,
              fontWeight: active ? 700 : 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                variant === 'light'
                  ? 'var(--palette-warm)'
                  : 'rgba(255, 165, 0, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <span style={T.nav}>{label.toUpperCase()}</span>
          </Link>
        )
      })}
    </div>
  )
}
