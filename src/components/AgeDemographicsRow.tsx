"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { NeighbourhoodBoundary } from "@/data/neighbourhoods";

const AgeOnsMap = dynamic(
  () => import("./AgeOnsMap"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface AgeDemographicsRowProps {
  pctChildren: number;
  pctYoungProfessionals: number;
  pctSeniors: number;
  boundaries?: NeighbourhoodBoundary[];
  neighbourhoodName?: string;
}

export default function AgeDemographicsRow({
  pctChildren,
  pctYoungProfessionals,
  pctSeniors,
  boundaries = [],
  neighbourhoodName = "",
}: AgeDemographicsRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate weighted average age from boundaries
  const avgAge = boundaries.length > 0
    ? boundaries.reduce((sum, b) => sum + (b.avgAge || 0) * (b.population || 1), 0) /
      boundaries.reduce((sum, b) => sum + (b.population || 1), 0)
    : null;

  // Ottawa average percentages (2021 Census)
  const ottawaAverages = {
    children: 16.7,
    youngProfessionals: 27.7,
    seniors: 16.0,
  };

  // Determine the "character" of the neighbourhood based on demographics
  const getDemographicType = (): { label: string; type: "great" | "good" | "okay" | "bad" } => {
    const childrenRatio = pctChildren / ottawaAverages.children;
    const youngProRatio = pctYoungProfessionals / ottawaAverages.youngProfessionals;
    const seniorsRatio = pctSeniors / ottawaAverages.seniors;

    // Find the dominant demographic
    if (childrenRatio >= 1.1 && childrenRatio > youngProRatio && childrenRatio > seniorsRatio) {
      return { label: "Family-Friendly", type: "great" };
    }
    if (youngProRatio >= 1.1 && youngProRatio > childrenRatio && youngProRatio > seniorsRatio) {
      return { label: "Young & Urban", type: "good" };
    }
    if (seniorsRatio >= 1.15) {
      return { label: "Mature Community", type: "okay" };
    }
    return { label: "Mixed Demographics", type: "good" };
  };

  const demographic = getDemographicType();

  const colors = {
    great: "bg-green-500",
    good: "bg-blue-400",
    okay: "bg-purple-400",
    bad: "bg-gray-400",
  };

  // For the main bar, show a composite "diversity" score based on balance
  const getBalancePercent = () => {
    // Higher score = more balanced demographics
    const total = pctChildren + pctYoungProfessionals + pctSeniors;
    return Math.min(total, 100);
  };

  const barWidth = Math.max(5, Math.min(getBalancePercent(), 100));

  // For individual bars in expanded view
  const maxPercent = 50; // Scale for visibility

  const demographics = [
    {
      label: "Families w/ Children",
      sublabel: "Ages 0-14",
      value: pctChildren,
      average: ottawaAverages.children,
      color: pctChildren >= ottawaAverages.children ? "bg-green-500" : "bg-gray-300",
    },
    {
      label: "Young Professionals",
      sublabel: "Ages 25-44",
      value: pctYoungProfessionals,
      average: ottawaAverages.youngProfessionals,
      color: pctYoungProfessionals >= ottawaAverages.youngProfessionals ? "bg-blue-400" : "bg-gray-300",
    },
    {
      label: "Seniors",
      sublabel: "Ages 65+",
      value: pctSeniors,
      average: ottawaAverages.seniors,
      color: "bg-purple-400",
    },
  ];

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        {/* Mobile: stacked layout, Desktop: horizontal */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Label row with source on mobile */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">👨‍👩‍👧‍👦</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Age</span>
            </div>
            {/* Value and chevron shown inline on mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-gray-900 font-bold text-sm">{avgAge ? `${avgAge.toFixed(1)} avg` : ""}</span>
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
          {/* Bar */}
          <div className="w-full sm:flex-1 relative h-7 sm:h-9 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-lg ${colors[demographic.type]} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {demographic.label}
            </span>
          </div>
          {/* Value - hidden on mobile, shown on desktop */}
          <span className="hidden sm:block text-gray-900 font-bold w-28 text-right">{avgAge ? `${avgAge.toFixed(1)} avg` : ""}</span>
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
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
            Age Distribution
          </div>
          <div className="space-y-3">
            {demographics.map((demo) => (
              <div key={demo.label}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span className="truncate mr-2">{demo.label} <span className="text-gray-400 hidden sm:inline">({demo.sublabel})</span></span>
                  <span className="font-medium shrink-0">{demo.value}%</span>
                </div>
                <div className="relative h-5 bg-gray-200 rounded overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded ${demo.color} transition-all duration-300`}
                    style={{ width: `${Math.min((demo.value / maxPercent) * 100, 100)}%` }}
                  />
                  {/* Ottawa average marker */}
                  <div
                    className="absolute inset-y-0 w-0.5 bg-gray-600"
                    style={{ left: `${(demo.average / maxPercent) * 100}%` }}
                    title={`Ottawa avg: ${demo.average}%`}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="mt-3 pt-2 border-t border-gray-200 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-0.5 h-3 bg-gray-600" />
              <span>Ottawa avg</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Families</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-400 rounded" />
              <span>Young Pro</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-400 rounded" />
              <span>Seniors</span>
            </div>
          </div>

          {/* ONS Zone Map - only show if boundaries exist */}
          {boundaries.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
                Age Demographics by ONS Zone
              </div>
              <AgeOnsMap
                boundaries={boundaries}
                neighbourhoodName={neighbourhoodName}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
