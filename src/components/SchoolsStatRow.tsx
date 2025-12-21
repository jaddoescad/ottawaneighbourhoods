"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { NeighbourhoodBoundary, SchoolData } from "@/data/neighbourhoods";

const SchoolsOnsMap = dynamic(
  () => import("./SchoolsOnsMap"),
  { ssr: false, loading: () => <div className="h-72 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface DataSource {
  name: string;
  url: string;
}

interface SchoolsStatRowProps {
  schoolsCount: number;
  elementaryCount: number;
  secondaryCount: number;
  schoolsList: string[];
  schoolsData: SchoolData[];
  avgEqaoScore: number | null;
  percent: number;
  type?: "great" | "good" | "okay" | "bad" | "neutral";
  source?: DataSource;
  boundaries?: NeighbourhoodBoundary[];
  neighbourhoodName?: string;
}

export default function SchoolsStatRow({
  schoolsCount,
  elementaryCount,
  secondaryCount,
  schoolsList,
  schoolsData,
  avgEqaoScore,
  percent,
  type = "good",
  source,
  boundaries = [],
  neighbourhoodName = "",
}: SchoolsStatRowProps) {
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
  const value = `${schoolsCount} schools`;

  // Count by board
  const schoolsByBoard: Record<string, number> = {};
  schoolsData.forEach(school => {
    schoolsByBoard[school.board] = (schoolsByBoard[school.board] || 0) + 1;
  });

  const BOARD_NAMES: Record<string, string> = {
    "OCDSB": "Public English",
    "OCSB": "Catholic English",
    "CECCE": "Catholic French",
    "CEPEO": "Public French",
  };

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">🏫</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Schools</span>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-gray-900 font-bold text-sm">{value}</span>
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
              className={`absolute inset-y-0 left-0 rounded-lg ${colors[type]} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {qualityLabels[type]}
            </span>
          </div>
          <span className="hidden sm:block text-gray-900 font-bold w-28 text-right">{value}</span>
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
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
              <div className="text-lg font-bold text-gray-900">{elementaryCount}</div>
              <div className="text-xs text-gray-500">Elementary</div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
              <div className="text-lg font-bold text-gray-900">{secondaryCount}</div>
              <div className="text-xs text-gray-500">Secondary</div>
            </div>
            {avgEqaoScore !== null && (
              <div className="bg-white rounded-lg p-2 border border-gray-200 text-center col-span-2 sm:col-span-2">
                <div className="text-lg font-bold text-gray-900">{avgEqaoScore}%</div>
                <div className="text-xs text-gray-500">Avg EQAO Score</div>
              </div>
            )}
          </div>

          {/* Board Breakdown */}
          {Object.keys(schoolsByBoard).length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.entries(schoolsByBoard).map(([board, count]) => (
                <div key={board} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">
                  <span className="font-medium">{count}</span>
                  <span className="text-gray-500 ml-1">{BOARD_NAMES[board] || board}</span>
                </div>
              ))}
            </div>
          )}

          {/* Map */}
          {boundaries.length > 0 && schoolsData.length > 0 && schoolsData[0].lat && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
                Schools Map
              </div>
              <SchoolsOnsMap
                boundaries={boundaries}
                schools={schoolsData}
                neighbourhoodName={neighbourhoodName}
              />
            </div>
          )}

          {/* School List (fallback if no map) */}
          {!boundaries.length && (
            <>
              <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
                All schools ({schoolsList.length})
              </div>
              <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                {schoolsList.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Source */}
          {source && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Source: {source.name}</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
