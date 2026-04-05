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
    title: 'Over The Ice',
    artist: 'The Field',
    youtubeId: 'FQxEVhyvA0I',
  },
  {
    id: 'v2',
    title: 'Everyday',
    artist: 'The Field',
    youtubeId: 'hvDt7XFhwHg',
  },
  {
    id: 'v3',
    title: 'A Paw in My Face',
    artist: 'The Field',
    youtubeId: '-jfRsIoTC4c',
  },
  {
    id: 'v4',
    title: 'Is This Power',
    artist: 'The Field',
    youtubeId: 'YVNqWZPqxDE',
  },
  {
    id: 'v5',
    title: 'Everybody\'s Got to Learn Sometime',
    artist: 'The Field',
    youtubeId: 'jmWA7if9ESs',
  },
]

function VideoSlot({ title, artist, youtubeId }: typeof VIDEOS[0]) {
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

      <div style={{ padding: `${SPACING.xl} ${SPACING.xl}` }}>
        <p style={{ ...T.micro, fontSize: SIZE_LG, fontWeight: 600, color: PALETTE.black, margin: `0 0 ${SPACING.sm}` }}>{title}</p>
        <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.45, margin: 0 }}>{artist}</p>
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
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .ag-runway-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: ${SPACING.xl};
            padding: 0 ${SPACING.lg};
          }
        }
        @media (min-width: 768px) {
          .ag-runway-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: ${SPACING.xxxxl};
            max-width: 1100px;
            margin: 0 auto;
            padding: 0 ${SPACING.lg};
          }
          .ag-runway-item:nth-child(1) {
            transform: translateY(0px);
          }
          .ag-runway-item:nth-child(2) {
            transform: translateY(60px);
          }
          .ag-runway-item:nth-child(3) {
            transform: translateY(-40px);
          }
          .ag-runway-item:nth-child(4) {
            transform: translateY(80px);
          }
          .ag-runway-item:nth-child(5) {
            transform: translateY(-20px);
          }
        }
      `}} />
      <div style={{ padding: `0 0 ${SPACING.xxxxl}` }}>
        <div className="ag-runway-grid">
          {VIDEOS.map(v => (
            <div key={v.id} className="ag-runway-item" style={{ transition: 'transform 0.3s ease' }}>
              <VideoSlot {...v} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
