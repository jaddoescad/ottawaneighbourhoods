"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { NeighbourhoodBoundary } from "@/data/neighbourhoods";

const IncomeOnsMap = dynamic(
  () => import("./IncomeOnsMap"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface IncomeStatRowProps {
  medianIncome: number;
  households: number;
  boundaries: NeighbourhoodBoundary[];
  neighbourhoodName: string;
}

// Ottawa median income context (2021 Census)
// Ottawa CMA median: ~$98,000
// Low: < $70,000 (affordable areas, students)
// Moderate: $70,000 - $100,000
// High: $100,000 - $120,000
// Very High: > $120,000

function getIncomeColor(income: number): string {
  if (income < 70000) return "bg-orange-400";
  if (income < 90000) return "bg-yellow-400";
  if (income < 110000) return "bg-green-400";
  return "bg-green-500";
}

function getIncomeLabel(income: number): string {
  if (income < 70000) return "Below Average";
  if (income < 90000) return "Average";
  if (income < 110000) return "Above Average";
  return "High Income";
}

export default function IncomeStatRow({
  medianIncome,
  households,
  boundaries,
  neighbourhoodName,
}: IncomeStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Bar width based on income (max ~$130,000 for scaling)
  const maxIncome = 130000;
  const barWidth = Math.max(10, Math.min((medianIncome / maxIncome) * 100, 100));
  const formattedIncome = `$${medianIncome.toLocaleString()}`;

  // Get zones with income data, sorted by income (highest first)
  const zonesWithIncome = boundaries
    .filter((b) => b.medianIncome > 0)
    .sort((a, b) => b.medianIncome - a.medianIncome);

  const hasZoneData = zonesWithIncome.length > 0;

  // Calculate Ottawa average for comparison
  const ottawaMedian = 98000;
  const diffFromOttawa = medianIncome - ottawaMedian;
  const diffPercent = Math.round((diffFromOttawa / ottawaMedian) * 100);

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
              <span className="text-lg sm:text-xl">💰</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Income</span>
            </div>
            {/* Value and chevron shown inline on mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-gray-900 font-bold text-sm">{formattedIncome}</span>
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
          {/* Bar - reflects income level */}
          <div className="w-full sm:flex-1 relative h-7 sm:h-9 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-lg ${getIncomeColor(medianIncome)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getIncomeLabel(medianIncome)}
            </span>
          </div>
          {/* Value - hidden on mobile, shown on desktop */}
          <span className="hidden sm:block text-gray-900 font-bold w-28 text-right">{formattedIncome}</span>
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
              2021 Census
            </span>
            <span className="text-xs text-gray-500">Median after-tax household income</span>
          </div>

          {/* Comparison with Ottawa */}
          <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">vs Ottawa Median</div>
                <div className="text-lg font-bold text-gray-900">
                  ${ottawaMedian.toLocaleString()}
                </div>
              </div>
              <div className={`text-right ${diffFromOttawa >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                <div className="text-lg font-bold">
                  {diffFromOttawa >= 0 ? '+' : ''}{diffPercent}%
                </div>
                <div className="text-xs">
                  {diffFromOttawa >= 0 ? '+' : ''}${Math.abs(diffFromOttawa).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Households info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Households</div>
              <div className="text-lg font-bold text-gray-900">{households.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Data Type</div>
              <div className="text-lg font-bold text-gray-900">Median</div>
              <div className="text-xs text-gray-500">After-tax</div>
            </div>
          </div>

          {/* Income by ONS Zone Map */}
          {hasZoneData && zonesWithIncome.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
                Income by Area
              </div>
              <IncomeOnsMap
                boundaries={boundaries}
                neighbourhoodName={neighbourhoodName}
              />
            </div>
          )}

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Source:</span>
              <a
                href="https://ons-sqo.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
              >
                Statistics Canada 2021 Census via ONS-SQO
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
