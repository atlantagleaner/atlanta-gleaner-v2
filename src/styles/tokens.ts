/**
 * Atlanta Gleaner — Design Tokens
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for every visual decision on the site.
 * Change anything here and it propagates everywhere.
 *
 * PALETTE          3 colors — white, warm, black
 * FONT             3 typefaces — mono, serif, sans
 * T                Named type styles composed from FONT + size/weight/tracking
 * BOX_SHELL        The border + background every content box shares
 * BOX_HEADER       The section-title rule used inside every box
 * BOX_PADDING      Standard inner padding for box content areas
 * ITEM_RULE        Thin divider between list items / rows
 * PAGE_TITLE_BLOCK The date/title header block below the banner
 */

import type { CSSProperties } from 'react'


// ─── Palette ──────────────────────────────────────────────────────────────────

export const PALETTE = {
  /** Pure white — box backgrounds, portrait mat */
  white: '#FFFFFF',
  /** Warm off-white — page background, subtle surface fills */
  warm:  '#EEEDEB',
  /** Black — all text, borders, icons, rules */
  black: '#000000',
} as const


// ─── Typefaces ────────────────────────────────────────────────────────────────

export const FONT: Record<'mono' | 'serif' | 'sans', CSSProperties> = {
  /** IBM Plex Mono — labels, nav, metadata, headers */
  mono:  { fontFamily: "'IBM Plex Mono', monospace"  },
  /** Cormorant Garamond — masthead, opinion display, captions */
  serif: { fontFamily: "'Cormorant Garamond', serif" },
  /** Inter — body copy, news items, case law prose */
  sans:  { fontFamily: "'Inter', sans-serif"         },
}


// ─── Three-size scale (minimalism rule) ───────────────────────────────────────
// Every font-size on the site must come from one of these three values.
// SM  → all labels, nav, metadata, source tags
// MD  → all body copy, prose, captions
// LG  → page title blocks (mono uppercase)
// display is the single exception — masthead branding only.

export const SIZE_SM = '10px'                          // labels / nav / metadata
export const SIZE_MD = '14px'                          // body / prose / captions
export const SIZE_LG = 'clamp(1.6rem, 3.5vw, 2.5rem)' // page title blocks

/** Standard max-width used by every page content wrapper + title block. */
export const PAGE_MAX_W = '1600px'


// ─── Type scale ───────────────────────────────────────────────────────────────
// Spread these into style props, then add color / margin as needed.
// Example: style={{ ...T.label, color: PALETTE.black, margin: '0 0 14px' }}

export const T: Record<string, CSSProperties> = {

  // ── Mono stack ───────────────────────────────────────────────────────────

  /**
   * micro · SIZE_SM mono
   * Used for: source names, small metadata badges, placeholder copy
   */
  micro: {
    ...FONT.mono,
    fontSize:      SIZE_SM,
    fontWeight:    600,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },

  /**
   * label · SIZE_SM mono
   * Used for: box section headers ("News Index", "The Far Side"), bylines
   */
  label: {
    ...FONT.mono,
    fontSize:      SIZE_SM,
    fontWeight:    700,
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
  },

  /**
   * nav · SIZE_SM mono, lighter weight, wider tracking
   * Used for: navbar links, dropdown items, banner tagline + byline
   */
  nav: {
    ...FONT.mono,
    fontSize:      SIZE_SM,
    fontWeight:    500,
    textTransform: 'uppercase',
    letterSpacing: '0.22em',
  },

  /**
   * site · SIZE_SM mono
   * Used for: "The Atlanta Gleaner" wordmark in the navbar
   */
  site: {
    ...FONT.mono,
    fontSize:      SIZE_SM,
    fontWeight:    600,
    textTransform: 'uppercase',
    letterSpacing: '0.22em',
  },

  // ── Sans stack ───────────────────────────────────────────────────────────

  /**
   * body · SIZE_MD Inter
   * Used for: news item titles
   */
  body: {
    ...FONT.sans,
    fontSize:   SIZE_MD,
    fontWeight: 500,
    lineHeight: 1.45,
  },

  /**
   * prose · SIZE_MD Inter
   * Used for: case law summaries, holding text, opinion paragraphs
   */
  prose: {
    ...FONT.sans,
    fontSize:   SIZE_MD,
    lineHeight: 1.65,
  },

  // ── Serif stack ──────────────────────────────────────────────────────────

  /**
   * caption · SIZE_MD Cormorant Garamond italic
   * Used for: Far Side caption, pull quotes
   */
  caption: {
    ...FONT.serif,
    fontSize:   SIZE_MD,
    fontStyle:  'italic',
    fontWeight: 600,
    lineHeight: 1.55,
  },

  /**
   * display · responsive clamp, Cormorant Garamond
   * Used for: banner masthead only — "The Atlanta Gleaner."
   * Exception to three-size rule: this is branding, not content text.
   */
  display: {
    ...FONT.serif,
    fontSize:      'clamp(3rem, 10vw, 7rem)',
    fontWeight:    700,
    letterSpacing: '-0.03em',
    lineHeight:    0.95,
  },

  /**
   * pageTitle · SIZE_LG mono uppercase
   * Used for: every page title block (Archive, Runway, Comics, etc.)
   * Same IBM Plex Mono family as "NEWS INDEX" labels — just large.
   */
  pageTitle: {
    ...FONT.mono,
    fontSize:      SIZE_LG,
    fontWeight:    700,
    textTransform: 'uppercase',
    letterSpacing: '0.10em',
    lineHeight:    1,
  },
}


