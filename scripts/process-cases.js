const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');

// Target Directories
const RAW_DIR = "C:\\Users\\arjun\\Desktop\\Atlanta Gleaner Code\\atlanta-gleaner-v2\\raw-opinions";
const OUTPUT_FILE = path.join(__dirname, '../src/data/cases.json');

async function parseDocxFile(filename) {
  const filePath = path.join(RAW_DIR, filename);
  
  const rawResult = await mammoth.extractRawText({ path: filePath });
  const allLines = rawResult.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const htmlResult = await mammoth.convertToHtml({ path: filePath });
  let fullHtml = htmlResult.value;

  // 1. NOTICE BANNER EXTRACTION
  let noticeBanner = "";
  const noticeIndex = allLines.findIndex(l => /^Notice:/i.test(l));
  if (noticeIndex !== -1 && noticeIndex < 15) {
    noticeBanner = allLines[noticeIndex].trim();
  }

  const endOfDocIndex = allLines.findIndex(l => l.includes('End of Document'));
  const mainLines = endOfDocIndex !== -1 ? allLines.slice(0, endOfDocIndex) : allLines;

  const caseData = {
    slug: filename.toLowerCase().replace(/\.docx?$/, '').replace(/[^a-z0-9]+/g, '-'),
    noticeBanner: noticeBanner,
    metadata: {
      title: mainLines[0] || '',
      court: mainLines[1] || '',
      dateDecided: (mainLines[2] || '').replace(/,\s*Decided/i, ''),
      docketNo: (mainLines[3] || '').replace(/\.$/, ''),
      citations: mainLines[5] || ''
    },
    holding: '',
    opinionAuthor: '',
    opinionBody: '',
    footnotes: [],
    summary: 'Summary pending...'
  };

  // 2. METADATA MARKERS
  const markers = [
    { key: 'disposition', label: 'Disposition:', regex: /^Disposition:/i },
    { key: 'judges', label: 'Judges:', regex: /^Judges:\s*\[/i },
    { key: 'opinionBy', label: 'Opinion by:', regex: /^Opinion by:/i }
  ];

  const foundMarkers = markers
    .map(m => ({ ...m, index: mainLines.findIndex(l => m.regex.test(l)) }))
    .filter(m => m.index !== -1)
    .sort((a, b) => a.index - b.index);

  const extracted = {};
  foundMarkers.forEach((current, i) => {
    const next = foundMarkers[i + 1];
    const endIndex = next ? next.index : mainLines.length;
    let rawContent = mainLines.slice(current.index, endIndex).join(' ');
    const labelRegex = new RegExp(`^${current.label}`, 'i');
    extracted[current.key] = rawContent.replace(labelRegex, '').replace(/\[\*{2,3}\d+\]/g, '').trim();
  });

  if (extracted.disposition) caseData.holding = extracted.disposition;
  if (extracted.opinionBy) {
    caseData.opinionAuthor = extracted.opinionBy
      .replace(/^(Judge|Justice|Presiding Judge|Chief Judge)\s+/i, '')
      .toUpperCase();
  }

  // 3. FOOTNOTE EXTRACTION
  const footnoteRegex = /<li id="footnote-(\d+)"><p>(.*?)<\/p><\/li>/g;
  let match;
  while ((match = footnoteRegex.exec(fullHtml)) !== null) {
    let cleanText = match[2].replace(/<a href="#footnote-ref-\d+">.*?<\/a>\s*/g, '').trim();
    caseData.footnotes.push({ marker: match[1], content: cleanText });
  }

  // 4. BODY CLEANING & STAR PAGINATION
  const bodySplitter = /<p[^>]*>\s*<strong>\s*Opinion\s*<\/strong>\s*<\/p>/i;
  const parts = fullHtml.split(bodySplitter);
  
  if (parts.length > 1) {
    let bodyHtml = parts[1];
    const endMatch = bodyHtml.match(/>\s*End of Document\s*</i);
    if (endMatch) bodyHtml = bodyHtml.slice(0, endMatch.index + 1);
    bodyHtml = bodyHtml.replace(/<ol><li id="footnote-.*<\/ol>/, '');
    bodyHtml = bodyHtml.replace(/(\[\*{2,3}\d+\])/g, '<span class="star-pagination">$1</span>');
    caseData.opinionBody = bodyHtml.trim();
  }

  return caseData;
}

async function run() {
  try {
    const outputDir = path.dirname(OUTPUT_FILE);
    await fs.mkdir(outputDir, { recursive: true });

    const files = (await fs.readdir(RAW_DIR)).filter(f => f.toLowerCase().endsWith('.docx'));
    const cases = await Promise.all(files.map(file => parseDocxFile(file)));
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(cases, null, 2));
    console.log(`\n🎉 SUCCESS: ${cases.length} cases processed.`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}
run();