"use client";

import { useState } from "react";

interface School {
  name: string;
  eqaoScore: number | null;
  category: string;
}

interface EqaoStatRowProps {
  avgScore: number | null;
  schoolsWithScores: number;
  schools: School[];
}

export default function EqaoStatRow({
  avgScore,
  schoolsWithScores,
  schools,
}: EqaoStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get score type based on EQAO percentage
  function getScoreType(score: number): "great" | "good" | "okay" | "bad" {
    if (score >= 75) return "great";
    if (score >= 65) return "good";
    if (score >= 55) return "okay";
    return "bad";
  }

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
    bad: "Below Avg",
    neutral: "N/A",
  };

  // Sort schools by EQAO score (highest first), nulls at end
  const sortedSchools = [...schools].sort((a, b) => {
    if (a.eqaoScore === null && b.eqaoScore === null) return 0;
    if (a.eqaoScore === null) return 1;
    if (b.eqaoScore === null) return -1;
    return b.eqaoScore - a.eqaoScore;
  });

  const type = avgScore !== null ? getScoreType(avgScore) : "neutral";
  const barWidth = avgScore !== null ? Math.max(5, avgScore) : 5;
  const hasData = avgScore !== null && schoolsWithScores > 0;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => hasData && setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-3 px-5 py-4 ${hasData ? "hover:bg-gray-50 cursor-pointer" : ""} transition-colors`}
        disabled={!hasData}
      >
        <div className="flex items-center gap-2 w-28 shrink-0">
          <span className="text-xl">🎓</span>
          <span className="text-gray-900 font-medium text-sm">Test Scores</span>
        </div>
        <div className="flex-1 relative h-9 bg-gray-100 rounded-lg overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-lg ${colors[type]} transition-all duration-300`}
            style={{ width: `${barWidth}%` }}
          />
          <span className="absolute inset-0 flex items-center px-4 text-gray-800 font-semibold text-sm">
            {qualityLabels[type]}
          </span>
        </div>
        <span className="text-gray-900 font-bold w-28 text-right">
          {avgScore !== null ? `${avgScore}%` : "N/A"}
        </span>
        <div className="w-5 h-5">
          {hasData && (
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

      {isExpanded && hasData && (
        <div className="px-5 pb-4 bg-gray-50">
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
            Provincial Test Results ({schoolsWithScores} of {schools.length} schools)
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sortedSchools.map((school, index) => {
              const schoolType = school.eqaoScore !== null ? getScoreType(school.eqaoScore) : "neutral";
              const schoolBarWidth = school.eqaoScore !== null ? Math.max(5, school.eqaoScore) : 0;

              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-700 truncate" title={school.name}>
                      {school.name}
                    </div>
                    <div className="relative h-5 bg-gray-200 rounded overflow-hidden mt-1">
                      {school.eqaoScore !== null ? (
                        <>
                          <div
                            className={`absolute inset-y-0 left-0 rounded ${colors[schoolType]}`}
                            style={{ width: `${schoolBarWidth}%` }}
                          />
                          <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700">
                            {school.eqaoScore}%
                          </span>
                        </>
                      ) : (
                        <span className="absolute inset-0 flex items-center px-2 text-xs text-gray-400">
                          No data
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Shows % of students meeting provincial standards in Reading, Writing & Math.
              <br />
              <span className="text-gray-400">Source: Ontario EQAO Tests (2023-2024)</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
