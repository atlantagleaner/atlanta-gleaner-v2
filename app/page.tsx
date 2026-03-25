'use client'

import { useState } from 'react'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────
type NewsItemProps  = { title: string; source: string; link: string }
type MetaRowProps   = { label: string; value: string; isAlert?: boolean }

// ─── Data ─────────────────────────────────────────────────────────────────────
const NEWS: NewsItemProps[] = [
  { title: 'Democrats sue to block new Georgia election-certification rules', source: 'CNN Politics', link: '#' },
  { title: "Campaign cash and strategy shape the crowded fight for the Georgia governor's mansion", source: 'WABE', link: '#' },
  { title: "Experts shift Georgia governor's race to 'toss up' as primary fields solidify", source: 'News from the States', link: '#' },
  { title: 'Georgia House passes 60-day suspension of gas tax amid rising prices from Iran conflict', source: 'WABE', link: '#' },
  { title: 'Georgia appeals court rules Fulton County can reject GOP election board picks', source: 'CBS News Atlanta', link: '#' },
  { title: "Atlanta PD on high alert due to planned 'teen takeover' threat this weekend", source: 'WSB-TV', link: '#' },
  { title: 'ICE agents deploying to Hartsfield-Jackson Atlanta airport starting Monday', source: 'WSB-TV', link: '#' },
  { title: "Feral hogs can't catch a break in Georgia as lawmakers enlist cutting-edge tech", source: 'Capitol Beat', link: '#' },
  { title: 'Top US FEMA official claims to have teleported to a Waffle House in Rome, Georgia', source: 'The Guardian', link: '#' },
]

// ─── Film Strip Shell ─────────────────────────────────────────────────────────
// Wraps content in the visual language of a microfiche film strip:
// dark sprocket rails on each side, label bar on top
function FilmStrip({ rollId, children }: { rollId: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col w-full">
      {/* Roll label bar */}
      <div className="flex items-center justify-between bg-black px-3 py-1.5">
        <span className="font-mono text-[10px] text-white/70 uppercase tracking-[0.25em]">{rollId}</span>
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />
          ))}
        </div>
      </div>
      {/* Strip body with sprocket rails */}
      <div className="flex">
        <div className="sprocket-left" />
        <div className="flex-1 bg-white border-x-0 border border-black/80 flex flex-col divide-y divide-black/10">
          {children}
        </div>
        <div className="sprocket-right" />
      </div>
      {/* End label */}
      <div className="bg-black px-3 py-1 text-center">
        <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.3em]">End Roll</span>
      </div>
    </div>
  )
}

// ─── Film Frame ───────────────────────────────────────────────────────────────
function Frame({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 bg-black/5 px-3 py-1 border-b border-black/10">
        <span className="text-black/30 text-[10px]">▶</span>
        <span className="font-mono text-[10px] text-black/40 tracking-widest">{num}</span>
      </div>
      <div className="p-5 bg-white">
        {children}
      </div>
    </div>
  )
}

// ─── News Item ────────────────────────────────────────────────────────────────
function NewsItem({ title, source, link }: NewsItemProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <li className="py-3 border-b border-black/8 last:border-0">
      <a
        href={link}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="block"
      >
        <p className="font-sans text-[14px] leading-snug font-medium transition-all duration-100"
          style={{
            color: hovered ? '#fff' : '#111',
            backgroundColor: hovered ? '#111' : 'transparent',
            padding: '2px 3px',
            textDecoration: hovered ? 'none' : 'underline',
            textDecorationColor: 'rgba(0,0,0,0.2)',
            textUnderlineOffset: '3px',
          }}>
          {title}
        </p>
        <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider mt-1 pl-0.5">
          {source}
        </p>
      </a>
    </li>
  )
}

