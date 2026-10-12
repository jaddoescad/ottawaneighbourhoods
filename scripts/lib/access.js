/**
 * Population-weighted access metrics.
 *
 * Every neighbourhood is represented by its residential grid cells
 * (src/data/csv/residential_grid.csv, built from municipal address points on
 * residential-capable zoning). Each cell carries a share of the neighbourhood's
 * population proportional to its estimated dwellings (scripts/lib/population.js), so "distance to X" and "share of
 * residents within d of X" are measured from where people actually live rather
 * than from a polygon's centre or its boundary line.
 */

const fs = require('fs');
const path = require('path');
const { readCSV, PointIndex, haversineKm, samplePolyline } = require('./geo');

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const round = (v, d = 1) => (v === null || v === undefined || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);

function loadCells(residentRows, populationById) {
  const totals = {};
  for (const r of residentRows) totals[r.id] = (totals[r.id] || 0) + r.dwellings;
  return residentRows.map((r) => {
    const dwellings = r.dwellings;
    const pop = populationById[r.id] || 0;
    return {
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      addresses: r.addresses,
      dwellings,
      dwellingsNearMajorRoad: r.addresses ? (r.nearMajorRoad * dwellings) / r.addresses : 0,
      pop: totals[r.id] ? (pop * dwellings) / totals[r.id] : 0,
    };
  });
}

/** Weighted mean of fn(cell) over a neighbourhood's cells, ignoring null results. */
function weightedMean(cells, fn, weightKey = 'pop') {
  let sum = 0;
  let w = 0;
  for (const c of cells) {
    const v = fn(c);
    if (v === null || v === undefined || !Number.isFinite(v)) continue;
    sum += v * c[weightKey];
    w += c[weightKey];
  }
  return w > 0 ? sum / w : null;
}

// OPH's "grocery" category also covers convenience stores, gas stations,
// pharmacies and dollar stores, which don't sell a full range of fresh food.
const GROCERY_EXCLUDE =
  /CIRCLE K|PETRO|ESSO|SHELL|ULTRAMAR|MAC'?S|COUCHE|7-?ELEVEN|DOLLAR|SHOPPERS|REXALL|PHARM|DRUG|CONVENIENCE|CONFECTION|VARIETY|D[EÉ]PANNEUR|GAS BAR|FUEL|ON THE RUN|HUSKY|PIONEER|CANADIAN TIRE|XMARKET|QUICKIE|HASTY|BULK BARN|LCBO|BEER|WINE|CANDY|CHOCOLATE|NUTRITION|VITAMIN|SUPPLEMENT|GNC|TOBACCO|PIZZA|GRILL|STARBUCKS|SUSHI|MOBIL|KABAB|BROAST|TAKEOUT|WHOLESALE|NATIONAL GROCERS|BUSINESS CENTRE|GROCER DIRECT|AFC |HEALTH FOOD|BAKERY|CAFE|COFFEE/i;
const GROCERY_INCLUDE =
  /LOBLAW|\bMETRO\b|FOOD ?BASICS|FRESHCO|SOBEYS|FARM BOY|INDEPEND[AE]NT|SUPERSTORE|NO FRILLS|WAL-?MART|COSTCO|GIANT TIGER|T ?&(AMP;)? ?T SUPERMARKET|ADONIS|\bIGA\b|VALU-?MART|\bLOEB\b|PRODUCE DEPOT|SUPERMARKET|GROCER|GROCETERIA|FOOD MARKET|FOOD CENTRE|ASIAN MARKET|HALAL MARKET|FRUIT MARKET/i;

function isFullServiceGrocery(name) {
  return !!name && GROCERY_INCLUDE.test(name) && !GROCERY_EXCLUDE.test(name);
}

function pointsFromCSV(file, latKey, lngKey, extra = () => ({})) {
  if (!fs.existsSync(file)) return [];
  return readCSV(file)
    .map((r) => ({ lat: num(r[latKey]), lng: num(r[lngKey]), ...extra(r) }))
    .filter((p) => p.lat !== null && p.lng !== null);
}

function cyclingPoints(scriptsDataDir, protectedTypes) {
  const file = path.join(scriptsDataDir, 'cycling_network.geojson');
  if (!fs.existsSync(file)) return [];
  const geo = JSON.parse(fs.readFileSync(file, 'utf8'));
  const pts = [];
  for (const f of geo.features) {
    if (!protectedTypes.includes(f.properties.type)) continue;
    const lines = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const line of lines) for (const [lng, lat] of samplePolyline(line, 0.05)) pts.push({ lat, lng });
  }
  return pts;
}

