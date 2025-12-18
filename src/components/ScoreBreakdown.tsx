"use client";

import { useState } from "react";
import { CategoryScores, ScoreWeights } from "@/data/neighbourhoods";

interface ScoreBreakdownProps {
  overallScore: number;
  categoryScores: CategoryScores;
  scoreWeights: ScoreWeights;
}

const CATEGORY_INFO: Record<keyof CategoryScores, { label: string; emoji: string; description: string }> = {
  walkability: {
    label: "Walkability",
    emoji: "🚶",
    description: "Walk Score, Transit Score, Bike Score",
  },
  safety: {
    label: "Safety",
    emoji: "🛡️",
    description: "Crime rate per capita (lower is better)",
  },
  affordability: {
    label: "Affordability",
    emoji: "💰",
    description: "Average rent & home prices (lower is better)",
  },
  amenities: {
    label: "Amenities",
    emoji: "🏪",
    description: "Parks, schools, libraries, restaurants",
  },
  education: {
    label: "Education",
    emoji: "🎓",
    description: "Average EQAO test scores",
  },
  healthcare: {
    label: "Healthcare",
    emoji: "🏥",
    description: "Distance to nearest hospital (closer is better)",
  },
  income: {
    label: "Income",
    emoji: "📈",
    description: "Median household income",
  },
  familyFriendly: {
    label: "Family Friendly",
    emoji: "👨‍👩‍👧‍👦",
    description: "Percentage of children in population",
  },
};

function getScoreColor(score: number | null): string {
  if (score === null) return "bg-gray-400";
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreLabel(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 70) return "Excellent";
  if (score >= 50) return "Good";
  if (score >= 30) return "Fair";
  return "Low";
}

function getScoreTextColor(score: number | null): string {
  if (score === null) return "text-gray-500";
  if (score >= 70) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  if (score >= 30) return "text-orange-600";
  return "text-red-600";
}

export default function ScoreBreakdown({
  overallScore,
  categoryScores,
  scoreWeights,
}: ScoreBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const categories = Object.entries(categoryScores) as [keyof CategoryScores, number | null][];
  const sortedCategories = [...categories].sort((a, b) => {
    if (a[1] === null) return 1;
    if (b[1] === null) return -1;
    return b[1] - a[1];
  });

  return (
    <>
      {/* Clickable Score Badge */}
      <button
        onClick={() => setIsOpen(true)}
        className="group inline-flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-white/30 transition cursor-pointer"
      >
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${getScoreColor(overallScore)} flex items-center justify-center`}>
          <span className="text-white font-bold text-xs sm:text-sm">{overallScore}</span>
        </div>
        <div className="text-left">
          <span className="text-white font-semibold block text-xs sm:text-sm">Overall Score</span>
          <span className="text-white/60 text-[10px] sm:text-xs group-hover:text-white/80">Click to see breakdown</span>
        </div>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Score Breakdown</h2>
                <p className="text-gray-500 text-sm">How the overall score is calculated</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Overall Score */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full ${getScoreColor(overallScore)} flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-bold text-2xl">{overallScore}</span>
                </div>
                <div>
                  <p className={`text-lg font-semibold ${getScoreTextColor(overallScore)}`}>
                    {getScoreLabel(overallScore)}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Compared to other Ottawa neighbourhoods
                  </p>
                </div>
              </div>
            </div>

            {/* Category Scores */}
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Category Breakdown
              </h3>
              <div className="space-y-3">
                {sortedCategories.map(([key, score]) => {
                  const info = CATEGORY_INFO[key];
                  const weight = scoreWeights[key];
                  const weightPercent = Math.round(weight * 100);

                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{info.emoji}</span>
                          <span className="font-medium text-gray-900">{info.label}</span>
                          <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                            {weightPercent}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${getScoreTextColor(score)}`}>
                            {score !== null ? score : "N/A"}
                          </span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getScoreColor(score)}`}
                          style={{ width: score !== null ? `${score}%` : "0%" }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">{info.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Scores are percentile-based (0-100) comparing this neighbourhood to all others in Ottawa.
                Higher scores indicate better performance relative to other neighbourhoods.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
