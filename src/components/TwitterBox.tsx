'use client'

// ─────────────────────────────────────────────────────────────────────────────
// TwitterBox — Live feed placeholder for the Archive page.
// Future: replace sample tweets with an embedded X/Twitter timeline widget
// or a server-side fetched tweet list via the X API.
// ─────────────────────────────────────────────────────────────────────────────

import { PALETTE, FONT, T, BOX_SHELL, BOX_HEADER, ITEM_RULE } from '@/src/styles/tokens'

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
    <div style={{ ...BOX_SHELL, height: 'auto' }}>
      {/* Header — BOX_HEADER */}
      <h2 style={{ ...BOX_HEADER, padding: '8px 14px', margin: 0 }}>
        Live Feed · X / Twitter
      </h2>

      {/* Tweet list */}
      <div style={{ padding: '14px 14px 18px', display: 'flex', flexDirection: 'column', gap: '0' }}>
        {SAMPLE_TWEETS.map((tweet, i) => (
          <div key={i} style={{
            ...ITEM_RULE,
            paddingBottom: '16px',
            marginBottom:  '16px',
            display:       'flex',
            flexDirection: 'column',
            gap:           '6px',
          }}>
            {/* Handle + time — T.micro */}
            <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.55, margin: 0 }}>
              {tweet.handle} · {tweet.time}
            </p>
            {/* Tweet body — 13px sans */}
            <p style={{
              ...FONT.sans,
              fontSize:   '13px',
              lineHeight: 1.55,
              color:      PALETTE.black,
              margin:     0,
            }}>
              {tweet.text}
            </p>
          </div>
        ))}

        {/* Footer action */}
        <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.45, margin: 0, marginTop: '2px' }}>
          [ X timeline