// ─── Metadata Row ─────────────────────────────────────────────────────────────
function MetaRow({ label, value, isAlert = false }: MetaRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-2 border-b border-black/8 last:border-0">
      <span className="font-mono text-[10px] font-bold text-black/40 uppercase tracking-widest sm:w-36 shrink-0">
        {label}:
      </span>
      <span className={`font-sans text-[14px] ${isAlert ? 'font-bold bg-yellow-100 px-1 text-black' : 'text-black/80'}`}>
        {value}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [imgSrc, setImgSrc] = useState('/washington.png')
  const [opinionOpen, setOpinionOpen] = useState(false)

  return (
    <div className="min-h-screen w-full" style={{ background: '#F5F0E8' }}>

      {/* ── MASTHEAD ── */}
      <header className="w-full border-b-2 border-black">
        {/* Top rule */}
        <div className="w-full bg-black py-1 px-6 flex items-center justify-between">
          <span className="font-mono text-[10px] text-white/50 uppercase tracking-[0.3em]">
            Microfiche Reader — Unit 01
          </span>
          <span className="font-mono text-[10px] text-white/30 tracking-widest">
            Est. 2024
          </span>
        </div>

        {/* Banner */}
        <div className="flex flex-col items-center justify-center pt-10 pb-8 px-4 relative">

          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-black/30 mb-5">
            Georgia Case Law Updates &amp; Legal News
          </p>

          <h1
            className="font-serif font-bold text-center leading-none mb-3 ink-bleed"
            style={{ fontSize: 'clamp(3.5rem, 9vw, 8rem)', letterSpacing: '-0.04em', color: '#000' }}
          >
            The Atlanta Gleaner.
          </h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-16 bg-black/20" />
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-black/40">
              Edited By George Washington
            </p>
            <div className="h-px w-16 bg-black/20" />
          </div>

          {/* Washington portrait in film-frame border */}
          <div className="border-2 border-black p-1 bg-white" style={{ width: '130px' }}>
            <div className="overflow-hidden" style={{ height: '155px' }}>
              <Image
                src={imgSrc}
                onError={() => setImgSrc('https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/George_Washington_Statue_Federal_Hall_NYC.jpg/400px-George_Washington_Statue_Federal_Hall_NYC.jpg')}
                alt="George Washington Statue"
                width={128}
                height={155}
                className="w-full h-full object-cover object-top"
                style={{ filter: 'grayscale(100%) contrast(180%) brightness(1.15)' }}
              />
            </div>
            <p className="font-mono text-[8px] uppercase tracking-widest text-center text-black/40 mt-1">
              Fig. 01 — Editor
            </p>
          </div>
        </div>

        {/* Bottom rule with date line */}
        <div className="w-full border-t border-black/20 px-6 py-1.5 flex items-center justify-between bg-black/3">
          <span className="font-mono text-[9px] text-black/30 uppercase tracking-widest">Roll A–C Active</span>
          <span className="font-mono text-[9px] text-black/30 uppercase tracking-widest">Vol. II — 2026</span>
        </div>
      </header>

      {/* ── MASTER CONTROL: THREE ROLLS ── */}
      <main className="flex flex-col lg:flex-row items-start gap-0 max-w-[1600px] mx-auto w-full border-x border-black/10">

        {/* ROLL-A : NEWS */}
        <section className="w-full lg:w-[26%] border-r border-black/15 py-6 px-4">
          <FilmStrip rollId="Roll-A : News Index">
            <Frame num="01">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-black border-b border-black/15 pb-2 mb-4">
                News Index
              </h2>
              <ul className="flex flex-col">
                {NEWS.map((item, i) => (
                  <NewsItem key={i} {...item} />
                ))}
              </ul>
            </Frame>
          </FilmStrip>
        </section>

        {/* ROLL-B : CASE LAW */}
        <section className="w-full lg:w-[48%] border-r border-black/15 py-6 px-4">
          <FilmStrip rollId="Roll-B : Case Law Updates">

            <Frame num="01">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <h2 className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-black">
                  Case Law Updates
                </h2>
                <span className="font-mono text-[10px] text-black/30 tracking-widest">DOC: A25A1973</span>
              </div>
              <h3
                className="font-serif font-bold leading-tight mt-4 ink-bleed"
                style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)', color: '#000' }}
              >
                Int&apos;l Bhd. of Police Officers Local 623, Inc. v. Brosnan
              </h3>
            </Frame>

            <Frame num="02">
              <div className="border border-black/10 p-4 bg-black/[0.02]">
                <MetaRow label="Court"       value="Court of Appeals of Georgia, Third Division" />
                <MetaRow label="Date Decided" value="February 17, 2026" />
                <MetaRow label="Docket No"   value="A25A1973" />
                <MetaRow label="Citations"   value="2026 Ga. App. LEXIS 92* | 2026 LX 47281 | 2026 WL 440637" />
                <MetaRow label="Judges"      value="DOYLE, P.J. Markle and Padgett, JJ., concur." />
                <MetaRow label="Disposition" value="Judgment affirmed." />
                <MetaRow label="Notice"      value="THIS OPINION IS UNCORRECTED AND SUBJECT TO REVISION." isAlert />
              </div>
            </Frame>

            <Frame num="03">
              <p className="font-sans text-[13px] text-black/60 mb-4">
                <span className="font-mono text-[10px] font-bold text-black/40 uppercase tracking-widest mr-2 bg-black/5 px-1 py-0.5">
                  Core Terms:
                </span>
                breach of contract, legal representation, summary judgment, police officer union,
                consideration, damages, reimbursement, promissory estoppel
              </p>
              <div className="font-sans text-[15px] leading-relaxed text-black/80">
                <p className="font-mono text-[10px] font-bold text-black/30 uppercase tracking-widest mb-3">Case Summary</p>
                <p className="mb-4">
                  In 2020, Atlanta Police Officer Devin Brosnan was involved in the shooting of Rayshard Brooks
                  and immediately requested a Union attorney, relying on recruitment materials promising 24/7 legal
                  representation for critical incidents. When the Union failed to provide counsel prior to his arrest,
                  Brosnan hired a private defense firm for $250,000 and sued the Union for breach of contract.
                </p>
                <p className="border-l-2 border-black pl-4 py-1 my-5 font-semibold text-black">
                  The Georgia Court of Appeals affirmed partial summary judgment in favor of Brosnan, holding that
                  the Union's documents and subsequent verbal assurances created an enforceable contract that the Union breached.
                </p>
                <p>
                  The Court further concluded that whether a $100,000 retainer paid by Brosnan&apos;s father constitutes
                  a repayable debt supported by consideration remains a question of fact for a jury.
                </p>
              </div>
            </Frame>

            <Frame num="04">
              <p className="font-mono text-[10px] font-bold text-black/30 uppercase tracking-widest mb-4">Opinion — DOYLE, Presiding Judge.</p>
              <div className="font-sans text-[15px] leading-relaxed text-black/80">
                <p className="mb-4">
                  Devin Brosnan filed suit against the International Brotherhood of Police Officers, Local 623, Inc.,
                  (&ldquo;the Union&rdquo;) alleging that it breached an agreement to provide legal representation.{' '}
                  <strong className="text-black ink-bleed">
                    The parties filed cross-motions for summary judgment, and the trial granted partial summary
                    judgment in favor of Brosnan, finding the Union breached an enforceable contract.
                  </strong>{' '}
                  The Union now appeals, and we affirm for the reasons that follow.
                </p>
                <p className="font-serif italic text-[17px] text-black/60 border-l border-black/20 pl-4 mb-6">
                  &ldquo;Summary judgment is proper when there is no genuine issue of material fact and the movant
                  is entitled to judgment as a matter of law.&rdquo;
                  <span className="font-sans not-italic text-[13px] block mt-1">
                    On Line, Inc. v. Wrightsboro Walk, LLC, 332 Ga. App. 777 (2015).
                  </span>
                </p>
                {!opinionOpen ? (
                  <button
                    onClick={() => setOpinionOpen(true)}
                    className="w-full py-3 border border-black font-mono text-[11px] uppercase tracking-[0.25em] text-black hover:bg-black hover:text-white transition-all duration-200"
                  >
                    [ Load Full Opinion ]
                  </button>
                ) : (
                  <p className="font-mono text-[10px] text-black/30 text-center uppercase tracking-widest">
                    [ Full opinion — Supabase integration pending ]
                  </p>
                )}
              </div>
            </Frame>

          </FilmStrip>
        </section>

        {/* ROLL-C : COMIC */}
        <section className="w-full lg:w-[26%] py-6 px-4">
          <FilmStrip rollId="Roll-C : The Far Side">

            <Frame num="01">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-black border-b border-black/15 pb-2 mb-4">
                The Far Side
              </h2>
              <div
                className="w-full border border-black/20 flex flex-col justify-center items-center p-6 bg-black/[0.02] cursor-pointer hover:bg-black/5 transition-colors group"
                style={{ aspectRatio: '1/1' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"
                  strokeLinecap="square"
                  className="w-12 h-12 mb-3 text-black/20 group-hover:text-black/50 transition-colors">
                  <rect x="3" y="3" width="18" height="18" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p className="font-mono text-[9px] uppercase tracking-widest text-black/30">
                  [ Awaiting Scan ]
                </p>
              </div>
              <p className="font-serif italic text-[15px] text-black/60 mt-5 text-center leading-relaxed">
                &ldquo;We&apos;ve updated our privacy policy, changed our terms of service, and eaten your family.&rdquo;
              </p>
            </Frame>

            <Frame num="02">
              <p className="font-mono text-[10px] text-black/30 uppercase tracking-widest mb-3">System Notes</p>
              <p className="font-mono text-[11px] text-black/50 leading-relaxed">
                Three-roll master control layout.<br /><br />
                Roll-A: Live news index.<br />
                Roll-B: Featured case law opinion.<br />
                Roll-C: Editorial comic.<br /><br />
                Supabase integration scheduled for Phase 3. Shopify merch store in Phase 4.
              </p>
            </Frame>

          </FilmStrip>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t-2 border-black mt-0 py-3 px-6 flex items-center justify-between bg-black/3">
        <span className="font-mono text-[10px] text-black/30 uppercase tracking-widest">
          The Atlanta Gleaner © 2026
        </span>
        <span className="font-mono text-[10px] text-black/30 uppercase tracking-widest">
          ■ End of Reel
        </span>
      </footer>

    </div>
  )
}
