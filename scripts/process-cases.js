const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');

// Adjusted paths for your local Peachtree City environment
const RAW_DIR = path.join(__dirname, '../raw-opinions'); 
const OUTPUT_FILE = path.join(__dirname, '../src/data/cases.json');

async function parseDocxFile(filename) {
  const filePath = path.join(RAW_DIR, filename);
  
  // PASS 1: Raw Text (For reliable metadata targeting)
  const rawResult = await mammoth.extractRawText({ path: filePath });
  const allLines = rawResult.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // PASS 2: HTML (To preserve bold, italics, and block quotes)
  const htmlResult = await mammoth.convertToHtml({ path: filePath });
  let fullHtml = htmlResult.value;

  const endOfDocIndex = allLines.findIndex(l => l.includes('End of Document'));
  const mainLines = endOfDocIndex !== -1 ? allLines.slice(0, endOfDocIndex) : allLines;
  const footnoteLines = endOfDocIndex !== -1 ? allLines.slice(endOfDocIndex + 1) : [];

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

  // Process Footnotes (Clean IDs and Arrows)
  footnoteLines.forEach(line => {
    const idMatch = line.match(/^(\d+)\./);
    if (idMatch) {
      const id = parseInt(idMatch[1]);
      const cleanText = line
        .replace(/^\d+\.\s*\d*\s*/, '') 
        .replace(/\s*↑$/, '')           
        .trim();
      caseData.footnotes.push({ id, rawText: cleanText });
    }
  });

  // 🛡️ THE FIX: Strict Regex Anchors prevent pulling trial judges from Prior History
  const markers = [
    { key: 'priorHistory', label: 'Prior History:', regex: /^Prior History:/i },
    { key: 'disposition', label: 'Disposition:', regex: /^Disposition:/i },
    { key: 'counsel', label: 'Counsel:', regex: /^Counsel:/i },
    { key: 'judges', label: 'Judges:', regex: /^Judges:/i },
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
    // Keep single star [*x] but remove [**x] and [***x]
    const cleanedContent = rawContent.replace(labelRegex, '').replace(/\[\*{2,3}\d+\]/g, '').trim();
    caseData[current.key] = cleanedContent;
  });

  // --- 🪄 HTML EXTRACTION FOR THE OPINION BODY ---
  const opinionMarker = />\s*Opinion\s*</i;
  const endMarker = />\s*End of Document\s*</i;

  const opinionMatch = fullHtml.match(opinionMarker);
  const endMatch = fullHtml.match(endMarker);

  if (opinionMatch) {
    let bodyHtml = fullHtml.slice(opinionMatch.index + opinionMatch[0].length - 1);
    
    if (endMatch) {
      const endLocalMatch = bodyHtml.match(endMarker);
      if (endLocalMatch) {
        bodyHtml = bodyHtml.slice(0, endLocalMatch.index + 1);
      }
    }
    
    // Final cleanup of page markers in HTML
    caseData.opinionBody = bodyHtml.replace(/\[\*{2,3}\d+\]/g, '');
  }

  return caseData;
}

async function run() {
  try {
    await fs.mkdir(RAW_DIR, { recursive: true });
    const files = (await fs.readdir(RAW_DIR)).filter(f => f.toLowerCase().endsWith('.docx'));
    
    if (files.length === 0) {
      console.log("⚠️ No documents found in raw-opinions folder.");
      return;
    }

    console.log(`🚀 Parsing ${files.length} cases for atlantagleaner.com...`);

    const cases = await Promise.all(files.map(file => parseDocxFile(file)));

    const cleanedCases = cases.map(c => {
      Object.keys(c).forEach(key => {
        if (c[key] === '') delete c[key];
        if (Array.isArray(c[key]) && c[key].length === 0) delete c[key];
      });
      return c;
    });

    await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(cleanedCases, null, 2));
    console.log(`\n🎉 DONE! Processed ${cleanedCases.length} cases with rich formatting.`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

run();