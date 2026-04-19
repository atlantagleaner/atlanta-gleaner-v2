const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');

const RAW_DIR = path.resolve(__dirname, '..', 'raw-opinions');
const CASES_FILE = path.resolve(__dirname, '..', 'src', 'data', 'cases.json');

// Problematic cases from audit
const PROBLEM_CASES = [
  'ga-cvs-pharm-llc-v-carmichael-316-ga-718',
  'allred-v-progressive-cty-mut-ins-co-374-ga-app-876',
  'royal-v-state-farm-mut-auto-ins-co-366-ga-app-313',
];

function toSlug(filename) {
  return filename
    .replace(/\.docx?$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripHtml(s) {
  return (s || '').replace(/<[^>]*>/g, '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

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

function removeFootnoteList(html) {
  return html.replace(/<ol[^>]*>[\s\S]*?<\/ol>/gi, '');
}

function markStarPagination(html) {
  html = html.replace(/\xa0(\[\*{1,3}\d+\])\xa0/g, '\xa0<span class="star-pagination">$1</span>\xa0');
  html = html.replace(/(\[\*{1,3}\d+\])\xa0/g, '<span class="star-pagination">$1</span>\xa0');
  return html;
}

function stripHyperlinks(html) {
  return html.replace(/<a[^>]*>([\s\S]*?)<\/a>/g, '$1');
}

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

async function reprocessCase(slug) {
  // Find the source file
  const files = await fs.readdir(RAW_DIR);
  const sourceFile = files.find(f => toSlug(f) === slug);

  if (!sourceFile) {
    console.log(`❌ No source file found for ${slug}`);
    return null;
  }

  const filePath = path.join(RAW_DIR, sourceFile);

  try {
    // Extract HTML
    const htmlResult = await mammoth.convertToHtml({ path: filePath });
    const fullHtml = htmlResult.value;

    // Process body
    let bodyHtml = extractBodyHtml(fullHtml);
    bodyHtml = scrubBoilerplate(bodyHtml);
    bodyHtml = removeFootnoteList(bodyHtml);
    bodyHtml = markStarPagination(bodyHtml);
    bodyHtml = stripHyperlinks(bodyHtml);

    const plainText = stripHtml(bodyHtml);

    console.log(`✓ ${slug}`);
    console.log(`  Source: ${sourceFile}`);
    console.log(`  New opinion length: ${bodyHtml.length} chars (${plainText.length} chars plain text)`);

    return bodyHtml;
  } catch (err) {
    console.log(`❌ Error processing ${slug}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('Re-processing problematic cases...\n');

  // Load current cases
  const cases = JSON.parse(await fs.readFile(CASES_FILE, 'utf-8'));

  // Reprocess each problem case
  for (const slug of PROBLEM_CASES) {
    const newOpinionText = await reprocessCase(slug);
    if (newOpinionText) {
      const caseIndex = cases.findIndex(c => c.slug === slug);
      if (caseIndex !== -1) {
        const oldLength = cases[caseIndex].opinionText.length;
        cases[caseIndex].opinionText = newOpinionText;
        console.log(`  Updated: ${oldLength} → ${newOpinionText.length} chars\n`);
      }
    }
  }

  // Write back
  await fs.writeFile(CASES_FILE, JSON.stringify(cases, null, 2));
  console.log('\n✓ cases.json updated');
}

main().catch(console.error);
