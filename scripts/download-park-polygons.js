#!/usr/bin/env node
/**
 * Download park and greenspace polygons and sample points along each park's edge,
 * so access can be measured to the nearest park entrance-ish point rather than a
 * park's centre (a big park's centre can be a kilometre from its edge).
 *
 * Source: Parks and Greenspace
 *   https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer/24
 *
 * Output: src/data/csv/park_edge_points.csv
 *   parkId, name, parkType, areaHa, lat, lng   (one point every 50 m of perimeter)
 */

const fs = require('fs');
const path = require('path');
const { arcgisQueryAll, samplePolyline, ringAreaM2, toCSV } = require('./lib/geo');

const LAYER = 'https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer/24';
const STEP_KM = 0.05;

async function main() {
  console.log('Downloading park polygons...');
  const parks = await arcgisQueryAll(
    LAYER,
    { outFields: 'OBJECTID,PARK_ID,NAME,PARK_TYPE,OPEN', maxAllowableOffset: '0.00002', geometryPrecision: '6' },
    { concurrency: 2 }
  );
  const rows = [];
  let kept = 0;
  for (const f of parks) {
    const a = f.attributes;
    if (!f.geometry || !f.geometry.rings || !f.geometry.rings.length) continue;
    if (a.OPEN && /no|closed/i.test(String(a.OPEN))) continue;
    // Outer rings are clockwise in ArcGIS (negative signed area here); holes are positive.
    const rings = f.geometry.rings;
    const areaM2 = Math.abs(rings.reduce((s, r) => s + ringAreaM2(r), 0));
    const areaHa = areaM2 / 10000;
    kept++;
    for (const ring of rings) {
      for (const [lng, lat] of samplePolyline(ring, STEP_KM).slice(0, -1)) {
        rows.push({
          parkId: a.PARK_ID || a.OBJECTID,
          name: a.NAME || '',
          parkType: a.PARK_TYPE || '',
          areaHa: areaHa.toFixed(2),
          lat: lat.toFixed(5),
          lng: lng.toFixed(5),
        });
      }
    }
  }
  const out = path.join(__dirname, '..', 'src', 'data', 'csv', 'park_edge_points.csv');
  fs.writeFileSync(out, toCSV(rows, ['parkId', 'name', 'parkType', 'areaHa', 'lat', 'lng']));
  console.log(`Saved ${rows.length} edge points for ${kept} parks`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
