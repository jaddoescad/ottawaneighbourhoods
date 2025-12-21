"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { NeighbourhoodBoundary } from "@/data/neighbourhoods";

const EducationOnsMap = dynamic(
  () => import("./EducationOnsMap"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface EducationStatRowProps {
  boundaries: NeighbourhoodBoundary[];
  neighbourhoodName: string;
}

// Ottawa averages (2021 Census)
const OTTAWA_AVERAGES = {
  bachelors: 42.5,
  postSecondary: 72.8,
  noHighSchool: 6.2,
};

export default function EducationStatRow({
  boundaries,
  neighbourhoodName,
}: EducationStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate weighted averages from boundaries
  let totalPop = 0;
  let weightedBachelors = 0;
  let weightedPostSecondary = 0;
  let weightedNoHighSchool = 0;

  for (const b of boundaries) {
    const pop = b.population || 1;
    totalPop += pop;
    weightedBachelors += (b.pctBachelors || 0) * pop;
    weightedPostSecondary += (b.pctPostSecondary || 0) * pop;
    weightedNoHighSchool += (b.pctNoHighSchool || 0) * pop;
  }

  const avgBachelors = totalPop > 0 ? weightedBachelors / totalPop : 0;
  const avgPostSecondary = totalPop > 0 ? weightedPostSecondary / totalPop : 0;
  const avgNoHighSchool = totalPop > 0 ? weightedNoHighSchool / totalPop : 0;

  const hasData = boundaries.length > 0 && totalPop > 0;

  // Determine overall quality based on Bachelor's rate vs Ottawa average
  const getOverallType = (): "great" | "good" | "okay" | "bad" | "neutral" => {
    if (!hasData) return "neutral";
    const diff = avgBachelors - OTTAWA_AVERAGES.bachelors;
    if (diff >= 10) return "great";
    if (diff >= 0) return "good";
    if (diff >= -10) return "okay";
    return "bad";
  };

  const type = getOverallType();

  const qualityLabels = {
    great: "Well Educated",
    good: "Above Average",
    okay: "Average",
    bad: "Below Average",
    neutral: "N/A",
  };

  const typeColors = {
    great: "text-green-600",
    good: "text-green-500",
    okay: "text-yellow-600",
    bad: "text-orange-500",
    neutral: "text-gray-400",
  };

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => hasData && setIsExpanded(!isExpanded)}
        className={`w-full px-3 sm:px-5 py-3 sm:py-4 ${hasData ? "hover:bg-gray-50 cursor-pointer" : ""} transition-colors`}
        disabled={!hasData}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Label */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">📚</span>
              <span className="text-gray-900 font-medium text-sm">Education</span>
            </div>
            {/* Mobile value and chevron */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className={`font-bold text-sm ${typeColors[type]}`}>
                {hasData ? qualityLabels[type] : "N/A"}
              </span>
              {hasData && (
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

          {/* Stacked bars */}
          <div className="w-full sm:flex-1 space-y-1.5">
            {/* Bachelor's Degree */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20 sm:w-24 truncate">Bachelor's+</span>
              <div className="flex-1 relative h-5 bg-gray-100 rounded overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-blue-500"
                  style={{ width: `${Math.min(avgBachelors, 100)}%` }}
                />
                <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700">
                  {avgBachelors.toFixed(1)}%
                </span>
              </div>
            </div>
            {/* Post-Secondary */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20 sm:w-24 truncate">Post-Secondary</span>
              <div className="flex-1 relative h-5 bg-gray-100 rounded overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-green-500"
                  style={{ width: `${Math.min(avgPostSecondary, 100)}%` }}
                />
                <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700">
                  {avgPostSecondary.toFixed(1)}%
                </span>
              </div>
            </div>
            {/* No High School */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-20 sm:w-24 truncate">No Diploma</span>
              <div className="flex-1 relative h-5 bg-gray-100 rounded overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-orange-400"
                  style={{ width: `${Math.min(avgNoHighSchool * 5, 100)}%` }}
                />
                <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700">
                  {avgNoHighSchool.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Desktop value */}
          <span className={`hidden sm:block font-bold w-28 text-right ${typeColors[type]}`}>
            {hasData ? qualityLabels[type] : "N/A"}
          </span>
          <div className="hidden sm:block w-5 h-5">
            {hasData && (
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

      {isExpanded && hasData && (
        <div className="px-3 sm:px-5 pb-4 bg-gray-50">
          {/* Comparison to Ottawa */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Bachelor's+</div>
              <div className="text-lg font-bold text-blue-600">{avgBachelors.toFixed(1)}%</div>
              <div className={`text-xs ${avgBachelors >= OTTAWA_AVERAGES.bachelors ? "text-green-600" : "text-red-500"}`}>
                {avgBachelors >= OTTAWA_AVERAGES.bachelors ? "+" : ""}{(avgBachelors - OTTAWA_AVERAGES.bachelors).toFixed(1)}% vs Ottawa
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Post-Secondary</div>
              <div className="text-lg font-bold text-green-600">{avgPostSecondary.toFixed(1)}%</div>
              <div className={`text-xs ${avgPostSecondary >= OTTAWA_AVERAGES.postSecondary ? "text-green-600" : "text-red-500"}`}>
                {avgPostSecondary >= OTTAWA_AVERAGES.postSecondary ? "+" : ""}{(avgPostSecondary - OTTAWA_AVERAGES.postSecondary).toFixed(1)}% vs Ottawa
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">No Diploma</div>
              <div className="text-lg font-bold text-orange-500">{avgNoHighSchool.toFixed(1)}%</div>
              <div className={`text-xs ${avgNoHighSchool <= OTTAWA_AVERAGES.noHighSchool ? "text-green-600" : "text-red-500"}`}>
                {avgNoHighSchool <= OTTAWA_AVERAGES.noHighSchool ? "" : "+"}{(avgNoHighSchool - OTTAWA_AVERAGES.noHighSchool).toFixed(1)}% vs Ottawa
              </div>
            </div>
          </div>

          {/* ONS Zone Map */}
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
            Education Levels by ONS Zone
          </div>
          <EducationOnsMap
            boundaries={boundaries}
            neighbourhoodName={neighbourhoodName}
          />

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">
              Education levels of residents aged 25-64.
            </p>
            <a
              href="https://ons-sqo.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Source: Statistics Canada 2021 Census via ONS</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
