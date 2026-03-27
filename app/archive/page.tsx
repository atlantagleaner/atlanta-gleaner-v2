'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Archive — searchable, accordion index of all published volumes.
// Layout: Banner · page title · search bar · [2-col volume grid | sticky Twitter]
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { Banner }       from '@/src/components/Banner'
import { AccordionBox } from '@/src/components/AccordionBox'
import { TwitterBox }   from '@/src/components/TwitterBox'
import { ARCHIVE_DATA } from '@/src/data/archive'
import { PALETTE, T, PAGE_MAX_W, PAGE_TITLE_BLOCK } from '@/src/styles/tokens'

export default function ArchivePage() {
  const [searchTerm,   setSearchTerm]   = useState('')
  const [inputFocused, setInputFocused] = useState(false)

  const filteredData = searchTerm
    ? ARCHIVE_DATA
        .map(volume => ({
          ...volume,
          months: volume.months
            .map(month => ({
              ...month,
              articles: month.articles.filter(article =>
                [article.title, article.citation, article.tags, month.monthYear]
                  .join(' ')
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
              ),
            }))
            .filter(month => month.articles.length > 0),
        }))
        .filter(volume => volume.months.length > 0)
    : ARCHIVE_DATA

  const resultCount = filteredData.reduce(
    (sum, vol) => sum + vol.months.reduce((s, m) => s + m.articles.length, 0),
    0
  )

  return (
    <>
      <Banner />

      <main style={{ padding: '0 20px 80px', maxWidth: PAGE_MAX_W, margin: '0 auto' }}>

        {/* Page title */}
        <div style={PAGE_TITLE_BLOCK}>
          <h1 style={{ ...T.pageTitle, color: PALETTE.black, margin: 0 }}>
            Archive
          </h1>
        </div>

        {/* Search bar */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display:    'flex',
            alignItems: 'center',
            border:     `1px solid ${inputFocused ? PALETTE.black : 'rgba(0,0,0,0.18)'}`,
            background: PALETTE.white,
            padding:    '10px 14px',
            maxWidth:   '480px',
            transition: 'border-color 0.15s',
          }}>
            <span style={{ ...T.micro, color: PALETTE.black, opacity: 0.45, marginRight: '10px', flexShrink: 0 }}>
              SEARCH▸
            </span>
            <input
              type="text"
              placeholder="case name, citation, tags..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={{
                ...T.nav,
                flex:       1,
                border:     'none',
                outline:    'none',
                background: 'transparent',
                color:      PALETTE.black,
                fontSize:   '10px',
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'none',
                  border:     'none',
                  cursor:     'pointer',
                  color:      PALETTE.black,
                  opacity:    0.45,
                  fontSize:   '16px',
                  padding:    '0 0 0 8px',
                  lineHeight: 1,
                }}
              >
                x
              </button>
            )}
          </div>
          {searchTerm && (
            <p style={{
              ...T.micro,
              color:       PALETTE.black,
              opacity:     0.5,
              margin:      '6px 0 0',
              paddingLeft: '2px',
            }}>
              {resultCount} result{resultCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Main grid: 2-col accordions + sticky Twitter */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr 300px',
          gap:                 '20px',
          alignItems:          'start',
        }}>
          {/* Volume accordions */}
          <div style={{
            gridColumn:          '1 / 3',
            display:             'grid',
            gridTemplateColumns: '1fr 1fr',
            gap:                 '20px',
            alignItems:          'start',
          }}>
            {filteredData.length > 0 ? (
              filteredData.map(volume => (
                <AccordionBox
                  key={volume.id}
                  volume={volume}
                  searchTerm={searchTerm}
                />
              ))
            ) : (
              <p style={{
                ...T.micro,
                color:      PALETTE.black,
                opacity:    0.45,
                gridColumn: '1 / -1',
                padding:    '40px 0',
                textAlign:  'center',
              }}>
                No results for &ldquo;{searchTerm}&rdquo;
              </p>
            )}
          </div>

          {/* Sticky Twitter feed */}
          <div style={{ position: 'sticky', top: '20px' }}>
            <TwitterBox />
          </div>
        </div>

      </main>
    </>
  )
}
