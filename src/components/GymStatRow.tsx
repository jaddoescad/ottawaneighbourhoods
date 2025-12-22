"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { NeighbourhoodBoundary, GymData } from "@/data/neighbourhoods";

const GymMap = dynamic(
  () => import("./GymMap"),
  { ssr: false, loading: () => <div className="h-72 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface DataSource {
  name: string;
  url: string;
}

interface GymStatRowProps {
  gyms: number | null;
  gymDensity: number | null;
  gymsData: GymData[];
  percent: number;
  type?: "great" | "good" | "okay" | "bad" | "neutral";
  source?: DataSource;
  boundaries?: NeighbourhoodBoundary[];
  neighbourhoodName?: string;
}

// Categorize gyms by type
function categorizeGym(gym: GymData): string {
  const sport = gym.sport?.toLowerCase() || "";
  const name = gym.name?.toLowerCase() || "";
  const brand = gym.brand?.toLowerCase() || "";

  if (sport.includes("yoga") || name.includes("yoga") || name.includes("pilates")) return "yoga";
  if (sport.includes("martial") || sport.includes("kickbox") || name.includes("martial") ||
      name.includes("boxing") || name.includes("taekwondo") || name.includes("karate") ||
      name.includes("jiu") || name.includes("mma")) return "martial_arts";
  if (sport.includes("crossfit") || name.includes("crossfit")) return "crossfit";
  if (brand.includes("anytime") || brand.includes("goodlife") || brand.includes("fit4less") ||
      brand.includes("planet") || brand.includes("la fitness")) return "chain";
  return "general";
}

const categoryLabels: Record<string, string> = {
  all: "All",
  general: "General Fitness",
  chain: "Chain Gyms",
  yoga: "Yoga/Pilates",
  martial_arts: "Martial Arts",
  crossfit: "CrossFit",
};

const categoryColors: Record<string, string> = {
  general: "bg-emerald-500",
  chain: "bg-blue-500",
  yoga: "bg-purple-500",
  martial_arts: "bg-red-500",
  crossfit: "bg-orange-500",
};

export default function GymStatRow({
  gyms,
  gymDensity,
  gymsData,
  percent,
  type = "good",
  source,
  boundaries = [],
  neighbourhoodName = "",
}: GymStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

  // Categorize all gyms
  const categorizedGyms = useMemo(() => {
    const categories: Record<string, GymData[]> = {
      general: [],
      chain: [],
      yoga: [],
      martial_arts: [],
      crossfit: [],
    };

    for (const gym of gymsData) {
      const category = categorizeGym(gym);
      categories[category].push(gym);
    }

    return categories;
  }, [gymsData]);

  // Get counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: gymsData.length };
    for (const [cat, gyms] of Object.entries(categorizedGyms)) {
      counts[cat] = gyms.length;
    }
    return counts;
  }, [categorizedGyms, gymsData.length]);

  // Filter gyms based on selection
  const filteredGyms = useMemo(() => {
    if (selectedCategory === "all") return gymsData;
    return categorizedGyms[selectedCategory] || [];
  }, [selectedCategory, gymsData, categorizedGyms]);

  // Get active categories (those with gyms)
  const activeCategories = useMemo(() => {
    return ["all", ...Object.entries(categorizedGyms)
      .filter(([, gyms]) => gyms.length > 0)
      .map(([cat]) => cat)];
  }, [categorizedGyms]);

  const barWidth = Math.max(5, Math.min(percent, 100));
  const count = gyms || 0;
  const value = `${count} gyms`;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">💪</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Fitness</span>
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
          {/* Density info */}
          {gymDensity !== null && (
            <div className="mb-4 text-xs text-gray-500">
              Density: <span className="font-medium">{gymDensity.toFixed(2)}</span> gyms per km²
            </div>
          )}

          {/* Category filters */}
          {activeCategories.length > 2 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {activeCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory === cat
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {categoryLabels[cat]} ({categoryCounts[cat]})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category summary cards */}
          {activeCategories.length > 2 && selectedCategory === "all" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {Object.entries(categorizedGyms)
                .filter(([, gyms]) => gyms.length > 0)
                .map(([cat, catGyms]) => (
                  <div
                    key={cat}
                    className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:border-gray-300 transition-colors"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${categoryColors[cat]}`} />
                      <span className="text-xs font-medium text-gray-700">{categoryLabels[cat]}</span>
                    </div>
                    <div className="mt-1 text-lg font-bold text-gray-900">{catGyms.length}</div>
                  </div>
                ))}
            </div>
          )}

          {/* Map */}
          {boundaries.length > 0 && filteredGyms.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
                {selectedCategory === "all" ? "Gyms & Fitness Centers" : categoryLabels[selectedCategory]} Map
              </div>
              <GymMap
                boundaries={boundaries}
                gyms={filteredGyms}
                neighbourhoodName={neighbourhoodName}
              />
              {/* Map Legend */}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>General</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Chain</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span>Yoga</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Martial Arts</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span>CrossFit</span>
                </div>
              </div>
            </div>
          )}

          {/* Gym List */}
          {filteredGyms.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {selectedCategory === "all" ? "All Gyms & Fitness Centers" : categoryLabels[selectedCategory]}
                </span>
                <span className="text-xs text-gray-500">
                  {filteredGyms.length} {filteredGyms.length === 1 ? "gym" : "gyms"}
                </span>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {filteredGyms
                  .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                  .map((gym, index) => {
                    const category = categorizeGym(gym);
                    return (
                      <div key={`gym-${gym.osmId}-${index}`} className="px-3 py-2 flex items-center">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${categoryColors[category]}`} />
                          <div className="min-w-0">
                            <div className="text-sm text-gray-700 truncate">{gym.name || "Fitness Center"}</div>
                            <div className="text-xs text-gray-400 truncate">
                              {gym.brand && <span className="mr-2">{gym.brand}</span>}
                              {gym.sport && <span className="capitalize mr-2">{gym.sport.replace(/_/g, " ")}</span>}
                              {gym.address}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
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
