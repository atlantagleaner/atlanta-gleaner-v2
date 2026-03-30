const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const INPUT_DIR = 'C:\\Users\\arjun\\Desktop\\Archive';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'cases-data');
const INDEX_FILE = path.join(__dirname, '..', 'public', 'search-index.json');

async function processCases() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(INPUT_DIR);
  const searchIndex = [];
  let processedCount = 0;
  let skippedFiles = [];

  console.log(`Found ${files.length} total items in the folder.`);

  for (const file of files) {
    // 1. Check for .docx AND .DOCX (case-insensitive)
    if (file.toLowerCase().endsWith('.docx') && !file.startsWith('~$')) {
      const filePath = path.join(INPUT_DIR, file);
      
      // Clean up the file name for the URL
      const slug = file.toLowerCase().replace('.docx', '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      console.log(`Processing: ${file}...`);
      
      try {
        const result = await mammoth.convertToHtml({ path: filePath });
        const htmlContent = result.value;
        
        fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), htmlContent);
        
        const cleanText = htmlContent.replace(/<[^>]*>?/gm, '');
        const snippet = cleanText.substring(0, 200).trim() + '...';
        
        searchIndex.push({
          id: slug,
          title: file.replace(/\.[^/.]+$/, ""), // Keeps the original title casing
          url: `/cases/${slug}`,
          snippet: snippet
        });
        
        processedCount++;
      } catch (err) {
        console.error(`❌ Error processing ${file}:`, err.message);
      }
    } else {
      // Keep track of what we are skipping and why
      skippedFiles.push(file);
    }
  }

  // Save the master search index
  fs.writeFileSync(INDEX_FILE, JSON.stringify(searchIndex, null, 2));
  
  console.log(`\n✅ Success! Processed ${processedCount} cases.`);
  
  if (skippedFiles.length > 0) {
    console.log(`\n⚠️ Skipped ${skippedFiles.length} files. Here are the first few so we can see why:`);
    console.log(skippedFiles.slice(0, 10)); // Shows the names of the first 10 skipped files
  }
}

processCases();