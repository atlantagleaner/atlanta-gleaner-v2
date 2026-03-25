'use client'

import { useState, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
type NewsItemProps = { title: string; source: string; link: string }
type MetaRowProps  = { label: string; value: string; isAlert?: boolean }

// ─── News Data ────────────────────────────────────────────────────────────────
const NEWS: NewsItemProps[] = [
  { title: 'Democrats sue to block new Georgia election-certification rules', source: 'CNN Politics', link: '#' },
  { title: "Campaign cash and strategy shape the crowded fight for the Georgia governor's mansion", source: 'WABE', link: '#' },
  { title: "Experts shift Georgia governor's race to 'toss up' as primary fields solidify", source: 'News from the States', link: '#' },
  { title: 'Georgia House passes 60-day suspension of gas tax amid rising prices from Iran conflict', source: 'WABE', link: '#' },
  { title: 'Georgia appeals court rules Fulton County can reject GOP election board picks', source: 'CBS News Atlanta', link: '#' },
  { title: "Atlanta PD on high alert due to planned 'teen takeover' threat this weekend", source: 'WSB-TV', link: '#' },
  { title: 'ICE agents deploying to Hartsfield-Jackson Atlanta airport starting Monday', source: 'WSB-TV', link: '#' },
  { title: "Feral hogs can't catch a break in Georgia as lawmakers enlist cutting-edge tech to hunt them down", source: 'Capitol Beat', link: '#' },
  { title: 'Top US FEMA official claims to have teleported to a Waffle House in Rome, Georgia', source: 'The Guardian', link: '#' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────
function NewsItem({ title, source, link }: NewsItemProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <li style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '10px' }}>
      <a href={link} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ textDecoration: 'none', display: 'block' }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: 1.45,
          color: hovered ? '#fff' : '#111',
          backgroundColor: hovered ? '#111' : 'transparent',
          padding: '2px 3px',
          textDecoration: hovered ? 'none' : 'underline',
          textDecorationColor: 'rgba(0,0,0,0.2)',
          textUnderlineOffset: '3px',
          transition: 'all 0.12s',
          margin: 0,
        }}>{title}</p>
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '10px',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 'bold',
          marginTop: '5px',
          marginBottom: 0,
        }}>{source}</p>
      </a>
    </li>
  )
}

