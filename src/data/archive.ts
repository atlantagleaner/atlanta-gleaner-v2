// ─────────────────────────────────────────────────────────────────────────────
// Archive data — all published volumes, months, and case articles
// Future Supabase: replace with server-side paginated query + full-text search
//
// URL convention: /cases/[slug] — slugs come from src/data/cases.ts
// ─────────────────────────────────────────────────────────────────────────────

export type Article = {
  date:     string
  title:    string
  citation: string  // may contain \n for line breaks
  tags:     string
  url:      string  // always /cases/[slug]
}

export type MonthArchive = {
  monthYear: string
  articles:  Article[]
}

export type Volume = {
  id:     string
  title:  string
  months: MonthArchive[]
}

export const ARCHIVE_DATA: Volume[] = [
  {
    id:    'vol-4',
    title: 'Volume IV',
    months: [
      { monthYear: 'December 2026', articles: [] },
      { monthYear: 'November 2026', articles: [] },
      { monthYear: 'October 2026',  articles: [] },
      { monthYear: 'September 2026',articles: [] },
      { monthYear: 'August 2026',   articles: [] },
      { monthYear: 'July 2026',     articles: [] },
      { monthYear: 'June 2026',     articles: [] },
      { monthYear: 'May 2026',      articles: [] },
      { monthYear: 'April 2026',    articles: [] },
      {
        monthYear: 'March 2026',
        articles: [
          {
            date:     'March 16',
            title:    'City of Milton v. Chang',
            citation: 'Supreme Court of Georgia, March 12, 2026, S25G0476\n2026 Ga. LEXIS 86* | 2026 LX 199872',
            tags:     '#municipal immunity · #sovereign immunity · #ministerial duty · #defects in the public roads',
            url:      '/cases/city-of-milton-v-chang-s25g0476',
          },
          {
            date:     'March 08',
            title:    "Int'l Bhd. of Police Officers Local 623, Inc. v. Brosnan",
            citation: 'Court of Appeals of Georgia, Third Division, February 17, 2026, A25A1973\n2026 Ga. App. LEXIS 92* | 2026 LX 47281',
            tags:     '#breach of contract · #legal representation · #summary judgment · #police officer union',
            url:      '/cases/brosnan-v-ibpo-local-623-a25a1973',
          },
        ],
      },
      {
        monthYear: 'February 2026',
        articles: [
          {
            date:     'Feb. 28',
            title:    'Owens v. The State.',
            citation: 'Supreme Court of Georgia, February 17, 2026, S25A1229',
            tags:     '#felony murder · #involuntary manslaughter · #mutually exclusive verdicts',
            url:      '/cases/owens-v-state-s25a1229',
          },
          {
            date:     'Feb. 17',
            title:    'Hoffman v. Southeastern OB/GYN Center, LLC et al.',
            citation: 'A25A2184',
            tags:     '#medical malpractice · #biased juror · #peremptory strike',
            url:      '/cases/hoffman-v-southeastern-ob-gyn-a25a2184',
          },
        ],
      },
      {
        monthYear: 'January 2026',
        articles: [
          {
            date:     'January 28',
            title:    'Bonilla v. Ventura et al.',
            citation: 'A25A1635',
            tags:     '#civil litigation · #settlement offer · #conditions of acceptance · #OCGA § 9-11-67.1',
            url:      '/cases/bonilla-v-ventura-a25a1635',
          },
        ],
      },
    ],
  },
  {
    id:    'vol-3',
    title: 'Volume III',
    months: [
      {
        monthYear: 'December 2025',
        articles: [
          {
            date:     'Dec. 26',
            title:    'Peachstate Concessionaires Inc. v. Bryant.',
            citation: 'A25A1922',
            tags:     "#premises liability · #stabbed at Dunkin' Donuts · #reasonably incident to employment",
            url:      '/cases/peachstate-concessionaires-v-bryant-a25a1922',
          },
        ],
      },
      { monthYear: 'November 2025',  articles: [] },
      { monthYear: 'October 2025',   articles: [] },
      { monthYear: 'September 2025', articles: [] },
      { monthYear: 'August 2025',    articles: [] },
      { monthYear: 'July 2025',      articles: [] },
      { monthYear: 'June 2025',      articles: [] },
      { monthYear: 'May 2025',       articles: [] },
      { monthYear: 'April 2025',     articles: [] },
      { monthYear: 'March 2025',     articles: [] },
      { monthYear: 'February 2025',  articles: [] },
      { monthYear: 'January 2025',   articles: [] },
    ],
  },
  {
    id:    'vol-2',
    title: 'Volume II',
    months: [
      {
        monthYear: 'December 2024',
        articles: [
          {
            date:     'December 27',
            title:    'Roman v. State',
            citation: 'No. A24A1595, et. al. 2024 WL 5164724 (Ga. Ct. App. Dec. 18, 2024)',
            tags:     '#criminal law · #evidence',
            url:      '/cases/roman-v-state-a24a1595',
          },
        ],
      },
      { monthYear: 'November 2024',  articles: [] },
      { monthYear: 'October 2024',   articles: [] },
      { monthYear: 'September 2024', articles: [] },
      { monthYear: 'August 2024',    articles: [] },
      { monthYear: 'July 2024',      articles: [] },
      { monthYear: 'June 2024',      articles: [] },
      { monthYear: 'May 2024',       articles: [] },
      { monthYear: 'April 2024',     articles: [] },
      { monthYear: 'March 2024',     articles: [] },
      { monthYear: 'February 2024',  articles: [] },
      { monthYear: 'January 2024',   articles: [] },
    ],
  },
  {
    id:    'vol-1',
    title: 'Volume I',
    months: [
      { monthYear: 'December 2023',  articles: [] },
      { monthYear: 'November 2023',  articles: [] },
      { monthYear: 'October 2023',   articles: [] },
      { monthYear: 'September 2023', articles: [] },
      { monthYear: 'August 2023',    articles: [] },
      { monthYear: 'July 2023',      articles: [] },
      { monthYear: 'June 2023',      articles: [] },
      { monthYear: 'May 2023',       articles: [] },
      { monthYear: 'April 2023',     articles: [] },
      { monthYear: 'March 2023',     articles: [] },
      { monthYear: 'February 2023',  articles: [] },
      { monthYear: 'January 2023',   articles: [] },
    ],
  },
]
