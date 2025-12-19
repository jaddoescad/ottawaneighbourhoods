"use client";

import { useState } from "react";

interface StatRowProps {
  icon: string;
  label: string;
  value: string | number;
  percent: number;
  type?: "great" | "good" | "okay" | "bad" | "neutral";
  labelSet?: "income" | "rent" | "homePrice" | "population" | "healthcare" | "commute";
  tooltip?: string;
}

export default function StatRow({
  icon,
  label,
  value,
  percent,
  type = "good",
  labelSet = "income",
  tooltip,
}: StatRowProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const colors = {
    great: "bg-green-500",
    good: "bg-green-400",
    okay: "bg-yellow-400",
    bad: "bg-orange-500",
    neutral: "bg-gray-300",
  };

  const qualityLabelsMap = {
    income: {
      great: "High",
      good: "Above Avg",
      okay: "Average",
      bad: "Below Avg",
      neutral: "N/A",
    },
    rent: {
      great: "Affordable",
      good: "Moderate",
      okay: "Average",
      bad: "Expensive",
      neutral: "N/A",
    },
    homePrice: {
      great: "Affordable",
      good: "Moderate",
      okay: "Average",
      bad: "Expensive",
      neutral: "N/A",
    },
    population: {
      great: "Large",
      good: "Medium-Large",
      okay: "Medium",
      bad: "Small",
      neutral: "N/A",
    },
    healthcare: {
      great: "Very Close",
      good: "Close",
      okay: "Moderate",
      bad: "Far",
      neutral: "N/A",
    },
    commute: {
      great: "Quick",
      good: "Short",
      okay: "Moderate",
      bad: "Long",
      neutral: "N/A",
    },
  };

  const qualityLabels = qualityLabelsMap[labelSet];

  const barWidth = Math.max(5, Math.min(percent, 100));

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="w-full px-3 sm:px-5 py-3 sm:py-4">
        {/* Mobile: stacked layout, Desktop: horizontal */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Label row with value on mobile */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">{icon}</span>
              <div className="relative">
                <span
                  className={`text-gray-900 font-medium text-sm sm:text-base ${tooltip ? 'border-b border-dotted border-gray-400 cursor-help' : ''}`}
                  onMouseEnter={() => tooltip && setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => tooltip && setShowTooltip(!showTooltip)}
                >
                  {label}
                </span>
                {tooltip && showTooltip && (
                  <div className="absolute left-0 top-full mt-1 z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-nowrap">
                    {tooltip}
                  </div>
                )}
              </div>
            </div>
            {/* Value shown inline on mobile */}
            <span className="text-gray-900 font-bold text-sm sm:hidden">{value}</span>
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
          <div className="hidden sm:block w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
