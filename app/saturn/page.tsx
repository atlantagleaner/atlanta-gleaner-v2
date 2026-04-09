import { TarotModule }      from './components/TarotModule'
import { AstrologyModule }  from './components/AstrologyModule'
import { CrystalBallModule }from './components/CrystalBallModule'
import { BlackjackModule }  from './components/BlackjackModule'
import { Banner }           from '@/src/components/Banner'
import {
  T, PALETTE_CSS, PAGE_MAX_W, SPACING,
  PAGE_BOTTOM_PADDING_DESKTOP, PAGE_BOTTOM_PADDING_MOBILE,
} from '@/src/styles/tokens'

export const metadata = {
  title:       'Saturn | Atlanta Gleaner',
  description: 'A celestial archive of divinations and games of chance.',
}

export default function SaturnPage() {
  return (
    <div data-theme="saturn" style={{ minHeight: '100vh', backgroundColor: '#0B0820' }}>
      <style>{`
        @media (max-width: 767px)  { .saturn-bottom { padding-bottom: ${PAGE_BOTTOM_PADDING_MOBILE}; } }
        @media (min-width: 768px)  { .saturn-bottom { padding-bottom: ${PAGE_BOTTOM_PADDING_DESKTOP}; } }
        @media (max-width: 767px)  { .saturn-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 900px)  { .saturn-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <Banner />

      {/* Page title block */}
      <div style={{ maxWidth: PAGE_MAX_W, margin: '0 auto', padding: `0 ${SPACING.lg}` }}>
        <div style={{
          borderBottom: '1px solid rgba(184,134,11,0.20)',
          padding: `${SPACING.xl} 0 ${SPACING.lg}`,
          marginBottom: SPACING.xxl,
        }}>
          <h1 style={{
            ...T.pageTitle,
            color: '#B8860B',
            margin: 0,
            letterSpacing: '0.20em',
          }}>
            ♄ Saturn
          </h1>
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '10px',
            color: 'rgba(245,241,232,0.45)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            margin: `${SPACING.sm} 0 0`,
          }}>
            Divination Suite — Navigate the Systems of Knowing
          </p>
        </div>
      </div>

      {/* Module grid */}
      <div className="saturn-bottom" style={{ maxWidth: PAGE_MAX_W, margin: '0 auto', padding: `0 ${SPACING.lg}` }}>
        <div
          className="saturn-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: SPACING.xxl,
          }}
        >
          <TarotModule />
          <AstrologyModule />
          <CrystalBallModule />
          <BlackjackModule />
        </div>
      </div>
    </div>
  )
}
