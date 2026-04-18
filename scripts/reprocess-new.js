const fs = require('fs').promises;
const path = require('path');

const newCaseFiles = [
  'Badie v. State.docx',
  'Bodie v. State.docx',
  'Doe v. Archdiocese of Atlanta.docx',
  'Fadesire v. State.docx',
  'GEICO Indem. Co. v. Abdel-Rahman.docx',
  'Garrett v. Sandersville R.R. Co.docx',
  'Gines v. State.docx',
  'Henry County v. Greater Atlanta Home Builders Assn._2026 Ga. App. LEXIS 121.Docx',
  'Neal v. State.docx',
  'Rainey v. State.docx'
];

function toSlug(filename) {
  return filename
    .replace(/\.docx?$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function run() {
  const casesPath = path.resolve(__dirname, '..', 'src', 'data', 'cases.json');
  
  const raw = await fs.readFile(casesPath, 'utf8');
  let cases = JSON.parse(raw);
  
  const slugsToRemove = new Set(newCaseFiles.map(toSlug));
  
  const before = cases.length;
  cases = cases.filter(c => !slugsToRemove.has(c.slug));
  const after = cases.length;
  
  console.log(`Removed ${before - after} cases from database`);
  
  await fs.writeFile(casesPath, JSON.stringify(cases, null, 2), 'utf8');
  console.log('Updated cases.json');
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
