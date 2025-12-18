"use client";

import { useState } from "react";
import { CrimeByCategory } from "@/data/neighbourhoods";

interface CrimeStatRowProps {
  total: number;
  byCategory: CrimeByCategory;
  maxTotal?: number;
  maxCategory?: number;
}

// Thresholds based on actual Ottawa data distribution (2023-2024)
// Low: < 1,500 (rural/quiet suburban areas)
// Moderate: 1,500 - 5,000 (typical suburban/urban areas)
// High: > 5,000 (downtown cores)
function getCrimeColor(value: number): string {
  if (value < 1500) return "bg-green-500";
  if (value < 5000) return "bg-yellow-400";
  return "bg-red-500";
}

function getCrimeLabel(value: number): string {
  if (value < 1500) return "Low";
  if (value < 5000) return "Moderate";
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
  maxTotal = 15000,
  maxCategory = 4000,
}: CrimeStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1]);

  // Bar width scales to max for visual representation
  const barWidth = Math.max(5, Math.min((total / maxTotal) * 100, 100));
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
            className={`absolute inset-y-0 left-0 rounded-lg ${getCrimeColor(total)} transition-all duration-300`}
            style={{ width: `${barWidth}%` }}
          />
          <span className="absolute inset-0 flex items-center px-4 text-gray-800 font-semibold text-sm">
            {getCrimeLabel(total)}
          </span>
        </div>
        <span className="text-gray-900 font-bold w-28 text-right">{total.toLocaleString()} total</span>
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
