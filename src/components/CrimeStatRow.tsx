"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CrimeByCategory, NeighbourhoodBoundary } from "@/data/neighbourhoods";

const CrimeOnsMap = dynamic(
  () => import("./CrimeOnsMap"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface DataSource {
  name: string;
  url: string;
}

interface CrimeStatRowProps {
  total: number;
  byCategory: CrimeByCategory;
  population: number;
  maxTotal?: number;
  maxCategory?: number;
  source?: DataSource;
  boundaries?: NeighbourhoodBoundary[];
  neighbourhoodName?: string;
}

// Thresholds based on crime per 1,000 residents (2024)
// Low: < 50 per 1,000 (safe suburban/rural areas like Barrhaven, Orleans)
// Moderate: 50-150 per 1,000 (typical urban areas)
// High: > 150 per 1,000 (high crime areas like downtown)
function getCrimeColor(perCapita: number): string {
  if (perCapita < 50) return "bg-green-500";
  if (perCapita < 150) return "bg-yellow-400";
  return "bg-red-500";
}

function getCrimeLabel(perCapita: number): string {
  if (perCapita < 50) return "Low";
  if (perCapita < 150) return "Moderate";
  return "High";
}

// For categories: Low < 400, Moderate < 1500, High >= 1500
function getCategoryColor(value: number): string {
  if (value < 400) return "bg-green-500";
  if (value < 1500) return "bg-yellow-400";
  return "bg-red-500";
}

export default function CrimeStatRow({
  total,
  byCategory,
  population,
  maxTotal = 15000,
  maxCategory = 4000,
  source,
  boundaries = [],
  neighbourhoodName = "",
}: CrimeStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedCategories = Object.entries(byCategory)
    .filter((entry): entry is [string, number] => entry[1] !== undefined)
    .sort((a, b) => b[1] - a[1]);

  // Calculate crime per 1,000 residents
  const perCapita = population > 0 ? (total / population) * 1000 : 0;

  // Bar width based on per capita (max ~150 per 1,000 for scaling)
  const barWidth = Math.max(5, Math.min((perCapita / 150) * 100, 100));
  const hasCategories = sortedCategories.length > 0;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Main Total Bar */}
      <button
        onClick={() => hasCategories && setIsExpanded(!isExpanded)}
        className={`w-full px-3 sm:px-5 py-3 sm:py-4 ${hasCategories ? "hover:bg-gray-50 cursor-pointer" : ""} transition-colors`}
        disabled={!hasCategories}
      >
        {/* Mobile: stacked layout, Desktop: horizontal */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Label row with value on mobile */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">🚨</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Crime</span>
            </div>
            {/* Value and chevron on mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-gray-900 font-bold text-sm">{perCapita.toFixed(1)} per 1K</span>
              {hasCategories && (
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
          {/* Bar */}
          <div className="w-full sm:flex-1 relative h-7 sm:h-9 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-lg ${getCrimeColor(perCapita)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getCrimeLabel(perCapita)}
            </span>
          </div>
          {/* Value with tooltip - hidden on mobile */}
          <div className="hidden sm:block relative group">
            <span className="text-gray-900 font-bold w-28 text-right block cursor-help">
              {perCapita.toFixed(1)} per 1K
            </span>
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="font-semibold mb-1">Crime Rate Breakdown</div>
              <div>{total.toLocaleString()} total crimes (2024)</div>
              <div>{population.toLocaleString()} residents</div>
              <div className="mt-1 pt-1 border-t border-gray-700">
                = {perCapita.toFixed(1)} crimes per 1,000 people
              </div>
              <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          <div className="hidden sm:block w-5 h-5">
            {hasCategories && (
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>
      </button>

      {/* Expanded Category Bars */}
      {isExpanded && hasCategories && (
        <div className="px-3 sm:px-5 pb-4 bg-gray-50">
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
            Crime by Category (2024)
          </div>
          <div className="space-y-2">
            {sortedCategories.map(([category, count]) => {
              const catBarWidth = Math.max(5, Math.min((count / maxCategory) * 100, 100));
              return (
                <div key={category} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-gray-700 text-xs sm:text-sm sm:w-40 truncate" title={category}>
                      {category}
                    </span>
                    <span className="text-gray-600 text-xs sm:text-sm font-medium sm:hidden">
                      {count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex-1 relative h-5 sm:h-6 bg-gray-200 rounded overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded ${getCategoryColor(count)} transition-all duration-300`}
                      style={{ width: `${catBarWidth}%` }}
                    />
                  </div>
                  <span className="hidden sm:block text-gray-600 text-sm font-medium w-16 text-right">
                    {count.toLocaleString()}
                  </span>
                </div>
              );
            })}
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

          {/* Crime Density Map by ONS Zone */}
          {boundaries.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
                Crime Rate by ONS Zone
              </div>
              <CrimeOnsMap
                boundaries={boundaries}
                neighbourhoodName={neighbourhoodName}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
