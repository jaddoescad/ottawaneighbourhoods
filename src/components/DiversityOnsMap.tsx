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

interface DiversityOnsMapProps {
  boundaries: NeighbourhoodBoundary[];
  neighbourhoodName: string;
  metric: "immigrants" | "racialized";
}

// Ottawa averages (2021 Census)
const OTTAWA_AVG_IMMIGRANTS = 25;
const OTTAWA_AVG_RACIALIZED = 30;

// Color scale for diversity (purple gradient)
const getColor = (pct: number): string => {
  if (pct === 0) return "#e5e7eb"; // Gray for no data
  if (pct < 15) return "#f3e8ff"; // Very light purple
  if (pct < 25) return "#e9d5ff"; // Light purple
  if (pct < 35) return "#c084fc"; // Medium purple
  if (pct < 45) return "#a855f7"; // Purple
  return "#7c3aed"; // Dark purple
};

const getPctLabel = (pct: number): string => {
  if (pct === 0) return "No data";
  if (pct < 15) return "Low";
  if (pct < 25) return "Below Avg";
  if (pct < 35) return "Average";
  if (pct < 45) return "Above Avg";
  return "High";
};

export default function DiversityOnsMap({
  boundaries,
  neighbourhoodName,
  metric
}: DiversityOnsMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const ottawaAvg = metric === "immigrants" ? OTTAWA_AVG_IMMIGRANTS : OTTAWA_AVG_RACIALIZED;
  const metricLabel = metric === "immigrants" ? "Immigrants" : "Visible Minorities";

  // Calculate center and stats
  const { center, avgPct, minPct, maxPct } = useMemo(() => {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    let totalPct = 0;
    let totalPop = 0;
    let minPctVal = Infinity;
    let maxPctVal = -Infinity;

    for (const boundary of boundaries) {
      const pct = metric === "immigrants" ? boundary.pctImmigrants : boundary.pctRacialized;
      const pop = boundary.population || 0;

      if (pct > 0 && pop > 0) {
        totalPct += pct * pop;
        totalPop += pop;
        minPctVal = Math.min(minPctVal, pct);
        maxPctVal = Math.max(maxPctVal, pct);
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
      minPct: minPctVal === Infinity ? 0 : minPctVal,
      maxPct: maxPctVal === -Infinity ? 0 : maxPctVal,
    };
  }, [boundaries, metric]);

  if (!mounted) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading map...</span>
      </div>
    );
  }

  const comparison = avgPct < ottawaAvg
    ? { text: "below", color: "text-gray-600" }
    : avgPct > ottawaAvg
      ? { text: "above", color: "text-purple-600" }
      : { text: "at", color: "text-gray-600" };

  return (
    <div className="space-y-3">
      {/* Comparison to Ottawa Average */}
      <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
        <span className="text-gray-600">Neighbourhood avg: </span>
        <span className="font-semibold">{avgPct.toFixed(1)}%</span>
        <span className="text-gray-400 mx-1">•</span>
        <span className={comparison.color}>
          {Math.abs(avgPct - ottawaAvg).toFixed(1)}% {comparison.text} Ottawa avg (~{ottawaAvg}%)
        </span>
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
            const pct = metric === "immigrants" ? boundary.pctImmigrants : boundary.pctRacialized;
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
                    <div className="text-xs text-gray-500 mt-1">
                      Population: {(boundary.population || 0).toLocaleString()}
                    </div>
                    <div className="text-xs font-medium mt-1" style={{ color }}>
                      {getPctLabel(pct || 0)}
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
            .filter(b => (metric === "immigrants" ? b.pctImmigrants : b.pctRacialized) > 0)
            .sort((a, b) => {
              const aVal = metric === "immigrants" ? a.pctImmigrants : a.pctRacialized;
              const bVal = metric === "immigrants" ? b.pctImmigrants : b.pctRacialized;
              return (bVal || 0) - (aVal || 0);
            })
            .map((boundary, index) => {
              const pct = metric === "immigrants" ? boundary.pctImmigrants : boundary.pctRacialized;
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
        <div className="px-3 py-2 border-t border-gray-200 bg-purple-50 flex items-center justify-between">
          <span className="text-sm font-medium text-purple-800">
            Neighbourhood Average
          </span>
          <span className="text-sm font-bold text-purple-900">
            {avgPct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span>% {metricLabel}:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#f3e8ff" }} />
          <span>&lt;15%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#e9d5ff" }} />
          <span>15-25%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#c084fc" }} />
          <span>25-35%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#a855f7" }} />
          <span>35-45%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#7c3aed" }} />
          <span>45%+</span>
        </div>
      </div>
    </div>
  );
}
