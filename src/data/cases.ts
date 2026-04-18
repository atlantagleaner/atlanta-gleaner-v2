// ─────────────────────────────────────────────────────────────────────────────
// CASE LAW — central index
//
// CaseLaw interface is defined here.
// Per-year data lives in cases-{year}.ts files.
// Future: replace static arrays with Supabase fetch.
//   const { data } = await supabase.from('cases').select('*').eq('slug', slug).single()
//
// ── DATA ENTRY PROTOCOL ───────────────────────────────────────────────────────
//   When adding a new case to cases-{year}.ts:
//   1. Copy the opinion text verbatim from the official slip opinion PDF.
//   2. Replace each footnote reference mark with {fn:N}.
//   3. Enter the corresponding footnote text in the footnotes Record.
//   4. Set noticeText if the slip opinion carries an asterisk notice.
//   5. Set priorHistory from the "Prior History:" line in the slip opinion.
//   6. Verify the full text against the slip opinion before committing.
//   7. Update archive.ts with the case's entry in its volume/month.
// ─────────────────────────────────────────────────────────────────────────────

export type { CaseLaw } from './types'
import type { CaseLaw, EditorialCaseContent, EditorialStatus } from './types'

// ─── Consolidated case data (processed from raw-opinions/*.docx) ────────────
import CASES_MASTER_RAW from './cases.json'
import CASE_EDITORIAL_RAW from './case-editorial.json'
const CASES_MASTER = CASES_MASTER_RAW as CaseLaw[]
const CASE_EDITORIAL = CASE_EDITORIAL_RAW as Record<string, EditorialCaseContent>

function normalizeKeyPart(value: string | undefined): string {
  return (value || '').trim().toLowerCase()
}

