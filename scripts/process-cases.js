const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth'); // This handles your .Docx files

// 1. Setup the "Pantry" and the "Storefront"
const INPUT_DIR = 'C:/Users/arjun/Desktop/Archive'; 
const OUTPUT_DIR = './public/cases-data';
const INDEX_FILE = './public/search-index.json';

// 2. The Legal Dictionary (Core Terms)
const LEGAL_CATEGORIES = {
  'CRIMINAL': ['murder', 'felony', 'evidence', 'sentence', 'jury', 'police', 'arrest'],
  'TORT': ['negligence', 'injury', 'accident', 'liability', 'insurance', 'damages'],
  'CONSTITUTIONAL': ['privacy', 'rights', 'amendment', 'statute', 'constitution'],
  'PROCEDURAL': ['jurisdiction', 'motion', 'appeal', 'remand', 'summary judgment']
};

async function processArchive() {
  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.Docx') || f.endsWith('.docx'));
  console.log(`Found ${files.length} cases in the pantry.`);

  const searchIndex = [];

  for (const file of files) {
    const fullPath = path.join(INPUT_DIR, file);
    
    // Extract the Name and Citation from the filename (e.g., Name_Citation.Docx)
    const fileNameNoExt = file.replace(/\.(Docx|docx)$/, '');
    const [caseName, citation] = fileNameNoExt.split('_');
    const slug = fileNameNoExt.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Turn Word Doc into HTML
    const result = await mammoth.convertToHtml({ path: fullPath });
    const html = result.value;
    const plainText = html.replace(/<[^>]*>/g, ' ').toLowerCase();

    // Identify Core Terms
    const coreTerms = [];
    for (const [category, keywords] of Object.entries(LEGAL_CATEGORIES)) {
      if (keywords.some(kw => plainText.includes(kw))) {
        coreTerms.push(category);
      }
    }

    // Save the pretty HTML file for the website
    fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), html);

    // Add it to the "Brain" (Search Index)
    searchIndex.push({
      id: slug,
      title: fileNameNoExt,
      url: `/cases/${slug}`,
      snippet: plainText.substring(0, 300), // First 300 characters for the date/context
      coreTerms: coreTerms.slice(0, 3) // Take the top 3 categories
    });

    console.log(`Processed: ${caseName}`);
  }

  // Save the updated Brain
  fs.writeFileSync(INDEX_FILE, JSON.stringify(searchIndex, null, 2));
  console.log('✅ Success! The Archive is updated and the Brain is smarter.');
}

processArchive();