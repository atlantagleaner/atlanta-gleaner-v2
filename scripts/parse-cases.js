/**
 * Parse judicial opinions: DOCX → JSON
 *
 * Orchestrates the Python judicial opinion parser to extract metadata,
 * citations, parties, counsel, and disposition from DOCX files.
 *
 * Usage:
 *   node scripts/parse-cases.js
 *
 * Input: raw-opinions/*.docx
 * Output: public/cases-data/*.json
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const mammoth = require('mammoth');

// ============================================================================
// CONFIG
// ============================================================================

const RAW_OPINIONS_DIR = 'raw-opinions';
const OUTPUT_DIR = 'public/cases-data';
const PARSER_SCRIPT = path.join(__dirname, 'judicial_opinion_parser_complete.py');

// ============================================================================
// UTILITIES
// ============================================================================

function sanitizeFilename(str) {
  return str
    .toLowerCase()
    .replace(/v\.\s*/g, 'v_')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100);
}

async function checkPython() {
  /**Check if Python 3.9+ is available.**/
  return new Promise((resolve) => {
    const proc = spawn('python', ['--version']);
    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        const versionMatch = output.match(/Python (\d+)\.(\d+)/);
        if (versionMatch) {
          const major = parseInt(versionMatch[1]);
          const minor = parseInt(versionMatch[2]);
          const ok = major > 3 || (major === 3 && minor >= 9);
          resolve(ok);
          return;
        }
      }
      resolve(false);
    });
  });
}

async function spawnPythonParser(docxPath) {
  /**
   * Spawn Python parser subprocess and capture JSON output.
   * Returns parsed JSON or error object.
   **/
  return new Promise((resolve) => {
    const proc = spawn('python', [PARSER_SCRIPT, docxPath]);
    let output = '';
    let error = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      error += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(output);
          resolve({ success: true, data: parsed, error: null });
        } catch (e) {
          resolve({ success: false, data: null, error: `JSON parse error: ${e.message}` });
        }
      } else {
        resolve({ success: false, data: null, error: error || 'Python parser exited with error' });
      }
    });
  });
}

async function extractHtmlMammoth(docxPath) {
  /**Extract HTML content from DOCX using mammoth.**/
  try {
    const result = await mammoth.convertToHtml({ path: docxPath });
    return result.value
      .replace(/<ol[^>]*>[\s\S]*?<\/ol>/gi, '') // remove footnote lists
      .replace(/&nbsp;/g, ' ')
      .trim();
  } catch (err) {
    return null;
  }
}

function mapPythonToCaseLaw(pythonOutput, htmlContent, sourceFile) {
  /**
   * Map Python parser output to CaseLaw interface.
   *
   * Python fields → CaseLaw fields:
   *   case_information.case_caption_short → title
   *   court_information.name → court
   *   decision_information.decision_date → dateDecided (ISO)
   *   decision_information.decision_date_original → publishedAt (for display)
   *   case_information.docket_number → docketNumber
   *   citations.reporter_citations → citations (concatenated)
   *   judges_and_panel → judges
   *   disposition.text → disposition
   *   parties → parties
   *   counsel → counsel
   *   block_quotes → block_quotes (from extraction)
   *   footnotes → footnotes_detailed
   *   disposition.type → disposition_structured
   **/

  const caseInfo = pythonOutput.case_information || {};
  const courtInfo = pythonOutput.court_information || {};
  const decisionInfo = pythonOutput.decision_information || {};
  const citations = pythonOutput.citations || {};
  const disposition = pythonOutput.disposition || {};
  const judges = pythonOutput.judges_and_panel || [];
  const parties = pythonOutput.parties || [];
  const counsel = pythonOutput.counsel || [];
  const footnotes = pythonOutput.footnotes || [];
  const validation = pythonOutput.validation || {};

  // Build reporter citations string
  const reporterCitations = (citations.reporter_citations || [])
    .map(c => c.full_citation || `${c.volume} ${c.reporter} ${c.page}`)
    .join(' | ');

  // Build judges string
  const judgesStr = judges
    .map(j => j.name)
    .join(', ') || '';

  // Generate slug from title
  const title = caseInfo.case_caption_short || `Case from ${sourceFile}`;
  const slug = sanitizeFilename(title);

  return {
    // Required fields
    id: slug,
    slug: slug,
    title: title,
    shortTitle: title.replace(/et al\.?.*$/i, '').slice(0, 50),
    court: courtInfo.name || 'Unknown Court',
    docketNumber: caseInfo.docket_number || '',
    dateDecided: decisionInfo.decision_date_original || '',
    citations: reporterCitations,
    judges: judgesStr,
    disposition: disposition.text || '',
    coreTerms: [],
    summary: '',
    holdingBold: '',
    conclusionText: '',
    opinionAuthor: judges[0]?.name || '',
    opinionText: '',
    publishedAt: decisionInfo.decision_date || new Date().toISOString().split('T')[0],

    // Enhanced metadata from Python parser
    parties: parties,
    counsel: counsel,

    block_quotes: pythonOutput.block_quotes || [],
    footnotes_detailed: footnotes.map((fn, idx) => ({
      number: fn.number || idx + 1,
      anchor: fn.id || `fn${idx + 1}`,
      content: fn.content || '',
      citations: fn.citations || []
    })),

    disposition_structured: {
      type: disposition.type || 'UNKNOWN',
      text: disposition.text || ''
    },

    validation: {
      is_valid: validation.is_valid !== false,
      completeness_score: validation.completeness_score || 0
    },

    // Metadata
    sourceFile: sourceFile,
    html: htmlContent || '',
    opinionTextLength: pythonOutput.opinion_text_length || 0,
    parsingMetadata: {
      parsedAt: pythonOutput.metadata?.parsing_date || new Date().toISOString(),
      pythonParserVersion: '1.0',
      fields: {
        hasParties: parties.length > 0,
        hasCounsel: counsel.length > 0,
        hasBlockQuotes: pythonOutput.block_quotes_detected > 0,
        hasFootnotes: footnotes.length > 0,
        citationsFound: (citations.case_citations?.length || 0) + (citations.statute_citations?.length || 0)
      }
    }
  };
}

