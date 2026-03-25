'use client'

// ─────────────────────────────────────────────────────────────────────────────
// NewsBox — Roll-A panel. Updates weekly. Same data on every page.
// Future Solito: portable (inline styles, no web-only APIs)
// Future Supabase: pass items as prop fetched server-side
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type CSSProperties } from 'react'
import { NEWS_ITEMS, type NewsItem } from '@/src/data/news'

const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const sans: CSSProperties = { fontFamily: "'Inter', sans-serif" }

function NewsItemRow({ item }: { item: NewsItem }) {
  const [hovered, setHovered] = useState(false)
  return (
    <li style={{
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      paddingBottom: '10px',
      marginBottom: '10px',
    }}>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ textDecoration: 'none', display: 'block' }}
      >
        <p style={{
          ...sans,
          fontSize: '13px',
          fontWeight: 500,
          lineHeight: 1.45,
          color: hovered ? '#fff' : '#111',
          backgroundColor: hovered ? '#111' : 'transparent',
          padding: hovered ? '2px 4px' : '2px 0',
          textDecoration: 'none',
          transition: 'all 0.1s',
          margin: 0,
        }}>
          {item.title}
        </p>
        <p style={{
          ...mono,
          fontSize: '9px',
          color: '#999',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          marginTop: '5px',
          marginBottom: 0,
        }}>
          {item.source}
        </p>
      </a>
    </li>
  )
}

interface NewsBoxProps {
  /** Controlled from parent for resizable layout */
  style?: CSSProperties
}

export function NewsBox({ style }: NewsBoxProps) {
  const weekLabel = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div style={{ height: '100%', ...style }}>
      {/* Panel chrome */}
      <div style={{ border: '1px solid rgba(0,0,0,0.18)', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Dark header bar */}
        <div style={{
          background: '#111',
          padding: '7px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ ...mono, fontSize: '9px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.22em' }}>
            Roll&#x2011;A · News
          </span>
          <span style={{ ...mono, fontSize: '9px', color: '#444', letterSpacing: '0.1em' }}>IDX:01</span>
        </div>

        {/* Frame label */}
        <div style={{ background: 'rgba(0,0,0,0.03)', padding: '3px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }}>
          <span style={{ ...mono, fontSize: '9px', color: '#bbb' }}>▶ 01 · {weekLabel}</span>
        </div>

        {/* Scrollable content */}
        <div style={{ padding: '16px 14px', overflowY: 'auto', flex: 1 }}>
          <h2 style={{
            ...mono,
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            fontWeight: 700,
            borderBottom: '2px solid #000',
            paddingBottom: '7px',
            margin: '0 0 14px 0',
          }}>
            News Index
          </h2>
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
