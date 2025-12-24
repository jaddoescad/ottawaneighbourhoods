"use client";

import { useState } from "react";

interface CyclingInfraStatRowProps {
  cyclingTotalKm: number;
  bikeLanesKm: number;
  pathsKm: number;
  pavedShouldersKm: number;
  cyclingByType: Record<string, number | undefined>;
  bikeScore: number;
  areaKm2: number;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-400";
  if (score >= 25) return "bg-orange-400";
  return "bg-red-400";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Very Bikeable";
  if (score >= 50) return "Bikeable";
  if (score >= 25) return "Some Infrastructure";
  return "Limited";
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'Cycle Track': return '🛡️';
    case 'Segregated Bike Lane': return '🛡️';
    case 'Bike Lane': return '🚲';
    case 'Path': return '🛤️';
    case 'Paved Shoulder': return '🛣️';
    case 'Mountain Bike Trail': return '🚵';
    case 'Suggested Route': return '📍';
    default: return '🚴';
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'Cycle Track':
    case 'Segregated Bike Lane':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'Bike Lane':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Path':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Paved Shoulder':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'Mountain Bike Trail':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export default function CyclingInfraStatRow({
  cyclingTotalKm,
  bikeLanesKm,
  pathsKm,
  pavedShouldersKm,
  cyclingByType,
  bikeScore,
  areaKm2,
}: CyclingInfraStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const barWidth = Math.max(10, Math.min(bikeScore, 100));
  const density = areaKm2 > 0 ? (cyclingTotalKm / areaKm2).toFixed(1) : '0';

  // Sort infrastructure types by length
  const sortedTypes = Object.entries(cyclingByType)
    .filter((entry): entry is [string, number] => entry[1] !== undefined && entry[1] > 0)
    .map(([type, lengthM]) => ({ type, km: lengthM / 1000 }))
    .sort((a, b) => b.km - a.km);

  const displayValue = cyclingTotalKm > 0 ? `${cyclingTotalKm.toFixed(1)} km` : 'None';

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
              <span className="text-gray-900 font-medium text-sm sm:text-base">Cycling</span>
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
              className={`absolute inset-y-0 left-0 rounded-lg ${getScoreColor(bikeScore)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getScoreLabel(bikeScore)} ({bikeScore}/100)
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
          {cyclingTotalKm > 0 ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-700">{cyclingTotalKm.toFixed(1)}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Total km</div>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-blue-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{bikeLanesKm.toFixed(1)}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Bike Lanes</div>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-purple-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">{pathsKm.toFixed(1)}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Paths</div>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-600">{density}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">km/km²</div>
                </div>
              </div>

              {/* Infrastructure Breakdown */}
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                  Infrastructure Types
                </div>
                <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                  {sortedTypes.map(({ type, km }) => (
                    <div key={type} className="px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{getTypeIcon(type)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded border ${getTypeColor(type)}`}>
                          {type}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {km.toFixed(1)} km
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                  Infrastructure Types Explained
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span className="text-gray-600"><strong>Cycle Track</strong> - Protected/separated</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>🚲</span>
                    <span className="text-gray-600"><strong>Bike Lane</strong> - Painted on road</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>🛤️</span>
                    <span className="text-gray-600"><strong>Path</strong> - Multi-use pathway</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>🛣️</span>
                    <span className="text-gray-600"><strong>Paved Shoulder</strong> - Rural roads</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🚴</div>
              <div className="text-gray-600 font-medium">No dedicated cycling infrastructure</div>
              <div className="text-sm text-gray-500 mt-1">
                This neighbourhood has limited bike lanes and paths
              </div>
            </div>
          )}

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Source:</span>
              <a
                href="https://maps.ottawa.ca/arcgis/rest/services/CyclingMap/MapServer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
              >
                City of Ottawa Cycling Map
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
