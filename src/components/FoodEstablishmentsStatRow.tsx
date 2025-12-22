"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { NeighbourhoodBoundary, FoodEstablishmentData } from "@/data/neighbourhoods";

const FoodEstablishmentsMap = dynamic(
  () => import("./FoodEstablishmentsMap"),
  { ssr: false, loading: () => <div className="h-72 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface DataSource {
  name: string;
  url: string;
}

interface FoodEstablishmentsStatRowProps {
  // All food data (excluding grocery)
  foodData: FoodEstablishmentData[];
  totalCount: number;
  foodDensity: number | null;
  // By category
  restaurants: number | null;
  restaurantsData: FoodEstablishmentData[];
  cafes: number | null;
  cafesData: FoodEstablishmentData[];
  coffeeShops: number | null;
  coffeeShopsData: FoodEstablishmentData[];
  fastFood: number | null;
  fastFoodData: FoodEstablishmentData[];
  bakeries: number | null;
  bakeriesData: FoodEstablishmentData[];
  pubs: number | null;
  pubsData: FoodEstablishmentData[];
  bars: number | null;
  barsData: FoodEstablishmentData[];
  iceCreamShops: number | null;
  iceCreamShopsData: FoodEstablishmentData[];
  // Display props
  percent: number;
  type?: "great" | "good" | "okay" | "bad" | "neutral";
  source?: DataSource;
  boundaries?: NeighbourhoodBoundary[];
  neighbourhoodName?: string;
}

type CategoryKey = "all" | "restaurant" | "cafe" | "coffee_shop" | "fast_food" | "bakery" | "pub" | "bar" | "ice_cream";

const CATEGORY_COLORS: Record<string, string> = {
  "all": "#3b82f6",         // Blue
  "restaurant": "#ef4444",  // Red
  "cafe": "#f59e0b",        // Amber
  "coffee_shop": "#84cc16", // Lime
  "fast_food": "#f97316",   // Orange
  "bakery": "#ec4899",      // Pink
  "pub": "#8b5cf6",         // Purple
  "bar": "#6366f1",         // Indigo
  "ice_cream": "#06b6d4",   // Cyan
};

const CATEGORY_LABELS: Record<string, string> = {
  "all": "All",
  "restaurant": "Restaurants",
  "cafe": "Cafes",
  "coffee_shop": "Coffee Shops",
  "fast_food": "Fast Food",
  "bakery": "Bakeries",
  "pub": "Pubs",
  "bar": "Bars",
  "ice_cream": "Ice Cream",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  "all": "🍽️",
  "restaurant": "🍝",
  "cafe": "☕",
  "coffee_shop": "☕",
  "fast_food": "🍔",
  "bakery": "🥐",
  "pub": "🍺",
  "bar": "🍸",
  "ice_cream": "🍦",
};

export default function FoodEstablishmentsStatRow({
  foodData,
  totalCount,
  foodDensity,
  restaurants,
  restaurantsData,
  cafes,
  cafesData,
  coffeeShops,
  coffeeShopsData,
  fastFood,
  fastFoodData,
  bakeries,
  bakeriesData,
  pubs,
  pubsData,
  bars,
  barsData,
  iceCreamShops,
  iceCreamShopsData,
  percent,
  type = "good",
  source,
  boundaries = [],
  neighbourhoodName = "",
}: FoodEstablishmentsStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");

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
  const value = `${totalCount} places`;

  // Get establishments for selected category
  const getCategoryData = (category: CategoryKey): FoodEstablishmentData[] => {
    switch (category) {
      case "all": return foodData || [];
      case "restaurant": return restaurantsData || [];
      case "cafe": return cafesData || [];
      case "coffee_shop": return coffeeShopsData || [];
      case "fast_food": return fastFoodData || [];
      case "bakery": return bakeriesData || [];
      case "pub": return pubsData || [];
      case "bar": return barsData || [];
      case "ice_cream": return iceCreamShopsData || [];
      default: return [];
    }
  };

  const getCategoryCount = (category: CategoryKey): number => {
    switch (category) {
      case "all": return totalCount || 0;
      case "restaurant": return restaurants || 0;
      case "cafe": return cafes || 0;
      case "coffee_shop": return coffeeShops || 0;
      case "fast_food": return fastFood || 0;
      case "bakery": return bakeries || 0;
      case "pub": return pubs || 0;
      case "bar": return bars || 0;
      case "ice_cream": return iceCreamShops || 0;
      default: return 0;
    }
  };

  // Build category list with counts
  const categories = useMemo(() => {
    const cats: { key: CategoryKey; count: number }[] = [
      { key: "all", count: totalCount || 0 },
      { key: "restaurant", count: restaurants || 0 },
      { key: "cafe", count: cafes || 0 },
      { key: "coffee_shop", count: coffeeShops || 0 },
      { key: "fast_food", count: fastFood || 0 },
      { key: "bakery", count: bakeries || 0 },
      { key: "pub", count: pubs || 0 },
      { key: "bar", count: bars || 0 },
      { key: "ice_cream", count: iceCreamShops || 0 },
    ];
    return cats.filter(c => c.key === "all" || c.count > 0);
  }, [totalCount, restaurants, cafes, coffeeShops, fastFood, bakeries, pubs, bars, iceCreamShops]);

  const selectedData = getCategoryData(selectedCategory);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">🍽️</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Food & Dining</span>
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
              <div className="text-lg font-bold text-gray-900">{restaurants || 0}</div>
              <div className="text-xs text-gray-500">Restaurants</div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
              <div className="text-lg font-bold text-gray-900">{(cafes || 0) + (coffeeShops || 0)}</div>
              <div className="text-xs text-gray-500">Cafes & Coffee</div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
              <div className="text-lg font-bold text-gray-900">{fastFood || 0}</div>
              <div className="text-xs text-gray-500">Fast Food</div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
              <div className="text-lg font-bold text-gray-900">{(pubs || 0) + (bars || 0)}</div>
              <div className="text-xs text-gray-500">Bars & Pubs</div>
            </div>
          </div>

          {/* Density info */}
          {foodDensity !== null && (
            <div className="mb-4 text-xs text-gray-500">
              Density: <span className="font-medium">{foodDensity.toFixed(1)}</span> places per km²
            </div>
          )}

          {/* Category Filter */}
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map(({ key, count }) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition inline-flex items-center gap-1.5 ${
                  selectedCategory === key
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{CATEGORY_EMOJIS[key]}</span>
                <span>{CATEGORY_LABELS[key]}</span>
                <span className="opacity-70">({count})</span>
              </button>
            ))}
          </div>

          {/* Map */}
          {boundaries.length > 0 && selectedData.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
                {CATEGORY_LABELS[selectedCategory]} Map
              </div>
              <FoodEstablishmentsMap
                boundaries={boundaries}
                establishments={selectedData}
                neighbourhoodName={neighbourhoodName}
                selectedCategory={selectedCategory === "all" ? null : selectedCategory}
              />
            </div>
          )}

          {/* Establishment List */}
          {selectedData.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {CATEGORY_LABELS[selectedCategory]}
                </span>
                <span className="text-xs text-gray-500">
                  {selectedData.length} {selectedData.length === 1 ? "place" : "places"}
                </span>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {selectedData
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((establishment, index) => (
                    <div key={`list-${establishment.id}-${index}`} className="px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[establishment.category] || "#6b7280" }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm text-gray-700 truncate">{establishment.name}</div>
                          <div className="text-xs text-gray-400 truncate">{establishment.address}</div>
                        </div>
                      </div>
                      {selectedCategory === "all" && (
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2 capitalize">
                          {CATEGORY_LABELS[establishment.category] || establishment.category}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Category Legend */}
          {selectedCategory === "all" && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {Object.entries(CATEGORY_COLORS)
                .filter(([key]) => key !== "all" && getCategoryCount(key as CategoryKey) > 0)
                .map(([key, color]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span>{CATEGORY_LABELS[key]}</span>
                  </div>
                ))}
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
