import { Banner } from '@/src/components/Banner'
import {
  FONT, T, PALETTE, PALETTE_CSS, SPACING,
  SIZE_SM, SIZE_MD, SIZE_LG, PAGE_MAX_W, PAGE_TITLE_BLOCK,
} from '@/src/styles/tokens'

// ─────────────────────────────────────────────────────────────────────────────
// Runway — embedded YouTube music videos
// Future: fetch video list from Supabase `runway_videos` table
// ─────────────────────────────────────────────────────────────────────────────

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
          Runway · Track
        </span>
        <span style={{ ...FONT.mono, fontSize: SIZE_SM, color: PALETTE.white, opacity: 0.45 }}>▶ RUN</span>
      </div>

      {youtubeId ? (
        <div style={{ aspectRatio: '16/9', background: PALETTE.black }}>
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
          aspectRatio:    '16/9',
          background:     PALETTE.warm,
          display:        'flex',
          flexDirection:  'column',
          justifyContent: 'center',
          alignItems:     'center',
          gap:            SPACING.md,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '36px', color: PALETTE.black, opacity: 0.25 }} strokeWidth="1">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
          </svg>
          <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.35, margin: 0 }}>
            [ Reel Not Loaded ]
          </p>
        </div>
      )}

      <div style={{ padding: `${SPACING.lg} ${SPACING.lg}` }}>
        <p style={{ ...FONT.serif, fontSize: SIZE_LG, fontWeight: 600, color: PALETTE.black, margin: `0 0 ${SPACING.xs}` }}>{title}</p>
        <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.45, margin: `0 0 ${SPACING.sm}` }}>{artist}</p>
        {note && <p style={{ ...T.body, color: PALETTE.black, opacity: 0.65, margin: 0 }}>{note}</p>}
      </div>
    </div>
  )
}

export default function RunwayPage() {
  return (
    <>
      <Banner />
      <div style={{ maxWidth: PAGE_MAX_W, margin: '0 auto', padding: `0 ${SPACING.lg}` }}>
        <div style={{ ...PAGE_TITLE_BLOCK, marginTop: 0 }}>
          <h1 style={{ ...T.pageTitle, paddingTop: SPACING.xl, color: PALETTE.black, margin: 0 }}>
            Runway
          </h1>
        </div>
      </div>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: `0 ${SPACING.xl} ${SPACING.xxxxl}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: SPACING.lg }}>
          {VIDEOS.map(v => <VideoSlot key={v.id} {...v} />)}
        </div>
      </div>
    </>
  )
}