function validateCaseLaw(caseData) {
  /**Validate that required CaseLaw fields are present.**/
  const required = [
    'id', 'slug', 'title', 'court', 'docketNumber',
    'dateDecided', 'citations', 'judges', 'disposition'
  ];

  const missing = required.filter(field => !caseData[field] || caseData[field] === '');

  return {
    valid: missing.length === 0,
    missing: missing,
    warnings: [
      !caseData.parties?.length ? 'No parties extracted' : null,
      !caseData.counsel?.length ? 'No counsel extracted' : null,
      caseData.validation.completeness_score < 70 ? 'Low completeness score' : null
    ].filter(Boolean)
  };
}

async function parseCase(inputPath, filename) {
  /**
   * Parse a single DOCX file.
   * Returns: { success: boolean, filename: string, error?: string, warnings?: string[] }
   **/
  try {
    // Run Python parser
    const pythonResult = await spawnPythonParser(inputPath);

    if (!pythonResult.success) {
      return {
        success: false,
        filename,
        error: pythonResult.error
      };
    }

    // Extract HTML using mammoth
    const htmlContent = await extractHtmlMammoth(inputPath);

    // Map to CaseLaw interface
    const caseData = mapPythonToCaseLaw(pythonResult.data, htmlContent, filename);

    // Validate
    const validation = validateCaseLaw(caseData);

    // Generate output filename
    const jsonFilename = `${sanitizeFilename(caseData.title)}.json`;
    const outputPath = path.join(OUTPUT_DIR, jsonFilename);

    // Write JSON
    await fs.writeFile(outputPath, JSON.stringify(caseData, null, 2));

    return {
      success: true,
      filename: jsonFilename,
      warnings: validation.warnings.length > 0 ? validation.warnings : null,
      completeness: caseData.validation.completeness_score
    };
  } catch (err) {
    return {
      success: false,
      filename,
      error: err.message
    };
  }
}

async function main() {
  const start = Date.now();

  console.log('\n' + '='.repeat(70));
  console.log('JUDICIAL OPINION PARSER - BATCH PROCESSING');
  console.log('='.repeat(70) + '\n');

  // Check Python
  console.log('Checking Python availability...');
  const pythonOk = await checkPython();
  if (!pythonOk) {
    console.error('✗ Python 3.9+ not found. Install Python and run:');
    console.error('  pip install -r scripts/requirements.txt');
    process.exit(1);
  }
  console.log('✓ Python 3.9+ found\n');

  // Read input directory
  try {
    const files = await fs.readdir(RAW_OPINIONS_DIR);
    const docxFiles = files.filter(f => f.toLowerCase().endsWith('.docx')).sort();

    if (docxFiles.length === 0) {
      console.log(`No DOCX files found in ${RAW_OPINIONS_DIR}/`);
      process.exit(0);
    }

    console.log(`Processing ${docxFiles.length} case files...\n`);

    let processed = 0;
    let failed = 0;
    let totalCompleteness = 0;
    const results = [];

    // Process each file
    for (const file of docxFiles) {
      const inputPath = path.join(RAW_OPINIONS_DIR, file);
      const result = await parseCase(inputPath, file);

      results.push(result);

      if (result.success) {
        processed++;
        totalCompleteness += (result.completeness || 0);
        const status = result.warnings?.length > 0
          ? `⚠ ${result.filename}`
          : `✓ ${result.filename}`;
        console.log(status);
        if (result.warnings) {
          result.warnings.forEach(w => console.log(`  → ${w}`));
        }
      } else {
        failed++;
        console.log(`✗ ${file}: ${result.error}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`Processed: ${processed}/${docxFiles.length}`);
    console.log(`Failed: ${failed}`);
    if (processed > 0) {
      console.log(`Avg Completeness: ${(totalCompleteness / processed).toFixed(1)}%`);
    }
    console.log(`Output: ${OUTPUT_DIR}/`);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`Time: ${elapsed}s`);
    console.log('='.repeat(70) + '\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
}

main();
