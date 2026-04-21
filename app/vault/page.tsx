'use client'

import { useEffect, useState } from 'react'
import { Banner } from '@/src/components/Banner'
import { useDateTime } from '@/src/hooks'
import {
  FONT, T, PALETTE, PALETTE_CSS, SPACING,
  SIZE_SM, SIZE_MD, SIZE_LG, PAGE_MAX_W, PAGE_TITLE_BLOCK, ANIMATION, PAGE_BOTTOM_PADDING_DESKTOP, PAGE_BOTTOM_PADDING_MOBILE,
} from '@/src/styles/tokens'

// Future: Shopify Storefront API products query
const PRODUCTS = [
  {
    id: 'p1',
    name: 'Lawyered — Classic Tee',
    description: 'Stark black-on-white. Minimal. Wearable.',
    price: '$32',
    imageUrl: null as string | null,
    shopifyUrl: '#',
    tag: 'BESTSELLER',
  },
  {
    id: 'p2',
    name: 'Newsprint Tee',
    description: 'Archival newspaper texture. High-contrast serif print.',
    price: '$32',
    imageUrl: null as string | null,
    shopifyUrl: '#',
    tag: null,
  },
  {
    id: 'p3',
    name: 'The Gleaner — Tote',
    description: 'Heavy canvas. Logo in IBM Plex Mono.',
    price: '$24',
    imageUrl: null as string | null,
    shopifyUrl: '#',
    tag: 'COMING SOON',
  },
]

