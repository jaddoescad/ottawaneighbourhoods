"use client";

import { useEffect, useState, useMemo } from "react";
import { NeighbourhoodBoundary, SchoolData } from "@/data/neighbourhoods";
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

interface SchoolsOnsMapProps {
  boundaries: NeighbourhoodBoundary[];
  schools: SchoolData[];
  neighbourhoodName: string;
}

// Board colors
const BOARD_COLORS: Record<string, string> = {
  "OCDSB": "#3b82f6", // Blue - Ottawa-Carleton District School Board (Public English)
  "OCSB": "#22c55e",  // Green - Ottawa Catholic School Board
  "CECCE": "#f59e0b", // Amber - Conseil des écoles catholiques du Centre-Est (French Catholic)
  "CEPEO": "#8b5cf6", // Purple - Conseil des écoles publiques de l'Est de l'Ontario (French Public)
};

const BOARD_NAMES: Record<string, string> = {
  "OCDSB": "Public English",
  "OCSB": "Catholic English",
  "CECCE": "Catholic French",
  "CEPEO": "Public French",
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  "Elementary": "#22c55e",
  "Secondary": "#3b82f6",
  "Elementary/Secondary": "#8b5cf6",
};

type FilterType = "board" | "category";

const getColor = (school: SchoolData, filterType: FilterType): string => {
  if (filterType === "board") {
    return BOARD_COLORS[school.board] || "#6b7280";
  }
  return CATEGORY_COLORS[school.category] || "#6b7280";
};

const getEqaoColor = (score: number | null): string => {
  if (score === null) return "#9ca3af";
  if (score >= 80) return "#22c55e"; // Green
  if (score >= 70) return "#84cc16"; // Lime
  if (score >= 60) return "#eab308"; // Yellow
  if (score >= 50) return "#f97316"; // Orange
  return "#ef4444"; // Red
};

export default function SchoolsOnsMap({ boundaries, schools, neighbourhoodName }: SchoolsOnsMapProps) {
  const [mounted, setMounted] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("category");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get unique values for current filter type
  const filterOptions = useMemo(() => {
    if (filterType === "board") {
      const boards = new Set(schools.map(s => s.board));
      return Array.from(boards).sort();
    }
    const categories = new Set(schools.map(s => s.category));
    return Array.from(categories).sort();
  }, [schools, filterType]);

  // Filter schools
  const filteredSchools = selectedFilter
    ? schools.filter(s => filterType === "board" ? s.board === selectedFilter : s.category === selectedFilter)
    : schools;

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

    if (minLat === Infinity && schools.length > 0) {
      for (const school of schools) {
        minLat = Math.min(minLat, school.lat);
        maxLat = Math.max(maxLat, school.lat);
        minLng = Math.min(minLng, school.lng);
        maxLng = Math.max(maxLng, school.lng);
      }
    }

    return [(minLat + maxLat) / 2, (minLng + maxLng) / 2] as [number, number];
  }, [boundaries, schools]);

  if (!mounted) {
    return (
      <div className="h-72 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter Type Toggle */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-500">Color by:</span>
        <button
          onClick={() => { setFilterType("category"); setSelectedFilter(null); }}
          className={`px-2 py-1 rounded ${filterType === "category" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          Level
        </button>
        <button
          onClick={() => { setFilterType("board"); setSelectedFilter(null); }}
          className={`px-2 py-1 rounded ${filterType === "board" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          Board
        </button>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedFilter(null)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
            selectedFilter === null
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({schools.length})
        </button>
        {filterOptions.map((option) => {
          const count = schools.filter(s =>
            filterType === "board" ? s.board === option : s.category === option
          ).length;
          const color = filterType === "board" ? BOARD_COLORS[option] : CATEGORY_COLORS[option];
          const label = filterType === "board" ? (BOARD_NAMES[option] || option) : option;

          return (
            <button
              key={option}
              onClick={() => setSelectedFilter(option === selectedFilter ? null : option)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition inline-flex items-center gap-1.5 ${
                selectedFilter === option
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color || "#6b7280" }}
              />
              {label} ({count})
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

          {/* School Markers */}
          {filteredSchools.map((school, index) => (
            <CircleMarker
              key={`school-${index}-${school.name}`}
              center={[school.lat, school.lng]}
              radius={8}
              pathOptions={{
                color: "#fff",
                weight: 2,
                fillColor: getColor(school, filterType),
                fillOpacity: 0.9,
              }}
            >
              <Tooltip>
                <div className="text-sm">
                  <div className="font-semibold">{school.name}</div>
                  <div className="text-gray-600">{school.category}</div>
                  <div className="text-xs text-gray-500">{school.fullBoard}</div>
                  {school.eqaoScore !== null && (
                    <div className="mt-1 flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getEqaoColor(school.eqaoScore) }}
                      />
                      <span className="text-xs">EQAO: {school.eqaoScore}%</span>
                    </div>
                  )}
                  {school.address && (
                    <div className="text-xs text-gray-400 mt-1">{school.address}</div>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* School List - EQAO Scores */}
      {filteredSchools.filter(s => s.eqaoScore !== null).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Schools with EQAO Scores
            </span>
            <span className="text-xs text-gray-500">
              {filteredSchools.filter(s => s.eqaoScore !== null).length} schools
            </span>
          </div>
          <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {filteredSchools
              .filter(s => s.eqaoScore !== null)
              .sort((a, b) => (b.eqaoScore || 0) - (a.eqaoScore || 0))
              .map((school, index) => (
                <div key={`list-${index}-${school.name}`} className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getColor(school, filterType) }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-700 truncate">{school.name}</div>
                      <div className="text-xs text-gray-400">{school.category} • {BOARD_NAMES[school.board] || school.board}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getEqaoColor(school.eqaoScore) }}
                    />
                    <span className="text-xs font-medium text-gray-600">{school.eqaoScore}%</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Schools without EQAO scores */}
      {filteredSchools.filter(s => s.eqaoScore === null).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Other Schools (No EQAO Data)
            </span>
            <span className="text-xs text-gray-500">
              {filteredSchools.filter(s => s.eqaoScore === null).length} schools
            </span>
          </div>
          <div className="divide-y divide-gray-100 max-h-32 overflow-y-auto">
            {filteredSchools
              .filter(s => s.eqaoScore === null)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((school, index) => (
                <div key={`nodata-${index}-${school.name}`} className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getColor(school, filterType) }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm text-gray-700 truncate">{school.name}</div>
                      <div className="text-xs text-gray-400">{school.category} • {BOARD_NAMES[school.board] || school.board}</div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">N/A</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* EQAO Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span>EQAO Score:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }} />
          <span>80%+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#84cc16" }} />
          <span>70-79%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#eab308" }} />
          <span>60-69%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f97316" }} />
          <span>50-59%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
          <span>&lt;50%</span>
        </div>
      </div>
    </div>
  );
}
