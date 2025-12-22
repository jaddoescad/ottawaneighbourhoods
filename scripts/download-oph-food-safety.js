#!/usr/bin/env node
/**
 * Download Food Safety Establishments from Ottawa Public Health
 *
 * Usage: node scripts/download-oph-food-safety.js
 *
 * Output:
 *   - src/data/csv/oph_food_establishments.csv
 *
 * Data Source: Ottawa Public Health Inspections Portal
 * https://inspections.ottawapublichealth.ca/
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://inspections.ottawapublichealth.ca';
const FOOD_SAFETY_CATEGORY_ID = '38d803d4-263d-46c7-924e-9cdce09438e2';

function toCSV(rows, headers) {
  let csv = headers.join(',') + '\n';
  for (const row of rows) {
    const values = headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    });
    csv += values.join(',') + '\n';
  }
  return csv;
}

function parseHTMLRows(html) {
  const rows = [];

  // Split by listingRow divs
  const parts = html.split('<div class="listingRow">');

  for (let i = 1; i < parts.length; i++) {
    const rowHtml = parts[i];

    // Extract facility details
    const linkMatch = rowHtml.match(/<a href="\/Home\/Detail\/([^"]+)">\s*([^<]+)<\/a>/);
    const addressMatch = rowHtml.match(/<br \/>([^<]+)<\/div>/);
    const dateMatch = rowHtml.match(/<div>(\d{2}\/\d{2}\/\d{4})<\/div>/);
    const coordsMatch = rowHtml.match(/LatLng\("([^"]+)",\s*"([^"]+)"\)/);

    if (linkMatch) {
      rows.push({
        ID: linkMatch[1],
        NAME: linkMatch[2].trim(),
        ADDRESS: addressMatch ? addressMatch[1].trim() : '',
        LAST_INSPECTION: dateMatch ? dateMatch[1] : '',
        LATITUDE: coordsMatch ? parseFloat(coordsMatch[1]) : null,
        LONGITUDE: coordsMatch ? parseFloat(coordsMatch[2]) : null,
      });
    }
  }

  return rows;
}

async function fetchPage(blockNumber) {
  const url = `${BASE_URL}/Home/InfinateScroll`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `BlockNumber=${blockNumber}&model[Keyword]=&model[CategoryId]=${FOOD_SAFETY_CATEGORY_ID}`,
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

async function main() {
  console.log('=== Downloading Food Safety Establishments (Ottawa Public Health) ===\n');
  console.log(`Source: ${BASE_URL}/Home/Search?CategoryId=${FOOD_SAFETY_CATEGORY_ID}\n`);

  const allRows = [];
  let blockNumber = 1;
  let noMoreData = false;

  while (!noMoreData) {
    process.stdout.write(`Fetching block ${blockNumber}...`);

    try {
      const data = await fetchPage(blockNumber);
      const rows = parseHTMLRows(data.HTMLString || '');

      console.log(` found ${rows.length} establishments`);

      allRows.push(...rows);
      noMoreData = data.NoMoreData || rows.length === 0;
      blockNumber++;

      // Small delay to be nice to the server
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`\nError fetching block ${blockNumber}:`, err.message);
      break;
    }
  }

  // Remove duplicates by ID
  const uniqueRows = [];
  const seenIds = new Set();
  for (const row of allRows) {
    if (!seenIds.has(row.ID)) {
      seenIds.add(row.ID);
      uniqueRows.push(row);
    }
  }

  // Sort by name
  uniqueRows.sort((a, b) => a.NAME.localeCompare(b.NAME));

  // Save to CSV
  const csvDir = path.join(__dirname, '..', 'src', 'data', 'csv');
  const outPath = path.join(csvDir, 'oph_food_establishments.csv');

  const headers = ['ID', 'NAME', 'ADDRESS', 'LAST_INSPECTION', 'LATITUDE', 'LONGITUDE'];
  fs.writeFileSync(outPath, toCSV(uniqueRows, headers));

  console.log(`\nSaved ${uniqueRows.length} food establishments to: ${outPath}`);
  console.log('\nSample data:');
  uniqueRows.slice(0, 5).forEach(r => {
    console.log(`  - ${r.NAME} (${r.ADDRESS})`);
  });

  console.log('\nNote: This includes ALL food establishments (restaurants, cafes, food trucks, caterers, etc.)');
  console.log('Next: node scripts/process-data.js');
}

main().catch((err) => {
  console.error('\nDownload failed:', err.message);
  process.exit(1);
});
