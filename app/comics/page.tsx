import { type CSSProperties } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Comics — comic panels displayed like framed art in a gallery
// Future: fetch from Supabase `comics` table with imageUrl, caption, date
// ─────────────────────────────────────────────────────────────────────────────

const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const serif: CSSProperties = { fontFamily: "'Cormorant Garamond', serif" }
const sans: CSSProperties = { fontFamily: "'Inter', sans-serif" }

// Future: replace with Supabase fetch
const COMICS = [
  {
    id: 'c1',
    series: 'The Far Side',
    caption: '"We\'ve updated our privacy policy, changed our terms of service, and eaten your family."',
    imageUrl: null as string | null,
    publishedAt: 'March 25, 2026',
    frameNo: '01',
  },
]

function ComicFrame({ series, caption, imageUrl, publishedAt, frameNo }: typeof COMICS[0]) {
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
          {series}
        </span>
        <span style={{ ...mono, fontSize: '9px', color: '#444', letterSpacing: '0.08em' }}>
          FRAME:{frameNo}
        </span>
      </div>

      {/* Frame label */}
      <div style={{ background: 'rgba(0,0,0,0.025)', padding: '3px 14px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <span style={{ ...mono, fontSize: '9px', color: '#bbb' }}>▶ {frameNo} · {publishedAt}</span>
      </div>

      {/* Image area — museum-style with wide white mat */}
      <div style={{ padding: '28px', background: '#fafafa' }}>
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={caption || series}
            style={{
              width: '100%',
              display: 'block',
              border: '1px solid rgba(0,0,0,0.08)',
              filter: 'grayscale(15%) contrast(1.05)',
            }}
          />
        ) : (
          <div style={{
            aspectRatio: '4/3',
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            background: '#f5f5f5',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '32px', color: '#ccc' }} strokeWidth="1" strokeLinecap="square">
              <rect x="2" y="2" width="20" height="20" />
              <circle cx="8" cy="8" r="2" />
              <polyline points="22 15 17 10 5 22" />
            </svg>
            <p style={{ ...mono, fontSize: '9px', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
              [ Awaiting Scan ]
            </p>
          </div>
        )}
      </div>

      {/* Caption — museum label style */}
      {caption && (
        <div style={{
          padding: '12px 20px 18px',
          borderTop: '1px solid rgba(0,0,0,0.07)',
        }}>
          <p style={{ ...serif, fontSize: '15px', fontStyle: 'italic', fontWeight: 600, color: '#333', margin: 0, lineHeight: 1.55 }}>
            {caption}
          </p>
          <p style={{ ...mono, fontSize: '9px', color: '#bbb', margin: '6px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {series} · {publishedAt}
          </p>
        </div>
      )}
    </div>
  )
}

export default function ComicsPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 80px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '36px', borderBottom: '1px solid rgba(0,0,0,0.10)', paddingBottom: '24px' }}>
        <p style={{ ...mono, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.28em', color: '#888', margin: '0 0 8px' }}>
          The Atlanta Gleaner · Gallery
        </p>
        <h1 style={{ ...serif, fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1, color: '#0A0A0A', margin: '0 0 12px', textShadow: '0 0 1px rgba(0,0,0,0.2)' }}>
          Comics
        </h1>
        <p style={{ ...sans, fontSize: '14px', color: '#666', margin: 0 }}>
          Selected comic panels. Each framed as a found object.
        </p>
      </div>

      {/* Masonry-style grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {COMICS.map(c => <ComicFrame key={c.id} {...c} />)}
      </div>

    </div>
  )
}
