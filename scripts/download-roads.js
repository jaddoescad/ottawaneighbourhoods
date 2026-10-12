#!/usr/bin/env node
/**
 * Download City of Ottawa road classification and pavement age layers and
 * derive per-neighbourhood road statistics plus major-road sample points.
 *
 * Sources:
 *   Roads - Classification  https://maps.ottawa.ca/arcgis/rest/services/Road_Information/MapServer/3
 *   Roads - Pavement Age    https://maps.ottawa.ca/arcgis/rest/services/Road_Information/MapServer/5
 *
 * Outputs:
 *   src/data/csv/road_stats_by_neighbourhood.csv
 *     id, roadKm, arterialKm, freewayKm, pavementKm, pavementAgeAvg
 *   src/data/csv/major_road_points.csv
 *     roadClass (freeway | arterial), lat, lng  - one point every 40 m, used for noise exposure
 */

const fs = require('fs');
const path = require('path');
const { arcgisQueryAll, samplePolyline, toCSV } = require('./lib/geo');
const { loadBoundaries, neighbourhoodLocator } = require('./lib/boundaries');

const CLASS_LAYER = 'https://maps.ottawa.ca/arcgis/rest/services/Road_Information/MapServer/3';
const PAVEMENT_LAYER = 'https://maps.ottawa.ca/arcgis/rest/services/Road_Information/MapServer/5';
const csvDir = path.join(__dirname, '..', 'src', 'data', 'csv');
const STEP_KM = 0.04;

const EXCLUDED_SUBCLASSES = new Set(['Busonly', 'Transitway', 'Emergency', 'Channel', 'Other']);
const FREEWAY_SUBCLASSES = new Set(['Freeway', 'Highway', 'Ramp']);
const ARTERIAL_SUBCLASSES = new Set(['Arterial', 'Parkway']);

async function main() {
  const boundaries = await loadBoundaries();
  const locator = neighbourhoodLocator(boundaries);
  const stats = {};
  for (const id of Object.keys(boundaries)) {
    stats[id] = { id, roadKm: 0, arterialKm: 0, freewayKm: 0, pavementKm: 0, pavementAgeSum: 0 };
  }

  console.log('Downloading road classification...');
  const roads = await arcgisQueryAll(
    CLASS_LAYER,
    { outFields: 'OBJECTID,SUBCLASS,CURRENT_STATUS', maxAllowableOffset: '0.00002', geometryPrecision: '6' },
    { concurrency: 4 }
  );
  const majorPoints = [];
  for (const f of roads) {
    const sub = f.attributes.SUBCLASS;
    if (!f.geometry || !f.geometry.paths || EXCLUDED_SUBCLASSES.has(sub)) continue;
    const roadClass = FREEWAY_SUBCLASSES.has(sub) ? 'freeway' : ARTERIAL_SUBCLASSES.has(sub) ? 'arterial' : 'other';
    for (const p of f.geometry.paths) {
      const pts = samplePolyline(p, STEP_KM);
      // Each sample stands for STEP_KM of road; the duplicated end point is dropped.
      for (const [lng, lat] of pts.slice(0, -1)) {
        const hit = locator.locate(lng, lat);
        if (hit) {
          stats[hit.id].roadKm += STEP_KM;
          if (roadClass === 'arterial') stats[hit.id].arterialKm += STEP_KM;
          if (roadClass === 'freeway') stats[hit.id].freewayKm += STEP_KM;
        }
        if (roadClass !== 'other') majorPoints.push({ roadClass, lat: lat.toFixed(5), lng: lng.toFixed(5) });
      }
    }
  }

  console.log('Downloading pavement age...');
  const pavement = await arcgisQueryAll(
    PAVEMENT_LAYER,
    { outFields: 'OBJECTID,RM_PAVEMENT_AGE', maxAllowableOffset: '0.00002', geometryPrecision: '6' },
    { concurrency: 4 }
  );
  for (const f of pavement) {
    const age = Number(f.attributes.RM_PAVEMENT_AGE);
    if (!f.geometry || !f.geometry.paths || !Number.isFinite(age) || age < 0 || age > 150) continue;
    for (const p of f.geometry.paths) {
      for (const [lng, lat] of samplePolyline(p, STEP_KM).slice(0, -1)) {
        const hit = locator.locate(lng, lat);
        if (!hit) continue;
        stats[hit.id].pavementKm += STEP_KM;
        stats[hit.id].pavementAgeSum += age * STEP_KM;
      }
    }
  }

  const rows = Object.values(stats).map((s) => ({
    id: s.id,
    roadKm: s.roadKm.toFixed(1),
    arterialKm: s.arterialKm.toFixed(1),
    freewayKm: s.freewayKm.toFixed(1),
    pavementKm: s.pavementKm.toFixed(1),
    pavementAgeAvg: s.pavementKm > 0 ? (s.pavementAgeSum / s.pavementKm).toFixed(1) : '',
  }));
  fs.writeFileSync(
    path.join(csvDir, 'road_stats_by_neighbourhood.csv'),
    toCSV(rows, ['id', 'roadKm', 'arterialKm', 'freewayKm', 'pavementKm', 'pavementAgeAvg'])
  );
  fs.writeFileSync(path.join(csvDir, 'major_road_points.csv'), toCSV(majorPoints, ['roadClass', 'lat', 'lng']));
  console.log(`Saved road stats for ${rows.length} neighbourhoods and ${majorPoints.length} major-road points`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
