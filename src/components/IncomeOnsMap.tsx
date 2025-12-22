"use client";

import { useEffect, useState, useMemo } from "react";
import { NeighbourhoodBoundary } from "@/data/neighbourhoods";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Polygon = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polygon),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  { ssr: false }
);

interface IncomeOnsMapProps {
  boundaries: NeighbourhoodBoundary[];
  neighbourhoodName: string;
}

// Color scale for income - greens (higher income = darker green)
const getIncomeColor = (income: number, maxIncome: number): string => {
  if (maxIncome === 0 || income === 0) return "#e0e0e0";
  const ratio = income / maxIncome;

  // Green gradient from light to dark
  if (ratio < 0.6) return "#fee5d9";  // Light orange/peach for lower
  if (ratio < 0.75) return "#fcbba1"; // Light orange
  if (ratio < 0.85) return "#a1d99b"; // Light green
  if (ratio < 0.95) return "#41ab5d"; // Medium green
  return "#006d2c"; // Dark green for highest
};

// Get text color for badge based on income level
const getIncomeBadgeColor = (income: number, maxIncome: number): string => {
  if (maxIncome === 0 || income === 0) return "bg-gray-100 text-gray-600";
  const ratio = income / maxIncome;

  if (ratio >= 0.95) return "bg-green-100 text-green-800";
  if (ratio >= 0.85) return "bg-green-50 text-green-700";
  if (ratio >= 0.75) return "bg-yellow-50 text-yellow-700";
  return "bg-orange-50 text-orange-700";
};

export default function IncomeOnsMap({ boundaries, neighbourhoodName }: IncomeOnsMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate center, max income, and weighted average
  const { center, maxIncome, totalHouseholds, weightedAvgIncome } = useMemo(() => {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    let maxInc = 0;
    let totalHH = 0;
    let weightedSum = 0;

    for (const boundary of boundaries) {
      const income = boundary.medianIncome || 0;
      const households = boundary.households || 0;

      totalHH += households;
      weightedSum += income * households;

      if (income > maxInc) {
        maxInc = income;
      }

      if (boundary.rings && boundary.rings[0]) {
        for (const coord of boundary.rings[0]) {
          const [lng, lat] = coord;
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        }
      }
    }

    return {
      center: [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [number, number],
      maxIncome: maxInc,
      totalHouseholds: totalHH,
      weightedAvgIncome: totalHH > 0 ? Math.round(weightedSum / totalHH) : 0,
    };
  }, [boundaries]);

  // Filter to only zones with income data
  const zonesWithIncome = boundaries.filter(b => b.medianIncome > 0);

  if (!mounted) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Map */}
      <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {boundaries.map((boundary, index) => {
            const income = boundary.medianIncome || 0;
            const color = getIncomeColor(income, maxIncome);
            const positions = boundary.rings.map((ring: number[][]) =>
              ring.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
            );

            return (
              <Polygon
                key={`${boundary.onsId}-${index}`}
                positions={positions}
                pathOptions={{
                  color: "#166534",
                  weight: 2,
                  fillColor: color,
                  fillOpacity: 0.7,
                }}
              >
                <Tooltip sticky>
                  <div className="text-sm">
                    <div className="font-semibold">{boundary.name}</div>
                    <div className="text-gray-600">
                      Income: <span className="font-medium">${income.toLocaleString()}</span>
                    </div>
                    {boundary.households > 0 && (
                      <div className="text-gray-600">
                        Households: <span className="font-medium">{boundary.households.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      ONS ID: {boundary.onsId}
                    </div>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>

      {/* ONS Zone List - sorted by income */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Income by Zone ({zonesWithIncome.length})
          </span>
        </div>
        <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {zonesWithIncome
            .sort((a, b) => (b.medianIncome || 0) - (a.medianIncome || 0))
            .map((boundary, index) => (
              <div key={`${boundary.onsId}-${index}`} className="px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: getIncomeColor(boundary.medianIncome || 0, maxIncome) }}
                  />
                  <span className="text-sm text-gray-700 truncate">{boundary.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getIncomeBadgeColor(boundary.medianIncome || 0, maxIncome)}`}>
                    ${(boundary.medianIncome || 0).toLocaleString()}
                  </span>
                  {boundary.households > 0 && (
                    <span className="text-xs text-gray-400">
                      {boundary.households.toLocaleString()} hh
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Weighted Average */}
        <div className="px-3 py-2 border-t border-gray-200 bg-green-50 flex items-center justify-between">
          <span className="text-sm font-medium text-green-800">
            Weighted Median
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-green-900">
              ${weightedAvgIncome.toLocaleString()}
            </span>
            <span className="text-xs text-green-700">
              ({totalHouseholds.toLocaleString()} households)
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>Income level:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#fee5d9" }} />
          <span>Lower</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#a1d99b" }} />
          <span>Average</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#006d2c" }} />
          <span>Higher</span>
        </div>
      </div>
    </div>
  );
}
