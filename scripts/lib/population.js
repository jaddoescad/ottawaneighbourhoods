/**
 * Dwelling weights and population estimates from the resident-location layer
 * (src/data/csv/residential_grid.csv).
 *
 * Dwelling weights: in house zones one address is about one dwelling, but an
 * apartment building often has a single address for all of its units. For each
 * neighbourhood, addresses that existed on Census day are calibrated to the 2021
 * Census household count:
 *   - fewer addresses than households: house addresses count 1 and apartment
 *     addresses absorb the shortfall (capped at maxApartmentAddressWeight);
 *   - more addresses than households (vacant lots, shop units): every address is
 *     scaled down by the same factor.
 * Since 2021 new apartment buildings are addressed unit by unit (SUBORD points),
 * so addresses added after Census day count as at most one dwelling each.
 *
 * Population at a date: 2021 Census population x (weighted dwellings that existed
 * at that date / weighted dwellings on Census day), i.e. household size is held
 * at its 2021 value. Addresses are assigned before homes are occupied, so a data
 * period is matched to addresses that existed addressLeadYears before its
 * midpoint.
 */

const path = require('path');
const { readCSV } = require('./geo');

const YEAR_MS = 365.25 * 24 * 3600 * 1000;

function parseAdded(s) {
  if (!s) return [];
  return s
    .split(' ')
    .filter(Boolean)
    .map((p) => p.split(':').map(Number));
}

function loadGrid(csvDir) {
  return readCSV(path.join(csvDir, 'residential_grid.csv')).map((r) => ({
    id: r.id,
    type: r.type,
    lat: Number(r.lat),
    lng: Number(r.lng),
    addresses: Number(r.addresses),
    atCensus: Number(r.atCensus),
    added: parseAdded(r.addedByYear),
    nearMajorRoad: Number(r.nearMajorRoad || 0),
  }));
}

/** Addresses in a grid row that existed at dateMs (later additions interpolated within their year). */
function addressesAt(row, dateMs, censusMs) {
  let n = row.atCensus;
  for (const [year, count] of row.added) {
    const start = Math.max(Date.UTC(year, 0, 1), censusMs);
    const end = Date.UTC(year + 1, 0, 1);
    const frac = Math.min(1, Math.max(0, (dateMs - start) / (end - start)));
    n += count * frac;
  }
  return n;
}

function dwellingWeights(rows, households, maxApartment) {
  let house = 0;
  let apartment = 0;
  for (const r of rows) {
    if (r.type === 'apartment') apartment += r.atCensus;
    else house += r.atCensus;
  }
  const total = house + apartment;
  if (!households || !total) return { house: 1, apartment: 1 };
  if (total >= households) {
    const f = households / total;
    return { house: f, apartment: f };
  }
  if (!apartment) return { house: Math.min(maxApartment, households / house), apartment: 1 };
  return { house: 1, apartment: Math.min(maxApartment, (households - house) / apartment) };
}

/** Date (ms) whose address count best represents residents during the given calendar years. */
function populationDateForYears(years, leadYears) {
  const ys = years.map(Number).filter(Number.isFinite);
  const mid = (Date.UTC(Math.min(...ys), 0, 1) + Date.UTC(Math.max(...ys) + 1, 0, 1)) / 2;
  return mid - leadYears * YEAR_MS;
}

/**
 * @param {object} opts
 * @param {string} opts.csvDir
 * @param {Record<string, number>} opts.householdsById  2021 Census private households
 * @param {Record<string, number>} opts.pop2021ById     2021 Census population
 * @param {object} opts.params  scoring-config parameters
 */
function computePopulation({ csvDir, householdsById, pop2021ById, params }) {
  const censusMs = Date.parse(params.censusDate);
  const rows = loadGrid(csvDir);
  const rowsById = {};
  for (const r of rows) (rowsById[r.id] = rowsById[r.id] || []).push(r);

  const byId = {};
  for (const [id, hoodRows] of Object.entries(rowsById)) {
    const w = dwellingWeights(hoodRows, householdsById[id] || 0, params.maxApartmentAddressWeight);
    for (const r of hoodRows) {
      r.weightAtCensus = w[r.type];
      r.weightAdded = Math.min(1, w[r.type]);
      r.dwellings = r.weightAtCensus * r.atCensus + r.weightAdded * (r.addresses - r.atCensus);
    }
    const dwellingsAt = (ms) =>
      hoodRows.reduce((s, r) => s + r.weightAtCensus * r.atCensus + r.weightAdded * (addressesAt(r, ms, censusMs) - r.atCensus), 0);
    const atCensus = hoodRows.reduce((s, r) => s + r.weightAtCensus * r.atCensus, 0);
    const now = hoodRows.reduce((s, r) => s + r.dwellings, 0);
    byId[id] = { weights: w, dwellingsAtCensus: atCensus, dwellingsNow: now, dwellingsAt };
  }

  const growthAt = (id, ms) => {
    const b = byId[id];
    if (!b || !b.dwellingsAtCensus) return 1;
    return ms === null ? b.dwellingsNow / b.dwellingsAtCensus : b.dwellingsAt(ms) / b.dwellingsAtCensus;
  };
  /** Population per neighbourhood at dateMs (null = today). */
  const populationAt = (ms) =>
    Object.fromEntries(Object.entries(pop2021ById).map(([id, pop]) => [id, pop ? Math.round(pop * growthAt(id, ms)) : 0]));

  return { rows, byId, growthAt, populationAt };
}

module.exports = { computePopulation, populationDateForYears, dwellingWeights, addressesAt };
