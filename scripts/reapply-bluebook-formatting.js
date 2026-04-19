const fs = require('fs').promises;
const path = require('path');

const CASES_FILE = path.resolve(__dirname, '..', 'src/data/cases.json');
const SIGNAL_PREFIX = /^(See|Cf\.|Compare|Accord|Contra|Although|However|Therefore|Thus|Similarly|Furthermore|Moreover|Additionally|Nevertheless|Accordingly)\.?\s+/;

/**
 * Apply Bluebook citation formatting to opinion HTML.
 * Handles both full case names "X v. Y" and short-form citations "Name, Citation"
 */
function applyBluebookFormatting(html) {
  // Step 1: Strip all <em> tags to start fresh
  html = html.replace(/<\/?em>/g, '');

  // Step 2: Process text nodes (avoiding HTML tags)
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

    // Pattern 1: Full case names "[Party1] v. [Party2]"
    let result = part.replace(
      /\b([A-Z][A-Za-z'&.,\u2019-]*(?:\s+[A-Za-z'&.,\u2019-]+){0,8}?)\s+v\.\s+([A-Z][A-Za-z'&.,\u2019-]*(?:\s+[A-Za-z'&.,\u2019-]+){0,6}?)(?=\s*,\s*\d|\s*\(\d{4}\)|\s*[.;]|$)/g,
      (match, p1, p2) => {
        const t1 = p1.trim();
        const t2 = p2.trim();
        if (!t1 || !t2 || !/^[A-Z]/.test(t1) || !/^[A-Z]/.test(t2)) return match;
        const signalMatch = t1.match(SIGNAL_PREFIX);
        if (signalMatch) {
          const signal    = signalMatch[0];
          const caseName1 = t1.slice(signal.length);
          if (!caseName1 || !/^[A-Z]/.test(caseName1)) return match;
          return `${signal}<em>${caseName1} v. ${t2}</em>`;
        }
        return `<em>${t1} v. ${t2}</em>`;
      }
    );

    // Pattern 2: Short-form case citations "[CaseName], [Citation]"
    // Match: Case name followed by comma, then digits and reporter (no word boundary after reporter)
    result = result.replace(
      /\b([A-Z][A-Za-z'&.,\u2019-]*(?:\s+(?:and|or|&)\s+)?(?:[A-Z][A-Za-z'&.,\u2019-]*)?)(?:\s*,\s*(?:\d+\s+)?(?:U\.S\.|S\.Ct\.|L\.Ed|F\.[2-3]d|Ga\.|App\.|LEXIS|WL)(?:\s|$|\d|\.|\)))/g,
      (match) => {
        const commaIdx = match.indexOf(',');
        if (commaIdx === -1) return match;
        const caseName = match.slice(0, commaIdx).trim();
        const citation = match.slice(commaIdx, -1).trim(); // Remove trailing whitespace

        if (/^\d|^§/.test(caseName)) return match;
        if (caseName.length < 3) return match;
        if (SIGNAL_PREFIX.test(caseName)) return match;
        if (/\bv\.\s+/.test(caseName)) return match;

        // Restore the trailing character that was consumed by the lookahead
        return `<em>${caseName}</em>${citation}${match.slice(-1)}`;
      }
    );

    return result;
  }).join('');
}

async function main() {
  console.log('Reapplying Bluebook formatting to all case opinions...\n');

  const cases = JSON.parse(await fs.readFile(CASES_FILE, 'utf-8'));
  let updated = 0;

  for (const caseRecord of cases) {
    if (caseRecord.opinionText) {
      const formatted = applyBluebookFormatting(caseRecord.opinionText);
      if (formatted !== caseRecord.opinionText) {
        caseRecord.opinionText = formatted;
        updated++;
      }
    }
  }

  await fs.writeFile(CASES_FILE, JSON.stringify(cases, null, 2));
  console.log(`✓ Updated ${updated}/${cases.length} cases with enhanced Bluebook formatting`);
  console.log('✓ cases.json saved');
}

main().catch(console.error);
