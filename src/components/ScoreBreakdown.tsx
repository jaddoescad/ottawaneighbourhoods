"use client";

import { useState } from "react";
import Link from "next/link";
import type { CategoryKey, Neighbourhood } from "@/data/neighbourhoods";
import { formatMetricValue, scoreLabel, scoringConfig, tierLabel } from "@/lib/scoring";

export type ScoreBreakdownData = Pick<
  Neighbourhood,
  | "overallScore"
  | "categoryScores"
  | "categoryCoverage"
  | "scoreWeights"
  | "metricScores"
  | "rawMetricValues"
  | "contextValues"
  | "scoreIncomplete"
  | "missingCategories"
  | "rank"
  | "rankRange"
  | "tier"
>;

interface ScoreBreakdownProps {
  scores: ScoreBreakdownData;
  totalNeighbourhoods: number;
}

export function getScoreColor(score: number | null): string {
  if (score === null) return "bg-gray-300";
  if (score >= 80) return "bg-green-600";
  if (score >= 65) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 35) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreTextColor(score: number | null): string {
  if (score === null) return "text-gray-400";
  if (score >= 80) return "text-green-700";
  if (score >= 65) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  if (score >= 35) return "text-orange-600";
  return "text-red-600";
}

const categoryLabel = (key: CategoryKey) => scoringConfig.categories.find((c) => c.key === key)?.label ?? key;

