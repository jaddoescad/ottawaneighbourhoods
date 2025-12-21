"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { NeighbourhoodBoundary } from "@/data/neighbourhoods";

const PopulationOnsMap = dynamic(
  () => import("./PopulationOnsMap"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface PopulationStatRowProps {
  population: number;
  populationDensity: number;
  households: number;
  pop2021: number;
  dataYear: number;
  dataSource: string;
  percent: number;
  type?: "great" | "good" | "okay" | "bad" | "neutral";
  boundaries?: NeighbourhoodBoundary[];
  neighbourhoodName?: string;
}

export default function PopulationStatRow({
  population,
  populationDensity,
  households,
  pop2021,
  dataYear,
  dataSource,
  percent,
  type = "good",
  boundaries = [],
  neighbourhoodName = "",
}: PopulationStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const colors = {
    great: "bg-green-500",
    good: "bg-green-400",
    okay: "bg-yellow-400",
    bad: "bg-orange-500",
    neutral: "bg-gray-300",
  };

  const qualityLabels = {
    great: "Large",
    good: "Medium-Large",
    okay: "Medium",
    bad: "Small",
    neutral: "N/A",
  };

  const barWidth = Math.max(5, Math.min(percent, 100));
  const formattedPopulation = population.toLocaleString();

  // Calculate average household size
  const avgHouseholdSize = households > 0 ? (population / households).toFixed(1) : "N/A";

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        {/* Mobile: stacked layout, Desktop: horizontal */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Label row with value on mobile */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">👥</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Population</span>
            </div>
            {/* Value and chevron shown inline on mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-gray-900 font-bold text-sm">{formattedPopulation}</span>
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
              className={`absolute inset-y-0 left-0 rounded-lg ${colors[type]} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {qualityLabels[type]}
            </span>
          </div>
          {/* Value - hidden on mobile, shown on desktop */}
          <span className="hidden sm:block text-gray-900 font-bold w-28 text-right">{formattedPopulation}</span>
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

      {isExpanded && (
        <div className="px-3 sm:px-5 pb-4 bg-gray-50">
          {/* Census Year Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {dataYear} Census
            </span>
          </div>

          {/* Population Details */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Households</div>
              <div className="text-lg font-bold text-gray-900">{households.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg Household Size</div>
              <div className="text-lg font-bold text-gray-900">{avgHouseholdSize}</div>
            </div>
          </div>

          {/* Density Info */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Population Density</span>
              <span className="font-medium text-gray-900">{populationDensity.toLocaleString()}/km²</span>
            </div>
          </div>

          {/* ONS Zone Map - only show if boundaries exist */}
          {boundaries.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
                Population by ONS Zone
              </div>
              <PopulationOnsMap
                boundaries={boundaries}
                neighbourhoodName={neighbourhoodName}
              />
            </div>
          )}

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Source: {dataSource}
            </span>
            <a
              href="/citations"
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              View all citations
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
