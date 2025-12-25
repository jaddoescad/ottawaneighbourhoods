#!/usr/bin/env node
/**
 * Download Food Inspection Data from Ottawa Open Data
 *
 * Usage: node scripts/download-food-inspections.js
 *
 * Output:
 *   - src/data/csv/food_businesses.csv
 *   - src/data/csv/food_inspections.csv
 *   - src/data/csv/food_violations.csv
 *
 * Data Source: Ottawa Open Data (Yelp Health Scores format)
 * https://opendata.ottawa.ca/inspections/yelp_ottawa_healthscores_FoodSafety.zip
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ZIP_URL = 'https://opendata.ottawa.ca/inspections/yelp_ottawa_healthscores_FoodSafety.zip';
const CSV_DIR = path.join(__dirname, '..', 'src', 'data', 'csv');
const TEMP_DIR = '/tmp/food_inspection_download';

async function main() {
  console.log('=== Downloading Food Inspection Data (Ottawa Open Data) ===\n');
  console.log(`Source: ${ZIP_URL}\n`);

  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const zipPath = path.join(TEMP_DIR, 'food_inspection.zip');

  // Download ZIP file
  console.log('Downloading ZIP file...');
  try {
    execSync(`curl -sL "${ZIP_URL}" -o "${zipPath}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to download ZIP file:', err.message);
    process.exit(1);
  }

  // Extract ZIP file
  console.log('Extracting ZIP file...');
  try {
    execSync(`unzip -o "${zipPath}" -d "${TEMP_DIR}"`, { stdio: 'pipe' });
  } catch (err) {
    console.error('Failed to extract ZIP file:', err.message);
    process.exit(1);
  }

  // Copy relevant CSV files to project
  const filesToCopy = [
    { src: 'businesses.csv', dest: 'food_businesses.csv' },
    { src: 'inspections.csv', dest: 'food_inspections.csv' },
    { src: 'violations.csv', dest: 'food_violations.csv' },
  ];

  console.log('\nCopying files to project...');
  for (const file of filesToCopy) {
    const srcPath = path.join(TEMP_DIR, file.src);
    const destPath = path.join(CSV_DIR, file.dest);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      const lines = fs.readFileSync(destPath, 'utf8').split('\n').length - 1;
      console.log(`  ${file.dest}: ${lines.toLocaleString()} records`);
    } else {
      console.warn(`  Warning: ${file.src} not found in ZIP`);
    }
  }

  // Cleanup
  console.log('\nCleaning up temp files...');
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  console.log('\nDone! Files saved to src/data/csv/');
  console.log('\nNext steps:');
  console.log('  1. node scripts/process-food-inspections.js  # Aggregate by neighbourhood');
  console.log('  2. node scripts/process-data.js              # Rebuild website data');
}

main().catch((err) => {
  console.error('\nDownload failed:', err.message);
  process.exit(1);
});
