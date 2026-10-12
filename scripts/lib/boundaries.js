/**
 * Loads Gen 3 (2024) neighbourhood boundaries for every neighbourhood in
 * scripts/config/neighbourhood-mapping.js, caching them in
 * scripts/data/boundaries.json so the derived-data scripts don't refetch.
 */

const fs = require('fs');
const path = require('path');
const neighbourhoodMapping = require('../config/neighbourhood-mapping.js');
const { fetchJson, PolygonLocator } = require('./geo');

const NEIGHBOURHOODS_API = 'https://maps.ottawa.ca/arcgis/rest/services/Neighbourhoods/MapServer/2/query';
const CACHE_PATH = path.join(__dirname, '..', 'data', 'boundaries.json');

async function fetchBoundaryRings(onsId) {
  const qs = new URLSearchParams({
    where: `ONS_ID=${onsId}`,
    outFields: 'ONS_ID,NAME',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'json',
  });
  const json = await fetchJson(`${NEIGHBOURHOODS_API}?${qs}`);
  const feature = json.features && json.features[0];
  return feature && feature.geometry ? feature.geometry.rings : null;
}

/** Returns { [neighbourhoodId]: [{ onsId, rings }] }. */
async function loadBoundaries({ refresh = false } = {}) {
  if (!refresh && fs.existsSync(CACHE_PATH)) {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  }
  console.log('Fetching neighbourhood boundaries (Gen 3)...');
  const out = {};
  for (const [id, config] of Object.entries(neighbourhoodMapping)) {
    if (config.customBoundary) {
      out[id] = [{ onsId: 'custom', rings: config.customBoundary.rings }];
      continue;
    }
    out[id] = [];
    for (const onsId of config.onsSqoIds || []) {
      const rings = await fetchBoundaryRings(onsId);
      if (rings) out[id].push({ onsId, rings });
    }
  }
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(out));
  return out;
}

function neighbourhoodLocator(boundaries) {
  const features = [];
  for (const [id, parts] of Object.entries(boundaries)) {
    for (const part of parts) features.push({ id, onsId: part.onsId, rings: part.rings });
  }
  return new PolygonLocator(features);
}

module.exports = { loadBoundaries, neighbourhoodLocator, CACHE_PATH };
