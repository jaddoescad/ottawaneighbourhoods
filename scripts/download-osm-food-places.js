#!/usr/bin/env node
/**
 * Download ALL Food Places from OpenStreetMap (Overpass API)
 *
 * Includes: restaurants, cafes, fast_food, pubs, bars, bakeries, coffee shops, food courts
 *
 * Usage: node scripts/download-osm-food-places.js
 *
 * Output:
 *   - src/data/csv/osm_food_places.csv
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_BBOX = '44.95,-76.65,45.62,-75.00'; // Ottawa + rural edges

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

  console.log('=== Downloading ALL Food Places (OSM / Overpass) ===\n');
  console.log(`Overpass: ${overpassUrl}`);
  console.log(`BBOX: ${bbox}\n`);

  // Extended query to get all food-related places
  const query = `
[out:json][timeout:300];
(
  // Restaurants
  node["amenity"="restaurant"](${bbox});
  way["amenity"="restaurant"](${bbox});
  relation["amenity"="restaurant"](${bbox});

  // Cafes
  node["amenity"="cafe"](${bbox});
  way["amenity"="cafe"](${bbox});
  relation["amenity"="cafe"](${bbox});

  // Fast food
  node["amenity"="fast_food"](${bbox});
  way["amenity"="fast_food"](${bbox});
  relation["amenity"="fast_food"](${bbox});

  // Pubs
  node["amenity"="pub"](${bbox});
  way["amenity"="pub"](${bbox});
  relation["amenity"="pub"](${bbox});

  // Bars
  node["amenity"="bar"](${bbox});
  way["amenity"="bar"](${bbox});
  relation["amenity"="bar"](${bbox});

  // Food courts
  node["amenity"="food_court"](${bbox});
  way["amenity"="food_court"](${bbox});
  relation["amenity"="food_court"](${bbox});

  // Bakeries
  node["shop"="bakery"](${bbox});
  way["shop"="bakery"](${bbox});

  // Coffee shops
  node["shop"="coffee"](${bbox});
  way["shop"="coffee"](${bbox});

  // Ice cream
  node["amenity"="ice_cream"](${bbox});
  way["amenity"="ice_cream"](${bbox});

  // Biergarten
  node["amenity"="biergarten"](${bbox});
  way["amenity"="biergarten"](${bbox});
);
out center tags;
`;

  console.log('Fetching from Overpass API...');
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

  console.log(`Received ${elements.length} elements from OSM\n`);

  const rows = [];
  let skippedNoCoords = 0;
  const typeCounts = {};

  for (const el of elements) {
    const tags = el.tags || {};

    // Determine the category
    let category = '';
    if (tags.amenity === 'restaurant') category = 'restaurant';
    else if (tags.amenity === 'cafe') category = 'cafe';
    else if (tags.amenity === 'fast_food') category = 'fast_food';
    else if (tags.amenity === 'pub') category = 'pub';
    else if (tags.amenity === 'bar') category = 'bar';
    else if (tags.amenity === 'food_court') category = 'food_court';
    else if (tags.amenity === 'ice_cream') category = 'ice_cream';
    else if (tags.amenity === 'biergarten') category = 'biergarten';
    else if (tags.shop === 'bakery') category = 'bakery';
    else if (tags.shop === 'coffee') category = 'coffee_shop';

    typeCounts[category] = (typeCounts[category] || 0) + 1;

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
      CATEGORY: category,
      CUISINE: tags.cuisine || '',
      BRAND: tags.brand || '',
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
  const outPath = path.join(csvDir, 'osm_food_places.csv');

  const headers = ['OSM_TYPE', 'OSM_ID', 'NAME', 'CATEGORY', 'CUISINE', 'BRAND', 'LATITUDE', 'LONGITUDE'];
  fs.writeFileSync(outPath, toCSV(rows, headers));

  console.log('Category breakdown:');
  Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  console.log(`\nSaved ${rows.length} places to: ${outPath}`);
  if (skippedNoCoords > 0) {
    console.log(`Skipped ${skippedNoCoords} elements without coordinates`);
  }
}

main().catch((err) => {
  console.error('\nDownload failed:', err.message);
  process.exit(1);
});
