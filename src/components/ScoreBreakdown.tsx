"use client";

import { useState } from "react";
import { CategoryScores, ScoreWeights, MetricScores, RawMetricValues } from "@/data/neighbourhoods";

interface ScoreBreakdownProps {
  overallScore: number;
  categoryScores: CategoryScores;
  scoreWeights: ScoreWeights;
  metricScores: MetricScores;
  rawMetricValues: RawMetricValues;
  rank: number;
  totalNeighbourhoods: number;
}

// Individual metric definitions with clear labels, units, and what's good
const METRICS: Record<keyof MetricScores, { label: string; unit: string; format: (v: number | null) => string; goodDirection: string }> = {
  // Safety - Crime is weighted: Violent 50%, Property 30%, Other 20%
  crime: { label: "Crime Rate (Weighted)", unit: "per 1,000", format: (v) => v !== null ? v.toFixed(1) : "N/A", goodDirection: "lower" },
  violentCrime: { label: "Violent Crime", unit: "per 1,000", format: (v) => v !== null ? v.toFixed(1) : "N/A", goodDirection: "lower" },
  propertyCrime: { label: "Property Crime", unit: "per 1,000", format: (v) => v !== null ? v.toFixed(1) : "N/A", goodDirection: "lower" },
  collisions: { label: "Traffic Safety", unit: "per 1,000", format: (v) => v !== null ? v.toFixed(1) : "N/A", goodDirection: "lower" },
  overdose: { label: "Overdose Rate", unit: "per 100K", format: (v) => v !== null ? Math.round(v).toString() : "N/A", goodDirection: "lower" },
  // Schools
  eqao: { label: "EQAO Scores", unit: "%", format: (v) => v !== null ? Math.round(v) + "%" : "N/A", goodDirection: "higher" },
  schoolCount: { label: "Schools", unit: "schools", format: (v) => v !== null ? v.toString() : "N/A", goodDirection: "more" },
  // Health & Environment
  treeCanopy: { label: "Tree Coverage", unit: "%", format: (v) => v !== null ? Math.round(v) + "%" : "N/A", goodDirection: "higher" },
  hospital: { label: "Hospital Distance", unit: "km", format: (v) => v !== null ? v.toFixed(1) + " km" : "N/A", goodDirection: "closer" },
  primaryCare: { label: "Primary Care Access", unit: "%", format: (v) => v !== null ? Math.round(v) + "%" : "N/A", goodDirection: "higher" },
  foodSafety: { label: "Food Safety", unit: "score", format: (v) => v !== null ? v.toFixed(1) : "N/A", goodDirection: "higher" },
  // Amenities - dynamic labels/units set in component based on isUrban
  parks: { label: "Parks", unit: "parks", format: (v) => v !== null ? v.toString() : "N/A", goodDirection: "more" },
  grocery: { label: "Grocery Stores", unit: "stores", format: (v) => v !== null ? v.toString() : "N/A", goodDirection: "more" },
  dining: { label: "Food & Dining", unit: "places", format: (v) => v !== null ? v.toString() : "N/A", goodDirection: "more" },
  recreation: { label: "Recreation", unit: "facilities", format: (v) => v !== null ? v.toString() : "N/A", goodDirection: "more" },
  libraries: { label: "Libraries", unit: "libraries", format: (v) => v !== null ? v.toString() : "N/A", goodDirection: "more" },
  // Community
  nei: { label: "Equity Index", unit: "score", format: (v) => v !== null ? Math.round(v).toString() : "N/A", goodDirection: "higher" },
  roadQuality: { label: "Road Quality", unit: "score", format: (v) => v !== null ? Math.round(v).toString() : "N/A", goodDirection: "higher" },
  quietScore: { label: "Noise Level", unit: "score", format: (v) => v !== null ? Math.round(v).toString() : "N/A", goodDirection: "higher" },
  serviceRequests: { label: "311 Requests", unit: "per 1,000", format: (v) => v !== null ? Math.round(v).toString() : "N/A", goodDirection: "lower" },
  // Nature
  trails: { label: "Trails", unit: "km", format: (v) => v !== null ? v.toFixed(1) + " km" : "N/A", goodDirection: "more" },
  cycling: { label: "Cycling Infra", unit: "km", format: (v) => v !== null ? v.toFixed(1) + " km" : "N/A", goodDirection: "more" },
  // Affordability
  rent: { label: "Rent", unit: "$/mo", format: (v) => v !== null ? "$" + v.toLocaleString() : "N/A", goodDirection: "lower" },
  homePrice: { label: "Home Price", unit: "$", format: (v) => v !== null ? "$" + (v / 1000).toFixed(0) + "K" : "N/A", goodDirection: "lower" },
  foodCostBurden: { label: "Food Cost Burden", unit: "%", format: (v) => v !== null ? v.toFixed(1) + "%" : "N/A", goodDirection: "lower" },
  // Walkability
  walk: { label: "Walk Score", unit: "score", format: (v) => v !== null ? v.toString() : "N/A", goodDirection: "higher" },
  transit: { label: "Transit Score", unit: "score", format: (v) => v !== null ? v.toString() : "N/A", goodDirection: "higher" },
  bike: { label: "Bike Score", unit: "score", format: (v) => v !== null ? v.toString() : "N/A", goodDirection: "higher" },
};

