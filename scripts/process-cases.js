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

    const result = await mammoth.convertToHtml({ path: path.join(INPUT_DIR, file) });
    const plainText = result.value.replace(/<[^>]*>/g, ' ');

    const dateRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+(\d{4})/i;
    const dateMatch = plainText.match(dateRegex);
    const fullDate = dateMatch ? dateMatch[0].replace(',', ', ') : "DATE PENDING";
    const month = dateMatch ? dateMatch[1] : "Undated";
    const year = dateMatch ? dateMatch[2] : "Undated";

    fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), result.value);

    searchIndex.push({
      id: slug,
      title: caseName,
      citation: citation,
      fullDate: fullDate,
      month: month,
      year: year,
      url: `/cases/${slug}`,
      snippet: "Editorial summary pending review.",
      coreTerms: ["PENDING"]
    });
  }

  searchIndex.sort((a, b) => b.id.localeCompare(a.id));
  fs.writeFileSync(INDEX_FILE, JSON.stringify(searchIndex, null, 2));
}
processArchive();