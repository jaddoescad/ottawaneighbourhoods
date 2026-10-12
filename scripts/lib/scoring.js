/**
 * Scoring engine driven by src/data/scoring-config.json.
 *
 * - Metric scores: piecewise-linear interpolation between fixed breakpoints
 *   ([value, score] pairs), clamped at both ends. Missing input -> null, never 0.
 * - Category score: weighted mean of the metrics that have data. Coverage is the
 *   share of metric weight that had data; below minCategoryCoverage the category
 *   is reported as null and left out of the overall score.
 * - Overall score: weighted mean of available categories (renormalized).
 * - Rank: competition ranking on the rounded overall score (ties share a rank).
 * - Rank range: Monte Carlo over category weights jittered by +/- rankWeightJitter.
 *
 * src/lib/scoring.ts mirrors interpolate/overallFromCategories for the UI.
 */

function interpolate(value, breakpoints) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const pts = [...breakpoints].sort((a, b) => a[0] - b[0]);
  if (value <= pts[0][0]) return pts[0][1];
  if (value >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    if (value <= x1) {
      const [x0, y0] = pts[i - 1];
      return y0 + ((value - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return pts[pts.length - 1][1];
}

function weightedMean(items) {
  let sum = 0;
  let w = 0;
  for (const { value, weight } of items) {
    if (value === null || value === undefined || !Number.isFinite(value) || !weight) continue;
    sum += value * weight;
    w += weight;
  }
  return w > 0 ? sum / w : null;
}

function scoreCategory(category, rawValues, minCoverage) {
  const metricScores = {};
  let totalWeight = 0;
  let coveredWeight = 0;
  for (const m of category.metrics) {
    const s = interpolate(rawValues[m.key], m.breakpoints);
    metricScores[m.key] = s === null ? null : Math.round(s);
    totalWeight += m.weight;
    if (s !== null) coveredWeight += m.weight;
  }
  const coverage = totalWeight > 0 ? coveredWeight / totalWeight : 0;
  const raw = weightedMean(category.metrics.map((m) => ({ value: interpolate(rawValues[m.key], m.breakpoints), weight: m.weight })));
  return {
    metricScores,
    coverage: Math.round(coverage * 100) / 100,
    score: coverage >= minCoverage && raw !== null ? raw : null,
  };
}

function overallFromCategories(categoryScores, weights) {
  return weightedMean(Object.entries(weights).map(([key, weight]) => ({ value: categoryScores[key], weight })));
}

function defaultWeights(config) {
  return Object.fromEntries(config.categories.map((c) => [c.key, c.weight]));
}

/**
 * @param {object} config  scoring-config.json
 * @param {Record<string, Record<string, number|null>>} rawById  metric key -> raw value, per neighbourhood
 */
function scoreAll(config, rawById) {
  const minCoverage = config.parameters.minCategoryCoverage;
  const weights = defaultWeights(config);
  const out = {};
  for (const [id, raw] of Object.entries(rawById)) {
    const metricScores = {};
    const categoryExact = {};
    const categoryScores = {};
    const categoryCoverage = {};
    for (const cat of config.categories) {
      const r = scoreCategory(cat, raw, cat.minCoverage ?? minCoverage);
      Object.assign(metricScores, r.metricScores);
      categoryExact[cat.key] = r.score;
      categoryScores[cat.key] = r.score === null ? null : Math.round(r.score);
      categoryCoverage[cat.key] = r.coverage;
    }
    // From the displayed (rounded) category scores, so the UI's breakdown and
    // custom-weight re-ranking reproduce the published overall score exactly.
    const overall = overallFromCategories(categoryScores, weights);
    const missing = config.categories.filter((c) => categoryExact[c.key] === null).map((c) => c.key);
    out[id] = {
      overallScore: overall === null ? null : Math.round(overall),
      overallExact: overall,
      categoryExact,
      categoryScores,
      categoryCoverage,
      metricScores,
      scoreIncomplete: missing.length > 0,
      missingCategories: missing,
    };
  }
  return out;
}

/** Competition ranking ("1224"): equal rounded scores share the best rank. */
function competitionRanks(scoreById) {
  const entries = Object.entries(scoreById).filter(([, s]) => s !== null && s !== undefined);
  entries.sort((a, b) => b[1] - a[1]);
  const ranks = {};
  entries.forEach(([id, s], i) => {
    ranks[id] = i > 0 && s === entries[i - 1][1] ? ranks[entries[i - 1][0]] : i + 1;
  });
  return ranks;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/**
 * How stable is each rank under reasonable disagreement about weights?
 * Each draw multiplies every category weight by U(1 - jitter, 1 + jitter).
 */
function rankRanges(config, categoryExactById, publishedRanks = {}, seed = 20261011) {
  const { rankSimulations, rankWeightJitter, rankRangePercentiles } = config.parameters;
  const base = defaultWeights(config);
  const rand = mulberry32(seed);
  const ids = Object.keys(categoryExactById);
  const samples = Object.fromEntries(ids.map((id) => [id, []]));
  for (let s = 0; s < rankSimulations; s++) {
    const w = {};
    for (const [k, v] of Object.entries(base)) w[k] = v * (1 - rankWeightJitter + 2 * rankWeightJitter * rand());
    const scores = {};
    for (const id of ids) {
      const o = overallFromCategories(categoryExactById[id], w);
      scores[id] = o === null ? null : Math.round(o);
    }
    const ranks = competitionRanks(scores);
    for (const id of ids) if (ranks[id]) samples[id].push(ranks[id]);
  }
  const [pLo, pHi] = rankRangePercentiles;
  const out = {};
  for (const id of ids) {
    const sorted = samples[id].sort((a, b) => a - b);
    if (!sorted.length) {
      out[id] = null;
      continue;
    }
    const published = publishedRanks[id];
    let best = Math.round(quantile(sorted, pLo));
    let worst = Math.round(quantile(sorted, pHi));
    if (published) {
      best = Math.min(best, published);
      worst = Math.max(worst, published);
    }
    out[id] = { best, worst, median: Math.round(quantile(sorted, 0.5)) };
  }
  return out;
}

function tierFor(config, rank, total) {
  if (!rank || !total) return null;
  const pct = rank / total;
  const tier = config.tiers.find((t) => pct <= t.maxPercentile) || config.tiers[config.tiers.length - 1];
  return tier.key;
}

function scoreLabel(config, score) {
  if (score === null || score === undefined) return null;
  return config.scoreLabels.find((l) => score >= l.min).label;
}

/** Empirical-Bayes style shrinkage of a rate toward the city rate. */
function shrinkRate(count, exposure, cityRate, k) {
  if (!Number.isFinite(count) || !Number.isFinite(exposure) || exposure < 0) return null;
  return (count + k * cityRate) / (exposure + k);
}

module.exports = {
  interpolate,
  weightedMean,
  scoreCategory,
  overallFromCategories,
  defaultWeights,
  scoreAll,
  competitionRanks,
  rankRanges,
  tierFor,
  scoreLabel,
  shrinkRate,
  mulberry32,
};
