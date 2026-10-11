#!/usr/bin/env node
/**
 * Download EQAO School Data from Ontario Open Data
 *
 * Downloads the last three English "School information and student demographics"
 * tables, extracts EQAO results for Ottawa schools and averages each school
 * across the available years (single-year results for small schools are noisy).
 *
 * Usage: node scripts/download-eqao-data.js
 *
 * Output: src/data/csv/eqao_scores.csv
 *   schoolName, boardName, schoolLevel, avgScore (multi-year mean), yearsAveraged, years, schoolNumber
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const PACKAGE_API = 'https://data.ontario.ca/api/3/action/package_show?id=d85f68c5-fcb0-4b4d-aec5-3047db47dcd5';
const YEARS_TO_AVERAGE = 3;
const TEMP_FILE = path.join(__dirname, 'temp_eqao.xlsx');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'csv', 'eqao_scores.csv');

// Matched case-insensitively against column headers, which vary slightly by year.
const ELEM_PATTERNS = [
  [/grade 3/, /reading/],
  [/grade 3/, /writing/],
  [/grade 3/, /math/],
  [/grade 6/, /reading/],
  [/grade 6/, /writing/],
  [/grade 6/, /math/],
];
const SEC_PATTERNS = [
  [/grade 9/, /math/],
  [/osslt/, /first attempt/],
];

function schoolYearOf(resource) {
  const m = resource.url.match(/(20\d\d)_(?:20)?(\d\d)/);
  return m ? `${m[1]}-${m[2]}` : null;
}

function findColumns(headers, patterns) {
  return patterns
    .map((pats) => headers.find((h) => /percentage|passed/i.test(h) && pats.every((p) => p.test(h.toLowerCase()))))
    .filter(Boolean);
}

function toPercent(v) {
  // Some years store "73%" strings, others 0.73 numbers.
  if (typeof v === 'string') {
    const m = v.trim().match(/^(\d+(?:\.\d+)?)\s*%$/);
    return m ? parseFloat(m[1]) : null;
  }
  if (typeof v !== 'number') return null;
  if (v >= 0 && v <= 1) return v * 100;
  if (v > 1 && v <= 100) return v;
  return null;
}

async function main() {
  console.log('=== EQAO School Data Downloader ===\n');
  const pkg = await (await fetch(PACKAGE_API)).json();
  const resources = pkg.result.resources
    .filter((r) => /_en[_.]/i.test(r.url) && /\.xlsx$/i.test(r.url))
    .map((r) => ({ ...r, schoolYear: schoolYearOf(r) }))
    .filter((r) => r.schoolYear)
    .sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));
  const byYear = new Map();
  for (const r of resources) if (!byYear.has(r.schoolYear)) byYear.set(r.schoolYear, r);
  const chosen = [...byYear.values()].slice(0, YEARS_TO_AVERAGE);

  const schools = new Map();
  for (const r of chosen) {
    console.log(`Downloading ${r.schoolYear}: ${r.url}`);
    execSync(`curl -sL -A "Mozilla/5.0" -o "${TEMP_FILE}" "${r.url}"`);
    const workbook = XLSX.readFile(TEMP_FILE);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    const headers = Object.keys(rows[0] || {});
    const elemCols = findColumns(headers, ELEM_PATTERNS);
    const secCols = findColumns(headers, SEC_PATTERNS);
    let count = 0;
    for (const s of rows) {
      const board = String(s['Board Name'] || '').toLowerCase();
      const city = String(s['City'] || '').toLowerCase();
      if (!board.includes('ottawa') && !city.includes('ottawa')) continue;
      const level = s['School Level'];
      const cols =
        level === 'Elementary' ? elemCols : level === 'Secondary' ? secCols : [...elemCols, ...secCols];
      const values = cols.map((c) => toPercent(s[c])).filter((v) => v !== null);
      if (!values.length) continue;
      const key = String(s['School Number'] || s['School Name']);
      if (!schools.has(key)) {
        schools.set(key, {
          schoolNumber: s['School Number'] || '',
          schoolName: s['School Name'],
          boardName: s['Board Name'],
          schoolLevel: level,
          yearly: {},
        });
      }
      schools.get(key).yearly[r.schoolYear] = values.reduce((a, b) => a + b, 0) / values.length;
      count++;
    }
    console.log(`  ${count} Ottawa schools with results (${elemCols.length} elementary / ${secCols.length} secondary columns)`);
    fs.unlinkSync(TEMP_FILE);
  }

  const out = [...schools.values()].map((s) => {
    const years = Object.keys(s.yearly).sort();
    const avg = years.reduce((sum, y) => sum + s.yearly[y], 0) / years.length;
    return { ...s, avgScore: Math.round(avg), yearsAveraged: years.length, years: years.join(' ') };
  });
  out.sort((a, b) => b.avgScore - a.avgScore || a.schoolName.localeCompare(b.schoolName));

  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = ['schoolName,boardName,schoolLevel,avgScore,yearsAveraged,years,schoolNumber'];
  for (const s of out) {
    lines.push(
      [esc(s.schoolName), esc(s.boardName), esc(s.schoolLevel), s.avgScore, s.yearsAveraged, esc(s.years), esc(s.schoolNumber)].join(',')
    );
  }
  fs.writeFileSync(OUTPUT_FILE, lines.join('\n') + '\n');
  console.log(`\nSaved ${out.length} schools to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
  console.log(`Years averaged: ${chosen.map((r) => r.schoolYear).join(', ')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
