"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { NeighbourhoodBoundary } from "@/data/neighbourhoods";

const GreenspaceOnsMap = dynamic(
  () => import("./GreenspaceOnsMap"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface GreenspaceStatRowProps {
  treeCanopy: number | null;
  parksCount: number;
  greenbeltTrailsCount: number;
  greenbeltLengthKm: number;
  boundaries?: NeighbourhoodBoundary[];
  neighbourhoodName?: string;
}

// Ottawa's urban tree canopy target is 40%
const TREE_TARGET = 40;

function getTreeCanopyColor(pct: number): string {
  if (pct >= 35) return "bg-green-500";
  if (pct >= 25) return "bg-green-400";
  if (pct >= 15) return "bg-yellow-400";
  return "bg-orange-400";
}

function getTreeCanopyLabel(pct: number): string {
  if (pct >= 40) return "Meets Target";
  if (pct >= 35) return "Good";
  if (pct >= 25) return "Moderate";
  if (pct >= 15) return "Below Avg";
  return "Low";
}

export default function GreenspaceStatRow({
  treeCanopy,
  parksCount,
  greenbeltTrailsCount,
  greenbeltLengthKm,
  boundaries = [],
  neighbourhoodName = "",
}: GreenspaceStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapMetric, setMapMetric] = useState<"treeCanopy" | "parkland">("treeCanopy");

  const canopy = treeCanopy ?? 0;
  const barWidth = Math.max(5, Math.min((canopy / 50) * 100, 100));

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
              <span className="text-lg sm:text-xl">🌳</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Greenspace</span>
            </div>
            {/* Value and chevron on mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-gray-900 font-bold text-sm">{canopy.toFixed(0)}% canopy</span>
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
              className={`absolute inset-y-0 left-0 rounded-lg ${getTreeCanopyColor(canopy)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getTreeCanopyLabel(canopy)}
            </span>
          </div>
          {/* Value - hidden on mobile */}
          <div className="hidden sm:block">
            <span className="text-gray-900 font-bold w-28 text-right block">
              {canopy.toFixed(0)}% canopy
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
            Greenspace Overview (2024)
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="text-gray-500">Tree Canopy</div>
              <div className="font-bold text-gray-900 text-lg">{canopy.toFixed(1)}%</div>
              <div className={`text-xs ${canopy >= TREE_TARGET ? 'text-green-600' : 'text-amber-600'}`}>
                Target: {TREE_TARGET}%
              </div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="text-gray-500">Parks</div>
              <div className="font-bold text-gray-900 text-lg">{parksCount}</div>
              <div className="text-xs text-gray-400">in neighbourhood</div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="text-gray-500">Greenbelt Trails</div>
              <div className="font-bold text-gray-900 text-lg">{greenbeltTrailsCount}</div>
              <div className="text-xs text-gray-400">nearby</div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="text-gray-500">Trail Length</div>
              <div className="font-bold text-gray-900 text-lg">{greenbeltLengthKm.toFixed(1)} km</div>
              <div className="text-xs text-gray-400">of trails</div>
            </div>
          </div>

          {/* Tree Canopy Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Tree Canopy Coverage</span>
              <span>{canopy.toFixed(1)}% / {TREE_TARGET}% target</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${canopy >= TREE_TARGET ? 'bg-green-500' : 'bg-green-400'}`}
                style={{ width: `${Math.min((canopy / TREE_TARGET) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {canopy >= TREE_TARGET
                ? "Meets Ottawa's 40% urban tree canopy target"
                : `${(TREE_TARGET - canopy).toFixed(1)}% below Ottawa's target`}
            </div>
          </div>

          {/* Map by ONS Zone */}
          {boundaries.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Coverage by ONS Zone
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setMapMetric("treeCanopy")}
                    className={`px-2 py-1 text-xs rounded ${
                      mapMetric === "treeCanopy"
                        ? "bg-green-100 text-green-700 font-medium"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Tree Canopy
                  </button>
                  <button
                    onClick={() => setMapMetric("parkland")}
                    className={`px-2 py-1 text-xs rounded ${
                      mapMetric === "parkland"
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Parkland
                  </button>
                </div>
              </div>
              <GreenspaceOnsMap
                boundaries={boundaries}
                neighbourhoodName={neighbourhoodName}
                metric={mapMetric}
              />
            </div>
          )}

          {/* Explanation */}
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
            <p className="mb-2">
              <strong>Tree Canopy:</strong> Percentage of land covered by tree crowns when viewed from above. Ottawa's Official Plan targets 40% canopy in urban areas.
            </p>
            <p>
              <strong>Parkland:</strong> Percentage of land designated as parks and green space in residential areas.
            </p>
          </div>

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <a
              href="https://ottawa.ca/en/canopy-cover-and-tree-inventory"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Source: City of Ottawa Tree Canopy Study 2024</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
