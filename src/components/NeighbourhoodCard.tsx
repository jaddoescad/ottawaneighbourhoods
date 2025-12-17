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
  return "bg-red-400";
}

function getBarWidth(value: number, max: number): string {
  const percent = Math.min((value / max) * 100, 100);
  return `${percent}%`;
}

export default function NeighbourhoodCard({
  neighbourhood,
}: NeighbourhoodCardProps) {
  const { id, name, area, image, rank, quickStats } = neighbourhood;

  // Normalize stats for display (out of 100)
  const stats = [
    { label: "Overall", emoji: "⭐", value: neighbourhood.score, max: 100 },
    { label: "Cost", emoji: "💵", value: 100 - (quickStats.avgRent / 25), max: 100 }, // Inverse - lower rent = higher score
    { label: "Internet", emoji: "📡", value: quickStats.internetMbps / 3, max: 100 },
    { label: "Walkability", emoji: "🚶", value: quickStats.walkScore, max: 100 },
    { label: "Safety", emoji: "👮", value: quickStats.safety, max: 100 },
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
        {/* Top Row - Heart and Close */}
        <div className="flex justify-between items-start mb-6">
          <button
            onClick={(e) => e.preventDefault()}
            className="w-10 h-10 rounded-full border-2 border-white/50 flex items-center justify-center hover:border-white transition"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <div className="text-white/70 text-2xl font-light">&times;</div>
        </div>

        {/* Stats Bars */}
        <div className="flex-1 flex flex-col justify-center space-y-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-28">
                <span className="text-lg">{stat.emoji}</span>
                <span className="text-white text-sm font-medium">{stat.label}</span>
              </div>
              <div className="flex-1 h-6 bg-transparent rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getBarColor(stat.value, stat.max)} transition-all duration-500`}
                  style={{ width: getBarWidth(stat.value, stat.max) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Default View Content */}
      <div className="absolute inset-0 flex flex-col group-hover:opacity-0 transition-opacity duration-300">
        {/* Top Left - Rank */}
        <div className="absolute top-4 left-4 flex flex-col">
          <span className="text-white text-2xl font-bold">{rank}</span>
          <div className="w-6 h-0.5 bg-white/80 mt-1" />
        </div>

        {/* Top Right - Internet Speed */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 text-white/90">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3C7.46 3 3.34 4.78.29 7.67c-.18.18-.29.43-.29.71 0 .28.11.53.29.71l2.48 2.48c.32.32.82.38 1.21.16C5.78 10.55 8.77 9.5 12 9.5s6.22 1.05 8.02 2.23c.39.22.89.16 1.21-.16l2.48-2.48c.18-.18.29-.43.29-.71 0-.28-.11-.53-.29-.71C20.66 4.78 16.54 3 12 3zm0 8c-2.7 0-5.19.89-7.21 2.4-.27.2-.43.51-.43.85 0 .28.11.53.29.71l2.48 2.48c.31.31.82.38 1.19.15C9.56 16.63 10.72 16 12 16s2.44.63 3.68 1.59c.37.23.88.16 1.19-.15l2.48-2.48c.18-.18.29-.43.29-.71 0-.34-.16-.65-.43-.85C17.19 11.89 14.7 11 12 11zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
          <div className="flex flex-col items-end">
            <span className="text-lg font-semibold leading-none">{quickStats.internetMbps}</span>
            <span className="text-[10px] text-white/70">Mbps</span>
          </div>
        </div>

        {/* Center - Name & Area */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-white text-2xl md:text-3xl font-bold drop-shadow-lg">
            {name}
          </h2>
          <p className="text-white/80 text-sm mt-1">{area}</p>
        </div>

        {/* Bottom Stats Bar */}
        <div className="p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-lg">🚶</span>
                <span className="font-semibold">{quickStats.walkScore}</span>
              </div>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  quickStats.safety >= 90
                    ? "bg-green-500"
                    : quickStats.safety >= 80
                    ? "bg-yellow-500"
                    : "bg-orange-500"
                }`}
              >
                {quickStats.transit}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold">${quickStats.avgRent.toLocaleString()}</span>
              <span className="text-white/70 text-xs block">/ month</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
