"use client";

import { useState } from "react";
import Link from "next/link";

export const filters = [
  { label: "Top Rated", href: "/", icon: "⭐", id: "top-rated" },
  { label: "Safest", href: "/safest-neighbourhoods", icon: "🛡️", id: "safest" },
  { label: "Most Dangerous", href: "/dangerous-neighbourhoods", icon: "🚨", id: "dangerous" },
  { label: "Best Schools", href: "/best-schools", icon: "🎓", id: "schools" },
  { label: "Best Elementary Schools", href: "/best-elementary-schools", icon: "📚", id: "elementary-schools" },
  { label: "Best High Schools", href: "/best-high-schools", icon: "🏫", id: "high-schools" },
  { label: "Best Transit", href: "/best-transit", icon: "🚇", id: "transit" },
  { label: "Most Walkable", href: "/most-walkable", icon: "🚶", id: "walkable" },
  { label: "Best for Biking", href: "/best-for-biking", icon: "🚴", id: "biking" },
  { label: "Best Parks", href: "/best-parks", icon: "🌳", id: "parks" },
  { label: "Best Amenities", href: "/best-amenities", icon: "🏪", id: "amenities" },
  { label: "Closest to Hospitals", href: "/closest-hospitals", icon: "🏥", id: "hospitals" },
  { label: "Highest Density", href: "/highest-density", icon: "🏙️", id: "high-density" },
  { label: "Lowest Density", href: "/lowest-density", icon: "🏡", id: "low-density" },
  { label: "Best Tree Canopy", href: "/best-tree-canopy", icon: "🌲", id: "trees" },
  { label: "Best for Nature", href: "/best-for-nature", icon: "🦆", id: "nature" },
];

interface FilterBarProps {
  activeFilter: string;
}

export default function FilterBar({ activeFilter }: FilterBarProps) {
  const [showAll, setShowAll] = useState(false);

  // Show first 12 filters when collapsed, all when expanded
  const visibleFilters = showAll ? filters : filters.slice(0, 12);
  const hiddenCount = filters.length - 12;

  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      <div className="flex flex-wrap gap-2">
        {visibleFilters.map((filter) => (
          <Link
            key={filter.id}
            href={filter.href}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition ${
              filter.id === activeFilter
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
          </Link>
        ))}
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition bg-rose-500 text-white hover:bg-rose-600"
        >
          {showAll ? (
            <>
              <span>Show Less</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </>
          ) : (
            <>
              <span>+{hiddenCount} More</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
