"use client";

import { useState } from "react";
import { neighbourhoods } from "@/data/neighbourhoods";
import NeighbourhoodCard from "@/components/NeighbourhoodCard";
import CoverageMap from "@/components/CoverageMap";

export default function Home() {
  const [showCoverageMap, setShowCoverageMap] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="px-4 py-2 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl">
            <span className="text-white font-bold text-lg">OttawaHoods</span>
          </div>

          {/* Coverage Button */}
          <button
            onClick={() => setShowCoverageMap(true)}
            className="hidden md:flex px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition items-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            Coverage
          </button>
        </div>
      </header>

      {/* Coverage Map Modal */}
      <CoverageMap
        isOpen={showCoverageMap}
        onClose={() => setShowCoverageMap(false)}
      />

      {/* Popular Tag */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <span className="inline-block px-3 py-1 bg-white border border-gray-200 rounded-md text-sm text-gray-700 shadow-sm">
          Popular
        </span>
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...neighbourhoods]
            .sort((a, b) => b.overallScore - a.overallScore)
            .map((neighbourhood) => (
              <NeighbourhoodCard
                key={neighbourhood.id}
                neighbourhood={neighbourhood}
              />
            ))}
        </div>
      </main>
    </div>
  );
}
