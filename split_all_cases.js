const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');
const JSZip = require('jszip');
const { Document, Packer, Paragraph, TextRun, PageBreak } = require('docx');

// Convert HTML back to docx-compatible paragraphs
function htmlToDocxElements(html) {
  const elements = [];
  
  // Remove <ol> footnote lists
  html = html.replace(/<ol[^>]*>[\s\S]*?<\/ol>/gi, '');
  
  // Split by common block elements
  const blocks = html.split(/(?=<(?:p|h[1-6]|blockquote)[^>]*>)/i);
  
  for (const block of blocks) {
    if (!block.trim()) continue;
    
    // Extract text content
    let text = block
      .replace(/<[^>]+>/g, '') // strip tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
    
    if (text) {
      elements.push(new Paragraph({ children: [new TextRun(text)] }));
    }
  }
  
  return elements.length > 0 ? elements : [new Paragraph('')];
}

async function splitDocxFile(inputPath, outputDir, baseName) {
  console.log(`\nProcessing: ${baseName}`);
  
  // Get full HTML content
  const htmlResult = await mammoth.convertToHtml({ path: inputPath });
  const fullHtml = htmlResult.value;
  
  // Split on "End of Document" markers
  const caseParts = fullHtml.split(/<(?:p|blockquote)[^>]*>(?:<[^>]+>)*\s*End of Document[\s\S]*?<\/(?:p|blockquote)>/i);
  
  // Also try alternative split if above didn't work well
  if (caseParts.length <= 1) {
    // Fallback: split on common case title patterns
    const altSplit = fullHtml.split(/(?=<p[^>]*><strong>[\w\s&]+v\.\s[\w\s&]+<\/strong>)/i);
    if (altSplit.length > 1) {
      caseParts.splice(0, caseParts.length, ...altSplit);
    }
  }
  
  console.log(`  Found ${caseParts.length} segment(s)`);
  
  // Get case titles from raw text
  const rawResult = await mammoth.extractRawText({ path: inputPath });
  const rawLines = rawResult.value.split('\n').map(l => l.trim()).filter(l => l);
  
  let caseNum = 1;
  for (let i = 0; i < caseParts.length; i++) {
    const caseHtml = caseParts[i].trim();
    if (!caseHtml || caseHtml.length < 100) continue; // Skip empty segments
    
    // Extract case title from this segment
    const titleMatch = caseHtml.match(/<(?:p|h[1-6])[^>]*><[^>]*>?([\w\s&.,'-]+\s+v\.\s+[\w\s&.,'-]+)/i);
    const caseTitle = titleMatch ? titleMatch[1].replace(/[<>]/g, '').trim() : `Case_${caseNum}`;
    
    // Create filename-safe title
    const fileName = caseTitle
      .toLowerCase()
      .replace(/v\./gi, 'v')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) + '.docx';
    
    const outputPath = path.join(outputDir, fileName);
    
    try {
      // Create document with case HTML content
      const elements = htmlToDocxElements(caseHtml);
      
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: { width: 12240, height: 15840 },
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
          },
          children: elements
        }]
      });
      
      const buffer = await Packer.toBuffer(doc);
      await fs.writeFile(outputPath, buffer);
      console.log(`  ✓ Created: ${fileName}`);
    } catch (err) {
      console.log(`  ✗ Failed: ${fileName} - ${err.message}`);
    }
    
    caseNum++;
  }
}

async function main() {
  const inputDir = '/sessions/inspiring-lucid-bell/mnt/uploads';
  const outputDir = '/sessions/inspiring-lucid-bell/mnt/atlanta-gleaner-v2/split_cases_output';
  
  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });
  
  const files = [
    'Files_19.docx',
    'Files_2.docx',
    'Files_3.docx',
    // Skip Files_3-98a9cc7f.docx since it's a duplicate of Files_3.docx
    'Files_50.docx'
  ];
  
  for (const file of files) {
    const filePath = path.join(inputDir, file);
    try {
      await splitDocxFile(filePath, outputDir, file);
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }
  
  console.log(`\n✓ All cases extracted to: ${outputDir}`);
}

main().catch(console.error);
