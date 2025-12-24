"use client";

import { useState } from "react";

interface EquityStatRowProps {
  neiScore: number | null;
}

// NEI score interpretation
function getNeiLabel(score: number): string {
  if (score >= 80) return "High Equity";
  if (score >= 65) return "Good";
  if (score >= 50) return "Moderate";
  return "Priority Area";
}

function getNeiColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 65) return "bg-green-400";
  if (score >= 50) return "bg-yellow-400";
  return "bg-orange-400";
}

function getNeiTextColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 65) return "text-green-500";
  if (score >= 50) return "text-amber-600";
  return "text-red-500";
}

export default function EquityStatRow({ neiScore }: EquityStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no data
  if (neiScore === null) return null;

  const barWidth = Math.max(5, (neiScore / 100) * 100);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Main Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Label row with value on mobile */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">⚖️</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Equity</span>
            </div>
            {/* Value and chevron on mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className={`font-bold text-sm ${getNeiTextColor(neiScore)}`}>{neiScore}</span>
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
              className={`absolute inset-y-0 left-0 rounded-lg ${getNeiColor(neiScore)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getNeiLabel(neiScore)}
            </span>
          </div>
          {/* Value - hidden on mobile */}
          <div className="hidden sm:block">
            <span className={`font-bold w-28 text-right block ${getNeiTextColor(neiScore)}`}>
              {neiScore}
            </span>
          </div>
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

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 sm:px-5 pb-4 bg-gray-50">
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
            Neighbourhood Equity Index (NEI) 2019
          </div>

          {/* Score Display */}
          <div className="grid grid-cols-2 gap-3 text-xs mb-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-gray-500 mb-1">NEI Score</div>
              <div className={`font-bold text-2xl ${getNeiTextColor(neiScore)}`}>{neiScore}</div>
              <div className="text-xs text-gray-400 mt-1">{getNeiLabel(neiScore)}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-gray-500 mb-1">Score Range</div>
              <div className="font-bold text-gray-900 text-lg">0 - 100</div>
              <div className="text-xs text-gray-400 mt-1">Higher = Better</div>
            </div>
          </div>

          {/* Score Scale */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">Score Interpretation</div>
            <div className="grid grid-cols-4 gap-1 text-xs">
              <div className={`p-2 rounded text-center ${neiScore >= 80 ? 'ring-2 ring-green-500' : ''}`}>
                <div className="h-2 bg-green-500 rounded mb-1"></div>
                <div className="font-medium">80-100</div>
                <div className="text-gray-400 text-[10px]">High Equity</div>
              </div>
              <div className={`p-2 rounded text-center ${neiScore >= 65 && neiScore < 80 ? 'ring-2 ring-green-400' : ''}`}>
                <div className="h-2 bg-green-400 rounded mb-1"></div>
                <div className="font-medium">65-79</div>
                <div className="text-gray-400 text-[10px]">Good</div>
              </div>
              <div className={`p-2 rounded text-center ${neiScore >= 50 && neiScore < 65 ? 'ring-2 ring-yellow-400' : ''}`}>
                <div className="h-2 bg-yellow-400 rounded mb-1"></div>
                <div className="font-medium">50-64</div>
                <div className="text-gray-400 text-[10px]">Moderate</div>
              </div>
              <div className={`p-2 rounded text-center ${neiScore < 50 ? 'ring-2 ring-orange-400' : ''}`}>
                <div className="h-2 bg-orange-400 rounded mb-1"></div>
                <div className="font-medium">&lt;50</div>
                <div className="text-gray-400 text-[10px]">Priority</div>
              </div>
            </div>
          </div>

          {/* What it measures */}
          <div className="mb-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">What NEI Measures</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="bg-white rounded p-2 border border-gray-200 text-center">
                <div className="text-base mb-1">💰</div>
                <div className="font-medium text-gray-700">Economy</div>
                <div className="text-[10px] text-gray-400">Income, employment</div>
              </div>
              <div className="bg-white rounded p-2 border border-gray-200 text-center">
                <div className="text-base mb-1">📚</div>
                <div className="font-medium text-gray-700">Social Dev</div>
                <div className="text-[10px] text-gray-400">Education, children</div>
              </div>
              <div className="bg-white rounded p-2 border border-gray-200 text-center">
                <div className="text-base mb-1">🏠</div>
                <div className="font-medium text-gray-700">Environment</div>
                <div className="text-[10px] text-gray-400">Housing, transit</div>
              </div>
              <div className="bg-white rounded p-2 border border-gray-200 text-center">
                <div className="text-base mb-1">🏥</div>
                <div className="font-medium text-gray-700">Health</div>
                <div className="text-[10px] text-gray-400">Outcomes, access</div>
              </div>
              <div className="bg-white rounded p-2 border border-gray-200 text-center">
                <div className="text-base mb-1">🤝</div>
                <div className="font-medium text-gray-700">Community</div>
                <div className="text-[10px] text-gray-400">Belonging, safety</div>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
            <p className="mb-2">
              The <strong>Neighbourhood Equity Index (NEI)</strong> is based on the WHO's Urban HEART framework.
              It measures 28 indicators across 5 domains that affect health and wellbeing.
            </p>
            <p>
              A lower score indicates the neighbourhood faces challenges across multiple dimensions - not just income,
              but also education, health outcomes, transit access, and community cohesion. These areas are prioritized
              for targeted investments and services.
            </p>
          </div>

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <a
              href="https://neighbourhoodequity.ca/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Source: Ottawa NEI 2019 (United Way, City of Ottawa, SPCO)</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
