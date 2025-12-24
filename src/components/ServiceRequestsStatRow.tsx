"use client";

import { useState } from "react";

interface ServiceRequestsByType {
  [category: string]: number;
}

interface ServiceRequestsStatRowProps {
  total: number;
  rate: number; // per 1000 residents
  byType: ServiceRequestsByType;
  population: number;
}

function getRateColor(rate: number): string {
  // Lower is better for service requests
  if (rate <= 300) return "bg-green-500";
  if (rate <= 500) return "bg-yellow-400";
  if (rate <= 800) return "bg-orange-400";
  return "bg-red-400";
}

function getRateLabel(rate: number): string {
  if (rate <= 300) return "Low Volume";
  if (rate <= 500) return "Moderate";
  if (rate <= 800) return "Above Average";
  return "High Volume";
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'Roads & Transportation': return '🛣️';
    case 'Garbage & Recycling': return '🗑️';
    case 'Bylaw Services': return '📋';
    case 'Water & Environment': return '💧';
    case 'Recreation & Culture': return '🎭';
    case 'Licenses & Permits': return '📄';
    case 'Health & Safety': return '🏥';
    case 'Social Services': return '🤝';
    case 'City Hall': return '🏛️';
    case 'Corporate Complaints': return '📝';
    case 'Miscellaneous': return '📦';
    default: return '📊';
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'Roads & Transportation':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'Garbage & Recycling':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'Bylaw Services':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'Water & Environment':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Recreation & Culture':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Licenses & Permits':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Health & Safety':
      return 'bg-pink-100 text-pink-700 border-pink-200';
    case 'Social Services':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export default function ServiceRequestsStatRow({
  total,
  rate,
  byType,
  population,
}: ServiceRequestsStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Normalize rate to 0-100 scale for the bar (assuming max around 1500)
  const normalizedRate = Math.min((rate / 1500) * 100, 100);
  const barWidth = Math.max(10, normalizedRate);

  // Sort categories by count
  const sortedCategories = Object.entries(byType)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  // Get top 3 categories for summary
  const topCategories = sortedCategories.slice(0, 3);

  const displayValue = total > 0 ? total.toLocaleString() : '0';

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">📞</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">311 Requests</span>
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
              className={`absolute inset-y-0 left-0 rounded-lg ${getRateColor(rate)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getRateLabel(rate)} ({rate.toFixed(0)}/1000 residents)
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
          {total > 0 ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-gray-700">{total.toLocaleString()}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Total (2024-25)</div>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-blue-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{rate.toFixed(0)}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Per 1K People</div>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 border border-green-200 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{sortedCategories.length}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase">Categories</div>
                </div>
              </div>

              {/* Top Categories Summary */}
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                  Top Request Types
                </div>
                <div className="flex flex-wrap gap-2">
                  {topCategories.map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-1.5 border border-gray-200"
                    >
                      <span>{getCategoryIcon(category)}</span>
                      <span className="text-sm font-medium text-gray-700">{category}</span>
                      <span className="text-sm text-gray-500">({count.toLocaleString()})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Breakdown */}
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                  All Request Types
                </div>
                <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                  {sortedCategories.map(([category, count]) => {
                    const percentage = ((count / total) * 100).toFixed(1);
                    return (
                      <div key={category} className="px-3 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{getCategoryIcon(category)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded border ${getCategoryColor(category)}`}>
                            {category}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-700">
                            {count.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Context */}
              <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                  What This Means
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    <strong>311</strong> is the City of Ottawa's non-emergency service line for reporting issues
                    like potholes, missed garbage collection, bylaw violations, and more.
                  </p>
                  <p>
                    Higher rates can indicate active community engagement or areas needing more municipal attention.
                    Lower rates may suggest fewer issues or less reporting.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">📞</div>
              <div className="text-gray-600 font-medium">No 311 data available</div>
              <div className="text-sm text-gray-500 mt-1">
                Service request data is not available for this neighbourhood
              </div>
            </div>
          )}

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Source:</span>
              <a
                href="https://open.ottawa.ca/datasets/current-year-service-requests"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
              >
                City of Ottawa 311 Open Data (2024-2025)
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
