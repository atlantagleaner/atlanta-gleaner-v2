const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');

const RAW_DIR = path.resolve(__dirname, '..', 'raw-opinions');
const CASES_FILE = path.resolve(__dirname, '..', 'src/data/cases.json');

// All 24 problematic cases
const PROBLEM_CASES = [
  'fleureme-v-city-of-atlanta-2026-ga-app-lexis-37',
  'lee-v-state',
  'brown-v-state',
  'harris-v-state',
  'perez-v-bush-2025-ga-state-lexis-860',
  'roman-v-state',
  'honeyfund-com-inc-v-governor-94-f-4th-1272',
  'lodge-v-united-states-ag-92-f-4th-1298',
  'united-states-v-tia-deyon-pugh-90-f-4th-1318',
  'rose-v-sec-y-87-f-4th-469',
  'hartwell-r-r-co-v-hartwell-first-united-methodist-church-370-ga-app-134',
  'campbell-v-universal-city-dev-partners-ltd-72-f-4th-1245',
  'myrick-v-fulton-cnty-69-f-4th-1277',
  'inquiry-cerning-judge-coomer-315-ga-841',
  'brown-v-state-367-ga-app-114',
  'adams-v-sch-bd-of-st-johns-cnty-57-f-4th-791',
  'united-states-v-perez-quevedo-2022-u-s-app-lexis-35958',
];

function toSlug(filename) {
  return filename
    .replace(/\.docx?$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Aggressive HTML cleaning for corrupted/malformed opinion text
 */
function aggressiveClean(html) {
  // Remove script/style tags
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Fix unclosed tags by closing them before certain block elements
  const blockTags = ['p', 'div', 'blockquote', 'ol', 'ul', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  for (const tag of blockTags) {
    const regex = new RegExp(`<${tag}[^>]*>(?![\s\S]*?</${tag}>)`, 'gi');
    html = html.replace(regex, `<${tag}>`);
  }

  // Balance all opening/closing tags
  const tagStack = [];
  const openRegex = /<(\w+)[^>]*>/g;
  const closeRegex = /<\/(\w+)>/g;

  // Find all tags and track balance
  let match;
  const opens = {};
  const closes = {};

  while ((match = openRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    opens[tag] = (opens[tag] || 0) + 1;
  }

  while ((match = closeRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    closes[tag] = (closes[tag] || 0) + 1;
  }

  // Add closing tags where needed
  for (const [tag, count] of Object.entries(opens)) {
    const closeCount = closes[tag] || 0;
    if (count > closeCount) {
      const diff = count - closeCount;
      for (let i = 0; i < diff; i++) {
        html += `</${tag}>`;
      }
    }
  }

  // Remove obvious corrupted content markers
  html = html.replace(/↑/g, '');
  html = html.replace(/\[?\*{1,3}\d+\]?/g, match => {
    // Preserve actual star pagination markers
    if (/^\[\*{1,3}\d+\]$/.test(match)) return match;
    return '';
  });

  return html.trim();
}

/**
 * Extract opinion section from full HTML, with fallback strategies
 */
function extractOpinionSection(fullHtml) {
  // Strategy 1: Find Opinion header and extract everything after
  const opinionMarkers = [
    /<a\s+id="Opinion"><\/a>/i,
    /<(?:p|h[1-6])[^>]*>\s*Opinion\s*<\/(?:p|h[1-6])>/i,
    /<p[^>]*><strong>Opinion<\/strong><\/p>/i,
  ];

  for (const marker of opinionMarkers) {
    const match = fullHtml.match(marker);
    if (match) {
      const idx = match.index + match[0].length;
      const afterOpinion = fullHtml.slice(idx);

      // Remove footer sections
      const footerMatch = afterOpinion.match(/<(?:p|div)[^>]*>(?:<[^>]+>)*\s*End of Document/i);
      if (footerMatch) {
        return afterOpinion.slice(0, footerMatch.index);
      }

      return afterOpinion;
    }
  }

  // Fallback: return full HTML if Opinion section not found
  return fullHtml;
}

/**
 * Remove boilerplate sections
 */
function removeBoilerplate(html) {
  const boilerplatePatterns = [
    /<p[^>]*>(?:<a[^>]*><\/a>)?\s*(?:<(?:strong|em|b)>)?(?:Counsel|Judges|Opinion\s+by|Prior History|Disposition|Notice|Reporter|Subsequent History)(?:<\/(?:strong|em|b)>)?[\s\S]*?<\/p>/gi,
    /<p[^>]*>[A-Z][A-Z\s,.'()]*v\.[A-Z\s,.'()]*<\/p>/g,
    /<p[^>]*>(?:<a[^>]*><\/a>)?\s*<\/p>/gi,
  ];

  for (const pattern of boilerplatePatterns) {
    html = html.replace(pattern, '');
  }

  return html.trim();
}

async function fixCase(slug) {
  const files = await fs.readdir(RAW_DIR);
  const sourceFile = files.find(f => toSlug(f) === slug);

  if (!sourceFile) {
    console.log(`  ❌ No source file for ${slug}`);
    return null;
  }

  try {
    const filePath = path.join(RAW_DIR, sourceFile);
    const htmlResult = await mammoth.convertToHtml({ path: filePath });
    let html = htmlResult.value;

    // Extract opinion section
    html = extractOpinionSection(html);

    // Remove boilerplate
    html = removeBoilerplate(html);

    // Remove footnote lists
    html = html.replace(/<ol[^>]*>[\s\S]*?<\/ol>/gi, '');

    // Mark star pagination
    html = html.replace(/\xa0(\[\*{1,3}\d+\])\xa0/g, '\xa0<span class="star-pagination">$1</span>\xa0');
    html = html.replace(/(\[\*{1,3}\d+\])\xa0/g, '<span class="star-pagination">$1</span>\xa0');

    // Strip hyperlinks
    html = html.replace(/<a[^>]*>([\s\S]*?)<\/a>/g, '$1');

    // Aggressive cleanup for malformed HTML
    html = aggressiveClean(html);

    const plainText = html.replace(/<[^>]*>/g, '').trim();
    console.log(`  ✓ ${slug}: ${html.length} chars (${plainText.length} plain)`);

    return html;
  } catch (err) {
    console.log(`  ❌ ${slug}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('Manually fixing all 24 problematic cases...\n');

  const cases = JSON.parse(await fs.readFile(CASES_FILE, 'utf-8'));
  let fixed = 0;

  for (const slug of PROBLEM_CASES) {
    const newHtml = await fixCase(slug);
    if (newHtml) {
      const idx = cases.findIndex(c => c.slug === slug);
      if (idx !== -1) {
        cases[idx].opinionText = newHtml;
        fixed++;
      }
    }
  }

  await fs.writeFile(CASES_FILE, JSON.stringify(cases, null, 2));
  console.log(`\n✓ Fixed ${fixed}/${PROBLEM_CASES.length} cases`);
  console.log('✓ cases.json updated');
}

main().catch(console.error);
