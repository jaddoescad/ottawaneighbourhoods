"use client";

import { useEffect, useState, useMemo } from "react";
import { NeighbourhoodBoundary, RecreationFacilityData } from "@/data/neighbourhoods";
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

interface RecreationFacilitiesMapProps {
  boundaries: NeighbourhoodBoundary[];
  facilities: RecreationFacilityData[];
  neighbourhoodName: string;
}

// Get color based on facility type
export function getFacilityColor(facilityType: string): string {
  switch (facilityType) {
    case "Arena":
      return "#3b82f6"; // blue
    case "Pool - Indoor":
      return "#06b6d4"; // cyan
    case "Community Center":
      return "#8b5cf6"; // purple
    case "Recreation Complex":
      return "#10b981"; // emerald
    case "Field House":
      return "#f59e0b"; // amber
    case "Fitness Centre":
      return "#ef4444"; // red
    case "Curling Rink":
      return "#6366f1"; // indigo
    case "Stadium":
      return "#ec4899"; // pink
    case "Athletic Facility":
      return "#14b8a6"; // teal
    default:
      return "#6b7280"; // gray
  }
}

export default function RecreationFacilitiesMap({
  boundaries,
  facilities,
  neighbourhoodName
}: RecreationFacilitiesMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

    if (minLat === Infinity && facilities.length > 0) {
      for (const facility of facilities) {
        minLat = Math.min(minLat, facility.lat);
        maxLat = Math.max(maxLat, facility.lat);
        minLng = Math.min(minLng, facility.lng);
        maxLng = Math.max(maxLng, facility.lng);
      }
    }

    return [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [number, number];
  }, [boundaries, facilities]);

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

        {/* Facility Markers */}
        {facilities.map((facility, index) => (
          <CircleMarker
            key={`facility-${facility.name}-${index}`}
            center={[facility.lat, facility.lng]}
            radius={8}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: getFacilityColor(facility.facilityType),
              fillOpacity: 0.9,
            }}
          >
            <Tooltip>
              <div className="text-sm">
                <div className="font-semibold">{facility.name || "Recreation Facility"}</div>
                <div className="text-xs text-gray-500">{facility.facilityType}</div>
                {facility.buildingName && facility.buildingName !== facility.name && (
                  <div className="text-xs text-gray-500">{facility.buildingName}</div>
                )}
                {facility.address && (
                  <div className="text-xs text-gray-400 mt-1">{facility.address}</div>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
