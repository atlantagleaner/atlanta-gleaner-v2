const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const CASES_JSON = path.join(__dirname, '../src/data/cases.json');
const RAW_OPINIONS = path.join(__dirname, '../raw-opinions');
const OUTPUT_JSON = path.join(__dirname, '../tmp/case-integrity-audit.json');
const OUTPUT_MD = path.join(__dirname, '../tmp/case-integrity-audit.md');

async function extractTextFromDocx(filepath) {
  try {
    const result = await mammoth.extractRawText({ path: filepath });
    return result.value;
  } catch (err) {
    return null;
  }
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').trim();
}

function filenameToSlug(filename) {
  return filename
    .replace(/\.[^/.]+$/, '') // remove extension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // trim hyphens
}

function findSourceFile(slug, rawOpinionFiles) {
  // Direct slug match
  for (const file of rawOpinionFiles) {
    if (filenameToSlug(file) === slug) {
      return file;
    }
  }
  return null;
}

async function auditCases() {
  console.log('Starting case integrity audit...\n');

  // Read cases.json
  const casesData = JSON.parse(fs.readFileSync(CASES_JSON, 'utf-8'));
  const rawOpinionFiles = fs.readdirSync(RAW_OPINIONS).filter(f => f.endsWith('.docx') || f.endsWith('.Docx'));

  const audit = {
    totalCases: casesData.length,
    audited: 0,
    issues: {
      textLossDetected: [],
      truncationSuspected: [],
      parsingErrors: [],
      unmappedCases: [],
    },
    summary: {
      cleanCases: 0,
      casesWithIssues: 0,
      totalTextLoss: 0,
      truncatedCases: 0,
    },
    caseDetails: [],
  };

  for (let i = 0; i < casesData.length; i++) {
    const caseData = casesData[i];
    const slug = caseData.slug || caseData.id;

    process.stdout.write(`\rAuditing ${i + 1}/${casesData.length}: ${slug}`);

    // Find matching source file
    const sourceFile = findSourceFile(slug, rawOpinionFiles);
    if (!sourceFile) {
      audit.issues.unmappedCases.push({
        slug,
        title: caseData.title,
        reason: 'Could not find matching .docx file',
      });
      audit.caseDetails.push({
        slug,
        status: 'unmapped',
        issues: [],
      });
      continue;
    }

    // Extract text from source DOCX
    const sourceFilePath = path.join(RAW_OPINIONS, sourceFile);
    const sourceFileStat = fs.statSync(sourceFilePath);
    const sourceText = await extractTextFromDocx(sourceFilePath);

    if (!sourceText) {
      audit.issues.parsingErrors.push({
        slug,
        title: caseData.title,
        error: 'Could not extract text from source DOCX',
        sourceFile,
      });
      audit.caseDetails.push({
        slug,
        status: 'error',
        issues: ['Could not extract text from source'],
      });
      continue;
    }

    // Get published opinion text
    const publishedHtml = caseData.opinionText || '';
    const publishedText = stripHtml(publishedHtml);

    // Calculate metrics
    const sourceChars = sourceText.length;
    const publishedChars = publishedText.length;
    const textLossChars = sourceChars - publishedChars;
    const textLossPercent = sourceChars > 0 ? (textLossChars / sourceChars) * 100 : 0;

    const caseIssues = [];

    // Check for text loss > 20%
    if (textLossPercent > 20) {
      caseIssues.push('HIGH_TEXT_LOSS');
      audit.issues.textLossDetected.push({
        slug,
        title: caseData.title,
        sourceFile,
        originalChars: sourceChars,
        publishedChars,
        lossPercent: parseFloat(textLossPercent.toFixed(2)),
        severity: textLossPercent > 50 ? 'CRITICAL' : 'HIGH',
      });
    }

    // Check for parsing errors
    if (!caseData.opinionText || caseData.opinionText.trim().length === 0) {
      caseIssues.push('EMPTY_OPINION_TEXT');
      audit.issues.parsingErrors.push({
        slug,
        title: caseData.title,
        error: 'Empty opinion text',
        sourceFile,
      });
    }

    if (!caseData.docketNumber) {
      caseIssues.push('MISSING_DOCKET');
    }

    if (!caseData.dateDecided) {
      caseIssues.push('MISSING_DATE');
    }

    // Check for truncation markers
    if (publishedHtml && (publishedHtml.match(/<p>/g) || []).length === 0 && sourceChars > 5000) {
      caseIssues.push('SUSPECTED_TRUNCATION');
      audit.issues.truncationSuspected.push({
        slug,
        title: caseData.title,
        sourceFile,
        reason: 'Very large source but no <p> tags in published HTML',
        sourceChars,
        publishedChars,
      });
    }

    // Check for incomplete sentences at end
    if (publishedText.length > 100) {
      const lastSentence = publishedText.slice(-100).trim();
      if (!/[.!?][\s]*$/.test(lastSentence) && !lastSentence.endsWith('}')) {
        caseIssues.push('INCOMPLETE_SENTENCE_AT_END');
        audit.issues.truncationSuspected.push({
          slug,
          title: caseData.title,
          sourceFile,
          reason: 'Opinion appears to end with incomplete sentence',
          evidence: lastSentence.slice(-50),
        });
      }
    }

    // Check for unclosed tags
    const openTags = (publishedHtml.match(/<[^/][^>]*>/g) || []).length;
    const closeTags = (publishedHtml.match(/<\/[^>]*>/g) || []).length;
    if (openTags > closeTags && openTags - closeTags > 5) {
      caseIssues.push('UNCLOSED_TAGS');
      audit.issues.truncationSuspected.push({
        slug,
        title: caseData.title,
        sourceFile,
        reason: `${openTags - closeTags} more opening tags than closing tags`,
      });
    }

    // Summary
    if (caseIssues.length === 0) {
      audit.summary.cleanCases++;
    } else {
      audit.summary.casesWithIssues++;
    }

    audit.summary.totalTextLoss += textLossPercent;
    if (caseIssues.includes('SUSPECTED_TRUNCATION')) {
      audit.summary.truncatedCases++;
    }

    audit.caseDetails.push({
      slug,
      title: caseData.title,
      sourceFile,
      status: caseIssues.length === 0 ? 'clean' : 'issues',
      sourceChars,
      publishedChars,
      textLossPercent: parseFloat(textLossPercent.toFixed(2)),
      issues: caseIssues,
    });

    audit.audited++;
  }

  console.log('\n\nGenerating report...');

  // Ensure tmp directory exists
  if (!fs.existsSync(path.dirname(OUTPUT_JSON))) {
    fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  }

  // Write JSON report
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(audit, null, 2));

  // Write Markdown report
  let md = '# Case Integrity Audit Report\n\n';
  md += `**Audit Date**: ${new Date().toISOString()}\n`;
  md += `**Total Cases**: ${audit.totalCases}\n`;
  md += `**Audited**: ${audit.audited}\n`;
  md += `**Clean Cases**: ${audit.summary.cleanCases}\n`;
  md += `**Cases with Issues**: ${audit.summary.casesWithIssues}\n`;
  md += `**Average Text Loss**: ${(audit.summary.totalTextLoss / audit.audited).toFixed(2)}%\n`;
  md += `**Suspected Truncations**: ${audit.summary.truncatedCases}\n\n`;

  md += '## Issues Summary\n\n';

  if (audit.issues.textLossDetected.length > 0) {
    md += `### Text Loss Detected (${audit.issues.textLossDetected.length})\n\n`;
    md += '| Slug | Title | Original | Published | Loss % | Severity |\n';
    md += '|------|-------|----------|-----------|--------|----------|\n';
    for (const issue of audit.issues.textLossDetected) {
      md += `| \`${issue.slug}\` | ${issue.title} | ${issue.originalChars} | ${issue.publishedChars} | ${issue.lossPercent}% | **${issue.severity}** |\n`;
    }
    md += '\n';
  }

  if (audit.issues.truncationSuspected.length > 0) {
    md += `### Truncation Suspected (${audit.issues.truncationSuspected.length})\n\n`;
    for (const issue of audit.issues.truncationSuspected) {
      md += `- **${issue.slug}**: ${issue.reason}\n`;
    }
    md += '\n';
  }

  if (audit.issues.parsingErrors.length > 0) {
    md += `### Parsing Errors (${audit.issues.parsingErrors.length})\n\n`;
    for (const issue of audit.issues.parsingErrors) {
      md += `- **${issue.slug}**: ${issue.error}\n`;
    }
    md += '\n';
  }

  if (audit.issues.unmappedCases.length > 0) {
    md += `### Unmapped Cases (${audit.issues.unmappedCases.length})\n\n`;
    for (const issue of audit.issues.unmappedCases) {
      md += `- **${issue.slug}**: ${issue.title}\n`;
    }
    md += '\n';
  }

  fs.writeFileSync(OUTPUT_MD, md);

  console.log(`\n✓ Audit complete!`);
  console.log(`\nResults saved to:`);
  console.log(`  - ${OUTPUT_JSON}`);
  console.log(`  - ${OUTPUT_MD}`);
  console.log(`\nSummary:`);
  console.log(`  - Clean cases: ${audit.summary.cleanCases}`);
  console.log(`  - Cases with issues: ${audit.summary.casesWithIssues}`);
  console.log(`  - Suspected truncations: ${audit.summary.truncatedCases}`);
  console.log(`  - Text loss detected: ${audit.issues.textLossDetected.length}`);
}

auditCases().catch(console.error);
