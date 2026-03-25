'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Archive — searchable index of all published case opinions
// Future: replace ALL_CASES with Supabase paginated query + full-text search
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { ALL_CASES } from '@/src/data/cases'

const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const serif: CSSProperties = { fontFamily: "'Cormorant Garamond', serif" }
const sans: CSSProperties = { fontFamily: "'Inter', sans-serif" }

export default function ArchivePage() {
  const [query, setQuery] = useState('')
  const [inputFocused, setInputFocused] = useState(false)

  const filtered = ALL_CASES.filter(c =>
    [c.title, c.court, c.docketNumber].join(' ').toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px 80px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '36px', borderBottom: '1px solid rgba(0,0,0,0.10)', paddingBottom: '24px' }}>
        <p style={{ ...mono, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.28em', color: '#888', margin: '0 0 8px' }}>
          The Atlanta Gleaner · Microfiche Index
        </p>
        <h1 style={{ ...serif, fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1, color: '#0A0A0A', margin: '0 0 12px', textShadow: '0 0 1px rgba(0,0,0,0.2)' }}>
          Case Law Archive
        </h1>
        <p style={{ ...sans, fontSize: '14px', color: '#666', margin: 0 }}>
          All republished opinions from Georgia courts, indexed by publication date.
        </p>
      </div>

      {/* Search bar — styled like a microfiche index card terminal */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          border: `2px solid ${inputFocused ? '#000' : 'rgba(0,0,0,0.20)'}`,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          transition: 'border-color 0.15s',
        }}>
          <span style={{ ...mono, fontSize: '11px', color: '#aaa', marginRight: '10px', flexShrink: 0 }}>
            SEARCH▸
          </span>
          <input
            type="text"
            placeholder="case name, docket number, court..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={{
              ...mono,
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '13px',
              color: '#111',
              padding: '14px 0',
              letterSpacing: '0.04em',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ ...mono, background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '14px', padding: '0 4px' }}
            >
              ×
            </button>
          )}
        </div>
        <p style={{ ...mono, fontSize: '9px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '6px 0 0', textAlign: 'right' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ ...mono, fontSize: '11px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
            [ No results found ]
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {filtered.map((c, i) => (
            <Link
              key={c.id}
              href={`/archive/${c.slug}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                padding: '18px 0',
                borderLeft: '3px solid transparent',
                paddingLeft: '14px',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderLeftColor = '#000'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.02)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                  <p style={{ ...serif, fontSize: 'clamp(1rem, 2vw, 1.25rem)', fontWeight: 600, color: '#000', margin: 0, lineHeight: 1.3 }}>
                    {c.title}
                  </p>
                  <span style={{ ...mono, fontSize: '9px', color: '#aaa', flexShrink: 0 }}>
                    {c.publishedAt}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '5px', flexWrap: 'wrap' }}>
                  <span style={{ ...mono, fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {c.court}
                  </span>
                  <span style={{ ...mono, fontSize: '9px', color: '#bbb' }}>·</span>
                  <span style={{ ...mono, fontSize: '9px', color: '#888' }}>
                    {c.docketNumber}
                  </span>
                  <span style={{ ...mono, fontSize: '9px', color: '#bbb' }}>·</span>
                  <span style={{ ...mono, fontSize: '9px', color: '#888' }}>
                    Decided {c.dateDecided}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}
