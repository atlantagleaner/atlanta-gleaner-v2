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
import type { CaseLaw } from './types'

// ─── Year imports (JSON for fast bundling; types asserted against CaseLaw) ───
import CASES_2022_RAW from './cases-2022.json'
import CASES_2023_RAW from './cases-2023.json'
const CASES_2022 = CASES_2022_RAW as CaseLaw[]
const CASES_2023 = CASES_2023_RAW as CaseLaw[]

// ─── 2026 cases (current year — small enough to live here) ───────────────────
const CASES_2026: CaseLaw[] = [
  {
    id:           'brosnan-2026',
    slug:         'brosnan-v-ibpo-local-623-a25a1973',
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

export const CASES: CaseLaw[] = [
  ...CASES_2026,
  ...CASES_2023,
  ...CASES_2022,
]

/** The current featured case shown on the landing page CaseLawBox. */
export const FEATURED_CASE: CaseLaw = CASES_2026[0]

/** Look up a full case record by its URL slug. Returns undefined if not found. */
export function getCaseBySlug(slug: string): CaseLaw | undefined {
  return CASES.find(c => c.slug === slug)
}

/** Lightweight index for the Archive page and generateStaticParams. */
export const ALL_CASES: Pick<CaseLaw, 'id' | 'slug' | 'title' | 'court' | 'dateDecided' | 'docketNumber' | 'citations'>[] =
  CASES.map(({ id, slug, title, court, dateDecided, docketNumber, citations }) => ({
    id, slug, title, court, dateDecided, docketNumber, citations,
  }))