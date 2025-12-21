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

interface PopulationOnsMapProps {
  boundaries: NeighbourhoodBoundary[];
  neighbourhoodName: string;
}

// Color scale for population density - blues
const getPopulationColor = (population: number, maxPop: number): string => {
  if (maxPop === 0) return "#e0e0e0";
  const ratio = population / maxPop;

  // Blue gradient from light to dark
  if (ratio < 0.2) return "#deebf7";
  if (ratio < 0.4) return "#9ecae1";
  if (ratio < 0.6) return "#4292c6";
  if (ratio < 0.8) return "#2171b5";
  return "#084594";
};

export default function PopulationOnsMap({ boundaries, neighbourhoodName }: PopulationOnsMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate center and bounds from boundaries
  const { center, maxPop, totalPop } = useMemo(() => {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    let maxPopulation = 0;
    let totalPopulation = 0;

    for (const boundary of boundaries) {
      totalPopulation += boundary.population || 0;
      if ((boundary.population || 0) > maxPopulation) {
        maxPopulation = boundary.population || 0;
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
      maxPop: maxPopulation,
      totalPop: totalPopulation,
    };
  }, [boundaries]);

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
            const color = getPopulationColor(boundary.population || 0, maxPop);
            const positions = boundary.rings.map((ring: number[][]) =>
              ring.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
            );

            return (
              <Polygon
                key={`${boundary.onsId}-${index}`}
                positions={positions}
                pathOptions={{
                  color: "#1e40af",
                  weight: 2,
                  fillColor: color,
                  fillOpacity: 0.6,
                }}
              >
                <Tooltip sticky>
                  <div className="text-sm">
                    <div className="font-semibold">{boundary.name}</div>
                    <div className="text-gray-600">
                      Population: <span className="font-medium">{(boundary.population || 0).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ONS ID: {boundary.onsId} • Data: {boundary.dataYear}
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
            ONS Zones in {neighbourhoodName}
          </span>
        </div>
        <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {boundaries
            .sort((a, b) => (b.population || 0) - (a.population || 0))
            .map((boundary, index) => (
              <div key={`${boundary.onsId}-${index}`} className="px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: getPopulationColor(boundary.population || 0, maxPop) }}
                  />
                  <span className="text-sm text-gray-700 truncate">{boundary.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-medium text-gray-900">
                    {(boundary.population || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    #{boundary.onsId}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* Total */}
        <div className="px-3 py-2 border-t border-gray-200 bg-blue-50 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">
            Total Population
          </span>
          <span className="text-sm font-bold text-blue-900">
            {totalPop.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>Population density:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#deebf7" }} />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#4292c6" }} />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#084594" }} />
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
