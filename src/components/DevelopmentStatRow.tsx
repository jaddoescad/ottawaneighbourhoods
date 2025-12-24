"use client";

import { useState } from "react";

interface DevelopmentStatRowProps {
  developmentScore: number;
  total: number;
  active: number;
  approved: number;
  recent: number;
  developmentRate: number;
  byType: Record<string, number | undefined>;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-400";
  if (score >= 30) return "bg-orange-400";
  return "bg-gray-400";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Very Active";
  if (score >= 60) return "Active";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Low Activity";
  return "Minimal";
}

function getTypeIcon(type: string): string {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('site plan')) return '🏗️';
  if (typeLower.includes('zoning')) return '📋';
  if (typeLower.includes('subdivision')) return '🗺️';
  if (typeLower.includes('official plan')) return '📜';
  if (typeLower.includes('heritage')) return '🏛️';
  if (typeLower.includes('demolition')) return '🔨';
  if (typeLower.includes('condominium')) return '🏢';
  return '📄';
}

function getTypeColor(type: string): string {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('site plan')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (typeLower.includes('zoning')) return 'bg-purple-100 text-purple-700 border-purple-200';
  if (typeLower.includes('subdivision')) return 'bg-green-100 text-green-700 border-green-200';
  if (typeLower.includes('official plan')) return 'bg-orange-100 text-orange-700 border-orange-200';
  if (typeLower.includes('heritage')) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (typeLower.includes('demolition')) return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

function shortenType(type: string): string {
  return type
    .replace('Control', '')
    .replace('Amendment', 'Amend.')
    .replace('By-law', '')
    .trim();
}

export default function DevelopmentStatRow({
  developmentScore,
  total,
  active,
  approved,
  recent,
  developmentRate,
  byType,
}: DevelopmentStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const barWidth = Math.max(10, Math.min(developmentScore, 100));

  // Sort types by count
  const sortedTypes = Object.entries(byType)
    .filter((entry): entry is [string, number] => entry[1] !== undefined && entry[1] > 0)
    .sort((a, b) => b[1] - a[1]);

  const hasData = total > 0;
  const displayValue = hasData ? `${active} active` : 'No Data';

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">🏗️</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Growth</span>
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
              className={`absolute inset-y-0 left-0 rounded-lg ${getScoreColor(developmentScore)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getScoreLabel(developmentScore)} ({developmentScore}/100)
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
          {hasData ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-blue-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{active}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Active</div>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-green-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{recent}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Recent</div>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-purple-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">{approved}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Approved</div>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-600">{total}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Total</div>
                </div>
              </div>

              {/* Application Type Breakdown */}
              {sortedTypes.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                    Applications by Type
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {sortedTypes.map(([type, count]) => (
                      <div key={type} className="px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{getTypeIcon(type)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded border ${getTypeColor(type)}`}>
                            {shortenType(type)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Score Explanation */}
              <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                  What This Means
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Active</strong> applications are currently being reviewed or in progress.</p>
                  <p><strong>Recent</strong> applications are from 2023-2025. Higher activity indicates neighbourhood growth.</p>
                  <p>Includes: Site Plans, Zoning Amendments, Subdivisions, Official Plan Amendments.</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🏗️</div>
              <div className="text-gray-600 font-medium">No development application data</div>
              <div className="text-sm text-gray-500 mt-1">
                This neighbourhood may have limited development activity
              </div>
            </div>
          )}

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Source:</span>
              <a
                href="https://maps.ottawa.ca/arcgis/rest/services/Development_Applications/MapServer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
              >
                City of Ottawa Development Applications
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
