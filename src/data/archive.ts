// ─────────────────────────────────────────────────────────────────────────────
// Archive data
// Volume I   = 2022  (10 cases)
// Volume II  = 2023  (65 cases)
// Volume III = 2024  (pending)
// Volume IV  = 2025  (1 case)
// Volume V   = 2026  (current year)
// ─────────────────────────────────────────────────────────────────────────────

export type Article = {
  date:     string
  title:    string
  citation: string
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
    id:    "vol-5",
    title: "Volume V",
    months: [
      {
        monthYear: "December 2026",
        articles: [],
      },
      {
        monthYear: "November 2026",
        articles: [],
      },
      {
        monthYear: "October 2026",
        articles: [],
      },
      {
        monthYear: "September 2026",
        articles: [],
      },
      {
        monthYear: "August 2026",
        articles: [],
      },
      {
        monthYear: "July 2026",
        articles: [],
      },
      {
        monthYear: "June 2026",
        articles: [],
      },
      {
        monthYear: "May 2026",
        articles: [],
      },
      {
        monthYear: "April 2026",
        articles: [],
      },
      {
        monthYear: "March 2026",
        articles: [
          {
            date:     "March 16, 2026",
            title:    "City of Milton v. Chang",
            citation: "Supreme Court of Georgia, March 12, 2026, S25G0476\n2026 Ga. LEXIS 86* | 2026 LX 199872",
            tags:     "#municipal immunity · #sovereign immunity · #ministerial duty · #defects in the public roads",
            url:      "/cases/city-of-milton-v-chang-s25g0476",
          },
          {
            date:     "March 08, 2026",
            title:    "Int'l Bhd. of Police Officers Local 623, Inc. v. Brosnan",
            citation: "Court of Appeals of Georgia, Third Division, February 17, 2026, A25A1973\n2026 Ga. App. LEXIS 92* | 2026 LX 47281",
            tags:     "#breach of contract · #legal representation · #summary judgment · #police officer union",
            url:      "/cases/brosnan-v-ibpo-local-623-a25a1973",
          },
        ],
      },
      {
        monthYear: "February 2026",
        articles: [
          {
            date:     "February 28, 2026",
            title:    "Owens v. The State.",
            citation: "Supreme Court of Georgia, February 17, 2026, S25A1229",
            tags:     "#felony murder · #involuntary manslaughter · #mutually exclusive verdicts",
            url:      "/cases/owens-v-state-s25a1229",
          },
          {
            date:     "February 17, 2026",
            title:    "Hoffman v. Southeastern OB/GYN Center, LLC et al.",
            citation: "A25A2184",
            tags:     "#medical malpractice · #biased juror · #peremptory strike",
            url:      "/cases/hoffman-v-southeastern-ob-gyn-a25a2184",
          },
        ],
      },
      {
        monthYear: "January 2026",
        articles: [
          {
            date:     "January 28, 2026",
            title:    "Bonilla v. Ventura et al.",
            citation: "A25A1635",
            tags:     "#civil litigation · #settlement offer · #conditions of acceptance · #OCGA § 9-11-67.1",
            url:      "/cases/bonilla-v-ventura-a25a1635",
          },
        ],
      },
    ],
  },
  {
    id:    "vol-4",
    title: "Volume IV",
    months: [
      {
        monthYear: "December 2025",
        articles: [
          {
            date:     "December 26, 2025",
            title:    "Peachstate Concessionaires Inc. v. Bryant.",
            citation: "A25A1922",
            tags:     "#premises liability · #stabbed at Dunkin' Donuts · #reasonably incident to employment",
            url:      "/cases/peachstate-concessionaires-v-bryant-a25a1922",
          },
        ],
      },
      {
        monthYear: "November 2025",
        articles: [],
      },
      {
        monthYear: "October 2025",
        articles: [],
      },
      {
        monthYear: "September 2025",
        articles: [],
      },
      {
        monthYear: "August 2025",
        articles: [],
      },
      {
        monthYear: "July 2025",
        articles: [],
      },
      {
        monthYear: "June 2025",
        articles: [],
      },
      {
        monthYear: "May 2025",
        articles: [],
      },
      {
        monthYear: "April 2025",
        articles: [],
      },
      {
        monthYear: "March 2025",
        articles: [],
      },
      {
        monthYear: "February 2025",
        articles: [],
      },
      {
        monthYear: "January 2025",
        articles: [],
      },
    ],
  },
  {
    id:    "vol-3",
    title: "Volume III",
    months: [
      { monthYear: "December 2024", articles: [] },
      { monthYear: "November 2024", articles: [] },
      { monthYear: "October 2024", articles: [] },
      { monthYear: "September 2024", articles: [] },
      { monthYear: "August 2024", articles: [] },
      { monthYear: "July 2024", articles: [] },
      { monthYear: "June 2024", articles: [] },
      { monthYear: "May 2024", articles: [] },
      { monthYear: "April 2024", articles: [] },
      { monthYear: "March 2024", articles: [] },
      { monthYear: "February 2024", articles: [] },
      { monthYear: "January 2024", articles: [] },
    ],
  },
  {
    id:    "vol-2",
    title: "Volume II",
    months: [
      {
        monthYear: "December 2023",
        articles: [],
      },
      {
        monthYear: "November 2023",
        articles: [
          {
            date:     "November 7, 2023",
            title:    "Bray v. Watkins",
            citation: "317 Ga. 703 *; 895 S.E.2d 282 **; 2023 Ga. LEXIS 247 ***",
            tags:     "",
            url:      "/cases/bray-v-watkins-s23g0836",
          },
        ],
      },
      {
        monthYear: "October 2023",
        articles: [],
      },
      {
        monthYear: "September 2023",
        articles: [],
      },
      {
        monthYear: "August 2023",
        articles: [],
      },
      {
        monthYear: "July 2023",
        articles: [
          {
            date:     "July 5, 2023",
            title:    "Wood v. State",
            citation: "316 Ga. 811 *; 890 S.E.2d 716 **; 2023 Ga. LEXIS 144 ***",
            tags:     "",
            url:      "/cases/wood-v-state-s23a0637",
          },
          {
            date:     "July 13, 2023",
            title:    "Brown v. State",
            citation: "368 Ga. App. 747 *; 890 S.E.2d 778 **; 2023 Ga. App. LEXIS 364 ***",
            tags:     "",
            url:      "/cases/brown-v-state-a23a0704",
          },
        ],
      },
      {
        monthYear: "June 2023",
        articles: [
          {
            date:     "June 7, 2023",
            title:    "Holt v. Rickman",
            citation: "368 Ga. App. 55 *; 889 S.E.2d 155 **; 2023 Ga. App. LEXIS 256 ***; 2023 WL 3858619",
            tags:     "",
            url:      "/cases/holt-v-rickman-a23a0612",
          },
          {
            date:     "June 29, 2023",
            title:    "Arnold v. Liggins",
            citation: "368 Ga. App. 544 *; 890 S.E.2d 446 **; 2023 Ga. App. LEXIS 349 ***",
            tags:     "",
            url:      "/cases/arnold-v-liggins-a23a0331",
          },
          {
            date:     "June 29, 2023",
            title:    "Ga. CVS Pharm., LLC v. Carmichael",
            citation: "316 Ga. 718 *; 890 S.E.2d 209 **; 2023 Ga. LEXIS 141 ***; 2023 WL 4247591",
            tags:     "",
            url:      "/cases/ga-cvs-pharm-s22g0527-s22g0617-s22g0618",
          },
          {
            date:     "June 28, 2023",
            title:    "Pierce v. Banks",
            citation: "368 Ga. App. 496 *; 890 S.E.2d 402 **; 2023 Ga. App. LEXIS 347 ***; 2023 LX 103821; 111 U.C.C. Rep. Serv. 2d (Callaghan) 479; 2023 WL 4227923",
            tags:     "",
            url:      "/cases/pierce-v-banks-a23a0394",
          },
          {
            date:     "June 14, 2023",
            title:    "Burnette v. State",
            citation: "368 Ga. App. 184 *; 889 S.E.2d 373 **; 2023 Ga. App. LEXIS 277 ***",
            tags:     "",
            url:      "/cases/burnette-v-state-a23a0716",
          },
          {
            date:     "June 13, 2023",
            title:    "Voterga v. State of Georgia",
            citation: "368 Ga. App. 119 *; 889 S.E.2d 322 **; 2023 Ga. App. LEXIS 271 ***; 2023 WL 3963638",
            tags:     "",
            url:      "/cases/voterga-v-state-of-georgia-a23a0004",
          },
        ],
      },
      {
        monthYear: "May 2023",
        articles: [
          {
            date:     "May 9, 2023",
            title:    "Lewis v. State",
            citation: "367 Ga. App. 638 *; 887 S.E.2d 694 **; 2023 Ga. App. LEXIS 196 ***; 2023 WL 3314804",
            tags:     "",
            url:      "/cases/lewis-v-state-a23a0324",
          },
          {
            date:     "May 5, 2023",
            title:    "Cornejo v. Allen",
            citation: "367 Ga. App. 618 *; 887 S.E.2d 679 **; 2023 Ga. App. LEXIS 194 ***; 2023 WL 3264917",
            tags:     "",
            url:      "/cases/cornejo-v-allen-a23a0052",
          },
          {
            date:     "May 31, 2023",
            title:    "Raffensperger v. Jackson",
            citation: "316 Ga. 383 *; 888 S.E.2d 483 **; 2023 Ga. LEXIS 114 ***",
            tags:     "",
            url:      "/cases/raffensperger-v-jackson-s23a0017-s23x0018",
          },
          {
            date:     "May 26, 2023",
            title:    "Hughes v. Ace American Insurance Company",
            citation: "368 Ga. App. 650 *; 888 S.E.2d 341 **; 2023 Ga. App. LEXIS 361 ***",
            tags:     "",
            url:      "/cases/hughes-v-ace-american-insurance-company-a23a0609",
          },
          {
            date:     "May 2, 2023",
            title:    "Perrault v. State",
            citation: "316 Ga. 241 *; 887 S.E.2d 279 **; 2023 Ga. LEXIS 87 ***",
            tags:     "",
            url:      "/cases/perrault-v-state-s23a0379",
          },
          {
            date:     "May 16, 2023",
            title:    "State v. Harris",
            citation: "316 Ga. 272 *; 888 S.E.2d 50 **; 2023 Ga. LEXIS 103 ***",
            tags:     "",
            url:      "/cases/state-v-harris-s23a0090-s23a0091",
          },
        ],
      },
      {
        monthYear: "April 2023",
        articles: [
          {
            date:     "April 28, 2023",
            title:    "Body v. State",
            citation: "367 Ga. App. 506 *; 887 S.E.2d 356 **; 2023 Ga. App. LEXIS 179 ***; 2023 WL 3140295",
            tags:     "",
            url:      "/cases/body-v-state-a23a0395",
          },
          {
            date:     "April 25, 2023",
            title:    "Ball-Rodriquez v. Progressive Premier Insurance Company of Illinois",
            citation: "367 Ga. App. 481 *; 887 S.E.2d 74 **; 2023 Ga. App. LEXIS 173 ***; 2023 WL 3069512",
            tags:     "",
            url:      "/cases/ball-rodriquez-v-progressive-premier-insurance-company-of-a23a0491",
          },
          {
            date:     "April 18, 2023",
            title:    "Harris v. State",
            citation: "316 Ga. 141 *; 886 S.E.2d 790 **; 2023 Ga. LEXIS 76 ***",
            tags:     "",
            url:      "/cases/harris-v-state-s23a0141",
          },
          {
            date:     "April 18, 2023",
            title:    "Priester v. State",
            citation: "316 Ga. 133 *; 886 S.E.2d 805 **; 2023 Ga. LEXIS 75 ***",
            tags:     "",
            url:      "/cases/priester-v-state-s23a0109",
          },
          {
            date:     "April 18, 2023",
            title:    "Thomas v. Henry County Water Auth.",
            citation: "367 Ga. App. 469 *; 886 S.E.2d 857 **; 2023 Ga. App. LEXIS 168 ***; 2023 WL 2983097",
            tags:     "",
            url:      "/cases/thomas-v-henry-county-water-auth-a23a0362",
          },
          {
            date:     "April 17, 2023",
            title:    "Tatum v. State",
            citation: "367 Ga. App. 439 *; 886 S.E.2d 845 **; 2023 Ga. App. LEXIS 164 ***; 2023 WL 2963788",
            tags:     "",
            url:      "/cases/tatum-v-state-a23a0526",
          },
        ],
      },
      {
        monthYear: "March 2023",
        articles: [
          {
            date:     "March 9, 2023",
            title:    "York v. Moore",
            citation: "367 Ga. App. 152 *; 885 S.E.2d 193 **; 2023 Ga. App. LEXIS 122 ***; 2023 WL 2420945",
            tags:     "",
            url:      "/cases/york-v-moore-a22a1359",
          },
          {
            date:     "March 7, 2023",
            title:    "Behl v. State",
            citation: "315 Ga. 814 *; 885 S.E.2d 7 **; 2023 Ga. LEXIS 55 ***",
            tags:     "",
            url:      "/cases/behl-v-state-s23a0377",
          },
          {
            date:     "March 7, 2023",
            title:    "Brown v. State",
            citation: "367 Ga. App. 114 *; 885 S.E.2d 87 **; 2023 Ga. App. LEXIS 119 ***; 2023 WL 2393827",
            tags:     "",
            url:      "/cases/brown-v-state-a22a1340",
          },
          {
            date:     "March 3, 2023",
            title:    "Freeman v. State",
            citation: "367 Ga. App. 57 *; 885 S.E.2d 27 **; 2023 Ga. App. LEXIS 110 ***; 2023 WL 2341883",
            tags:     "",
            url:      "/cases/freeman-v-state-a23a0174",
          },
          {
            date:     "March 22, 2023",
            title:    "Quint v. State",
            citation: "367 Ga. App. 339 *; 886 S.E.2d 1 **; 2023 Ga. App. LEXIS 154 ***; 2023 WL 2594372",
            tags:     "",
            url:      "/cases/quint-v-state-a23a0024",
          },
          {
            date:     "March 21, 2023",
            title:    "Howard v. CTW Enterprises, Inc.",
            citation: "367 Ga. App. 494 *; 885 S.E.2d 828 **; 2023 Ga. App. LEXIS 153 ***; 2023 WL 2579467",
            tags:     "",
            url:      "/cases/howard-v-ctw-enterprises-a23a0038",
          },
          {
            date:     "March 15, 2023",
            title:    "Inquiry Concerning Judge Coomer",
            citation: "315 Ga. 841 *; 885 S.E.2d 738 **; 2023 Ga. LEXIS 59 ***; 2023 WL 2521905",
            tags:     "",
            url:      "/cases/inquiry-s21z0595",
          },
          {
            date:     "March 10, 2023",
            title:    "Walsh v. Bowen",
            citation: "367 Ga. App. 208 *; 885 S.E.2d 241 **; 2023 Ga. App. LEXIS 130 ***; 2023 WL 2443165",
            tags:     "",
            url:      "/cases/walsh-v-bowen-a22a1590",
          },
          {
            date:     "March 1, 2023",
            title:    "Jones v. Ga. Farm Bureau Mut. Ins. Co.",
            citation: "367 Ga. App. 35 *; 885 S.E.2d 13 **; 2023 Ga. App. LEXIS 106 ***; 2023 WL 2292671",
            tags:     "",
            url:      "/cases/jones-v-ga-farm-bureau-mut-ins-co-a22a1685-a22a1686",
          },
        ],
      },
      {
        monthYear: "February 2023",
        articles: [
          {
            date:     "February 8, 2023",
            title:    "Delaney v. State",
            citation: "366 Ga. App. 707 *; 884 S.E.2d 99 **; 2023 Ga. App. LEXIS 67 ***; 2023 WL 1810724",
            tags:     "",
            url:      "/cases/delaney-v-state-a22a1350",
          },
          {
            date:     "February 7, 2023",
            title:    "Hamon v. Connell",
            citation: "315 Ga. 760 *; 883 S.E.2d 785 **; 2023 Ga. LEXIS 24 ***",
            tags:     "",
            url:      "/cases/hamon-v-s22g0405",
          },
          {
            date:     "February 7, 2023",
            title:    "State v. Arroyo",
            citation: "315 Ga. 582 *; 883 S.E.2d 781 **; 2023 Ga. LEXIS 27 ***",
            tags:     "",
            url:      "/cases/state-v-arroyo-s22g0593",
          },
          {
            date:     "February 7, 2023",
            title:    "Williams v. State",
            citation: "315 Ga. 490 *; 883 S.E.2d 733 **; 2023 Ga. LEXIS 26 ***",
            tags:     "",
            url:      "/cases/williams-v-state-s22a0836",
          },
          {
            date:     "February 28, 2023",
            title:    "State v. Wood",
            citation: "367 Ga. App. 10 *; 884 S.E.2d 596 **; 2023 Ga. App. LEXIS 101 ***; 2023 WL 2254052",
            tags:     "",
            url:      "/cases/state-v-wood-a22a1453",
          },
          {
            date:     "February 21, 2023",
            title:    "Charles v. State",
            citation: "315 Ga. 651 *; 884 S.E.2d 363 **; 2023 Ga. LEXIS 40 ***",
            tags:     "",
            url:      "/cases/charles-v-state-s22a1080",
          },
          {
            date:     "February 21, 2023",
            title:    "State v. Wilson",
            citation: "315 Ga. 613 *; 884 S.E.2d 298 **; 2023 Ga. LEXIS 36 ***",
            tags:     "",
            url:      "/cases/state-v-wilson-s22a0967",
          },
          {
            date:     "February 2, 2023",
            title:    "Robertson v. State",
            citation: "366 Ga. App. 623 *; 884 S.E.2d 33 **; 2023 Ga. App. LEXIS 48 ***; 2023 WL 1461536",
            tags:     "",
            url:      "/cases/robertson-v-state-a22a1286",
          },
          {
            date:     "February 2, 2023",
            title:    "Spratlin v. State",
            citation: "366 Ga. App. 607 *; 883 S.E.2d 847 **; 2023 Ga. App. LEXIS 53 ***; 2023 WL 1461666",
            tags:     "",
            url:      "/cases/spratlin-v-state-a22a1213",
          },
          {
            date:     "February 16, 2023",
            title:    "Brixmor New Chastain Corners SC, LLC v. James",
            citation: "367 Ga. App. 235 *; 884 S.E.2d 393 **; 2023 Ga. App. LEXIS 81 ***",
            tags:     "",
            url:      "/cases/brixmor-new-chastain-corners-sc-a22a1499",
          },
          {
            date:     "February 13, 2023",
            title:    "Mahogany v. State",
            citation: "366 Ga. App. 750 *; 884 S.E.2d 141 **; 2023 Ga. App. LEXIS 76 ***",
            tags:     "",
            url:      "/cases/mahogany-v-state-a22a1556",
          },
          {
            date:     "February 13, 2023",
            title:    "United States v. Nicholl",
            citation: "2023 U.S. App. LEXIS 3397 *; 2023 WL 1956753",
            tags:     "",
            url:      "/cases/united-states-v-nicholl-no-22-12043-non-argument-calendar",
          },
          {
            date:     "February 10, 2023",
            title:    "Thomas v. State",
            citation: "366 Ga. App. 738 *; 884 S.E.2d 120 **; 2023 Ga. App. LEXIS 72 ***; 2023 WL 1876495",
            tags:     "",
            url:      "/cases/thomas-v-state-a22a1677",
          },
        ],
      },
      {
        monthYear: "January 2023",
        articles: [
          {
            date:     "January 9, 2023",
            title:    "Pittman v. State",
            citation: "366 Ga. App. 372 *; 883 S.E.2d 56 **; 2023 Ga. App. LEXIS 10 ***; 2023 WL 127932",
            tags:     "",
            url:      "/cases/pittman-v-state-a22a1247",
          },
          {
            date:     "January 9, 2023",
            title:    "Ussery v. State",
            citation: "366 Ga. App. 379 *; 883 S.E.2d 60 **; 2023 Ga. App. LEXIS 8 ***; 2023 WL 128025",
            tags:     "",
            url:      "/cases/ussery-v-state-a22a1708",
          },
          {
            date:     "January 5, 2023",
            title:    "Perry v. State",
            citation: "366 Ga. App. 341 *; 883 S.E.2d 27 **; 2023 Ga. App. LEXIS 5 ***; 2023 WL 109377",
            tags:     "",
            url:      "/cases/perry-v-state-a22a1301",
          },
          {
            date:     "January 4, 2023",
            title:    "Hughes v. State",
            citation: "366 Ga. App. 335 *; 883 S.E.2d 23 **; 2023 Ga. App. LEXIS 2 ***; 2023 WL 31017",
            tags:     "",
            url:      "/cases/hughes-v-state-a22a1428",
          },
          {
            date:     "January 3, 2023",
            title:    "Brailsford v. State",
            citation: "366 Ga. App. 331 *; 882 S.E.2d 648 **; 2023 Ga. App. LEXIS 1 ***; 2023 WL 20887",
            tags:     "",
            url:      "/cases/brailsford-v-state-a22a1155",
          },
          {
            date:     "January 26, 2023",
            title:    "BCG Operations, LLC v. Town of Homer",
            citation: "366 Ga. App. 535 *; 883 S.E.2d 549 **; 2023 Ga. App. LEXIS 38 ***; 2023 WL 412460",
            tags:     "",
            url:      "/cases/bcg-operations-a22a1183-a22a1314",
          },
          {
            date:     "January 25, 2023",
            title:    "Maynard v. Snapchat, Inc.",
            citation: "366 Ga. App. 507 *; 883 S.E.2d 533 **; 2023 Ga. App. LEXIS 37 ***; 2023 WL 385210",
            tags:     "",
            url:      "/cases/maynard-v-snapchat-a20a1218",
          },
          {
            date:     "January 25, 2023",
            title:    "Smoot-Lee v. Corizon Health, Inc.",
            citation: "366 Ga. App. 511 *; 883 S.E.2d 542 **; 2023 Ga. App. LEXIS 32 ***; 2023 WL 385257",
            tags:     "",
            url:      "/cases/smoot-lee-v-corizon-health-a22a1210",
          },
          {
            date:     "January 25, 2023",
            title:    "Torres-Toledo v. State",
            citation: "366 Ga. App. 526 *; 883 S.E.2d 545 **; 2023 Ga. App. LEXIS 34 ***; 2023 WL 385266",
            tags:     "",
            url:      "/cases/torres-toledo-v-state-a22a1544",
          },
          {
            date:     "January 24, 2023",
            title:    "Buchanan v. Hannon",
            citation: "366 Ga. App. 769 *; 883 S.E.2d 439 **; 2023 Ga. App. LEXIS 31 ***; 2023 WL 369325",
            tags:     "",
            url:      "/cases/buchanan-v-hannon-a22a1650",
          },
          {
            date:     "January 23, 2023",
            title:    "Frey v. Jesperson",
            citation: "366 Ga. App. 488 *; 883 S.E.2d 419 **; 2023 Ga. App. LEXIS 27 ***; 2023 WL 353882",
            tags:     "",
            url:      "/cases/frey-v-jesperson-a22a1589",
          },
          {
            date:     "January 19, 2023",
            title:    "Carter v. Wal-Mart Stores E., LP",
            citation: "2023 U.S. App. LEXIS 1244 *; 2023 WL 309034",
            tags:     "",
            url:      "/cases/carter-v-wal-mart-stores-e-no-22-10174-non-argument-calendar",
          },
          {
            date:     "January 19, 2023",
            title:    "City of Alpharetta v. Francis",
            citation: "366 Ga. App. 454 *; 883 S.E.2d 400 **; 2023 Ga. App. LEXIS 24 ***; 2023 WL 311338",
            tags:     "",
            url:      "/cases/city-of-alpharetta-v-francis-a22a1533",
          },
          {
            date:     "January 19, 2023",
            title:    "MyFamilyDoc, LLC v. Johnston",
            citation: "366 Ga. App. 459 *; 883 S.E.2d 404 **; 2023 Ga. App. LEXIS 23 ***; 2023 WL 311339",
            tags:     "",
            url:      "/cases/myfamilydoc-a22a1714",
          },
          {
            date:     "January 18, 2023",
            title:    "Hightower v. State",
            citation: "315 Ga. 399 *; 883 S.E.2d 335 **; 2023 Ga. LEXIS 6 ***",
            tags:     "",
            url:      "/cases/hightower-v-state-s22a0870",
          },
          {
            date:     "January 18, 2023",
            title:    "Montgomery v. State",
            citation: "315 Ga. 467 *; 883 S.E.2d 351 **; 2023 Ga. LEXIS 9 ***",
            tags:     "",
            url:      "/cases/montgomery-v-state-s22a1302",
          },
          {
            date:     "January 18, 2023",
            title:    "Wright v. State",
            citation: "315 Ga. 459 *; 883 S.E.2d 294 **; 2023 Ga. LEXIS 12 ***",
            tags:     "",
            url:      "/cases/wright-v-state-s22a1117",
          },
          {
            date:     "January 17, 2023",
            title:    "United States v. Garza",
            citation: "2023 U.S. App. LEXIS 996 *; 2023 WL 193713",
            tags:     "",
            url:      "/cases/united-states-v-garza-no-21-13294-non-argument-calendar",
          },
          {
            date:     "January 13, 2023",
            title:    "Simmons v. Bates",
            citation: "366 Ga. App. 410 *; 883 S.E.2d 151 **; 2023 Ga. App. LEXIS 16 ***; 2023 WL 178263",
            tags:     "",
            url:      "/cases/simmons-v-bates-a22a1460",
          },
          {
            date:     "January 12, 2023",
            title:    "Williams v. Harvey",
            citation: "366 Ga. App. 395 *; 883 S.E.2d 145 **; 2023 Ga. App. LEXIS 13 ***; 2023 WL 164766",
            tags:     "",
            url:      "/cases/williams-v-harvey-a22a1550",
          },
          {
            date:     "January 10, 2023",
            title:    "Davis v. Greensboro Estates, LLC",
            citation: "366 Ga. App. 383 *; 883 S.E.2d 63 **; 2023 Ga. App. LEXIS 11 ***; 2023 WL 141223",
            tags:     "",
            url:      "/cases/davis-v-greensboro-estates-a22a1166",
          },
          {
            date:     "January 10, 2023",
            title:    "Woodruff v. Jones",
            citation: "366 Ga. App. 393 *; 883 S.E.2d 70 **; 2023 Ga. App. LEXIS 12 ***; 2023 WL 141227",
            tags:     "",
            url:      "/cases/woodruff-v-jones-a22a1551",
          },
        ],
      },
    ],
  },
  {
    id:    "vol-1",
    title: "Volume I",
    months: [
      {
        monthYear: "December 2022",
        articles: [
          {
            date:     "December 9, 2022",
            title:    "Wood v. State",
            citation: "366 Ga. App. 305 *; 882 S.E.2d 50 **; 2022 Ga. App. LEXIS 551 ***; 2022 WL 17544720",
            tags:     "",
            url:      "/cases/wood-v-state-a22a1474",
          },
          {
            date:     "December 6, 2022",
            title:    "Metropolitan Atlanta Rapid Transit Auth. v. Brown",
            citation: "366 Ga. App. 275 *; 881 S.E.2d 803 **; 2022 Ga. App. LEXIS 548 ***; 2022 LX 58885; 2022 WL 17422403",
            tags:     "",
            url:      "/cases/metropolitan-atlanta-rapid-transit-auth-v-brown-a22a1470",
          },
          {
            date:     "December 30, 2022",
            title:    "Adams v. Sch. Bd. of St. Johns Cnty.",
            citation: "57 F.4th 791 *; 2022 U.S. App. LEXIS 35962 **; 29 Fla. L. Weekly Fed. C 2011; 2022 WL 18003879",
            tags:     "",
            url:      "/cases/adams-v-sch-bd-of-st-johns-cnty-no-18-13592",
          },
          {
            date:     "December 30, 2022",
            title:    "United States v. Perez-Quevedo",
            citation: "2022 U.S. App. LEXIS 35958 *; 2022 LX 27718; 2022 AMC 477; 2022 WL 18005650",
            tags:     "",
            url:      "/cases/united-states-v-perez-quevedo-no-21-14021-non-argument-calendar",
          },
          {
            date:     "December 20, 2022",
            title:    "Ballinger v. Watkins",
            citation: "315 Ga. 369 *; 882 S.E.2d 312 **; 2022 Ga. LEXIS 318 ***; 2022 WL 17813597",
            tags:     "",
            url:      "/cases/ballinger-v-watkins-s22a1187",
          },
          {
            date:     "December 20, 2022",
            title:    "State of Ga. v. Fed. Defender Program, Inc.",
            citation: "315 Ga. 319 *; 882 S.E.2d 257 **; 2022 Ga. LEXIS 325 ***",
            tags:     "",
            url:      "/cases/state-of-ga-v-fed-defender-program-s22a1099",
          },
          {
            date:     "December 13, 2022",
            title:    "Royal v. State Farm Mut. Auto. Ins. Co.",
            citation: "366 Ga. App. 313 *; 882 S.E.2d 59 **; 2022 Ga. App. LEXIS 554 ***; 2022 WL 17590154",
            tags:     "",
            url:      "/cases/royal-v-state-farm-mut-auto-ins-co-a22a1186",
          },
        ],
      },
      {
        monthYear: "November 2022",
        articles: [
          {
            date:     "November 3, 2022",
            title:    "Rodriguez v. State Farm Mut. Auto. Ins. Co.",
            citation: "366 Ga. App. 65 *; 880 S.E.2d 606 **; 2022 Ga. App. LEXIS 524 ***; 2022 WL 16644492",
            tags:     "",
            url:      "/cases/rodriguez-v-state-farm-mut-auto-ins-co-a22a1361",
          },
          {
            date:     "November 29, 2022",
            title:    "State v. McKinney",
            citation: "366 Ga. App. 251 *; 881 S.E.2d 699 **; 2022 Ga. App. LEXIS 545 ***; 2022 WL 17258943",
            tags:     "",
            url:      "/cases/state-v-mckinney-a22a1509",
          },
          {
            date:     "November 21, 2022",
            title:    "Ramos v. Owens",
            citation: "366 Ga. App. 216 *; 881 S.E.2d 464 **; 2022 Ga. App. LEXIS 539 ***; 2022 WL 17088528",
            tags:     "",
            url:      "/cases/ramos-v-owens",
          },
        ],
      },
    ],
  },
]