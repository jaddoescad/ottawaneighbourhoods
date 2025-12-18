"use client";

import { useState } from "react";

interface ExpandableStatRowProps {
  icon: string;
  label: string;
  value: string | number;
  percent: number;
  type?: "great" | "good" | "okay" | "bad" | "neutral";
  items: string[];
  itemLabel: string;
}

export default function ExpandableStatRow({
  icon,
  label,
  value,
  percent,
  type = "good",
  items,
  itemLabel,
}: ExpandableStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const colors = {
    great: "bg-green-500",
    good: "bg-green-400",
    okay: "bg-yellow-400",
    bad: "bg-orange-500",
    neutral: "bg-gray-300",
  };

  const qualityLabels = {
    great: "Excellent",
    good: "Good",
    okay: "Fair",
    bad: "Low",
    neutral: "N/A",
  };

  const barWidth = Math.max(5, Math.min(percent, 100));
  const hasItems = items.length > 0;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => hasItems && setIsExpanded(!isExpanded)}
        className={`w-full px-4 sm:px-5 py-3 sm:py-4 ${hasItems ? "hover:bg-gray-50 cursor-pointer" : ""} transition-colors`}
        disabled={!hasItems}
      >
        {/* Mobile: stacked layout, Desktop: horizontal */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Label row with value on mobile */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">{icon}</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">{label}</span>
            </div>
            {/* Value and chevron shown inline on mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-gray-900 font-bold text-sm">{value}</span>
              {hasItems && (
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
          {/* Bar */}
          <div className="flex-1 relative h-7 sm:h-9 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-lg ${colors[type]} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {qualityLabels[type]}
            </span>
          </div>
          {/* Value - hidden on mobile, shown on desktop */}
          <span className="hidden sm:block text-gray-900 font-bold w-28 text-right">{value}</span>
          <div className="hidden sm:block w-5 h-5">
            {hasItems && (
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>
      </button>

      {isExpanded && hasItems && (
        <div className="px-4 sm:px-5 pb-4 bg-gray-50">
          <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
            All {itemLabel} ({items.length})
          </div>
          <ul className="space-y-1.5 max-h-64 overflow-y-auto">
            {items.map((item, index) => (
              <li key={index} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
