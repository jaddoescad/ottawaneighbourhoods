"use client";

import { useState } from "react";
import { CrimeByCategory } from "@/data/neighbourhoods";

interface CrimeStatRowProps {
  total: number;
  byCategory: CrimeByCategory;
  population: number;
  maxTotal?: number;
  maxCategory?: number;
}

// Thresholds based on crime per 1,000 residents (2023-2024, 2 years of data)
// Low: < 50 per 1,000 (safe suburban/rural areas like Barrhaven, Orleans)
// Moderate: 50-150 per 1,000 (typical urban areas)
// High: > 150 per 1,000 (high crime areas like downtown)
function getCrimeColor(perCapita: number): string {
  if (perCapita < 50) return "bg-green-500";
  if (perCapita < 150) return "bg-yellow-400";
  return "bg-red-500";
}

function getCrimeLabel(perCapita: number): string {
  if (perCapita < 50) return "Low";
  if (perCapita < 150) return "Moderate";
  return "High";
}

// For categories: Low < 400, Moderate < 1500, High >= 1500
function getCategoryColor(value: number): string {
  if (value < 400) return "bg-green-500";
  if (value < 1500) return "bg-yellow-400";
  return "bg-red-500";
}

export default function CrimeStatRow({
  total,
  byCategory,
  population,
  maxTotal = 15000,
  maxCategory = 4000,
}: CrimeStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1]);

  // Calculate crime per 1,000 residents
  const perCapita = population > 0 ? (total / population) * 1000 : 0;

  // Bar width based on per capita (max ~150 per 1,000 for scaling)
  const barWidth = Math.max(5, Math.min((perCapita / 150) * 100, 100));
  const hasCategories = sortedCategories.length > 0;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Main Total Bar */}
      <button
        onClick={() => hasCategories && setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-3 px-5 py-4 ${hasCategories ? "hover:bg-gray-50 cursor-pointer" : ""} transition-colors`}
        disabled={!hasCategories}
      >
        <div className="flex items-center gap-2 w-28 shrink-0">
          <span className="text-xl">🚨</span>
          <span className="text-gray-900 font-medium">Crime</span>
        </div>
        <div className="flex-1 relative h-9 bg-gray-100 rounded-lg overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-lg ${getCrimeColor(perCapita)} transition-all duration-300`}
            style={{ width: `${barWidth}%` }}
          />
          <span className="absolute inset-0 flex items-center px-4 text-gray-800 font-semibold text-sm">
            {getCrimeLabel(perCapita)}
          </span>
        </div>
        <div className="relative group">
          <span className="text-gray-900 font-bold w-36 text-right block cursor-help">
            {perCapita.toFixed(1)} per 1K
          </span>
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            <div className="font-semibold mb-1">Crime Rate Breakdown</div>
            <div>{total.toLocaleString()} total crimes (2023-2024)</div>
            <div>{population.toLocaleString()} residents</div>
            <div className="mt-1 pt-1 border-t border-gray-700">
              = {perCapita.toFixed(1)} crimes per 1,000 people
            </div>
            <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
        <div className="w-5 h-5">
          {hasCategories && (
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
      </button>

      {/* Expanded Category Bars */}
      {isExpanded && hasCategories && (
        <div className="px-5 pb-4 bg-gray-50">
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
            Crime by Category (2023-2024)
          </div>
          <div className="space-y-2">
            {sortedCategories.map(([category, count]) => {
              const catBarWidth = Math.max(5, Math.min((count / maxCategory) * 100, 100));
              return (
                <div key={category} className="flex items-center gap-3">
                  <span className="text-gray-700 text-sm w-40 truncate" title={category}>
                    {category}
                  </span>
                  <div className="flex-1 relative h-6 bg-gray-200 rounded overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded ${getCategoryColor(count)} transition-all duration-300`}
                      style={{ width: `${catBarWidth}%` }}
                    />
                  </div>
                  <span className="text-gray-600 text-sm font-medium w-16 text-right">
                    {count.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
