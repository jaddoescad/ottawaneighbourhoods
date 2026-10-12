#!/usr/bin/env node
/**
 * Tag every police-reported incident with the zoning class of the land it sits on.
 *
 * Input:  src/data/csv/crime_raw.csv, scripts/data/zoning.json
 * Output: src/data/csv/crime_zone_tags.csv (one row per crime_raw.csv row, same order)
 *
 * Zone classes (see scripts/lib/zoning.js):
 *   residential     R1-R5, RM, RR, V1-V3
 *   mixed           main streets / mixed-use centres (AM, GM, TM, MC, MD, VM, LC, TD)
 *   rural           RU, AG
 *   nonresidential  commercial-only, industrial, institutional, parks, airport...
 *   unknown         no zoned land within 45 m
 */

const fs = require('fs');
const path = require('path');
const { readCSV, toCSV } = require('./lib/geo');
const { loadZoningIndex, locateZone, zoneClass } = require('./lib/zoning');

const csvDir = path.join(__dirname, '..', 'src', 'data', 'csv');

function main() {
  const index = loadZoningIndex();
  const crimes = readCSV(path.join(csvDir, 'crime_raw.csv'));
  const counts = {};
  const rows = crimes.map((c, i) => {
    const lat = parseFloat(c.LATITUDE);
    const lng = parseFloat(c.LONGITUDE);
    let zone = '';
    let cls = 'unknown';
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const hit = locateZone(index, lng, lat);
      if (hit.zone) {
        zone = hit.zone;
        cls = zoneClass(hit.zone);
      }
    }
    counts[cls] = (counts[cls] || 0) + 1;
    return { row: i, zone, zoneClass: cls };
  });
  fs.writeFileSync(path.join(csvDir, 'crime_zone_tags.csv'), toCSV(rows, ['row', 'zone', 'zoneClass']));
  console.log(`Tagged ${rows.length} incidents:`, counts);
}

main();
