'use client'
// ─────────────────────────────────────────────────────────────────────────────
// app/archive/page.tsx — Atlanta Gleaner Case Law Archive
// ─────────────────────────────────────────────────────────────────────────────

import React, { useDeferredValue, useMemo, useState } from 'react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import Fuse from 'fuse.js'
import { Banner } from '@/src/components/Banner'
import { SearchInput } from '@/src/components/common/SearchInput'
import { useMobileDetect } from '@/src/hooks'
import {
  PALETTE, PALETTE_CSS, FONT, T, BOX_SHELL,
  ITEM_RULE, SPACING, SIZE_SM,
  PAGE_TITLE_BLOCK, PAGE_MAX_W, ANIMATION,
} from '@/src/styles/tokens'
import { CASES } from '@/src/data/cases'
import type { CaseLaw } from '@/src/data/types'

// ── Volume & Topic Definitions ───────────────────────────────────────────────

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

export interface TopicNode {
  label: string
  matchTags?: string[]
  subTopics?: TopicNode[]
}

export type GroupedTopic = {
  label: string
  cases: CaseLaw[]
  subTopics?: GroupedTopic[]
}

const CRIMINAL_TAXONOMY: TopicNode[] = [
  { label: "Homicide & Violent Crimes", matchTags: ["felony murder", "malice murder", "aggravated assault", "manslaughter", "homicide", "battery", "kidnapping", "rape", "cruelty to children"] },
  { label: "Property & Drug Offenses", matchTags: ["trafficking", "possession", "burglary", "theft", "rico", "robbery", "drug", "methamphetamine", "cocaine", "marijuana", "forgery"] },
  { label: "Constitutional Rights & Procedure", matchTags: ["fourth amendment", "search and seizure", "miranda", "right to counsel", "double jeopardy", "due process", "speedy trial", "suppress"] },
  { label: "Trial Practice & Evidence", matchTags: ["hearsay", "character evidence", "jury instructions", "prosecutorial misconduct", "mutually exclusive verdicts", "expert witness", "cross-examination", "similar transaction", "evidence", "testimony"] },
  { label: "Post-Conviction & Sentencing", matchTags: ["probation revocation", "habeas corpus", "first offender act", "motion for new trial", "sentencing", "restitution", "appeal", "ineffective assistance"] }
]

