#!/usr/bin/env node
/**
 * Download EQAO School Data from Ontario Open Data
 *
 * Downloads the School Information and Student Demographics dataset,
 * extracts EQAO scores for Ottawa schools, and saves to CSV.
 *
 * Usage: node scripts/download-eqao-data.js
 *
 * Output: src/data/csv/eqao_scores.csv
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const EQAO_URL = 'https://data.ontario.ca/dataset/d85f68c5-fcb0-4b4d-aec5-3047db47dcd5/resource/f381e1de-3aa8-4ae9-826a-20009a6f4a01/download/new_sif_data_table_2023_24prelim_en_october2025.xlsx';
const TEMP_FILE = path.join(__dirname, 'temp_eqao.xlsx');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'csv', 'eqao_scores.csv');

// EQAO score fields for elementary schools
const ELEM_SCORE_FIELDS = [
  'Percentage of Grade 3 Students Achieving the Provincial Standard in Reading',
  'Percentage of Grade 3 Students Achieving the Provincial Standard in Writing',
  'Percentage of Grade 3 Students Achieving the Provincial Standard in Mathematics',
  'Percentage of Grade 6 Students Achieving the Provincial Standard in Reading',
  'Percentage of Grade 6 Students Achieving the Provincial Standard in Writing',
  'Percentage of Grade 6 Students Achieving the Provincial Standard in Mathematics',
];

// EQAO score fields for secondary schools
const SEC_SCORE_FIELDS = [
  'Percentage of Grade 9 Students Achieving the Provincial Standard in Mathematics',
  'Percentage of Students That Passed the Grade 10 OSSLT on Their First Attempt'
];

async function main() {
  console.log('=== EQAO School Data Downloader ===\n');

  // Step 1: Download using curl (more reliable than Node https)
  console.log('Downloading EQAO data from Ontario Open Data...');
  console.log(`URL: ${EQAO_URL}\n`);

  try {
    execSync(`curl -L -A "Mozilla/5.0" -o "${TEMP_FILE}" "${EQAO_URL}"`, {
      stdio: 'inherit'
    });
  } catch (e) {
    console.error('Failed to download file. Try again later or download manually.');
    process.exit(1);
  }

  // Step 2: Parse Excel file
  console.log('\nParsing EQAO Excel file...');
  const workbook = XLSX.readFile(TEMP_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);
  console.log(`Found ${data.length} total school records`);

  // Step 3: Filter for Ottawa schools
  console.log('\nFiltering for Ottawa schools...');
  const ottawaSchools = data.filter(row => {
    const board = (row['Board Name'] || '').toLowerCase();
    const city = (row['City'] || '').toLowerCase();
    return board.includes('ottawa') || city.includes('ottawa');
  });
  console.log(`Found ${ottawaSchools.length} Ottawa schools`);

  // Step 4: Extract and calculate scores
  console.log('\nCalculating EQAO scores...');
  const processed = ottawaSchools.map(s => {
    const level = s['School Level'];
    const isElem = level === 'Elementary';
    const isSec = level === 'Secondary';
    const isBoth = level === 'Elementary/Secondary';

    let scoreFields = [];
    if (isElem) scoreFields = ELEM_SCORE_FIELDS;
    else if (isSec) scoreFields = SEC_SCORE_FIELDS;
    else if (isBoth) scoreFields = [...ELEM_SCORE_FIELDS, ...SEC_SCORE_FIELDS];

    const validScores = [];
    scoreFields.forEach(f => {
      const v = s[f];
      // Values are decimals (0.75 = 75%), convert to percentage
      if (typeof v === 'number' && v >= 0 && v <= 1) {
        validScores.push(v * 100);
      } else if (typeof v === 'number' && v > 1 && v <= 100) {
        validScores.push(v);
      }
    });

    const avgScore = validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : null;

    return {
      schoolName: s['School Name'],
      boardName: s['Board Name'],
      schoolLevel: level,
      avgScore
    };
  });

  // Filter to only schools with scores
  const withScores = processed.filter(p => p.avgScore !== null);
  console.log(`${withScores.length} schools have valid EQAO scores`);

  // Step 5: Save to CSV
  console.log(`\nSaving to ${OUTPUT_FILE}...`);
  const csvHeader = 'schoolName,boardName,schoolLevel,avgScore';
  const csvRows = withScores
    .sort((a, b) => b.avgScore - a.avgScore) // Sort by score descending
    .map(s =>
      `"${s.schoolName.replace(/"/g, '""')}","${s.boardName.replace(/"/g, '""')}","${s.schoolLevel}",${s.avgScore}`
    );
  fs.writeFileSync(OUTPUT_FILE, [csvHeader, ...csvRows].join('\n'));
  console.log(`Saved ${withScores.length} schools`);

  // Step 6: Clean up
  fs.unlinkSync(TEMP_FILE);
  console.log('Cleaned up temporary files');

  // Summary
  console.log('\n=== Summary ===');
  const avgOfAvg = withScores.reduce((sum, s) => sum + s.avgScore, 0) / withScores.length;
  console.log(`Total Ottawa schools with EQAO scores: ${withScores.length}`);
  console.log(`Average score across all schools: ${avgOfAvg.toFixed(1)}%`);

  console.log('\nTop 5 schools:');
  withScores.slice(0, 5).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.schoolName} (${s.avgScore}%)`);
  });

  console.log('\nDone! Run "node scripts/process-data.js" to update neighbourhood data.');
}

main().catch(console.error);
