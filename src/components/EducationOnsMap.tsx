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

interface EducationOnsMapProps {
  boundaries: NeighbourhoodBoundary[];
  neighbourhoodName: string;
}

type EducationMetric = "bachelors" | "postSecondary" | "noHighSchool";

// Ottawa averages (2021 Census)
const OTTAWA_AVERAGES = {
  bachelors: 42.5,
  postSecondary: 72.8,
  noHighSchool: 6.2,
};

const METRIC_CONFIG = {
  bachelors: {
    label: "Bachelor's Degree+",
    shortLabel: "Bachelor's+",
    getValue: (b: NeighbourhoodBoundary) => b.pctBachelors || 0,
    format: (v: number) => `${v.toFixed(1)}%`,
    colors: ["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e3a8a"], // Blue scale (higher is better)
    higherIsBetter: true,
    ottawaAvg: OTTAWA_AVERAGES.bachelors,
  },
  postSecondary: {
    label: "Post-Secondary Education",
    shortLabel: "Post-Secondary",
    getValue: (b: NeighbourhoodBoundary) => b.pctPostSecondary || 0,
    format: (v: number) => `${v.toFixed(1)}%`,
    colors: ["#dcfce7", "#86efac", "#22c55e", "#15803d", "#14532d"], // Green scale (higher is better)
    higherIsBetter: true,
    ottawaAvg: OTTAWA_AVERAGES.postSecondary,
  },
  noHighSchool: {
    label: "No High School Diploma",
    shortLabel: "No Diploma",
    getValue: (b: NeighbourhoodBoundary) => b.pctNoHighSchool || 0,
    format: (v: number) => `${v.toFixed(1)}%`,
    colors: ["#14532d", "#15803d", "#22c55e", "#86efac", "#dcfce7"], // Reversed green (lower is better)
    higherIsBetter: false,
    ottawaAvg: OTTAWA_AVERAGES.noHighSchool,
  },
};

const getColor = (value: number, min: number, max: number, colors: string[]): string => {
  if (max === min) return colors[2];
  const ratio = (value - min) / (max - min);

  if (ratio < 0.2) return colors[0];
  if (ratio < 0.4) return colors[1];
  if (ratio < 0.6) return colors[2];
  if (ratio < 0.8) return colors[3];
  return colors[4];
};

export default function EducationOnsMap({ boundaries, neighbourhoodName }: EducationOnsMapProps) {
  const [mounted, setMounted] = useState(false);
  const [metric, setMetric] = useState<EducationMetric>("bachelors");

  useEffect(() => {
    setMounted(true);
  }, []);

  const config = METRIC_CONFIG[metric];

  // Calculate center, min, max for current metric
  const { center, minVal, maxVal, avgVal } = useMemo(() => {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    let minValue = Infinity, maxValue = -Infinity;
    let totalValue = 0;
    let totalPop = 0;

    for (const boundary of boundaries) {
      const value = config.getValue(boundary);
      const pop = boundary.population || 1;

      if (value > 0) {
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
        totalValue += value * pop;
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
      minVal: minValue === Infinity ? 0 : minValue,
      maxVal: maxValue === -Infinity ? 100 : maxValue,
      avgVal: totalPop > 0 ? totalValue / totalPop : 0,
    };
  }, [boundaries, config]);

  if (!mounted) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading map...</span>
      </div>
    );
  }

  const comparison = avgVal > config.ottawaAvg
    ? { text: "above", color: config.higherIsBetter ? "text-green-600" : "text-red-600" }
    : avgVal < config.ottawaAvg
      ? { text: "below", color: config.higherIsBetter ? "text-red-600" : "text-green-600" }
      : { text: "at", color: "text-gray-600" };

  return (
    <div className="space-y-3">
      {/* Metric Selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(METRIC_CONFIG) as EducationMetric[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              metric === m
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {METRIC_CONFIG[m].shortLabel}
          </button>
        ))}
      </div>

      {/* Comparison to Ottawa Average */}
      <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
        <span className="text-gray-600">Neighbourhood avg: </span>
        <span className="font-semibold">{avgVal.toFixed(1)}%</span>
        <span className="text-gray-400 mx-1">•</span>
        <span className={comparison.color}>
          {Math.abs(avgVal - config.ottawaAvg).toFixed(1)}% {comparison.text} Ottawa avg ({config.ottawaAvg}%)
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
            const value = config.getValue(boundary);
            const color = getColor(value, minVal, maxVal, config.colors);
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
                      {config.label}: <span className="font-medium">{config.format(value)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                      <div>Bachelor&apos;s+: {(boundary.pctBachelors || 0).toFixed(1)}%</div>
                      <div>Post-Secondary: {(boundary.pctPostSecondary || 0).toFixed(1)}%</div>
                      <div>No Diploma: {(boundary.pctNoHighSchool || 0).toFixed(1)}%</div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      ONS ID: {boundary.onsId}
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
            {config.label} by ONS Zone
          </span>
        </div>
        <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {boundaries
            .sort((a, b) => config.higherIsBetter
              ? config.getValue(b) - config.getValue(a)
              : config.getValue(a) - config.getValue(b)
            )
            .map((boundary, index) => {
              const value = config.getValue(boundary);
              return (
                <div key={`${boundary.onsId}-${index}`} className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: getColor(value, minVal, maxVal, config.colors) }}
                    />
                    <span className="text-sm text-gray-700 truncate">{boundary.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-900">
                      {config.format(value)}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      #{boundary.onsId}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Weighted Average */}
        <div className="px-3 py-2 border-t border-gray-200 bg-blue-50 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">
            Neighbourhood Average
          </span>
          <span className="text-sm font-bold text-blue-900">
            {config.format(avgVal)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>{config.shortLabel}:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: config.colors[0] }} />
          <span>{config.higherIsBetter ? "Low" : "High"}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: config.colors[2] }} />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: config.colors[4] }} />
          <span>{config.higherIsBetter ? "High" : "Low"}</span>
        </div>
      </div>

      {/* Source */}
      <div className="text-xs text-gray-500">
        Education levels of residents aged 25-64. Source:{" "}
        <a
          href="https://ons-sqo.ca"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Statistics Canada 2021 Census via ONS
        </a>
      </div>
    </div>
  );
}