function buildEditorialMatchKey(
  title: string | undefined,
  docketNumber: string | undefined,
  dateDecided: string | undefined,
): string {
  const normalize = (value: string | undefined) => (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  return [
    normalize(title),
    normalize(docketNumber),
    normalize(dateDecided),
  ].join('::')
}

function buildCaseKey(caseData: Pick<CaseLaw, 'court' | 'docketNumber' | 'slug'>): string {
  const court = normalizeKeyPart(caseData.court)
  const docket = normalizeKeyPart(caseData.docketNumber)
  return docket ? `${court}::${docket}` : `slug::${normalizeKeyPart(caseData.slug)}`
}

function isMeaningfulText(value: string | undefined): boolean {
  if (!value) return false
  const trimmed = value.trim()
  if (!trimmed) return false
  const lower = trimmed.toLowerCase()
  return !(
    lower === 'summary pending.'
    || lower === 'pending.'
    || lower === 'full opinion text to be added.'
    || lower === 'opinion pending.'
  )
}

const CASE_EDITORIAL_BY_MATCH_KEY = new Map<string, EditorialCaseContent>(
  Object.values(CASE_EDITORIAL).map((entry) => [
    buildEditorialMatchKey(entry.title, entry.docketNumber, entry.dateDecided),
    entry,
  ])
)

function isMeaningfulSummary(summary: string | undefined): summary is string {
  if (!summary) return false
  const trimmed = summary.trim()
  return trimmed.length > 0 && trimmed !== 'Summary pending.'
}

function resolveEditorialStatus(
  editorial: EditorialCaseContent | undefined,
  hasLegacyEditorial: boolean,
): EditorialStatus {
  if (editorial?.status) return editorial.status
  if (hasLegacyEditorial) return 'seeded'
  return 'pending'
}

function applyEditorialOverlay(caseData: CaseLaw): CaseLaw {
  const editorial = CASE_EDITORIAL[caseData.slug]
    || CASE_EDITORIAL_BY_MATCH_KEY.get(
      buildEditorialMatchKey(caseData.title, caseData.docketNumber, caseData.dateDecided)
    )
  const legacyTags = Array.isArray(caseData.tags) && caseData.tags.length > 0
    ? caseData.tags
    : caseData.coreTerms
  const mergedTags = editorial?.tags?.length ? editorial.tags : legacyTags
  const mergedSummary = isMeaningfulSummary(editorial?.summary)
    ? editorial.summary.trim()
    : isMeaningfulSummary(caseData.summary)
      ? caseData.summary.trim()
      : 'Summary pending.'
  const hasLegacyEditorial = mergedTags.length > 0 || isMeaningfulSummary(caseData.summary)

  return {
    ...caseData,
    tags: mergedTags,
    coreTerms: mergedTags,
    summary: mergedSummary,
    editorialStatus: resolveEditorialStatus(editorial, hasLegacyEditorial),
  }
}

// ─── 2026 cases (current year — manually edited metadata) ────────────────────
function caseQualityScore(caseData: CaseLaw): number {
  let score = 0

  if (isMeaningfulText(caseData.citations)) score += 6
  if (isMeaningfulText(caseData.disposition)) score += 4
  if (isMeaningfulText(caseData.opinionAuthor)) score += 2
  if (isMeaningfulText(caseData.summary)) score += 3
  if (isMeaningfulText(caseData.holdingBold)) score += 2
  if (isMeaningfulText(caseData.conclusionText)) score += 2
  if (isMeaningfulText(caseData.noticeText)) score += 1
  if (isMeaningfulText(caseData.priorHistory)) score += 1
  if ((caseData.subsequent_history?.length || 0) > 0) score += 1
  if ((caseData.tags?.length || 0) > 0) score += 1
  if ((caseData.coreTerms?.length || 0) > 0) score += 1

  const opinionText = (caseData.opinionText || '').trim()
  if (opinionText.length > 200) score += 6
  else if (opinionText.length > 0 && !/full opinion text to be added\.?/i.test(opinionText)) score += 3

  return score
}

function buildCanonicalCaseIndex(records: CaseLaw[]) {
  const grouped = new Map<string, CaseLaw[]>()

  for (const record of records) {
    const key = buildCaseKey(record)
    const bucket = grouped.get(key)
    if (bucket) bucket.push(record)
    else grouped.set(key, [record])
  }

  const canonical: CaseLaw[] = []
  const aliases = new Map<string, CaseLaw>()

  for (const group of grouped.values()) {
    const winner = group.reduce((best, current) => {
      const bestScore = caseQualityScore(best)
      const currentScore = caseQualityScore(current)
      if (currentScore > bestScore) return current
      if (currentScore < bestScore) return best
      return best
    })

    canonical.push(winner)
    for (const record of group) {
      aliases.set(record.slug, winner)
    }
  }

  return { canonical, aliases }
}

const CASES_2026: CaseLaw[] = [
  {
    id:           'brosnan-2026',
    slug:         'int-l-bhd-of-police-officers-local-623-inc-v-brosnan-2026-ga-app-lexis-92',
    title:        "Int'l Bhd. of Police Officers Local 623, Inc. v. Brosnan",
    shortTitle:   'IBPO v. Brosnan',
    court:        'Court of Appeals of Georgia, Third Division',
    docketNumber: 'A25A1973',
    dateDecided:  'February 17, 2026',
    citations:    '2026 Ga. App. LEXIS 92* | 2026 LX 47281 | 2026 WL 440637',
    judges:       'DOYLE, P.J. Markle and Padgett, JJ., concur.',
    disposition:  'Judgment affirmed.',
    coreTerms: [
      'breach of contract',
      'legal representation',
      'summary judgment',
      'police officer union',
      'consideration',
      'damages',
      'reimbursement',
    ],
    summary:
      'Officer Devin Brosnan sued his police union, the International Brotherhood of Police Officers, for breach of contract after it failed to provide legal representation during the high-profile investigation of the Rayshard Brooks shooting. Brosnan, who had relied on Union recruitment materials promising "24/7 legal representation," was forced to secure private counsel at a cost of $250,000.',
    holdingBold:
      "The Georgia Court of Appeals affirmed partial summary judgment in favor of Brosnan, holding that the Union's documents and verbal assurances created an enforceable contract that the Union breached.",
    conclusionText:
      "The Court concluded that whether a $100,000 retainer paid by Brosnan's father constitutes a repayable debt remains a question of fact for a jury.",
    opinionAuthor: 'DOYLE, Presiding Judge.',
    opinionText:
      'Devin Brosnan filed suit against the International Brotherhood of Police Officers, Local 623, Inc., ("the Union") alleging that it breached an agreement to provide legal representation. The parties filed cross-motions for summary judgment, and the trial granted partial summary judgment in favor of Brosnan. The Union now appeals, and we affirm for the reasons that follow.\n\n"Summary judgment is proper when there is no genuine issue of material fact and the movant is entitled to judgment as a matter of law."{fn:1} We review a grant of summary judgment de novo.{fn:2}\n\nThe relevant facts are as follows. Brosnan joined the Atlanta Police Department in 2018 and was provided recruitment materials by the Union stating, among other things, that members would receive "24/7 legal representation" in the event of a critical incident. Brosnan paid Union dues through the time of the incident.\n\nOn June 12, 2020, Brosnan was involved in the shooting of Rayshard Brooks. He immediately contacted the Union and requested legal counsel as promised. The Union did not provide an attorney before Brosnan was arrested and charged with felony murder. Brosnan subsequently retained private counsel at a cost of approximately $250,000.\n\nBrosnan thereafter filed suit against the Union, alleging breach of contract. The Union moved for summary judgment, contending that its recruitment materials did not constitute an enforceable contract, and that even if they did, it did not breach any such contract. Brosnan filed a cross-motion, arguing that the materials, together with verbal representations made by Union officials, created an enforceable promise that the Union failed to honor.\n\nThe trial court granted partial summary judgment in favor of Brosnan, finding that a contract was formed and that the Union breached it. The court declined to rule on damages as a matter of law, reserving for the jury the question of whether a $100,000 retainer paid by Brosnan\'s father constituted a loan to Brosnan and thus a component of his recoverable damages. The Union now appeals.\n\nWe agree with the trial court that the Union\'s written materials and verbal representations, taken together, created an enforceable contractual obligation to provide legal representation.{fn:3} Brosnan paid dues in reasonable reliance on the Union\'s promise of legal support, supplying the necessary consideration. See OCGA § 13-3-40.\n\nThe Union\'s failure to provide an attorney prior to Brosnan\'s arrest constituted a breach of that obligation. We therefore affirm the trial court\'s grant of partial summary judgment.\n\nJudgment affirmed. Markle and Padgett, JJ., concur.',
    footnotes: {
      '1': 'On Line, Inc. v. Wrightsboro Walk, LLC, 332 Ga. App. 777, 777 (2015).',
      '2': 'Id.',
      '3': 'See Savannah College of Art & Design v. Roe, 409 Ga. App. 1, 4 (2021) (holding that an institution\'s published policies may give rise to enforceable contractual duties).',
    },
    publishedAt: '2026-03-08',
    noticeText:  'THIS OPINION IS UNCORRECTED AND SUBJECT TO REVISION.',
  },
  {
    id:           'chang-2026',
    slug:         'city-of-milton-v-chang-s25g0476',
    title:        'City of Milton v. Chang',
    shortTitle:   'Milton v. Chang',
    court:        'Supreme Court of Georgia',
    docketNumber: 'S25G0476',
    dateDecided:  'March 12, 2026',
    citations:    '2026 Ga. LEXIS 86* | 2026 LX 199872',
    judges:       'Opinion pending assignment.',
    disposition:  'Pending.',
    coreTerms:    ['municipal immunity', 'sovereign immunity', 'ministerial duty', 'defects in the public roads'],
    summary:      '',
    holdingBold:  '',
    conclusionText: '',
    opinionAuthor: 'Opinion pending.',
    opinionText:  'Full opinion text to be added.',
    publishedAt:  '2026-03-16',
    noticeText:   'THIS OPINION IS UNCORRECTED AND SUBJECT TO REVISION.',
  },
  {
    id:           'owens-2026',
    slug:         'owens-v-state-s25a1229',
    title:        'Owens v. The State.',
    shortTitle:   'Owens v. State',
    court:        'Supreme Court of Georgia',
    docketNumber: 'S25A1229',
    dateDecided:  'February 17, 2026',
    citations:    '',
    judges:       'Opinion pending assignment.',
    disposition:  'Pending.',
    coreTerms:    ['felony murder', 'involuntary manslaughter', 'mutually exclusive verdicts'],
    summary:      '',
    holdingBold:  '',
    conclusionText: '',
    opinionAuthor: 'Opinion pending.',
    opinionText:  'Full opinion text to be added.',
    publishedAt:  '2026-02-28',
  },
  {
    id:           'hoffman-2026',
    slug:         'hoffman-v-southeastern-ob-gyn-a25a2184',
    title:        'Hoffman v. Southeastern OB/GYN Center, LLC et al.',
    shortTitle:   'Hoffman v. Southeastern OB/GYN',
    court:        'Court of Appeals of Georgia',
    docketNumber: 'A25A2184',
    dateDecided:  '',
    citations:    '',
    judges:       'Opinion pending assignment.',
    disposition:  'Pending.',
    coreTerms:    ['medical malpractice', 'biased juror', 'peremptory strike'],
    summary:      '',
    holdingBold:  '',
    conclusionText: '',
    opinionAuthor: 'Opinion pending.',
    opinionText:  'Full opinion text to be added.',
    publishedAt:  '2026-02-17',
  },
  {
    id:           'bonilla-2026',
    slug:         'bonilla-v-ventura-a25a1635',
    title:        'Bonilla v. Ventura et al.',
    shortTitle:   'Bonilla v. Ventura',
    court:        'Court of Appeals of Georgia',
    docketNumber: 'A25A1635',
    dateDecided:  '',
    citations:    '',
    judges:       'Opinion pending assignment.',
    disposition:  'Pending.',
    coreTerms:    ['civil litigation', 'settlement offer', 'conditions of acceptance', 'OCGA § 9-11-67.1'],
    summary:      '',
    holdingBold:  '',
    conclusionText: '',
    opinionAuthor: 'Opinion pending.',
    opinionText:  'Full opinion text to be added.',
    publishedAt:  '2026-01-28',
  },
  {
    id:           'peachstate-2025',
    slug:         'peachstate-concessionaires-v-bryant-a25a1922',
    title:        'Peachstate Concessionaires Inc. v. Bryant.',
    shortTitle:   'Peachstate v. Bryant',
    court:        'Court of Appeals of Georgia',
    docketNumber: 'A25A1922',
    dateDecided:  '',
    citations:    '',
    judges:       'Opinion pending assignment.',
    disposition:  'Pending.',
    coreTerms:    ['premises liability', "stabbed at Dunkin' Donuts", 'reasonably incident to employment'],
    summary:      '',
    holdingBold:  '',
    conclusionText: '',
    opinionAuthor: 'Opinion pending.',
    opinionText:  'Full opinion text to be added.',
    publishedAt:  '2025-12-26',
  },
]

// ─── Combined index ───────────────────────────────────────────────────────────
// Consolidate all cases: 2026 overrides take precedence, then master archive.
// This allows manual editorial updates for 2026 without rebuilding the full JSON.

const CASE_SLUGS_2026 = new Set(CASES_2026.map(c => c.slug))
const CASES_FROM_MASTER = CASES_MASTER.filter(c => !CASE_SLUGS_2026.has(c.slug))
const CASES_ALL: CaseLaw[] = [
  ...CASES_2026,
  ...CASES_FROM_MASTER,
].map(applyEditorialOverlay)
const { canonical: CANONICAL_CASES, aliases: CASE_ALIASES_BY_SLUG } = buildCanonicalCaseIndex(CASES_ALL)

export const CASES: CaseLaw[] = CANONICAL_CASES
export const ALL_CASE_SLUGS: string[] = [...CASE_ALIASES_BY_SLUG.keys()]

/** The current featured case shown on the landing page CaseLawBox. */
export const FEATURED_CASE: CaseLaw = CASES[0]

/** Look up a full case record by its URL slug. Returns undefined if not found. */
export function getCaseBySlug(slug: string): CaseLaw | undefined {
  return CASE_ALIASES_BY_SLUG.get(slug)
}

/** Lightweight index for the Archive page and generateStaticParams. */
export const ALL_CASES: Pick<CaseLaw, 'id' | 'slug' | 'title' | 'court' | 'dateDecided' | 'docketNumber' | 'citations'>[] =
  CASES.map(({ id, slug, title, court, dateDecided, docketNumber, citations }) => ({
    id, slug, title, court, dateDecided, docketNumber, citations,
  }))
