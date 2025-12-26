"use client";

import { useState } from "react";
import Link from "next/link";
import { neighbourhoods } from "@/data/neighbourhoods";
import NeighbourhoodCard from "@/components/NeighbourhoodCard";
import CoverageMap from "@/components/CoverageMap";
import FilterBar from "@/components/FilterBar";

export default function BestForFamilies() {
  const [showCoverageMap, setShowCoverageMap] = useState(false);

  // Family score = safety + schools + parks + low density
  const sorted = [...neighbourhoods].sort((a, b) => {
    const familyScoreA = (a.categoryScores?.safety || 0) * 0.35 +
                         (a.categoryScores?.schools || 0) * 0.35 +
                         (a.details.parks / 25 * 100) * 0.15 +
                         (a.populationDensity < 2000 ? 80 : a.populationDensity < 4000 ? 60 : 40) * 0.15;
    const familyScoreB = (b.categoryScores?.safety || 0) * 0.35 +
                         (b.categoryScores?.schools || 0) * 0.35 +
                         (b.details.parks / 25 * 100) * 0.15 +
                         (b.populationDensity < 2000 ? 80 : b.populationDensity < 4000 ? 60 : 40) * 0.15;
    return familyScoreB - familyScoreA;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="px-4 py-2 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl">
            <span className="text-white font-bold text-lg">OttawaHoods</span>
          </Link>
          <button
            onClick={() => setShowCoverageMap(true)}
            className="flex px-3 py-1.5 sm:px-4 sm:py-2 bg-rose-500 text-white rounded-full text-xs sm:text-sm font-medium hover:bg-rose-600 transition items-center gap-1 sm:gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Coverage
          </button>
        </div>
      </header>

      <CoverageMap isOpen={showCoverageMap} onClose={() => setShowCoverageMap(false)} />

      <div className="max-w-7xl mx-auto px-4 pt-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Best Ottawa Neighbourhoods for Families
        </h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Ranked by safety, schools, parks, and family-friendly environment
        </p>
      </div>

      <FilterBar activeFilter="families" />

      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {sorted.map((neighbourhood, index) => (
            <NeighbourhoodCard
              key={neighbourhood.id}
              neighbourhood={neighbourhood}
              rank={index + 1}
              metric="safety"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
