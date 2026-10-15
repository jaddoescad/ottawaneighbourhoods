#!/usr/bin/env node
/**
 * Download large parks and nature areas in Ottawa from OpenStreetMap.
 *
 * The City's Parks Inventory omits federal (NCC) land such as Major's Hill Park,
 * Confederation Park, Rockcliffe Park, Vincent Massey Park and the Greenbelt
 * forests. This layer fills that gap for the "large greenspace within 1 km"
 * metric only; parkland-per-resident still uses City parks (the City standard).
 *
 * Source: Overpass API (OpenStreetMap contributors, ODbL)
 * Output: src/data/csv/osm_greenspace_edge_points.csv (osmId, name, kind, areaHa, lat, lng)
 *         boundary points every 50 m for areas >= 4 ha
 *
 * Note: `out geom;` (not `out geom tags;`): the "tags" verbosity drops relation members,
 * which silently dropped every park mapped as a multipolygon relation.
 */

const fs = require('fs');
const path = require('path');
const { toCSV, sleep, ringAreaM2, samplePolyline } = require('./lib/geo');

const MIN_HA = 4;
const STEP_KM = 0.05;

const MIRRORS = [
  process.env.OVERPASS_URL,
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
].filter(Boolean);

const QUERY = `[out:json][timeout:180];
area["name"="Ottawa"]["admin_level"="6"]->.a;
(
  way["leisure"~"^(park|nature_reserve)$"](area.a);
  relation["leisure"~"^(park|nature_reserve)$"](area.a);
);
out geom;`;

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

const samePoint = (a, b) => Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7;

/** Joins open way segments end-to-end into closed rings. */
function assembleRings(segments) {
  const pool = segments.map((s) => [...s]);
  const rings = [];
  while (pool.length) {
    let ring = pool.shift();
    let extended = true;
    while (!samePoint(ring[0], ring[ring.length - 1]) && extended) {
      extended = false;
      for (let i = 0; i < pool.length; i++) {
        const s = pool[i];
        const end = ring[ring.length - 1];
        if (samePoint(end, s[0])) ring = ring.concat(s.slice(1));
        else if (samePoint(end, s[s.length - 1])) ring = ring.concat([...s].reverse().slice(1));
        else continue;
        pool.splice(i, 1);
        extended = true;
        break;
      }
    }
    if (samePoint(ring[0], ring[ring.length - 1])) rings.push(ring);
  }
  return rings;
}

function outerRings(el) {
  const toRing = (geom) => geom.map((p) => [p.lon, p.lat]);
  if (el.type === 'way' && el.geometry) return [toRing(el.geometry)];
  if (el.type === 'relation') {
    const segments = (el.members || [])
      .filter((m) => m.type === 'way' && m.role !== 'inner' && m.geometry)
      .map((m) => toRing(m.geometry));
    return assembleRings(segments);
  }
  return [];
}

async function main() {
  const { url, json } = await fetchOverpass();
  console.log(`Fetched ${json.elements.length} elements from ${url}`);
  const rows = [];
  let kept = 0;
  for (const el of json.elements) {
    const rings = outerRings(el);
    const areaHa = rings.reduce((s, r) => s + Math.abs(ringAreaM2(r)), 0) / 10000;
    if (areaHa < MIN_HA) continue;
    kept++;
    const t = el.tags || {};
    for (const ring of rings) {
      for (const [lng, lat] of samplePolyline(ring, STEP_KM)) {
        rows.push({
          osmId: `${el.type}/${el.id}`,
          name: t.name || '',
          kind: t.leisure,
          areaHa: areaHa.toFixed(1),
          lat: lat.toFixed(6),
          lng: lng.toFixed(6),
        });
      }
    }
  }
  const out = path.join(__dirname, '..', 'src', 'data', 'csv', 'osm_greenspace_edge_points.csv');
  fs.writeFileSync(out, toCSV(rows, ['osmId', 'name', 'kind', 'areaHa', 'lat', 'lng']));
  console.log(`Saved ${rows.length} edge points for ${kept} areas >= ${MIN_HA} ha to ${path.relative(process.cwd(), out)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
