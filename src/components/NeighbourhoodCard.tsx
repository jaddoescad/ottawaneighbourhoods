"use client";

import Image from "next/image";
import Link from "next/link";
import { Neighbourhood } from "@/data/neighbourhoods";

interface NeighbourhoodCardProps {
  neighbourhood: Neighbourhood;
}

function getBarColor(value: number, max: number): string {
  const percent = value / max;
  if (percent >= 0.7) return "bg-green-400";
  if (percent >= 0.5) return "bg-yellow-400";
  return "bg-orange-400";
}

// For crime per capita: Low < 50, Moderate < 150, High >= 150
function getCrimeBarColor(perCapita: number): string {
  if (perCapita < 50) return "bg-green-400";
  if (perCapita < 150) return "bg-yellow-400";
  return "bg-red-400";
}

function getBarWidth(value: number, max: number): string {
  const percent = Math.min((value / max) * 100, 100);
  return `${percent}%`;
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

// For rent: affordable < $1800, moderate < $2200, expensive >= $2200
function getRentBarColor(value: number): string {
  if (value < 1800) return "bg-green-400";
  if (value < 2200) return "bg-yellow-400";
  return "bg-orange-400";
}

// For hospital distance: close < 3km, moderate < 10km, far >= 10km
function getHospitalBarColor(distanceKm: number | null): string {
  if (distanceKm === null) return "bg-gray-400";
  if (distanceKm <= 3) return "bg-green-400";
  if (distanceKm <= 10) return "bg-yellow-400";
  return "bg-orange-400";
}

function getHospitalBarWidth(distanceKm: number | null): string {
  if (distanceKm === null) return "0%";
  // Invert: closer = fuller bar. Max distance ~30km
  const percent = Math.max(5, 100 - (distanceKm / 30) * 100);
  return `${percent}%`;
}

export default function NeighbourhoodCard({
  neighbourhood,
}: NeighbourhoodCardProps) {
  const { id, name, area, image, population, avgRent } = neighbourhood;

  // Regular stats
  const stats = [
    { label: "Population", emoji: "👥", value: population, max: 150000, displayValue: formatPopulation(population) },
    { label: "Parks", emoji: "🌳", value: neighbourhood.details.parks, max: 50 },
    { label: "Schools", emoji: "🏫", value: neighbourhood.details.schools, max: 20 },
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
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
      />

      {/* Default Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 transition-opacity duration-300 group-hover:opacity-0" />

      {/* Hover Overlay - Dark with stats */}
      <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col">
        {/* Header */}
        <div className="text-center mb-4">
          <h3 className="text-white text-xl font-bold">{name}</h3>
          <p className="text-white/60 text-sm">{area}</p>
        </div>

        {/* Stats Bars */}
        <div className="flex-1 flex flex-col justify-center space-y-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-28">
                <span className="text-lg">{stat.emoji}</span>
                <span className="text-white text-sm font-medium">{stat.label}</span>
              </div>
              <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getBarColor(stat.value, stat.max)} transition-all duration-500`}
                  style={{ width: getBarWidth(stat.value, stat.max) }}
                />
              </div>
              <span className="text-white text-sm font-semibold w-10 text-right">{"displayValue" in stat ? stat.displayValue : stat.value}</span>
            </div>
          ))}

          {/* Crime Per Capita */}
          {(() => {
            const crimePerCapita = population > 0 ? (neighbourhood.details.crimeTotal / population) * 1000 : 0;
            return (
              <div className="flex items-center gap-3 group/crime relative">
                <div className="flex items-center gap-2 w-28">
                  <span className="text-lg">🚨</span>
                  <span className="text-white text-sm font-medium">Crime</span>
                </div>
                <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getCrimeBarColor(crimePerCapita)} transition-all duration-500`}
                    style={{ width: `${Math.min((crimePerCapita / 200) * 100, 100)}%` }}
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

          {/* Average Rent */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-28">
              <span className="text-lg">🏠</span>
              <span className="text-white text-sm font-medium">Avg Rent</span>
            </div>
            <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getRentBarColor(avgRent)} transition-all duration-500`}
                style={{ width: getBarWidth(avgRent, 3000) }}
              />
            </div>
            <span className="text-white text-sm font-semibold w-14 text-right">{formatRent(avgRent)}</span>
          </div>

          {/* Hospital Proximity */}
          <div className="flex items-center gap-3 group/hospital relative">
            <div className="flex items-center gap-2 w-28">
              <span className="text-lg">🏥</span>
              <span className="text-white text-sm font-medium">Hospital</span>
            </div>
            <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getHospitalBarColor(neighbourhood.details.distanceToNearestHospital)} transition-all duration-500`}
                style={{ width: getHospitalBarWidth(neighbourhood.details.distanceToNearestHospital) }}
              />
            </div>
            <span className="text-white text-sm font-semibold w-14 text-right">
              {neighbourhood.details.distanceToNearestHospital !== null ? `${neighbourhood.details.distanceToNearestHospital}km` : "N/A"}
            </span>
            {/* Tooltip */}
            {neighbourhood.details.nearestHospital && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/hospital:opacity-100 transition-opacity whitespace-nowrap z-20">
                {neighbourhood.details.nearestHospital}
              </div>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <div className="text-center mt-4">
          <span className="text-white/50 text-xs">Click for details</span>
        </div>
      </div>

      {/* Default View Content */}
      <div className="absolute inset-0 flex flex-col group-hover:opacity-0 transition-opacity duration-300">
        {/* Center - Name & Area */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-white text-2xl md:text-3xl font-bold drop-shadow-lg">
            {name}
          </h2>
          <p className="text-white/80 text-sm mt-1">{area}</p>
        </div>

        {/* Bottom Stats Bar - Real data only */}
        <div className="p-4">
          <div className="flex items-center justify-center gap-3 text-white text-sm">
            <div className="flex items-center gap-1">
              <span>👥</span>
              <span className="font-semibold">{formatPopulation(population)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🌳</span>
              <span className="font-semibold">{neighbourhood.details.parks}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🏫</span>
              <span className="font-semibold">{neighbourhood.details.schools}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
