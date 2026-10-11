/**
 * Count-based rates for Safety and Health, with symmetric shrinkage toward the
 * city rate so small neighbourhoods are neither rewarded nor punished for noise.
 */

const path = require('path');
const fs = require('fs');
const { readCSV, PointIndex } = require('./geo');
const { shrinkRate } = require('./scoring');

const round = (v, d = 1) => (v === null || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);

const ZONE_WEIGHT = { residential: 1, rural: 1, mixed: null, unknown: null, nonresidential: 0 };

/**
 * Crime near homes. Incidents are attributed to the land they occurred on:
 * residential/rural land counts fully, main-street/mixed-use (and untagged)
 * incidents count at mixedUseIncidentWeight, and commercial/industrial/
 * institutional/park land is reported as context only.
 */
function computeCrimeRates({ crimeRaw, csvDir, locate, populationById, params }) {
  const tagsFile = path.join(csvDir, 'crime_zone_tags.csv');
  const tags = fs.existsSync(tagsFile) ? readCSV(tagsFile) : [];
  if (tags.length && tags.length !== crimeRaw.length) {
    throw new Error(`crime_zone_tags.csv has ${tags.length} rows but crime_raw.csv has ${crimeRaw.length}; rerun scripts/tag-crime-zones.js`);
  }
  const violent = new Set(params.violentCrimeCategories);
  const property = new Set(params.propertyCrimeCategories);
  const mixedW = params.mixedUseIncidentWeight;
  const years = new Set();
  const acc = {};
  const get = (id) =>
    (acc[id] = acc[id] || { violent: 0, property: 0, all: 0, commercial: 0, violentAll: 0, propertyAll: 0 });

  crimeRaw.forEach((row, i) => {
    const lat = parseFloat(row.LATITUDE);
    const lng = parseFloat(row.LONGITUDE);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const id = locate(lat, lng);
    if (!id) return;
    years.add(row.YEAR);
    const a = get(id);
    a.all++;
    const zoneClass = tags.length ? tags[i].zoneClass || 'unknown' : 'unknown';
    let w = ZONE_WEIGHT[zoneClass];
    if (w === null || w === undefined) w = mixedW;
    if (zoneClass === 'nonresidential') a.commercial++;
    if (violent.has(row.OFF_CATEG)) {
      a.violent += w;
      a.violentAll++;
    } else if (property.has(row.OFF_CATEG)) {
      a.property += w;
      a.propertyAll++;
    }
  });

  const nYears = years.size || 1;
  const k = params.shrinkagePersonYears;
  let cityViolent = 0;
  let cityProperty = 0;
  let cityPY = 0;
  for (const [id, pop] of Object.entries(populationById)) {
    if (!pop) continue;
    const a = acc[id] || get(id);
    cityViolent += a.violent;
    cityProperty += a.property;
    cityPY += pop * nYears;
  }
  const cityV = cityViolent / cityPY;
  const cityP = cityProperty / cityPY;

  const out = {};
  for (const [id, pop] of Object.entries(populationById)) {
    const a = acc[id] || get(id);
    const py = (pop || 0) * nYears;
    out[id] = {
      years: [...years].sort(),
      violentCrime: py > 0 ? round(shrinkRate(a.violent, py, cityV, k) * 1000, 2) : null,
      propertyCrime: py > 0 ? round(shrinkRate(a.property, py, cityP, k) * 1000, 2) : null,
      violentCrimeUnadjusted: py > 0 ? round((a.violent / py) * 1000, 2) : null,
      propertyCrimeUnadjusted: py > 0 ? round((a.property / py) * 1000, 2) : null,
      allCrimeRate: py > 0 ? round((a.all / py) * 1000, 1) : null,
      commercialAreaCrime: round(a.commercial / nYears, 0),
      incidentsPerYear: round(a.all / nYears, 0),
    };
  }
  return { byId: out, cityRates: { violent: round(cityV * 1000, 2), property: round(cityP * 1000, 2) }, years: [...years].sort() };
}

/**
 * Severity-weighted injury collisions per 10 km of non-freeway road per year.
 * Fatal/major-injury collisions count ksiWeight times; any collision involving
 * a pedestrian or cyclist is multiplied by vulnerableRoadUserWeight. Collisions
 * on or beside freeways (within freewayBufferKm) are excluded, as are freeway km.
 */
