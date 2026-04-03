// ─────────────────────────────────────────────────────────────────────────────
// Shared types — imported by cases.ts and all cases-{year}.ts files.
// Keep this file free of any imports to avoid circular dependencies.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Party to a case (appellant, appellee, plaintiff, defendant, etc.)
 * Extracted from judicial opinion parser.
 */
export interface Party {
  name:       string                  // e.g., "John Smith"
  position:   string                  // e.g., "Appellant", "Appellee", "Plaintiff"
  party_type?: string                 // "individual", "business", "unknown"
}

/**
 * Attorney/counsel representation
 * Extracted from judicial opinion parser.
 */
export interface Counsel {
  attorney_name: string               // Name of the attorney
  law_firm?:     string               // Law firm name (optional)
  represents:    string               // Position: "Appellant", "Appellee", etc.
  office_location?: string            // Office location (optional)
  order:         number               // Order of listing (0-indexed)
}

/**
 * Counsel data as stored in JSON (structured format)
 */
export interface CounselStructured {
  raw:     string                     // Raw text representation
  format?: string                     // Format type (optional)
  entries: Array<{                    // Array of counsel entries
    attorneys:  string[]              // List of attorney names
    law_firm?:  string | null         // Law firm (optional or null)
    represents: string                // Position: "Appellant", "Appellee", etc.
  }>
}

/**
 * Block quotation from opinion text
 * Extracted by detecting indentation and source context.
 */
export interface BlockQuote {
  content:       string               // The quoted text
  source_type?:  string               // "statute", "case", "rule", "guideline", "unknown"
  source_citation?: string            // Citation to source (e.g., "O.C.G.A. § 34-7-2")
  indent_level:  number               // Indentation level (1-3)
  confidence:    number               // Confidence score (0-100) that this is a quote
}

/**
 * Footnote with structured content
 * Extracted from document footnotes.
 */
export interface FootnoteDetail {
  number:     number                  // Footnote number
  anchor:     string                  // HTML anchor ID
  content:    string                  // Footnote text
  citations?: string[]                // Any citations within the footnote
}

/**
 * Structured disposition information
 * Extracted and classified by the parser.
 */
export interface DispositionStructured {
  type:   string                      // "AFFIRM", "REVERSE", "REMAND", "VACATE", "DISMISS", "UNKNOWN"
  text:   string                      // Full disposition text
}

/**
 * Validation metadata from parser
 */
export interface ValidationMetadata {
  is_valid:           boolean         // Whether required fields were extracted
  completeness_score: number          // Percentage of fields successfully extracted (0-100)
}

/**
 * Parsing metadata about extraction process
 */
export interface ParsingMetadata {
  parsedAt:    string                 // ISO timestamp when parsed
  pythonParserVersion: string         // Version of judicial opinion parser used
  fields: {
    hasParties:         boolean       // Whether parties were extracted
    hasCounsel:         boolean       // Whether counsel were extracted
    hasBlockQuotes:     boolean       // Whether block quotes were detected
    hasFootnotes:       boolean       // Whether footnotes were extracted
    citationsFound:     number        // Total citations extracted
  }
}

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
  footnotes?:     Record<string, string | undefined> // { '1': 'footnote text', ... }
                                      // bidirectional: body {fn:N} <-> footnote list
                                      // may have sparse/optional entries from JSON
  publishedAt:    string              // ISO date — when republished on this site
  noticeText?:    string              // e.g. "THIS OPINION IS UNCORRECTED AND SUBJECT TO REVISION"
  priorHistory?:  string              // e.g. "Motor vehicle accident. Fulton State Court. Before Judge Baxter."

  // ─────────────────────────────────────────────────────────────────────────
  // Enhanced metadata from judicial opinion parser
  // ─────────────────────────────────────────────────────────────────────────

  parties?:                 Party[]           // Parties to the case (appellant, appellee, etc.)
  counsel?:                 CounselStructured // Attorneys representing parties (structured format from JSON)
  block_quotes?:            BlockQuote[]      // Block quotations detected in opinion
  footnotes_detailed?:      FootnoteDetail[]  // Structured footnote data
  disposition_structured?:  DispositionStructured // Parsed disposition type & text
  validation?:              ValidationMetadata // Parser validation results
  parsingMetadata?:         ParsingMetadata   // Metadata about the parsing process

  // Source and metadata
  sourceFile?:      string                    // Original DOCX filename
  html?:            string                    // HTML-formatted opinion text
  opinionTextLength?: number                  // Length of opinion text in characters
}