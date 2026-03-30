const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// --- 📍 YOUR SPECIFIC FOLDERS ---
// Using double backslashes for the Windows path to your Desktop Archive
const RAW_DIR = "C:\\Users\\arjun\\Desktop\\Archive"; 
const OUTPUT_FILE = path.join(__dirname, '../src/data/cases.json');

async function parseDocxFile(filename) {
  const filePath = path.join(RAW_DIR, filename);
  
  // 1. Extract text from Word
  const result = await mammoth.extractRawText({ path: filePath });
  const rawText = result.value;

  const cleanText = rawText.replace(/\r\n/g, '\n');
  const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const caseData = {
    // This turns "York v Moore.docx" into "york-v-moore" for your URL
    slug: filename.replace('.docx', '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: lines[0] || 'Unknown Title',
    court: '',
    dateDecided: '',
    docketNo: '',
    citations: '',
    judges: '',
    disposition: '',
    summary: 'Summary pending...',
    priorHistory: '',
    counsel: '',
    opinionBody: '',
    footnotes: []
  };

  let isOpinion = false;
  let opinionLines = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Pattern for Georgia Dockets (like A22A1359)
    const docketMatch = line.match(/[A-Z]\d{2}[A-Z]\d{4}/);
    if (docketMatch && !caseData.docketNo) {
      caseData.docketNo = docketMatch[0];
    }

    // Start identifying the actual opinion
    if (lowerLine.includes('delivered the opinion') || lowerLine.includes('opinion by:')) {
      isOpinion = true;
      opinionLines.push(line);
      continue;
    }

    if (isOpinion) {
      opinionLines.push(line);
    } else {
      // Basic Metadata catching
      if (lowerLine.startsWith('court:')) caseData.court = line.replace(/court:\s*/i, '');
      else if (lowerLine.includes('decided:')) caseData.dateDecided = line.replace(/.*decided:\s*/i, '');
      else if (lowerLine.startsWith('reporter') || lowerLine.includes('lexis') || lowerLine.includes('wl')) caseData.citations += line + ' ';
      else if (lowerLine.startsWith('disposition:')) caseData.disposition = line.replace(/disposition:\s*/i, '');
      else if (lowerLine.startsWith('judges:')) caseData.judges = line.replace(/judges:\s*/i, '');
      else if (lowerLine.startsWith('prior history:')) caseData.priorHistory = line.replace(/prior history:\s*/i, '');
      else if (lowerLine.startsWith('counsel:')) caseData.counsel = line.replace(/counsel:\s*/i, '');
    }
  }

  caseData.opinionBody = opinionLines.join('\n\n');
  return caseData;
}

// --- 🏗️ THE RUNNER ---
async function run() {
  // Check if your Desktop folder actually exists
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`❌ Error: I can't find the folder at ${RAW_DIR}. Check the path!`);
    return;
  }

  const allCases = [];
  const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.docx'));

  console.log(`🚀 Found ${files.length} cases in your Desktop Archive. Starting...`);

  for (const file of files) {
    try {
      const parsedData = await parseDocxFile(file);
      allCases.push(parsedData);
      console.log(`✅ Processed: ${parsedData.title}`);
    } catch (err) {
      console.error(`❌ Error with ${file}:`, err);
    }
  }

  // Save to your project's data folder
  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allCases, null, 2));
  console.log(`\n🎉 Success! 133 cases are now ready in src/data/cases.json`);
}

run();