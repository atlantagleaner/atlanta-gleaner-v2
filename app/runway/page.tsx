import { type CSSProperties } from 'react'
import { Banner } from '@/src/components/Banner'

// ─────────────────────────────────────────────────────────────────────────────
// Runway — embedded YouTube music videos
// Future: fetch video list from Supabase `runway_videos` table
// ─────────────────────────────────────────────────────────────────────────────

const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const serif: CSSProperties = { fontFamily: "'Cormorant Garamond', serif" }
const sans: CSSProperties = { fontFamily: "'Inter', sans-serif" }

// Future: move to Supabase
const VIDEOS = [
  {
    id: 'v1',
    title: 'Runway — Slot 01',
    artist: 'Coming Soon',
    youtubeId: null as string | null,
    note: 'First track posting — stay tuned.',
  },
]

function VideoSlot({ title, artist, youtubeId, note }: typeof VIDEOS[0]) {
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
          Runway · Track
        </span>
        <span style={{ ...mono, fontSize: '9px', color: '#444' }}>▶ RUN</span>
      </div>

      {youtubeId ? (
        <div style={{ aspectRatio: '16/9', background: '#000' }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        </div>
      ) : (
        <div style={{
          aspectRatio: '16/9',
          background: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '36px', color: '#ccc' }} strokeWidth="1">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
          </svg>
          <p style={{ ...mono, fontSize: '9px', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.14em', margin: 0 }}>
            [ Reel Not Loaded ]
          </p>
        </div>
      )}

      <div style={{ padding: '14px 16px' }}>
        <p style={{ ...serif, fontSize: '20px', fontWeight: 600, color: '#000', margin: '0 0 4px' }}>{title}</p>
        <p style={{ ...mono, fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>{artist}</p>
        {note && <p style={{ ...sans, fontSize: '13px', color: '#666', margin: 0 }}>{note}</p>}
      </div>
    </div>
  )
}

export default function RunwayPage() {
  return (
    <>
      <Banner />
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.10)', paddingBottom: '24px', marginBottom: '28px' }}>
          <h1 style={{ ...mono, fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.10em', lineHeight: 1, color: '#0A0A0A', margin: 0 }}>
            Runway
          </h1>
        </div>
      </div>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 80px' }}>

      {/* Video grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {VIDEOS.map(v => <VideoSlot key={v.id} {...v} />)}
      </div>

      </div>
    </>
  )
}
