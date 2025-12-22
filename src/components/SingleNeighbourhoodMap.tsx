"use client";

import { useEffect, useState, useMemo } from "react";
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

interface Boundary {
  onsId: number | string;
  name: string;
  rings: number[][][];
}

interface SingleNeighbourhoodMapProps {
  isOpen: boolean;
  onClose: () => void;
  neighbourhoodName: string;
  boundaries: Boundary[];
}

export default function SingleNeighbourhoodMap({
  isOpen,
  onClose,
  neighbourhoodName,
  boundaries,
}: SingleNeighbourhoodMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate center and bounds from boundaries
  const { center, zoom } = useMemo(() => {
    if (!boundaries || boundaries.length === 0) {
      return { center: [45.4215, -75.6972] as [number, number], zoom: 12 };
    }

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    boundaries.forEach((boundary) => {
      boundary.rings.forEach((ring) => {
        ring.forEach((coord) => {
          const lng = coord[0];
          const lat = coord[1];
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        });
      });
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Calculate appropriate zoom based on area size
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);

    let calculatedZoom = 13;
    if (maxDiff > 0.15) calculatedZoom = 11;
    else if (maxDiff > 0.08) calculatedZoom = 12;
    else if (maxDiff > 0.04) calculatedZoom = 13;
    else calculatedZoom = 14;

    return {
      center: [centerLat, centerLng] as [number, number],
      zoom: calculatedZoom,
    };
  }, [boundaries]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[95vw] h-[85vh] max-w-4xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {neighbourhoodName} Coverage
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {boundaries.length} ONS area{boundaries.length !== 1 ? "s" : ""} included
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {mounted && (
            <MapContainer
              center={center}
              zoom={zoom}
              style={{ height: "100%", width: "100%" }}
              className="rounded-b-xl"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {boundaries.map((boundary, index) => {
                // Convert rings to Leaflet format [lat, lng]
                const positions = boundary.rings.map((ring: number[][]) =>
                  ring.map(
                    (coord: number[]) => [coord[1], coord[0]] as [number, number]
                  )
                );

                return (
                  <Polygon
                    key={`${boundary.onsId}-${index}`}
                    positions={positions}
                    pathOptions={{
                      color: "#3b82f6",
                      weight: 3,
                      fillColor: "#3b82f6",
                      fillOpacity: 0.25,
                    }}
                  >
                    <Tooltip sticky>
                      <div className="font-medium">{boundary.name}</div>
                      <div className="text-xs font-mono text-blue-600 mt-0.5">
                        ONS ID: {boundary.onsId}
                      </div>
                    </Tooltip>
                  </Polygon>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t bg-gray-50 rounded-b-xl">
          <div className="flex flex-wrap gap-3 items-center text-sm text-gray-600">
            <span className="font-medium">ONS Areas:</span>
            {boundaries.map((b, i) => (
              <span key={i} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                {b.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
