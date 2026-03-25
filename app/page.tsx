'use client'

import { useState } from 'react'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────

type NewsItemProps = { title: string; source: string; link: string }
type MetadataRowProps = { label: string; value: string; isAlert?: boolean }

// ─── Data ─────────────────────────────────────────────────────────────────────

const NEWS_ITEMS: NewsItemProps[] = [
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
    <li className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
      <a
        href={link}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="block group"
      >
        <p
          className="font-sans text-sm leading-snug font-medium transition-all duration-150"
          style={{
            color: hovered ? '#000' : '#F5F5F5',
            backgroundColor: hovered ? '#F5F5F5' : 'transparent',
            padding: hovered ? '2px 4px' : '2px 4px',
            textShadow: hovered ? 'none' : '0 0 8px rgba(245,245,245,0.3)',
          }}
        >
          {title}
        </p>
        <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest mt-1 pl-1">
          {source}
        </p>
      </a>
    </li>
  )
}

function MetadataRow({ label, value, isAlert = false }: MetadataRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 border-b border-white/10 last:border-0 gap-1">
      <span className="font-mono text-[10px] font-bold text-white/50 uppercase tracking-widest sm:w-36 shrink-0">
        {label}:
      </span>
      <span
        className={`font-sans text-sm ${isAlert ? 'text-yellow-300 font-bold' : 'text-white/80'}`}
        style={isAlert ? { textShadow: '0 0 8px rgba(253,224,71,0.5)' } : {}}
      >
        {value}
      </span>
    </div>
  )
}

