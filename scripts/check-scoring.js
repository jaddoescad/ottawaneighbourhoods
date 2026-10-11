#!/usr/bin/env node
/**
 * Regression checks for the scoring model. Run after editing
 * src/data/scoring-config.json or rebuilding data.json:
 *
 *   node scripts/check-scoring.js
 *
 * Exits 1 if any check fails. Validation correlations are printed for review
 * and fail only if they have the wrong sign.
 *
 * Missing data is caught per metric (a null raw value must give a null score);
 * a category score of 0 is legitimate when the data puts it past the last breakpoint.
 */

const path = require('path');
const config = require('../src/data/scoring-config.json');
const scoring = require('./lib/scoring');
const { updatedDoc, DOC_PATH } = require('./generate-scoring-docs');
const fs = require('fs');

const data = require(path.join(__dirname, '..', 'src', 'data', 'processed', 'data.json'));
const hoods = data.neighbourhoods;

const failures = [];
const fail = (msg) => failures.push(msg);
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
const sum = (xs) => xs.reduce((s, x) => s + x, 0);

// --- Config sanity ---------------------------------------------------------
const catKeys = config.categories.map((c) => c.key);
if (new Set(catKeys).size !== catKeys.length) fail('Duplicate category keys');
if (!near(sum(config.categories.map((c) => c.weight)), 1)) fail('Category weights do not sum to 1');

const metricKeys = config.categories.flatMap((c) => c.metrics.map((m) => m.key));
if (new Set(metricKeys).size !== metricKeys.length) fail('Duplicate metric keys');

for (const c of config.categories) {
  if (!near(sum(c.metrics.map((m) => m.weight)), 1)) fail(`${c.key}: metric weights do not sum to 1`);
  for (const m of c.metrics) {
    const bp = m.breakpoints;
    if (!Array.isArray(bp) || bp.length < 2) fail(`${m.key}: needs at least 2 breakpoints`);
    for (let i = 0; i < bp.length; i++) {
      const [x, y] = bp[i];
      if (!Number.isFinite(x) || !Number.isFinite(y) || y < 0 || y > 100) fail(`${m.key}: bad breakpoint ${JSON.stringify(bp[i])}`);
      if (i > 0 && !(x > bp[i - 1][0])) fail(`${m.key}: breakpoints not strictly increasing`);
    }
    const scores = bp.map((p) => p[1]);
    const monotone = m.direction === 'lower'
      ? scores.every((s, i) => i === 0 || s <= scores[i - 1])
      : scores.every((s, i) => i === 0 || s >= scores[i - 1]);
    if (!monotone) fail(`${m.key}: breakpoint scores do not follow direction "${m.direction}"`);
  }
}

for (const p of config.presets) {
  const keys = Object.keys(p.weights);
  if (keys.length !== catKeys.length || !catKeys.every((k) => k in p.weights)) fail(`Preset ${p.key}: must list every category`);
  if (!near(sum(Object.values(p.weights)), 1)) fail(`Preset ${p.key}: weights do not sum to 1`);
}
if (new Set(config.presets.map((p) => p.key)).size !== config.presets.length) fail('Duplicate preset keys');

const contextKeys = config.context.map((c) => c.key);
if (new Set(contextKeys).size !== contextKeys.length) fail('Duplicate context keys');

// --- Data integrity --------------------------------------------------------
const weights = scoring.defaultWeights(config);
const total = hoods.length;
const overallById = {};