/**
 * @param {object} opts
 * @param {string} opts.csvDir
 * @param {string} opts.scriptsDataDir
 * @param {Record<string, number>} opts.populationById  current population estimate
 * @param {Array} opts.residentRows  residential grid rows with a dwelling weight (scripts/lib/population.js)
 * @param {Array} opts.schools  [{ board, category, lat, lng, eqaoScore, eqaoLevel }]
 * @param {object} opts.params  scoring-config parameters
 */
function computeAccessMetrics({ csvDir, scriptsDataDir, populationById, residentRows, schools, params }) {
  const cells = loadCells(residentRows, populationById);
  const cellsById = {};
  for (const c of cells) (cellsById[c.id] = cellsById[c.id] || []).push(c);

  // ---- Destination layers -------------------------------------------------
  const food = pointsFromCSV(path.join(csvDir, 'oph_categorized.csv'), 'LATITUDE', 'LONGITUDE', (r) => ({
    category: r.CATEGORY,
    name: r.NAME,
  }));
  const grocery = new PointIndex(
    food.filter((p) => (p.category === 'grocery' || p.category === 'specialty_food') && isFullServiceGrocery(p.name)),
    0.5
  );
  const diningCategories = new Set(['restaurant', 'cafe', 'fast_food', 'coffee_shop', 'bakery', 'pub', 'bar', 'ice_cream', 'food_court']);
  const dining = new PointIndex(food.filter((p) => diningCategories.has(p.category)), 0.4);
  const recreation = new PointIndex(pointsFromCSV(path.join(csvDir, 'recreation_facilities_raw.csv'), 'LATITUDE', 'LONGITUDE'), 1);
  const libraries = new PointIndex(pointsFromCSV(path.join(csvDir, 'libraries_raw.csv'), 'LATITUDE', 'LONGITUDE'), 2);
  const edNames = params.emergencyDepartments.map((n) => n.toLowerCase());
  const hospitals = pointsFromCSV(path.join(csvDir, 'hospitals_raw.csv'), 'LATITUDE', 'LONGITUDE', (r) => ({ name: r.NAME }));
  const emergency = new PointIndex(hospitals.filter((h) => edNames.includes(h.name.toLowerCase())), 3);
  const clinics = new PointIndex(pointsFromCSV(path.join(csvDir, 'clinics_raw.csv'), 'LATITUDE', 'LONGITUDE'), 1);
  const parkEdges = pointsFromCSV(path.join(csvDir, 'park_edge_points.csv'), 'lat', 'lng', (r) => ({
    parkId: r.parkId,
    areaHa: num(r.areaHa) || 0,
  }));
  const parks = new PointIndex(parkEdges, 0.4);
  const greenbelt = pointsFromCSV(path.join(csvDir, 'ncc_greenbelt_trails.csv'), 'LATITUDE', 'LONGITUDE');
  const osmGreenspace = pointsFromCSV(path.join(csvDir, 'osm_greenspace_edge_points.csv'), 'lat', 'lng', (r) => ({
    areaHa: num(r.areaHa) || 0,
  }));
  const largeGreenspace = new PointIndex(
    [...parkEdges, ...osmGreenspace].filter((p) => p.areaHa >= params.largeGreenspaceHa).concat(greenbelt),
    0.5
  );
  const freeways = new PointIndex(
    pointsFromCSV(path.join(csvDir, 'major_road_points.csv'), 'lat', 'lng', (r) => ({ roadClass: r.roadClass })).filter(
      (p) => p.roadClass === 'freeway'
    ),
    1
  );
  const bikeways = new PointIndex(cyclingPoints(scriptsDataDir, params.protectedCyclingTypes), 0.4);
  const stops = pointsFromCSV(path.join(csvDir, 'transit_stop_frequency.csv'), 'lat', 'lng', (r) => ({
    rail: r.rail === '1',
    lines: (r.lineDepartures || '')
      .split(' ')
      .filter(Boolean)
      .map((s) => {
        const [line, n] = s.split('=');
        return [line, Number(n)];
      }),
  }));
  const stopIndex = new PointIndex(stops, 0.4);

  const isPublicBoard = (s) => ['OCDSB', 'OCSB', 'CECCE', 'CÉPEO'].includes(s.board);
  const isElementary = (s) => s.category === 'Elementary' || s.category === 'Elementary/Secondary';
  const elementaryAny = new PointIndex(schools.filter((s) => isPublicBoard(s) && isElementary(s)), 1);
  const eqaoIndex = (board, level) =>
    new PointIndex(schools.filter((s) => s.board === board && s.eqaoScore !== null && s.eqaoLevel === level), 1.5);
  const eqao = {
    elementary: [eqaoIndex('OCDSB', 'Elementary'), eqaoIndex('OCSB', 'Elementary')],
    secondary: [eqaoIndex('OCDSB', 'Secondary'), eqaoIndex('OCSB', 'Secondary')],
  };
  const downtown = params.downtown;
  const cellIndex = new PointIndex(cells, 0.5);

  // ---- Per-cell measures ---------------------------------------------------
  const nearestKm = (index, c, max = 60) => {
    const hit = index.nearest(c.lat, c.lng, max);
    return hit ? hit.km : null;
  };
  const within = (index, c, km) => (index.nearest(c.lat, c.lng, km) ? 1 : 0);
  const nearestEqao = (indexes, c) => {
    const scores = indexes
      .map((idx) => idx.nearest(c.lat, c.lng, params.schoolSearchKm))
      .filter(Boolean)
      .map((h) => h.item.eqaoScore);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  };
  const transitPerHour = (c) => {
    const best = new Map();
    for (const s of stopIndex.within(c.lat, c.lng, params.railWalkKm)) {
      if (!s.rail && haversineKm(c.lat, c.lng, s.lat, s.lng) > params.busWalkKm) continue;
      for (const [line, n] of s.lines) if (!best.has(line) || best.get(line) < n) best.set(line, n);
    }
    let total = 0;
    for (const n of best.values()) total += n;
    return total / params.peakHours;
  };
  const parklandPer1000 = (c) => {
    const areaByPark = new Map();
    for (const p of parks.within(c.lat, c.lng, params.parklandRadiusKm)) areaByPark.set(p.parkId, p.areaHa);
    let ha = 0;
    for (const a of areaByPark.values()) ha += a;
    let residents = 0;
    for (const other of cellIndex.within(c.lat, c.lng, params.parklandRadiusKm)) residents += other.pop;
    return residents > 0 ? ha / (residents / 1000) : null;
  };

  const out = {};
  for (const [id, hoodCells] of Object.entries(cellsById)) {
    const addresses = hoodCells.reduce((s, c) => s + c.addresses, 0);
    const dwellings = hoodCells.reduce((s, c) => s + c.dwellings, 0);
    const nearMajor = hoodCells.reduce((s, c) => s + c.dwellingsNearMajorRoad, 0);
    const mean = (fn) => weightedMean(hoodCells, fn);
    const pct = (fn) => {
      const v = mean(fn);
      return v === null ? null : v * 100;
    };
    out[id] = {
      residentialCells: hoodCells.length,
      residentialAddresses: addresses,
      dwellingsEstimate: Math.round(dwellings),
      // Schools
      elementaryEqao: round(mean((c) => nearestEqao(eqao.elementary, c)), 1),
      secondaryEqao: round(mean((c) => nearestEqao(eqao.secondary, c)), 1),
      elementaryKm: round(mean((c) => nearestKm(elementaryAny, c)), 2),
      // Health & environment
      emergencyKm: round(mean((c) => nearestKm(emergency, c, 100)), 2),
      clinicKm: round(mean((c) => nearestKm(clinics, c, 60)), 2),
      noisePct: dwellings > 0 ? round((nearMajor / dwellings) * 100, 1) : null,
      // Amenities
      groceryPct: round(pct((c) => within(grocery, c, params.groceryKm)), 1),
      parkPct: round(pct((c) => within(parks, c, params.parkKm)), 1),
      diningPct: round(pct((c) => (dining.within(c.lat, c.lng, params.diningKm).length >= params.diningMinPlaces ? 1 : 0)), 1),
      recreationPct: round(pct((c) => within(recreation, c, params.recreationKm)), 1),
      libraryKm: round(mean((c) => nearestKm(libraries, c)), 2),
      // Getting around
      transitPerHour: round(mean(transitPerHour), 1),
      downtownKm: round(mean((c) => haversineKm(c.lat, c.lng, downtown.lat, downtown.lng)), 1),
      bikewayPct: round(pct((c) => within(bikeways, c, params.bikewayKm)), 1),
      highwayKm: round(mean((c) => nearestKm(freeways, c)), 2),
      // Nature
      greenspacePct: round(pct((c) => within(largeGreenspace, c, params.greenspaceKm)), 1),
      parklandHaPer1000: round(mean(parklandPer1000), 2),
    };
  }
  return out;
}

module.exports = { computeAccessMetrics, weightedMean, isFullServiceGrocery };
