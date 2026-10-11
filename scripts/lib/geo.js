/**
 * Shared geometry, CSV and ArcGIS helpers for the data scripts.
 * Coordinates are WGS84; rings are arrays of [lng, lat].
 */

const fs = require('fs');

const EARTH_RADIUS_KM = 6371;
const KM_PER_DEG_LAT = 111.32;
// Ottawa sits around 45.3°N; used for cheap planar approximations and grid sizing.
const OTTAWA_LAT = 45.35;
const KM_PER_DEG_LNG = KM_PER_DEG_LAT * Math.cos((OTTAWA_LAT * Math.PI) / 180);

function haversineKm(lat1, lng1, lat2, lng2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * ArcGIS polygons list outer rings and holes together in one array, so a point
 * is inside when it falls in an odd number of rings.
 */
function pointInRings(lng, lat, rings) {
  let count = 0;
  for (const ring of rings) if (pointInRing(lng, lat, ring)) count++;
  return count % 2 === 1;
}

function ringsBbox(rings) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY };
}

function ringAreaM2(ring) {
  if (!ring || ring.length < 3) return 0;
  const avgLat = ring.reduce((s, [, lat]) => s + lat, 0) / ring.length;
  const cos0 = Math.cos((avgLat * Math.PI) / 180);
  const R = EARTH_RADIUS_KM * 1000;
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[(i + 1) % ring.length];
    const x1 = R * ((lng1 * Math.PI) / 180) * cos0;
    const y1 = R * ((lat1 * Math.PI) / 180);
    const x2 = R * ((lng2 * Math.PI) / 180) * cos0;
    const y2 = R * ((lat2 * Math.PI) / 180);
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

function polylineLengthKm(path) {
  let km = 0;
  for (let i = 1; i < path.length; i++) km += haversineKm(path[i - 1][1], path[i - 1][0], path[i][1], path[i][0]);
  return km;
}

/** Points every `stepKm` along a polyline (always includes both ends). */
function samplePolyline(path, stepKm) {
  const out = [];
  if (!path.length) return out;
  out.push(path[0]);
  let carry = 0;
  for (let i = 1; i < path.length; i++) {
    const [x1, y1] = path[i - 1];
    const [x2, y2] = path[i];
    const seg = haversineKm(y1, x1, y2, x2);
    let d = stepKm - carry;
    while (d < seg) {
      const t = d / seg;
      out.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
      d += stepKm;
    }
    carry = seg - (d - stepKm);
  }
  out.push(path[path.length - 1]);
  return out;
}

/**
 * Assigns points to polygons using a bbox prefilter.
 * `features` is [{ id, rings }]; one id may own several features.
 */
class PolygonLocator {
  constructor(features) {
    this.features = features.map((f) => ({ ...f, bbox: ringsBbox(f.rings) }));
  }

  locate(lng, lat) {
    for (const f of this.features) {
      const b = f.bbox;
      if (lng < b.minX || lng > b.maxX || lat < b.minY || lat > b.maxY) continue;
      if (pointInRings(lng, lat, f.rings)) return f;
    }
    return null;
  }
}

/**
 * Grid-bucketed polygon index for large polygon sets (zoning, parks).
 */
class PolygonGridIndex {
  constructor(features, cellDeg = 0.01) {
    this.cellDeg = cellDeg;
    this.cells = new Map();
    this.features = features.map((f) => ({ ...f, bbox: ringsBbox(f.rings) }));
    this.features.forEach((f, idx) => {
      const { minX, minY, maxX, maxY } = f.bbox;
      for (let cx = Math.floor(minX / cellDeg); cx <= Math.floor(maxX / cellDeg); cx++) {
        for (let cy = Math.floor(minY / cellDeg); cy <= Math.floor(maxY / cellDeg); cy++) {
          const key = `${cx}:${cy}`;
          if (!this.cells.has(key)) this.cells.set(key, []);
          this.cells.get(key).push(idx);
        }
      }
    });
  }

  locate(lng, lat) {
    const key = `${Math.floor(lng / this.cellDeg)}:${Math.floor(lat / this.cellDeg)}`;
    const candidates = this.cells.get(key);
    if (!candidates) return null;
    for (const idx of candidates) {
      const f = this.features[idx];
      const b = f.bbox;
      if (lng < b.minX || lng > b.maxX || lat < b.minY || lat > b.maxY) continue;
      if (pointInRings(lng, lat, f.rings)) return f;
    }
    return null;
  }
}

/**
 * Grid-bucketed point index for nearest-neighbour and radius queries.
 * Items must have numeric `lat` and `lng`.
 */
class PointIndex {
  constructor(items, cellKm = 1) {
    this.items = items.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    this.cellLat = cellKm / KM_PER_DEG_LAT;
    this.cellLng = cellKm / KM_PER_DEG_LNG;
    this.cellKm = cellKm;
    this.cells = new Map();
    for (const p of this.items) {
      const key = this._key(p.lat, p.lng);
      if (!this.cells.has(key)) this.cells.set(key, []);
      this.cells.get(key).push(p);
    }
  }

  _key(lat, lng) {
    return `${Math.floor(lat / this.cellLat)}:${Math.floor(lng / this.cellLng)}`;
  }

  _ring(lat, lng, r, fn) {
    const cy = Math.floor(lat / this.cellLat);
    const cx = Math.floor(lng / this.cellLng);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const bucket = this.cells.get(`${cy + dy}:${cx + dx}`);
        if (bucket) for (const p of bucket) fn(p);
      }
    }
  }

  /** Nearest item (optionally filtered) within maxKm. Returns { item, km } or null. */
  nearest(lat, lng, maxKm = 100, filter = null) {
    if (!this.items.length) return null;
    let best = null;
    let bestKm = Infinity;
    const maxRing = Math.ceil(maxKm / this.cellKm) + 1;
    for (let r = 0; r <= maxRing; r++) {
      this._ring(lat, lng, r, (p) => {
        if (filter && !filter(p)) return;
        const d = haversineKm(lat, lng, p.lat, p.lng);
        if (d < bestKm) {
          bestKm = d;
          best = p;
        }
      });
      // Anything in ring r+1 is at least r * cellKm away.
      if (best && bestKm <= r * this.cellKm) break;
    }
    return best && bestKm <= maxKm ? { item: best, km: bestKm } : null;
  }

  /** All items within radiusKm. */
  within(lat, lng, radiusKm, filter = null) {
    const out = [];
    const rings = Math.ceil(radiusKm / this.cellKm);
    for (let r = 0; r <= rings; r++) {
      this._ring(lat, lng, r, (p) => {
        if (filter && !filter(p)) return;
        if (haversineKm(lat, lng, p.lat, p.lng) <= radiusKm) out.push(p);
      });
    }
    return out;
  }
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(content) {
  const lines = content.replace(/\r/g, '').trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });
    return row;
  });
}