function ProductCard({ name, description, price, imageUrl, shopifyUrl, tag }: typeof PRODUCTS[0]) {
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{ border: `1px solid ${PALETTE_CSS.border}`, background: PALETTE.white }}>
      {/* Header */}
      <div style={{
        background: PALETTE.black,
        padding: `${SPACING.sm} ${SPACING.lg}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ ...T.nav, color: PALETTE.white }}>
          Vault · Item
        </span>
        {tag && (
          <span style={{ ...FONT.mono, fontSize: SIZE_SM, color: PALETTE.white, letterSpacing: '0.12em', fontWeight: 700 }}>
            {tag}
          </span>
        )}
      </div>

      {/* Product image */}
      {imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt={name}
          style={{ width: '100%', display: 'block', aspectRatio: '1/1', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          aspectRatio: '1/1',
          background: PALETTE.warm,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: SPACING.sm,
          borderBottom: `1px solid ${PALETTE_CSS.rule}`,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '32px', color: PALETTE.black, opacity: 0.25 }} strokeWidth="1" strokeLinecap="square">
            <rect x="3" y="3" width="18" height="18" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.35, margin: 0 }}>
            [ Product Image Pending ]
          </p>
        </div>
      )}

      {/* Info */}
      <div style={{ padding: SPACING.lg }}>
        <p style={{ ...FONT.serif, fontSize: SIZE_LG, fontWeight: 600, color: PALETTE.black, margin: `0 0 ${SPACING.xs}` }}>{name}</p>
        <p style={{ ...T.body, color: PALETTE.black, opacity: 0.65, margin: `0 0 ${SPACING.md}`, lineHeight: 1.5 }}>{description}</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ ...FONT.mono, fontSize: SIZE_MD, fontWeight: 700, color: PALETTE.black, letterSpacing: '0.06em' }}>
            {price}
          </span>
          <a
            href={shopifyUrl}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              ...FONT.mono,
              fontSize: SIZE_SM,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              fontWeight: 700,
              padding: `${SPACING.sm} ${SPACING.lg}`,
              border: `2px solid ${PALETTE.black}`,
              background: hovered ? PALETTE.black : 'transparent',
              color: hovered ? PALETTE.warm : PALETTE.black,
              textDecoration: 'none',
              transition: `all ${ANIMATION.fast} ${ANIMATION.ease}`,
              display: 'inline-block',
            }}
          >
            Buy Now
          </a>
        </div>
      </div>
    </div>
  )
}

export default function VaultPage() {
  const { dateStr, timeStr, mounted } = useDateTime()
  const [isPlusOpen, setIsPlusOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navItemStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '100px',
    padding: '10px 24px',
    color: '#FFF',
    fontSize: '11px',
    letterSpacing: '0.15em',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    transition: 'all 0.2s ease',
    userSelect: 'none'
  }

  const dropdownMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    marginTop: '8px',
    background: 'rgba(2, 1, 1, 0.8)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '8px 0',
    color: '#FFF',
    fontSize: '11px',
    letterSpacing: '0.15em',
    fontFamily: 'monospace',
    zIndex: 1100,
    minWidth: '180px'
  }

  const dropdownItemStyle: React.CSSProperties = {
    padding: '8px 16px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s ease',
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: PALETTE.warm, overflow: 'auto', position: 'relative' }}>
      {/* Navbar with Merged Plus Button */}
      {isMobile ? (
        <nav style={{
          position: 'fixed', top: '15px', left: '15px', right: '15px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1000,
        }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsPlusOpen(!isPlusOpen)}
              style={{ ...navItemStyle, textDecoration: 'none', border: 'none' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                {mounted && dateStr ? (
                  <>
                    <span style={{ fontSize: '9px', opacity: 0.4 }}>{dateStr}</span>
                    <span style={{ opacity: 0.4, fontSize: '9px' }}>{timeStr}</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '9px', opacity: 0.4 }}>—</span>
                    <span style={{ opacity: 0.4, fontSize: '9px' }}>—:—:—</span>
                  </>
                )}
              </div>

              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                <span style={{ fontWeight: 800, color: '#FFB347', fontSize: '12px' }}>THE ATLANTA GLEANER</span>
                <span style={{ opacity: 0.5, fontSize: '8px', letterSpacing: '0.2em' }}>EDITED BY GEORGE WASHINGTON</span>
              </div>

              <div style={{ marginLeft: 'auto' }}>
                {isPlusOpen ? '−' : '+'}
              </div>
            </button>
            {isPlusOpen && (
              <div style={{...dropdownMenuStyle, right: '0', marginTop: '8px'}}>
                <a href="/archive" style={{...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>ARCHIVE</a>
                <a href="/" style={{...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>RUNWAY</a>
                <a href="/saturn" style={{...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>SATURN</a>
                <a href="/vault" style={{...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>VAULT</a>
                <a href="/about" style={{...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>ABOUT</a>
              </div>
            )}
          </div>
        </nav>
      ) : (
        <nav style={{
          position: 'fixed', top: '25px', left: '25px', right: '25px',
          display: 'flex', justifyContent: 'flex-start', alignItems: 'center', zIndex: 1000,
        }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsPlusOpen(!isPlusOpen)}
              style={{ ...navItemStyle, textDecoration: 'none', border: 'none' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                {mounted && dateStr ? (
                  <>
                    <span style={{ fontSize: '9px', opacity: 0.4 }}>{dateStr}</span>
                    <span style={{ opacity: 0.4, fontSize: '9px' }}>{timeStr}</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '9px', opacity: 0.4 }}>—</span>
                    <span style={{ opacity: 0.4, fontSize: '9px' }}>—:—:—</span>
                  </>
                )}
              </div>

              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
                <span style={{ fontWeight: 800, color: '#FFB347', fontSize: '12px' }}>THE ATLANTA GLEANER</span>
                <span style={{ opacity: 0.5, fontSize: '8px', letterSpacing: '0.2em' }}>EDITED BY GEORGE WASHINGTON</span>
              </div>

              <div style={{ marginLeft: 'auto' }}>
                {isPlusOpen ? '−' : '+'}
              </div>
            </button>
            {isPlusOpen && (
              <div style={{...dropdownMenuStyle, left: '0', marginTop: '8px'}}>
                <a href="/archive" style={{...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>ARCHIVE</a>
                <a href="/" style={{...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>RUNWAY</a>
                <a href="/saturn" style={{...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>SATURN</a>
                <a href="/vault" style={{...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>VAULT</a>
                <a href="/about" style={{...dropdownItemStyle, display: 'block', color: '#FFF', textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>ABOUT</a>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Page Content */}
      <div style={{ paddingTop: isMobile ? '100px' : '120px' }}>
        <style>{`
          @media (max-width: 767px) {
            .ag-vault-container {
              padding-bottom: ${PAGE_BOTTOM_PADDING_MOBILE};
            }
          }
          @media (min-width: 768px) {
            .ag-vault-container {
              padding-bottom: ${PAGE_BOTTOM_PADDING_DESKTOP};
            }
          }
        `}</style>
        <Banner />
        <div style={{ maxWidth: PAGE_MAX_W, margin: '0 auto', padding: `0 ${SPACING.lg}` }}>
          <div style={{ ...PAGE_TITLE_BLOCK, marginTop: 0 }}>
            <h1 style={{ ...T.pageTitle, paddingTop: SPACING.xl, color: PALETTE.black, margin: 0 }}>
              Vault
            </h1>
          </div>
        </div>
        <div className="ag-vault-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: `0 ${SPACING.xl}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: SPACING.xl }}>
            {PRODUCTS.map(p => <ProductCard key={p.id} {...p} />)}
          </div>

          <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.35, textAlign: 'center', marginTop: SPACING.xxxl }}>
            Secure checkout via Shopify · Ships 3–5 business days · Atlanta, GA
          </p>
        </div>
      </div>
    </div>
  )
}
