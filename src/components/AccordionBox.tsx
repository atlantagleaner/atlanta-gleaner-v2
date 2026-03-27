'use client'

// ─────────────────────────────────────────────────────────────────────────────
// AccordionBox — reusable accordion-style box for the archive page.
// Each box represents one Volume; months are collapsible rows; articles
// expand inside each month.
//
// Architecture: uses BOX_SHELL, BOX_HEADER, ITEM_RULE, and T from tokens.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import Link from 'next/link'
import { PALETTE, FONT, T, BOX_SHELL, BOX_HEADER, ITEM_RULE } from '@/src/styles/tokens'
import type { Volume, MonthArchive, Article } from '@/src/data/archive'

// ── Article card inside an open month ────────────────────────────────────────
function ArticleCard({ article, last }: { article: Article; last: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{
      paddingBottom: last ? 0 : '20px',
      marginBottom:  last ? 0 : '20px',
      borderBottom:  last ? 'none' : '1px solid rgba(0,0,0,0.07)',
    }}>
      {/* Date — T.micro */}
      <p style={{ ...T.micro, color: PALETTE.black, margin: '0 0 6px 0' }}>
        {article.date}
      </p>

      {/* Case title — T.body link, inverts on hover (matches news box) */}
      <Link href={article.url} style={{ textDecoration: 'none', display: 'block', marginBottom: '8px' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span style={{
          ...T.body,
          color:           hovered ? PALETTE.white : PALETTE.black,
          backgroundColor: hovered ? PALETTE.black : 'transparent',
          padding:         hovered ? '2px 4px' : '2px 0',
          transition:      'all 0.1s',
          display:         'inline',
        }}>
          {article.title}
        </span>
      </Link>

      {/* Citation — T.micro, relaxed tracking, pre-wrap for multi-line */}
      <p style={{
        ...T.micro,
        fontWeight:   500,
        textTransform: 'none',
        letterSpacing: '0.04em',
        lineHeight:    1.6,
        color:         PALETTE.black,
        margin:        '0 0 6px 0',
        whiteSpace:    'pre-wrap',
      }}>
        {article.citation}
      </p>

      {/* Tags — T.micro italic */}
      <p style={{
        ...T.micro,
        fontStyle:  'italic',
        color:      PALETTE.black,
        opacity:    0.65,
        margin:     0,
        lineHeight: 1.5,
      }}>
        {article.tags}
      </p>
    </div>
  )
}

// ── Month row — the collapsible accordion unit ────────────────────────────────
function MonthRow({ month, forceOpen }: { month: MonthArchive; forceOpen: boolean }) {
  const [open, setOpen] = useState(false)
  const expanded = forceOpen || open

  return (
    <div style={ITEM_RULE}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width:           '100%',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          padding:         '11px 14px',
          background:      'none',
          border:          'none',
          cursor:          'pointer',
          textAlign:       'left',
          transition:      'background 0.1s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = PALETTE.warm }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
      >
        {/* Month label — FONT.serif, display weight */}
        <span style={{
          ...FONT.serif,
          fontSize:      '17px',
          fontWeight:    600,
          color:         PALETTE.black,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {month.monthYear}
        </span>

        {/* Toggle indicator — T.micro */}
        <span style={{ ...T.micro, color: PALETTE.black, flexShrink: 0, marginLeft: '12px' }}>
          {expanded ? '[ − ]' : '[ + ]'}
        </span>
      </button>

      {/* Accordion body — CSS grid-template-rows animation (no JS height calc) */}
      <div style={{
        display:             'grid',
        gridTemplateRows:    expanded ? '1fr' : '0fr',
        transition:          'grid-template-rows 0.26s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ padding: '6px 14px 18px' }}>
            {month.articles.length > 0 ? (
              month.articles.map((article, i) => (
                <ArticleCard
                  key={i}
                  article={article}
                  last={i === month.articles.length - 1}
                />
              ))
            ) : (
              <p style={{ ...T.micro, color: PALETTE.black, opacity: 0.4, margin: 0 }}>
                [ No entries this month ]
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AccordionBox — the full volume box ────────────────────────────────────────
interface AccordionBoxProps {
  volume:     Volume
  searchTerm: string
}

export function AccordionBox({ volume, searchTerm }: AccordionBoxProps) {
  const isSearching = searchTerm.length > 0

  return (
    <div style={{ ...BOX_SHELL, height: 'auto' }}>
      {/* Volume header — BOX_HEADER */}
      <h2 style={{ ...BOX_HEADER, padding: '8px 14px', margin: 0 }}>
        {volume.title} · Archive Log
      </h2>

      {/* Month rows */}
      <div>
        {volume.months.map(month => (
          <MonthRow
            key={month.monthYear}
            month={month}
            forceOpen={isSearching}
          />
        ))}
      </div>
    </div>
  )
}
