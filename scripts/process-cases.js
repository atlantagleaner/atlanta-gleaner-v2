// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — process-cases.js
//
// Reads every .docx file in raw-opinions/, parses each judicial opinion, and
// writes src/data/cases.json in the CaseLaw interface format.
//
// Usage:  node scripts/process-cases.js
//
// Output shape matches src/data/types.ts → CaseLaw interface so every
// consumer (archive page, case law pages, home page) reads the same structure.
// ─────────────────────────────────────────────────────────────────────────────

const fs      = require('fs').promises;
const path    = require('path');
const mammoth = require('mammoth');

// ── Paths (cross-platform, relative to this script file) ─────────────────────
const RAW_DIR     = path.resolve(__dirname, '..', 'raw-opinions');
const OUTPUT_FILE = path.resolve(__dirname, '..', 'src', 'data', 'cases.json');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Strip common trailing noise from a date string:
 *   "December 30, 2022, Filed"  → "December 30, 2022"
 *   "March 14, 2025"            → "March 14, 2025"
 */
function cleanDate(raw) {
  return (raw || '')
    .replace(/,?\s*(Filed|Decided|Issued|Announced)\s*$/i, '')
    .replace(/\u00A0/g, ' ')
    .trim();
}

/**
 * Clean non-breaking spaces, excess whitespace from any string.
 */
