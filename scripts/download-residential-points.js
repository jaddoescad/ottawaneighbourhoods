#!/usr/bin/env node
/**
 * Build a population-weighting layer from City of Ottawa municipal address points.
 *
 * Statistics Canada dissemination-block files would be the textbook choice, but
 * municipal address points are finer-grained and include individual units
 * (ADDRTYPE = SUBORD), so they approximate where dwellings are.
 *
 * Steps:
 *   1. Download every address point (~400K).
 *   2. Keep points on residential-capable zoning (residential, mixed-use, rural).
 *   3. Assign each to a neighbourhood and a 100 m grid cell.
 *   4. Measure, per address, closeness to freeways (<=150 m) and arterials (<=50 m)
 *      for the noise-exposure metric.
 *
 * Sources:
 *   Address points  https://maps.ottawa.ca/arcgis/rest/services/Municipal_Address/MapServer/0
 *   Zoning          scripts/data/zoning.json (node scripts/download-zoning.js)
 *   Major roads     src/data/csv/major_road_points.csv (node scripts/download-roads.js)
 *
 * Output: src/data/csv/residential_grid.csv
 *   id, lat, lng, addresses, nearFreeway, nearArterial, nearMajorRoad (either)
 *
 * Usage: node scripts/download-residential-points.js [--refresh]
 */

const fs = require('fs');
const path = require('path');
const { arcgisQueryAll, readCSV, toCSV, PointIndex, KM_PER_DEG_LAT, KM_PER_DEG_LNG } = require('./lib/geo');
const { loadBoundaries, neighbourhoodLocator } = require('./lib/boundaries');
const { loadZoningIndex, locateZone, zoneClass } = require('./lib/zoning');

const LAYER = 'https://maps.ottawa.ca/arcgis/rest/services/Municipal_Address/MapServer/0';
const CACHE = path.join(__dirname, 'data', 'address_points.json');
const csvDir = path.join(__dirname, '..', 'src', 'data', 'csv');
const CELL_KM = 0.1;
const FREEWAY_KM = 0.15;
const ARTERIAL_KM = 0.05;

async function loadAddressPoints(refresh) {
  if (!refresh && fs.existsSync(CACHE)) return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  console.log('Downloading municipal address points...');
  const features = await arcgisQueryAll(
    LAYER,
    { outFields: 'OBJECTID,ADDRTYPE', geometryPrecision: '6' },
    { pageSize: 1000, concurrency: 6 }
  );
  const points = features
    .filter((f) => f.geometry && Number.isFinite(f.geometry.x))
    .map((f) => [f.geometry.x, f.geometry.y]);
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(points));
  return points;
}

async function main() {
  const refresh = process.argv.includes('--refresh');
  const points = await loadAddressPoints(refresh);
  console.log(`  ${points.length} address points`);

  const boundaries = await loadBoundaries();
  const locator = neighbourhoodLocator(boundaries);
  const zoning = loadZoningIndex();
  const roads = readCSV(path.join(csvDir, 'major_road_points.csv')).map((r) => ({
    roadClass: r.roadClass,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lng),
  }));
  const freeways = new PointIndex(roads.filter((r) => r.roadClass === 'freeway'), 0.2);
  const arterials = new PointIndex(roads.filter((r) => r.roadClass === 'arterial'), 0.2);

  const cellLat = CELL_KM / KM_PER_DEG_LAT;
  const cellLng = CELL_KM / KM_PER_DEG_LNG;
  const cells = new Map();
  const classCounts = {};
  let outside = 0;

  for (const [lng, lat] of points) {
    const z = locateZone(zoning, lng, lat);
    const cls = z.zone ? zoneClass(z.zone) : 'unknown';
    classCounts[cls] = (classCounts[cls] || 0) + 1;
    if (cls !== 'residential' && cls !== 'mixed' && cls !== 'rural') continue;
    const hood = locator.locate(lng, lat);
    if (!hood) {
      outside++;
      continue;
    }
    const key = `${hood.id}|${Math.floor(lat / cellLat)}|${Math.floor(lng / cellLng)}`;
    let c = cells.get(key);
    if (!c) {
      c = { id: hood.id, sumLat: 0, sumLng: 0, addresses: 0, nearFreeway: 0, nearArterial: 0, nearMajorRoad: 0 };
      cells.set(key, c);
    }
    c.sumLat += lat;
    c.sumLng += lng;
    c.addresses++;
    const nearFreeway = !!freeways.nearest(lat, lng, FREEWAY_KM);
    const nearArterial = !!arterials.nearest(lat, lng, ARTERIAL_KM);
    if (nearFreeway) c.nearFreeway++;
    if (nearArterial) c.nearArterial++;
    if (nearFreeway || nearArterial) c.nearMajorRoad++;
  }

  const rows = [...cells.values()]
    .map((c) => ({
      id: c.id,
      lat: (c.sumLat / c.addresses).toFixed(5),
      lng: (c.sumLng / c.addresses).toFixed(5),
      addresses: c.addresses,
      nearFreeway: c.nearFreeway,
      nearArterial: c.nearArterial,
      nearMajorRoad: c.nearMajorRoad,
    }))
    .sort((a, b) => a.id.localeCompare(b.id) || a.lat - b.lat || a.lng - b.lng);

  fs.writeFileSync(
    path.join(csvDir, 'residential_grid.csv'),
    toCSV(rows, ['id', 'lat', 'lng', 'addresses', 'nearFreeway', 'nearArterial', 'nearMajorRoad'])
  );

  const perHood = {};
  for (const r of rows) perHood[r.id] = (perHood[r.id] || 0) + r.addresses;
  const missing = Object.keys(boundaries).filter((id) => !perHood[id]);
  console.log('Address zoning classes:', classCounts);
  console.log(`Outside mapped neighbourhoods: ${outside}`);
  console.log(`Saved ${rows.length} residential cells covering ${Object.keys(perHood).length} neighbourhoods`);
  if (missing.length) console.log('Neighbourhoods with no residential addresses:', missing.join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
