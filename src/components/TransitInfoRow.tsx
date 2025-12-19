"use client";

import { useState } from "react";

interface TransitInfoRowProps {
  // O-Train data
  nearestOTrainStation: string | null;
  nearestOTrainLine: string | null;
  distanceToOTrain: number | null;
  // Transitway data
  nearestTransitwayStation: string | null;
  distanceToTransitway: number | null;
  // Commute times
  commuteToDowntown: number;
  commuteByTransit: number;
  // Transit score for context
  transitScore: number;
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

function getCommuteColor(minutes: number): string {
  if (minutes <= 15) return "text-green-600";
  if (minutes <= 30) return "text-green-500";
  if (minutes <= 45) return "text-yellow-600";
  if (minutes <= 60) return "text-orange-500";
  return "text-red-500";
}

function getCommuteDifferenceLabel(carTime: number, transitTime: number): { text: string; color: string } {
  if (transitTime === 0 || carTime === 0) {
    return { text: "", color: "" };
  }

  const diff = transitTime - carTime;
  const ratio = transitTime / carTime;

  if (diff <= 5) {
    return { text: "Similar to driving", color: "text-green-600" };
  } else if (ratio <= 1.5) {
    return { text: `+${diff} min vs car`, color: "text-yellow-600" };
  } else if (ratio <= 2) {
    return { text: `+${diff} min vs car`, color: "text-orange-500" };
  } else {
    return { text: `${ratio.toFixed(1)}x longer than car`, color: "text-red-500" };
  }
}

export default function TransitInfoRow({
  nearestOTrainStation,
  nearestOTrainLine,
  distanceToOTrain,
  nearestTransitwayStation,
  distanceToTransitway,
  commuteToDowntown,
  commuteByTransit,
  transitScore,
}: TransitInfoRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasOTrain = nearestOTrainStation !== null;
  const hasTransitway = nearestTransitwayStation !== null;
  const hasData = hasOTrain || hasTransitway || commuteByTransit > 0;

  if (!hasData) {
    return null;
  }

  const commuteDiff = getCommuteDifferenceLabel(commuteToDowntown, commuteByTransit);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Main Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* Label */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-32 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">🚇</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Rapid Transit</span>
            </div>
            {/* Mobile chevron */}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform sm:hidden ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Summary info */}
          <div className="flex-1 flex flex-wrap items-center gap-2 sm:gap-4">
            {hasOTrain && (
              <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-full">
                <span className="text-red-600 text-xs font-medium">O-Train</span>
                <span className={`text-xs font-bold ${getDistanceColor(distanceToOTrain)}`}>
                  {getDistanceLabel(distanceToOTrain)}
                </span>
              </div>
            )}
            {hasTransitway && (
              <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-full">
                <span className="text-blue-600 text-xs font-medium">Transitway</span>
                <span className={`text-xs font-bold ${getDistanceColor(distanceToTransitway)}`}>
                  {getDistanceLabel(distanceToTransitway)}
                </span>
              </div>
            )}
            {commuteByTransit > 0 && (
              <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full">
                <span className="text-gray-600 text-xs font-medium">Downtown</span>
                <span className={`text-xs font-bold ${getCommuteColor(commuteByTransit)}`}>
                  {commuteByTransit} min
                </span>
              </div>
            )}
          </div>

          {/* Desktop chevron */}
          <svg
            className={`hidden sm:block w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded View */}
      {isExpanded && (
        <div className="px-3 sm:px-5 pb-4 bg-gray-50">
          <div className="space-y-4">
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
                  <span className={`font-bold ${getDistanceColor(distanceToOTrain)}`}>
                    {getDistanceLabel(distanceToOTrain)}
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
                  <span className={`font-bold ${getDistanceColor(distanceToTransitway)}`}>
                    {getDistanceLabel(distanceToTransitway)}
                  </span>
                </div>
              </div>
            )}

            {/* Commute Comparison */}
            {commuteByTransit > 0 && commuteToDowntown > 0 && (
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <h4 className="font-medium text-gray-900 mb-3">Commute to Downtown</h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* By Car */}
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="flex justify-center mb-1">
                      <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">By Car</p>
                    <p className={`text-lg font-bold ${getCommuteColor(commuteToDowntown)}`}>
                      {commuteToDowntown} min
                    </p>
                  </div>
                  {/* By Transit */}
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="flex justify-center mb-1">
                      <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm5.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6h-5V6h5v5z"/>
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">By Transit</p>
                    <p className={`text-lg font-bold ${getCommuteColor(commuteByTransit)}`}>
                      {commuteByTransit} min
                    </p>
                  </div>
                </div>
                {commuteDiff.text && (
                  <p className={`text-center text-sm mt-2 ${commuteDiff.color}`}>
                    {commuteDiff.text}
                  </p>
                )}
              </div>
            )}

            {/* Sources */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs pt-2 border-t border-gray-200">
              <a
                href="https://open.ottawa.ca/search?tags=o-train"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>City of Ottawa Open Data</span>
              </a>
              <a
                href="https://www.walkscore.com/CA-ON/Ottawa"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>WalkScore.com</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