export default function ScoreBreakdown({ scores, totalNeighbourhoods }: ScoreBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<CategoryKey | null>(null);
  const {
    overallScore,
    categoryScores,
    categoryCoverage,
    scoreWeights,
    metricScores,
    rawMetricValues,
    contextValues,
    scoreIncomplete,
    missingCategories,
    rank,
    rankRange,
    tier,
  } = scores;
  const tierText = tierLabel(tier);
  const rangeText =
    rankRange && (rankRange.best !== rank || rankRange.worst !== rank)
      ? `#${rankRange.best}–${rankRange.worst}`
      : null;

  const sortedCategories = [...scoringConfig.categories].sort(
    (a, b) => (scoreWeights[b.key] ?? 0) - (scoreWeights[a.key] ?? 0)
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group inline-flex items-center gap-2 sm:gap-3 bg-white/20 backdrop-blur px-4 sm:px-5 py-2 sm:py-3 rounded-full hover:bg-white/30 transition cursor-pointer"
      >
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${getScoreColor(overallScore)} flex items-center justify-center shadow-lg`}>
          <span className="text-white font-bold text-sm sm:text-lg">{overallScore}</span>
        </div>
        <div className="text-left">
          <span className="text-white font-semibold block text-sm sm:text-base">
            {scoreLabel(overallScore)}
            {tierText && <span className="ml-2 text-xs font-medium bg-white/25 px-2 py-0.5 rounded-full align-middle">{tierText}</span>}
          </span>
          <span className="text-white/80 text-xs sm:text-sm">
            Ranked #{rank} of {totalNeighbourhoods}
            {rangeText && <span className="text-white/60"> · likely {rangeText}</span>}
          </span>
        </div>
        <svg className="w-4 h-4 text-white/60 group-hover:text-white ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Score Breakdown</h2>
                <p className="text-gray-500 text-sm">Measured from where residents live</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 shrink-0 rounded-full ${getScoreColor(overallScore)} flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-bold text-2xl">{overallScore}</span>
                </div>
                <div>
                  <p className={`text-xl font-bold ${getScoreTextColor(overallScore)}`}>
                    {scoreLabel(overallScore)}
                    {tierText && (
                      <span className="ml-2 text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full align-middle">{tierText}</span>
                    )}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Ranked <span className="font-semibold text-gray-700">#{rank}</span> of {totalNeighbourhoods} neighbourhoods
                  </p>
                  {rangeText && (
                    <p className="text-gray-500 text-xs mt-1">
                      Likely rank {rangeText}: where it lands in 80% of runs when each category weight is varied by ±
                      {Math.round(scoringConfig.parameters.rankWeightJitter * 100)}%.
                    </p>
                  )}
                </div>
              </div>
              {scoreIncomplete && (
                <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  Not enough data for {missingCategories.map(categoryLabel).join(", ")}; the overall score uses the remaining
                  categories.
                </p>
              )}
            </div>

            <div className="px-6 py-4">
              <div className="space-y-2">
                {sortedCategories.map((category) => {
                  const categoryScore = categoryScores[category.key];
                  const coverage = categoryCoverage?.[category.key] ?? 1;
                  const weightPercent = Math.round((scoreWeights[category.key] ?? 0) * 100);
                  const isExpanded = expandedCategory === category.key;
                  const metricWeightTotal = category.metrics.reduce((s, m) => s + m.weight, 0);
                  const context = scoringConfig.context.filter((c) => c.category === category.key);

                  return (
                    <div key={category.key} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : category.key)}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{category.label}</span>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{weightPercent}% weight</span>
                          {coverage < 1 && (
                            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              {Math.round(coverage * 100)}% of data
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-lg ${getScoreTextColor(categoryScore)}`}>
                            {categoryScore !== null ? categoryScore : "–"}
                          </span>
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      <div className="h-1.5 bg-gray-200">
                        <div
                          className={`h-full transition-all ${getScoreColor(categoryScore)}`}
                          style={{ width: categoryScore !== null ? `${categoryScore}%` : "0%" }}
                        />
                      </div>

                      {isExpanded && (
                        <div className="px-4 py-3 bg-white space-y-3">
                          <p className="text-xs text-gray-500">{category.description}</p>
                          {category.metrics.map((metric) => {
                            const metricScore = metricScores[metric.key];
                            const rawValue = rawMetricValues[metric.key];
                            const metricWeight = Math.round((metric.weight / metricWeightTotal) * 100);
                            return (
                              <div key={metric.key} className="flex items-start gap-3">
                                <div
                                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold ${getScoreColor(metricScore)}`}
                                >
                                  {metricScore !== null ? metricScore : "–"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 text-sm">{metric.label}</span>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{metricWeight}%</span>
                                  </div>
                                  <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                                    <span className="text-sm font-semibold text-gray-700">{formatMetricValue(rawValue, metric.format)}</span>
                                    {rawValue !== null && metric.format !== "currency" && metric.format !== "km" && metric.format !== "perHour" && (
                                      <span className="text-xs text-gray-500">{metric.unit}</span>
                                    )}
                                    <span className="text-xs text-gray-400">({metric.direction} is better)</span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{metric.description}</p>
                                </div>
                              </div>
                            );
                          })}
                          {context.length > 0 && (
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Context (not scored)</p>
                              <dl className="space-y-1">
                                {context.map((c) => {
                                  const value = (contextValues as unknown as Record<string, number | null>)?.[c.key] ?? null;
                                  const note = (contextValues?.notes as Record<string, string | null> | undefined)?.[c.key];
                                  return (
                                    <div key={c.key} className="flex justify-between gap-3 text-xs" title={c.description}>
                                      <dt className="text-gray-600">{c.label}</dt>
                                      <dd className="text-gray-800 font-medium text-right">
                                        {formatMetricValue(value, c.format)}
                                        {value !== null && c.format !== "currency" && c.format !== "pct" && (
                                          <span className="text-gray-400 font-normal"> {c.unit}</span>
                                        )}
                                        {note && <span className="block text-gray-400 font-normal">{note}</span>}
                                      </dd>
                                    </div>
                                  );
                                })}
                              </dl>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Each metric is scored 0–100 against fixed breakpoints, not against other neighbourhoods. Missing data is left out
                rather than counted as zero.{" "}
                <Link href="/methodology" className="text-blue-600 hover:underline">
                  How scores work
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
