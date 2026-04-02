'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Vault — merchandise store. Google Ads traffic target.
// Future: replace static products with Shopify Storefront API / headless Shopify
// Future: Google Ads conversion tracking via gtag
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { Banner } from '@/src/components/Banner'
import {
  FONT, T, PALETTE, PALETTE_CSS, SPACING,
  SIZE_SM, SIZE_MD, SIZE_LG, PAGE_MAX_W, PAGE_TITLE_BLOCK, ANIMATION,
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
        background:     PALETTE.black,
        padding:        `${SPACING.sm} ${SPACING.lg}`,
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
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
          aspectRatio:    '1/1',
          background:     PALETTE.warm,
          display:        'flex',
          flexDirection:  'column',
          justifyContent: 'center',
          alignItems:     'center',
          gap:            SPACING.sm,
          borderBottom:   `1px solid ${PALETTE_CSS.rule}`,
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
              fontSize:       SIZE_SM,
              textTransform:  'uppercase',
              letterSpacing:  '0.18em',
              fontWeight:     700,
              padding:        `${SPACING.sm} ${SPACING.lg}`,
              border:         `2px solid ${PALETTE.black}`,
              background:     hovered ? PALETTE.black : 'transparent',
              color:          hovered ? PALETTE.warm : PALETTE.black,
              textDecoration: 'none',
              transition:     `all ${ANIMATION.fast} ${ANIMATION.ease}`,
              display:        'inline-block',
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
    <>
      <Banner />
      <div style={{ maxWidth: PAGE_MAX_W, margin: '0 auto', padding: `0 ${SPACING.lg}` }}>
        <div style={{ ...PAGE_TITLE_BLOCK, marginTop: 0 }}>
          <h1 style={{ ...T.pageTitle, paddingTop: SPACING.xl, color: PALETTE.black, margin: 0 }}>
            Vault
          </h1>
        </div>
      </div>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: `0 ${SPACING.xl} ${SPACING.xxxxl}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: SPACING.xl }}>
          {PRODUCTS.map(p => <ProductCard key={p.id} {...p} />)}
        </div>

        <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.35, textAlign: 'center', marginTop: SPACING.xxxl }}>
          Secure checkout via Shopify · Ships 3–5 business days · Atlanta, GA
        </p>
      </div>
    </>
  )
}
