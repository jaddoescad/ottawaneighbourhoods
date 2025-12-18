#!/usr/bin/env node
/**
 * Download Restaurants & Cafes (OpenStreetMap via Overpass)
 *
 * Usage: node scripts/download-restaurants-cafes.js
 *
 * Output:
 *   - src/data/csv/restaurants_cafes_raw.csv
 *
 * Notes:
 *   - Uses a bounding box around Ottawa to fetch amenity=restaurant and amenity=cafe.
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

  console.log('=== Downloading Restaurants & Cafes (OSM / Overpass) ===\n');
  console.log(`Overpass: ${overpassUrl}`);
  console.log(`BBOX: ${bbox}\n`);

  const query = `
[out:json][timeout:180];
(
  node["amenity"="restaurant"](${bbox});
  way["amenity"="restaurant"](${bbox});
  relation["amenity"="restaurant"](${bbox});
  node["amenity"="cafe"](${bbox});
  way["amenity"="cafe"](${bbox});
  relation["amenity"="cafe"](${bbox});
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
    const type = tags.amenity || '';

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

    rows.push({
      OSM_TYPE: el.type,
      OSM_ID: el.id,
      NAME: tags.name || '',
      TYPE: type,
      CUISINE: tags.cuisine || '',
      LATITUDE: lat,
      LONGITUDE: lng,
    });
  }

  // Sort for stable diffs
  rows.sort((a, b) => {
    if (a.TYPE !== b.TYPE) return a.TYPE.localeCompare(b.TYPE);
    if (a.NAME !== b.NAME) return a.NAME.localeCompare(b.NAME);
    return (a.OSM_ID || 0) - (b.OSM_ID || 0);
  });

  const csvDir = path.join(__dirname, '..', 'src', 'data', 'csv');
  const outPath = path.join(csvDir, 'restaurants_cafes_raw.csv');

  const headers = ['OSM_TYPE', 'OSM_ID', 'NAME', 'TYPE', 'CUISINE', 'LATITUDE', 'LONGITUDE'];
  fs.writeFileSync(outPath, toCSV(rows, headers));

  console.log(`Saved ${rows.length} places to: ${outPath}`);
  if (skippedNoCoords > 0) {
    console.log(`Skipped ${skippedNoCoords} elements without coordinates`);
  }
  console.log('\nNext: node scripts/process-data.js');
}

main().catch((err) => {
  console.error('\nDownload failed:', err.message);
  process.exit(1);
});

