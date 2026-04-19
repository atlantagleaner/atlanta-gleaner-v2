const fs = require('fs').promises;
const path = require('path');

const CASES_FILE = path.resolve(__dirname, '..', 'src/data/cases.json');
const SIGNAL_PREFIX = /^(See|Cf\.|Compare|Accord|Contra|Although|However|Therefore|Thus|Similarly|Furthermore|Moreover|Additionally|Nevertheless|Accordingly)\.?\s+/;

/**
 * Apply Bluebook citation formatting to footnote text.
 * Handles both full case names "X v. Y" and short-form citations "Name, Citation"
 */
function applyBluebookFormatting(text) {
  if (!text || typeof text !== 'string') return text;

  // Pattern 1: Full case names "[Party1] v. [Party2]"
  let result = text.replace(
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
  // Handles multi-word case names: "Southern Bell, 254 Ga." or "Gomez and Smith, 254 Ga."
  result = result.replace(
    /\b([A-Z](?:[A-Za-z'&.,\u2019-]*\s+)*[A-Z][A-Za-z'&.,\u2019-]*(?:\s+(?:and|or|&)\s+[A-Z][A-Za-z'&.,\u2019-]*)*)(?:\s*,\s*(?:\d+\s+)?(?:U\.S\.|S\.Ct\.|L\.Ed|F\.[2-3]d|Ga\.|App\.|LEXIS|WL)(?:\s|$|\d|\.|\)))/g,
    (match) => {
      const commaIdx = match.indexOf(',');
      if (commaIdx === -1) return match;
      const caseName = match.slice(0, commaIdx).trim();
      const citation = match.slice(commaIdx, -1).trim();

      if (/^\d|^§/.test(caseName)) return match;
      if (caseName.length < 3) return match;
      if (SIGNAL_PREFIX.test(caseName)) return match;
      if (/\bv\.\s+/.test(caseName)) return match;

      return `<em>${caseName}</em>${citation}${match.slice(-1)}`;
    }
  );

  return result;
}

async function main() {
  console.log('Applying Bluebook formatting to footnotes...\n');

  const cases = JSON.parse(await fs.readFile(CASES_FILE, 'utf-8'));
  let updated = 0;
  let totalFootnotes = 0;
  let footnotesCited = 0;

  for (const caseRecord of cases) {
    if (!caseRecord.footnotes) continue;

    let caseUpdated = false;
    for (const key of Object.keys(caseRecord.footnotes)) {
      const originalText = caseRecord.footnotes[key];
      totalFootnotes++;

      // Only format if it contains potential case citations
      if (originalText.includes(' v. ') || originalText.match(/,\s*\d+\s+(?:U\.S\.|Ga\.|F\.|LEXIS)/)) {
        footnotesCited++;
        const formatted = applyBluebookFormatting(originalText);
        if (formatted !== originalText) {
          caseRecord.footnotes[key] = formatted;
          caseUpdated = true;
        }
      }
    }

    if (caseUpdated) {
      updated++;
    }
  }

  await fs.writeFile(CASES_FILE, JSON.stringify(cases, null, 2));
  console.log(`✓ Updated ${updated} cases with footnote formatting`);
  console.log(`✓ Total footnotes: ${totalFootnotes}`);
  console.log(`✓ Footnotes with citations: ${footnotesCited}`);
  console.log('✓ cases.json saved');
}

main().catch(console.error);
