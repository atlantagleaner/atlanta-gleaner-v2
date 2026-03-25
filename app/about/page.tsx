import { type CSSProperties } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// About — editorial mission and site information
// ─────────────────────────────────────────────────────────────────────────────

const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const serif: CSSProperties = { fontFamily: "'Cormorant Garamond', serif" }
const sans: CSSProperties = { fontFamily: "'Inter', sans-serif" }

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 80px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '40px', borderBottom: '1px solid rgba(0,0,0,0.10)', paddingBottom: '24px' }}>
        <p style={{ ...mono, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.28em', color: '#888', margin: '0 0 8px' }}>
          The Atlanta Gleaner · Masthead
        </p>
        <h1 style={{ ...serif, fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1, color: '#0A0A0A', margin: 0, textShadow: '0 0 1px rgba(0,0,0,0.2)' }}>
          About
        </h1>
      </div>

      {/* Body copy */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <p style={{ ...sans, fontSize: '16px', lineHeight: 1.75, color: '#222', margin: 0 }}>
          <strong>The Atlanta Gleaner</strong> is an independent publication focused on Georgia case law
          and legal news. It exists to make the output of Georgia&rsquo;s courts readable — digestible by
          anyone with an interest in the law, not just attorneys.
        </p>

        <p style={{ ...sans, fontSize: '16px', lineHeight: 1.75, color: '#444', margin: 0 }}>
          Each edition centers on a recently decided opinion from a Georgia court.
          The opinion is republished with a plain-language summary and editorial framing.
          The news index tracks ongoing legal and political developments in the state.
        </p>

        <div style={{ borderLeft: '3px solid #000', paddingLeft: '16px', margin: '8px 0' }}>
          <p style={{ ...serif, fontSize: '22px', fontStyle: 'italic', fontWeight: 600, color: '#000', margin: 0, lineHeight: 1.45 }}>
            &ldquo;The law is a public record. It should read like one.&rdquo;
          </p>
        </div>

        <p style={{ ...sans, fontSize: '16px', lineHeight: 1.75, color: '#444', margin: 0 }}>
          The comics section posts selections from The Far Side and other strips as archival found objects.
          The Runway is an occasional music column. The Vault sells goods.
        </p>

        <p style={{ ...sans, fontSize: '16px', lineHeight: 1.75, color: '#444', margin: 0 }}>
          The Atlanta Gleaner is edited by George Washington. It is published from Atlanta, Georgia.
        </p>

        {/* Masthead block */}
        <div style={{ marginTop: '20px', border: '1px solid rgba(0,0,0,0.12)', background: '#fff', padding: '20px 22px' }}>
          <p style={{ ...mono, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.18em', color: '#aaa', margin: '0 0 12px', borderBottom: '1px solid rgba(0,0,0,0.07)', paddingBottom: '8px' }}>
            Masthead
          </p>
          {[
            ['Editor',       'George Washington'],
            ['Publication',  'The Atlanta Gleaner'],
            ['Founded',      '2024'],
            ['Location',     'Atlanta, Georgia'],
            ['Contact',      'atlantagleaner@gmail.com'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: '16px', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
              <span style={{ ...mono, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', minWidth: '100px' }}>{label}:</span>
              <span style={{ ...sans, fontSize: '13px', color: '#333' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Legal notice */}
        <p style={{ ...mono, fontSize: '9px', color: '#aaa', lineHeight: 1.6, margin: '12px 0 0', letterSpacing: '0.04em' }}>
          Case opinions republished on this site are public records. Summaries and editorial commentary are
          original work. Comic panels are republished for editorial and archival purposes. This site is not
          affiliated with any court, law firm, or government body.
        </p>

      </div>
    </div>
  )
}