function readCSV(file) {
  return parseCSV(fs.readFileSync(file, 'utf8'));
}

function toCSV(rows, headers) {
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// HTTP / ArcGIS
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, options = {}, retries = 4) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json && json.error) throw new Error(`ArcGIS error: ${JSON.stringify(json.error)}`);
      return json;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await sleep(2000 * 2 ** attempt);
    }
  }
  throw lastErr;
}

/**
 * Pages through an ArcGIS MapServer layer query, returning every feature.
 * `params` are extra query parameters (outFields, where, maxAllowableOffset...).
 */
async function arcgisQueryAll(layerUrl, params = {}, { pageSize = 1000, concurrency = 4, log = true } = {}) {
  const base = { where: '1=1', outFields: '*', returnGeometry: 'true', outSR: '4326', f: 'json', ...params };
  const countUrl = `${layerUrl}/query?${new URLSearchParams({ ...base, returnCountOnly: 'true', returnGeometry: 'false' })}`;
  const { count } = await fetchJson(countUrl);
  const offsets = [];
  for (let o = 0; o < count; o += pageSize) offsets.push(o);
  const features = new Array(offsets.length);
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < offsets.length) {
      const i = next++;
      const qs = new URLSearchParams({
        ...base,
        resultOffset: String(offsets[i]),
        resultRecordCount: String(pageSize),
        orderByFields: 'OBJECTID',
      });
      const json = await fetchJson(`${layerUrl}/query?${qs}`);
      features[i] = json.features || [];
      done++;
      if (log && (done % 25 === 0 || done === offsets.length)) {
        process.stdout.write(`\r  ${done}/${offsets.length} pages`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  if (log) process.stdout.write('\n');
  return features.flat();
}

module.exports = {
  KM_PER_DEG_LAT,
  KM_PER_DEG_LNG,
  haversineKm,
  pointInRing,
  pointInRings,
  ringsBbox,
  ringAreaM2,
  polylineLengthKm,
  samplePolyline,
  PolygonLocator,
  PolygonGridIndex,
  PointIndex,
  parseCSV,
  parseCSVLine,
  readCSV,
  toCSV,
  fetchJson,
  arcgisQueryAll,
  sleep,
};
