"use client";

import { useState } from "react";

interface TransitInfoRowProps {
  commuteToDowntown: number; // minutes by car
  commuteByTransit: number; // minutes by transit
  nearestOTrainStation?: string | null;
  nearestOTrainLine?: string | null;
  distanceToOTrain?: number | null;
  nearestTransitwayStation?: string | null;
  distanceToTransitway?: number | null;
}

function getCommuteColor(minutes: number): string {
  if (minutes <= 15) return "bg-green-500";
  if (minutes <= 25) return "bg-green-400";
  if (minutes <= 40) return "bg-yellow-400";
  if (minutes <= 60) return "bg-orange-500";
  return "bg-red-500";
}

function getCommuteLabel(minutes: number): string {
  if (minutes <= 15) return "Quick";
  if (minutes <= 25) return "Short";
  if (minutes <= 40) return "Moderate";
  if (minutes <= 60) return "Long";
  return "Very Long";
}

function getDistanceLabel(distance: number | null): string {
  if (distance === null) return "N/A";
  if (distance < 1) return `${Math.round(distance * 1000)}m`;
  return `${distance.toFixed(1)} km`;
}

function getDistanceColor(distance: number | null): string {
  if (distance === null) return "text-gray-400";
  if (distance < 1) return "text-green-600";
  if (distance < 3) return "text-green-500";
  if (distance < 5) return "text-yellow-600";
  if (distance < 10) return "text-orange-500";
  return "text-red-500";
}

function getCommuteTextColor(minutes: number): string {
  if (minutes <= 15) return "text-green-600";
  if (minutes <= 25) return "text-green-500";
  if (minutes <= 40) return "text-yellow-600";
  if (minutes <= 60) return "text-orange-500";
  return "text-red-500";
}

export default function TransitInfoRow({
  commuteToDowntown,
  commuteByTransit,
  nearestOTrainStation,
  nearestOTrainLine,
  distanceToOTrain,
  nearestTransitwayStation,
  distanceToTransitway,
}: TransitInfoRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (commuteToDowntown === 0 && commuteByTransit === 0) {
    return null;
  }

  const hasOTrain = nearestOTrainStation !== null && nearestOTrainStation !== undefined;
  const hasTransitway = nearestTransitwayStation !== null && nearestTransitwayStation !== undefined;
  const hasDetails = hasOTrain || hasTransitway;

  // Max commute for bar scaling (90 min)
  const maxCommute = 90;
  const carBarWidth = Math.max(5, Math.min((commuteToDowntown / maxCommute) * 100, 100));
  const transitBarWidth = Math.max(5, Math.min((commuteByTransit / maxCommute) * 100, 100));

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        className={`w-full px-3 sm:px-5 py-3 sm:py-4 ${hasDetails ? "hover:bg-gray-50 cursor-pointer" : ""} transition-colors`}
        disabled={!hasDetails}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Label */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">🚗</span>
              <span className="text-gray-900 font-medium text-sm">To Downtown</span>
            </div>
            {/* Mobile chevron */}
            {hasDetails && (
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform sm:hidden ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>

          {/* Bars */}
          <div className="w-full sm:flex-1 space-y-1">
            {/* By Car */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16 sm:w-20">By Car</span>
              <div className="flex-1 relative h-4 sm:h-5 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-lg ${getCommuteColor(commuteToDowntown)}`}
                  style={{ width: `${carBarWidth}%` }}
                />
                <span className="absolute inset-0 flex items-center px-2 text-xs font-semibold text-gray-800">
                  {getCommuteLabel(commuteToDowntown)}
                </span>
              </div>
              <span className="text-xs font-bold text-gray-900 w-14 text-right sm:hidden">
                {commuteToDowntown} min
              </span>
            </div>

            {/* By Transit */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16 sm:w-20">By Transit</span>
              <div className="flex-1 relative h-4 sm:h-5 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-lg ${getCommuteColor(commuteByTransit)}`}
                  style={{ width: `${transitBarWidth}%` }}
                />
                <span className="absolute inset-0 flex items-center px-2 text-xs font-semibold text-gray-800">
                  {getCommuteLabel(commuteByTransit)}
                </span>
              </div>
              <span className="text-xs font-bold text-gray-900 w-14 text-right sm:hidden">
                {commuteByTransit} min
              </span>
            </div>
          </div>

          {/* Values - outside bar container to match other rows */}
          <div className="hidden sm:block text-right w-28 space-y-1">
            <div className="text-xs font-bold text-gray-900 h-5 flex items-center justify-end">
              {commuteToDowntown} min
            </div>
            <div className="text-xs font-bold text-gray-900 h-5 flex items-center justify-end">
              {commuteByTransit} min
            </div>
          </div>

          {/* Desktop chevron */}
          {hasDetails && (
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
          )}
        </div>
      </button>

      {/* Expanded View */}
      {isExpanded && hasDetails && (
        <div className="px-3 sm:px-5 pb-4 bg-gray-50">
          <div className="space-y-3">
            {/* O-Train Section */}
            {hasOTrain && (
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm5.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6h-5V6h5v5z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Nearest O-Train Station</h4>
                    <p className="text-xs text-gray-500">{nearestOTrainLine || "O-Train"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">{nearestOTrainStation}</span>
                  <span className={`font-bold ${getDistanceColor(distanceToOTrain ?? null)}`}>
                    {getDistanceLabel(distanceToOTrain ?? null)}
                  </span>
                </div>
              </div>
            )}

            {/* Transitway Section */}
            {hasTransitway && (
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v8zm3-6h10v4H7v-4zm-5 7c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1H2v1zm18-1v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h-3z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Nearest Transitway Station</h4>
                    <p className="text-xs text-gray-500">Bus Rapid Transit</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">{nearestTransitwayStation}</span>
                  <span className={`font-bold ${getDistanceColor(distanceToTransitway ?? null)}`}>
                    {getDistanceLabel(distanceToTransitway ?? null)}
                  </span>
                </div>
              </div>
            )}

            {/* Commute Comparison */}
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <h4 className="font-medium text-gray-900 mb-3">Commute Comparison</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-1">
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">By Car</p>
                  <p className={`text-lg font-bold ${getCommuteTextColor(commuteToDowntown)}`}>
                    {commuteToDowntown} min
                  </p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-1">
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm5.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6h-5V6h5v5z"/>
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">By Transit</p>
                  <p className={`text-lg font-bold ${getCommuteTextColor(commuteByTransit)}`}>
                    {commuteByTransit} min
                  </p>
                </div>
              </div>
              {commuteByTransit > commuteToDowntown && (
                <p className="text-center text-sm mt-2 text-gray-500">
                  Transit is {Math.round((commuteByTransit / commuteToDowntown - 1) * 100)}% slower than driving
                </p>
              )}
            </div>

            {/* Source */}
            <div className="text-center pt-2 border-t border-gray-200">
              <a
                href="https://open.ottawa.ca/search?tags=o-train"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Source: City of Ottawa Open Data</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
