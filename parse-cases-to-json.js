const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');

/**
 * Parse case law documents into structured JSON
 * Input: raw-opinions/*.docx
 * Output: public/cases-data/*.json
 */

function sanitizeFilename(str) {
  return str
    .toLowerCase()
    .replace(/v\.\s*/g, 'v_')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function extractCaseTitle(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  for (const line of lines) {
    if (line && !line.includes('Court') && !line.includes('Date') && !line.match(/^\d+$/)) {
      let title = line
        .replace(/et al\.?.*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (title.includes('v.') || title.includes('v ')) {
        return title.slice(0, 200);
      }
    }
  }
  return null;
}

function extractMetadata(text) {
  const metadata = {
    court: null,
    date: null,
    judge: null,
    citations: []
  };

  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  // Extract court information
  for (const line of lines) {
    if (line.match(/\b(Court of Appeals|Supreme Court|District Court|Superior Court)\b/i)) {
      metadata.court = line.match(/\b(Court of Appeals|Supreme Court|District Court|Superior Court)\b/i)[1];
    }
    if (line.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4})/)) {
      const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      if (dateMatch && !metadata.date) {
        metadata.date = dateMatch[1];
      }
    }
  }

  return metadata;
}

async function parseCase(inputPath, outputDir, filename) {
  try {
    // Extract raw text
    const rawResult = await mammoth.extractRawText({ path: inputPath });
    const rawText = rawResult.value;

    // Extract HTML for display
    const htmlResult = await mammoth.convertToHtml({ path: inputPath });
    let htmlContent = htmlResult.value
      .replace(/<ol[^>]*>[\s\S]*?<\/ol>/gi, '') // remove footnote lists
      .replace(/&nbsp;/g, ' ')
      .trim();

    // Extract structured data
    const caseTitle = extractCaseTitle(rawText);
    const metadata = extractMetadata(rawText);

    // Create case object
    const caseData = {
      title: caseTitle || `Case from ${filename}`,
      filename: filename.replace(/\.[^.]+$/, ''),
      sourceFile: filename,
      processedAt: new Date().toISOString(),
      metadata,
      preview: rawText.slice(0, 500),
      textLength: rawText.length,
      html: htmlContent
    };

    // Generate output filename
    const jsonFilename = sanitizeFilename(caseTitle || filename) + '.json';
    const outputPath = path.join(outputDir, jsonFilename);

    // Write JSON
    await fs.writeFile(outputPath, JSON.stringify(caseData, null, 2));
    console.log(`✓ ${jsonFilename}`);

    return { success: true, filename: jsonFilename };
  } catch (err) {
    console.error(`✗ ${filename}: ${err.message}`);
    return { success: false, filename, error: err.message };
  }
}

async function main() {
  const rawOpinionsDir = 'raw-opinions';
  const outputDir = 'public/cases-data';

  try {
    const files = await fs.readdir(rawOpinionsDir);
    const docxFiles = files.filter(f => f.toLowerCase().endsWith('.docx'));

    console.log(`\nProcessing ${docxFiles.length} case files...\n`);

    let processed = 0;
    let failed = 0;

    for (const file of docxFiles.sort()) {
      const inputPath = path.join(rawOpinionsDir, file);
      const result = await parseCase(inputPath, outputDir, file);

      if (result.success) {
        processed++;
      } else {
        failed++;
      }
    }

    console.log(`\n✓ Processed: ${processed}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`\nOutput: ${outputDir}/`);
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
}

main();
