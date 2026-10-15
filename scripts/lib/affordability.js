/**
 * Rent and home value from one consistent source (2021 Census via ONS-SQO),
 * scaled to today's market with one citywide factor per measure:
 *   factor = median over neighbourhoods of (sourced recent figure / census figure)
 * Hand-collected figures marked as estimates are never used for the factor.
 *
 * Subsidized units pull a census median rent below what someone moving in would pay,
 * so census rent first adds back the citywide effect of the share of tenants in
 * subsidized housing (the slope of median rent on that share across neighbourhoods).
 */

const path = require('path');
const { readCSV } = require('./geo');

const isEstimate = (source) => !source || /estimat/i.test(source);

function median(values) {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

/**
 * @param {object} opts
 * @param {string} opts.csvDir
 * @param {Record<string, {rent: number|null, value: number|null}>} opts.censusById  population-weighted census medians
 */
/** Slope of census median rent on % of tenants in subsidized housing (<= 0), across neighbourhoods. */
function subsidySlope(censusById) {
  const rows = Object.values(censusById).filter((c) => Number.isFinite(c.rent) && Number.isFinite(c.subsidized));
  if (rows.length < 10) return 0;
  const mx = rows.reduce((s, c) => s + c.subsidized, 0) / rows.length;
  const my = rows.reduce((s, c) => s + c.rent, 0) / rows.length;
  let sxy = 0;
  let sxx = 0;
  for (const c of rows) {
    sxy += (c.subsidized - mx) * (c.rent - my);
    sxx += (c.subsidized - mx) ** 2;
  }
  return sxx > 0 ? Math.min(0, sxy / sxx) : 0;
}

function computeAffordability({ csvDir, censusById: rawCensusById }) {
  const slope = subsidySlope(rawCensusById);
  const censusById = Object.fromEntries(
    Object.entries(rawCensusById).map(([id, c]) => [
      id,
      { ...c, rawRent: c.rent, rent: c.rent ? Math.round(c.rent - slope * (c.subsidized || 0)) : c.rent },
    ])
  );
  const rentRows = Object.fromEntries(readCSV(path.join(csvDir, 'rent_data.csv')).map((r) => [r.id, r]));
  const priceRows = Object.fromEntries(readCSV(path.join(csvDir, 'home_prices.csv')).map((r) => [r.id, r]));

  const rentRatios = [];
  const valueRatios = [];
  for (const [id, census] of Object.entries(censusById)) {
    const r = rentRows[id];
    if (r && !isEstimate(r.rentSource) && census.rent) rentRatios.push(Number(r.avgRent) / census.rent);
    const p = priceRows[id];
    if (p && !isEstimate(p.priceSource) && census.value) valueRatios.push(Number(p.avgHomePrice) / census.value);
  }
  const rentFactor = median(rentRatios);
  const valueFactor = median(valueRatios);

  const out = {};
  for (const [id, census] of Object.entries(censusById)) {
    const r = rentRows[id];
    const p = priceRows[id];
    out[id] = {
      rent: census.rent && rentFactor ? Math.round((census.rent * rentFactor) / 10) * 10 : null,
      homePrice: census.value && valueFactor ? Math.round((census.value * valueFactor) / 1000) * 1000 : null,
      censusRent2021: census.rawRent || null,
      censusHomeValue2021: census.value || null,
      marketRent: r ? Number(r.avgRent) || null : null,
      marketRentSource: r ? r.rentSource : null,
      marketRentIsEstimate: r ? isEstimate(r.rentSource) : null,
      marketHomePrice: p ? Number(p.avgHomePrice) || null : null,
      marketHomePriceSource: p ? p.priceSource : null,
      marketHomePriceIsEstimate: p ? isEstimate(p.priceSource) : null,
    };
  }
  return {
    byId: out,
    rentFactor: rentFactor && Math.round(rentFactor * 1000) / 1000,
    valueFactor: valueFactor && Math.round(valueFactor * 1000) / 1000,
    rentSamples: rentRatios.length,
    subsidySlope: Math.round(-slope * 100) / 100,
    valueSamples: valueRatios.length,
  };
}

module.exports = { computeAffordability, isEstimate };
