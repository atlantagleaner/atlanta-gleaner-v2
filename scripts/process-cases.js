const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const INPUT_DIR = 'C:/Users/arjun/Desktop/Archive'; 
const OUTPUT_DIR = './public/cases-data';
const INDEX_FILE = './public/search-index.json';

async function processArchive() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const files = fs.readdirSync(INPUT_DIR).filter(f => f.toLowerCase().endsWith('.docx'));
  const searchIndex = [];

  for (const file of files) {
    const fileNameNoExt = file.replace(/\.docx$/i, '');
    const parts = fileNameNoExt.split('_');
    const citation = parts.length > 1 ? parts.pop().trim() : "CITATION PENDING";
    const caseName = parts.join(' ').trim(); 
    const slug = fileNameNoExt.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Mammoth preserves verbatim formatting
    const result = await mammoth.convertToHtml({ path: path.join(INPUT_DIR, file) });
    const text = result.value.replace(/<[^>]*>/g, ' '); 

    const courtMatch = text.match(/(COURT OF APPEALS OF GEORGIA|SUPREME COURT OF GEORGIA)/i);
    const dateRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+(\d{4})/i;
    const dateMatch = text.match(dateRegex);
    const docketMatch = text.match(/(Case No\.|No\.)\s+([A-Z0-9-]+)/i);
    const dispMatch = text.match(/(Judgment affirmed|Judgment reversed|Affirmed in part|Reversed in part|Vacated|Remanded)/i);

    fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), result.value);

    searchIndex.push({
      id: slug,
      title: caseName,
      citation: citation,
      fullDate: dateMatch ? dateMatch[0].replace(',', ', ') : "DATE PENDING",
      month: dateMatch ? dateMatch[1] : "Undated",
      year: dateMatch ? dateMatch[2] : "Undated",
      url: `/cases/${slug}`,
      court: courtMatch ? courtMatch[0].toUpperCase() : "GEORGIA COURT OF APPEALS",
      docketNumber: docketMatch ? docketMatch[2] : "PENDING",
      disposition: dispMatch ? dispMatch[0].toUpperCase() : "PENDING",
      snippet: "Editorial summary pending review."
    });
  }
  searchIndex.sort((a, b) => b.id.localeCompare(a.id));
  fs.writeFileSync(INDEX_FILE, JSON.stringify(searchIndex, null, 2));
}
processArchive();