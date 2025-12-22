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

interface CrimeOnsMapProps {
  boundaries: NeighbourhoodBoundary[];
  neighbourhoodName: string;
}

// Ottawa average crime rate per 1,000 residents (2023-2024, 2 years)
const OTTAWA_AVG_CRIME_RATE = 95; // Approximate city-wide average

// Color scale: green (safe) to red (high crime)
const getColor = (crimeRate: number): string => {
  if (crimeRate === 0) return "#e5e7eb"; // Gray for no data
  if (crimeRate < 30) return "#22c55e"; // Green - very safe
  if (crimeRate < 60) return "#84cc16"; // Lime - safe
  if (crimeRate < 100) return "#eab308"; // Yellow - moderate
  if (crimeRate < 150) return "#f97316"; // Orange - elevated
  return "#ef4444"; // Red - high
};

const getRateLabel = (crimeRate: number): string => {
  if (crimeRate === 0) return "No data";
  if (crimeRate < 30) return "Very Low";
  if (crimeRate < 60) return "Low";
  if (crimeRate < 100) return "Moderate";
  if (crimeRate < 150) return "Elevated";
  return "High";
};

export default function CrimeOnsMap({ boundaries, neighbourhoodName }: CrimeOnsMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate center and stats
  const { center, avgRate, minRate, maxRate } = useMemo(() => {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    let totalCrime = 0;
    let totalPop = 0;
    let minCrimeRate = Infinity;
    let maxCrimeRate = -Infinity;

    for (const boundary of boundaries) {
      totalCrime += boundary.crimeTotal || 0;
      totalPop += boundary.population || 0;

      if (boundary.crimeRate > 0) {
        minCrimeRate = Math.min(minCrimeRate, boundary.crimeRate);
        maxCrimeRate = Math.max(maxCrimeRate, boundary.crimeRate);
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
      avgRate: totalPop > 0 ? (totalCrime / totalPop) * 1000 : 0,
      minRate: minCrimeRate === Infinity ? 0 : minCrimeRate,
      maxRate: maxCrimeRate === -Infinity ? 0 : maxCrimeRate,
    };
  }, [boundaries]);

  if (!mounted) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading map...</span>
      </div>
    );
  }

  const comparison = avgRate < OTTAWA_AVG_CRIME_RATE
    ? { text: "below", color: "text-green-600" }
    : avgRate > OTTAWA_AVG_CRIME_RATE
      ? { text: "above", color: "text-red-600" }
      : { text: "at", color: "text-gray-600" };

  return (
    <div className="space-y-3">
      {/* Comparison to Ottawa Average */}
      <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
        <span className="text-gray-600">Neighbourhood avg: </span>
        <span className="font-semibold">{avgRate.toFixed(1)} per 1K</span>
        <span className="text-gray-400 mx-1">•</span>
        <span className={comparison.color}>
          {Math.abs(avgRate - OTTAWA_AVG_CRIME_RATE).toFixed(1)} {comparison.text} Ottawa avg (~{OTTAWA_AVG_CRIME_RATE})
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
            const color = getColor(boundary.crimeRate || 0);
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
                      Crime Rate: <span className="font-medium">{(boundary.crimeRate || 0).toFixed(1)} per 1K</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {boundary.crimeTotal || 0} crimes / {(boundary.population || 0).toLocaleString()} residents
                    </div>
                    <div className="text-xs font-medium mt-1" style={{ color }}>
                      {getRateLabel(boundary.crimeRate || 0)}
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
            Crime Rate by ONS Zone (per 1,000 residents)
          </span>
        </div>
        <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {boundaries
            .filter(b => b.crimeRate > 0)
            .sort((a, b) => (b.crimeRate || 0) - (a.crimeRate || 0))
            .map((boundary, index) => (
              <div key={`${boundary.onsId}-${index}`} className="px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: getColor(boundary.crimeRate || 0) }}
                  />
                  <span className="text-sm text-gray-700 truncate">{boundary.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-medium text-gray-900">
                    {(boundary.crimeRate || 0).toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({boundary.crimeTotal || 0})
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* Neighbourhood Average */}
        <div className="px-3 py-2 border-t border-gray-200 bg-blue-50 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">
            Neighbourhood Average
          </span>
          <span className="text-sm font-bold text-blue-900">
            {avgRate.toFixed(1)} per 1K
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span>Crime Rate:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#22c55e" }} />
          <span>&lt;30</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#84cc16" }} />
          <span>30-60</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#eab308" }} />
          <span>60-100</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#f97316" }} />
          <span>100-150</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#ef4444" }} />
          <span>150+</span>
        </div>
      </div>

      {/* Source */}
      <div className="text-xs text-gray-500">
        Crime rate = crimes per 1,000 residents (2023-2024). Source:{" "}
        <a
          href="https://data.ottawapolice.ca"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Ottawa Police Open Data
        </a>
      </div>
    </div>
  );
}
