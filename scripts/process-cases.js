const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const INPUT_DIR = 'C:/Users/arjun/Desktop/Archive'; 
const OUTPUT_DIR = './public/cases-data';
const INDEX_FILE = './public/search-index.json';

const LEGAL_CATEGORIES = {
  'CRIMINAL': ['murder', 'felony', 'evidence', 'jury', 'police'],
  'TORT': ['negligence', 'injury', 'accident', 'liability', 'insurance'],
  'CONSTITUTIONAL': ['privacy', 'rights', 'statute', 'constitution']
};

async function processArchive() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const files = fs.readdirSync(INPUT_DIR).filter(f => f.toLowerCase().endsWith('.docx'));
  const searchIndex = [];

  for (const file of files) {
    const fileNameNoExt = file.replace(/\.docx$/i, '');
    
    // ARCHITECTURE: Split only at the LAST underscore to protect names like "City of X_ LLC"
    const parts = fileNameNoExt.split('_');
    const citation = parts.length > 1 ? parts.pop().trim() : "Citation Pending";
    const caseName = parts.join(' ').trim(); 
    const slug = fileNameNoExt.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const result = await mammoth.convertToHtml({ path: path.join(INPUT_DIR, file) });
    const plainText = result.value.replace(/<[^>]*>/g, ' ').toLowerCase();

    const coreTerms = [];
    for (const [category, keywords] of Object.entries(LEGAL_CATEGORIES)) {
      if (keywords.some(kw => plainText.includes(kw))) coreTerms.push(category);
    }

    fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), result.value);

    searchIndex.push({
      id: slug,
      title: caseName,
      citation: citation,
      url: `/cases/${slug}`,
      snippet: plainText.substring(0, 400),
      coreTerms: coreTerms.slice(0, 3)
    });
    console.log(`Processed: ${caseName}`);
  }

  // Sort so newest is always at the top of the JSON
  searchIndex.sort((a, b) => b.id.localeCompare(a.id)); 
  fs.writeFileSync(INDEX_FILE, JSON.stringify(searchIndex, null, 2));
}

processArchive();