// ─── Box architecture ─────────────────────────────────────────────────────────
// Every content box on the site shares these four primitives.
// Change one value here and every box on every page updates.

/**
 * BOX_SHELL — outer wrapper for every content box.
 * Provides border, white background, and flex column layout.
 */
export const BOX_SHELL: CSSProperties = {
  border:        '1px solid rgba(0,0,0,0.18)',
  background:    '#FFFFFF',
  height:        '100%',
  display:       'flex',
  flexDirection: 'column',
}

/**
 * BOX_HEADER — section title rule inside each box.
 * Spread onto an <h2> and add color + margin overrides as needed.
 */
export const BOX_HEADER: CSSProperties = {
  ...T.label,
  color:         '#000000',
  borderBottom:  '2px solid #000000',
  paddingBottom: '7px',
  margin:        '0 0 14px 0',
}

/**
 * BOX_PADDING — standard inner padding string for box content areas.
 * Use as: style={{ padding: BOX_PADDING }}
 */
export const BOX_PADDING = '16px 14px'

/**
 * ITEM_RULE — thin divider between rows / list items inside a box.
 */
export const ITEM_RULE: CSSProperties = {
  borderBottom: '1px solid rgba(0,0,0,0.07)',
}


// ─── Page layout primitives ───────────────────────────────────────────────────

/**
 * PAGE_TITLE_BLOCK — the ruled header area that sits below the Banner
 * on the home page (date + clock) and on every secondary page (page title).
 * Apply to a container div; place T.pageTitle content inside.
 */
export const PAGE_TITLE_BLOCK: CSSProperties = {
  borderTop:    '2px solid #000000',
  borderBottom: '1px solid rgba(0,0,0,0.14)',
  padding:      '18px 0 16px',
  margin:       '0 0 28px 0',
}


// ─── Opinion formatting + fidelity specification ──────────────────────────────
//
// This specification governs every component that renders a published judicial
// opinion on this site (CaseLawBox, app/cases/[slug]/page.tsx, future pages).
//
// ── FIDELITY (non-negotiable) ─────────────────────────────────────────────────
//   1. Opinion text is reproduced verbatim from the official slip opinion.
//      No word, punctuation mark, capitalization, or spacing may be altered.
//   2. Footnotes are preserved as footnotes — never inlined or dropped.
//      Marker syntax in opinionText:  {fn:N}
//      Corresponding text in cases.ts: footnotes: { 'N': '...' }
//   3. Footnote links are bidirectional:
//        Body marker  <sup><a id="[caseId]-ref-N" href="#[caseId]-fn-N">
//        Footnote num <a id="[caseId]-fn-N"  href="#[caseId]-ref-N">
//   4. Asterisk notices ("THIS OPINION IS UNCORRECTED…") are displayed at the
//      top of the opinion, in T.micro weight (not bold), on PALETTE.warm with
//      a black left-border accent.
//   5. Case citations within opinion text are reproduced exactly as written;
//      no special inline styling is applied (they render as plain prose text).
//
// ── STRUCTURE ─────────────────────────────────────────────────────────────────
//   [warm]  Notice banner — T.micro · 3px left-border · PALETTE.warm bg
//   [white] Header        — BOX_HEADER label + FONT.serif case title
//   [warm]  Metadata      — Court · Date Decided · Docket No · Citations ·
//                           Judges · Disposition
//   [warm]  Editorial     — Core Terms chip · Case Summary · Holding · Conclusion
//   [white] Opinion       — "Opinion" serif header · author line (T.label) ·
//                           verbatim paragraphs · footnote list
//
// ── TYPOGRAPHY ────────────────────────────────────────────────────────────────
//   Case title:       FONT.serif · clamp(1.6rem,3.5vw,2.6rem) / (2rem,5vw,3.5rem) · 700
//   Notice text:      T.micro · weight 400 · NEVER bold
//   Metadata label:   T.micro · minWidth 120px
//   Metadata value:   FONT.sans · 12px · weight 400
//   Core terms chip:  T.micro · PALETTE.black bg · PALETTE.white text
//   Summary prose:    T.prose
//   Holding:          T.prose · weight 600 · border-left 3px PALETTE.black
//   Opinion header:   FONT.serif · 24px · weight 700
//   Author line:      T.label
//   Paragraphs:       T.prose · lineHeight 1.72 · margin 0 0 1.1em
//   Block quotes:     FONT.serif · italic · 15px · border-left 3px · paddingLeft 16px
//   Footnote marks:   <sup> · T.micro · weight 700 · no underline · black
//   Footnote list:    T.micro back-link number + FONT.sans 12px text · lineHeight 1.55
//
// ── DATA ENTRY PROTOCOL ───────────────────────────────────────────────────────
//   When entering a new opinion into src/data/cases.ts:
//   1. Copy the text verbatim from the official slip opinion PDF.
//   2. Replace each footnote reference mark with {fn:N}.
//   3. Enter the corresponding footnote text in the footnotes Record.
//   4. Set noticeText if the slip opinion carries an asterisk notice.
//   5. Verify the full text against the slip opinion before committing.
// ─────────────────────────────────────────────────────────────────────────────
