const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const RAW_DIR = "C:\\Users\\arjun\\Desktop\\Archive"; 
const OUTPUT_FILE = path.join(__dirname, '../src/data/cases.json');

async function parseDocxFile(filename) {
  const filePath = path.join(RAW_DIR, filename);
  const result = await mammoth.extractRawText({ path: filePath });
  const rawText = result.value;

  const cleanText = rawText.replace(/\r\n/g, '\n');
  const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const caseData = {
    slug: filename.toLowerCase().replace(/\.docx?$/, '').replace(/[^a-z0-9]+/g, '-'),
    title: lines[0] || 'Unknown Title',
    court: 'COURT OF APPEALS OF GEORGIA', // Defaulting to GA
    dateDecided: '',
    docketNo: '',
    citations: '',
    judges: '',
    disposition: '',
    summary: 'Summary pending...',
    opinionBody: ''
  };

  let isOpinion = false;
  let opinionLines = [];

  for (let line of lines) {
    const lower = line.toLowerCase();
    
    const docketMatch = line.match(/[A-Z]\d{2}[A-Z]\d{4}/);
    if (docketMatch && !caseData.docketNo) caseData.docketNo = docketMatch[0];

    if (lower.includes('delivered the opinion') || lower.includes('opinion by:')) {
      isOpinion = true;
      opinionLines.push(line);
      continue;
    }

    if (isOpinion) {
      opinionLines.push(line);
    } else {
      if (lower.startsWith('court:')) caseData.court = line.replace(/court:\s*/i, '');
      else if (lower.includes('decided:')) caseData.dateDecided = line.replace(/.*decided:\s*/i, '');
      else if (lower.startsWith('disposition:')) caseData.disposition = line.replace(/disposition:\s*/i, '');
      else if (lower.startsWith('judges:')) caseData.judges = line.replace(/judges:\s*/i, '');
    }
  }

  caseData.opinionBody = opinionLines.join('\n\n');
  
  // Fallback date if none found (prevents the build from breaking)
  if (!caseData.dateDecided) caseData.dateDecided = "January 1, 2026"; 

  return caseData;
}

async function run() {
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`❌ ERROR: Folder not found at ${RAW_DIR}`);
    return;
  }

  const files = fs.readdirSync(RAW_DIR).filter(f => f.toLowerCase().endsWith('.docx') || f.toLowerCase().endsWith('.doc'));
  console.log(`🔎 Scanning ${RAW_DIR}...`);
  console.log(`🚀 Found ${files.length} Word documents.`);

  const allCases = [];
  for (const file of files) {
    try {
      const data = await parseDocxFile(file);
      allCases.push(data);
      console.log(`✅ Processed: ${data.title}`);
    } catch (err) {
      console.error(`❌ Failed: ${file}`, err);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allCases, null, 2));
  console.log(`\n🎉 DONE! Saved ${allCases.length} cases to src/data/cases.json`);
}

run();