const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');

// Paths specific to your local setup
const RAW_DIR = "C:\\Users\\arjun\\Desktop\\Atlanta Gleaner Code\\atlanta-gleaner-v2\\raw-opinions";
const OUTPUT_FILE = path.join(__dirname, '../src/data/cases.json');

async function parseDocxFile(filename) {
  const filePath = path.join(RAW_DIR, filename);
  
  const rawResult = await mammoth.extractRawText({ path: filePath });
  const allLines = rawResult.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const htmlResult = await mammoth.convertToHtml({ path: filePath });
  let fullHtml = htmlResult.value;

  // 1. EXTRACT METADATA
  const caseData = {
    slug: filename.toLowerCase().replace(/\.docx?$/, '').replace(/[^a-z0-9]+/g, '-'),
    noticeBanner: allLines.find(l => /^Notice:/i.test(l)) || "",
    metadata: {
      title: allLines[0] || '',
      court: allLines[1] || '',
      dateDecided: (allLines[2] || '').replace(/,\s*Decided/i, ''),
      docketNo: (allLines[3] || '').replace(/\.$/, ''),
      citations: allLines[5] || ''
    },
    holding: '',
    opinionAuthor: '',
    opinionBody: '',
    footnotes: [],
    summary: 'Summary pending...'
  };

  // 2. EXTRACT HOLDING & AUTHOR
  allLines.forEach(l => {
    if (/^Disposition:/i.test(l)) caseData.holding = l.replace(/^Disposition:/i, '').trim();
    if (/^Opinion by:/i.test(l)) {
      caseData.opinionAuthor = l.replace(/^Opinion by:/i, '')
        .replace(/^(Judge|Justice|Presiding Judge|Chief Judge)\s+/i, '')
        .replace(/\u00A0/g, ' ')
        .trim()
        .toUpperCase();
    }
  });

  // 3. ROBUST BODY SPLITTING
  // Targets "Opinion" in almost any tag or casing
  const splitter = /<(p|h\d|strong|em)[^>]*>\s*(<strong>|<em>)?\s*Opinion\s*(<\/strong>|<\/em>)?\s*<\/(p|h\d|strong|em)>/i;
  const parts = fullHtml.split(splitter);
  let bodyHtml = parts.length > 1 ? parts[parts.length - 1] : fullHtml;

  // 4. AGGRESSIVE CLEANING (Remove Counsel/Judges blocks that clutter the body)
  const junkRegex = [
    /<p[^>]*>Counsel:.*?<\/p>/is,
    /<p[^>]*>Judges:.*?<\/p>/is,
    /<p[^>]*>Prior History:.*?<\/p>/is,
    /<p[^>]*>End of Document.*?<\/p>/is
  ];
  
  junkRegex.forEach(regex => { bodyHtml = bodyHtml.replace(regex, ''); });

  // 5. FOOTNOTE & STAR PAGINATION SYNC
  const footnoteRegex = /<li id="footnote-(\d+)"><p>(.*?)<\/p><\/li>/g;
  let match;
  while ((match = footnoteRegex.exec(fullHtml)) !== null) {
    caseData.footnotes.push({
      marker: match[1],
      content: match[2].replace(/<a href="#footnote-ref-\d+">.*?<\/a>\s*/g, '').trim()
    });
  }

  bodyHtml = bodyHtml.replace(/<ol><li id="footnote-.*<\/ol>/s, '');
  bodyHtml = bodyHtml.replace(/(\[\*{2,3}\d+\])/g, '<span class="star-pagination">$1</span>');
  
  caseData.opinionBody = bodyHtml.trim();

  return caseData;
}

async function run() {
  try {
    const outputDir = path.dirname(OUTPUT_FILE);
    await fs.mkdir(outputDir, { recursive: true });
    const files = (await fs.readdir(RAW_DIR)).filter(f => f.toLowerCase().endsWith('.docx'));
    const cases = await Promise.all(files.map(file => parseDocxFile(file)));
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(cases, null, 2));
    console.log(`\n🎉 SUCCESS: ${cases.length} cases cleaned for www.atlantagleaner.com`);
  } catch (err) { console.error("❌ Error:", err.message); }
}
run();