for (const n of hoods) {
  const id = n.id;
  const raw = n.rawMetricValues || {};
  const ms = n.metricScores || {};

  for (const key of metricKeys) {
    const v = raw[key];
    const s = ms[key];
    if (v === null || v === undefined) {
      if (s !== null && s !== undefined) fail(`${id}.${key}: score ${s} without raw data`);
    } else {
      const meta = config.categories.flatMap((c) => c.metrics).find((m) => m.key === key);
      const expected = Math.round(scoring.interpolate(v, meta.breakpoints));
      if (s !== expected) fail(`${id}.${key}: score ${s} != interpolated ${expected}`);
    }
  }

  const re = scoring.scoreAll(config, { [id]: raw })[id];
  for (const c of catKeys) {
    if (re.categoryScores[c] !== n.categoryScores[c]) fail(`${id}.${c}: category ${n.categoryScores[c]} != recomputed ${re.categoryScores[c]}`);
  }
  if (re.overallScore !== n.overallScore) fail(`${id}: overall ${n.overallScore} != recomputed ${re.overallScore}`);
  const fromCats = scoring.overallFromCategories(n.categoryScores, weights);
  if (fromCats !== null && Math.round(fromCats) !== n.overallScore) fail(`${id}: overall not reproducible from displayed categories`);
  if (n.scoreIncomplete !== re.scoreIncomplete) fail(`${id}: scoreIncomplete flag mismatch`);

  for (const k of ['walkScore', 'transitScore']) {
    if (typeof n[k] !== 'number' || !Number.isFinite(n[k])) fail(`${id}.${k}: not a number (${n[k]})`);
  }
  if (n.bikeScore !== null && !Number.isFinite(n.bikeScore)) fail(`${id}.bikeScore: must be a number or null (${n.bikeScore})`);
  if (!n.tier) fail(`${id}: missing tier`);
  else if (n.tier !== scoring.tierFor(config, n.rank, total)) fail(`${id}: tier ${n.tier} does not match rank ${n.rank}`);
  if (!n.rankRange || n.rank < n.rankRange.best || n.rank > n.rankRange.worst) fail(`${id}: rank ${n.rank} outside range ${JSON.stringify(n.rankRange)}`);
  overallById[id] = n.overallScore;
}

const ranks = scoring.competitionRanks(overallById);
for (const n of hoods) if (ranks[n.id] !== n.rank) fail(`${n.id}: rank ${n.rank} != competition rank ${ranks[n.id]}`);

// --- Docs ------------------------------------------------------------------
if (updatedDoc(fs.readFileSync(DOC_PATH, 'utf8'), config) !== fs.readFileSync(DOC_PATH, 'utf8')) {
  fail('CLAUDE.md scoring section is stale: run node scripts/generate-scoring-docs.js');
}

// --- Validation against independent measures --------------------------------
function rankArray(xs) {
  const idx = xs.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const r = new Array(xs.length);
  for (let i = 0; i < idx.length; ) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2;
    i = j + 1;
  }
  return r;
}
function spearman(pairs) {
  const xs = rankArray(pairs.map((p) => p[0]));
  const ys = rankArray(pairs.map((p) => p[1]));
  const mx = sum(xs) / xs.length;
  const my = sum(ys) / ys.length;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return num / Math.sqrt(dx * dy);
}
const validations = [
  { label: 'Amenities vs official ONS Walk Score', sign: 1, get: (n) => [n.categoryScores.amenities, n.walkScore] },
  { label: 'Getting Around vs % commuting by transit (2021 Census)', sign: 1, get: (n) => [n.categoryScores.gettingAround, n.pctCommuteTransit] },
  { label: 'Safety vs all police-reported crime per 1,000', sign: -1, get: (n) => [n.categoryScores.safety, n.contextValues?.allCrimeRate] },
  { label: 'Affordability vs median household income', sign: -1, get: (n) => [n.categoryScores.affordability, n.medianIncome] },
];
console.log('Validation (Spearman rho):');
for (const v of validations) {
  const pairs = hoods.map(v.get).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  const rho = spearman(pairs);
  console.log(`  ${rho.toFixed(2).padStart(5)}  ${v.label} (n=${pairs.length})`);
  if (Math.sign(rho) !== v.sign) fail(`Validation has wrong sign: ${v.label} (rho=${rho.toFixed(2)})`);
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed:`);
  for (const f of failures.slice(0, 50)) console.error(`  - ${f}`);
  if (failures.length > 50) console.error(`  ... and ${failures.length - 50} more`);
  process.exit(1);
}
console.log(`\nAll scoring checks passed (${total} neighbourhoods, ${metricKeys.length} metrics, ${config.presets.length} presets).`);
