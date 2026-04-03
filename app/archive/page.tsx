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

import React, { useState } from 'react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { Banner } from '@/src/components/Banner'
import {
  PALETTE, PALETTE_CSS, FONT, T, BOX_SHELL, BOX_HEADER,
  BOX_PADDING, ITEM_RULE, SPACING, SIZE_SM, SIZE_MD,
  PAGE_TITLE_BLOCK, PAGE_MAX_W, ANIMATION,
} from '@/src/styles/tokens'
import casesRaw from '@/src/data/cases.json'
import type { CaseLaw } from '@/src/data/types'

const cases = casesRaw as CaseLaw[]

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
  background:     'transparent',
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
  month, year, monthCases,
}: {
  month:      string
  year:       number
  monthCases: CaseLaw[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        style={monthToggle}
        aria-expanded={open}
      >
        <span style={{
          ...T.micro,
          color:         open ? PALETTE.black : PALETTE_CSS.meta,
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
          transform:  open ? 'rotate(90deg)' : 'rotate(0)',
        }}>
          ▶
        </span>
      </button>

      {open && (
        <div style={{ background: PALETTE.white }}>
          {monthCases.map((c) => (
            <Link
              key={c.slug}
              href={`/cases/${c.slug}#case-law-box`}
              className="case-archive-link"
            >
              {/* Case title */}
              <div className="case-archive-title" style={{
                ...T.body,
                marginBottom: SPACING.xs,
              }}>
                {c.title}
              </div>
              {/* Meta row */}
              <div className="case-archive-meta" style={{
                ...T.micro,
                fontWeight:    400,
                letterSpacing: '0.10em',
              }}>
                {[c.court, c.docketNumber, c.publishedAt].filter(Boolean).join(' · ')}
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
}: {
  volume:      typeof VOLUMES[number]
  allCases:    CaseLaw[]
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  // Filter cases that belong to this volume's year range
  const volumeCases = allCases.filter((c) => {
    const y = getYear(c.dateDecided)
    return y !== null && volume.years.includes(y)
  })

  // Collect months that have cases (newest first)
  const monthsWithCases: Array<{ year: number; month: number; label: string; cases: CaseLaw[] }> = []

  // Build list ordered newest → oldest
  for (const year of [...volume.years].reverse()) {
    for (let m = 11; m >= 0; m--) {
      const mCases = volumeCases.filter((c) => {
        const y = getYear(c.dateDecided)
        const mo = getMonth(c.dateDecided)
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
    : `${volume.years[0]}–${volume.years.filter(y => volumeCases.some(c => getYear(c.dateDecided) === y)).pop() ?? volume.years[volume.years.length - 1]}`

  return (
    <div style={volumeShell}>
      {/* Volume header button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={volumeToggle}
        aria-expanded={open}
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
          transform:  open ? 'rotate(90deg)' : 'rotate(0)',
        }}>
          ▶
        </span>
      </button>

      {/* Volume body */}
      {open && (
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
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ArchivePage() {
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
            Case Law Archive
          </h1>
        </div>

        {/* Volume boxes */}
        <div style={{ maxWidth: '760px' }}>
          {VOLUMES.map((volume, i) => (
            <VolumeBox
              key={volume.number}
              volume={volume}
              allCases={cases}
              defaultOpen={i === 0} // Volume IV (newest) open by default
            />
          ))}
        </div>

      </div>
    </main>
  )
}
