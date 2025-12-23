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

interface GreenspaceOnsMapProps {
  boundaries: NeighbourhoodBoundary[];
  neighbourhoodName: string;
  metric: "treeCanopy" | "parkland";
}

// Ottawa targets/averages
const OTTAWA_TREE_TARGET = 40; // City target is 40%
const OTTAWA_TREE_AVG = 21; // Urban area average ~21%

// Color scale for tree canopy (green gradient)
const getTreeColor = (pct: number): string => {
  if (pct === 0) return "#e5e7eb"; // Gray for no data
  if (pct < 15) return "#fef3c7"; // Yellow - low canopy
  if (pct < 25) return "#bef264"; // Light green
  if (pct < 35) return "#4ade80"; // Green
  if (pct < 40) return "#22c55e"; // Medium green
  return "#15803d"; // Dark green - meets target
};

// Color scale for parkland (blue-green gradient)
const getParklandColor = (pct: number): string => {
  if (pct === 0) return "#e5e7eb"; // Gray for no data
  if (pct < 10) return "#e0f2fe"; // Very light blue
  if (pct < 20) return "#7dd3fc"; // Light blue
  if (pct < 30) return "#38bdf8"; // Medium blue
  if (pct < 40) return "#0ea5e9"; // Blue
  return "#0369a1"; // Dark blue
};

const getTreeLabel = (pct: number): string => {
  if (pct === 0) return "No data";
  if (pct < 15) return "Low";
  if (pct < 25) return "Below Avg";
  if (pct < 35) return "Average";
  if (pct < 40) return "Good";
  return "Meets Target";
};

const getParklandLabel = (pct: number): string => {
  if (pct === 0) return "No data";
  if (pct < 10) return "Low";
  if (pct < 20) return "Moderate";
  if (pct < 30) return "Good";
  return "High";
};

export default function GreenspaceOnsMap({
  boundaries,
  neighbourhoodName,
  metric
}: GreenspaceOnsMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isTree = metric === "treeCanopy";
  const metricLabel = isTree ? "Tree Canopy" : "Parkland";
  const getColor = isTree ? getTreeColor : getParklandColor;
  const getLabel = isTree ? getTreeLabel : getParklandLabel;

  // Calculate center and stats
  const { center, avgPct } = useMemo(() => {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    let totalPct = 0;
    let totalPop = 0;

    for (const boundary of boundaries) {
      const pct = isTree ? boundary.treeCanopy : boundary.parklandCoverage;
      const pop = boundary.population || 1; // Use 1 to avoid division by zero

      if (pct > 0) {
        totalPct += pct * pop;
        totalPop += pop;
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
      avgPct: totalPop > 0 ? totalPct / totalPop : 0,
    };
  }, [boundaries, isTree]);

  if (!mounted) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading map...</span>
      </div>
    );
  }

  const target = isTree ? OTTAWA_TREE_TARGET : 20; // 20% parkland as rough benchmark
  const comparison = avgPct < target
    ? { text: "below target", color: "text-amber-600" }
    : { text: "meets target", color: "text-green-600" };

  return (
    <div className="space-y-3">
      {/* Comparison to target */}
      <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
        <span className="text-gray-600">Neighbourhood avg: </span>
        <span className="font-semibold">{avgPct.toFixed(1)}%</span>
        {isTree && (
          <>
            <span className="text-gray-400 mx-1">•</span>
            <span className={comparison.color}>
              {Math.abs(avgPct - OTTAWA_TREE_TARGET).toFixed(1)}% {comparison.text} ({OTTAWA_TREE_TARGET}%)
            </span>
          </>
        )}
      </div>

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
            const pct = isTree ? boundary.treeCanopy : boundary.parklandCoverage;
            const color = getColor(pct || 0);
            const positions = boundary.rings.map((ring: number[][]) =>
              ring.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
            );

            return (
              <Polygon
                key={`${boundary.onsId}-${index}`}
                positions={positions}
                pathOptions={{
                  color: "#374151",
                  weight: 2,
                  fillColor: color,
                  fillOpacity: 0.7,
                }}
              >
                <Tooltip sticky>
                  <div className="text-sm">
                    <div className="font-semibold">{boundary.name}</div>
                    <div className="text-gray-600">
                      {metricLabel}: <span className="font-medium">{(pct || 0).toFixed(1)}%</span>
                    </div>
                    {isTree && (
                      <div className="text-xs text-gray-500 mt-1">
                        Target: 40%
                      </div>
                    )}
                    <div className="text-xs font-medium mt-1" style={{ color }}>
                      {getLabel(pct || 0)}
                    </div>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>

      {/* ONS Zone List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {metricLabel} by ONS Zone
          </span>
        </div>
        <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {boundaries
            .filter(b => (isTree ? b.treeCanopy : b.parklandCoverage) > 0)
            .sort((a, b) => {
              const aVal = isTree ? a.treeCanopy : a.parklandCoverage;
              const bVal = isTree ? b.treeCanopy : b.parklandCoverage;
              return (bVal || 0) - (aVal || 0);
            })
            .map((boundary, index) => {
              const pct = isTree ? boundary.treeCanopy : boundary.parklandCoverage;
              return (
                <div key={`${boundary.onsId}-${index}`} className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: getColor(pct || 0) }}
                    />
                    <span className="text-sm text-gray-700 truncate">{boundary.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-900">
                      {(pct || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Neighbourhood Average */}
        <div className="px-3 py-2 border-t border-gray-200 bg-green-50 flex items-center justify-between">
          <span className="text-sm font-medium text-green-800">
            Neighbourhood Average
          </span>
          <span className="text-sm font-bold text-green-900">
            {avgPct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Legend */}
      {isTree ? (
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span>Tree Canopy:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#fef3c7" }} />
            <span>&lt;15%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#bef264" }} />
            <span>15-25%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#4ade80" }} />
            <span>25-35%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#22c55e" }} />
            <span>35-40%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#15803d" }} />
            <span>40%+ (target)</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span>Parkland:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#e0f2fe" }} />
            <span>&lt;10%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#7dd3fc" }} />
            <span>10-20%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#38bdf8" }} />
            <span>20-30%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#0ea5e9" }} />
            <span>30-40%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#0369a1" }} />
            <span>40%+</span>
          </div>
        </div>
      )}
    </div>
  );
}
