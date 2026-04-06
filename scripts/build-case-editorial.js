'use strict';

const fs = require('fs').promises;
const path = require('path');

const RAW_MASTER_FILE = path.resolve(__dirname, '..', 'src', 'data', 'cases.json');
const EDITORIAL_FILE = path.resolve(__dirname, '..', 'src', 'data', 'case-editorial.json');
const REPORT_DIR = path.resolve(__dirname, '..', 'tmp');
const REPORT_JSON_FILE = path.join(REPORT_DIR, 'case-editorial-report.json');
const REPORT_MD_FILE = path.join(REPORT_DIR, 'case-editorial-report.md');

function safeTrim(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasMeaningfulSummary(value) {
  const trimmed = safeTrim(value);
  return trimmed.length > 0 && trimmed !== 'Summary pending.';
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return Array.from(
    new Set(
      tags
        .map((tag) => safeTrim(tag))
        .filter(Boolean)
    )
  );
}

function sortCases(a, b) {
  return (
    (a.title || '').localeCompare(b.title || '') ||
    (a.dateDecided || '').localeCompare(b.dateDecided || '') ||
    (a.docketNumber || '').localeCompare(b.docketNumber || '')
  );
}

function buildFlags(record) {
  const flags = [];

  if (record.tags.length === 0) flags.push('missing-tags');
  if (!hasMeaningfulSummary(record.summary)) flags.push('missing-summary');
  if (!safeTrim(record.docketNumber)) flags.push('missing-docket');
  if (!safeTrim(record.dateDecided)) flags.push('missing-date');

  return flags;
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function main() {
  const rawCases = await readJson(RAW_MASTER_FILE, []);
  const existingEditorial = await readJson(EDITORIAL_FILE, {});

  if (!Array.isArray(rawCases)) {
    throw new Error('Expected cases.json to contain an array of raw case records.');
  }

  await fs.mkdir(REPORT_DIR, { recursive: true });

  const sortedCases = [...rawCases].sort(sortCases);
  const editorialOutput = {};
  const reportRows = [];

  let processed = 0;
  let seeded = 0;
  let pending = 0;
  let flagged = 0;

  for (const caseData of sortedCases) {
    processed += 1;

    const existing = existingEditorial[caseData.slug] || {};
    const fallbackTags = normalizeTags(caseData.tags || caseData.coreTerms);
    const fallbackSummary = hasMeaningfulSummary(caseData.summary) ? safeTrim(caseData.summary) : '';

    const tags = normalizeTags(existing.tags && existing.tags.length ? existing.tags : fallbackTags);
    const summary = hasMeaningfulSummary(existing.summary) ? safeTrim(existing.summary) : fallbackSummary;
    const source = existing.source || ((tags.length > 0 || summary) ? 'legacy-seed' : 'editorial');
    const status = existing.status || ((tags.length > 0 || summary) ? 'seeded' : 'pending');
    const flags = Array.isArray(existing.flags) && existing.flags.length > 0
      ? existing.flags
      : buildFlags({
          tags,
          summary,
          docketNumber: caseData.docketNumber,
          dateDecided: caseData.dateDecided,
        });

    if (status === 'seeded') seeded += 1;
    if (status === 'pending') pending += 1;
    if (flags.length > 0 || status === 'flagged' || status === 'failed') flagged += 1;

    editorialOutput[caseData.slug] = {
      slug: caseData.slug,
      title: caseData.title,
      docketNumber: caseData.docketNumber,
      dateDecided: caseData.dateDecided,
      tags,
      summary,
      status,
      source,
      flags,
      updatedAt: existing.updatedAt || new Date().toISOString(),
    };

    reportRows.push({
      slug: caseData.slug,
      title: caseData.title,
      dateDecided: caseData.dateDecided,
      docketNumber: caseData.docketNumber,
      status,
      source,
      hasTags: tags.length > 0,
      hasSummary: hasMeaningfulSummary(summary),
      flags,
    });

    console.log(
      `[${String(processed).padStart(4, '0')}/${String(sortedCases.length).padStart(4, '0')}] ` +
      `${caseData.slug} :: status=${status} :: tags=${tags.length} :: summary=${hasMeaningfulSummary(summary) ? 'yes' : 'no'}`
    );
    console.log('  reset classification state');
  }

  await fs.writeFile(EDITORIAL_FILE, JSON.stringify(editorialOutput, null, 2) + '\n', 'utf8');

  const report = {
    generatedAt: new Date().toISOString(),
    sourceMaster: RAW_MASTER_FILE,
    editorialMaster: EDITORIAL_FILE,
    totals: {
      processed,
      seeded,
      pending,
      flagged,
    },
    cases: reportRows,
  };

  await fs.writeFile(REPORT_JSON_FILE, JSON.stringify(report, null, 2) + '\n', 'utf8');

  const markdownLines = [
    '# Case Editorial Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Processed: ${processed}`,
    `Seeded: ${seeded}`,
    `Pending: ${pending}`,
    `Flagged: ${flagged}`,
    '',
    '| Title | Date | Docket | Status | Flags |',
    '| --- | --- | --- | --- | --- |',
    ...reportRows.map((row) => {
      const flagsText = row.flags.length > 0 ? row.flags.join(', ') : 'OK';
      return `| ${row.title} | ${row.dateDecided || '-'} | ${row.docketNumber || '-'} | ${row.status} | ${flagsText} |`;
    }),
    '',
  ];

  await fs.writeFile(REPORT_MD_FILE, markdownLines.join('\n'), 'utf8');

  console.log('');
  console.log(`Editorial master: ${EDITORIAL_FILE}`);
  console.log(`Report JSON: ${REPORT_JSON_FILE}`);
  console.log(`Report Markdown: ${REPORT_MD_FILE}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
