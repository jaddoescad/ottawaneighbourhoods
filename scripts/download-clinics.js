#!/usr/bin/env node
/**
 * Download family-doctor offices and walk-in / community health clinics in
 * Ottawa from OpenStreetMap. Used as an interim primary-care access proxy until
 * neighbourhood-level primary-care attachment data is published.
 *
 * Source: Overpass API (OpenStreetMap contributors, ODbL)
 * Output: src/data/csv/clinics_raw.csv  (OSM_TYPE, OSM_ID, NAME, KIND, LATITUDE, LONGITUDE)
 *
 * Excludes clinics tagged with a non-primary-care specialty (dentist,
 * physiotherapy, veterinary, cosmetic, etc.).
 */

const fs = require('fs');
const path = require('path');
const { toCSV, sleep } = require('./lib/geo');

const MIRRORS = [
  process.env.OVERPASS_URL,
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
].filter(Boolean);

const QUERY = `[out:json][timeout:120];
area["name"="Ottawa"]["admin_level"="6"]->.a;
(
  nwr["amenity"="doctors"](area.a);
  nwr["amenity"="clinic"](area.a);
  nwr["healthcare"="doctor"](area.a);
  nwr["healthcare"="clinic"](area.a);
  nwr["healthcare"="centre"](area.a);
);
out center tags;`;

const NON_PRIMARY = /dent|orthodont|physio|chiro|veterin|animal|cosmetic|aesthetic|laser|derma|optom|ophthal|eye|hearing|audiol|massage|fertility|dialysis|blood|lab|imaging|radiol|x-ray|ultrasound|psycho|counsel|abortion|naturopath|acupunct|podiat|foot|orthot|speech|occupational|rehab|sleep|vein|hair|weight|plastic|surgery|cancer|oncol|cannabis|neurolog|cardio|gastro|urolog|allerg|pain|o\.a\.t\.c|addiction|sport|pediatric dent|travel/i;

async function fetchOverpass() {
  for (const url of MIRRORS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'ottawahoods-data/1.0 (https://www.ottawahoods.com)',
          },
          body: new URLSearchParams({ data: QUERY }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return { url, json: await res.json() };
      } catch (e) {
        console.log(`  ${url} attempt ${attempt + 1} failed: ${e.message}`);
        await sleep(5000 * (attempt + 1));
      }
    }
  }
  throw new Error('All Overpass mirrors failed');
}

async function main() {
  const { url, json } = await fetchOverpass();
  console.log(`Fetched from ${url}`);
  const rows = [];
  const seen = new Set();
  for (const el of json.elements || []) {
    const t = el.tags || {};
    const lat = el.lat ?? (el.center && el.center.lat);
    const lng = el.lon ?? (el.center && el.center.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const descriptor = [t.name, t['healthcare:speciality'], t.healthcare, t.description].filter(Boolean).join(' ');
    const speciality = t['healthcare:speciality'] || '';
    const isGeneral = /general|family|primary|walk/i.test(speciality);
    if (!isGeneral && NON_PRIMARY.test(descriptor)) continue;
    const key = `${(t.name || '').toLowerCase()}|${lat.toFixed(4)}|${lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      OSM_TYPE: el.type,
      OSM_ID: el.id,
      NAME: t.name || '',
      KIND: t.amenity || t.healthcare || '',
      LATITUDE: lat.toFixed(6),
      LONGITUDE: lng.toFixed(6),
    });
  }
  rows.sort((a, b) => String(a.OSM_ID).localeCompare(String(b.OSM_ID)));
  const out = path.join(__dirname, '..', 'src', 'data', 'csv', 'clinics_raw.csv');
  fs.writeFileSync(out, toCSV(rows, ['OSM_TYPE', 'OSM_ID', 'NAME', 'KIND', 'LATITUDE', 'LONGITUDE']));
  console.log(`Saved ${rows.length} primary-care locations to ${path.relative(process.cwd(), out)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