function ModuleHeader({ label, index }: { label: string; index: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-6">
      <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-white/90 font-bold glow">
        {label}
      </h2>
      <span className="font-mono text-[10px] text-white/30 tracking-widest">{index}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [imgSrc, setImgSrc] = useState('/washington.png')
  const [opinion, setOpinion] = useState(false)
  const [negative, setNegative] = useState(false)

  return (
    <div
      className="min-h-screen w-full pb-24"
      style={{
        background: negative ? '#F5F5F5' : '#000',
        color: negative ? '#000' : '#F5F5F5',
        transition: 'background 0.4s, color 0.4s',
      }}
    >
      {/* ── BANNER ── */}
      <header className="flex flex-col items-center justify-center pt-16 pb-10 px-4 relative z-10 border-b border-white/10">

        {/* Negative toggle */}
        <button
          onClick={() => setNegative(n => !n)}
          className="absolute top-6 right-6 font-mono text-[10px] uppercase tracking-widest border px-3 py-1 transition-all duration-300"
          style={{
            borderColor: negative ? 'rgba(0,0,0,0.3)' : 'rgba(245,245,245,0.3)',
            color: negative ? '#000' : '#F5F5F5',
            backgroundColor: 'transparent',
          }}
          title="Toggle negative/positive film"
        >
          ⬛ {negative ? 'POSITIVE' : 'NEGATIVE'}
        </button>

        <p
          className="font-mono text-[10px] uppercase tracking-[0.35em] mb-6 opacity-40"
          style={{ textShadow: negative ? 'none' : '0 0 6px rgba(245,245,245,0.4)' }}
        >
          Microfiche Reader — Unit 01
        </p>

        <h1
          className="font-serif font-bold text-center leading-none mb-4"
          style={{
            fontSize: 'clamp(3rem, 8vw, 7rem)',
            letterSpacing: '-0.03em',
            textShadow: negative ? 'none' : '0 0 20px rgba(245,245,245,0.25), 0 0 4px rgba(245,245,245,0.5)',
          }}
        >
          The Atlanta Gleaner.
        </h1>

        <p
          className="font-mono text-xs uppercase tracking-[0.25em] mb-1 opacity-70"
          style={{ textShadow: negative ? 'none' : '0 0 6px rgba(245,245,245,0.3)' }}
        >
          Georgia Case Law Updates &amp; Legal News
        </p>
        <p className="font-mono text-[10px] uppercase tracking-widest opacity-40 mb-8">
          Edited By George Washington
        </p>

        <div
          className="overflow-hidden"
          style={{ width: '140px', height: '170px', mixBlendMode: negative ? 'multiply' : 'screen', opacity: 0.85 }}
        >
          <Image
            src={imgSrc}
            onError={() => setImgSrc('https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/George_Washington_Statue_Federal_Hall_NYC.jpg/400px-George_Washington_Statue_Federal_Hall_NYC.jpg')}
            alt="George Washington Statue"
            width={140}
            height={170}
            className="w-full h-full object-cover object-top"
            style={{ filter: 'grayscale(100%) contrast(200%) brightness(1.3)' }}
          />
        </div>
      </header>

      {/* ── MASTER CONTROL ── */}
      <main className="flex flex-col lg:flex-row gap-0 max-w-[1600px] mx-auto w-full relative z-10">

        {/* ── NEWS BOX ── */}
        <aside className="w-full lg:w-1/4 border-r border-white/10 p-6 lg:p-8">
          <ModuleHeader label="Roll-A : News Index" index="IDX-01" />
          <ul className="flex flex-col gap-5">
            {NEWS_ITEMS.map((item, i) => (
              <NewsItem key={i} {...item} />
            ))}
          </ul>
        </aside>

        {/* ── OPINION BOX ── */}
        <article className="w-full lg:w-2/4 border-r border-white/10 p-6 lg:p-10">
          <ModuleHeader label="Roll-B : Case Law" index="DOC-A25A1973" />

          <h3
            className="font-serif font-bold leading-tight mb-8"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              textShadow: negative ? 'none' : '0 0 15px rgba(245,245,245,0.2)',
            }}
          >
            Int&apos;l Bhd. of Police Officers Local 623, Inc. v. Brosnan
          </h3>

          {/* Metadata block */}
          <div className="mb-8 p-5 border border-white/10 bg-white/[0.03]">
            <MetadataRow label="Court" value="Court of Appeals of Georgia, Third Division" />
            <MetadataRow label="Date Decided" value="February 17, 2026" />
            <MetadataRow label="Docket No" value="A25A1973" />
            <MetadataRow label="Citations" value="2026 Ga. App. LEXIS 92* | 2026 LX 47281 | 2026 WL 440637" />
            <MetadataRow label="Judges" value="DOYLE, P.J. Markle and Padgett, JJ., concur." />
            <MetadataRow label="Disposition" value="Judgment affirmed." />
            <MetadataRow label="Notice" value="THIS OPINION IS UNCORRECTED AND SUBJECT TO REVISION." isAlert />
          </div>

          {/* Core terms */}
          <div className="mb-7 font-sans text-sm text-white/60">
            <span className="font-mono text-[10px] font-bold text-white/40 uppercase tracking-widest mr-2 bg-white/5 px-1.5 py-0.5">
              Core Terms:
            </span>
            breach of contract, legal representation, summary judgment, police officer union, consideration, damages, reimbursement, promissory estoppel
          </div>

          {/* Case Summary */}
          <div className="mb-8 font-sans text-base leading-relaxed text-white/75 border-t border-white/10 pt-7">
            <span className="font-mono text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-4">
              ▶ Case Summary
            </span>
            <p className="mb-4">
              In 2020, Atlanta Police Officer Devin Brosnan was involved in the shooting of Rayshard Brooks
              and immediately requested a Union attorney, relying on recruitment materials promising 24/7 legal
              representation for critical incidents. When the Union failed to provide counsel prior to his arrest,
              Brosnan hired a private defense firm for $250,000 and sued the Union for breach of contract.
            </p>
            <p
              className="font-semibold border-l-2 border-white/50 pl-4 py-2 my-5 text-white"
              style={{ textShadow: negative ? 'none' : '0 0 8px rgba(245,245,245,0.2)' }}
            >
              The Georgia Court of Appeals affirmed partial summary judgment in favor of Brosnan, holding that
              the Union's documents and subsequent verbal assurances created an enforceable contract that the Union breached.
            </p>
            <p>
              The Court further concluded that whether a $100,000 retainer paid by Brosnan&apos;s father constitutes
              a repayable debt supported by consideration remains a question of fact for a jury to resolve.
            </p>
          </div>

          {/* Opinion excerpt */}
          <div className="border-t border-white/10 pt-7">
            <span className="font-mono text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-5">
              ▶ Opinion — DOYLE, Presiding Judge.
            </span>
            <div className="font-sans text-base leading-relaxed text-white/75">
              <p className="mb-4">
                Devin Brosnan filed suit against the International Brotherhood of Police Officers, Local 623, Inc.,
                (&ldquo;the Union&rdquo;) alleging that it breached an agreement to provide legal representation to him
                and seeking reimbursement for private representation.{' '}
                <strong className="text-white" style={{ textShadow: negative ? 'none' : '0 0 8px rgba(245,245,245,0.3)' }}>
                  The parties filed cross-motions for summary judgment, and the trial granted partial summary judgment
                  in favor of Brosnan, finding the Union breached an enforceable contract to provide representation
                  and leaving the issue of damages for determination by a jury.
                </strong>{' '}
                The Union now appeals, and we affirm for the reasons that follow.
              </p>
              <p className="text-white/60 italic font-serif text-lg mb-6">
                &ldquo;Summary judgment is proper when there is no genuine issue of material fact and the movant is
                entitled to judgment as a matter of law. We review the grant or denial of summary judgment de novo,
                construing the evidence in favor of the nonmovant.&rdquo;{' '}
                <span className="not-italic font-sans text-sm">
                  On Line, Inc. v. Wrightsboro Walk, LLC, 332 Ga. App. 777 (2015).
                </span>
              </p>
            </div>

            {!opinion ? (
              <button
                onClick={() => setOpinion(true)}
                className="w-full py-4 border border-white/20 font-mono text-xs uppercase tracking-[0.25em] text-white/60 hover:text-white hover:border-white/60 hover:bg-white/5 transition-all duration-300"
              >
                [ Load Full Opinion ]
              </button>
            ) : (
              <div className="font-sans text-base text-white/70 leading-relaxed border-t border-white/10 pt-6 mt-4">
                <p className="italic text-white/40 font-mono text-xs text-center">[ Full opinion text would be loaded from Supabase ]</p>
              </div>
            )}
          </div>
        </article>

        {/* ── COMIC BOX ── */}
        <aside className="w-full lg:w-1/4 p-6 lg:p-8">
          <ModuleHeader label="Roll-C : The Far Side" index="IMG-01" />

          <div
            className="w-full border border-white/10 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-white/5 transition-colors group"
            style={{ aspectRatio: '1/1' }}
          >
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"
              strokeLinecap="square"
              className="w-16 h-16 mb-4 text-white/20 group-hover:text-white/50 transition-colors"
            >
              <rect x="3" y="3" width="18" height="18" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors">
              [ Awaiting Scan ]
            </p>
          </div>

          <p className="font-serif italic text-sm text-white/50 mt-6 text-center leading-relaxed">
            &ldquo;We&apos;ve updated our privacy policy, changed our terms of service, and eaten your family.&rdquo;
          </p>

          {/* Future: negative toggle legend */}
          <div className="mt-10 border-t border-white/10 pt-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/20 mb-3">System</p>
            <p className="font-mono text-[10px] text-white/30 leading-relaxed">
              ⬛ Toggle in header switches between Negative and Positive film modes.<br /><br />
              Future: Supabase integration for live case law. Shopify store for merch.
            </p>
          </div>
        </aside>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 mt-12 py-6 px-8 flex items-center justify-between">
        <span className="font-mono text-[10px] text-white/20 uppercase tracking-widest">
          The Atlanta Gleaner © 2026
        </span>
        <span className="font-mono text-[10px] text-white/20 uppercase tracking-widest">
          End Roll — Unit 01
        </span>
      </footer>
    </div>
  )
}
