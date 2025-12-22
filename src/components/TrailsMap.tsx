"use client";

import { useEffect, useState, useMemo } from "react";
import { GreenbeltTrailData, ParkData, NeighbourhoodBoundary } from "@/data/neighbourhoods";
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
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);

interface TrailsMapProps {
  greenbeltTrails: GreenbeltTrailData[];
  linearParks: ParkData[];
  boundaries: NeighbourhoodBoundary[];
  neighbourhoodName: string;
}

export default function TrailsMap({ greenbeltTrails, linearParks, boundaries, neighbourhoodName }: TrailsMapProps) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    setMounted(true);
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
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

    // Include trail locations
    for (const trail of greenbeltTrails) {
      if (trail.lat && trail.lng) {
        minLat = Math.min(minLat, trail.lat);
        maxLat = Math.max(maxLat, trail.lat);
        minLng = Math.min(minLng, trail.lng);
        maxLng = Math.max(maxLng, trail.lng);
      }
    }

    // Include linear park locations
    for (const park of linearParks) {
      minLat = Math.min(minLat, park.lat);
      maxLat = Math.max(maxLat, park.lat);
      minLng = Math.min(minLng, park.lng);
      maxLng = Math.max(maxLng, park.lng);
    }

    return [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [number, number];
  }, [boundaries, greenbeltTrails, linearParks]);

  // Create custom icon for greenbelt trails
  const trailIcon = useMemo(() => {
    if (!L) return null;
    return L.divIcon({
      className: 'custom-trail-marker',
      html: `<div style="
        background: #16a34a;
        border: 3px solid white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 14px;
      ">🥾</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  }, [L]);

  if (!mounted || !L) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
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

          {/* Neighbourhood boundaries */}
          {boundaries.map((boundary, index) => {
            const positions = boundary.rings.map((ring: number[][]) =>
              ring.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
            );

            return (
              <Polygon
                key={`boundary-${boundary.onsId}-${index}`}
                positions={positions}
                pathOptions={{
                  color: "#16a34a",
                  weight: 2,
                  fillColor: "#16a34a",
                  fillOpacity: 0.1,
                }}
              />
            );
          })}

          {/* Greenbelt trail markers */}
          {greenbeltTrails.map((trail, index) => (
            trail.lat && trail.lng && trailIcon && (
              <Marker
                key={`trail-${index}`}
                position={[trail.lat, trail.lng]}
                icon={trailIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{trail.name}</div>
                    <div className="text-gray-600">{trail.sector}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                        {trail.difficulty}
                      </span>
                      <span className="text-xs font-medium">{trail.lengthKm} km</span>
                    </div>
                    {trail.parking && (
                      <div className="text-xs text-gray-500 mt-1">
                        Parking: {trail.parking}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {/* Linear park markers (smaller blue circles) */}
          {linearParks.map((park, index) => (
            <CircleMarker
              key={`park-${index}`}
              center={[park.lat, park.lng]}
              radius={8}
              pathOptions={{
                color: '#2563eb',
                weight: 2,
                fillColor: '#3b82f6',
                fillOpacity: 0.8,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{park.name}</div>
                  <div className="text-gray-600">Linear Park / Pathway</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center text-[10px]">🥾</div>
          <span>Greenbelt Trail</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Linear Park</span>
        </div>
      </div>
    </div>
  );
}