function MetaRow({ label, value, isAlert = false }: MetaRowProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', padding: '7px 0', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap', gap: '4px' }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 'bold', color: '#6b7280', width: '130px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}:
      </span>
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '13px',
        color: isAlert ? '#000' : '#374151',
        fontWeight: isAlert ? 'bold' : 500,
        backgroundColor: isAlert ? '#fef08a' : 'transparent',
        padding: isAlert ? '1px 4px' : '0',
      }}>{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [imgSrc, setImgSrc] = useState('/washington.png')
  const [opinionOpen, setOpinionOpen] = useState(false)

  // Analog randomized seeds — set in useEffect to avoid hydration mismatch
  const [analog, setAnalog] = useState({
    seed: 0, freq: '0.8', offset: 0, x: '50', y: '40',
  })

  useEffect(() => {
    setAnalog({
      seed:   Math.floor(Math.random() * 10000),
      freq:   (Math.random() * 0.3 + 0.65).toFixed(2),
      offset: Math.floor(Math.random() * 10),
      x:      (50 + (Math.random() * 6 - 3)).toFixed(1),
      y:      (40 + (Math.random() * 6 - 3)).toFixed(1),
    })
  }, [])

  const bg = `radial-gradient(circle at ${analog.x}% ${analog.y}%, #FFFFFF 0%, #F5F0E8 50%, #E8E3D8 100%)`

  return (
    <>
      {/* ── Google Fonts ── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* ── Global resets ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; width: 100%; overflow-x: hidden; }
        body { background: ${bg}; }
        .bulb-flicker { animation: flicker 6s infinite alternate ease-in-out; }
        @keyframes flicker { 0% { opacity: 0.98; } 50% { opacity: 1; } 100% { opacity: 0.965; } }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #E8E3D8; }
        ::-webkit-scrollbar-thumb { background: #aaa; }
      `}} />

      <div className="bulb-flicker" style={{ minHeight: '100vh', width: '100%', background: bg, position: 'relative' }}>

        {/* ── Hardware overlays ── */}

        {/* 1. Fresnel lens rings */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10,
          background: 'repeating-radial-gradient(circle at center, transparent 0, transparent 3px, rgba(0,0,0,0.012) 3px, rgba(0,0,0,0.012) 4px)',
        }} />

        {/* 2. Scanlines — randomized offset */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 11,
          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.028) 50%, rgba(0,0,0,0.028))',
          backgroundSize: '100% 4px',
          backgroundPosition: `0 ${analog.offset}px`,
        }} />

        {/* 3. Film grain — unique on every load */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 12, opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${analog.freq}' numOctaves='3' seed='${analog.seed}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />

        {/* 4. Lens flare — bulb hotspot */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 13, mixBlendMode: 'screen',
          background: `radial-gradient(circle at ${analog.x}% ${analog.y}%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%)`,
        }} />

        {/* ── MASTHEAD ── */}
        <header style={{ position: 'relative', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '60px', paddingBottom: '40px', paddingLeft: '16px', paddingRight: '16px' }}>

          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.28em', color: '#666', marginBottom: '16px', textAlign: 'center' }}>
            Georgia Case Law Updates and Legal News
          </p>

          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(3.5rem, 9vw, 7.5rem)',
            fontWeight: 'bold',
            letterSpacing: '-0.04em',
            color: '#000',
            margin: '0 0 12px 0',
            textAlign: 'center',
            textShadow: '0 0 1px rgba(0,0,0,0.4), 0 0 3px rgba(0,0,0,0.1)',
            lineHeight: 1,
          }}>
            The Atlanta Gleaner.
          </h1>

          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: '#888', marginBottom: '28px', textAlign: 'center' }}>
            Edited By George Washington
          </p>

          {/* Washington portrait */}
          <div style={{ width: '128px', border: '1px solid rgba(0,0,0,0.15)', padding: '3px', background: '#fff' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              onError={() => setImgSrc('https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/George_Washington_Statue_Federal_Hall_NYC.jpg/400px-George_Washington_Statue_Federal_Hall_NYC.jpg')}
              alt="George Washington Statue"
              style={{ width: '100%', height: '155px', objectFit: 'cover', objectPosition: 'top', display: 'block',
                filter: 'grayscale(100%) contrast(175%) brightness(1.2) blur(0.3px)',
                mixBlendMode: 'multiply',
              }}
            />
          </div>
        </header>

        {/* ── THREE COLUMN LAYOUT ── */}
        <main style={{ position: 'relative', zIndex: 20, maxWidth: '1500px', margin: '0 auto', width: '100%', padding: '0 24px 80px 24px', display: 'flex', flexDirection: 'row', gap: '0', flexWrap: 'wrap' }}>

          {/* ── ROLL-A: NEWS ── */}
          <section style={{ flex: '0 0 25%', minWidth: '260px', padding: '0 12px 0 0' }}>
            <div style={{ border: '1px solid rgba(0,0,0,0.75)', background: '#fff' }}>
              {/* Panel header */}
              <div style={{ background: '#111', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Roll-A : News</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#555', letterSpacing: '0.1em' }}>IDX: 01</span>
              </div>
              {/* Frame label */}
              <div style={{ background: 'rgba(0,0,0,0.04)', padding: '4px 12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#999' }}>▶ 01</span>
              </div>
              {/* Content */}
              <div style={{ padding: '16px' }}>
                <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '14px', margin: '0 0 14px 0' }}>
                  News Index
                </h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {NEWS.map((item, i) => <NewsItem key={i} {...item} />)}
                </ul>
              </div>
            </div>
          </section>

          {/* ── ROLL-B: CASE LAW ── */}
          <section style={{ flex: '0 0 50%', minWidth: '320px', padding: '0 12px' }}>
            <div style={{ border: '1px solid rgba(0,0,0,0.75)', background: '#fff' }}>
              {/* Panel header */}
              <div style={{ background: '#111', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Roll-B : Case Law Updates</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#555', letterSpacing: '0.1em' }}>REF: A25A1973</span>
              </div>
              {/* Frame 01 */}
              <div style={{ background: 'rgba(0,0,0,0.04)', padding: '4px 12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#999' }}>▶ 01</span>
              </div>
              <div style={{ padding: '24px' }}>
                <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '8px', margin: '0 0 16px 0' }}>
                  Case Law Updates
                </h2>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 'bold', lineHeight: 1.1, color: '#000', margin: '0', textShadow: '0 0 1px rgba(0,0,0,0.3)' }}>
                  Int&apos;l Bhd. of Police Officers Local 623, Inc. v. Brosnan
                </h3>
              </div>
              {/* Frame 02 — Metadata */}
              <div style={{ background: 'rgba(0,0,0,0.04)', padding: '4px 12px', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#999' }}>▶ 02</span>
              </div>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
                <MetaRow label="Court"        value="Court of Appeals of Georgia, Third Division" />
                <MetaRow label="Date Decided" value="February 17, 2026" />
                <MetaRow label="Docket No"    value="A25A1973" />
                <MetaRow label="Citations"    value="2026 Ga. App. LEXIS 92* | 2026 LX 47281 | 2026 WL 440637" />
                <MetaRow label="Judges"       value="DOYLE, P.J. Markle and Padgett, JJ., concur." />
                <MetaRow label="Disposition"  value="Judgment affirmed." />
                <MetaRow label="Notice"       value="THIS OPINION IS UNCORRECTED AND SUBJECT TO REVISION." isAlert />
              </div>
              {/* Frame 03 — Summary */}
              <div style={{ background: 'rgba(0,0,0,0.04)', padding: '4px 12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#999' }}>▶ 03</span>
              </div>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#666', marginBottom: '14px' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 'bold', background: '#f3f4f6', padding: '1px 5px', marginRight: '6px' }}>Core Terms:</span>
                  breach of contract, legal representation, summary judgment, police officer union, consideration, damages, reimbursement
                </p>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '10px', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px' }}>Case Summary</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', lineHeight: 1.65, color: '#222', marginBottom: '14px' }}>
                  In 2020, Atlanta Police Officer Devin Brosnan was involved in the shooting of Rayshard Brooks and immediately requested a Union attorney, relying on recruitment materials promising 24/7 legal representation. When the Union failed to provide counsel prior to his arrest, Brosnan hired a private defense firm for $250,000 and sued the Union for breach of contract.
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', lineHeight: 1.65, fontWeight: 'bold', borderLeft: '3px solid #000', paddingLeft: '12px', margin: '16px 0', color: '#000' }}>
                  The Georgia Court of Appeals affirmed partial summary judgment in favor of Brosnan, holding that the Union's documents and verbal assurances created an enforceable contract that the Union breached.
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', lineHeight: 1.65, color: '#222', margin: 0 }}>
                  The Court concluded that whether a $100,000 retainer paid by Brosnan&apos;s father constitutes a repayable debt remains a question of fact for a jury.
                </p>
              </div>
              {/* Frame 04 — Opinion */}
              <div style={{ background: 'rgba(0,0,0,0.04)', padding: '4px 12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#999' }}>▶ 04</span>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', fontWeight: 'bold', margin: '0 0 10px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>Opinion</h4>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#444', margin: '0 0 14px 0' }}>DOYLE, Presiding Judge.</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', lineHeight: 1.65, color: '#333', marginBottom: '14px' }}>
                  Devin Brosnan filed suit against the International Brotherhood of Police Officers, Local 623, Inc., (&ldquo;the Union&rdquo;) alleging that it breached an agreement to provide legal representation.{' '}
                  <strong style={{ background: '#f3f4f6', padding: '0 2px' }}>The parties filed cross-motions for summary judgment, and the trial granted partial summary judgment in favor of Brosnan.</strong>{' '}
                  The Union now appeals, and we affirm for the reasons that follow.
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', lineHeight: 1.65, color: '#555', marginBottom: '20px' }}>
                  &ldquo;Summary judgment is proper when there is no genuine issue of material fact and the movant is entitled to judgment as a matter of law.&rdquo; <em style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px' }}>On Line, Inc. v. Wrightsboro Walk, LLC</em>, 332 Ga. App. 777 (2015).
                </p>
                {!opinionOpen ? (
                  <button
                    onClick={() => setOpinionOpen(true)}
                    onMouseEnter={e => { (e.target as HTMLElement).style.background = '#000'; (e.target as HTMLElement).style.color = '#F5F0E8'; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#000'; }}
                    style={{ width: '100%', padding: '14px 0', border: '2px solid #000', background: 'transparent', color: '#000', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    [ Load Full Opinion ]
                  </button>
                ) : (
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#999', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    [ Full opinion — Supabase integration pending ]
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ── ROLL-C: COMIC ── */}
          <section style={{ flex: '0 0 25%', minWidth: '200px', padding: '0 0 0 12px' }}>
            <div style={{ border: '1px solid rgba(0,0,0,0.75)', background: '#fff' }}>
              {/* Panel header */}
              <div style={{ background: '#111', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Roll-C : The Far Side</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#555', letterSpacing: '0.1em' }}>IMG: 01</span>
              </div>
              {/* Frame label */}
              <div style={{ background: 'rgba(0,0,0,0.04)', padding: '4px 12px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#999' }}>▶ 01</span>
              </div>
              {/* Content */}
              <div style={{ padding: '16px' }}>
                <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '8px', margin: '0 0 14px 0' }}>
                  The Far Side
                </h2>
                <div style={{ border: '1px solid #e5e7eb', width: '100%', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '16px', cursor: 'pointer', background: '#fafafa' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '48px', height: '48px', marginBottom: '12px', color: '#d1d5db' }} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
                    <rect x="3" y="3" width="18" height="18" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', margin: 0, textAlign: 'center' }}>
                    [ Comic Awaiting Scan ]
                  </p>
                </div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontStyle: 'italic', fontWeight: 'bold', color: '#333', textAlign: 'center', lineHeight: 1.5, marginTop: '16px' }}>
                  &ldquo;We&apos;ve updated our privacy policy, changed our terms of service, and eaten your family.&rdquo;
                </p>
              </div>
            </div>
          </section>

        </main>
      </div>
    </>
  )
}
