'use client'

// ─────────────────────────────────────────────────────────────────────────────
// TwitterBox — Live feed placeholder for the Archive page.
// Future: replace sample tweets with an embedded X/Twitter timeline widget
// or a server-side fetched tweet list via the X API.
// ─────────────────────────────────────────────────────────────────────────────

import {
  PALETTE, T, BOX_SHELL, BOX_HEADER, BOX_PADDING, ITEM_RULE, SPACING,
} from '@/src/styles/tokens'

const SAMPLE_TWEETS = [
  {
    handle: '@AtlantaGleaner',
    time:   '2h',
    text:   'New decision from the Court of Appeals regarding municipal immunity. Summary available in Volume IV.',
  },
  {
    handle: '@AtlantaGleaner',
    time:   'Mar 23',
    text:   'Updating the archive with decisions from Q4 2023. Notice the shift in premises liability interpretations.',
  },
  {
    handle: '@AtlantaGleaner',
    time:   'Mar 18',
    text:   'Peachstate Concessionaires Inc. v. Bryant now live. One of the stranger fact patterns we\'ve indexed — stabbed at a Dunkin\' Donuts, employer liability at issue.',
  },
]

export function TwitterBox() {
  return (
    <div style={{ ...BOX_SHELL }}>
      <div style={{ padding: BOX_PADDING }}>
        <h2 style={{ ...BOX_HEADER }}>
          Live Feed · X / Twitter
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {SAMPLE_TWEETS.map((tweet, i) => (
            <div key={i} style={{
              ...ITEM_RULE,
              paddingBottom: SPACING.lg,
              marginBottom:  SPACING.lg,
              display:       'flex',
              flexDirection: 'column',
              gap:           SPACING.sm,
            }}>
              <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.55, margin: 0 }}>
                {tweet.handle} · {tweet.time}
              </p>
              <p style={{ ...T.body, color: PALETTE.black, margin: 0 }}>
                {tweet.text}
              </p>
            </div>
          ))}

          <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.45, margin: 0 }}>
            [ X timeline integration pending ]
          </p>
        </div>
      </div>
    </div>
  )
}
