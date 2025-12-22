"use client";

import { useEffect, useState, useMemo } from "react";
import { LibraryData, NeighbourhoodBoundary } from "@/data/neighbourhoods";
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

interface LibrariesMapProps {
  libraries: LibraryData[];
  boundaries: NeighbourhoodBoundary[];
  neighbourhoodName: string;
}

export default function LibrariesMap({ libraries, boundaries, neighbourhoodName }: LibrariesMapProps) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    setMounted(true);
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  // Calculate center from boundaries or libraries
  const center = useMemo(() => {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    // Use boundaries if available
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

    // Also include library locations
    for (const lib of libraries) {
      minLat = Math.min(minLat, lib.lat);
      maxLat = Math.max(maxLat, lib.lat);
      minLng = Math.min(minLng, lib.lng);
      maxLng = Math.max(maxLng, lib.lng);
    }

    return [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [number, number];
  }, [boundaries, libraries]);

  // Create custom icon for libraries
  const libraryIcon = useMemo(() => {
    if (!L) return null;
    return L.divIcon({
      className: 'custom-library-marker',
      html: `<div style="
        background: #2563eb;
        border: 3px solid white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 16px;
      ">📚</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
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
    <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
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
                color: "#6366f1",
                weight: 2,
                fillColor: "#6366f1",
                fillOpacity: 0.1,
              }}
            />
          );
        })}

        {/* Library markers */}
        {libraries.map((library, index) => (
          libraryIcon && (
            <Marker
              key={`library-${index}`}
              position={[library.lat, library.lng]}
              icon={libraryIcon}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{library.name}</div>
                  <div className="text-gray-600">{library.address}</div>
                  {library.postalCode && (
                    <div className="text-gray-500 text-xs mt-1">{library.postalCode}</div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
