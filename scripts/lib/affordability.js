/**
 * Rent and home value from one consistent source (2021 Census via ONS-SQO),
 * scaled to today's market with one citywide factor per measure:
 *   factor = median over neighbourhoods of (sourced recent figure / census figure)
 * Hand-collected figures marked as estimates are never used for the factor.
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
function computeAffordability({ csvDir, censusById }) {
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
      censusRent2021: census.rent || null,
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
    valueSamples: valueRatios.length,
  };
}

module.exports = { computeAffordability, isEstimate };