const CIVIL_TAXONOMY: TopicNode[] = [
  { 
    label: "Torts & Personal Injury", 
    subTopics: [
      { label: "Premises Liability", matchTags: ["slip and fall", "negligent security", "third-party criminal act", "attractive nuisance", "hazard knowledge", "invitee", "licensee", "constructive knowledge", "premises liability"] },
      { label: "Motor Vehicle & Transit", matchTags: ["auto collision", "commercial trucking", "uninsured motorist", "um", "sudden emergency doctrine", "proximate cause", "marta", "respondeat superior", "motor vehicle", "car accident"] },
      { label: "Medical Malpractice", matchTags: ["medical malpractice", "ocga", "expert affidavit", "standard of care", "gross negligence", "emergency room", "informed consent", "wrongful death", "medical"] },
      { label: "Products Liability", matchTags: ["design defect", "manufacturing defect", "failure to warn", "strict liability", "risk-utility", "consumer expectations", "products liability"] },
      { label: "Intentional Torts & Defamation", matchTags: ["libel", "slander", "defamation", "false imprisonment", "intentional infliction of emotional distress", "iied", "malicious prosecution", "civil assault", "anti-slapp", "intentional tort"] },
      { label: "Professional Negligence (Non-Medical)", matchTags: ["legal malpractice", "accounting malpractice", "fiduciary duty", "engineering defect", "professional negligence"] },
      { label: "Damages, Defenses & Apportionment", matchTags: ["apportionment", "punitive damages", "nominal damages", "assumption of risk", "comparative negligence", "spoliation", "damages"] }
    ] 
  },
  { label: "Contracts & Commercial Law", matchTags: ["breach of contract", "fraud", "arbitration", "corporate governance", "contract", "promissory note", "guaranty", "llc", "fiduciary"] },
  { label: "Government & Administrative Law", matchTags: ["sovereign immunity", "municipal liability", "official immunity", "open records", "zoning", "administrative", "tax", "condemnation"] },
  { label: "Property & Real Estate", matchTags: ["quiet title", "landlord-tenant", "eminent domain", "foreclosure", "real estate", "property", "easement", "trespass", "nuisance"] },
  { label: "Employment & Agency", matchTags: ["workers' compensation", "respondeat superior", "non-compete", "employment", "agency", "independent contractor"] },
  { label: "Family & Domestic Law", matchTags: ["divorce", "child custody", "alimony", "legitimation", "family law", "child support", "parental rights"] },
  { label: "Insurance Law", matchTags: ["coverage dispute", "uninsured motorist", "bad faith", "insurance", "policy", "insurer"] }
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getYear(dateStr: string): number | null {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d.getFullYear()
}

function getMonth(dateStr: string): number | null {
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d.getMonth()
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

// ── Taxonomy Logic ────────────────────────────────────────────────────────────

function matchesTags(caseTags: string[], matchWords: string[]): boolean {
  if (!caseTags || caseTags.length === 0) return false;
  const lowerCaseTags = caseTags.map(t => t.toLowerCase());
  return matchWords.some(mw => 
    lowerCaseTags.some(t => t.includes(mw.toLowerCase()))
  );
}

function processTaxonomy(taxonomy: TopicNode[], cases: CaseLaw[]): GroupedTopic[] {
  const result: GroupedTopic[] = [];
  
  for (const node of taxonomy) {
    if (node.subTopics) {
      const subResults = processTaxonomy(node.subTopics, cases);
      const activeSubResults = subResults.filter(sr => sr.cases.length > 0 || (sr.subTopics && sr.subTopics.length > 0));
      
      if (activeSubResults.length > 0) {
        const allCasesInSubTopics = new Set<CaseLaw>();
        activeSubResults.forEach(sr => sr.cases.forEach(c => allCasesInSubTopics.add(c)));
        result.push({
          label: node.label,
          cases: Array.from(allCasesInSubTopics),
          subTopics: activeSubResults
        });
      }
    } else if (node.matchTags) {
      const matchedCases = cases.filter(c => matchesTags(c.tags || c.coreTerms || [], node.matchTags!));
      if (matchedCases.length > 0) {
        result.push({
          label: node.label,
          cases: matchedCases
        });
      }
    }
  }
  
  return result;
}

function isCriminalCase(c: CaseLaw): boolean {
  const criminalTags = CRIMINAL_TAXONOMY.flatMap(t => t.matchTags || []);
  if (matchesTags(c.tags || c.coreTerms || [], criminalTags)) return true;
  const title = c.title.toLowerCase();
  if (title.includes(" v. state") || title.includes("state v. ") || title.includes("warden")) return true;
  return false;
}

function isCivilCase(c: CaseLaw): boolean {
  const civilTags = CIVIL_TAXONOMY.flatMap(t => t.subTopics ? t.subTopics.flatMap(st => st.matchTags || []) : (t.matchTags || []));
  if (matchesTags(c.tags || c.coreTerms || [], civilTags)) return true;
  return !isCriminalCase(c);
}

function getCivilTopics(cases: CaseLaw[]): GroupedTopic[] {
  const groups = processTaxonomy(CIVIL_TAXONOMY, cases);
  const categorized = new Set<CaseLaw>();
  const extract = (topics: GroupedTopic[]) => {
    for (const t of topics) {
      t.cases.forEach(c => categorized.add(c));
      if (t.subTopics) extract(t.subTopics);
    }
  }
  extract(groups);
  
  const generalCivilCases = cases.filter(c => isCivilCase(c) && !categorized.has(c));
  if (generalCivilCases.length > 0) {
    groups.push({ label: "General Civil Law", cases: generalCivilCases });
  }
  return groups;
}

function getCriminalTopics(cases: CaseLaw[]): GroupedTopic[] {
  const groups = processTaxonomy(CRIMINAL_TAXONOMY, cases);
  const categorized = new Set<CaseLaw>();
  const extract = (topics: GroupedTopic[]) => {
    for (const t of topics) {
      t.cases.forEach(c => categorized.add(c));
      if (t.subTopics) extract(t.subTopics);
    }
  }
  extract(groups);
  
  const generalCriminalCases = cases.filter(c => isCriminalCase(c) && !categorized.has(c));
  if (generalCriminalCases.length > 0) {
    groups.push({ label: "General Criminal Law", cases: generalCriminalCases });
  }
  return groups;
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const volumeShell: CSSProperties = {
  ...BOX_SHELL,
  marginBottom: SPACING.xl,
  overflow:     'hidden',
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

// ── Shared Case Link Component ────────────────────────────────────────────────

function CaseArchiveRow({ c }: { c: CaseLaw }) {
  const isMobile = useMobileDetect(640)

  return (
    <Link
      href={`/cases/${c.slug}#case-law-box`}
      className="case-archive-link"
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 280px',
        columnGap: SPACING.md,
        rowGap: isMobile ? SPACING.xs : 0,
        alignItems: 'start',
        padding: isMobile ? `${SPACING.md} ${SPACING.lg}` : undefined,
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
          minHeight: isMobile ? 'auto' : '2.3em',
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
          alignSelf: isMobile ? 'start' : 'stretch',
        }}>
          <div className="case-archive-tags" style={{
            ...T.micro,
            textAlign: isMobile ? 'left' : 'right',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            lineHeight: 1.45,
            overflow: 'hidden',
            overflowWrap: 'anywhere',
            paddingLeft: isMobile ? 0 : SPACING.md,
            borderLeft: isMobile ? 'none' : `1px solid ${PALETTE_CSS.border}`,
          }}>
            {c.tags.join(' · ')}
          </div>
        </div>
      )}
    </Link>
  )
}

