"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LibraryData, NeighbourhoodBoundary } from "@/data/neighbourhoods";

const LibrariesMap = dynamic(
  () => import("./LibrariesMap"),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" /> }
);

interface LibrariesStatRowProps {
  count: number;
  librariesData: LibraryData[];
  boundaries: NeighbourhoodBoundary[];
  neighbourhoodName: string;
  nearestLibrary?: string | null;
  distanceToNearestLibrary?: number | null;
}

function getLibrariesColor(count: number): string {
  if (count === 0) return "bg-gray-300";
  if (count >= 2) return "bg-green-500";
  if (count >= 1) return "bg-green-400";
  return "bg-yellow-400";
}

function getLibrariesLabel(count: number): string {
  if (count === 0) return "None";
  if (count >= 2) return "Well Served";
  if (count >= 1) return "Good";
  return "Limited";
}

export default function LibrariesStatRow({
  count,
  librariesData,
  boundaries,
  neighbourhoodName,
  nearestLibrary,
  distanceToNearestLibrary,
}: LibrariesStatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const barWidth = Math.max(10, Math.min((count / 3) * 100, 100));
  const hasLibraries = count > 0;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-28 sm:shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">📚</span>
              <span className="text-gray-900 font-medium text-sm sm:text-base">Libraries</span>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-gray-900 font-bold text-sm">
                {count} {count === 1 ? 'library' : 'libraries'}
              </span>
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
              className={`absolute inset-y-0 left-0 rounded-lg ${getLibrariesColor(count)} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 sm:px-4 text-gray-800 font-semibold text-xs sm:text-sm">
              {getLibrariesLabel(count)}
            </span>
          </div>
          <span className="hidden sm:block text-gray-900 font-bold w-28 text-right">
            {count} {count === 1 ? 'library' : 'libraries'}
          </span>
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
          {hasLibraries ? (
            <>
              {/* Map */}
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
                  Library Locations
                </div>
                <LibrariesMap
                  libraries={librariesData}
                  boundaries={boundaries}
                  neighbourhoodName={neighbourhoodName}
                />
              </div>

              {/* Library Cards */}
              <div className="space-y-3">
                {librariesData.map((library, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">📚</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{library.name}</div>
                        <div className="text-sm text-gray-600 mt-0.5">{library.address}</div>
                        {library.postalCode && (
                          <div className="text-xs text-gray-500 mt-0.5">{library.postalCode}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* OPL Info */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">
                  Ottawa Public Library (OPL) offers free library cards to all Ottawa residents with access to books, e-books, movies, music, and programs.
                </div>
                <a
                  href="https://biblioottawalibrary.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  Visit Ottawa Public Library
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </>
          ) : (
            <div className="py-4">
              {nearestLibrary && distanceToNearestLibrary ? (
                <>
                  <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
                    Nearest Library
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">📚</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{nearestLibrary}</div>
                        <div className="text-sm text-gray-600 mt-0.5">
                          {distanceToNearestLibrary} km from neighbourhood centre
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          No libraries within neighbourhood boundaries
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">
                      Ottawa Public Library (OPL) offers free library cards to all Ottawa residents with access to books, e-books, movies, music, and programs.
                    </div>
                    <a
                      href="https://biblioottawalibrary.ca"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Visit Ottawa Public Library
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">📚</div>
                  <div className="text-gray-600 font-medium">No libraries in this neighbourhood</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Visit biblioottawalibrary.ca to find the nearest branch
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Source */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Source:</span>
              <a
                href="https://open.ottawa.ca/datasets/ottawa-public-library-locations-2024"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
              >
                City of Ottawa Open Data
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
