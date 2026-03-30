const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');

// Go up one level from 'scripts' to the root, then into the target folders
const RAW_DIR = path.join(__dirname, '../raw-opinions'); 
const OUTPUT_FILE = path.join(__dirname, '../src/data/cases.json');

async function parseDocxFile(filename) {
  const filePath = path.join(RAW_DIR, filename);
  const result = await mammoth.extractRawText({ path: filePath });
  
  // 1. Initial Line Splitting & Cleanup
  const allLines = result.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // 2. Separate Footnotes from Main Text
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

  // 3. Process Footnotes (Clean IDs and Arrows)
  footnoteLines.forEach(line => {
    const idMatch = line.match(/^(\d+)\./);
    if (idMatch) {
      const id = parseInt(idMatch[1]);
      const cleanText = line
        .replace(/^\d+\.\s*\d*\s*/, '') // Removes "1. 1" or "1. ^1"
        .replace(/\s*↑$/, '')           // Removes the blue return arrow
        .trim();
      caseData.footnotes.push({ id, rawText: cleanText });
    }
  });

  // 4. Dynamic Metadata Markers
  const markers = [
    { key: 'priorHistory', label: 'Prior History:' },
    { key: 'disposition', label: 'Disposition:' },
    { key: 'judges', label: 'Judges:' },
    { key: 'counsel', label: 'Counsel:' },
    { key: 'opinionBy', label: 'Opinion by:' },
    { key: 'opinionBody', label: 'Opinion' }
  ];

  const foundMarkers = markers
    .map(m => ({ ...m, index: mainLines.findIndex(l => l.startsWith(m.label)) }))
    .filter(m => m.index !== -1)
    .sort((a, b) => a.index - b.index);

  // 5. Extract Content & Apply Page Marker Rules
  foundMarkers.forEach((current, i) => {
    const next = foundMarkers[i + 1];
    const endIndex = next ? next.index : mainLines.length;
    let rawContent = mainLines.slice(current.index, endIndex).join('\n\n');

    // Remove the label text itself (e.g., "Judges: ")
    rawContent = rawContent.replace(current.label, '').trim();

    // The Cleaning Robot: Keeps [*1] but removes [**1] and [***1]
    const cleanedContent = rawContent.replace(/\[\*{2,3}\d+\]/g, '');

    if (current.key === 'opinionBody') {
      caseData.opinionBody = cleanedContent;
    } else {
      // Flatten metadata into a single line string
      caseData[current.key] = cleanedContent.replace(/\n+/g, ' ');
    }
  });

  return caseData;
}

async function run() {
  try {
    // Ensure the raw data directory exists before scanning
    await fs.mkdir(RAW_DIR, { recursive: true });
    
    const files = (await fs.readdir(RAW_DIR)).filter(f => f.toLowerCase().endsWith('.docx'));
    
    if (files.length === 0) {
      console.log(`⚠️ No .docx files found in ${RAW_DIR}. Please add your cases.`);
      return;
    }

    console.log(`🚀 Processing ${files.length} cases for Atlanta Gleaner...`);

    const cases = await Promise.all(files.map(file => parseDocxFile(file)));

    // Final Omission Check: Remove empty strings and empty footnote arrays
    const cleanedCases = cases.map(c => {
      Object.keys(c).forEach(key => {
        if (c[key] === '') delete c[key];
        if (Array.isArray(c[key]) && c[key].length === 0) delete c[key];
      });
      return c;
    });

    await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(cleanedCases, null, 2));
    console.log(`\n🎉 DONE! Saved to src/data/cases.json`);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

run();