#!/usr/bin/env node
/**
 * Build the resident-location layer from City of Ottawa municipal address points.
 *
 * Statistics Canada dissemination-block counts would be the textbook choice
 * (their download site rejects automated requests), so this uses address points:
 *
 *   1. Download every address point (~400K) with its creation date.
 *   2. Keep points on residential-capable zoning (residential, mixed-use, rural)
 *      and tag each as 'house' (R1-R3, villages, rural) or 'apartment' (R4, R5,
 *      main streets, mixed-use). Apartment buildings often have one address for
 *      many units, so process-data.js calibrates a per-neighbourhood weight for
 *      apartment addresses against 2021 Census household counts
 *      (scripts/lib/population.js).
 *   3. Assign each to a neighbourhood and a 100 m grid cell.
 *   4. Count addresses that existed on Census day 2021 and those added in each
 *      later year, so populations can be grown to the period of each data set.
 *   5. Flag addresses within 150 m of a freeway or 50 m of an arterial
 *      (noise-exposure metric).
 *
 * Sources:
 *   Address points  https://maps.ottawa.ca/arcgis/rest/services/Municipal_Address/MapServer/0
 *   Zoning          scripts/data/zoning.json (node scripts/download-zoning.js)
 *   Major roads     src/data/csv/major_road_points.csv (node scripts/download-roads.js)
 *
 * Output: src/data/csv/residential_grid.csv
 *   id, type, lat, lng, addresses, atCensus, addedByYear ("2022:14 2023:3"), nearMajorRoad
 *
 * Usage: node scripts/download-residential-points.js [--refresh]
 */

const fs = require('fs');
const path = require('path');
const { arcgisQueryAll, readCSV, toCSV, PointIndex, KM_PER_DEG_LAT, KM_PER_DEG_LNG } = require('./lib/geo');
const { loadBoundaries, neighbourhoodLocator } = require('./lib/boundaries');
const { loadZoningIndex, locateZone, zoneClass, dwellingType } = require('./lib/zoning');
const { parameters } = require('../src/data/scoring-config.json');

const LAYER = 'https://maps.ottawa.ca/arcgis/rest/services/Municipal_Address/MapServer/0';
const CACHE = path.join(__dirname, 'data', 'address_points_dated.json');
const csvDir = path.join(__dirname, '..', 'src', 'data', 'csv');
const CELL_KM = 0.1;
const FREEWAY_KM = 0.15;
const ARTERIAL_KM = 0.05;

async function loadAddressPoints(refresh) {
  if (!refresh && fs.existsSync(CACHE)) return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  console.log('Downloading municipal address points...');
  const features = await arcgisQueryAll(
    LAYER,
    { outFields: 'OBJECTID,CREATED_DATE,MODIFIED_DATE', geometryPrecision: '6' },
    { pageSize: 1000, concurrency: 6 }
  );
  // ~5% of points have no CREATED_DATE; their MODIFIED_DATE is the best available
  // bound (almost all predate 2021). Points with neither are treated as old.
  const points = features
    .filter((f) => f.geometry && Number.isFinite(f.geometry.x))
    .map((f) => [f.geometry.x, f.geometry.y, f.attributes.CREATED_DATE ?? f.attributes.MODIFIED_DATE ?? null]);
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

  const censusMs = Date.parse(parameters.censusDate);
  const cellLat = CELL_KM / KM_PER_DEG_LAT;
  const cellLng = CELL_KM / KM_PER_DEG_LNG;
  const cells = new Map();
  const classCounts = {};
  let outside = 0;

  for (const [lng, lat, created] of points) {
    const z = locateZone(zoning, lng, lat);
    const cls = z.zone ? zoneClass(z.zone) : 'unknown';
    classCounts[cls] = (classCounts[cls] || 0) + 1;
    if (cls !== 'residential' && cls !== 'mixed' && cls !== 'rural') continue;
    const hood = locator.locate(lng, lat);
    if (!hood) {
      outside++;
      continue;
    }
    const type = dwellingType(z.zone);
    const key = `${hood.id}|${type}|${Math.floor(lat / cellLat)}|${Math.floor(lng / cellLng)}`;
    let c = cells.get(key);
    if (!c) {
      c = { id: hood.id, type, sumLat: 0, sumLng: 0, addresses: 0, atCensus: 0, added: {}, nearMajorRoad: 0 };
      cells.set(key, c);
    }
    c.sumLat += lat;
    c.sumLng += lng;
    c.addresses++;
    if (created === null || created <= censusMs) c.atCensus++;
    else {
      const year = new Date(created).getUTCFullYear();
      c.added[year] = (c.added[year] || 0) + 1;
    }
    if (freeways.nearest(lat, lng, FREEWAY_KM) || arterials.nearest(lat, lng, ARTERIAL_KM)) c.nearMajorRoad++;
  }

  const rows = [...cells.values()]
    .map((c) => ({
      id: c.id,
      type: c.type,
      lat: (c.sumLat / c.addresses).toFixed(5),
      lng: (c.sumLng / c.addresses).toFixed(5),
      addresses: c.addresses,
      atCensus: c.atCensus,
      addedByYear: Object.entries(c.added)
        .sort(([a], [b]) => a - b)
        .map(([y, n]) => `${y}:${n}`)
        .join(' '),
      nearMajorRoad: c.nearMajorRoad,
    }))
    .sort((a, b) => a.id.localeCompare(b.id) || a.type.localeCompare(b.type) || a.lat - b.lat || a.lng - b.lng);

  fs.writeFileSync(
    path.join(csvDir, 'residential_grid.csv'),
    toCSV(rows, ['id', 'type', 'lat', 'lng', 'addresses', 'atCensus', 'addedByYear', 'nearMajorRoad'])
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
