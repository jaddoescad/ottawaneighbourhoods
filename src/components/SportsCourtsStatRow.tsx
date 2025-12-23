"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { NeighbourhoodBoundary, SportsCourtData } from "@/data/neighbourhoods";

const SportsCourtsMap = dynamic(
  () => import("./SportsCourtsMap"),
  { ssr: false, loading: () => <div className="h-72 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface DataSource {
  name: string;
  url: string;
}

interface SportsCourtsStatRowProps {
  totalCount: number | null;
  courtsData: SportsCourtData[];
  basketballCourts: number | null;
  tennisCourts: number | null;
  volleyballCourts: number | null;
  pickleballCourts: number | null;
  ballDiamonds: number | null;
  sportsFields: number | null;
  soccerFields: number | null;
  footballFields: number | null;
  source?: DataSource;
  boundaries?: NeighbourhoodBoundary[];
  neighbourhoodName?: string;
}

const courtTypeLabels: Record<string, string> = {
  all: "All Courts & Fields",
  "Basketball Court": "Basketball Courts",
  "Tennis Court": "Tennis Courts",
  "Volleyball Court": "Volleyball Courts",
  "Pickleball Court": "Pickleball Courts",
  "Ball Diamond": "Ball Diamonds",
  "Sports Field": "Sports Fields",
};

const courtTypeIcons: Record<string, string> = {
  "Basketball Court": "🏀",
  "Tennis Court": "🎾",
  "Volleyball Court": "🏐",
  "Pickleball Court": "🏓",
  "Ball Diamond": "⚾",
  "Sports Field": "⚽",
};

export function getCourtColor(courtType: string): string {
  const colors: Record<string, string> = {
    "Basketball Court": "#f97316", // orange
    "Tennis Court": "#22c55e", // green
    "Volleyball Court": "#eab308", // yellow
    "Pickleball Court": "#06b6d4", // cyan
    "Ball Diamond": "#ef4444", // red
    "Sports Field": "#10b981", // emerald
  };
  return colors[courtType] || "#6b7280";
}

export default function SportsCourtsStatRow({
  totalCount,
  courtsData,
  basketballCourts,
  tennisCourts,
  volleyballCourts,
  pickleballCourts,
  ballDiamonds,
  sportsFields,
  soccerFields,
  footballFields,
  source,
  boundaries = [],
  neighbourhoodName = "",
}: SportsCourtsStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");

  // Get court type counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: courtsData.length };
    for (const court of courtsData) {
      const type = court.courtType;
      counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  }, [courtsData]);

  // Get active types (those with courts)
  const activeTypes = useMemo(() => {
    return ["all", ...Object.keys(typeCounts).filter(t => t !== "all" && typeCounts[t] > 0)];
  }, [typeCounts]);

  // Filter courts based on selection
  const filteredCourts = useMemo(() => {
    if (selectedType === "all") return courtsData;
    return courtsData.filter(c => c.courtType === selectedType);
  }, [selectedType, courtsData]);

  // Determine score type based on count
  const getScoreType = (count: number): "great" | "good" | "okay" | "bad" | "neutral" => {
    if (count >= 20) return "great";
    if (count >= 10) return "good";
    if (count >= 5) return "okay";
    if (count >= 1) return "bad";
    return "neutral";
  };

  const count = totalCount || 0;
  const type = getScoreType(count);
  const percent = Math.min((count / 30) * 100, 100);

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
    bad: "Limited",
    neutral: "N/A",
  };

  const barWidth = Math.max(5, Math.min(percent, 100));
  const value = `${count} courts/fields`;

  // Quick summary
  const summaryParts: string[] = [];
  if (basketballCourts && basketballCourts > 0) summaryParts.push(`${basketballCourts} basketball`);
  if (tennisCourts && tennisCourts > 0) summaryParts.push(`${tennisCourts} tennis`);
  if (soccerFields && soccerFields > 0) summaryParts.push(`${soccerFields} soccer`);
  if (ballDiamonds && ballDiamonds > 0) summaryParts.push(`${ballDiamonds} ball diamond${ballDiamonds > 1 ? 's' : ''}`);
  if (volleyballCourts && volleyballCourts > 0) summaryParts.push(`${volleyballCourts} volleyball`);
  if (pickleballCourts && pickleballCourts > 0) summaryParts.push(`${pickleballCourts} pickleball`);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">⚽</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Sports</span>
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
          {/* Summary */}
          {summaryParts.length > 0 && (
            <div className="mb-4 text-xs text-gray-500">
              Includes: <span className="font-medium">{summaryParts.join(', ')}</span>
            </div>
          )}

          {/* Type filters */}
          {activeTypes.length > 2 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {activeTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedType === t
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {courtTypeLabels[t] || t} ({typeCounts[t]})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type summary cards */}
          {activeTypes.length > 2 && selectedType === "all" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {activeTypes
                .filter(t => t !== "all")
                .map((t) => (
                  <div
                    key={t}
                    className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-gray-300 transition-colors"
                    onClick={() => setSelectedType(t)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{courtTypeIcons[t] || "🏟️"}</span>
                      <span className="text-xs font-medium text-gray-700 truncate">
                        {courtTypeLabels[t] || t}
                      </span>
                    </div>
                    <div className="mt-1 text-lg font-bold text-gray-900">{typeCounts[t]}</div>
                  </div>
                ))}
            </div>
          )}

          {/* Map */}
          {boundaries.length > 0 && filteredCourts.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
                {selectedType === "all" ? "Sports Courts & Fields" : courtTypeLabels[selectedType]} Map
              </div>
              <SportsCourtsMap
                boundaries={boundaries}
                courts={filteredCourts}
                neighbourhoodName={neighbourhoodName}
              />
              {/* Map Legend */}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCourtColor("Basketball Court") }} />
                  <span>Basketball</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCourtColor("Tennis Court") }} />
                  <span>Tennis</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCourtColor("Sports Field") }} />
                  <span>Sports Field</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCourtColor("Ball Diamond") }} />
                  <span>Ball Diamond</span>
                </div>
              </div>
            </div>
          )}

          {/* Courts List */}
          {filteredCourts.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {selectedType === "all" ? "All Sports Courts & Fields" : courtTypeLabels[selectedType]}
                </span>
                <span className="text-xs text-gray-500">
                  {filteredCourts.length} {filteredCourts.length === 1 ? "facility" : "facilities"}
                </span>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {filteredCourts
                  .sort((a, b) => (a.parkName || "").localeCompare(b.parkName || ""))
                  .map((court, index) => (
                    <div key={`court-${court.parkName}-${court.courtType}-${index}`} className="px-3 py-2 flex items-start gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                        style={{ backgroundColor: getCourtColor(court.courtType) }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-gray-700">{court.parkName || court.name || "Sports Facility"}</div>
                        <div className="text-xs text-gray-400 flex flex-wrap gap-x-2">
                          <span>{court.courtType}</span>
                          {court.sportType && court.sportType !== court.courtType.toLowerCase() && (
                            <span>• {court.sportType}</span>
                          )}
                          {court.fieldSize && court.fieldSize !== "unknown" && (
                            <span>• {court.fieldSize}</span>
                          )}
                          {court.lights && court.lights.toLowerCase().includes("yes") && (
                            <span>• Lights</span>
                          )}
                        </div>
                        {court.address && (
                          <div className="text-xs text-gray-400">{court.address}</div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* No courts message */}
          {filteredCourts.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-sm">
              No sports courts or fields in this neighbourhood
            </div>
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
