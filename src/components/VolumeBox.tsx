'use client'

// ─────────────────────────────────────────────────────────────────────────────
// VolumeBox — Archive volume panel: collapsible shell, resizable height, months
// with nested articles.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import Link from 'next/link'
import { PALETTE, FONT, T, BOX_SHELL, BOX_HEADER, ITEM_RULE } from '@/src/styles/tokens'
import type { Volume, MonthArchive, Article } from '@/src/data/archive'

function ArticleCard({ article, last }: { article: Article; last: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{
      paddingBottom: last ? 0 : '20px',
      marginBottom:  last ? 0 : '20px',
      borderBottom:  last ? 'none' : '1px solid rgba(0,0,0,0.07)',
    }}>
      <p style={{ ...T.micro, color: PALETTE.black, margin: '0 0 6px 0' }}>
        {article.date}
      </p>
      <Link
        href={article.url}
        style={{ textDecoration: 'none', display: 'block', marginBottom: '8px' }}
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
      <p style={{
        ...T.micro,
        fontWeight:    500,
        textTransform: 'none',
        letterSpacing: '0.04em',
        lineHeight:    1.6,
        color:         PALETTE.black,
        margin:        '0 0 6px 0',
        whiteSpace:    'pre-wrap',
      }}>
        {article.citation}
      </p>
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

function MonthRow({ month, forceOpen }: { month: MonthArchive; forceOpen: boolean }) {
  const [open, setOpen] = useState(false)
  const expanded = forceOpen || open

  if (month.articles.length === 0 && !forceOpen) return null

  return (
    <div style={{ ...ITEM_RULE }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width:          '100%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '11px 14px',
          background:     'none',
          border:         'none',
          cursor:         'pointer',
          textAlign:      'left',
          transition:     'background 0.1s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = PALETTE.warm }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
      >
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
        <span style={{ ...T.micro, color: PALETTE.black, flexShrink: 0, marginLeft: '12px' }}>
          {month.articles.length > 0 ? `${month.articles.length} ` : ''}
          {expanded ? '[ - ]' : '[ + ]'}
        </span>
      </button>
      <div style={{
        display:          'grid',
        gridTemplateRows: expanded ? '1fr' : '0fr',
        transition:       'grid-template-rows 0.26s cubic-bezier(0.4,0,0.2,1)',
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

interface VolumeBoxProps {
  volume:     Volume
  searchTerm: string
}

export function VolumeBox({ volume, searchTerm }: VolumeBoxProps) {
  const [expanded, setExpanded] = useState(true)
  const isSearching = searchTerm.length > 0

  return (
    <div
      style={{
        ...BOX_SHELL,
        resize:   'vertical',
        overflow: 'hidden',
        minHeight: expanded ? '200px' : undefined,
      }}
      draggable={true}
    >
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        style={{
          ...BOX_HEADER,
          padding:       '8px 14px',
          margin:        0,
          width:         '100%',
          display:       'flex',
          alignItems:    'center',
          justifyContent: 'space-between',
          gap:           '12px',
          background:    'none',
          border:        'none',
          borderBottom:  BOX_HEADER.borderBottom,
          cursor:        'pointer',
          textAlign:     'left',
          flexShrink:    0,
        }}
      >
        <span style={{ flex: 1, minWidth: 0 }}>
          {volume.title} · Archive Log
        </span>
        <span style={{ ...T.micro, color: PALETTE.black, flexShrink: 0 }}>
          {expanded ? '[ − ]' : '[ + ]'}
        </span>
      </button>

      <div
        style={{
          flex:       1,
          minHeight:  0,
          overflowY:  expanded ? 'auto' : 'hidden',
          display:    expanded ? 'flex' : 'none',
          flexDirection: 'column',
        }}
      >
        {volume.months.map(month => (
          <MonthRow
            key={month.monthYear}
            month={month}
            forceOpen={isSearching && month.articles.length > 0}
          />
        ))}
      </div>
    </div>
  )
}
