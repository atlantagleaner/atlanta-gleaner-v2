// ─────────────────────────────────────────────────────────────────────────────
// CASE LAW DATA
// Future: replace with Supabase fetch
//   const { data } = await supabase.from('cases').select('*').eq('slug', slug).single()
// ─────────────────────────────────────────────────────────────────────────────

export interface CaseLaw {
  id: string
  slug: string
  title: string
  shortTitle: string
  court: string
  docketNumber: string
  dateDecided: string
  citations: string
  judges: string
  disposition: string
  coreTerms: string[]
  summary: string
  holdingBold: string
  conclusionText: string
  opinionAuthor: string
  opinionExcerpt: string
  publishedAt: string // ISO date — when republished on this site
  noticeText?: string
}

export const FEATURED_CASE: CaseLaw = {
  id: 'brosnan-2026',
  slug: 'brosnan-v-ibpo-local-623-a25a1973',
  title: "Int'l Bhd. of Police Officers Local 623, Inc. v. Brosnan",
  shortTitle: 'IBPO v. Brosnan',
  court: 'Court of Appeals of Georgia, Third Division',
  docketNumber: 'A25A1973',
  dateDecided: 'February 17, 2026',
  citations: '2026 Ga. App. LEXIS 92* | 2026 LX 47281 | 2026 WL 440637',
  judges: 'DOYLE, P.J. Markle and Padgett, JJ., concur.',
  disposition: 'Judgment affirmed.',
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
    'In 2020, Atlanta Police Officer Devin Brosnan was involved in the shooting of Rayshard Brooks and immediately requested a Union attorney, relying on recruitment materials promising 24/7 legal representation. When the Union failed to provide counsel prior to his arrest, Brosnan hired a private defense firm for $250,000 and sued the Union for breach of contract.',
  holdingBold:
    "The Georgia Court of Appeals affirmed partial summary judgment in favor of Brosnan, holding that the Union's documents and verbal assurances created an enforceable contract that the Union breached.",
  conclusionText:
    "The Court concluded that whether a $100,000 retainer paid by Brosnan's father constitutes a repayable debt remains a question of fact for a jury.",
  opinionAuthor: 'DOYLE, Presiding Judge.',
  opinionExcerpt:
    "Devin Brosnan filed suit against the International Brotherhood of Police Officers, Local 623, Inc., (\"the Union\") alleging that it breached an agreement to provide legal representation. The parties filed cross-motions for summary judgment, and the trial granted partial summary judgment in favor of Brosnan. The Union now appeals, and we affirm for the reasons that follow.\n\n\"Summary judgment is proper when there is no genuine issue of material fact and the movant is entitled to judgment as a matter of law.\" On Line, Inc. v. Wrightsboro Walk, LLC, 332 Ga. App. 777 (2015).",
  publishedAt: '2026-03-25',
  noticeText: 'THIS OPINION IS UNCORRECTED AND SUBJECT TO REVISION.',
}

// All cases for Archive page
// Future: fetch from Supabase with pagination
export const ALL_CASES: Pick<CaseLaw, 'id' | 'slug' | 'title' | 'court' | 'dateDecided' | 'docketNumber' | 'publishedAt'>[] = [
  {
    id: 'brosnan-2026',
    slug: 'brosnan-v-ibpo-local-623-a25a1973',
    title: "Int'l Bhd. of Police Officers Local 623, Inc. v. Brosnan",
    court: 'Court of Appeals of Georgia, Third Division',
    dateDecided: 'February 17, 2026',
    docketNumber: 'A25A1973',
    publishedAt: '2026-03-25',
  },
]
