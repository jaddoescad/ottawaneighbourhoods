"use client";

import Image from "next/image";
import Link from "next/link";
import { Neighbourhood } from "@/data/neighbourhoods";

interface NeighbourhoodCardProps {
  neighbourhood: Neighbourhood;
  rank?: number;
}

// ==============================================
// EXACT COPIES from detail page stat row components
// ==============================================

// From PopulationStatRow.tsx - uses DENSITY not population count
// Density thresholds (people per km²)
function getDensityColor(density: number): string {
  if (density < 500) return "bg-gray-400";
  if (density < 1500) return "bg-green-400";
  if (density < 3000) return "bg-green-500";
  if (density < 6000) return "bg-yellow-400";
  return "bg-orange-500";
}

// From ParksStatRow.tsx and SchoolsStatRow.tsx
// Thresholds from neighbourhood/[id]/page.tsx
const THRESHOLDS = {
  parks: { max: 25, great: 20, okay: 10 },
  schools: { max: 15, great: 12, okay: 6 },
};

function getScoreType(value: number, category: keyof typeof THRESHOLDS): "great" | "good" | "okay" | "bad" {
  const t = THRESHOLDS[category];
  if (value >= t.great) return "great";
  if (value >= t.okay) return "okay";
  return "bad";
}

// Colors from StatRow.tsx
const colors: Record<string, string> = {
  great: "bg-green-500",
  good: "bg-green-400",
  okay: "bg-yellow-400",
  bad: "bg-orange-500",
  neutral: "bg-gray-300",
};

// From CrimeStatRow.tsx
function getCrimeBarColor(perCapita: number): string {
  if (perCapita < 50) return "bg-green-500";
  if (perCapita < 150) return "bg-yellow-400";
  return "bg-red-500";
}

// From HospitalStatRow.tsx
function getHospitalDistanceColor(distanceKm: number | null): string {
  if (distanceKm === null) return "bg-gray-300";
  if (distanceKm <= 3) return "bg-green-500";
  if (distanceKm <= 5) return "bg-green-400";
  if (distanceKm <= 8) return "bg-yellow-400";
  return "bg-orange-500";
}

// From neighbourhood/[id]/page.tsx - getRentScoreType
function getRentScoreType(value: number): "great" | "good" | "okay" | "bad" {
  if (value <= 1800) return "great";
  if (value <= 2000) return "okay";
  return "bad";
}

function formatPopulation(pop: number): string {
  if (pop >= 1000) {
    return `${(pop / 1000).toFixed(pop >= 10000 ? 0 : 1)}k`;
  }
  return pop.toString();
}

