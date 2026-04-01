const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');

async function extractCaseTitle(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const lines = result.value.split('\n').map(l => l.trim()).filter(l => l);
    
    // First non-empty line is usually the case title
    for (const line of lines) {
      if (line && !line.includes('Court') && !line.includes('Date') && !line.match(/^\d+$/)) {
        // Clean up the title
        let title = line
          .replace(/et al\.?.*$/i, '')  // remove "et al" and beyond
          .replace(/\s+/g, ' ')
          .trim();
        
        if (title.includes('v.') || title.includes('v ')) {
          return title.slice(0, 100); // limit length
        }
      }
    }
  } catch (e) {
    // ignore errors
  }
  return null;
}

function sanitizeFilename(str) {
  return str
    .toLowerCase()
    .replace(/v\.\s*/g, 'v_')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

async function main() {
  const dir = 'split_cases_output';
  const files = await fs.readdir(dir);
  
  console.log('Extracting case titles for better naming...\n');
  
  let renamed = 0;
  for (const file of files.sort()) {
    const filePath = path.join(dir, file);
    const title = await extractCaseTitle(filePath);
    
    if (title && title !== 'case') {
      const newName = sanitizeFilename(title) + '.docx';
      
      if (newName !== file) {
        const newPath = path.join(dir, newName);
        try {
          await fs.rename(filePath, newPath);
          console.log(`✓ ${newName}`);
          renamed++;
        } catch (e) {
          // file may already exist, skip
        }
      }
    }
  }
  
  console.log(`\n✓ Renamed ${renamed} files`);
}

main().catch(console.error);