// Category definitions with their metrics and weights
const CATEGORIES: {
  key: keyof CategoryScores;
  label: string;
  metrics: (keyof MetricScores)[];
  weights: Record<string, number>; // Percentage weights for each metric (must sum to 100)
}[] = [
  {
    key: "safety",
    label: "Safety",
    metrics: ["violentCrime", "propertyCrime", "collisions", "overdose"],
    weights: { violentCrime: 17, propertyCrime: 10, collisions: 33, overdose: 40 },
    // Note: Crime score is weighted internally: Violent 50%, Property 30%, Other 20%
    // Overall safety: Crime 33% (shown as violent+property), Collisions 33%, Overdose 34%
  },
  {
    key: "schools",
    label: "Schools",
    metrics: ["eqao", "schoolCount"],
    weights: { eqao: 70, schoolCount: 30 },
  },
  {
    key: "healthEnvironment",
    label: "Health & Environment",
    metrics: ["treeCanopy", "hospital", "primaryCare", "foodSafety"],
    weights: { treeCanopy: 25, hospital: 25, primaryCare: 25, foodSafety: 25 },
  },
  {
    key: "amenities",
    label: "Amenities",
    metrics: ["parks", "grocery", "dining", "recreation", "libraries"],
    weights: { parks: 20, grocery: 20, dining: 20, recreation: 20, libraries: 20 },
  },
  {
    key: "community",
    label: "Community",
    metrics: ["nei", "roadQuality", "quietScore", "serviceRequests"],
    weights: { nei: 25, roadQuality: 25, quietScore: 25, serviceRequests: 25 },
  },
  {
    key: "nature",
    label: "Nature & Outdoors",
    metrics: ["trails", "cycling"],
    weights: { trails: 50, cycling: 50 },
  },
  {
    key: "affordability",
    label: "Affordability",
    metrics: ["rent", "homePrice", "foodCostBurden"],
    weights: { rent: 33, homePrice: 33, foodCostBurden: 34 },
  },
  {
    key: "walkability",
    label: "Walkability",
    metrics: ["walk", "transit", "bike"],
    weights: { walk: 33, transit: 33, bike: 34 },
  },
];