function formatRent(rent: number): string {
  return `$${rent.toLocaleString()}`;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreRingColor(score: number): string {
  if (score >= 70) return "ring-green-400";
  if (score >= 50) return "ring-yellow-400";
  if (score >= 30) return "ring-orange-400";
  return "ring-red-400";
}

export default function NeighbourhoodCard({
  neighbourhood,
  rank,
}: NeighbourhoodCardProps) {
  const { id, name, area, image, population, populationDensity, avgRent, overallScore } = neighbourhood;

  // Parks and Schools stats with category keys matching THRESHOLDS
  const stats: Array<{
    label: string;
    emoji: string;
    value: number;
    category: keyof typeof THRESHOLDS;
  }> = [
    { label: "Parks", emoji: "🌳", value: neighbourhood.details.parks, category: "parks" },
    { label: "Schools", emoji: "🏫", value: neighbourhood.details.schools, category: "schools" },
  ];

  return (
    <Link
      href={`/neighbourhood/${id}`}
      className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group block"
    >
      {/* Background Image */}
      <Image
        src={image}
        alt={name}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 50vw, 25vw"
      />

      {/* Default Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 transition-opacity duration-300 group-hover:opacity-0" />

      {/* Ranking Badge - Top Left */}
      {rank && (
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
            <span className="text-white font-bold text-sm sm:text-lg">{rank}</span>
          </div>
        </div>
      )}

      {/* Hover Overlay - Dark with stats */}
      <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col">
        {/* Header */}
        <div className="text-center mb-4">
          <h3 className="text-white text-xl font-bold">{name}</h3>
          <p className="text-white/60 text-sm">{area}</p>
        </div>

        {/* Stats Bars */}
        <div className="flex-1 flex flex-col justify-center space-y-3">
          {/* Population - uses density like PopulationStatRow (max 4000/km²) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-28">
              <span className="text-lg">👥</span>
              <span className="text-white text-sm font-medium">Population</span>
            </div>
            <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getDensityColor(populationDensity)} transition-all duration-500`}
                style={{ width: `${Math.max(10, Math.min((populationDensity / 4000) * 100, 100))}%` }}
              />
            </div>
            <span className="text-white text-sm font-semibold w-10 text-right">{formatPopulation(population)}</span>
          </div>

          {/* Parks and Schools - use THRESHOLDS */}
          {stats.map((stat) => {
            const type = getScoreType(stat.value, stat.category);
            const max = THRESHOLDS[stat.category].max;
            const barWidth = Math.min((stat.value / max) * 100, 100);
            return (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-28">
                  <span className="text-lg">{stat.emoji}</span>
                  <span className="text-white text-sm font-medium">{stat.label}</span>
                </div>
                <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors[type]} transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-white text-sm font-semibold w-10 text-right">{stat.value}</span>
              </div>
            );
          })}

          {/* Crime Per Capita - matching CrimeStatRow max of 150 */}
          {(() => {
            const crimePerCapita = population > 0 ? (neighbourhood.details.crimeTotal / population) * 1000 : 0;
            // Bar width based on per capita (max ~150 per 1,000 for scaling, matching detail page)
            const barWidth = Math.max(5, Math.min((crimePerCapita / 150) * 100, 100));
            return (
              <div className="flex items-center gap-3 group/crime relative">
                <div className="flex items-center gap-2 w-28">
                  <span className="text-lg">🚨</span>
                  <span className="text-white text-sm font-medium">Crime</span>
                </div>
                <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getCrimeBarColor(crimePerCapita)} transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-white text-sm font-semibold w-16 text-right">{crimePerCapita.toFixed(0)}/1K</span>
                {/* Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/crime:opacity-100 transition-opacity whitespace-nowrap z-20">
                  {neighbourhood.details.crimeTotal.toLocaleString()} total crimes
                </div>
              </div>
            );
          })()}

          {/* Average Rent - matching detail page THRESHOLDS.rent.max = 2500 */}
          {(() => {
            const rentType = getRentScoreType(avgRent);
            const rentBarWidth = Math.min((avgRent / 2500) * 100, 100);
            return (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-28">
                  <span className="text-lg">🏠</span>
                  <span className="text-white text-sm font-medium">Avg Rent</span>
                </div>
                <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors[rentType]} transition-all duration-500`}
                    style={{ width: `${rentBarWidth}%` }}
                  />
                </div>
                <span className="text-white text-sm font-semibold w-14 text-right">{formatRent(avgRent)}</span>
              </div>
            );
          })()}

          {/* Hospital Proximity - matching HospitalStatRow (maxDistance = 25) */}
          {(() => {
            const distanceKm = neighbourhood.details.distanceToNearestHospital;
            const maxDistance = 25;
            const hospitalBarWidth = distanceKm !== null
              ? Math.max(10, 100 - (distanceKm / maxDistance) * 100)
              : 0;
            return (
              <div className="flex items-center gap-3 group/hospital relative">
                <div className="flex items-center gap-2 w-28">
                  <span className="text-lg">🏥</span>
                  <span className="text-white text-sm font-medium">Hospital</span>
                </div>
                <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getHospitalDistanceColor(distanceKm)} transition-all duration-500`}
                    style={{ width: `${hospitalBarWidth}%` }}
                  />
                </div>
                <span className="text-white text-sm font-semibold w-14 text-right">
                  {distanceKm !== null ? `${distanceKm}km` : "N/A"}
                </span>
                {/* Tooltip */}
                {neighbourhood.details.nearestHospital && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/hospital:opacity-100 transition-opacity whitespace-nowrap z-20">
                    {neighbourhood.details.nearestHospital}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Footer hint */}
        <div className="text-center mt-4">
          <span className="text-white/50 text-xs">Click for details</span>
        </div>
      </div>

      {/* Default View Content */}
      <div className="absolute inset-0 flex flex-col group-hover:opacity-0 transition-opacity duration-300">
        {/* Center - Name & Area */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2 sm:px-4">
          <h2 className="text-white text-lg sm:text-2xl md:text-3xl font-bold drop-shadow-lg">
            {name}
          </h2>
          <p className="text-white/80 text-xs sm:text-sm mt-1">{area}</p>
        </div>

        {/* Score Badge - Bottom */}
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${getScoreColor(overallScore)} ring-2 ${getScoreRingColor(overallScore)} ring-offset-2 ring-offset-black/50 flex items-center justify-center shadow-lg`}>
            <span className="text-white font-bold text-xs sm:text-sm">{overallScore}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
