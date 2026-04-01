const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');

async function analyzeFile(filePath) {
  // Read raw text to identify case boundaries
  const result = await mammoth.extractRawText({ path: filePath });
  const lines = result.value.split('\n').map(l => l.trim()).filter(l => l);
  
  // Extract case titles and find "End of Document" markers
  const caseInfo = [];
  let endOfDocCount = 0;
  
  for (let i = 0; i < Math.min(lines.length, 500); i++) {
    if (lines[i].includes('End of Document')) {
      endOfDocCount++;
      console.log(`    → "End of Document" found at line ${i}`);
    }
    // Look for court names as indicators of case starts
    if (i < 10 && (lines[i].includes('Court') || lines[i].includes('Supreme') || lines[i].includes('Appeals'))) {
      caseInfo.push(lines[i]);
    }
  }
  
  return endOfDocCount;
}

async function main() {
  const inputDir = '/sessions/inspiring-lucid-bell/mnt/uploads';
  const files = ['Files_19.docx', 'Files_2.docx', 'Files_3.docx', 'Files_3-98a9cc7f.docx', 'Files_50.docx'];
  
  console.log('\nAnalyzing uploaded files for multi-case documents...\n');
  
  for (const file of files) {
    const filePath = path.join(inputDir, file);
    console.log(`${file}:`);
    
    try {
      const eodCount = await analyzeFile(filePath);
      console.log(`    Cases found: ${eodCount + 1}\n`);
    } catch (e) {
      console.log(`    Error: ${e.message}\n`);
    }
  }
}

main().catch(console.error);