function cleanStr(s) {
  return (s || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Generate a URL-safe slug from a string.
 * "Adams v. Sch. Bd. of St. Johns Cnty._57 F.4th 791.Docx"
 *  → "adams-v-sch-bd-of-st-johns-cnty-57-f-4th-791"
 */
function toSlug(s) {
  return s
    .toLowerCase()
    .replace(/\.docx?$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Derive a short title: everything before the first comma or parenthesis.
 * "Adams v. Sch. Bd. of St. Johns Cnty." → "Adams v. Sch. Bd."
 * Uses the first two "v." words.
 */
function shortTitle(fullTitle) {
  const parts = fullTitle.split(/\bv\.\s*/i);
  if (parts.length < 2) return fullTitle;
  const plaintiff = parts[0].trim().replace(/,.*$/, '').trim();
  const defendant = parts[1].trim().split(/[,;(]/)[0].trim();
  return `${plaintiff} v. ${defendant}`;
}

/**
 * Strip all HTML tags from a string.
 */
function stripHtml(s) {
  return (s || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Inject {fn:N} placeholder markers for every footnote reference in the body.
 *
 * Mammoth v1.x produces this structure for in-body footnote references:
 *   <sup><sup><a href="#footnote-2" id="footnote-ref-2">[1]</a></sup>1</sup>
 *
 * The outer <sup> wraps an inner <sup>+<a>, followed by the display number.
 * We capture the href index (N) and replace the whole thing with {fn:N}.
 *
 * Additional fallback patterns handle older or alternate mammoth output.
 */
function injectFnMarkers(html) {
  // Primary pattern (mammoth 1.x) — nested sup with inner link + trailing digit
  html = html.replace(
    /<sup><sup><a[^>]*href="#footnote-(\d+)"[^>]*>.*?<\/a><\/sup>\d*<\/sup>/gi,
    '{fn:$1}'
  );
  // Fallback A — simple <sup><a href="#footnote-N">
  html = html.replace(
    /<sup>\s*<a[^>]*href="#footnote-(\d+)"[^>]*>.*?<\/a>\s*<\/sup>/gi,
    '{fn:$1}'
  );
  // Fallback B — id-based reference (some mammoth versions)
  html = html.replace(
    /<sup>\s*<a[^>]*id="footnote-ref-(\d+)"[^>]*>.*?<\/a>\s*<\/sup>/gi,
    '{fn:$1}'
  );
  // Fallback C — bare anchor with footnote ref id
  html = html.replace(
    /<a[^>]*id="footnote-ref-(\d+)"[^>]*>.*?<\/a>/gi,
    '{fn:$1}'
  );
  return html;
}

/**
 * Extract footnotes from mammoth HTML.
 * Returns Record<string, string> — e.g. { '1': 'Footnote text here.', ... }
 *
 * Mammoth wraps footnotes in an <ol> at the end of the document.
 * Each item: <li id="footnote-N"><p>...</p></li>
 */
function extractFootnotes(html) {
  const footnotes = {};

  // Scan for <li id="footnote-N"> items (works inside or outside an <ol>)
  const itemRe = /<li[^>]*id="footnote-(\d+)"[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = itemRe.exec(html)) !== null) {
    const num     = m[1];
    let   content = m[2];

    // Remove mammoth back-link: <a href="#footnote-ref-N">↑</a>
    content = content.replace(/<a[^>]*href="#footnote-ref-\d+"[^>]*>[\s\S]*?<\/a>/gi, '');
    // Remove Bookmark anchors: <a id="Bookmark_fnpara_N"></a>
    content = content.replace(/<a[^>]*id="Bookmark_[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
    // Remove leading display-number superscript: <sup>1 </sup> or <sup>1</sup>
    content = content.replace(/^[\s\S]*?<sup>\d+\s*<\/sup>/i, '');
    // Strip remaining HTML and clean
    content = stripHtml(content);
    if (content) footnotes[num] = content;
  }

  return footnotes;
}

/**
 * Remove the footnote <ol> block from the body HTML so it doesn't
 * appear twice in the rendered opinion.
 */
function removeFootnoteList(html) {
  // Remove any trailing <ol>...</ol> that contains footnote list items
  html = html.replace(/<ol>[\s\S]*?<\/ol>\s*$/i, '');
  // Also remove individual footnote anchors from the body (back-references)
  html = html.replace(/<a[^>]*id="footnote-\d+"[^>]*><\/a>/gi, '');
  return html;
}

/**
 * Extract the opinion body HTML, splitting at the "Opinion" section header.
 *
 * Westlaw/Lexis slip opinions use a Bookmark anchor before the section label:
 *   <p><a id="Opinion"></a><strong>Opinion</strong></p>
 *
 * Plain mammoth output may produce simpler variants:
 *   <p>Opinion</p>  or  <p><strong>Opinion</strong></p>
 *
 * We match ALL variants and take the content after the LAST occurrence,
 * because some documents embed a full metadata preamble after the first
 * "Opinion" marker before repeating the label before the actual text.
 *
 * The regex must NOT match "Opinion by:" lines (the colon distinguishes them).
 */
function extractBodyHtml(fullHtml) {
  // Handles: optional bookmark anchor, optional strong/em/b wrapper.
  // Negative lookahead (?!\s*(?:by|By)) prevents matching "Opinion by:".
  const splitterRe = /<(p|h[1-6])[^>]*>(?:<a[^>]*><\/a>)?\s*(?:<(?:strong|em|b)>)?\s*Opinion(?!\s*(?:by|By|:))[\s\S]*?(?:<\/(?:strong|em|b)>)?\s*<\/(p|h[1-6])>/g;

  let lastMatch = null;
  let m;
  // Find the LAST occurrence so preamble duplicates are discarded
  while ((m = splitterRe.exec(fullHtml)) !== null) {
    // Confirm the match contains only "Opinion" (no extra text after)
    const inner = m[0].replace(/<[^>]*>/g, '').trim();
    if (/^Opinion$/i.test(inner)) {
      lastMatch = m;
    }
  }

  if (lastMatch) {
    return fullHtml.slice(lastMatch.index + lastMatch[0].length);
  }

  // Last-resort fallback: split on the last <a id="Opinion"> anchor
  const anchorIdx = fullHtml.lastIndexOf('<a id="Opinion">');
  if (anchorIdx !== -1) {
    // Find the closing </p> of that paragraph and start after it
    const closeP = fullHtml.indexOf('</p>', anchorIdx);
    if (closeP !== -1) return fullHtml.slice(closeP + 4);
  }

  return fullHtml;
}

/**
 * Remove boilerplate blocks that clutter the opinion body.
 * Handles both plain and Westlaw/Lexis Bookmark-anchor formats:
 *   Plain:   <p><strong>Judges:</strong> …</p>
 *   Lexis:   <p><a id="Judges"></a><strong>Judges:</strong> …</p>
 */
function scrubBoilerplate(html) {
  // Helper: build a pattern that matches a section label (with or without anchor)
  function sectionPat(label) {
    return new RegExp(
      `<p[^>]*>(?:<a[^>]*><\\/a>)?\\s*(?:<(?:strong|em|b)>)?${label}(?:<\\/(?:strong|em|b)>)?[\\s\\S]*?<\\/p>`,
      'gi'
    );
  }

  const patterns = [
    sectionPat('Counsel:'),
    sectionPat('Judges:'),
    sectionPat('Opinion\\s+by:'),
    sectionPat('Prior History:'),
    sectionPat('Disposition:'),
    sectionPat('Notice:'),
    sectionPat('Reporter'),   // bare "Reporter" heading
    // All-caps duplicate case name (e.g. "FULTON COUNTY BOARD OF COMMISSIONERS v. …")
    /<p[^>]*>[A-Z][A-Z\s,.'()]+v\.[A-Z\s,.'()]+<\/p>/g,
    // End-of-document markers
    /<p[^>]*>\s*End of Document[\s\S]*?<\/p>/gi,
    // Empty paragraphs with only anchors / whitespace
    /<p[^>]*>(?:<a[^>]*><\/a>)?\s*<\/p>/gi,
  ];

  for (const re of patterns) {
    html = html.replace(re, '');
  }
  return html.trim();
}

/**
 * Enhance blockquote detection using mammoth's custom element handlers.
 *
 * Legal documents (Westlaw, Lexis) typically use one of two approaches for blockquotes:
 *   1. Named paragraph styles (e.g., "Block Quote", "Quotation") — handled by styleMap
 *   2. Paragraph-level indentation via Word's indentation properties
 *
 * Mammoth does not expose indentation properties in its HTML conversion. To properly
 * detect indented blockquotes, the source DOCX must either:
 *   a) Use one of the named styles in the blockquoteStyleMap, OR
 *   b) Be pre-processed to apply a named style to indented paragraphs
 *
 * This function provides a custom conversion option for mammoth that can be enabled
 * if access to the raw DOCX XML is available in future updates.
 *
 * For now, ensure source documents use proper named paragraph styles for blockquotes.
 */
function getCustomMammothHandlers() {
  // Return empty for now — relies on blockquoteStyleMap instead
  // In future: could implement handlers that read raw OOXML if mammoth exposes it
  return {};
}

/**
 * Mark star-pagination tokens like [**1], [***2] with a CSS class.
 */
function markStarPagination(html) {
  return html.replace(/(\[(\*{2,3})\d+\])/g, '<span class="star-pagination">$1</span>');
}

// ── Main parser ───────────────────────────────────────────────────────────────

async function parseDocxFile(filename) {
  const filePath = path.join(RAW_DIR, filename);

  // ── 1. Raw text (for metadata extraction) ─────────────────────────────────
  const rawResult  = await mammoth.extractRawText({ path: filePath });
  const rawLines   = rawResult.value
    .split('\n')
    .map(l => cleanStr(l))
    .filter(l => l.length > 0);

  // ── 2. Full HTML (for body + footnotes) ───────────────────────────────────
  // styleMap covers named paragraph styles used by various legal publishers.
  // When documents arrive with properly-named blockquote styles, mammoth will
  // emit <blockquote> tags which the .opinion-body CSS picks up automatically.
  // Additionally, the convertIndentedToBlockquote() function post-processes
  // paragraphs with margin-left/padding-left indentation (e.g. 0.5 inches),
  // which is how Westlaw/Lexis publisher typesetting encodes block quotations.
  const blockquoteStyleMap = [
    // Standard legal blockquote style names
    "p[style-name='Block Text'] => blockquote:fresh",
    "p[style-name='Block Quote'] => blockquote:fresh",
    "p[style-name='BlockQuote'] => blockquote:fresh",
    "p[style-name='Block Quotation'] => blockquote:fresh",
    "p[style-name='Quotation'] => blockquote:fresh",
    "p[style-name='Quote'] => blockquote:fresh",
    "p[style-name='Quoted'] => blockquote:fresh",
    "p[style-name='Excerpt'] => blockquote:fresh",
    "p[style-name='Extract'] => blockquote:fresh",
    "p[style-name='Indented'] => blockquote:fresh",
    "p[style-name='Indented text'] => blockquote:fresh",
    "p[style-name='Body Text Indent'] => blockquote:fresh",
    "p[style-name='Body Text Indent 2'] => blockquote:fresh",
    // Westlaw/Lexis style variations
    "p[style-name='Quotation Paragraph'] => blockquote:fresh",
    "p[style-name='Quote Block'] => blockquote:fresh",
    "p[style-name='Opinion Quotation'] => blockquote:fresh",
    // Bluebook / legal brief formats
    "p[style-name='Quoted Material'] => blockquote:fresh",
    "p[style-name='Quoted text'] => blockquote:fresh",
    "p[style-name='Citation Quotation'] => blockquote:fresh",
  ];
  const htmlResult = await mammoth.convertToHtml(
    { path: filePath },
    { styleMap: blockquoteStyleMap }
  );
  const fullHtml   = htmlResult.value;

  // ── 3. Metadata extraction from raw text lines ────────────────────────────
  // Lines follow a predictable structure in Westlaw/Lexis slip opinions:
  //   [0]  Case title
  //   [1]  Court name
  //   [2]  Date line ("June 29, 2023, Decided")
  //   [3]  Docket number ("No. A23A0001." or "A23A0001")
  //   ...  (various lines for history, prior history, etc.)
  //   ...  "Notice: ..." if present
  //   ...  "Judges: ..." block
  //   ...  "Counsel: ..." block
  //   ...  "Opinion by: ..." line

  const meta = {
    title:       cleanStr(rawLines[0] || ''),
    court:       cleanStr(rawLines[1] || ''),
    dateDecided: cleanDate(rawLines[2] || ''),
    docketNo:    cleanStr((rawLines[3] || '').replace(/\.$/, '')),
    citations:   '',
    judges:      '',
    disposition: '',
    noticeText:  '',
  };

  // Scan all lines for specific fields
  for (const line of rawLines) {
    const l = line.trim();

    if (/^Notice:/i.test(l)) {
      meta.noticeText = cleanStr(l.replace(/^Notice:\s*/i, ''));
    }
    if (/^Judges:/i.test(l)) {
      meta.judges = cleanStr(l.replace(/^Judges:\s*/i, ''));
    }
    if (/^Disposition:/i.test(l)) {
      meta.disposition = cleanStr(l.replace(/^Disposition:\s*/i, ''));
    }
    // Citations line often contains Reporter format (e.g. "57 F.4th 791")
    if (/^\d+\s+[A-Z]/.test(l) && l.includes('.') && !meta.citations) {
      meta.citations = cleanStr(l);
    }
    // Westlaw/Lexis combined citation strings
    if (/LEXIS|WL\s+\d/.test(l) && !meta.citations) {
      meta.citations = cleanStr(l);
    }
  }

  // Citations also commonly appear in the filename after the underscore
  const fileBaseName = filename.replace(/\.docx?$/i, '');
  const fileCitation = fileBaseName.includes('_')
    ? cleanStr(fileBaseName.split('_').slice(1).join(' '))
    : '';
  if (!meta.citations && fileCitation) {
    meta.citations = fileCitation;
  }

  // ── 4. Opinion author ─────────────────────────────────────────────────────
  let opinionAuthor = '';
  for (const line of rawLines) {
    if (/^Opinion by:/i.test(line)) {
      opinionAuthor = cleanStr(
        line
          .replace(/^Opinion by:\s*/i, '')
          .replace(/^(Judge|Justice|Presiding Judge|Chief Judge|Senior Judge)\s+/i, '')
          .toUpperCase()
      );
      break;
    }
  }

  // ── 5. Extract body HTML ───────────────────────────────────────────────────
  let bodyHtml = extractBodyHtml(fullHtml);
  bodyHtml     = scrubBoilerplate(bodyHtml);
  bodyHtml     = removeFootnoteList(bodyHtml);
  // NOTE: Blockquote detection relies on named paragraph styles (see blockquoteStyleMap).
  // Indented paragraphs from the source DOCX must use a named style like "Block Quote"
  // to be converted to <blockquote> tags. Generic indentation is not exposed by mammoth.
  bodyHtml     = injectFnMarkers(bodyHtml);
  bodyHtml     = markStarPagination(bodyHtml);

  // ── 6. Extract footnotes ──────────────────────────────────────────────────
  const footnotes = extractFootnotes(fullHtml);

  // ── 7. Build the CaseLaw record ───────────────────────────────────────────
  const slug = toSlug(filename);
  const id   = slug;

  return {
    id,
    slug,
    title:          meta.title,
    shortTitle:     shortTitle(meta.title),
    court:          meta.court,
    docketNumber:   meta.docketNo,
    dateDecided:    meta.dateDecided,
    citations:      meta.citations,
    judges:         meta.judges,
    disposition:    meta.disposition,
    coreTerms:      [],
    summary:        'Summary pending.',
    holdingBold:    '',
    conclusionText: '',
    opinionAuthor,
    opinionText:    bodyHtml,   // HTML with {fn:N} inline markers
    footnotes,                  // Record<string, string>
    publishedAt:    new Date().toISOString().slice(0, 10),
    noticeText:     meta.noticeText,
  };
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function run() {
  try {
    await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });

    const files = (await fs.readdir(RAW_DIR))
      .filter(f => /\.docx?$/i.test(f))
      .sort();

    console.log(`\nProcessing ${files.length} opinion files…\n`);

    const results = [];
    let ok = 0;
    let errors = 0;

    for (const file of files) {
      try {
        process.stdout.write(`  [+] ${file.slice(0, 72)}\r`);
        const caseData = await parseDocxFile(file);
        results.push(caseData);
        ok++;
      } catch (err) {
        console.error(`\n  [!] FAILED: ${file}\n      ${err.message}`);
        errors++;
      }
    }

    // Sort newest-first by date
    results.sort((a, b) => {
      const da = new Date(a.dateDecided).getTime() || 0;
      const db = new Date(b.dateDecided).getTime() || 0;
      return db - da;
    });

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf8');

    console.log(`\n\n✓ SUCCESS — ${ok} cases written to src/data/cases.json`);
    if (errors) console.warn(`  ⚠ ${errors} files failed (see above)`);
  } catch (err) {
    console.error('\n✗ Fatal error:', err.message);
    process.exit(1);
  }
}

run();
