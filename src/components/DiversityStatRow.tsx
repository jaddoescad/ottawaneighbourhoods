"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { NeighbourhoodBoundary } from "@/data/neighbourhoods";

const DiversityOnsMap = dynamic(
  () => import("./DiversityOnsMap"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface DiversityStatRowProps {
  pctImmigrants: number | null;
  pctRacialized: number | null;
  boundaries?: NeighbourhoodBoundary[];
  neighbourhoodName?: string;
}

// Ottawa average from 2021 Census: ~25% immigrants, ~30% racialized
function getDiversityColor(pct: number): string {
  if (pct >= 30) return "bg-purple-500";
  if (pct >= 20) return "bg-purple-400";
  if (pct >= 10) return "bg-purple-300";
  return "bg-purple-200";
}

function getDiversityLabel(pctImmigrants: number, pctRacialized: number): string {
  const avg = (pctImmigrants + pctRacialized) / 2;
  if (avg >= 35) return "Very Diverse";
  if (avg >= 25) return "Diverse";
  if (avg >= 15) return "Moderate";
  return "Less Diverse";
}

export default function DiversityStatRow({
  pctImmigrants,
  pctRacialized,
  boundaries = [],
  neighbourhoodName = "",
}: DiversityStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapMetric, setMapMetric] = useState<"immigrants" | "racialized">("immigrants");

  // If no data available
  if (pctImmigrants === null && pctRacialized === null) {
    return (
      <div className="border-b border-gray-100 last:border-b-0">
        <div className="w-full px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:w-28 sm:shrink-0">
              <span className="text-lg sm:text-xl">🌍</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Diversity</span>
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

  const immigrants = pctImmigrants ?? 0;
  const racialized = pctRacialized ?? 0;
  const avgDiversity = (immigrants + racialized) / 2;

  // Bar width based on average (max 50% for scaling)
  const barWidth = Math.max(5, Math.min((avgDiversity / 50) * 100, 100));

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
              <span className="text-lg sm:text-xl">🌍</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Diversity</span>
            </div>
            {/* Value and chevron on mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-gray-900 font-bold text-sm">{immigrants.toFixed(0)}% immigrants</span>
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
              className={`absolute inset-y-0 left-0 rounded-lg ${getDiversityColor(avgDiversity)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getDiversityLabel(immigrants, racialized)}
            </span>
          </div>
          {/* Value - hidden on mobile */}
          <div className="hidden sm:block">
            <span className="text-gray-900 font-bold w-28 text-right block">
              {immigrants.toFixed(0)}% immigrants
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
            Diversity Breakdown (2021 Census)
          </div>

          {/* Metrics */}
          <div className="space-y-3">
            {/* Immigrants */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="text-gray-700 text-xs sm:text-sm sm:w-44">
                  Immigrants
                </span>
                <span className="text-gray-600 text-xs sm:text-sm font-medium sm:hidden">
                  {immigrants.toFixed(1)}%
                </span>
              </div>
              <div className="flex-1 relative h-5 sm:h-6 bg-gray-200 rounded overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-blue-400 transition-all duration-300"
                  style={{ width: `${Math.min(immigrants, 100)}%` }}
                />
              </div>
              <span className="hidden sm:block text-gray-600 text-sm font-medium w-16 text-right">
                {immigrants.toFixed(1)}%
              </span>
            </div>

            {/* Racialized */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="text-gray-700 text-xs sm:text-sm sm:w-44">
                  Visible Minorities
                </span>
                <span className="text-gray-600 text-xs sm:text-sm font-medium sm:hidden">
                  {racialized.toFixed(1)}%
                </span>
              </div>
              <div className="flex-1 relative h-5 sm:h-6 bg-gray-200 rounded overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-purple-400 transition-all duration-300"
                  style={{ width: `${Math.min(racialized, 100)}%` }}
                />
              </div>
              <span className="hidden sm:block text-gray-600 text-sm font-medium w-16 text-right">
                {racialized.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Comparison to Ottawa average */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2">Compared to Ottawa Average</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white rounded-lg p-2 border border-gray-200">
                <div className="text-gray-500">Immigrants</div>
                <div className="font-bold text-gray-900">
                  {immigrants.toFixed(0)}%
                  <span className={`ml-1 text-xs ${immigrants > 25 ? 'text-purple-600' : immigrants < 25 ? 'text-gray-400' : 'text-gray-500'}`}>
                    {immigrants > 25 ? '(above avg)' : immigrants < 25 ? '(below avg)' : '(avg)'}
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 border border-gray-200">
                <div className="text-gray-500">Visible Minorities</div>
                <div className="font-bold text-gray-900">
                  {racialized.toFixed(0)}%
                  <span className={`ml-1 text-xs ${racialized > 30 ? 'text-purple-600' : racialized < 30 ? 'text-gray-400' : 'text-gray-500'}`}>
                    {racialized > 30 ? '(above avg)' : racialized < 30 ? '(below avg)' : '(avg)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Map by ONS Zone */}
          {boundaries.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Diversity by ONS Zone
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setMapMetric("immigrants")}
                    className={`px-2 py-1 text-xs rounded ${
                      mapMetric === "immigrants"
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Immigrants
                  </button>
                  <button
                    onClick={() => setMapMetric("racialized")}
                    className={`px-2 py-1 text-xs rounded ${
                      mapMetric === "racialized"
                        ? "bg-purple-100 text-purple-700 font-medium"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Visible Minorities
                  </button>
                </div>
              </div>
              <DiversityOnsMap
                boundaries={boundaries}
                neighbourhoodName={neighbourhoodName}
                metric={mapMetric}
              />
            </div>
          )}

          {/* Explanation */}
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
            <p className="mb-2">
              <strong>Immigrants:</strong> Residents born outside Canada who have been granted permanent residence.
            </p>
            <p>
              <strong>Visible Minorities:</strong> Persons who identify as non-Caucasian or non-white (excluding Indigenous peoples). This includes South Asian, Chinese, Black, Filipino, Arab, Latin American, Southeast Asian, West Asian, Korean, Japanese, and other groups.
            </p>
          </div>

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <a
              href="https://www12.statcan.gc.ca/census-recensement/2021/dp-pd/prof/index.cfm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Source: Statistics Canada 2021 Census</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
