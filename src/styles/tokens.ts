/**
 * Atlanta Gleaner — Design Tokens
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for every visual decision on the site.
 * Change anything here and it propagates everywhere.
 *
 * PALETTE       3 colors — white, warm, black
 * FONT          3 typefaces — mono, serif, sans
 * T             Named type styles composed from FONT + size/weight/tracking
 * BOX_SHELL     The border + background every content box shares
 * BOX_HEADER    The section-title rule used inside every box
 * BOX_PADDING   Standard inner padding for box content areas
 * ITEM_RULE     Thin divider between list items / rows
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
// Every content box (NewsBox, CaseLawBox, FarSideBox) is built from these
// three shared primitives. Changing them here reskins all boxes together.

/**
 * BOX_SHELL
 * The outer container every content box uses.
 * White background, thin black border, full-height flex column.
 */
export const BOX_SHELL: CSSProperties = {
  border:        '1px solid rgba(0,0,0,0.18)',
  background:    PALETTE.white,
  height:        '100%',
  display:       'flex',
  flexDirection: 'column',
}

/**
 * BOX_HEADER
 * The section title at the top of every box content area.
 * e.g. "News Index" / "Case Law Update" / "The Far Side"
 */
export const BOX_HEADER: CSSProperties = {
  ...T.label,
  color:         PALETTE.black,
  borderBottom:  `2px solid ${PALETTE.black}`,
  paddingBottom: '7px',
  margin:        '0 0 14px 0',
}

/**
 * BOX_PADDING
 * Standard inner padding applied to the content div inside every box.
 */
export const BOX_PADDING = '16px 14px' as const

/**
 * ITEM_RULE
 * Thin separator between news items, metadata rows, etc.
 */
export const ITEM_RULE: CSSProperties = {
  borderBottom: '1px solid rgba(0,0,0,0.07)',
}

/**
 * PAGE_TITLE_BLOCK
 * The border-bottom rule + spacing beneath every page title.
 * Wrap in a div with maxWidth PAGE_MAX_W, margin 0 auto, padding 0 20px.
 */
export const PAGE_TITLE_BLOCK: CSSProperties = {
  borderBottom:  '1px solid rgba(0,0,0,0.10)',
  paddingBottom: '24px',
  marginBottom:  '28px',
}
