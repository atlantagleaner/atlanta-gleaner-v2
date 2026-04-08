'use client'

import { useEffect, useState } from 'react'
import { Banner } from '@/src/components/Banner'
import { useMobileDetect } from '@/src/hooks'
import {
  T, PALETTE, SPACING, ANIMATION,
  PAGE_MAX_W, PAGE_TITLE_BLOCK,
  BOX_SHELL, BOX_HEADER, BOX_PADDING, PAGE_BOTTOM_PADDING_DESKTOP, PAGE_BOTTOM_PADDING_MOBILE,
} from '@/src/styles/tokens'

const PORTRAIT_SRC = '/george-washington-athenaeum-portrait.png'

function PortraitModule() {
  const isMobile = useMobileDetect(960)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    setOpen(!isMobile)
  }, [isMobile])

  return (
    <div 
      className="portrait-module" 
      style={{ 
        ...BOX_SHELL, 
        overflow: 'hidden',
        width: isMobile ? 'min(100%, 260px)' : 'min(100%, 320px)',
        margin: '0 auto'
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label={open ? 'Collapse portrait' : 'Expand portrait'}
        style={{
          width: '100%',
          background: PALETTE.black,
          border: 'none',
          padding: `${SPACING.md} ${SPACING.lg}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ ...T.label, color: PALETTE.white, lineHeight: 1 }}>
          George Washington
        </span>
        <span
          style={{
            ...T.label,
            color: PALETTE.white,
            transition: `transform ${ANIMATION.base} ${ANIMATION.ease}`,
            display: 'inline-block',
            transform: open ? 'rotate(90deg)' : 'rotate(0)',
          }}
        >
          ▶
        </span>
      </button>

      <div
        style={{
          overflow: 'hidden',
          maxHeight: open ? '9999px' : '0',
          transition: `max-height ${ANIMATION.base} ${ANIMATION.ease}`,
          background: PALETTE.white,
        }}
      >
        <div 
          className="portrait-body"
          style={{
            aspectRatio: '1 / 1',
            width: '100%',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PORTRAIT_SRC}
            alt="George Washington portrait"
            className="about-portrait-image"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function AboutPage() {
  return (
    <main className="about-page">
      <style>{`
        @media (max-width: 767px) {
          .about-page {
            padding-bottom: ${PAGE_BOTTOM_PADDING_MOBILE};
          }
        }
        @media (min-width: 768px) {
          .about-page {
            padding-bottom: ${PAGE_BOTTOM_PADDING_DESKTOP};
          }
        }
      `}</style>
      <Banner />

      <div style={{ maxWidth: PAGE_MAX_W, margin: '0 auto', padding: `0 ${SPACING.lg}` }}>
        <div style={{ ...PAGE_TITLE_BLOCK, marginTop: 0 }}>
          <h1 style={{ ...T.pageTitle, paddingTop: SPACING.xl, color: PALETTE.black, margin: 0 }}>
            About
          </h1>
        </div>
      </div>

      <div className="about-grid">
        <div className="about-portrait">
          <PortraitModule />
        </div>

        <div className="about-copy">
          <div style={{ ...BOX_SHELL }}>
            <div style={{ padding: BOX_PADDING }}>
              <h2 style={{ ...BOX_HEADER, color: PALETTE.black }}>The Atlanta Gleaner</h2>
              <p style={{ ...T.prose, color: PALETTE.black, margin: 0 }}>
                <em>The Atlanta Gleaner</em> is an academic journal covering legal and political
                developments across the state and recent notable developments in Georgia case law.
              </p>
            </div>
          </div>

          <div style={{ ...BOX_SHELL }}>
            <div style={{ padding: BOX_PADDING }}>
              <h2 style={{ ...BOX_HEADER, color: PALETTE.black }}>The Editor</h2>
              <p style={{ ...T.prose, color: PALETTE.black, margin: `0 0 ${SPACING.lg}` }}>
                George Washington (1732-Present) served as Commander-in-Chief of the Continental Army
                during the American Revolutionary War and as the first President of the United States.
                His military career, spanning three decades, was distinguished by strategic tenacity
                under conditions of immense disadvantage.
              </p>
              <p style={{ ...T.prose, color: PALETTE.black, margin: `0 0 ${SPACING.lg}` }}>
                His surprise crossing of the Delaware River on the night of December 25, 1776, and
                the engagements at Trenton and Princeton that followed, reversed the momentum of a
                failing campaign and secured the survival of the Continental cause through the winter
                of 1776-77. His direction of the Siege of Yorktown in 1781, conducted in
                coordination with French forces under the Comte de Rochambeau, compelled the
                surrender of Cornwallis and effectively concluded the war.
              </p>
              <p style={{ ...T.prose, color: PALETTE.black, margin: 0 }}>
                Washington served two presidential terms, declining a third, and retired from public
                life in 1797. He later established residence in Atlanta, Georgia and founded <em>The Atlanta Gleaner</em>.
              </p>
            </div>
          </div>
        </div>

        <p className="about-legal">
          Case opinions republished on this site are public records. Summaries and editorial
          commentary are original work. Comic panels are republished for editorial and archival
          purposes. This site is not affiliated with any court, law firm, or government body.
        </p>
      </div>

      <style jsx>{`
        .about-page {
          min-height: 100vh;
          background: ${PALETTE.warm};
        }

        .about-grid {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 ${SPACING.xl};
          display: grid;
          grid-template-columns: minmax(260px, 320px) minmax(0, 680px);
          column-gap: ${SPACING.xl};
          row-gap: ${SPACING.lg};
          align-items: start;
        }

        .about-portrait {
          grid-column: 1;
          grid-row: 1;
          width: 100%;
          align-self: center;
        }

        .portrait-module {
          width: min(100%, 320px);
          margin: 0 auto;
        }

        .portrait-body {
          aspect-ratio: 1 / 1;
          width: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }

        .about-copy {
          grid-column: 2;
          grid-row: 1;
          display: flex;
          flex-direction: column;
          gap: ${SPACING.xl};
        }

        .about-legal {
          grid-column: 2;
          grid-row: 2;
          margin: ${SPACING.md} 0 0;
          color: ${PALETTE.black};
          opacity: 0.35;
          line-height: 1.6;
          max-width: 680px;
          font-size: 10px;
          font-family: 'IBM Plex Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        @media (max-width: 960px) {
          .about-grid {
            grid-template-columns: 1fr;
            max-width: 680px;
          }

          .about-portrait {
            grid-column: 1;
            grid-row: 1;
            margin-bottom: ${SPACING.sm};
          }

          .about-copy {
            grid-column: 1;
            grid-row: 2;
          }

          .about-legal {
            grid-column: 1;
            grid-row: 3;
          }

          .about-portrait-image {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
            object-position: center;
          }

          .portrait-module {
            width: min(100%, 260px);
          }
        }

        .about-portrait-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
        }
      `}</style>
    </main>
  )
}
