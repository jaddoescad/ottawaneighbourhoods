#!/usr/bin/env node
/**
 * Download City of Ottawa zoning (By-law 2008-250 consolidation) polygons.
 *
 * Source: https://maps.ottawa.ca/arcgis/rest/services/Zoning/MapServer/3
 * Output: scripts/data/zoning.json (cache, not committed). Geometry is
 * generalized to ~3 m, which is plenty for classifying points.
 *
 * Used by download-residential-points.js and tag-crime-zones.js.
 */

const fs = require('fs');
const path = require('path');
const { arcgisQueryAll } = require('./lib/geo');

const LAYER = 'https://maps.ottawa.ca/arcgis/rest/services/Zoning/MapServer/3';
const OUT = path.join(__dirname, 'data', 'zoning.json');

async function main() {
  console.log('Downloading zoning polygons...');
  const features = await arcgisQueryAll(
    LAYER,
    { outFields: 'OBJECTID,ZONE_MAIN,ZONE_CODE', maxAllowableOffset: '0.00003', geometryPrecision: '6' },
    { pageSize: 1000, concurrency: 3 }
  );
  const zones = features
    .filter((f) => f.geometry && f.geometry.rings && f.geometry.rings.length)
    .map((f) => ({ zone: f.attributes.ZONE_MAIN, code: f.attributes.ZONE_CODE, rings: f.geometry.rings }));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(zones));
  console.log(`Saved ${zones.length} zoning polygons to ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
