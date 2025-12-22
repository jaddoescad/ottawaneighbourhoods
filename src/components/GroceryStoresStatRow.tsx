"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { NeighbourhoodBoundary, FoodEstablishmentData } from "@/data/neighbourhoods";

const GroceryStoresMap = dynamic(
  () => import("./GroceryStoresMap"),
  { ssr: false, loading: () => <div className="h-72 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface DataSource {
  name: string;
  url: string;
}

interface GroceryStoresStatRowProps {
  groceryStores: number | null;
  groceryStoreDensity: number | null;
  groceryStoresData: FoodEstablishmentData[];
  percent: number;
  type?: "great" | "good" | "okay" | "bad" | "neutral";
  source?: DataSource;
  boundaries?: NeighbourhoodBoundary[];
  neighbourhoodName?: string;
}

export default function GroceryStoresStatRow({
  groceryStores,
  groceryStoreDensity,
  groceryStoresData,
  percent,
  type = "good",
  source,
  boundaries = [],
  neighbourhoodName = "",
}: GroceryStoresStatRowProps) {
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
  const count = groceryStores || 0;
  const value = `${count} stores`;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">🛒</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Grocery</span>
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
          {groceryStoreDensity !== null && (
            <div className="mb-4 text-xs text-gray-500">
              Density: <span className="font-medium">{groceryStoreDensity.toFixed(1)}</span> stores per km²
            </div>
          )}

          {/* Map */}
          {boundaries.length > 0 && groceryStoresData.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
                Grocery Stores Map
              </div>
              <GroceryStoresMap
                boundaries={boundaries}
                stores={groceryStoresData}
                neighbourhoodName={neighbourhoodName}
              />
            </div>
          )}

          {/* Store List */}
          {groceryStoresData.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  All Grocery Stores
                </span>
                <span className="text-xs text-gray-500">
                  {groceryStoresData.length} {groceryStoresData.length === 1 ? "store" : "stores"}
                </span>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {groceryStoresData
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((store, index) => (
                    <div key={`store-${store.id}-${index}`} className="px-3 py-2 flex items-center">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-green-500" />
                        <div className="min-w-0">
                          <div className="text-sm text-gray-700 truncate">{store.name}</div>
                          <div className="text-xs text-gray-400 truncate">{store.address}</div>
                        </div>
                      </div>
                    </div>
                  ))}
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
