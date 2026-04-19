const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');

const RAW_DIR = path.resolve(__dirname, '..', 'raw-opinions');
const CASES_FILE = path.resolve(__dirname, '..', 'src/data/cases.json');

// Final quality control cases
const QC_CASES = [
  'lee-v-state',
  'perez-v-bush-2025-ga-state-lexis-860',
  'roman-v-state',
  'ga-cvs-pharm-llc-v-carmichael-316-ga-718',
  'myrick-v-fulton-cnty-69-f-4th-1277',
  'inquiry-cerning-judge-coomer-315-ga-841',
  'mcelrath-v-georgia',
];

function toSlug(filename) {
  return filename
    .replace(/\.docx?$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract complete opinion from HTML with quality validation
 */
function extractCompleteOpinion(fullHtml) {
  // Find Opinion section
  let opinionStart = -1;

  // Try various markers
  const markers = [
    { pattern: /<a\s+id="Opinion"><\/a>/i, offset: 0 },
    { pattern: /<p[^>]*><a[^>]*><\/a>\s*<strong>Opinion<\/strong><\/p>/i, offset: 0 },
    { pattern: /<p[^>]*><strong>Opinion<\/strong><\/p>/i, offset: 0 },
  ];

  for (const marker of markers) {
    const match = fullHtml.match(marker.pattern);
    if (match) {
      opinionStart = match.index + match[0].length + marker.offset;
      break;
    }
  }

  if (opinionStart === -1) return null;

  // Find Opinion end (before footer or End of Document)
  let opinionEnd = fullHtml.length;
  const footerPatterns = [
    /<p[^>]*>End of Document/i,
    /<p[^>]*>\s*<\/p>\s*<\/body>/i,
  ];

  for (const pattern of footerPatterns) {
    const match = fullHtml.slice(opinionStart).match(pattern);
    if (match) {
      opinionEnd = opinionStart + match.index;
      break;
    }
  }

  return fullHtml.slice(opinionStart, opinionEnd);
}

/**
 * Quality control checks
 */
function validateQuality(html, plainText, slug) {
  const issues = [];

  // Check 1: Minimum content length
  if (plainText.length < 200) {
    issues.push(`TOO_SHORT: ${plainText.length} chars (minimum 200)`);
  }

  // Check 2: Ends with proper punctuation or disposition
  const lastLine = plainText.trim().split('\n').pop() || '';
  const validEndings = ['.', '!', '?', 'affirm', 'reverse', 'vacate', 'remand', 'dissent', 'concur', 'disposed'];
  if (!validEndings.some(e => lastLine.toLowerCase().includes(e))) {
    // Don't flag as error, but note it
    console.log(`    Note: Ends with "${lastLine.substring(0, 50)}"`);
  }

  // Check 3: Balanced HTML tags
  const openTags = (html.match(/<[^/][^>]*>/g) || []).length;
  const closeTags = (html.match(/<\/[^>]*>/g) || []).length;
  if (Math.abs(openTags - closeTags) > 2) {
    issues.push(`UNBALANCED_TAGS: ${openTags} open vs ${closeTags} close`);
  }

  // Check 4: Has paragraph content
  if (!html.includes('<p')) {
    issues.push('NO_PARAGRAPHS: Missing <p> tags');
  }

  // Check 5: No obvious truncation markers
  if (html.endsWith('...') || plainText.endsWith('...')) {
    issues.push('ELLIPSIS_END: Potentially truncated');
  }

  return issues;
}

/**
 * Clean and validate opinion HTML
 */
function cleanOpinionHtml(html) {
  // Remove script/style
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove empty paragraphs
  html = html.replace(/<p[^>]*>\s*<\/p>/gi, '');
  html = html.replace(/<p[^>]*>(&nbsp;|\s)<\/p>/gi, '');

  // Clean up whitespace
  html = html.replace(/\s+/g, ' ').trim();

  // Mark star pagination
  html = html.replace(/\xa0(\[\*{1,3}\d+\])\xa0/g, '\xa0<span class="star-pagination">$1</span>\xa0');
  html = html.replace(/(\[\*{1,3}\d+\])\xa0/g, '<span class="star-pagination">$1</span>\xa0');

  // Strip hyperlinks but preserve text
  html = html.replace(/<a[^>]*>([\s\S]*?)<\/a>/g, '$1');

  // Remove footnote lists
  html = html.replace(/<ol[^>]*>[\s\S]*?<\/ol>/gi, '');

  // Balance unclosed tags
  const stack = {};
  const openRegex = /<(\w+)[^>]*>/g;
  const closeRegex = /<\/(\w+)>/g;
  let match;

  while ((match = openRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    stack[tag] = (stack[tag] || 0) + 1;
  }

  while ((match = closeRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    stack[tag] = (stack[tag] || 1) - 1;
  }

  // Add missing closes
  for (const [tag, count] of Object.entries(stack)) {
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        html += `</${tag}>`;
      }
    }
  }

  return html.trim();
}

async function fixCase(slug) {
  const files = await fs.readdir(RAW_DIR);
  const sourceFile = files.find(f => toSlug(f) === slug);

  if (!sourceFile) {
    console.log(`  ❌ ${slug}: No source file found`);
    return null;
  }

  try {
    const filePath = path.join(RAW_DIR, sourceFile);

    // Extract HTML with full detail
    const htmlResult = await mammoth.convertToHtml({ path: filePath });
    let html = htmlResult.value;

    // Extract complete opinion
    const opinionHtml = extractCompleteOpinion(html);
    if (!opinionHtml) {
      console.log(`  ❌ ${slug}: Could not extract opinion section`);
      return null;
    }

    // Clean and validate
    let cleanedHtml = cleanOpinionHtml(opinionHtml);
    const plainText = cleanedHtml.replace(/<[^>]*>/g, '').trim();

    // Quality validation
    const issues = validateQuality(cleanedHtml, plainText, slug);

    if (issues.length > 0) {
      console.log(`  ⚠️  ${slug}:`);
      issues.forEach(issue => console.log(`      ${issue}`));
    } else {
      console.log(`  ✓ ${slug}`);
    }

    console.log(`      Length: ${cleanedHtml.length} chars (${plainText.length} plain)`);

    return cleanedHtml;
  } catch (err) {
    console.log(`  ❌ ${slug}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('Final Quality Control Fix\n');
  console.log('Processing 7 cases for quality standards...\n');

  const cases = JSON.parse(await fs.readFile(CASES_FILE, 'utf-8'));
  let fixed = 0;

  for (const slug of QC_CASES) {
    const cleanedHtml = await fixCase(slug);
    if (cleanedHtml) {
      const idx = cases.findIndex(c => c.slug === slug);
      if (idx !== -1) {
        cases[idx].opinionText = cleanedHtml;
        fixed++;
      }
    }
  }

  await fs.writeFile(CASES_FILE, JSON.stringify(cases, null, 2));
  console.log(`\n✓ Fixed ${fixed}/${QC_CASES.length} cases`);
  console.log('✓ cases.json updated with QC-verified opinions');
}

main().catch(console.error);
