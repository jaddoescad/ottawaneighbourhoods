"use client";

import { useState } from "react";

interface RoadQualityStatRowProps {
  roadQualityScore: number;
  roadComplaints: number;
  roadComplaintsRate: number;
  roadComplaintsPerKm2: number;
  roadComplaintsByType: Record<string, number>;
  areaKm2: number;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-400";
  if (score >= 30) return "bg-orange-400";
  return "bg-red-400";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Below Average";
  return "Poor";
}

function getComplaintIcon(type: string): string {
  if (type.toLowerCase().includes('pothole')) return '🕳️';
  if (type.toLowerCase().includes('sidewalk')) return '🚶';
  if (type.toLowerCase().includes('gravel')) return '🪨';
  if (type.toLowerCase().includes('damaged') || type.toLowerCase().includes('destroyed')) return '⚠️';
  if (type.toLowerCase().includes('sunken') || type.toLowerCase().includes('raised')) return '📐';
  if (type.toLowerCase().includes('depression')) return '⬇️';
  if (type.toLowerCase().includes('concrete')) return '🧱';
  return '🛣️';
}

function getComplaintColor(type: string): string {
  if (type.toLowerCase().includes('pothole')) return 'bg-red-100 text-red-700 border-red-200';
  if (type.toLowerCase().includes('sidewalk')) return 'bg-purple-100 text-purple-700 border-purple-200';
  if (type.toLowerCase().includes('gravel')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function shortenComplaintType(type: string): string {
  return type
    .replace('Road Maintenance - ', '')
    .replace('Road Surface - ', '')
    .replace('Road - ', '')
    .replace('Sidewalk - ', 'Sidewalk: ');
}

export default function RoadQualityStatRow({
  roadQualityScore,
  roadComplaints,
  roadComplaintsRate,
  roadComplaintsPerKm2,
  roadComplaintsByType,
  areaKm2,
}: RoadQualityStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const barWidth = Math.max(10, Math.min(roadQualityScore, 100));

  // Sort complaint types by count
  const sortedTypes = Object.entries(roadComplaintsByType)
    .filter((entry): entry is [string, number] => entry[1] !== undefined && entry[1] > 0)
    .sort((a, b) => b[1] - a[1]);

  const hasData = roadComplaints > 0;
  const displayValue = hasData ? `${roadQualityScore}/100` : 'No Data';

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">🛣️</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Roads</span>
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
              className={`absolute inset-y-0 left-0 rounded-lg ${getScoreColor(roadQualityScore)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getScoreLabel(roadQualityScore)} ({roadQualityScore}/100)
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
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-700">{roadQualityScore}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Score</div>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-orange-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">{roadComplaints.toLocaleString()}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Complaints</div>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-blue-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{roadComplaintsRate}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">per 1K pop</div>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-purple-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">{roadComplaintsPerKm2}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">per km²</div>
                </div>
              </div>

              {/* Complaint Breakdown */}
              {sortedTypes.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                    Complaint Types (2024-2025)
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {sortedTypes.map(([type, count]) => (
                      <div key={type} className="px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{getComplaintIcon(type)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded border ${getComplaintColor(type)}`}>
                            {shortenComplaintType(type)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Score Explanation */}
              <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                  How Road Quality is Calculated
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Based on 311 service requests for road issues (potholes, surface damage, etc.) per km².</p>
                  <p>Fewer complaints = higher score. Score of 100 means best roads in Ottawa, 1 means most complaints.</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🛣️</div>
              <div className="text-gray-600 font-medium">No road complaint data available</div>
              <div className="text-sm text-gray-500 mt-1">
                This neighbourhood may have limited 311 data coverage
              </div>
            </div>
          )}

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Source:</span>
              <a
                href="https://open.ottawa.ca/datasets/311-service-requests"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
              >
                City of Ottawa 311 Service Requests (2024-2025)
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
