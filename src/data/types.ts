// ─────────────────────────────────────────────────────────────────────────────
// Shared types — imported by cases.ts and all cases-{year}.ts files.
// Keep this file free of any imports to avoid circular dependencies.
// ─────────────────────────────────────────────────────────────────────────────

export interface CaseLaw {
  id:             string
  slug:           string              // used as URL segment: /cases/[slug]
  title:          string
  shortTitle:     string
  court:          string
  docketNumber:   string
  dateDecided:    string
  citations:      string
  judges:         string
  disposition:    string
  coreTerms:      string[]            // editorial — leave [] until filled in
  summary:        string              // editorial summary — leave "" until filled in
  holdingBold:    string              // editorial holding — leave "" until filled in
  conclusionText: string              // editorial conclusion — leave "" until filled in
  opinionAuthor:  string
  opinionText:    string              // verbatim slip opinion — \n\n = paragraph break
                                      // inline footnote markers: {fn:N}
  footnotes?:     Record<string, string> // { '1': 'footnote text', ... }
                                      // bidirectional: body {fn:N} <-> footnote list
  publishedAt:    string              // ISO date — when republished on this site
  noticeText?:    string              // e.g. "THIS OPINION IS UNCORRECTED AND SUBJECT TO REVISION"
}