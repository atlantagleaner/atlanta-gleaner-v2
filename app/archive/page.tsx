'use client'
// ─────────────────────────────────────────────────────────────────────────────
// app/archive/page.tsx — Atlanta Gleaner Case Law Archive
//
// Four volume boxes, each an accordion. Inside each volume, months are
// sub-accordions. Cases are listed under their month.
//
//   Volume I   · 2022–2023
//   Volume II  · 2024
//   Volume III · 2025
//   Volume IV  · 2026 and beyond
//
// Aesthetic: IBM Plex Mono labels, warm off-white background, black borders,
// minimal — consistent with the rest of the Gleaner design system.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useDeferredValue, useMemo, useState } from 'react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import Fuse from 'fuse.js'
import { Banner } from '@/src/components/Banner'
import { SearchInput } from '@/src/components/common/SearchInput'
import {
  PALETTE, PALETTE_CSS, FONT, T, BOX_SHELL, BOX_HEADER,
  BOX_PADDING, ITEM_RULE, SPACING, SIZE_SM, SIZE_MD,
  PAGE_TITLE_BLOCK, PAGE_MAX_W, ANIMATION,
} from '@/src/styles/tokens'
import { CASES } from '@/src/data/cases'
import type { CaseLaw } from '@/src/data/types'

// ── Volume definitions ────────────────────────────────────────────────────────

const VOLUMES = [
  { number: 'IV',  label: 'Volume IV',  years: [2026, 2027, 2028, 2029, 2030], roman: 'IV' },
  { number: 'III', label: 'Volume III', years: [2025],       roman: 'III' },
  { number: 'II',  label: 'Volume II',  years: [2024],       roman: 'II'  },
  { number: 'I',   label: 'Volume I',   years: [2022, 2023], roman: 'I'   },
]

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getYear(dateStr: string): number | null {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d.getFullYear()
}

function getMonth(dateStr: string): number | null {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d.getMonth() // 0-indexed
}

function getArchiveDate(c: Pick<CaseLaw, 'dateDecided' | 'decision_date_iso'>): string {
  return c.decision_date_iso || c.dateDecided
}

function getArchiveDecisionDate(
  c: Pick<CaseLaw, 'dateDecided' | 'decision_date_iso' | 'publishedAt'>
): string {
  if (c.dateDecided && c.dateDecided.trim()) return c.dateDecided

  if (c.decision_date_iso) {
    const parsed = new Date(c.decision_date_iso)
    if (!isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(parsed)
    }
  }

  if (c.publishedAt) {
    const parsed = new Date(c.publishedAt)
    if (!isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(parsed)
    }
  }

  return ''
}

