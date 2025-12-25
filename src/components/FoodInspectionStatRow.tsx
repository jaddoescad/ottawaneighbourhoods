"use client";

import { useState } from "react";

interface FoodInspectionStatRowProps {
  establishments: number;
  inspections: number;
  avgScore: number | null;
  recentAvgScore: number | null;
  violations: number;
  criticalViolations: number;
  violationsPerInspection: number | null;
  perfectScoreRate: number | null;
}

function getScoreLabel(score: number): string {
  if (score >= 99.5) return "Excellent";
  if (score >= 98) return "Very Good";
  if (score >= 96) return "Good";
  return "Needs Attention";
}

function getScoreColor(score: number): string {
  if (score >= 99.5) return "bg-green-500";
  if (score >= 98) return "bg-green-400";
  if (score >= 96) return "bg-yellow-400";
  return "bg-orange-400";
}

function getScoreTextColor(score: number): string {
  if (score >= 99.5) return "text-green-600";
  if (score >= 98) return "text-green-500";
  if (score >= 96) return "text-amber-600";
  return "text-red-500";
}

function getViolationRateColor(rate: number): string {
  if (rate <= 0.5) return "text-green-600";
  if (rate <= 1.0) return "text-amber-600";
  return "text-red-600";
}

export default function FoodInspectionStatRow({
  establishments,
  inspections,
  avgScore,
  recentAvgScore,
  violations,
  criticalViolations,
  violationsPerInspection,
  perfectScoreRate,
}: FoodInspectionStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no data
  if (!establishments || avgScore === null) return null;

  const barWidth = Math.max(5, avgScore);
  const displayScore = avgScore.toFixed(1);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Main Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Label row with value on mobile */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">🍽️</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Food Safety</span>
            </div>
            {/* Value and chevron on mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className={`font-bold text-sm ${getScoreTextColor(avgScore)}`}>{displayScore}</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {/* Bar */}
          <div className="w-full sm:flex-1 relative h-7 sm:h-9 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-lg ${getScoreColor(avgScore)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getScoreLabel(avgScore)} ({establishments} establishments)
            </span>
          </div>
          {/* Value - hidden on mobile */}
          <div className="hidden sm:block">
            <span className={`font-bold w-28 text-right block ${getScoreTextColor(avgScore)}`}>
              {displayScore}
            </span>
          </div>
          <div className="hidden sm:block w-5 h-5">
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 sm:px-5 pb-4 bg-gray-50">
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
            Ottawa Public Health Inspections
          </div>

          {/* Score Display */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-gray-500 mb-1">Average Score</div>
              <div className={`font-bold text-2xl ${getScoreTextColor(avgScore)}`}>{displayScore}</div>
              <div className="text-xs text-gray-400 mt-1">{getScoreLabel(avgScore)}</div>
            </div>
            {recentAvgScore !== null && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-gray-500 mb-1">Recent (2yr)</div>
                <div className={`font-bold text-2xl ${getScoreTextColor(recentAvgScore)}`}>{recentAvgScore.toFixed(1)}</div>
                <div className="text-xs text-gray-400 mt-1">Last 2 years</div>
              </div>
            )}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-gray-500 mb-1">Total Inspections</div>
              <div className="font-bold text-gray-900 text-xl">{inspections.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">{establishments} places</div>
            </div>
            {perfectScoreRate !== null && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-gray-500 mb-1">Perfect Scores</div>
                <div className="font-bold text-green-600 text-xl">{perfectScoreRate.toFixed(0)}%</div>
                <div className="text-xs text-gray-400 mt-1">Score = 100</div>
              </div>
            )}
          </div>

          {/* Violations */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Violations</div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-gray-500 mb-1">Total Violations</div>
                <div className="font-bold text-gray-900 text-lg">{violations.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-gray-500 mb-1">Critical</div>
                <div className={`font-bold text-lg ${criticalViolations > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {criticalViolations.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {violations > 0 ? `${((criticalViolations / violations) * 100).toFixed(0)}% of total` : 'None'}
                </div>
              </div>
              {violationsPerInspection !== null && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-gray-500 mb-1">Per Inspection</div>
                  <div className={`font-bold text-lg ${getViolationRateColor(violationsPerInspection)}`}>
                    {violationsPerInspection.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Avg violations</div>
                </div>
              )}
            </div>
          </div>

          {/* Score Scale */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">Score Interpretation</div>
            <div className="grid grid-cols-4 gap-1 text-xs">
              <div className={`p-2 rounded text-center ${avgScore >= 99.5 ? 'ring-2 ring-green-500' : ''}`}>
                <div className="h-2 bg-green-500 rounded mb-1"></div>
                <div className="font-medium">99.5+</div>
                <div className="text-gray-400 text-[10px]">Excellent</div>
              </div>
              <div className={`p-2 rounded text-center ${avgScore >= 98 && avgScore < 99.5 ? 'ring-2 ring-green-400' : ''}`}>
                <div className="h-2 bg-green-400 rounded mb-1"></div>
                <div className="font-medium">98-99.4</div>
                <div className="text-gray-400 text-[10px]">Very Good</div>
              </div>
              <div className={`p-2 rounded text-center ${avgScore >= 96 && avgScore < 98 ? 'ring-2 ring-yellow-400' : ''}`}>
                <div className="h-2 bg-yellow-400 rounded mb-1"></div>
                <div className="font-medium">96-97.9</div>
                <div className="text-gray-400 text-[10px]">Good</div>
              </div>
              <div className={`p-2 rounded text-center ${avgScore < 96 ? 'ring-2 ring-orange-400' : ''}`}>
                <div className="h-2 bg-orange-400 rounded mb-1"></div>
                <div className="font-medium">&lt;96</div>
                <div className="text-gray-400 text-[10px]">Needs Work</div>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
            <p className="mb-2">
              <strong>Food Safety Scores</strong> are based on Ottawa Public Health inspections of restaurants,
              cafes, food trucks, and other food establishments. Each inspection results in a score from 0-100.
            </p>
            <p>
              Violations are categorized as <strong>critical</strong> (immediate health risk) or
              non-critical (procedural issues). Lower violation rates indicate better food safety practices.
            </p>
          </div>

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <a
              href="https://inspections.ottawapublichealth.ca/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Source: Ottawa Public Health Inspections</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
