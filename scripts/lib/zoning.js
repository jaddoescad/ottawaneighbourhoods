/**
 * Zoning lookups shared by the residential-points and crime-tagging scripts.
 */

const fs = require('fs');
const path = require('path');
const { PolygonGridIndex, KM_PER_DEG_LAT, KM_PER_DEG_LNG } = require('./geo');

const ZONING_PATH = path.join(__dirname, '..', 'data', 'zoning.json');

// Zoning By-law 2008-250 parent zones.
const ZONE_CLASSES = {
  residential: ['R1', 'R2', 'R3', 'R4', 'R5', 'RM', 'RR', 'V1', 'V2', 'V3'],
  // Main streets and mixed-use centres: people live here, but so do bars, shops and offices.
  mixed: ['AM', 'GM', 'TM', 'MC', 'MD', 'VM', 'LC', 'TD'],
  // Countryside zones where farmhouses and rural homes sit.
  rural: ['RU', 'AG'],
};

function zoneClass(zoneMain) {
  for (const [cls, zones] of Object.entries(ZONE_CLASSES)) if (zones.includes(zoneMain)) return cls;
  return 'nonresidential';
}

function loadZoningIndex() {
  if (!fs.existsSync(ZONING_PATH)) {
    throw new Error('scripts/data/zoning.json missing. Run: node scripts/download-zoning.js');
  }
  const zones = JSON.parse(fs.readFileSync(ZONING_PATH, 'utf8'));
  return new PolygonGridIndex(zones, 0.005);
}

// Street rights-of-way are not zoned, and police/collision points often sit on
// the street, so look at the closest zoned land within ~45 m.
const SNAP_STEPS_M = [10, 20, 30, 45];
const SNAP_DIRECTIONS = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);

function locateZone(index, lng, lat) {
  const hit = index.locate(lng, lat);
  if (hit) return { zone: hit.zone, snappedM: 0 };
  for (const m of SNAP_STEPS_M) {
    for (const a of SNAP_DIRECTIONS) {
      const dLat = (Math.sin(a) * m) / 1000 / KM_PER_DEG_LAT;
      const dLng = (Math.cos(a) * m) / 1000 / KM_PER_DEG_LNG;
      const h = index.locate(lng + dLng, lat + dLat);
      if (h) return { zone: h.zone, snappedM: m };
    }
  }
  return { zone: null, snappedM: null };
}

module.exports = { ZONE_CLASSES, zoneClass, loadZoningIndex, locateZone };