// ── Drawers ───────────────────────────────────────────────────────────────────

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
          {monthCases.map((c) => <CaseArchiveRow key={c.slug} c={c} />)}
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

function VolumeTopicDrawer({
  topic,
  level = 0,
  isOpen,
  onToggle,
}: {
  topic: GroupedTopic
  level?: number
  isOpen: boolean
  onToggle: () => void
}) {
  const isSubDrawer = level > 0;
  
  const headerStyle: CSSProperties = {
    ...monthToggle,
    paddingLeft: `calc(${SPACING.lg} + ${level * 20}px)`,
    background: isSubDrawer ? PALETTE.warm : PALETTE.white,
    borderBottom: isSubDrawer ? 'none' : monthToggle.borderBottom,
  };

  return (
    <div>
      <button
        onClick={onToggle}
        style={headerStyle}
        aria-expanded={isOpen}
      >
        <span style={{
          ...T.micro,
          color: PALETTE.black,
        }}>
          {topic.label}
          <span style={{
            marginLeft: SPACING.sm,
            ...FONT.mono,
            fontSize: SIZE_SM,
            fontWeight: 400,
            letterSpacing: '0.10em',
            color: PALETTE.black,
          }}>
            — {topic.cases.length} {topic.cases.length === 1 ? 'case' : 'cases'}
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
          {topic.subTopics && topic.subTopics.length > 0 ? (
            <VolumeTopicDrawerList groupedTopics={topic.subTopics} level={level + 1} />
          ) : (
            topic.cases.map((c) => <CaseArchiveRow key={c.slug} c={c} />)
          )}
        </div>
      )}
    </div>
  )
}

