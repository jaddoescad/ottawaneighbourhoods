"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { GreenbeltTrailData, ParkData, NeighbourhoodBoundary } from "@/data/neighbourhoods";

const TrailsMap = dynamic(
  () => import("./TrailsMap"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface TrailsStatRowProps {
  greenbeltTrails: GreenbeltTrailData[];
  greenbeltLengthKm: number;
  linearParks: ParkData[];
  boundaries: NeighbourhoodBoundary[];
  neighbourhoodName: string;
}

function getTrailsColor(count: number): string {
  if (count === 0) return "bg-gray-300";
  if (count >= 10) return "bg-green-500";
  if (count >= 5) return "bg-green-400";
  if (count >= 2) return "bg-yellow-400";
  return "bg-yellow-300";
}

function getTrailsLabel(count: number): string {
  if (count === 0) return "None";
  if (count >= 10) return "Excellent";
  if (count >= 5) return "Good";
  if (count >= 2) return "Some";
  return "Limited";
}

// Difficulty badge colors
function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'bg-green-100 text-green-700';
    case 'moderate': return 'bg-yellow-100 text-yellow-700';
    case 'difficult': return 'bg-orange-100 text-orange-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

// Trail type icons
function getTrailTypeIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'loop': return '🔄';
    case 'paved pathway': return '🛤️';
    case 'boardwalk trail': return '🌿';
    case 'off-leash dog area': return '🐕';
    default: return '🥾';
  }
}

export default function TrailsStatRow({
  greenbeltTrails,
  greenbeltLengthKm,
  linearParks,
  boundaries,
  neighbourhoodName,
}: TrailsStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalTrails = greenbeltTrails.length + linearParks.length;
  const barWidth = Math.max(10, Math.min((totalTrails / 15) * 100, 100));
  const hasTrails = totalTrails > 0;

  // Group greenbelt trails by sector
  const trailsBySector = greenbeltTrails.reduce((acc, trail) => {
    const sector = trail.sector || 'Other';
    if (!acc[sector]) acc[sector] = [];
    acc[sector].push(trail);
    return acc;
  }, {} as Record<string, GreenbeltTrailData[]>);

  const displayValue = greenbeltLengthKm > 0
    ? `${totalTrails} trails (${greenbeltLengthKm} km)`
    : `${totalTrails} trails`;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">🚴</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Trails</span>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-gray-900 font-bold text-sm">{displayValue}</span>
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
          <div className="w-full sm:flex-1 relative h-7 sm:h-9 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-lg ${getTrailsColor(totalTrails)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getTrailsLabel(totalTrails)}
            </span>
          </div>
          <span className="hidden sm:block text-gray-900 font-bold w-28 text-right">{displayValue}</span>
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
          {hasTrails ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-green-600">{greenbeltTrails.length}</div>
                  <div className="text-xs text-gray-500 uppercase">Greenbelt</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-blue-600">{linearParks.length}</div>
                  <div className="text-xs text-gray-500 uppercase">Linear Parks</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-gray-700">{greenbeltLengthKm}</div>
                  <div className="text-xs text-gray-500 uppercase">Total KM</div>
                </div>
              </div>

              {/* Map */}
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
                  Trail Locations
                </div>
                <TrailsMap
                  greenbeltTrails={greenbeltTrails}
                  linearParks={linearParks}
                  boundaries={boundaries}
                  neighbourhoodName={neighbourhoodName}
                />
              </div>

              {/* NCC Greenbelt Trails */}
              {greenbeltTrails.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    NCC Greenbelt Trails ({greenbeltTrails.length})
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(trailsBySector).map(([sector, trails]) => (
                      <div key={sector} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-3 py-2 bg-green-50 border-b border-gray-100">
                          <span className="text-sm font-medium text-green-800">{sector}</span>
                          <span className="text-xs text-green-600 ml-2">
                            ({trails.reduce((sum, t) => sum + t.lengthKm, 0).toFixed(1)} km)
                          </span>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {trails.map((trail, index) => (
                            <div key={index} className="px-3 py-2 flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span>{getTrailTypeIcon(trail.type)}</span>
                                <span className="text-sm text-gray-700 truncate">{trail.name}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-xs px-1.5 py-0.5 rounded ${getDifficultyColor(trail.difficulty)}`}>
                                  {trail.difficulty}
                                </span>
                                <span className="text-sm font-medium text-gray-600">
                                  {trail.lengthKm} km
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linear Parks */}
              {linearParks.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    Linear Parks & Pathways ({linearParks.length})
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      {linearParks.map((park, index) => (
                        <div key={index} className="px-3 py-2 flex items-center gap-2">
                          <span>🛤️</span>
                          <span className="text-sm text-gray-700">{park.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* NCC Info */}
              <div className="pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">
                  The NCC Greenbelt is a 20,000-hectare green space surrounding Ottawa with 150+ km of trails for hiking, cycling, and cross-country skiing.
                </div>
                <a
                  href="https://ncc-ccn.gc.ca/places/greenbelt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  Explore NCC Greenbelt
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🚴</div>
              <div className="text-gray-600 font-medium">No trails in this neighbourhood</div>
              <div className="text-sm text-gray-500 mt-1">
                Check nearby neighbourhoods or visit ncc-ccn.gc.ca for Greenbelt access points
              </div>
            </div>
          )}

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Source:</span>
              <a
                href="https://ncc-ccn.gc.ca/places/greenbelt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
              >
                NCC Greenbelt & City of Ottawa
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
