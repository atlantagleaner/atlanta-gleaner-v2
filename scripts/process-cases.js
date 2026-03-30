const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');

const RAW_DIR = path.join(__dirname, '../raw-opinions'); 
const OUTPUT_FILE = path.join(__dirname, '../src/data/cases.json');

async function parseDocxFile(filename) {
  const filePath = path.join(RAW_DIR, filename);
  const rawResult = await mammoth.extractRawText({ path: filePath });
  const allLines = rawResult.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const htmlResult = await mammoth.convertToHtml({ path: filePath });
  let fullHtml = htmlResult.value;

  const endOfDocIndex = allLines.findIndex(l => l.includes('End of Document'));
  const mainLines = endOfDocIndex !== -1 ? allLines.slice(0, endOfDocIndex) : allLines;

  const caseData = {
    slug: filename.toLowerCase().replace(/\.docx?$/, '').replace(/[^a-z0-9]+/g, '-'),
    title: mainLines[0] || '',
    court: mainLines[1] || '',
    dateDecided: (mainLines[2] || '').replace(/,\s*Decided/i, ''),
    docketNo: (mainLines[3] || '').replace(/\.$/, ''),
    citations: mainLines[5] || '',
    summary: 'Summary pending...',
    opinionBody: '',
    footnotes: []
  };

  // 🛡️ THE JUDGE FIX: We only look for appellate markers, skipping "Before Judge X" in Prior History
  const markers = [
    { key: 'priorHistory', label: 'Prior History:', regex: /^Prior History:/i },
    { key: 'disposition', label: 'Disposition:', regex: /^Disposition:/i },
    { key: 'counsel', label: 'Counsel:', regex: /^Counsel:/i },
    { key: 'judges', label: 'Judges:', regex: /^Judges:\s*\[/i }, // Specifically targets appellate judge blocks
    { key: 'opinionBy', label: 'Opinion by:', regex: /^Opinion by:/i }
  ];

  const foundMarkers = markers
    .map(m => ({ ...m, index: mainLines.findIndex(l => m.regex.test(l)) }))
    .filter(m => m.index !== -1)
    .sort((a, b) => a.index - b.index);

  foundMarkers.forEach((current, i) => {
    const next = foundMarkers[i + 1];
    const endIndex = next ? next.index : mainLines.length;
    let rawContent = mainLines.slice(current.index, endIndex).join(' ');
    const labelRegex = new RegExp(`^${current.label}`, 'i');
    caseData[current.key] = rawContent.replace(labelRegex, '').replace(/\[\*{2,3}\d+\]/g, '').trim();
  });

  // 🛡️ THE BODY FIX: Start AFTER the word "Opinion" header to prevent double-titles
  const bodySplitter = /<p[^>]*>\s*<strong>\s*Opinion\s*<\/strong>\s*<\/p>/i;
  const parts = fullHtml.split(bodySplitter);
  
  if (parts.length > 1) {
    let bodyHtml = parts[1]; // Everything after the "Opinion" header
    const endMatch = bodyHtml.match(/>\s*End of Document\s*</i);
    if (endMatch) bodyHtml = bodyHtml.slice(0, endMatch.index + 1);
    caseData.opinionBody = bodyHtml.replace(/\[\*{2,3}\d+\]/g, '');
  }

  return caseData;
}

async function run() {
  try {
    const files = (await fs.readdir(RAW_DIR)).filter(f => f.toLowerCase().endsWith('.docx'));
    const cases = await Promise.all(files.map(file => parseDocxFile(file)));
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(cases, null, 2));
    console.log(`\n🎉 SUCCESS: ${cases.length} cases processed cleanly.`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}
run();