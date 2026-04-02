import { Banner } from '@/src/components/Banner'
import {
  FONT, T, PALETTE, PALETTE_CSS, SPACING,
  SIZE_SM, SIZE_MD, SIZE_LG, PAGE_MAX_W, PAGE_TITLE_BLOCK,
} from '@/src/styles/tokens'

// ─────────────────────────────────────────────────────────────────────────────
// About — editorial mission and site information
// ─────────────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <>
      <Banner />
      <div style={{ maxWidth: PAGE_MAX_W, margin: '0 auto', padding: `0 ${SPACING.lg}` }}>
        <div style={{ ...PAGE_TITLE_BLOCK, marginTop: 0 }}>
          <h1 style={{ ...T.pageTitle, paddingTop: SPACING.xl, color: PALETTE.black, margin: 0 }}>
            About
          </h1>
        </div>
      </div>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: `0 ${SPACING.xl} ${SPACING.xxxxl}` }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xl }}>

          <p style={{ ...T.prose, color: PALETTE.black, margin: 0 }}>
            <strong>The Atlanta Gleaner</strong> is an independent publication focused on Georgia case law
            and legal news. It exists to make the output of Georgia&rsquo;s courts readable — digestible by
            anyone with an interest in the law, not just attorneys.
          </p>

          <p style={{ ...T.prose, color: PALETTE.black, opacity: 0.75, margin: 0 }}>
            Each edition centers on a recently decided opinion from a Georgia court.
            The opinion is republished with a plain-language summary and editorial framing.
            The news index tracks ongoing legal and political developments in the state.
          </p>

          <div style={{ borderLeft: `3px solid ${PALETTE.black}`, paddingLeft: SPACING.lg, margin: `${SPACING.sm} 0` }}>
            <p style={{ ...FONT.serif, fontSize: SIZE_LG, fontStyle: 'italic', fontWeight: 600, color: PALETTE.black, margin: 0, lineHeight: 1.45 }}>
              &ldquo;The law is a public record. It should read like one.&rdquo;
            </p>
          </div>

          <p style={{ ...T.prose, color: PALETTE.black, opacity: 0.75, margin: 0 }}>
            The comics section posts selections from The Far Side and other strips as archival found objects.
            The Runway is an occasional music column. The Vault sells goods.
          </p>

          <p style={{ ...T.prose, color: PALETTE.black, opacity: 0.75, margin: 0 }}>
            The Atlanta Gleaner is edited by George Washington. It is published from Atlanta, Georgia.
          </p>

          {/* Masthead block */}
          <div style={{ marginTop: SPACING.xl, border: `1px solid ${PALETTE_CSS.ruleMd}`, background: PALETTE.white, padding: `${SPACING.xl} ${SPACING.xxl}` }}>
            <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.45, margin: `0 0 ${SPACING.md}`, borderBottom: `1px solid ${PALETTE_CSS.rule}`, paddingBottom: SPACING.sm }}>
              Masthead
            </p>
            {[
              ['Editor',       'George Washington'],
              ['Publication',  'The Atlanta Gleaner'],
              ['Founded',      '2024'],
              ['Location',     'Atlanta, Georgia'],
              ['Contact',      'atlantagleaner@gmail.com'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: SPACING.lg, padding: `${SPACING.xs} 0`, borderBottom: `1px solid ${PALETTE_CSS.ruleSm}`, flexWrap: 'wrap' }}>
                <span style={{ ...T.micro, color: PALETTE.black, opacity: 0.45, minWidth: '100px' }}>{label}:</span>
                <span style={{ ...T.prose, color: PALETTE.black }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Legal notice */}
          <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.35, lineHeight: 1.6, margin: `${SPACING.md} 0 0` }}>
            Case opinions republished on this site are public records. Summaries and editorial commentary are
            original work. Comic panels are republished for editorial and archival purposes. This site is not
            affiliated with any court, law firm, or government body.
          </p>

        </div>
      </div>
    </>
  )
}
