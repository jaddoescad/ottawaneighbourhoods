"use client";

import { useEffect, useState, useMemo } from "react";
import { NeighbourhoodBoundary, GymData } from "@/data/neighbourhoods";
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

interface GymMapProps {
  boundaries: NeighbourhoodBoundary[];
  gyms: GymData[];
  neighbourhoodName: string;
}

// Get color based on gym type/sport
function getGymColor(gym: GymData): string {
  const sport = gym.sport?.toLowerCase() || "";
  const name = gym.name?.toLowerCase() || "";

  if (sport.includes("yoga") || name.includes("yoga")) return "#8b5cf6"; // purple
  if (sport.includes("martial") || sport.includes("kickbox") || name.includes("martial") || name.includes("boxing")) return "#ef4444"; // red
  if (sport.includes("crossfit") || name.includes("crossfit")) return "#f97316"; // orange
  if (gym.brand?.toLowerCase().includes("anytime") || gym.brand?.toLowerCase().includes("goodlife") || gym.brand?.toLowerCase().includes("fit4less")) return "#3b82f6"; // blue (chains)
  return "#10b981"; // green (default)
}

export default function GymMap({
  boundaries,
  gyms,
  neighbourhoodName
}: GymMapProps) {
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

    if (minLat === Infinity && gyms.length > 0) {
      for (const gym of gyms) {
        minLat = Math.min(minLat, gym.lat);
        maxLat = Math.max(maxLat, gym.lat);
        minLng = Math.min(minLng, gym.lng);
        maxLng = Math.max(maxLng, gym.lng);
      }
    }

    return [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [number, number];
  }, [boundaries, gyms]);

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

        {/* Gym Markers */}
        {gyms.map((gym, index) => (
          <CircleMarker
            key={`gym-${gym.osmId}-${index}`}
            center={[gym.lat, gym.lng]}
            radius={7}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: getGymColor(gym),
              fillOpacity: 0.9,
            }}
          >
            <Tooltip>
              <div className="text-sm">
                <div className="font-semibold">{gym.name || "Fitness Center"}</div>
                {gym.sport && (
                  <div className="text-xs text-gray-500 capitalize">{gym.sport.replace(/_/g, " ")}</div>
                )}
                {gym.brand && (
                  <div className="text-xs text-gray-500">{gym.brand}</div>
                )}
                {gym.address && (
                  <div className="text-xs text-gray-400 mt-1">{gym.address}</div>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
