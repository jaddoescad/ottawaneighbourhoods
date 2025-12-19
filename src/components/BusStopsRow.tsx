"use client";

import { useState } from "react";

interface DataSource {
  name: string;
  url: string;
}

interface BusStopsRowProps {
  totalStops: number | null;
  stopsWithShelter: number;
  stopsWithBench: number;
  density: number | null; // stops per km²
  source?: DataSource;
}

// Thresholds for transit coverage (based on Ottawa data)
// Excellent: >= 40 stops per km² (downtown core like Centretown)
// Good: >= 20 per km² (urban areas like Westboro, Hintonburg)
// Moderate: >= 8 per km² (inner suburbs)
// Limited: < 8 per km² (outer suburbs/rural)
function getTransitColor(density: number): string {
  if (density >= 40) return "bg-green-500";
  if (density >= 20) return "bg-green-400";
  if (density >= 8) return "bg-yellow-400";
  return "bg-orange-400";
}

function getTransitLabel(density: number): string {
  if (density >= 40) return "Excellent";
  if (density >= 20) return "Good";
  if (density >= 8) return "Moderate";
  return "Limited";
}

// Scale bar width to match labels visually
// Limited: 15-35%, Moderate: 40-55%, Good: 60-75%, Excellent: 80-100%
function getBarWidth(density: number): number {
  if (density >= 40) return 80 + Math.min((density - 40) / 20 * 20, 20); // 80-100%
  if (density >= 20) return 60 + (density - 20) / 20 * 15; // 60-75%
  if (density >= 8) return 40 + (density - 8) / 12 * 15; // 40-55%
  return Math.max(15, density / 8 * 25 + 10); // 15-35%
}

export default function BusStopsRow({
  totalStops,
  stopsWithShelter,
  stopsWithBench,
  density,
  source,
}: BusStopsRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (totalStops === null) {
    return null;
  }

  const hasData = totalStops > 0;
  const effectiveDensity = density ?? 0;

  // Calculate percentages
  const shelterPct = totalStops > 0 ? (stopsWithShelter / totalStops) * 100 : 0;
  const benchPct = totalStops > 0 ? (stopsWithBench / totalStops) * 100 : 0;

  // Bar width with better scaling for visibility
  const barWidth = getBarWidth(effectiveDensity);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Main Row */}
      <button
        onClick={() => hasData && setIsExpanded(!isExpanded)}
        className={`w-full px-3 sm:px-5 py-3 sm:py-4 ${hasData ? "hover:bg-gray-50 cursor-pointer" : ""} transition-colors`}
        disabled={!hasData}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Label */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">🚌</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Bus Stops</span>
            </div>
            {/* Mobile value and chevron */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-gray-900 font-bold text-sm">
                {totalStops} stops
              </span>
              {hasData && (
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
              className={`absolute inset-y-0 left-0 rounded-lg ${getTransitColor(effectiveDensity)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getTransitLabel(effectiveDensity)}
            </span>
          </div>

          {/* Desktop value with tooltip */}
          <div className="hidden sm:block relative group">
            <span className="text-gray-900 font-bold w-28 text-right block cursor-help">
              {totalStops} stops
            </span>
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="font-semibold mb-1">Transit Coverage</div>
              <div>{totalStops.toLocaleString()} bus stops</div>
              <div>{effectiveDensity.toFixed(1)} stops per km²</div>
              <div className="mt-1 pt-1 border-t border-gray-700">
                {stopsWithShelter} with shelter ({shelterPct.toFixed(0)}%)
              </div>
              <div>{stopsWithBench} with bench ({benchPct.toFixed(0)}%)</div>
              <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>

          {/* Chevron */}
          <div className="hidden sm:block w-5 h-5">
            {hasData && (
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

      {/* Expanded View with Bar Chart */}
      {isExpanded && hasData && (
        <div className="px-3 sm:px-5 pb-4 bg-gray-50">
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
            Bus Stop Amenities
          </div>

          {/* Horizontal Bar Chart */}
          <div className="space-y-3">
            {/* With Shelter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="text-gray-700 text-xs sm:text-sm sm:w-32 flex items-center gap-1">
                  <span>🏠</span> With Shelter
                </span>
                <span className="text-gray-600 text-xs sm:text-sm font-medium sm:hidden">
                  {stopsWithShelter} ({shelterPct.toFixed(0)}%)
                </span>
              </div>
              <div className="flex-1 relative h-6 sm:h-7 bg-gray-200 rounded overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-blue-500 transition-all duration-300"
                  style={{ width: `${shelterPct}%` }}
                />
                <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700">
                  {shelterPct.toFixed(0)}%
                </span>
              </div>
              <span className="hidden sm:block text-gray-600 text-sm font-medium w-20 text-right">
                {stopsWithShelter.toLocaleString()}
              </span>
            </div>

            {/* With Bench */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="text-gray-700 text-xs sm:text-sm sm:w-32 flex items-center gap-1">
                  <span>🪑</span> With Bench
                </span>
                <span className="text-gray-600 text-xs sm:text-sm font-medium sm:hidden">
                  {stopsWithBench} ({benchPct.toFixed(0)}%)
                </span>
              </div>
              <div className="flex-1 relative h-6 sm:h-7 bg-gray-200 rounded overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-teal-500 transition-all duration-300"
                  style={{ width: `${benchPct}%` }}
                />
                <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700">
                  {benchPct.toFixed(0)}%
                </span>
              </div>
              <span className="hidden sm:block text-gray-600 text-sm font-medium w-20 text-right">
                {stopsWithBench.toLocaleString()}
              </span>
            </div>

            {/* No Amenities */}
            {(() => {
              const noAmenities = totalStops - Math.max(stopsWithShelter, stopsWithBench);
              const noAmenitiesPct = totalStops > 0 ? (noAmenities / totalStops) * 100 : 0;
              return noAmenities > 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-gray-700 text-xs sm:text-sm sm:w-32 flex items-center gap-1">
                      <span>🚏</span> Basic Stop
                    </span>
                    <span className="text-gray-600 text-xs sm:text-sm font-medium sm:hidden">
                      {noAmenities} ({noAmenitiesPct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="flex-1 relative h-6 sm:h-7 bg-gray-200 rounded overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded bg-gray-400 transition-all duration-300"
                      style={{ width: `${noAmenitiesPct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700">
                      {noAmenitiesPct.toFixed(0)}%
                    </span>
                  </div>
                  <span className="hidden sm:block text-gray-600 text-sm font-medium w-20 text-right">
                    {noAmenities.toLocaleString()}
                  </span>
                </div>
              ) : null;
            })()}
          </div>

          {/* Density info and source */}
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>Density: {effectiveDensity.toFixed(1)} stops per km²</span>
            {source && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>{source.name}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
