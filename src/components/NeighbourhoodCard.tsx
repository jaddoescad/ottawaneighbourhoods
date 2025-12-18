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

// For crime totals: Low < 1500, Moderate < 5000, High >= 5000
function getCrimeBarColor(value: number): string {
  if (value < 1500) return "bg-green-400";
  if (value < 5000) return "bg-yellow-400";
  return "bg-red-400";
}

function getBarWidth(value: number, max: number): string {
  const percent = Math.min((value / max) * 100, 100);
  return `${percent}%`;
}

export default function NeighbourhoodCard({
  neighbourhood,
}: NeighbourhoodCardProps) {
  const { id, name, area, image } = neighbourhood;

  // Regular stats
  const stats = [
    { label: "Parks", emoji: "🌳", value: neighbourhood.details.parks, max: 50 },
    { label: "Schools", emoji: "🏫", value: neighbourhood.details.schools, max: 20 },
    { label: "Libraries", emoji: "📚", value: neighbourhood.details.libraries, max: 5 },
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
        <div className="text-center mb-6">
          <h3 className="text-white text-xl font-bold">{name}</h3>
          <p className="text-white/60 text-sm">{area}</p>
        </div>

        {/* Stats Bars */}
        <div className="flex-1 flex flex-col justify-center space-y-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-24">
                <span className="text-lg">{stat.emoji}</span>
                <span className="text-white text-sm font-medium">{stat.label}</span>
              </div>
              <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getBarColor(stat.value, stat.max)} transition-all duration-500`}
                  style={{ width: getBarWidth(stat.value, stat.max) }}
                />
              </div>
              <span className="text-white text-sm font-semibold w-8 text-right">{stat.value}</span>
            </div>
          ))}

          {/* Crime Total */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-24">
              <span className="text-lg">🚨</span>
              <span className="text-white text-sm font-medium">Crime</span>
            </div>
            <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getCrimeBarColor(neighbourhood.details.crimeTotal)} transition-all duration-500`}
                style={{ width: getBarWidth(neighbourhood.details.crimeTotal, 15000) }}
              />
            </div>
            <span className="text-white text-sm font-semibold w-8 text-right">{neighbourhood.details.crimeTotal}</span>
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
          <div className="flex items-center justify-center gap-4 text-white">
            <div className="flex items-center gap-1">
              <span className="text-base">🌳</span>
              <span className="font-semibold">{neighbourhood.details.parks}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-base">🏫</span>
              <span className="font-semibold">{neighbourhood.details.schools}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-base">📚</span>
              <span className="font-semibold">{neighbourhood.details.libraries}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-base">🚨</span>
              <span className="font-semibold">{neighbourhood.details.crimeTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