function yearLabel(years: number[]): string {
  if (years.length === 1) return String(years[0])
  return `${years[0]}–${years[years.length - 1]}`
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const volumeShell: CSSProperties = {
  ...BOX_SHELL,
  marginBottom: SPACING.xl,
  overflow:     'hidden',
}

const volumeToggle: CSSProperties = {
  width:          '100%',
  background:     PALETTE.black,
  border:         'none',
  padding:        `${SPACING.lg} ${SPACING.lg}`,
  display:        'flex',
  justifyContent: 'space-between',
  alignItems:     'center',
  cursor:         'pointer',
  textAlign:      'left',
}

const monthToggle: CSSProperties = {
  width:          '100%',
  background:     PALETTE.white,
  border:         'none',
  padding:        `${SPACING.md} ${SPACING.lg}`,
  display:        'flex',
  justifyContent: 'space-between',
  alignItems:     'center',
  cursor:         'pointer',
  textAlign:      'left',
  ...ITEM_RULE,
}

// caseLink styling is handled by .case-archive-link CSS class in globals.css

// ── Month sub-accordion ───────────────────────────────────────────────────────

function MonthShelf({
  month, year, monthCases, forceOpen = false,
}: {
  month:      string
  year:       number
  monthCases: CaseLaw[]
  forceOpen?: boolean
}) {
  const [open, setOpen] = useState(false)
  const isOpen = forceOpen || open

  return (
    <div>
      <button
        onClick={() => {
          if (!forceOpen) setOpen(v => !v)
        }}
        style={monthToggle}
        aria-expanded={isOpen}
      >
        <span style={{
          ...T.micro,
          color:         isOpen ? PALETTE.black : PALETTE_CSS.meta,
        }}>
          {month} {year}
          <span style={{
            marginLeft:    SPACING.sm,
            ...FONT.mono,
            fontSize:      SIZE_SM,
            fontWeight:    400,
            letterSpacing: '0.10em',
            color:         PALETTE_CSS.muted,
          }}>
            — {monthCases.length} {monthCases.length === 1 ? 'case' : 'cases'}
          </span>
        </span>
        <span style={{
          ...FONT.mono,
          fontSize:   SIZE_SM,
          color:      PALETTE_CSS.muted,
          transition: `transform ${ANIMATION.fast} ${ANIMATION.ease}`,
          display:    'inline-block',
          transform:  isOpen ? 'rotate(90deg)' : 'rotate(0)',
        }}>
          ▶
        </span>
      </button>

      {isOpen && (
        <div style={{ background: PALETTE.white }}>
          {monthCases.map((c) => (
              <Link
                key={c.slug}
                href={`/cases/${c.slug}#case-law-box`}
                className="case-archive-link"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) 280px',
                  columnGap: SPACING.md,
                  alignItems: 'start',
                }}
              >
                <div style={{ display: 'contents' }}>
                  <div className="case-archive-title" style={{
                    ...T.body,
                    minWidth: 0,
                    marginBottom: 0,
                    gridColumn: '1',
                    gridRow: '1',
                  }}>
                    {c.title}
                  </div>
                  {c.tags && c.tags.length > 0 && (
                    <div style={{
                    minWidth: 0,
                    maxWidth: '280px',
                    gridColumn: '2',
                    gridRow: '1 / span 3',
                    alignSelf: 'stretch',
                  }}>
                      <div className="case-archive-tags" style={{
                        ...T.micro,
                        textAlign: 'right',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        lineHeight: 1.45,
                        overflow: 'hidden',
                        overflowWrap: 'anywhere',
                        paddingLeft: SPACING.md,
                        borderLeft: `1px solid ${PALETTE_CSS.border}`,
                      }}>
                        {c.tags.join(' · ')}
                      </div>
                    </div>
                  )}
                </div>
                  <div className="case-archive-meta" style={{
                    ...T.micro,
                    fontWeight:    400,
                    letterSpacing: '0.10em',
                    marginTop:     0,
                    gridColumn:    '1',
                    gridRow:       '2',
                  }}>
                    {c.court}
                  </div>
                  <div className="case-archive-meta" style={{
                    ...T.micro,
                    fontWeight:    400,
                    letterSpacing: '0.10em',
                    marginTop:     0,
                    gridColumn:    '1',
                    gridRow:       '3',
                  }}>
                    {[c.docketNumber, getArchiveDecisionDate(c)].filter(Boolean).join(' · ')}
                  </div>
              </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Volume accordion ──────────────────────────────────────────────────────────

function VolumeBox({
  volume,
  allCases,
  defaultOpen,
  forceOpen = false,
}: {
  volume:      typeof VOLUMES[number]
  allCases:    CaseLaw[]
  defaultOpen: boolean
  forceOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const isOpen = forceOpen || open

  // Filter cases that belong to this volume's year range
  const volumeCases = allCases.filter((c) => {
    const y = getYear(getArchiveDate(c))
    return y !== null && volume.years.includes(y)
  })

  // Collect months that have cases (newest first)
  const monthsWithCases: Array<{ year: number; month: number; label: string; cases: CaseLaw[] }> = []

  // Build list ordered newest → oldest
  for (const year of [...volume.years].reverse()) {
    for (let m = 11; m >= 0; m--) {
      const mCases = volumeCases.filter((c) => {
        const archiveDate = getArchiveDate(c)
        const y = getYear(archiveDate)
        const mo = getMonth(archiveDate)
        return y === year && mo === m
      })
      if (mCases.length > 0) {
        monthsWithCases.push({ year, month: m, label: MONTHS[m], cases: mCases })
      }
    }
  }

  // Year span description
  const yearSpanLabel = volume.years.length === 1
    ? String(volume.years[0])
    : `${volume.years[0]}–${volume.years.filter(y => volumeCases.some(c => getYear(getArchiveDate(c)) === y)).pop() ?? volume.years[volume.years.length - 1]}`

  return (
    <div style={volumeShell}>
      {/* Volume header button */}
      <button
        onClick={() => {
          if (!forceOpen) setOpen(v => !v)
        }}
        style={volumeToggle}
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.lg }}>
          <span style={{ ...T.label, color: PALETTE.white, lineHeight: 1 }}>
            Volume {volume.roman}
          </span>
          <span style={{ ...T.micro, color: PALETTE.white, opacity: 0.5 }}>
            {yearSpanLabel}
          </span>
          <span style={{ ...T.micro, color: PALETTE.white, opacity: 0.35, fontWeight: 400 }}>
            {volumeCases.length} {volumeCases.length === 1 ? 'opinion' : 'opinions'}
          </span>
        </div>
        <span style={{
          ...FONT.mono,
          fontSize:   SIZE_SM,
          color:      PALETTE.white,
          opacity:    0.5,
          transition: `transform ${ANIMATION.base} ${ANIMATION.ease}`,
          display:    'inline-block',
          transform:  isOpen ? 'rotate(90deg)' : 'rotate(0)',
        }}>
          ▶
        </span>
      </button>

      {/* Volume body */}
      {isOpen && (
        <div style={{ background: PALETTE.warm }}>
          {monthsWithCases.length === 0 ? (
            <div style={{
              ...T.micro,
              color:   PALETTE_CSS.muted,
              padding: `${SPACING.lg} ${SPACING.lg}`,
            }}>
              No opinions published yet.
            </div>
          ) : (
            monthsWithCases.map(({ year, month, label, cases: mCases }) => (
              <MonthShelf
                key={`${year}-${month}`}
                month={label}
                year={year}
                monthCases={mCases}
                forceOpen={forceOpen}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function formatVolumeLabel(volumeCases: CaseLaw[]): string {
  const representedYears = Array.from(
    new Set(
      volumeCases
        .map((c) => getYear(getArchiveDate(c)))
        .filter((year): year is number => year !== null)
    )
  ).sort((a, b) => a - b)

  if (representedYears.length === 0) return ''
  if (representedYears.length === 1) return String(representedYears[0])
  return `${representedYears[0]}–${representedYears[representedYears.length - 1]}`
}

function getVolumeCases(allCases: CaseLaw[], volume: typeof VOLUMES[number]): CaseLaw[] {
  return allCases.filter((c) => {
    const y = getYear(getArchiveDate(c))
    return y !== null && volume.years.includes(y)
  })
}

function getVolumeMonths(volumeCases: CaseLaw[], volume: typeof VOLUMES[number]) {
  const monthsWithCases: Array<{ year: number; month: number; label: string; cases: CaseLaw[] }> = []

  for (const year of [...volume.years].reverse()) {
    for (let m = 11; m >= 0; m--) {
      const mCases = volumeCases.filter((c) => {
        const archiveDate = getArchiveDate(c)
        const y = getYear(archiveDate)
        const mo = getMonth(archiveDate)
        return y === year && mo === m
      })
      if (mCases.length > 0) {
        monthsWithCases.push({ year, month: m, label: MONTHS[m], cases: mCases })
      }
    }
  }

  return monthsWithCases
}

function VolumeMonthDrawer({
  month,
  year,
  monthCases,
  isOpen,
  onToggle,
}: {
  month: string
  year: number
  monthCases: CaseLaw[]
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        style={monthToggle}
        aria-expanded={isOpen}
      >
        <span style={{
          ...T.micro,
          color: PALETTE.black,
        }}>
          {month} {year}
          <span style={{
            marginLeft: SPACING.sm,
            ...FONT.mono,
            fontSize: SIZE_SM,
            fontWeight: 400,
            letterSpacing: '0.10em',
            color: PALETTE.black,
          }}>
            — {monthCases.length} {monthCases.length === 1 ? 'case' : 'cases'}
          </span>
        </span>
        <span style={{
          ...FONT.mono,
          fontSize: SIZE_SM,
          color: PALETTE_CSS.muted,
          transition: `transform ${ANIMATION.fast} ${ANIMATION.ease}`,
          display: 'inline-block',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0)',
        }}>
          ▶
        </span>
      </button>

      {isOpen && (
        <div style={{ background: PALETTE.white }}>
          {monthCases.map((c) => (
            <Link
              key={c.slug}
              href={`/cases/${c.slug}#case-law-box`}
              className="case-archive-link"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 280px',
                columnGap: SPACING.md,
                alignItems: 'start',
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                minWidth: 0,
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
              }}>
                <div className="case-archive-title" style={{
                  ...T.body,
                  lineHeight: 1.15,
                  minWidth: 0,
                  marginBottom: 0,
                  minHeight: '2.3em',
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  overflow: 'hidden',
                }}>
                  {c.title}
                </div>
                <div className="case-archive-meta" style={{
                  ...T.micro,
                  fontWeight: 400,
                  letterSpacing: '0.10em',
                  marginTop: 0,
                  lineHeight: 1.15,
                }}>
                  {c.court}
                </div>
                <div className="case-archive-meta" style={{
                  ...T.micro,
                  fontWeight: 400,
                  letterSpacing: '0.10em',
                  marginTop: 0,
                  lineHeight: 1.15,
                }}>
                  {[c.docketNumber, getArchiveDecisionDate(c)].filter(Boolean).join(' · ')}
                </div>
              </div>
              {c.tags && c.tags.length > 0 && (
                <div style={{
                  minWidth: 0,
                  alignSelf: 'stretch',
                }}>
                  <div className="case-archive-tags" style={{
                    ...T.micro,
                    textAlign: 'right',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    lineHeight: 1.45,
                    overflow: 'hidden',
                    overflowWrap: 'anywhere',
                    paddingLeft: SPACING.md,
                    borderLeft: `1px solid ${PALETTE_CSS.border}`,
                  }}>
                    {c.tags.join(' · ')}
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function VolumeMonthDrawerList({
  monthsWithCases,
}: {
  monthsWithCases: Array<{ year: number; month: number; label: string; cases: CaseLaw[] }>
}) {
  const [openMonth, setOpenMonth] = useState<string | null>(null)

  return (
    <>
      {monthsWithCases.map(({ year, month, label, cases: monthCases }) => {
        const monthKey = `${year}-${month}`
        const isOpen = openMonth === monthKey

        return (
          <VolumeMonthDrawer
            key={monthKey}
            month={label}
            year={year}
            monthCases={monthCases}
            isOpen={isOpen}
            onToggle={() => setOpenMonth(isOpen ? null : monthKey)}
          />
        )
      })}
    </>
  )
}

function ArchiveVolumePanel({
  volumes,
  cases,
  selectedVolumeNumber,
  onSelectVolume,
}: {
  volumes: typeof VOLUMES
  cases: CaseLaw[]
  selectedVolumeNumber: string
  onSelectVolume: (volumeNumber: string) => void
}) {
  const selectedVolume = volumes.find((volume) => volume.number === selectedVolumeNumber) ?? volumes[0]
  const volumeCases = useMemo(() => getVolumeCases(cases, selectedVolume), [cases, selectedVolume.number])
  const monthsWithCases = useMemo(() => getVolumeMonths(volumeCases, selectedVolume), [volumeCases, selectedVolume.number])

  return (
    <div style={volumeShell}>
      <div style={{
        background: 'var(--archive-volume-selector-bar)',
        borderBottom: `1px solid ${PALETTE_CSS.border}`,
      }}>
        <div className="archive-volume-selector">
          {volumes.map((volume) => {
            const isSelected = volume.number === selectedVolume.number
            const volumeLabel = formatVolumeLabel(getVolumeCases(cases, volume))
            return (
              <button
                key={volume.number}
                type="button"
                onClick={() => onSelectVolume(volume.number)}
                aria-pressed={isSelected}
                className={`archive-volume-selector-button${isSelected ? ' is-active' : ''}`}
              >
                <span className="archive-volume-selector-label">Volume {volume.roman}</span>
                <span className="archive-volume-selector-year">{volumeLabel}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ background: PALETTE.warm }} key={selectedVolume.number}>
        {monthsWithCases.length === 0 ? (
          <div style={{
            ...T.micro,
            color: PALETTE_CSS.muted,
            padding: `${SPACING.lg} ${SPACING.lg}`,
          }}>
            No opinions published yet.
          </div>
        ) : (
          <VolumeMonthDrawerList key={selectedVolume.number} monthsWithCases={monthsWithCases} />
        )}
      </div>
    </div>
  )
}

// ── Search setup ──────────────────────────────────────────────────────────────

interface SearchableCase {
  id: string
  slug: string
  title: string
  shortTitle: string
  court: string
  docketNumber: string
  tags?: string
  judges?: string
  disposition?: string
  summary?: string
  holdingBold?: string
  conclusionText?: string
  opinionAuthor?: string
  opinionText?: string
  noticeText?: string
  priorHistory?: string
  footnotesText?: string
  coreTerms?: string
}

function buildSearchableCase(c: CaseLaw): SearchableCase {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    shortTitle: c.shortTitle,
    court: c.court,
    docketNumber: c.docketNumber,
    tags: c.tags?.join(' ') || '',
    judges: c.judges || '',
    disposition: c.disposition || '',
    summary: c.summary || '',
    holdingBold: c.holdingBold || '',
    conclusionText: c.conclusionText || '',
    opinionAuthor: c.opinionAuthor || '',
    opinionText: c.opinionText || '',
    noticeText: c.noticeText || '',
    priorHistory: c.priorHistory || '',
    footnotesText: c.footnotes ? Object.values(c.footnotes).filter(Boolean).join(' ') : '',
    coreTerms: c.coreTerms?.join(' ') || '',
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ArchivePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVolumeNumber, setSelectedVolumeNumber] = useState<typeof VOLUMES[number]['number']>(VOLUMES[0].number)
  const deferredSearchQuery = useDeferredValue(searchQuery)

  const searchableData = useMemo(() => CASES.map(buildSearchableCase), [])

  const fuse = useMemo(() => {
    return new Fuse(searchableData, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'shortTitle', weight: 0.25 },
        { name: 'docketNumber', weight: 0.3 },
        { name: 'tags', weight: 0.3 },
        { name: 'coreTerms', weight: 0.3 },
        { name: 'court', weight: 0.2 },
        { name: 'judges', weight: 0.15 },
        { name: 'summary', weight: 0.15 },
        { name: 'holdingBold', weight: 0.15 },
        { name: 'conclusionText', weight: 0.15 },
        { name: 'opinionAuthor', weight: 0.1 },
        { name: 'opinionText', weight: 0.35 },
        { name: 'footnotesText', weight: 0.1 },
        { name: 'disposition', weight: 0.1 },
        { name: 'noticeText', weight: 0.05 },
        { name: 'priorHistory', weight: 0.05 },
      ],
      threshold: 0.4, // Allows typos/variations
      includeScore: true,
    })
  }, [searchableData])

  // Build and search with Fuse.js
  const { filteredCases, resultCount } = useMemo(() => {
    if (!deferredSearchQuery.trim()) {
      return { filteredCases: CASES, resultCount: CASES.length }
    }

    const results = fuse.search(deferredSearchQuery)
    const resultSlugs = new Set(results.map((r) => r.item.slug))
    const matched = CASES.filter((c) => resultSlugs.has(c.slug))

    return { filteredCases: matched, resultCount: matched.length }
  }, [deferredSearchQuery, fuse])

  const searchActive = searchQuery.trim().length > 0
  const searchNoResults = searchActive && resultCount === 0

  return (
    <main style={{
      minHeight:   '100vh',
      background:  PALETTE.warm,
      paddingBottom: '80px',
    }}>
      <Banner />

      <div style={{
        maxWidth: PAGE_MAX_W,
        margin:   '0 auto',
        padding:  `0 ${SPACING.lg}`,
      }}>

        {/* Page title block */}
        <div style={{ ...PAGE_TITLE_BLOCK, marginTop: '0' }}>
          <h1 style={{ ...T.pageTitle, paddingTop: '20px' }}>
            Archive
          </h1>
        </div>

        {/* Search box */}
        <div style={{ maxWidth: '760px', marginBottom: SPACING.lg }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            resultCount={resultCount}
            noResults={searchNoResults}
          />
        </div>

        {searchNoResults ? (
          <div style={{
            ...T.body,
            maxWidth: '760px',
            color: PALETTE_CSS.meta,
            background: PALETTE.white,
            border: `1px solid ${PALETTE_CSS.border}`,
            padding: `${SPACING.lg}`,
          }}>
            No cases matched “{searchQuery.trim()}”. Try a docket number, court, or a phrase from the opinion text.
          </div>
        ) : (
          <div style={{ maxWidth: '760px' }}>
            <ArchiveVolumePanel
              volumes={VOLUMES}
              cases={filteredCases}
              selectedVolumeNumber={selectedVolumeNumber}
              onSelectVolume={setSelectedVolumeNumber}
            />
          </div>
        )}

      </div>
    </main>
  )
}
