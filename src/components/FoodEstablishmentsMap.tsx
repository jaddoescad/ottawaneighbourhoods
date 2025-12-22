"use client";

import { useEffect, useState, useMemo } from "react";
import { NeighbourhoodBoundary, FoodEstablishmentData } from "@/data/neighbourhoods";
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

interface FoodEstablishmentsMapProps {
  boundaries: NeighbourhoodBoundary[];
  establishments: FoodEstablishmentData[];
  neighbourhoodName: string;
  selectedCategory: string | null;
}

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  "restaurant": "#ef4444",  // Red
  "cafe": "#f59e0b",        // Amber
  "coffee_shop": "#84cc16", // Lime
  "fast_food": "#f97316",   // Orange
  "bakery": "#ec4899",      // Pink
  "pub": "#8b5cf6",         // Purple
  "bar": "#6366f1",         // Indigo
  "ice_cream": "#06b6d4",   // Cyan
  "grocery": "#22c55e",     // Green
  "food_court": "#64748b",  // Slate
};

const CATEGORY_LABELS: Record<string, string> = {
  "restaurant": "Restaurant",
  "cafe": "Cafe",
  "coffee_shop": "Coffee Shop",
  "fast_food": "Fast Food",
  "bakery": "Bakery",
  "pub": "Pub",
  "bar": "Bar",
  "ice_cream": "Ice Cream",
  "grocery": "Grocery",
  "food_court": "Food Court",
};

export default function FoodEstablishmentsMap({
  boundaries,
  establishments,
  neighbourhoodName,
  selectedCategory
}: FoodEstablishmentsMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter establishments by category if selected
  const filteredEstablishments = selectedCategory
    ? establishments.filter(e => e.category === selectedCategory)
    : establishments;

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

    if (minLat === Infinity && establishments.length > 0) {
      for (const est of establishments) {
        minLat = Math.min(minLat, est.lat);
        maxLat = Math.max(maxLat, est.lat);
        minLng = Math.min(minLng, est.lng);
        maxLng = Math.max(maxLng, est.lng);
      }
    }

    return [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [number, number];
  }, [boundaries, establishments]);

  if (!mounted) {
    return (
      <div className="h-72 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading map...</span>
      </div>
    );
  }

  return (
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

        {/* Establishment Markers */}
        {filteredEstablishments.map((establishment, index) => (
          <CircleMarker
            key={`est-${establishment.id}-${index}`}
            center={[establishment.lat, establishment.lng]}
            radius={6}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: CATEGORY_COLORS[establishment.category] || "#6b7280",
              fillOpacity: 0.9,
            }}
          >
            <Tooltip>
              <div className="text-sm">
                <div className="font-semibold">{establishment.name}</div>
                <div className="text-gray-600">{CATEGORY_LABELS[establishment.category] || establishment.category}</div>
                {establishment.address && (
                  <div className="text-xs text-gray-400 mt-1">{establishment.address}</div>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export { CATEGORY_COLORS, CATEGORY_LABELS };