function computeRoadSafety({ collisionsRaw, csvDir, locate, params }) {
  const roadStats = Object.fromEntries(readCSV(path.join(csvDir, 'road_stats_by_neighbourhood.csv')).map((r) => [r.id, r]));
  const freewayPts = readCSV(path.join(csvDir, 'major_road_points.csv'))
    .filter((r) => r.roadClass === 'freeway')
    .map((r) => ({ lat: Number(r.lat), lng: Number(r.lng) }));
  const freeways = new PointIndex(freewayPts, 0.2);
  const int = (v) => parseInt(v, 10) || 0;
  const years = new Set();
  const acc = {};
  let excludedFreeway = 0;
  for (const c of collisionsRaw) {
    const lat = parseFloat(c.LATITUDE);
    const lng = parseFloat(c.LONGITUDE);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const id = locate(lat, lng);
    if (!id) continue;
    years.add(c.YEAR);
    const a = (acc[id] = acc[id] || { all: 0, injury: 0, ksi: 0, weighted: 0 });
    a.all++;
    const cls = c.CLASSIFICATION || '';
    const injury = cls.startsWith('01') || cls.startsWith('02');
    if (!injury) continue;
    if (freeways.nearest(lat, lng, params.freewayBufferKm)) {
      excludedFreeway++;
      continue;
    }
    const ksi = int(c.FATAL) > 0 || int(c.MAJOR) > 0 || cls.startsWith('01');
    const vru = int(c.PEDESTRIANS) > 0 || int(c.BICYCLES) > 0;
    a.injury++;
    if (ksi) a.ksi++;
    a.weighted += (ksi ? params.ksiWeight : 1) * (vru ? params.vulnerableRoadUserWeight : 1);
  }
  const nYears = years.size || 1;
  let cityW = 0;
  let cityKmY = 0;
  const kmById = {};
  for (const [id, r] of Object.entries(roadStats)) {
    const km = Math.max(0, Number(r.roadKm) - Number(r.freewayKm || 0));
    kmById[id] = km;
    cityW += acc[id] ? acc[id].weighted : 0;
    cityKmY += km * nYears;
  }
  const cityRate = cityW / cityKmY;
  const k = params.shrinkageRoadKmYears;
  const out = {};
  for (const [id, km] of Object.entries(kmById)) {
    const a = acc[id] || { all: 0, injury: 0, ksi: 0, weighted: 0 };
    const exposure = km * nYears;
    out[id] = {
      roadSafety: exposure > 0 ? round(shrinkRate(a.weighted, exposure, cityRate, k) * 10, 2) : null,
      roadSafetyUnadjusted: exposure > 0 ? round((a.weighted / exposure) * 10, 2) : null,
      localRoadKm: round(km, 1),
      allCollisions: round(a.all / nYears, 0),
      injuryCollisions: round(a.injury / nYears, 1),
      seriousCollisions: round(a.ksi / nYears, 1),
    };
  }
  return { byId: out, cityRate: round(cityRate * 10, 2), years: [...years].sort(), excludedFreeway };
}

/** Overdose ED visits per 100K per year, shrunk toward the city rate. */
function computeOverdoseRates({ yearlyVisitsById, populationById, years, params }) {
  const k = params.shrinkagePersonYears;
  let cityCount = 0;
  let cityPY = 0;
  for (const [id, v] of Object.entries(yearlyVisitsById)) {
    const pop = populationById[id] || 0;
    if (v === null || !pop) continue;
    cityCount += v * years;
    cityPY += pop * years;
  }
  const cityRate = cityCount / cityPY;
  const out = {};
  for (const [id, pop] of Object.entries(populationById)) {
    const v = yearlyVisitsById[id];
    if (v === null || v === undefined || !pop) {
      out[id] = { overdose: null, overdoseUnadjusted: null };
      continue;
    }
    out[id] = {
      overdose: round(shrinkRate(v * years, pop * years, cityRate, k) * 100000, 1),
      overdoseUnadjusted: round((v / pop) * 100000, 1),
    };
  }
  return { byId: out, cityRate: round(cityRate * 100000, 1) };
}

module.exports = { computeCrimeRates, computeRoadSafety, computeOverdoseRates };
