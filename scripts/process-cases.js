// ─────────────────────────────────────────────────────────────────────────────
// Atlanta Gleaner — scripts/process-cases.js  (rebuilt)
//
// Reads every .docx in raw-opinions/, parses each judicial opinion into the
// full metadata structure defined by the Complete Metadata Specification for
// Judicial Opinion Republication, and writes src/data/cases.json.
//
// Output shape is a superset of src/data/types.ts → CaseLaw so every
// consumer (archive page, case law pages, home page) reads the same structure.
//
// Usage:  node scripts/process-cases.js
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const fs      = require('fs').promises;
const path    = require('path');
const mammoth = require('mammoth');
const JSZip   = require('jszip');

// ── Paths ─────────────────────────────────────────────────────────────────────

const RAW_DIR     = path.resolve(__dirname, '..', 'raw-opinions');
const OUTPUT_FILE = path.resolve(__dirname, '..', 'src', 'data', 'cases.json');

function getExistingSlugMap(existingCases) {
  const map = new Map();
  for (const caseData of existingCases || []) {
    if (caseData && caseData.slug) {
      map.set(caseData.slug, caseData);
    }
  }
  return map;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — GENERAL UTILITIES
// ══════════════════════════════════════════════════════════════════════════════

/** Strip HTML tags. */
function stripHtml(s) {
  return (s || '').replace(/<[^>]*>/g, '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Decode common HTML entities. */
function decodeEntities(s) {
  return (s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/** Strip HTML and decode entities. */
function cleanHtml(s) {
  return decodeEntities(stripHtml(s)).replace(/\s+/g, ' ').trim();
}

/** Normalize whitespace and non-breaking spaces. */
function cleanStr(s) {
  return (s || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Remove date-status suffix from a date string.
 * "December 30, 2022, Filed" → "December 30, 2022"
 */
function cleanDate(raw) {
  return cleanStr(raw)
    .replace(/,?\s*(Filed|Decided|Issued|Announced|Rendered)\s*$/i, '')
    .trim();
}

/**
 * Generate a URL-safe slug from a filename.
 * "Adams v. Sch. Bd. of St. Johns Cnty._57 F.4th 791.Docx" → "adams-v-sch-bd-of-st-johns-cnty-57-f-4th-791"
 */
function toSlug(filename) {
  return filename
    .replace(/\.docx?$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Derive a short title: "Plaintiff v. Defendant" from the full caption.
 */
function shortTitle(full) {
  const parts = full.split(/\bv\.\s*/i);
  if (parts.length < 2) return full;
  const plaintiff = parts[0].trim().replace(/,.*$/, '').trim();
  const defendant = parts[1].trim().split(/[,;(]/)[0].trim();
  return `${plaintiff} v. ${defendant}`;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — RAW TEXT LINE CLASSIFICATION
// ══════════════════════════════════════════════════════════════════════════════

// Section labels that mark the start of a named section in raw lines.
const SECTION_LABELS = [
  'Subsequent History',
  'Prior History',
  'Disposition',
  'Syllabus',
  'Held',
  'Notice',
  'Counsel',
  'Judges',
  'Opinion by',
  'Concur by',
  'Dissent by',
  'Concur',
  'Dissent',
  'Opinion',
  'End of Document',
];

/**
 * Parse raw mammoth text lines into a named-section map.
 *
 * Returns an object:
 *   {
 *     _header: { title, court, dateRaw, docket },
 *     Reporter: ["citation line"],
 *     formalCaseName: "ALL CAPS NAME",
 *     "Prior History": ["text line", "prior decision line", ...],
 *     "Subsequent History": ["text"],
 *     Disposition: ["text"],
 *     Counsel: ["line1", "line2", ...],
 *     Judges: ["text"],
 *     "Opinion by": ["text"],
 *     Opinion: ["body lines..."],
 *   }
 */
function parseRawLines(rawText) {
  const lines = rawText
    .split('\n')
    .map(l => cleanStr(l))
    .filter(l => l.length > 0);

  const sections = {};
  let currentSection = null;

  // Header: lines 0-5 are fixed positions
  // Line 0: Title
  // Line 1: Court
  // Line 2: Decision date
  // Line 3: Docket number
  // Line 4: "Reporter" label
  // Line 5: Reporter citation (volume reporter page, LEXIS, WL, etc.)
  sections._header = {
    title:   cleanStr(lines[0] || ''),
    court:   cleanStr(lines[1] || ''),
    dateRaw: cleanStr(lines[2] || ''),
    docket:  cleanStr((lines[3] || '').replace(/\.$/, '')),
    citations: cleanStr((lines[5] || '').replace(/\.$/, '')),
  };

  // Process remaining lines
  for (let i = 4; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line starts a known section
    let matched = false;
    for (const label of SECTION_LABELS) {
      // Exact match for standalone labels ("Reporter", "Opinion", "End of Document")
      if (line === label) {
        currentSection = label;
        sections[label] = sections[label] || [];
        matched = true;
        break;
      }
      // Prefix match for "Label: content"
      const prefixRe = new RegExp(`^${escapeRe(label)}:\\s*(.*)$`, 'i');
      const m = prefixRe.exec(line);
      if (m) {
        currentSection = label;
        sections[label] = sections[label] || [];
        const content = cleanStr(m[1]);
        if (content) sections[label].push(content);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Special case: formal case name appears right after the citation line
      // It's in ALL CAPS and comes after "Reporter" section
      if (
        currentSection === 'Reporter' &&
        !sections.formalCaseName &&
        /^[A-Z]/.test(line) &&
        !/^(Prior History|Disposition|Counsel|Judges|Opinion|Subsequent|Notice|Concur|Dissent|End of Document)/i.test(line)
      ) {
        // If this looks like a formal case name (all-caps heavy) or a citation line
        // Check: citation lines start with digits; formal names start with caps words
        if (/^[A-Z][A-Z\s,.'()&;–-]/.test(line) && !/^\d/.test(line)) {
          sections.formalCaseName = line;
          currentSection = null; // reset — next section will be labeled
          continue;
        }
      }

      // Continuation of current section
      if (currentSection && currentSection !== 'End of Document') {
        sections[currentSection].push(line);
      }
    }
  }

  return sections;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — CITATION PARSING
// ══════════════════════════════════════════════════════════════════════════════

/** Long-form names for known reporter abbreviations. */
const REPORTER_NAMES = {
  'Ga. App.':             'Georgia Court of Appeals Reporter',
  'Ga.':                  'Georgia Reports',
  'S.E.2d':              'South Eastern Reporter, Second Series',
  'S.E.3d':              'South Eastern Reporter, Third Series',
  'S.E.':                'South Eastern Reporter',
  'F.4th':               'Federal Reporter, Fourth Series',
  'F.3d':                'Federal Reporter, Third Series',
  'F.2d':                'Federal Reporter, Second Series',
  'F. Supp. 3d':         'Federal Supplement, Third Series',
  'F. Supp. 2d':         'Federal Supplement, Second Series',
  'U.S.':                'United States Reports',
  'S. Ct.':              'Supreme Court Reporter',
  'LEXIS':               'LexisNexis',
  'WL':                  'Westlaw',
  'LX':                  'Lexis+',
  'Fla. L. Weekly Fed.': 'Florida Law Weekly Federal',
  'U.S. App. LEXIS':     'LexisNexis (Federal Appellate)',
  'U.S. Dist. LEXIS':    'LexisNexis (Federal District)',
  'Ga. LEXIS':           'LexisNexis (Georgia)',
  'Ga. App. LEXIS':      'LexisNexis (Georgia Court of Appeals)',
};

/**
 * Parse a full citation line into an array of structured citation objects.
 *
 * Handles patterns like:
 *   "374 Ga. App. 75 *"                     → volume/reporter/page
 *   "2025 Ga. App. LEXIS 6 ***"             → year/court/LEXIS/number
 *   "2025 WL 79179"                          → year/WL/number
 *   "2025 LX 24327"                          → year/LX/number
 *   "29 Fla. L. Weekly Fed. C 2011"          → volume/reporter/page (no marker)
 */
function parseCitationLine(line) {
  if (!line) return [];
  const citations = [];
  const parts = line.split(/\s*;\s*/);
  const MARKERS = ['***', '**', '*'];

  for (const raw of parts) {
    const part = cleanStr(raw);
    if (!part) continue;

    // Determine star marker
    let marker = null;
    let text = part;
    for (const m of MARKERS) {
      if (text.endsWith(' ' + m)) {
        marker = m;
        text = text.slice(0, -(m.length + 1)).trim();
        break;
      }
    }

    const citation = { full_citation: part };
    if (marker) citation.marker = marker;

    // LEXIS citation: "2022 Ga. App. LEXIS 524"
    const lexisRe = /^(\d{4})\s+(.+?LEXIS)\s+(\d+)$/i;
    const lexisM = lexisRe.exec(text);
    if (lexisM) {
      const reporterStr = lexisM[2].trim(); // e.g. "Ga. App. LEXIS"
      citation.year       = parseInt(lexisM[1], 10);
      citation.reporter   = reporterStr;
      citation.reporter_long_form = REPORTER_NAMES[reporterStr] || reporterStr;
      citation.number     = lexisM[3];
      citation.citation   = text;
      citation.type       = 'lexis';
      citations.push(citation);
      continue;
    }

    // Westlaw: "2022 WL 16644492"
    const wlRe = /^(\d{4})\s+WL\s+(\d+)$/i;
    const wlM  = wlRe.exec(text);
    if (wlM) {
      citation.year     = parseInt(wlM[1], 10);
      citation.reporter = 'WL';
      citation.reporter_long_form = 'Westlaw';
      citation.number   = wlM[2];
      citation.citation = text;
      citation.type     = 'westlaw';
      citations.push(citation);
      continue;
    }

    // Lexis+ "LX": "2025 LX 24327"
    const lxRe = /^(\d{4})\s+LX\s+(\d+)$/i;
    const lxM  = lxRe.exec(text);
    if (lxM) {
      citation.year     = parseInt(lxM[1], 10);
      citation.reporter = 'LX';
      citation.reporter_long_form = 'Lexis+';
      citation.number   = lxM[2];
      citation.citation = text;
      citation.type     = 'lexis_plus';
      citations.push(citation);
      continue;
    }

    // Standard volume/reporter/page: "374 Ga. App. 75" or "57 F.4th 791"
    // Volume is a number, reporter is multi-word abbreviation, page is a number
    const volRe = /^(\d+)\s+(.+?)\s+(\d+(?:\s+[A-Z]\d+)?)$/;
    const volM  = volRe.exec(text);
    if (volM) {
      const reporterStr = volM[2].trim();
      citation.volume   = parseInt(volM[1], 10);
      citation.reporter = reporterStr;
      citation.reporter_long_form = REPORTER_NAMES[reporterStr] || reporterStr;
      citation.page     = volM[3];
      citation.type     = 'volume_reporter_page';
      citations.push(citation);
      continue;
    }

    // Fallback: store raw
    citation.raw  = text;
    citation.type = 'unknown';
    citations.push(citation);
  }

  return citations;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — PRIOR HISTORY PARSING
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Parse a prior history citation line into a structured object.
 * e.g. "Adams v. Sch. Bd., 318 F. Supp. 3d 1293, 2018 U.S. Dist. LEXIS 125127,
 *       2018 WL 3583843 (M.D. Fla., July 26, 2018)"
 */
function parsePriorDecisionCitation(text) {
  const result = { full_citation_text: text };

  // Extract date from parenthetical at end: "(M.D. Fla., July 26, 2018)"
  const dateRe = /\(([^)]+,\s+\w+\s+\d+,\s+\d{4}|[^)]+,\s+\d{4})\)\s*$/;
  const dateM  = dateRe.exec(text);
  if (dateM) result.decision_date_original = dateM[1];

  // Extract case name (before first comma that precedes a number)
  const caseNameRe = /^(.+?),\s*(?=\d)/;
  const caseNameM  = caseNameRe.exec(text);
  if (caseNameM) result.case_name = caseNameM[1].trim();

  return result;
}

/**
 * Determine if a line looks like a standalone prior decision citation
 * (a case citation line not prefixed by a section label).
 * e.g. "Adams v. Sch. Bd., 318 F. Supp. 3d 1293, ..."
 */
function isPriorDecisionLine(line) {
  // Has a "v." and at least one reporter citation pattern
  return /\bv\.\s/.test(line) && /\d{2,4}\s+[A-Za-z]/.test(line);
}

/**
 * Parse the Prior History section lines into a structured object.
 */
function parsePriorHistory(lines) {
  if (!lines || lines.length === 0) return null;

  const firstLine = lines[0];

  // Extract components from the first line:
  // "Service of process. DeKalb State Court. Before Judge Panos."
  // "Appeal from the United States District Court for the Middle District of Florida. D.C. Docket No. 3:17-cv-00739-TJC-JBT."
  const result = {
    prior_history_text: firstLine,
    case_type:          null,
    trial_court:        null,
    trial_judge:        null,
    appeal_from:        null,
    district_court_docket: null,
    prior_decisions:    [],
  };

  // Federal: "Appeal from the United States District Court for..."
  const appealFromRe = /^Appeal from the (.+?)\.\s*/i;
  const appealFromM  = appealFromRe.exec(firstLine);
  if (appealFromM) {
    result.appeal_from = appealFromM[1].trim();
    // D.C. Docket No.
    const docketRe = /D\.C\.\s*Docket\s*No\.\s*([\w\-:]+)/i;
    const docketM  = docketRe.exec(firstLine);
    if (docketM) result.district_court_docket = docketM[1];
    result.is_federal = true;
  } else {
    // GA: "Service of process. DeKalb State Court. Before Judge Panos."
    const sentences = firstLine.split(/\.\s+/).map(s => s.trim()).filter(Boolean);
    if (sentences.length >= 1) result.case_type  = sentences[0];
    if (sentences.length >= 2) result.trial_court = sentences[1];
    if (sentences.length >= 3) {
      const judgeM = sentences[2].match(/^Before\s+(?:Judge\s+|Senior Judge\s+|Retired Judge\s+|Chief Judge\s+)?(.+)/i);
      if (judgeM) result.trial_judge = judgeM[1].replace(/\.$/, '').trim();
    }
    result.is_federal = false;
  }

  // Additional lines are prior decisions
  for (let i = 1; i < lines.length; i++) {
    const l = lines[i];
    if (l && isPriorDecisionLine(l)) {
      result.prior_decisions.push(parsePriorDecisionCitation(l));
    } else if (l) {
      // Continuation of main history text or other info
      result.prior_history_text += ' ' + l;
    }
  }

  // Clean LEXIS page markers like "[**1]" from text
  result.prior_history_text = result.prior_history_text.replace(/\[\*{1,3}\d+\]\s*/g, '').trim();

  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — SUBSEQUENT HISTORY PARSING
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Parse subsequent history lines into a structured array.
 */
function parseSubsequentHistory(lines) {
  if (!lines || lines.length === 0) return [];

  const events = [];
  let seq = 1;

  for (const line of lines) {
    if (!line) continue;
    const event = {
      sequence:     seq++,
      full_citation: line,
      action:       null,
      court:        null,
      citation:     null,
      decision_date: null,
    };

    // Simple patterns
    if (/cert\.\s*applied\s*for/i.test(line)) {
      event.action = 'Certiorari applied for';
    } else if (/cert\.\s*denied/i.test(line)) {
      event.action = 'Certiorari denied';
    } else if (/cert\.\s*granted/i.test(line)) {
      event.action = 'Certiorari granted';
    } else if (/motion\s*denied/i.test(line)) {
      event.action = 'Motion denied';
    } else if (/reversed/i.test(line)) {
      event.action = 'Reversed';
    } else if (/remanded/i.test(line)) {
      event.action = 'Remanded';
    } else if (/affirmed/i.test(line)) {
      event.action = 'Affirmed';
    }

    // Extract date from parenthetical
    const dateRe = /\(([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4})\)/;
    const dateM  = dateRe.exec(line);
    if (dateM) event.decision_date_original = dateM[1];

    events.push(event);
  }

  return events;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — DISPOSITION PARSING
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Classify a disposition text into a type.
 */
function parseDisposition(text) {
  if (!text) return { disposition_text: '', disposition_type: null };

  // SCOTUS opinions can place a clean disposition line immediately before a
  // "Syllabus" / "Held:" block. We only want the actual disposition line.
  const normalized = cleanStr(text)
    .split(/\bSyllabus\b/i)[0]
    .split(/\bHeld:\b/i)[0]
    .trim();

  const upper = normalized.toUpperCase();
  let type    = 'OTHER';
  let action  = null;

  if (/\bREVERS(?:E|ED|AL)?\b/.test(upper) && /\bREMAND(?:ED)?\b/.test(upper)) {
    type = 'REVERSE_REMAND';
    action = 'reversed and remanded';
  }
  else if (/\bAFFIRM(?:ED|S)?\b/.test(upper) && /\bREVERS(?:E|ED|AL)?\b/.test(upper)) {
    type = 'AFFIRM_REVERSE';
    action = 'affirmed in part and reversed in part';
  }
  else if (/\bAFFIRM(?:ED|S)?\b/.test(upper) && /\bVACAT(?:E|ED)\b/.test(upper)) {
    type = 'AFFIRM_VACATE';
    action = 'affirmed in part and vacated in part';
  }
  else if (/\bREVERS(?:E|ED|AL)?\b/.test(upper))      { type = 'REVERSE'; action = 'reversed'; }
  else if (/\bAFFIRM(?:ED|S)?\b/.test(upper))         { type = 'AFFIRM'; action = 'affirmed'; }
  else if (/\bREMAND(?:ED)?\b/.test(upper))           { type = 'REMAND'; action = 'remanded'; }
  else if (/\bDISMISS(?:ED|AL)?\b/.test(upper))       { type = 'DISMISS'; action = 'dismissed'; }
  else if (/\bVACAT(?:E|ED)\b/.test(upper))           { type = 'VACATE'; action = 'vacated'; }

  const remandM = normalized.match(/remand(?:ed)?\s+(?:for\s+)?(.+?)(?:\.|$)/i);

  return {
    disposition_text: normalized,
    disposition_type: type,
    disposition_action: action,
    remand_instructions: remandM ? remandM[1].trim() : null,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — COUNSEL PARSING
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Determine if counsel format is federal (starts "For PARTY NAME:") or GA.
 */
function isFederalCounsel(lines) {
  return lines.some(l => /^For\s+[A-Z]/.test(l));
}

/**
 * Parse a GA-style counsel block.
 *
 * GA format: "Firm1, Atty1, Atty2; Firm2, Atty3, for appellant."
 * Sometimes no firm: "Amanda J. Walker, for appellant."
 *
 * Multiple parties are on separate lines (the next line after Counsel: is
 * the continuation for a second party).
 */
function parseCounselGA(counselText) {
  const blocks = [];

  // Split the combined text into per-party blocks on ", for " boundary
  // Each block ends with ", for [party]." or ", for [party]"
  const partyRe = /,\s*for\s+(.+?)\.?\s*$/i;

  // Split lines by checking for "for [party]" at the end of each
  // We treat the whole combined text as segments ending with "for party"
  const segments = [];
  let current = '';
  const allLines = Array.isArray(counselText) ? counselText : [counselText];

  for (const line of allLines) {
    if (/,\s*for\s+\w/i.test(line)) {
      // This line ends a party block
      current = current ? current + ' ' + line : line;
      segments.push(current.trim());
      current = '';
    } else {
      current = current ? current + ' ' + line : line;
    }
  }
  if (current.trim()) segments.push(current.trim());

  for (const seg of segments) {
    const partyM = seg.match(/,\s*for\s+(.+?)\.?\s*$/i);
    const represents = partyM ? cleanStr(partyM[1]) : null;

    // Remove the ", for party." suffix
    const firmBlock = partyM ? seg.slice(0, partyM.index).trim() : seg;

    // Split by ";" to get multiple firm groups
    const firmGroups = firmBlock.split(/\s*;\s*/);
    const counselEntries = [];

    for (const group of firmGroups) {
      const parts = group.split(/\s*,\s*/);
      if (parts.length === 0) continue;

      let firmName = null;
      let attorneys = [];

      if (parts.length === 1) {
        // Just one item — could be a solo attorney or a firm
        const item = parts[0].trim();
        // Person name: has two words, possibly with initial
        if (/^[A-Z][a-z]+\s+[A-Z]/.test(item) || /^[A-Z]\.\s/.test(item)) {
          attorneys.push(item);
        } else {
          firmName = item;
        }
      } else {
        // First item is likely the firm if it contains & or has multiple caps words without period-initial
        const first = parts[0].trim();
        const looksLikeFirm = /&/.test(first) ||
          /\b(Law|Legal|LLC|LLP|P\.C\.|Associates|Group|Partners|Office|Firm)\b/.test(first) ||
          parts.length > 1;

        if (looksLikeFirm) {
          firmName  = first;
          attorneys = parts.slice(1).map(p => p.trim()).filter(Boolean);
        } else {
          attorneys = parts.map(p => p.trim()).filter(Boolean);
        }
      }

      counselEntries.push({
        law_firm:   firmName,
        attorneys,
        represents,
      });
    }

    blocks.push(...counselEntries);
  }

  return blocks;
}

/**
 * Parse a federal-style counsel block.
 *
 * Federal format:
 *   "For PARTY NAME, Position: Attorney Name, Title, Firm, CITY, ST."
 *
 * Multiple attorneys for the same party are separated by "; " within the line.
 */
function parseCounselFederal(lines) {
  const blocks = [];

  for (const line of lines) {
    // "For PARTY, Position: Attorney..."
    const forRe = /^For\s+(.+?),\s*([\w\s-]+?):\s*(.+)$/;
    const forM  = forRe.exec(line);
    if (!forM) continue;

    const partyName     = cleanStr(forM[1]);
    const partyPosition = cleanStr(forM[2]);
    const attorneys_raw = cleanStr(forM[3]);

    // Multiple attorneys separated by ";"
    const attorneys = attorneys_raw.split(/\s*;\s*/).map(a => {
      const parts = a.split(/\s*,\s*/);
      const entry = {
        attorney_name:   parts[0] ? cleanStr(parts[0]) : null,
        title:           null,
        law_firm:        null,
        office_location: null,
        raw:             a,
      };

      // Heuristic: last element that's ALL CAPS city,state is the location
      // Second-to-last is the firm
      // Elements after the name that contain "U.S." or "Attorney" are titles
      for (let i = 1; i < parts.length; i++) {
        const p = parts[i].trim();
        if (/^[A-Z]{2,},?\s+[A-Z]{2}$/.test(p) || /^[A-Z]+,\s+[A-Z]{2}$/.test(p)) {
          entry.office_location = p;
        } else if (/U\.S\.\s*Attorney|District\s+Attorney|Attorney\s+General|Solicitor/i.test(p)) {
          entry.title = p;
        } else if (i === parts.length - 1 && !entry.office_location) {
          entry.office_location = p;
        } else if (!entry.law_firm && i >= 1) {
          entry.law_firm = entry.law_firm ? entry.law_firm + ', ' + p : p;
        }
      }

      return entry;
    });

    blocks.push({
      party_name:     partyName,
      party_position: partyPosition,
      attorneys,
    });
  }

  return blocks;
}

/**
 * Parse counsel section into structured data.
 * Auto-detects GA vs. federal format.
 */
function parseCounsel(lines) {
  if (!lines || lines.length === 0) return { raw: '', entries: [] };

  const raw = lines.join(' ');

  if (isFederalCounsel(lines)) {
    return {
      format: 'federal',
      raw,
      entries: parseCounselFederal(lines),
    };
  }

  return {
    format: 'georgia',
    raw,
    entries: parseCounselGA(lines),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — JUDGES / PANEL PARSING
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Parse the Judges section text into a structured panel object.
 *
 * Patterns:
 *   "WARREN, Justice. All the Justices concur, except Boggs, C.J., and LaGrua, J., who dissent."
 *   "HODGES, Judge. Doyle, P. J., and Watkins, J., concur."
 *   "Per curiam. All Judges concur."
 *   "[***1] HODGES, Judge. Doyle, P. J., and Watkins, J., concur."
 */
function parseJudges(text) {
  if (!text) return { judges_text: '', author: null, panel: [], concur: [], dissent: [] };

  // Strip pagination markers like [***1]
  const clean = text.replace(/\[\*{1,3}\d+\]\s*/g, '').trim();

  const result = {
    judges_text: clean,
    author:      null,
    panel:       [],
    concur:      [],
    dissent:     [],
    per_curiam:  false,
  };

  // Per curiam check
  if (/per curiam/i.test(clean)) {
    result.per_curiam = true;
    result.author     = 'Per curiam';
  }

  // Author: "WARREN, Justice." or "HODGES, Judge." or "DOYLE, Presiding Judge."
  const authorRe = /^([A-Z][A-Z]+),\s+((?:Presiding\s+)?(?:Senior\s+)?(?:Chief\s+)?(?:Justice|Judge|C\.J\.|P\.J\.))\./i;
  const authorM  = authorRe.exec(clean);
  if (authorM) {
    result.author = authorM[1];
  }

  // Concurrence: "X, J., and Y, J., concur"
  const concurRe = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+(?:[A-Z]\.\s*J\.|Judge|Justice|P\.\s*J\.|C\.\s*J\.)/g;
  const afterAuthorText = authorM ? clean.slice(authorM.index + authorM[0].length) : clean;

  // Find concurring judges
  if (/concur/i.test(afterAuthorText)) {
    const concurSection = afterAuthorText.match(/^(.*?)\s*(?:,\s*)?concur/i);
    if (concurSection) {
      const names = [];
      let m;
      const nameRe = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+(?:[A-Z]\.\s*J\.|Judge|Justice|P\.\s*J\.|C\.\s*J\.|Presiding)/g;
      while ((m = nameRe.exec(concurSection[1])) !== null) {
        names.push(m[1]);
      }
      // Also handle "All the Justices concur" / "All Judges concur"
      if (/all\s+(?:the\s+)?(?:justices|judges)/i.test(concurSection[1])) {
        names.push('All Judges');
      }
      result.concur = names;
    }
  }

  // Find dissenting judges
  if (/dissent/i.test(afterAuthorText)) {
    const dissentSection = afterAuthorText.match(/(?:who\s+)?dissent(?:s|ing)?[^.]*?([A-Z][a-z]+(?:,\s+[A-Z][a-z]+)*)/i);
    if (dissentSection) {
      // Extract names before "who dissent"
      const dissentNames = [];
      const whoDissentRe = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s*(?:[A-Z]\.\s*J\.|C\.\s*J\.)[^.]*who dissent/i;
      const whoM = afterAuthorText.match(/except\s+(.+?)\s*,?\s*who dissent/i);
      if (whoM) {
        let m2;
        const nameRe2 = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s*(?:[A-Z]\.\s*J\.|C\.\s*J\.|P\.\s*J\.)?/g;
        while ((m2 = nameRe2.exec(whoM[1])) !== null) {
          if (m2[1] && m2[1] !== 'and') dissentNames.push(m2[1]);
        }
      }
      result.dissent = dissentNames;
    }
  }

  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 9 — DATE PARSING
// ══════════════════════════════════════════════════════════════════════════════

const MONTHS = {
  january: '01', february: '02', march: '03',    april: '04',
  may: '05',     june: '06',     july: '07',      august: '08',
  september: '09', october: '10', november: '11', december: '12',
};

/**
 * Parse "November 3, 2022, Decided" → { date_iso: "2022-11-03", status: "Decided", original: "November 3, 2022, Decided" }
 */
function parseDecisionDate(raw) {
  const text = cleanStr(raw);
  const result = { original: text, date_iso: null, status: null, display: null };

  const statusM = text.match(/,?\s*(Filed|Decided|Issued|Announced|Rendered)\s*$/i);
  if (statusM) result.status = statusM[1];

  const dateText = text.replace(/,?\s*(Filed|Decided|Issued|Announced|Rendered)\s*$/i, '').trim();
  result.display = dateText;

  const monthRe = /^(\w+)\s+(\d{1,2}),?\s+(\d{4})/;
  const mM = monthRe.exec(dateText);
  if (mM) {
    const month = MONTHS[mM[1].toLowerCase()];
    if (month) {
      const day  = mM[2].padStart(2, '0');
      result.date_iso = `${mM[3]}-${month}-${day}`;
    }
  }

  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 10 — DOCKET PARSING
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Parse docket number string. Handles:
 *   "A24A1262."       → single GA Court of Appeals docket
 *   "S23A0860."       → single GA Supreme Court docket
 *   "No. 18-13592"    → federal No. format
 *   "A22A1183, A22A1314." → multiple dockets
 */
function parseDocket(raw) {
  const text = cleanStr(raw).replace(/\.$/, '');
  const result = {
    raw:      text,
    numbers:  [],
    format:   null,
    primary:  null,
  };

  // Federal "No." format
  if (/^No\.\s*/i.test(text)) {
    const num = text.replace(/^No\.\s*/i, '').trim();
    result.numbers = [num];
    result.format  = 'federal';
    result.primary = num;
    return result;
  }

  // Multiple dockets: "A22A1183, A22A1314"
  const parts = text.split(/\s*,\s*/);
  result.numbers = parts.map(p => p.trim()).filter(Boolean);
  result.primary = result.numbers[0] || text;

  // Determine format
  if (/^[A-Z]\d+[A-Z]\d+/.test(result.primary)) {
    result.format = 'georgia_court_of_appeals';
  } else if (/^S\d{2}[A-Z]/.test(result.primary)) {
    result.format = 'georgia_supreme_court';
  } else {
    result.format = 'other';
  }

  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 11 — COURT PARSING
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Parse a court name string into a structured object.
 */
function parseCourt(name) {
  const result = {
    court_name:    name,
    is_federal:    false,
    is_supreme:    false,
    is_appellate:  false,
    is_trial:      false,
    jurisdiction:  null,
    circuit:       null,
  };

  if (!name) return result;

  if (/federal|united states|eleventh circuit|ninth circuit|\d+th circuit|\d+st circuit|\d+nd circuit|\d+rd circuit/i.test(name)) {
    result.is_federal = true;
  }
  if (/supreme court/i.test(name))               result.is_supreme   = true;
  if (/court of appeals|appellate/i.test(name))  result.is_appellate = true;
  if (/superior court|state court|district court|trial court/i.test(name)) result.is_trial = true;

  // Extract circuit number
  const circuitM = name.match(/(\d+)(?:st|nd|rd|th)\s+circuit/i);
  if (circuitM) result.circuit = parseInt(circuitM[1], 10);

  // Jurisdiction
  if (/georgia/i.test(name))       result.jurisdiction = 'Georgia';
  else if (/florida/i.test(name))  result.jurisdiction = 'Florida';
  else if (/eleventh circuit/i.test(name) || /11th circuit/i.test(name)) result.jurisdiction = 'Eleventh Circuit';

  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 12 — HTML BODY EXTRACTION (preserved from previous version)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Inject {fn:N} markers for footnote references in the opinion body HTML.
 */
function injectFnMarkers(html) {
  html = html.replace(
    /<sup><sup><a[^>]*href="#footnote-(\d+)"[^>]*>.*?<\/a><\/sup>\d*<\/sup>/gi,
    '{fn:$1}'
  );
  html = html.replace(
    /<sup>\s*<a[^>]*href="#footnote-(\d+)"[^>]*>.*?<\/a>\s*<\/sup>/gi,
    '{fn:$1}'
  );
  html = html.replace(
    /<sup>\s*<a[^>]*id="footnote-ref-(\d+)"[^>]*>.*?<\/a>\s*<\/sup>/gi,
    '{fn:$1}'
  );
  html = html.replace(
    /<a[^>]*id="footnote-ref-(\d+)"[^>]*>.*?<\/a>/gi,
    '{fn:$1}'
  );
  return html;
}

/**
 * Extract footnotes from mammoth HTML.
 * Returns Record<string, string>.
 */
function extractFootnotes(html) {
  const footnotes = {};
  const itemRe = /<li[^>]*id="footnote-(\d+)"[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = itemRe.exec(html)) !== null) {
    const num = m[1];
    let content = m[2];
    content = content.replace(/<a[^>]*href="#footnote-ref-\d+"[^>]*>[\s\S]*?<\/a>/gi, '');
    content = content.replace(/<a[^>]*id="Bookmark_[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '');
    content = content.replace(/^[\s\S]*?<sup>\d+\s*<\/sup>/i, '');
    content = stripHtml(content);
    if (content) footnotes[num] = content;
  }
  return footnotes;
}

/**
 * Remove the footnote <ol> block from body HTML.
 */
function removeFootnoteList(html) {
  // Remove ONLY the final <ol>...</ol> block (the footnote list), not lists within the opinion
  html = html.replace(/<ol>(?![\s\S]*<ol>)[\s\S]*?<\/ol>\s*$/i, '');
  html = html.replace(/<a[^>]*id="footnote-\d+"[^>]*><\/a>/gi, '');
  return html;
}

/**
 * Extract the opinion body HTML starting at the "Opinion" section.
 */
function extractBodyHtml(fullHtml) {
  const splitterRe = /<(p|h[1-6])[^>]*>(?:<a[^>]*><\/a>)?\s*(?:<(?:strong|em|b)>)?\s*Opinion(?!\s*(?:by|By|:))[\s\S]*?(?:<\/(?:strong|em|b)>)?\s*<\/(p|h[1-6])>/g;

  let lastMatch = null;
  let m;
  while ((m = splitterRe.exec(fullHtml)) !== null) {
    const inner = m[0].replace(/<[^>]*>/g, '').trim();
    if (/^Opinion$/i.test(inner)) lastMatch = m;
  }

  if (lastMatch) return fullHtml.slice(lastMatch.index + lastMatch[0].length);

  const anchorIdx = fullHtml.lastIndexOf('<a id="Opinion">');
  if (anchorIdx !== -1) {
    const closeP = fullHtml.indexOf('</p>', anchorIdx);
    if (closeP !== -1) return fullHtml.slice(closeP + 4);
  }

  return fullHtml;
}

/**
 * Remove boilerplate metadata paragraphs from the body HTML.
 */
function scrubBoilerplate(html) {
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
    sectionPat('Reporter'),
    sectionPat('Subsequent History:'),
    /<p[^>]*>[A-Z][A-Z\s,.'()]+v\.[A-Z\s,.'()]+<\/p>/g,
    /<(?:p|blockquote)[^>]*>(?:<[^>]+>)*\s*End of Document[\s\S]*?<\/(?:p|blockquote)>/gi,
    /<p[^>]*>(?:<a[^>]*><\/a>)?\s*<\/p>/gi,
  ];

  for (const re of patterns) html = html.replace(re, '');
  return html.trim();
}

/**
 * Wrap star-pagination tokens in a span for CSS styling.
 * Includes all preceding whitespace and two trailing spaces so they hide/show with the marker.
 */
/**
 * Wrap pagination markers in spans for toggle control.
 * Handles spacing rules from corpus analysis of all 176 opinions:
 *
 * RULE 1 (99.8%): \xa0[MARKER]\xa0 → \xa0<span>[MARKER]</span>\xa0
 *   Captures: non-breaking space before, marker, non-breaking space after
 *
 * RULE 2 (0.2%): [MARKER]\xa0 → <span>[MARKER]</span>\xa0
 *   Edge case: marker at line start with non-breaking space after
 *
 * Non-breaking spaces preserved outside spans so pagination hiding
 * maintains proper text flow.
 */
function markStarPagination(html) {
  // RULE 1: Non-breaking space before and after (\xa0[MARKER]\xa0)
  html = html.replace(
    /\xa0(\[\*{1,3}\d+\])\xa0/g,
    '\xa0<span class="star-pagination">$1</span>\xa0'
  );

  // RULE 2: Non-breaking space after only ([MARKER]\xa0)
  html = html.replace(
    /(\[\*{1,3}\d+\])\xa0/g,
    '<span class="star-pagination">$1</span>\xa0'
  );

  return html;
}

/**
 * Strip all hyperlinks from opinion text, preserving link text content.
 * Converts <a href="...">text</a> to just text
 */
function stripHyperlinks(html) {
  return html.replace(/<a[^>]*>([\s\S]*?)<\/a>/g, '$1');
}

/**
 * Apply Bluebook citation formatting to opinion HTML (Bluebook Rule 10).
 *
 * LexisNexis source DOCX files hyperlink case citations and sometimes italicize
 * them inside the <a> tag. After stripping hyperlinks, many citations are left
 * as plain text. This function re-applies proper Bluebook italics to case names.
 *
 * Rules applied:
 *   - Case names "Party v. Party" → <em>Party v. Party</em>
 *   - OCGA § references remain plain (no "v." pattern, not affected)
 *   - Already-italicized citations (inside <em>) are skipped (no double-wrap)
 *   - HTML tags are passed through unchanged
 *
 * Pattern matched: "[Word(s)] v. [Word(s)]" where both sides start uppercase,
 * stopping before the reporter citation (", 123 Ga." or "(2020)").
 */
function applyBluebookFormatting(html) {
  // Walk the HTML as alternating tag/text segments so we only touch text nodes
  const parts = html.split(/(<[^>]+>)/);
  let insideEm = false;

  return parts.map(part => {
    // HTML tag — track <em> depth and pass through unchanged
    if (part.startsWith('<')) {
      if (/^<em[\s>]/i.test(part))  insideEm = true;
      if (/^<\/em>/i.test(part))    insideEm = false;
      return part;
    }

    // Text inside an existing <em> — skip to avoid double-wrapping
    if (insideEm) return part;

    // Italicize case name patterns in plain text nodes.
    // Captures: "[Party1] v. [Party2]"
    // - Party names: one or more words starting uppercase, may include
    //   abbreviations (Inc., LLC., Corp.), apostrophes, hyphens
    // - Stops before reporter citation (", 123") or year "( 2020)" or sentence end
    return part.replace(
      /\b([A-Z][A-Za-z'&.,\u2019-]*(?:\s+[A-Za-z'&.,\u2019-]+){0,8}?)\s+v\.\s+([A-Z][A-Za-z'&.,\u2019-]*(?:\s+[A-Za-z'&.,\u2019-]+){0,6}?)(?=\s*,\s*\d|\s*\(\d{4}\)|\s*[.;]|$)/g,
      (match, p1, p2) => {
        const t1 = p1.trim();
        const t2 = p2.trim();
        // Sanity: both sides must start uppercase and have real content
        if (!t1 || !t2 || !/^[A-Z]/.test(t1) || !/^[A-Z]/.test(t2)) return match;
        // Citation signal words (Bluebook Table of Authorities) may be captured as
        // the start of p1 (e.g. "See Harris v. State" → p1 = "See Harris").
        // Strip the signal prefix and italicize only the true case name.
        const SIGNAL_PREFIX = /^(See|Cf\.|Compare|Accord|Contra|Although|However|Therefore|Thus|Similarly|Furthermore|Moreover|Additionally|Nevertheless|Accordingly)\.?\s+/;
        const signalMatch = t1.match(SIGNAL_PREFIX);
        if (signalMatch) {
          const signal    = signalMatch[0];           // e.g. "See "
          const caseName1 = t1.slice(signal.length);  // e.g. "Harris"
          if (!caseName1 || !/^[A-Z]/.test(caseName1)) return match;
          return `${signal}<em>${caseName1} v. ${t2}</em>`;
        }
        return `<em>${t1} v. ${t2}</em>`;
      }
    );
  }).join('');
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 13 — DOCX PRE-PROCESSING (blockquote injection via JSZip)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Inject "BlockQuote" paragraph style into Word XML for indented paragraphs
 * so that mammoth emits <blockquote> elements.
 *
 * NOTE: Uses non-greedy regex which may fail on complex nested XML (dense footnotes,
 * hyperlinks, etc.). Caller should wrap in try-catch and fallback to direct parsing.
 */
async function injectBlockquoteStyles(filePath) {
  const raw     = await fs.readFile(filePath);
  const zip     = await JSZip.loadAsync(raw);
  const docFile = zip.file('word/document.xml');
  if (!docFile) return raw;

  // Inject style definition
  const stylesFile = zip.file('word/styles.xml');
  if (stylesFile) {
    let stylesXml = await stylesFile.async('string');
    if (!stylesXml.includes('w:styleId="BlockQuote"')) {
      const def = `<w:style w:type="paragraph" w:styleId="BlockQuote"><w:name w:val="BlockQuote"/><w:basedOn w:val="Normal"/></w:style>`;
      stylesXml  = stylesXml.replace('</w:styles>', def + '</w:styles>');
      zip.file('word/styles.xml', stylesXml);
    }
  }

  // Tag indented paragraphs
  let xml = await docFile.async('string');
  xml = xml.replace(/<w:p[ >]([\s\S]*?)<\/w:p>/g, (para) => {
    const indM = para.match(/<w:ind[^/]*\bw:left="(\d+)"/);
    if (!indM || parseInt(indM[1], 10) < 200) return para;
    const styleM = para.match(/<w:pStyle\s+w:val="([^"]+)"/);
    if (styleM && styleM[1] !== 'Normal') return para;
    if (styleM) return para.replace(/<w:pStyle\s+w:val="[^"]*"/, '<w:pStyle w:val="BlockQuote"');
    if (para.includes('<w:pPr>'))   return para.replace('<w:pPr>', '<w:pPr><w:pStyle w:val="BlockQuote"/>');
    if (/<w:pPr\s/.test(para))     return para.replace(/<w:pPr ([^>]*)>/, '<w:pPr $1><w:pStyle w:val="BlockQuote"/>');
    return para.replace(/^<w:p([ >])/, '<w:p$1<w:pPr><w:pStyle w:val="BlockQuote"/></w:pPr>');
  });

  zip.file('word/document.xml', xml);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 14 — NOTICE TEXT EXTRACTION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Extract the Notice text if present in the raw lines.
 * Some opinions carry an "THIS OPINION IS UNCORRECTED..." notice.
 */
function extractNotice(sections) {
  if (!sections['Notice'] || sections['Notice'].length === 0) return '';
  return sections['Notice'].join(' ');
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 15 — MAIN PARSER
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Parse a single .docx file into a complete CaseLaw record.
 */
async function parseDocxFile(filename) {
  const filePath = path.join(RAW_DIR, filename);

  // ── 1. Raw text extraction ────────────────────────────────────────────────
  const rawResult = await mammoth.extractRawText({ path: filePath });
  const sections  = parseRawLines(rawResult.value);
  const hdr       = sections._header;

  // ── 2. Full HTML (for body + footnotes + blockquotes) ─────────────────────
  // Try blockquote injection with fallback for complex nested XML.
  // The injectBlockquoteStyles() regex can fail on dense footnote structures.
  let htmlResult;
  let usedBlockquoteInjection = true;

  try {
    const modifiedBuffer = await injectBlockquoteStyles(filePath);
    // Verify buffer is not corrupted by checking it's a valid ZIP/buffer
    if (!modifiedBuffer || modifiedBuffer.length === 0) {
      throw new Error('Empty buffer from blockquote injection');
    }
    htmlResult = await mammoth.convertToHtml(
      { buffer: modifiedBuffer },
      { styleMap: ["p[style-name='BlockQuote'] => blockquote:fresh"] }
    );
    // Detect truncation: if HTML is much smaller than expected, fallback
    // For complex nested XML (especially with dense footnotes), extraction often fails silently
    const docxSize = (await fs.stat(filePath)).size;
    const htmlSize = htmlResult.value.length;
    const ratio = htmlSize / docxSize;
    // Flag for: very low ratio (<0.35) OR suspiciously low ratio even for small files
    if (ratio < 0.35 || (docxSize > 20000 && ratio < 0.4)) {
      throw new Error(`Suspected truncation: ${ratio.toFixed(2)}x ratio (${htmlSize} bytes HTML from ${docxSize} byte DOCX)`);
    }
  } catch (err) {
    // Fallback: parse without blockquote styling injection
    console.warn(`Blockquote injection failed for ${filename}: ${err.message}. Using direct parsing.`);
    usedBlockquoteInjection = false;
    htmlResult = await mammoth.convertToHtml({ path: filePath });
  }

  const fullHtml = htmlResult.value;

  // ── 3. Parse header fields ────────────────────────────────────────────────
  const title   = cleanStr(hdr.title);
  const court   = cleanStr(hdr.court);
  const dateInfo = parseDecisionDate(hdr.dateRaw);
  const docket   = parseDocket(hdr.docket);

  // ── 4. Citation line ──────────────────────────────────────────────────────
  // Reporter citations are in the header (line 4), not as a section label
  const citationLine = hdr.citations || '';
  const reporterCitations = parseCitationLine(citationLine);

  // ── 5. Formal case name ───────────────────────────────────────────────────
  const formalCaseName = cleanStr(sections.formalCaseName || '');

  // ── 6. Prior History ─────────────────────────────────────────────────────
  const priorHistoryData = parsePriorHistory(sections['Prior History'] || []);
  const priorHistoryText = priorHistoryData ? priorHistoryData.prior_history_text : '';

  // ── 7. Subsequent History ─────────────────────────────────────────────────
  const subsequentHistoryLines = sections['Subsequent History'] || [];
  const subsequentHistory      = parseSubsequentHistory(subsequentHistoryLines);

  // ── 8. Disposition ────────────────────────────────────────────────────────
  const dispositionRaw  = sections['Disposition']
    ? cleanStr(sections['Disposition'].join(' '))
    : '';
  const dispositionData = parseDisposition(dispositionRaw);

  // ── 9. Counsel ────────────────────────────────────────────────────────────
  const counselLines = sections['Counsel'] || [];
  const counselData  = parseCounsel(counselLines);

  // ── 10. Judges ────────────────────────────────────────────────────────────
  const judgesRaw  = sections['Judges']
    ? cleanStr(sections['Judges'].join(' '))
    : '';
  const judgesData = parseJudges(judgesRaw);

  // ── 11. Opinion author ────────────────────────────────────────────────────
  const opinionByLines = sections['Opinion by'] || [];
  let opinionAuthor    = cleanStr(opinionByLines[0] || '');
  if (opinionAuthor) {
    opinionAuthor = opinionAuthor
      .replace(/^(Judge|Justice|Presiding Judge|Chief Judge|Senior Judge)\s+/i, '')
      .toUpperCase();
  }
  if (!opinionAuthor && judgesData.per_curiam) opinionAuthor = 'PER CURIAM';

  // ── 12. Notice text ───────────────────────────────────────────────────────
  const noticeText = extractNotice(sections);

  // ── 13. Extract body HTML ─────────────────────────────────────────────────
  let bodyHtml = extractBodyHtml(fullHtml);
  bodyHtml     = scrubBoilerplate(bodyHtml);
  bodyHtml     = removeFootnoteList(bodyHtml);
  bodyHtml     = injectFnMarkers(bodyHtml);
  bodyHtml     = markStarPagination(bodyHtml);
  bodyHtml     = stripHyperlinks(bodyHtml);
  bodyHtml     = applyBluebookFormatting(bodyHtml);

  // ── 14. Extract footnotes ─────────────────────────────────────────────────
  const footnotes = extractFootnotes(fullHtml);

  // ── 15. Build court information ───────────────────────────────────────────
  const courtInfo = parseCourt(court);

  // ── 16. Assemble the record ───────────────────────────────────────────────
  const slug = toSlug(filename);

  return {
    // ── CaseLaw interface fields (frontend-compatible) ──────────────────────
    id:             slug,
    slug,
    title,
    shortTitle:     shortTitle(title),
    court,
    docketNumber:   docket.numbers.join(', ') || hdr.docket,
    dateDecided:    dateInfo.display || cleanDate(hdr.dateRaw),
    citations:      citationLine,
    judges:         judgesData.judges_text,
    disposition:    dispositionData.disposition_text,
    coreTerms:      [],
    summary:        'Summary pending.',
    holdingBold:    '',
    conclusionText: '',
    opinionAuthor,
    opinionText:    bodyHtml,
    footnotes,
    publishedAt:    new Date().toISOString().slice(0, 10),
    noticeText,
    priorHistory:   priorHistoryText,

    // ── Extended metadata fields (per Complete Metadata Specification) ───────

    // Case identification
    case_caption_short:   title,
    case_caption_formal:  formalCaseName,
    decision_date_iso:    dateInfo.date_iso,
    decision_status:      dateInfo.status,

    // Docket
    docket: {
      raw:         docket.raw,
      numbers:     docket.numbers,
      primary:     docket.primary,
      format:      docket.format,
    },

    // Court
    court_info: courtInfo,

    // Citations
    reporter_citations:    reporterCitations,
    citation_line_complete: citationLine,

    // Prior history (structured)
    prior_history: priorHistoryData,

    // Subsequent history
    subsequent_history:          subsequentHistory,
    has_subsequent_history:      subsequentHistory.length > 0,

    // Disposition (structured)
    disposition_structured: dispositionData,

    // Counsel
    counsel: counselData,

    // Judges (structured)
    judges_structured: judgesData,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 16 — ENTRY POINT
// ══════════════════════════════════════════════════════════════════════════════

async function run() {
  try {
    await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });

    let existingCases = [];
    try {
      const existingRaw = await fs.readFile(OUTPUT_FILE, 'utf8');
      existingCases = JSON.parse(existingRaw);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    const existingSlugMap = getExistingSlugMap(existingCases);

    const files = (await fs.readdir(RAW_DIR))
      .filter(f => /\.docx?$/i.test(f))
      .sort();

    console.log(`\nScanning ${files.length} opinion files for new cases...\n`);

    const results = [...existingCases];
    let ok = 0;
    let errors = 0;
    let skipped = 0;

    for (const file of files) {
      const slug = toSlug(file);
      if (existingSlugMap.has(slug)) {
        skipped++;
        continue;
      }

      try {
        process.stdout.write(`  [+] ${file.slice(0, 72).padEnd(72)}\r`);
        const caseData = await parseDocxFile(file);
        results.push(caseData);
        existingSlugMap.set(caseData.slug, caseData);
        ok++;
      } catch (err) {
        console.error(`\n  [!] FAILED: ${file}\n      ${err.message}`);
        errors++;
      }
    }

    // Sort newest-first by ISO date, then by title
    results.sort((a, b) => {
      const da = a.decision_date_iso || a.dateDecided || '';
      const db = b.decision_date_iso || b.dateDecided || '';
      if (da < db) return 1;
      if (da > db) return -1;
      return (a.title || '').localeCompare(b.title || '');
    });

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf8');

    console.log(`\n  Added   : ${ok}`);
    console.log(`  Skipped : ${skipped}`);
    if (errors > 0) console.log(`  Failed  : ${errors}`);
    console.log(`  Output  : ${OUTPUT_FILE}\n`);
  } catch (err) {
    console.error('Fatal:', err.message);
    process.exit(1);
  }
}

run();
