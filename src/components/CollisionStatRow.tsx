"use client";

import { useState } from "react";

interface DataSource {
  name: string;
  url: string;
}

interface CollisionStatRowProps {
  total: number | null;
  fatal: number | null;
  injury: number | null;
  pedestrian: number | null;
  bicycle: number | null;
  population: number;
  areaKm2: number;
  source?: DataSource;
}

// Thresholds based on collisions per 1,000 residents (2022-2024)
// Low: < 5 per 1,000 (safe residential areas)
// Moderate: 5-15 per 1,000 (typical suburban/urban)
// High: > 15 per 1,000 (high traffic areas)
function getCollisionColor(perCapita: number): string {
  if (perCapita < 5) return "bg-green-500";
  if (perCapita < 15) return "bg-yellow-400";
  return "bg-red-500";
}

function getCollisionLabel(perCapita: number): string {
  if (perCapita < 5) return "Low";
  if (perCapita < 15) return "Moderate";
  return "High";
}

// For breakdown categories
function getCategoryColor(hasFatalOrInjury: boolean): string {
  if (hasFatalOrInjury) return "bg-red-400";
  return "bg-blue-400";
}

export default function CollisionStatRow({
  total,
  fatal,
  injury,
  pedestrian,
  bicycle,
  population,
  areaKm2,
  source,
}: CollisionStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // If no collision data available
  if (total === null || total === 0) {
    return (
      <div className="border-b border-gray-100 last:border-b-0">
        <div className="w-full px-3 sm:px-5 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:w-28 sm:shrink-0">
              <span className="text-lg sm:text-xl">🚗</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Traffic Safety</span>
            </div>
            <div className="w-full sm:flex-1 relative h-7 sm:h-9 bg-gray-100 rounded-lg overflow-hidden">
              <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-500 text-xs sm:text-sm">
                No collision data available
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate collisions per 1,000 residents
  const perCapita = population > 0 ? (total / population) * 1000 : 0;
  const perKm2 = areaKm2 > 0 ? total / areaKm2 : 0;

  // Bar width based on per capita (max ~30 per 1,000 for scaling)
  const barWidth = Math.max(5, Math.min((perCapita / 30) * 100, 100));

  // Build breakdown items
  const breakdownItems = [
    { label: "Fatal", value: fatal || 0, isSevere: true },
    { label: "Injury", value: injury || 0, isSevere: true },
    { label: "Involving Pedestrians", value: pedestrian || 0, isSevere: false },
    { label: "Involving Cyclists", value: bicycle || 0, isSevere: false },
  ];

  // Property damage only = total - fatal - injury
  const propertyDamage = total - (fatal || 0) - (injury || 0);
  if (propertyDamage > 0) {
    breakdownItems.push({ label: "Property Damage Only", value: propertyDamage, isSevere: false });
  }

  const maxBreakdown = Math.max(...breakdownItems.map(i => i.value), 1);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Main Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        {/* Mobile: stacked layout, Desktop: horizontal */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Label row with value on mobile */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">🚗</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Traffic Safety</span>
            </div>
            {/* Value and chevron on mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-gray-900 font-bold text-sm">{perCapita.toFixed(1)} per 1K</span>
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
              className={`absolute inset-y-0 left-0 rounded-lg ${getCollisionColor(perCapita)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getCollisionLabel(perCapita)}
            </span>
          </div>
          {/* Value with tooltip - hidden on mobile */}
          <div className="hidden sm:block relative group">
            <span className="text-gray-900 font-bold w-28 text-right block cursor-help">
              {perCapita.toFixed(1)} per 1K
            </span>
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              <div className="font-semibold mb-1">Collision Rate (2022-2024)</div>
              <div>{total.toLocaleString()} total collisions</div>
              <div>{population.toLocaleString()} residents</div>
              <div className="mt-1 pt-1 border-t border-gray-700">
                = {perCapita.toFixed(1)} collisions per 1,000 people
              </div>
              <div className="text-gray-400">({perKm2.toFixed(1)} per km²)</div>
              <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
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

      {/* Expanded Breakdown */}
      {isExpanded && (
        <div className="px-3 sm:px-5 pb-4 bg-gray-50">
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
            Collision Breakdown (2022-2024)
          </div>
          <div className="space-y-2">
            {breakdownItems.map((item) => {
              const itemBarWidth = Math.max(5, Math.min((item.value / maxBreakdown) * 100, 100));
              return (
                <div key={item.label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-gray-700 text-xs sm:text-sm sm:w-44 truncate" title={item.label}>
                      {item.label}
                    </span>
                    <span className="text-gray-600 text-xs sm:text-sm font-medium sm:hidden">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex-1 relative h-5 sm:h-6 bg-gray-200 rounded overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded ${item.isSevere ? "bg-red-400" : "bg-blue-400"} transition-all duration-300`}
                      style={{ width: `${itemBarWidth}%` }}
                    />
                  </div>
                  <span className="hidden sm:block text-gray-600 text-sm font-medium w-16 text-right">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Summary stats */}
          <div className="mt-4 pt-3 border-t border-gray-200 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="text-gray-500">Total Collisions</div>
              <div className="font-bold text-gray-900">{total.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="text-gray-500">Serious (Fatal + Injury)</div>
              <div className="font-bold text-red-600">{((fatal || 0) + (injury || 0)).toLocaleString()}</div>
            </div>
          </div>

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
