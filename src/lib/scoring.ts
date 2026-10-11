import rawConfig from "@/data/scoring-config.json";
import type {
  CategoryKey,
  CategoryScores,
  MetricKey,
  Neighbourhood,
  ScoreWeights,
  TierKey,
} from "@/data/neighbourhoods";

export type MetricFormat = "rate" | "pct" | "km" | "perHour" | "currency" | "number";

export interface MetricConfig {
  key: MetricKey;
  label: string;
  weight: number;
  unit: string;
  format: MetricFormat;
  direction: "higher" | "lower";
  breakpoints: [number, number][];
  description: string;
  source: string;
}

export interface CategoryConfig {
  key: CategoryKey;
  label: string;
  weight: number;
  description: string;
  minCoverage?: number;
  metrics: MetricConfig[];
}

export interface ContextConfig {
  key: string;
  category: CategoryKey | null;
  label: string;
  unit: string;
  format: MetricFormat;
  description: string;
}

export interface PresetConfig {
  key: string;
  label: string;
  description: string;
  weights: ScoreWeights;
}

export interface ScoringConfig {
  version: number;
  updated: string;
  summary: string;
  categories: CategoryConfig[];
  context: ContextConfig[];
  parameters: Record<string, unknown> & {
    minCategoryCoverage: number;
    rankSimulations: number;
    rankWeightJitter: number;
    rankRangePercentiles: [number, number];
  };
  tiers: { key: TierKey; label: string; maxPercentile: number }[];
  scoreLabels: { min: number; label: string }[];
  presets: PresetConfig[];
}

export const scoringConfig = rawConfig as unknown as ScoringConfig;

export const CATEGORY_KEYS = scoringConfig.categories.map((c) => c.key);

export const DEFAULT_WEIGHTS = Object.fromEntries(
  scoringConfig.categories.map((c) => [c.key, c.weight])
) as ScoreWeights;

export function categoryConfig(key: CategoryKey): CategoryConfig {
  const c = scoringConfig.categories.find((cat) => cat.key === key);
  if (!c) throw new Error(`Unknown category ${key}`);
  return c;
}

/** Same formula as scripts/lib/scoring.js overallFromCategories. */
export function overallFromCategories(categoryScores: CategoryScores, weights: ScoreWeights): number | null {
  let sum = 0;
  let w = 0;
  for (const key of CATEGORY_KEYS) {
    const value = categoryScores[key];
    const weight = weights[key] ?? 0;
    if (value === null || value === undefined || !weight) continue;
    sum += value * weight;
    w += weight;
  }
  return w > 0 ? sum / w : null;
}

/** Competition ranking: equal rounded scores share the best rank. */
export function competitionRanks(scores: Record<string, number | null>): Record<string, number> {
  const entries = Object.entries(scores).filter((e): e is [string, number] => e[1] !== null);
  entries.sort((a, b) => b[1] - a[1]);
  const ranks: Record<string, number> = {};
  entries.forEach(([id, s], i) => {
    ranks[id] = i > 0 && s === entries[i - 1][1] ? ranks[entries[i - 1][0]] : i + 1;
  });
  return ranks;
}

export function normalizeWeights(weights: ScoreWeights): ScoreWeights {
  const total = CATEGORY_KEYS.reduce((s, k) => s + (weights[k] || 0), 0);
  if (total <= 0) return { ...DEFAULT_WEIGHTS };
  return Object.fromEntries(CATEGORY_KEYS.map((k) => [k, (weights[k] || 0) / total])) as ScoreWeights;
}

export function weightsEqual(a: ScoreWeights, b: ScoreWeights): boolean {
  const na = normalizeWeights(a);
  const nb = normalizeWeights(b);
  return CATEGORY_KEYS.every((k) => Math.abs(na[k] - nb[k]) < 0.005);
}

export interface RankedNeighbourhood {
  neighbourhood: Neighbourhood;
  score: number;
  rank: number;
}

/** Re-score and re-rank with custom category weights. */
export function rankWithWeights(list: Neighbourhood[], weights: ScoreWeights): RankedNeighbourhood[] {
  const scores: Record<string, number | null> = {};
  for (const n of list) {
    const o = overallFromCategories(n.categoryScores, weights);
    scores[n.id] = o === null ? null : Math.round(o);
  }
  const ranks = competitionRanks(scores);
  return list
    .filter((n) => scores[n.id] !== null)
    .map((n) => ({ neighbourhood: n, score: scores[n.id] as number, rank: ranks[n.id] }))
    .sort((a, b) => a.rank - b.rank || a.neighbourhood.name.localeCompare(b.neighbourhood.name));
}

export function scoreLabel(score: number | null): string {
  if (score === null) return "No data";
  return (scoringConfig.scoreLabels.find((l) => score >= l.min) ?? scoringConfig.scoreLabels.at(-1)!).label;
}

export function tierLabel(tier: TierKey | null | undefined): string | null {
  if (!tier) return null;
  return scoringConfig.tiers.find((t) => t.key === tier)?.label ?? null;
}

export function tierForRank(rank: number, total: number): TierKey {
  const pct = rank / total;
  return (scoringConfig.tiers.find((t) => pct <= t.maxPercentile) ?? scoringConfig.tiers.at(-1)!).key;
}

export function formatMetricValue(value: number | null | undefined, format: MetricFormat): string {
  if (value === null || value === undefined) return "No data";
  switch (format) {
    case "currency":
      return `$${Math.round(value).toLocaleString()}`;
    case "pct":
      return `${Math.round(value)}%`;
    case "km":
      return `${value < 10 ? value.toFixed(1) : Math.round(value)} km`;
    case "perHour":
      return `${Math.round(value)}/hr`;
    case "rate":
      return value < 10 ? value.toFixed(1) : Math.round(value).toLocaleString();
    default:
      return value < 10 && !Number.isInteger(value) ? value.toFixed(1) : Math.round(value).toLocaleString();
  }
}
