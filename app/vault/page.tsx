'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Vault — merchandise store. Google Ads traffic target.
// Future: replace static products with Shopify Storefront API / headless Shopify
// Future: Google Ads conversion tracking via gtag
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type CSSProperties } from 'react'

const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const serif: CSSProperties = { fontFamily: "'Cormorant Garamond', serif" }
const sans: CSSProperties = { fontFamily: "'Inter', sans-serif" }

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
    <div style={{ border: '1px solid rgba(0,0,0,0.15)', background: '#fff' }}>
      {/* Header */}
      <div style={{
        background: '#111',
        padding: '7px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ ...mono, fontSize: '9px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.22em' }}>
          Vault · Item
        </span>
        {tag && (
          <span style={{ ...mono, fontSize: '8px', color: '#fbbf24', letterSpacing: '0.12em', fontWeight: 700 }}>
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
          background: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '32px', color: '#ccc' }} strokeWidth="1" strokeLinecap="square">
            <rect x="3" y="3" width="18" height="18" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          <p style={{ ...mono, fontSize: '9px', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
            [ Product Image Pending ]
          </p>
        </div>
      )}

      {/* Info */}
      <div style={{ padding: '16px' }}>
        <p style={{ ...serif, fontSize: '19px', fontWeight: 600, color: '#000', margin: '0 0 4px' }}>{name}</p>
        <p style={{ ...sans, fontSize: '13px', color: '#666', margin: '0 0 12px', lineHeight: 1.5 }}>{description}</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ ...mono, fontSize: '14px', fontWeight: 700, color: '#000', letterSpacing: '0.06em' }}>
            {price}
          </span>
          <a
            href={shopifyUrl}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              ...mono,
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              fontWeight: 700,
              padding: '8px 14px',
              border: '2px solid #000',
              background: hovered ? '#000' : 'transparent',
              color: hovered ? '#F7F2EA' : '#000',
              textDecoration: 'none',
              transition: 'all 0.15s',
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
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px 80px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '36px', borderBottom: '1px solid rgba(0,0,0,0.10)', paddingBottom: '24px' }}>
        <p style={{ ...mono, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.28em', color: '#888', margin: '0 0 8px' }}>
          The Atlanta Gleaner · Merchandise
        </p>
        <h1 style={{ ...serif, fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1, color: '#0A0A0A', margin: '0 0 12px', textShadow: '0 0 1px rgba(0,0,0,0.2)' }}>
          The Vault
        </h1>
        <p style={{ ...sans, fontSize: '14px', color: '#666', margin: 0 }}>
          High-contrast goods. Archival aesthetics. Ships from Atlanta.
        </p>
      </div>

      {/* Product grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {PRODUCTS.map(p => <ProductCard key={p.id} {...p} />)}
      </div>

      {/* Shopify notice */}
      <p style={{ ...mono, fontSize: '9px', color: '#bbb', textAlign: 'center', marginTop: '40px', letterSpacing: '0.08em' }}>
        Secure checkout via Shopify · Ships 3–5 business days · Atlanta, GA
      </p>

    </div>
  )
}