function getScoreColor(score: number | null): string {
  if (score === null) return "bg-gray-300";
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreTextColor(score: number | null): string {
  if (score === null) return "text-gray-400";
  if (score >= 70) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  if (score >= 30) return "text-orange-600";
  return "text-red-600";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Average";
  if (score >= 20) return "Below Average";
  return "Poor";
}

export default function ScoreBreakdown({
  overallScore,
  categoryScores,
  scoreWeights,
  metricScores,
  rawMetricValues,
  rank,
  totalNeighbourhoods,
}: ScoreBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Sort categories by weight (highest first)
  const sortedCategories = [...CATEGORIES].sort((a, b) => {
    const weightA = scoreWeights[a.key] || 0;
    const weightB = scoreWeights[b.key] || 0;
    return weightB - weightA;
  });

  return (
    <>
      {/* Clickable Score Badge */}
      <button
        onClick={() => setIsOpen(true)}
        className="group inline-flex items-center gap-2 sm:gap-3 bg-white/20 backdrop-blur px-4 sm:px-5 py-2 sm:py-3 rounded-full hover:bg-white/30 transition cursor-pointer"
      >
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${getScoreColor(overallScore)} flex items-center justify-center shadow-lg`}>
          <span className="text-white font-bold text-sm sm:text-lg">{overallScore}</span>
        </div>
        <div className="text-left">
          <span className="text-white font-semibold block text-sm sm:text-base">{getScoreLabel(overallScore)}</span>
          <span className="text-white/70 text-xs sm:text-sm">Ranked #{rank} of {totalNeighbourhoods}</span>
        </div>
        <svg className="w-4 h-4 text-white/60 group-hover:text-white ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Score Breakdown</h2>
                <p className="text-gray-500 text-sm">How this neighbourhood compares</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Overall Score */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full ${getScoreColor(overallScore)} flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-bold text-2xl">{overallScore}</span>
                </div>
                <div>
                  <p className={`text-xl font-bold ${getScoreTextColor(overallScore)}`}>
                    {getScoreLabel(overallScore)}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Ranked <span className="font-semibold text-gray-700">#{rank}</span> of {totalNeighbourhoods} neighbourhoods
                  </p>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="px-6 py-4">
              <div className="space-y-2">
                {sortedCategories.map((category) => {
                  const categoryScore = categoryScores[category.key];
                  const weight = scoreWeights[category.key];
                  const weightPercent = Math.round(weight * 100);
                  const isExpanded = expandedCategory === category.key;

                  return (
                    <div key={category.key} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Category Header - Clickable */}
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : category.key)}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">{category.label}</span>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                            {weightPercent}% weight
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-lg ${getScoreTextColor(categoryScore)}`}>
                            {categoryScore !== null ? categoryScore : "N/A"}
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

                      {/* Category Progress Bar */}
                      <div className="h-1.5 bg-gray-200">
                        <div
                          className={`h-full transition-all ${getScoreColor(categoryScore)}`}
                          style={{ width: categoryScore !== null ? `${categoryScore}%` : "0%" }}
                        />
                      </div>

                      {/* Expanded Metrics */}
                      {isExpanded && (
                        <div className="px-4 py-3 bg-white space-y-3">
                          {category.metrics.map((metricKey) => {
                            const metricScore = metricScores[metricKey];
                            const metricInfo = METRICS[metricKey];
                            const metricWeight = category.weights[metricKey];
                            const rawValue = rawMetricValues[metricKey];

                            // Special formatting for amenity metrics (show count + density context)
                            const isAmenityMetric = ["parks", "grocery", "dining", "recreation"].includes(metricKey);
                            const isUrban = rawMetricValues.isUrban;

                            let displayValue = metricInfo.format(rawValue);
                            let scoringContext = metricInfo.goodDirection + " is better";

                            if (isAmenityMetric) {
                              const countKey = `${metricKey}Count` as keyof typeof rawMetricValues;
                              const densityKey = `${metricKey}Density` as keyof typeof rawMetricValues;
                              const count = rawMetricValues[countKey] as number;
                              const density = rawMetricValues[densityKey] as number;

                              if (isUrban) {
                                displayValue = `${count} (${density}/km²)`;
                                scoringContext = "scored by density";
                              } else {
                                displayValue = `${count}`;
                                scoringContext = "scored by count";
                              }
                            }

                            return (
                              <div key={metricKey} className="flex items-center gap-3">
                                {/* Metric Score Circle */}
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${getScoreColor(metricScore)}`}
                                >
                                  {metricScore !== null ? metricScore : "?"}
                                </div>
                                {/* Metric Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 text-sm">{metricInfo.label}</span>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{metricWeight}%</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-sm font-semibold text-gray-700">{displayValue}</span>
                                    <span className="text-xs text-gray-400">({scoringContext})</span>
                                  </div>
                                </div>
                                {/* Mini Progress */}
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${getScoreColor(metricScore)}`}
                                    style={{ width: metricScore !== null ? `${metricScore}%` : "0%" }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Scores range from 0-100 based on Ottawa benchmarks. Higher scores indicate better performance.
                Click any category to see individual metrics.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
