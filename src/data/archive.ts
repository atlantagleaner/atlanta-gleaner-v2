// ─────────────────────────────────────────────────────────────────────────────
// Archive data — all published volumes, months, and case articles
// Future Supabase: replace with server-side paginated query + full-text search
// ─────────────────────────────────────────────────────────────────────────────

export type Article = {
  date:     string
  title:    string
  citation: string  // may contain \n for line breaks
  tags:     string
  url:      string
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
      {
        monthYear: 'December 2026',
        articles: [],
      },
      {
        monthYear: 'November 2026',
        articles: [],
      },
      {
        monthYear: 'October 2026',
        articles: [],
      },
      {
        monthYear: 'September 2026',
        articles: [],
      },
      {
        monthYear: 'August 2026',
        articles: [],
      },
      {
        monthYear: 'July 2026',
        articles: [],
      },
      {
        monthYear: 'June 2026',
        articles: [],
      },
      {
        monthYear: 'May 2026',
        articles: [],
      },
      {
        monthYear: 'April 2026',
        articles: [],
      },
      {
        monthYear: 'March 2026',
        articles: [
          {
            date:     'March 16',
            title:    'City of Milton v. Chang',
            citation: 'Supreme Court of Georgia, March 12, 2026, S25G0476\n2026 Ga. LEXIS 86* | 2026 LX 199872',
            tags:     '#municipal immunity · #sovereign immunity · #ministerial duty · #defects in the public roads',
            url:      '/mar1626',
          },
          {
            date:     'March 08',
            title:    "Int'l Bhd. of Police Officers Local 623, Inc. v. Brosnan",
            citation: 'Court of Appeals of Georgia, Third Division, February 17, 2026, A25A1973\n2026 Ga. App. LEXIS 92* | 2026 LX 47281',
            tags:     '#breach of contract · #legal representation · #summary judgment · #police officer union',
            url:      '/mar0826',
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
            url:      '/feb2826',
          },
          {
            date:     'Feb. 17',
            title:    'Hoffman v. Southeastern OB/GYN Center, LLC et al.',
            citation: 'A25A2184',
            tags:     '#medical malpractice · #biased juror · #peremptory strike',
            url:      '/feb1726',
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
            url:      '/jan2826',
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
            url:      '/dec2625',
          },
        ],
      },
      {
        monthYear: 'November 2025',
        articles: [],
      },
      {
        monthYear: 'October 2025',
        articles: [],
      },
      {
        monthYear: 'September 2025',
        articles: [],
      },
      {
        monthYear: 'August 2025',
        articles: [],
      },
      {
        monthYear: 'July 2025',
        articles: [],
      },
      {
        monthYear: 'June 2025',
        articles: [],
      },
      {
        monthYear: 'May 2025',
        articles: [],
      },
      {
        monthYear: 'April 2025',
        articles: [],
      },
      {
        monthYear: 'March 2025',
        articles: [],
      },
      {
        monthYear: 'February 2025',
        articles: [],
      },
      {
        monthYear: 'January 2025',
        articles: [],
      },
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
            citation: 'No. A24A1595, et. al. 2024 WL 5164724 (Ga. Ct. App. Dec. 19, 2024)',
            tags:     '#DA disqualification · #misuse of funds · #romantic entanglement',
            url:      '/dec2724',
          },
        ],
      },
      {
        monthYear: 'November 2024',
        articles: [
          {
            date:     'November 29',
            title:    'Greathouse v. State',
            citation: 'No. A24A1757, 2024 WL 4813703 (Ga. Ct. App. Nov. 18, 2024)',
            tags:     '#probation revocation · #First Offender Act · #due process rights',
            url:      '/nov2924',
          },
        ],
      },
      {
        monthYear: 'October 2024',
        articles: [],
      },
      {
        monthYear: 'September 2024',
        articles: [],
      },
      {
        monthYear: 'August 2024',
        articles: [],
      },
      {
        monthYear: 'July 2024',
        articles: [],
      },
      {
        monthYear: 'June 2024',
        articles: [],
      },
      {
        monthYear: 'May 2024',
        articles: [],
      },
      {
        monthYear: 'April 2024',
        articles: [],
      },
      {
        monthYear: 'March 2024',
        articles: [],
      },
      {
        monthYear: 'February 2024',
        articles: [],
      },
      {
        monthYear: 'January 2024',
        articles: [],
      },
    ],
  },
  {
    id:    'vol-1',
    title: 'Volume I',
    months: [
      {
        monthYear: 'December 2023',
        articles: [
          {
            date:     'December 21',
            title:    'Gates v. State',
            citation: 'No. S23A1158, 2023 WL 8721118 (Ga. Dec. 19, 2023)',
            tags:     '#DUI · #motion to suppress · #ex parte order vs search warrant',
            url:      '/dec2123',
          },
        ],
      },
      {
        monthYear: 'November 2023',
        articles: [
          {
            date:     'November 27',
            title:    'Rose v. Secretary, State of Georgia',
            citation: 'No. 22-12593, 2023 WL 8166878 (11th Cir. Nov. 24, 2023)',
            tags:     '#voting rights · #voter dilution · #energy regulation',
            url:      '/nov2723',
          },
        ],
      },
      {
        monthYear: 'October 2023',
        articles: [],
      },
      {
        monthYear: 'September 2023',
        articles: [],
      },
      {
        monthYear: 'August 2023',
        articles: [],
      },
      {
        monthYear: 'July 2023',
        articles: [],
      },
      {
        monthYear: 'June 2023',
        articles: [],
      },
      {
        monthYear: 'May 2023',
        articles: [],
      },
      {
        monthYear: 'April 2023',
        articles: [],
      },
      {
        monthYear: 'March 2023',
        articles: [],
      },
      {
        monthYear: 'February 2023',
        articles: [],
      },
      {
        monthYear: 'January 2023',
        articles: [],
      },
    ],
  },
]
