#!/usr/bin/env node
/**
 * Download Grocery Stores (OpenStreetMap via Overpass)
 *
 * Usage: node scripts/download-grocery-stores.js
 *
 * Output:
 *   - src/data/csv/grocery_stores_raw.csv
 *
 * Notes:
 *   - Uses a bounding box around Ottawa to fetch:
 *     - shop=supermarket (large grocery stores: Loblaws, Metro, Sobeys, etc.)
 *     - shop=grocery (smaller grocery stores)
 *     - shop=greengrocer (produce/fruit stores)
 *   - Override Overpass instance with OVERPASS_URL.
 *   - Override bounding box with BBOX="south,west,north,east".
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_BBOX = '44.95,-76.65,45.62,-75.00'; // Ottawa + rural edges (south,west,north,east)

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

async function main() {
  const overpassUrl = process.env.OVERPASS_URL || DEFAULT_OVERPASS_URL;
  const bbox = process.env.BBOX || DEFAULT_BBOX;

  console.log('=== Downloading Grocery Stores (OSM / Overpass) ===\n');
  console.log(`Overpass: ${overpassUrl}`);
  console.log(`BBOX: ${bbox}\n`);

  const query = `
[out:json][timeout:180];
(
  node["shop"="supermarket"](${bbox});
  way["shop"="supermarket"](${bbox});
  relation["shop"="supermarket"](${bbox});
  node["shop"="grocery"](${bbox});
  way["shop"="grocery"](${bbox});
  relation["shop"="grocery"](${bbox});
  node["shop"="greengrocer"](${bbox});
  way["shop"="greengrocer"](${bbox});
  relation["shop"="greengrocer"](${bbox});
);
out center tags;
`;

  const response = await fetch(overpassUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: new URLSearchParams({ data: query }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Overpass error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const elements = Array.isArray(data.elements) ? data.elements : [];

  const rows = [];
  let skippedNoCoords = 0;

  for (const el of elements) {
    const tags = el.tags || {};
    const shopType = tags.shop || '';

    const lat = el.type === 'node'
      ? el.lat
      : (el.center ? el.center.lat : null);
    const lng = el.type === 'node'
      ? el.lon
      : (el.center ? el.center.lon : null);

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      skippedNoCoords++;
      continue;
    }

    // Determine store category based on shop type and brand
    let category = 'Grocery Store';
    if (shopType === 'supermarket') {
      category = 'Supermarket';
    } else if (shopType === 'greengrocer') {
      category = 'Produce Store';
    }

    rows.push({
      OSM_TYPE: el.type,
      OSM_ID: el.id,
      NAME: tags.name || '',
      SHOP_TYPE: shopType,
      CATEGORY: category,
      BRAND: tags.brand || '',
      OPERATOR: tags.operator || '',
      ADDRESS: [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
      OPENING_HOURS: tags.opening_hours || '',
      LATITUDE: lat,
      LONGITUDE: lng,
    });
  }

  // Sort for stable diffs
  rows.sort((a, b) => {
    if (a.CATEGORY !== b.CATEGORY) return a.CATEGORY.localeCompare(b.CATEGORY);
    if (a.NAME !== b.NAME) return a.NAME.localeCompare(b.NAME);
    return (a.OSM_ID || 0) - (b.OSM_ID || 0);
  });

  const csvDir = path.join(__dirname, '..', 'src', 'data', 'csv');
  const outPath = path.join(csvDir, 'grocery_stores_raw.csv');

  const headers = ['OSM_TYPE', 'OSM_ID', 'NAME', 'SHOP_TYPE', 'CATEGORY', 'BRAND', 'OPERATOR', 'ADDRESS', 'OPENING_HOURS', 'LATITUDE', 'LONGITUDE'];
  fs.writeFileSync(outPath, toCSV(rows, headers));

  // Print summary by category
  const byCategory = {};
  for (const row of rows) {
    byCategory[row.CATEGORY] = (byCategory[row.CATEGORY] || 0) + 1;
  }

  console.log(`Saved ${rows.length} grocery stores to: ${outPath}`);
  console.log('\nBreakdown by category:');
  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${cat}: ${count}`);
  }

  if (skippedNoCoords > 0) {
    console.log(`\nSkipped ${skippedNoCoords} elements without coordinates`);
  }
  console.log('\nNext: node scripts/process-data.js');
}

main().catch((err) => {
  console.error('\nDownload failed:', err.message);
  process.exit(1);
});
