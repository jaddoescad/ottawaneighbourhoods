#!/usr/bin/env node
/**
 * Download Gyms & Fitness Centers (OpenStreetMap via Overpass)
 *
 * Usage: node scripts/download-gyms.js
 *
 * Output:
 *   - src/data/csv/gyms_raw.csv
 *
 * Notes:
 *   - Uses a bounding box around Ottawa to fetch:
 *     - leisure=fitness_centre (gyms, fitness centers)
 *     - leisure=sports_centre (sports centers with gym facilities)
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

  console.log('=== Downloading Gyms & Fitness Centers (OSM / Overpass) ===\n');
  console.log(`Overpass: ${overpassUrl}`);
  console.log(`BBOX: ${bbox}\n`);

  const query = `
[out:json][timeout:180];
(
  node["leisure"="fitness_centre"](${bbox});
  way["leisure"="fitness_centre"](${bbox});
  relation["leisure"="fitness_centre"](${bbox});
  node["leisure"="sports_centre"](${bbox});
  way["leisure"="sports_centre"](${bbox});
  relation["leisure"="sports_centre"](${bbox});
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
    const leisureType = tags.leisure || '';

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

    // Determine category
    let category = 'Fitness Center';
    if (leisureType === 'sports_centre') {
      category = 'Sports Center';
    }

    // Get sport types if available
    const sport = tags.sport || '';

    rows.push({
      OSM_TYPE: el.type,
      OSM_ID: el.id,
      NAME: tags.name || '',
      LEISURE_TYPE: leisureType,
      CATEGORY: category,
      SPORT: sport,
      BRAND: tags.brand || '',
      OPERATOR: tags.operator || '',
      ADDRESS: [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
      PHONE: tags.phone || '',
      WEBSITE: tags.website || '',
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
  const outPath = path.join(csvDir, 'gyms_raw.csv');

  const headers = ['OSM_TYPE', 'OSM_ID', 'NAME', 'LEISURE_TYPE', 'CATEGORY', 'SPORT', 'BRAND', 'OPERATOR', 'ADDRESS', 'PHONE', 'WEBSITE', 'OPENING_HOURS', 'LATITUDE', 'LONGITUDE'];
  fs.writeFileSync(outPath, toCSV(rows, headers));

  // Print summary by category
  const byCategory = {};
  for (const row of rows) {
    byCategory[row.CATEGORY] = (byCategory[row.CATEGORY] || 0) + 1;
  }

  console.log(`Saved ${rows.length} gyms & fitness centers to: ${outPath}`);
  console.log('\nBreakdown by category:');
  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${cat}: ${count}`);
  }

  // Show some known brands
  const brands = {};
  for (const row of rows) {
    if (row.BRAND) {
      brands[row.BRAND] = (brands[row.BRAND] || 0) + 1;
    }
  }
  if (Object.keys(brands).length > 0) {
    console.log('\nBrands found:');
    for (const [brand, count] of Object.entries(brands).sort((a, b) => b[1] - a[1])) {
      console.log(`  - ${brand}: ${count}`);
    }
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
