"use client";

import { useEffect, useState, useMemo } from "react";
import { NeighbourhoodBoundary, ParkData } from "@/data/neighbourhoods";
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
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  { ssr: false }
);

interface ParksOnsMapProps {
  boundaries: NeighbourhoodBoundary[];
  parks: ParkData[];
  neighbourhoodName: string;
}

// Park type colors
const PARK_COLORS: Record<string, string> = {
  "Active Recreation": "#22c55e", // Green
  "Passive": "#3b82f6", // Blue
  "Natural Area": "#15803d", // Dark green
  "Linkage": "#94a3b8", // Gray
  "Stormwater Management": "#06b6d4", // Cyan
};

const DOG_POLICY: Record<string, string> = {
  "1": "Dogs on leash",
  "2": "Off-leash area",
  "3": "No dogs",
};

const getColor = (type: string): string => {
  return PARK_COLORS[type] || "#22c55e";
};

export default function ParksOnsMap({ boundaries, parks, neighbourhoodName }: ParksOnsMapProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get unique park types
  const parkTypes = useMemo(() => {
    const types = new Set(parks.map(p => p.type));
    return Array.from(types).sort();
  }, [parks]);

  // Filter parks by selected type
  const filteredParks = selectedType
    ? parks.filter(p => p.type === selectedType)
    : parks;

  // Calculate center from boundaries
  const center = useMemo(() => {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    for (const boundary of boundaries) {
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

    // If no boundaries, use parks
    if (minLat === Infinity && parks.length > 0) {
      for (const park of parks) {
        minLat = Math.min(minLat, park.lat);
        maxLat = Math.max(maxLat, park.lat);
        minLng = Math.min(minLng, park.lng);
        maxLng = Math.max(maxLng, park.lng);
      }
    }

    return [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [number, number];
  }, [boundaries, parks]);

  if (!mounted) {
    return (
      <div className="h-72 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType(null)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
            selectedType === null
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({parks.length})
        </button>
        {parkTypes.map((type) => {
          const count = parks.filter(p => p.type === type).length;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type === selectedType ? null : type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition inline-flex items-center gap-1.5 ${
                selectedType === type
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getColor(type) }}
              />
              {type} ({count})
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="h-72 rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* ONS Zone Boundaries */}
          {boundaries.map((boundary, index) => {
            const positions = boundary.rings.map((ring: number[][]) =>
              ring.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
            );

            return (
              <Polygon
                key={`boundary-${boundary.onsId}-${index}`}
                positions={positions}
                pathOptions={{
                  color: "#6b7280",
                  weight: 2,
                  fillColor: "#f3f4f6",
                  fillOpacity: 0.3,
                  dashArray: "4",
                }}
              >
                <Tooltip>
                  <div className="text-xs text-gray-600">{boundary.name}</div>
                </Tooltip>
              </Polygon>
            );
          })}

          {/* Park Markers */}
          {filteredParks.map((park, index) => (
            <CircleMarker
              key={`park-${index}-${park.name}`}
              center={[park.lat, park.lng]}
              radius={8}
              pathOptions={{
                color: "#fff",
                weight: 2,
                fillColor: getColor(park.type),
                fillOpacity: 0.9,
              }}
            >
              <Tooltip>
                <div className="text-sm">
                  <div className="font-semibold">{park.name}</div>
                  <div className="text-gray-600">{park.type}</div>
                  {park.category && (
                    <div className="text-xs text-gray-500">{park.category}</div>
                  )}
                  {park.dogPolicy && DOG_POLICY[park.dogPolicy] && (
                    <div className="text-xs text-gray-500 mt-1">
                      🐕 {DOG_POLICY[park.dogPolicy]}
                    </div>
                  )}
                  {park.address && (
                    <div className="text-xs text-gray-400 mt-1">{park.address}</div>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Park List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Parks in {neighbourhoodName}
          </span>
          <span className="text-xs text-gray-500">
            {filteredParks.length} {selectedType ? `${selectedType.toLowerCase()} ` : ""}parks
          </span>
        </div>
        <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {filteredParks
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((park, index) => (
              <div key={`list-${index}-${park.name}`} className="px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getColor(park.type) }}
                  />
                  <span className="text-sm text-gray-700 truncate">{park.name}</span>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                  {park.type}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span>Park types:</span>
        {Object.entries(PARK_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
