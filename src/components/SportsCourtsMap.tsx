"use client";

import { useEffect, useState, useMemo } from "react";
import { NeighbourhoodBoundary, SportsCourtData } from "@/data/neighbourhoods";
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

interface SportsCourtsMapProps {
  boundaries: NeighbourhoodBoundary[];
  courts: SportsCourtData[];
  neighbourhoodName: string;
}

// Get color based on court type
export function getCourtColor(courtType: string): string {
  switch (courtType) {
    case "Basketball Court":
      return "#f97316"; // orange
    case "Tennis Court":
      return "#22c55e"; // green
    case "Volleyball Court":
      return "#eab308"; // yellow
    case "Pickleball Court":
      return "#06b6d4"; // cyan
    case "Ball Diamond":
      return "#ef4444"; // red
    case "Sports Field":
      return "#10b981"; // emerald
    default:
      return "#6b7280"; // gray
  }
}

export default function SportsCourtsMap({
  boundaries,
  courts,
  neighbourhoodName
}: SportsCourtsMapProps) {
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

    if (minLat === Infinity && courts.length > 0) {
      for (const court of courts) {
        minLat = Math.min(minLat, court.lat);
        maxLat = Math.max(maxLat, court.lat);
        minLng = Math.min(minLng, court.lng);
        maxLng = Math.max(maxLng, court.lng);
      }
    }

    return [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [number, number];
  }, [boundaries, courts]);

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

        {/* Court Markers */}
        {courts.map((court, index) => (
          <CircleMarker
            key={`court-${court.parkName}-${court.courtType}-${index}`}
            center={[court.lat, court.lng]}
            radius={7}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: getCourtColor(court.courtType),
              fillOpacity: 0.9,
            }}
          >
            <Tooltip>
              <div className="text-sm">
                <div className="font-semibold">{court.parkName || court.name || "Sports Facility"}</div>
                <div className="text-xs text-gray-500">{court.courtType}</div>
                {court.sportType && court.sportType !== court.courtType.toLowerCase() && (
                  <div className="text-xs text-gray-500">{court.sportType}</div>
                )}
                {court.fieldSize && court.fieldSize !== "unknown" && (
                  <div className="text-xs text-gray-500">Size: {court.fieldSize}</div>
                )}
                {court.lights && court.lights.toLowerCase().includes("yes") && (
                  <div className="text-xs text-green-600">Has lights</div>
                )}
                {court.address && (
                  <div className="text-xs text-gray-400 mt-1">{court.address}</div>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
