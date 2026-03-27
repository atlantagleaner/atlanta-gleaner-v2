'use client'

// ─────────────────────────────────────────────────────────────────────────────
// NewsBox — Roll-A panel. Updates weekly. Same data on every page.
// Future Solito: portable (inline styles, no web-only APIs)
// Future Supabase: pass items as prop fetched server-side
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type CSSProperties } from 'react'
import { NEWS_ITEMS, type NewsItem } from '@/src/data/news'
import { PALETTE, T, BOX_SHELL, BOX_HEADER, BOX_PADDING, ITEM_RULE } from '@/src/styles/tokens'

function NewsItemRow({ item }: { item: NewsItem }) {
  const [hovered, setHovered] = useState(false)
  return (
    <li style={{ ...ITEM_RULE, paddingBottom: '10px', marginBottom: '10px' }}>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ textDecoration: 'none', display: 'block' }}
      >
        {/* Item title — T.body, inverts on hover */}
        <p style={{
          ...T.body,
          color:           hovered ? PALETTE.white : PALETTE.black,
          backgroundColor: hovered ? PALETTE.black : 'transparent',
          padding:         hovered ? '2px 4px' : '2px 0',
          textDecoration:  'none',
          transition:      'all 0.1s',
          margin:          0,
        }}>
          {item.title}
        </p>
        {/* Source name — T.micro */}
        <p style={{ ...T.micro, color: PALETTE.black, marginTop: '5px', marginBottom: 0 }}>
          {item.source}
        </p>
      </a>
    </li>
  )
}

interface NewsBoxProps {
  style?: CSSProperties
}

export function NewsBox({ style }: NewsBoxProps) {
  return (
    <div style={{ height: '100%', ...style }}>
      <div style={BOX_SHELL}>
        <div style={{ padding: BOX_PADDING, overflowY: 'auto', flex: 1 }}>
          {/* Section header — BOX_HEADER */}
          <h2 style={BOX_HEADER}>News Index</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {NEWS_ITEMS.map(item => (
              <NewsItemRow key={item.id} item={item} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