function VolumeTopicDrawerList({
  groupedTopics,
  level = 0,
}: {
  groupedTopics: GroupedTopic[]
  level?: number
}) {
  const [openTopic, setOpenTopic] = useState<string | null>(null)

  return (
    <>
      {groupedTopics.map((topic) => {
        const isOpen = openTopic === topic.label
        return (
          <VolumeTopicDrawer
            key={topic.label}
            topic={topic}
            level={level}
            isOpen={isOpen}
            onToggle={() => setOpenTopic(isOpen ? null : topic.label)}
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
  const isCivil = selectedVolumeNumber === 'CIVIL'
  const isCriminal = selectedVolumeNumber === 'CRIMINAL'
  
  const selectedVolume = volumes.find((volume) => volume.number === selectedVolumeNumber)
  const volumeCases = useMemo(() => selectedVolume ? getVolumeCases(cases, selectedVolume) : [], [cases, selectedVolume])
  
  const monthsWithCases = useMemo(() => selectedVolume ? getVolumeMonths(volumeCases, selectedVolume) : [], [volumeCases, selectedVolume])
  const civilTopics = useMemo(() => getCivilTopics(cases), [cases])
  const criminalTopics = useMemo(() => getCriminalTopics(cases), [cases])

  return (
    <div style={volumeShell}>
      <div style={{
        background: 'var(--archive-volume-selector-bar)',
        borderBottom: `1px solid ${PALETTE_CSS.border}`,
      }}>
        <div className="archive-volume-selector">
          {volumes.map((volume) => {
            const isSelected = volume.number === selectedVolumeNumber
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
          
          <button
            type="button"
            onClick={() => onSelectVolume('CIVIL')}
            aria-pressed={isCivil}
            className={`archive-volume-selector-button${isCivil ? ' is-active' : ''}`}
          >
            <span className="archive-volume-selector-label">Civil Law</span>
            <span className="archive-volume-selector-year">Topical Index</span>
          </button>
          
          <button
            type="button"
            onClick={() => onSelectVolume('CRIMINAL')}
            aria-pressed={isCriminal}
            className={`archive-volume-selector-button${isCriminal ? ' is-active' : ''}`}
          >
            <span className="archive-volume-selector-label">Criminal Law</span>
            <span className="archive-volume-selector-year">Topical Index</span>
          </button>
        </div>
      </div>

      <div style={{ background: PALETTE.warm }} key={selectedVolumeNumber}>
        {!isCivil && !isCriminal && (
          monthsWithCases.length === 0 ? (
            <div style={{ ...T.micro, color: PALETTE_CSS.muted, padding: `${SPACING.lg} ${SPACING.lg}` }}>No opinions published yet.</div>
          ) : (
            <VolumeMonthDrawerList key={selectedVolumeNumber + '-chrono'} monthsWithCases={monthsWithCases} />
          )
        )}
        
        {isCivil && (
          civilTopics.length === 0 ? (
            <div style={{ ...T.micro, color: PALETTE_CSS.muted, padding: `${SPACING.lg} ${SPACING.lg}` }}>No civil opinions classified yet.</div>
          ) : (
            <VolumeTopicDrawerList key="civil-topics" groupedTopics={civilTopics} />
          )
        )}
        
        {isCriminal && (
          criminalTopics.length === 0 ? (
            <div style={{ ...T.micro, color: PALETTE_CSS.muted, padding: `${SPACING.lg} ${SPACING.lg}` }}>No criminal opinions classified yet.</div>
          ) : (
            <VolumeTopicDrawerList key="criminal-topics" groupedTopics={criminalTopics} />
          )
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
      threshold: 0.4,
      includeScore: true,
    })
  }, [searchableData])

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

        <div style={{ ...PAGE_TITLE_BLOCK, marginTop: '0' }}>
          <h1 style={{ ...T.pageTitle, paddingTop: '20px' }}>
            Archive
          </h1>
        </div>

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