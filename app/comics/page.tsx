import { Banner } from '@/src/components/Banner'
import {
  FONT, T, PALETTE, PALETTE_CSS, SPACING,
  SIZE_SM, SIZE_LG, PAGE_MAX_W, PAGE_TITLE_BLOCK, PAGE_BOTTOM_PADDING_DESKTOP, PAGE_BOTTOM_PADDING_MOBILE,
} from '@/src/styles/tokens'

// ─────────────────────────────────────────────────────────────────────────────
// Comics — comic panels displayed like framed art in a gallery
// Future: fetch from Supabase `comics` table with imageUrl, caption, date
// ─────────────────────────────────────────────────────────────────────────────

// Future: replace with Supabase fetch
const COMICS = [
  {
    id: 'c1',
    series: 'The Far Side',
    caption: '"Suddenly, Ted remembered he had left the primordial soup on."',
    imageUrl: null as string | null,
    publishedAt: 'March 25, 2026',
    frameNo: '01',
  },
]

function ComicFrame({ series, caption, imageUrl, publishedAt, frameNo }: typeof COMICS[0]) {
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
          {series}
        </span>
        <span style={{ ...FONT.mono, fontSize: SIZE_SM, color: PALETTE.white, opacity: 0.45, letterSpacing: '0.08em' }}>
          FRAME:{frameNo}
        </span>
      </div>

      {/* Frame label */}
      <div style={{ background: PALETTE.warm, padding: `${SPACING.xs} ${SPACING.lg}`, borderBottom: `1px solid ${PALETTE_CSS.rule}` }}>
        <span style={{ ...T.micro, color: PALETTE.black, opacity: 0.45 }}>▶ {frameNo} · {publishedAt}</span>
      </div>

      {/* Image area — museum-style with wide white mat */}
      <div style={{ padding: SPACING.xl, background: PALETTE.warm }}>
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={caption || series}
            style={{
              width:   '100%',
              display: 'block',
              border:  `1px solid ${PALETTE_CSS.rule}`,
              filter:  'grayscale(15%) contrast(1.05)',
            }}
          />
        ) : (
          <div style={{
            aspectRatio:    '4/3',
            border:         `1px solid ${PALETTE_CSS.rule}`,
            display:        'flex',
            flexDirection:  'column',
            justifyContent: 'center',
            alignItems:     'center',
            gap:            SPACING.sm,
            background:     PALETTE.white,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '32px', color: PALETTE.black, opacity: 0.25 }} strokeWidth="1" strokeLinecap="square">
              <rect x="2" y="2" width="20" height="20" />
              <circle cx="8" cy="8" r="2" />
              <polyline points="22 15 17 10 5 22" />
            </svg>
            <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.35, margin: 0 }}>
              [ Awaiting Scan ]
            </p>
          </div>
        )}
      </div>

      {/* Caption — museum label style */}
      {caption && (
        <div style={{ padding: `${SPACING.md} ${SPACING.xl} ${SPACING.lg}`, borderTop: `1px solid ${PALETTE_CSS.rule}` }}>
          <p style={{ ...T.caption, color: PALETTE.black, margin: 0 }}>
            {caption}
          </p>
          <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.45, margin: `${SPACING.sm} 0 0` }}>
            {series} · {publishedAt}
          </p>
        </div>
      )}
    </div>
  )
}

export default function ComicsPage() {
  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .ag-comics-container {
            padding-bottom: ${PAGE_BOTTOM_PADDING_MOBILE};
          }
        }
        @media (min-width: 768px) {
          .ag-comics-container {
            padding-bottom: ${PAGE_BOTTOM_PADDING_DESKTOP};
          }
        }
      `}</style>
      <Banner />
      <div style={{ maxWidth: PAGE_MAX_W, margin: '0 auto', padding: `0 ${SPACING.lg}` }}>
        <div style={{ ...PAGE_TITLE_BLOCK, marginTop: 0 }}>
          <h1 style={{ ...T.pageTitle, paddingTop: SPACING.xl, color: PALETTE.black, margin: 0 }}>
            Comics
          </h1>
        </div>
      </div>
      <div className="ag-comics-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: `0 ${SPACING.xl}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: SPACING.xl }}>
          {COMICS.map(c => <ComicFrame key={c.id} {...c} />)}
        </div>
      </div>
    </>
  )
}
