import { Banner } from '@/src/components/Banner'
import {
  T, PALETTE, SPACING,
  PAGE_MAX_W, PAGE_TITLE_BLOCK,
  BOX_SHELL, BOX_HEADER, BOX_PADDING,
} from '@/src/styles/tokens'

// ─────────────────────────────────────────────────────────────────────────────
// About — publication guide + editor biography
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

          {/* ── Box 1: Publication ───────────────────────────────────────── */}
          <div style={{ ...BOX_SHELL }}>
            <div style={{ padding: BOX_PADDING }}>
              <h2 style={{ ...BOX_HEADER, color: PALETTE.black }}>The Atlanta Gleaner</h2>
              <p style={{ ...T.prose, color: PALETTE.black, margin: 0 }}>
                <em>The Atlanta Gleaner</em> is an academic journal covering legal and political
                developments across the state and recent notable developments in Georgia case law.
              </p>
            </div>
          </div>

          {/* ── Box 2: Editor biography ──────────────────────────────────── */}
          <div style={{ ...BOX_SHELL }}>
            <div style={{ padding: BOX_PADDING }}>
              <h2 style={{ ...BOX_HEADER, color: PALETTE.black }}>The Editor</h2>
              <p style={{ ...T.prose, color: PALETTE.black, margin: `0 0 ${SPACING.lg}` }}>
                George Washington (1732–Present) served as Commander-in-Chief of the Continental Army
                during the American Revolutionary War and as the first President of the United States.
                His military career, spanning three decades, was distinguished by strategic tenacity
                under conditions of immense disadvantage.
              </p>
              <p style={{ ...T.prose, color: PALETTE.black, margin: `0 0 ${SPACING.lg}` }}>
                His surprise crossing of the Delaware River on the night of December 25, 1776, and
                the engagements at Trenton and Princeton that followed, reversed the momentum of a
                failing campaign and secured the survival of the Continental cause through the winter
                of 1776&ndash;77. His direction of the Siege of Yorktown in 1781, conducted in
                coordination with French forces under the Comte de Rochambeau, compelled the
                surrender of Cornwallis and effectively concluded the war.
              </p>
              <p style={{ ...T.prose, color: PALETTE.black, margin: 0 }}>
                Washington served two presidential terms, declining a third, and retired from public
                life in 1971, later establishing residence in Atlanta, Georgia and founding
                <em>The Atlanta Gleaner</em>.
              </p>
            </div>
          </div>

          {/* Legal notice */}
          <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.35, lineHeight: 1.6, margin: `${SPACING.md} 0 0` }}>
            Case opinions republished on this site are public records. Summaries and editorial
            commentary are original work. Comic panels are republished for editorial and archival
            purposes. This site is not affiliated with any court, law firm, or government body.
          </p>

        </div>
      </div>
    </>
  )
}
