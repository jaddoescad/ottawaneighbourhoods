"use client";

import { useEffect, useState } from "react";
import { neighbourhoods } from "@/data/neighbourhoods";
import "leaflet/dist/leaflet.css";

// Dynamic import for Leaflet to avoid SSR issues
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

interface CoverageMapProps {
  isOpen: boolean;
  onClose: () => void;
}

// Generate distinct colors for neighbourhoods
const COLORS = [
  "#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00",
  "#ffff33", "#a65628", "#f781bf", "#999999", "#66c2a5",
  "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f",
  "#e5c494", "#b3b3b3", "#1b9e77", "#d95f02", "#7570b3",
  "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666",
  "#8dd3c7", "#bebada",
];

export default function CoverageMap({ isOpen, onClose }: CoverageMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;

  // Ottawa center coordinates
  const ottawaCenter: [number, number] = [45.4215, -75.6972];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[95vw] h-[90vh] max-w-7xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Neighbourhood Coverage Map
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing {neighbourhoods.length} neighbourhoods - gaps indicate areas not currently covered
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
              center={ottawaCenter}
              zoom={10}
              style={{ height: "100%", width: "100%" }}
              className="rounded-b-xl"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {neighbourhoods.map((neighbourhood, index) => {
                const color = COLORS[index % COLORS.length];

                return neighbourhood.boundaries?.map((boundary, boundaryIndex) => {
                  // Convert rings to Leaflet format [lat, lng]
                  // boundary.rings[0] is the outer ring, subsequent rings are holes
                  const positions = boundary.rings.map((ring: number[][]) =>
                    ring.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
                  );

                  return (
                    <Polygon
                      key={`${neighbourhood.id}-${boundaryIndex}`}
                      positions={positions}
                      pathOptions={{
                        color: color,
                        weight: 2,
                        fillColor: color,
                        fillOpacity: 0.3,
                      }}
                    >
                      <Tooltip sticky>
                        <div className="font-medium">{neighbourhood.name}</div>
                        <div className="text-xs text-gray-500">
                          {boundary.name}
                        </div>
                      </Tooltip>
                    </Polygon>
                  );
                });
              })}
            </MapContainer>
          )}
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t bg-gray-50 rounded-b-xl">
          <div className="flex flex-wrap gap-3">
            {neighbourhoods.slice(0, 15).map((n, i) => (
              <div key={n.id} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-gray-600">{n.name}</span>
              </div>
            ))}
            {neighbourhoods.length > 15 && (
              <span className="text-xs text-gray-400">
                +{neighbourhoods.length - 15} more
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
