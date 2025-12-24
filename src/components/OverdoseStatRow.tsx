"use client";

import { useState } from "react";

interface DataSource {
  name: string;
  url: string;
}

interface OverdoseStatRowProps {
  cumulative: number | null;
  yearlyAvg: number | null;
  ratePer100k: number | null;
  years: string | null;
  population: number;
  source?: DataSource;
}

// Thresholds based on overdose ED visits per 100,000 population
// Based on Ottawa data: city average ~65, high areas 100+
function getRateColor(rate: number): string {
  if (rate < 30) return "bg-green-500";
  if (rate < 70) return "bg-yellow-400";
  if (rate < 130) return "bg-orange-500";
  return "bg-red-500";
}

function getRateLabel(rate: number): string {
  if (rate < 30) return "Low";
  if (rate < 70) return "Moderate";
  if (rate < 130) return "High";
  return "Very High";
}

export default function OverdoseStatRow({
  cumulative,
  yearlyAvg,
  ratePer100k,
  years,
  population,
  source,
}: OverdoseStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // If no overdose data available
  if (ratePer100k === null && cumulative === null) {
    return (
      <div className="border-b border-gray-100 last:border-b-0">
        <div className="w-full px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:w-28 sm:shrink-0">
              <span className="text-lg sm:text-xl">💊</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Overdose Rate</span>
            </div>
            <div className="w-full sm:flex-1 relative h-7 sm:h-9 bg-gray-100 rounded-lg overflow-hidden">
              <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-500 text-xs sm:text-sm">
                No data available
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use rate if available, otherwise estimate from cumulative/population
  const displayRate = ratePer100k !== null
    ? ratePer100k
    : (cumulative && population > 0 ? (cumulative / 5 / population) * 100000 : 0);

  // Bar width based on rate (max ~200 for scaling, Lowertown West is outlier at 1888)
  const barWidth = Math.max(5, Math.min((displayRate / 150) * 100, 100));

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Main Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Label row */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">💊</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Overdose Rate</span>
            </div>
            {/* Value and chevron on mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-gray-900 font-bold text-sm">
                {displayRate.toFixed(1)} per 100K
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
          </div>
          {/* Bar */}
          <div className="w-full sm:flex-1 relative h-7 sm:h-9 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-lg ${getRateColor(displayRate)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getRateLabel(displayRate)}
            </span>
          </div>
          {/* Value with tooltip - hidden on mobile */}
          <div className="hidden sm:block relative group">
            <span className="text-gray-900 font-bold w-28 text-right block cursor-help">
              {displayRate.toFixed(1)} per 100K
            </span>
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="font-semibold mb-1">Overdose ED Visits ({years || "2020-2024"})</div>
              <div>{yearlyAvg?.toFixed(1) || "N/A"} avg yearly visits</div>
              <div>{cumulative?.toFixed(1) || "N/A"} total over 5 years</div>
              <div className="mt-1 pt-1 border-t border-gray-700">
                = {displayRate.toFixed(1)} per 100,000 residents/year
              </div>
              <div className="text-gray-400">Ottawa avg: ~65 per 100K</div>
              <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
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
            Overdose Statistics ({years || "2020-2024"})
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="text-gray-500">Yearly Average</div>
              <div className="font-bold text-gray-900">{yearlyAvg?.toFixed(1) || "N/A"} visits</div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="text-gray-500">Rate (per 100K)</div>
              <div className={`font-bold ${displayRate >= 100 ? "text-red-600" : displayRate >= 70 ? "text-orange-600" : "text-gray-900"}`}>
                {displayRate.toFixed(1)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="text-gray-500">Total (5 years)</div>
              <div className="font-bold text-gray-900">{cumulative?.toFixed(1) || "N/A"}</div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="text-gray-500">Population</div>
              <div className="font-bold text-gray-900">{population.toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-3 p-2 bg-blue-50 rounded-lg text-xs text-blue-800">
            <strong>Note:</strong> Data reflects ED visits by patient residence, not incident location.
            Rates may be suppressed for small populations to protect privacy.
          </div>

          {source && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Source: {source.name}</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
