"use client";

import Image from "next/image";
import Link from "next/link";
import { Neighbourhood } from "@/data/neighbourhoods";

export type MetricType =
  | "crime"
  | "safety"
  | "rent"
  | "schools"
  | "transit"
  | "walk"
  | "bike"
  | "parks"
  | "amenities"
  | "hospital"
  | "density"
  | "trees"
  | "food"
  | "nature"
  | null;

interface NeighbourhoodCardProps {
  neighbourhood: Neighbourhood;
  rank?: number;
  metric?: MetricType;
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

// Helper to get score color for 0-100 scores
function getMetricScoreColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-500";
}

export default function NeighbourhoodCard({
  neighbourhood,
  rank,
  metric = null,
}: NeighbourhoodCardProps) {
  const { id, name, area, image, population, populationDensity, avgRent, overallScore } = neighbourhood;

  // Calculate crime per capita for display
  const crimePerCapita = population > 0 ? (neighbourhood.details.crimeTotal / population) * 1000 : 0;

  // Get metric badge content based on metric type
  const getMetricBadge = (): { icon: string; label: string; value: string; color: string } | null => {
    if (!metric) return null;

    switch (metric) {
      case "crime":
        const crimeLabel = crimePerCapita >= 150 ? "High Crime" : crimePerCapita >= 50 ? "Moderate" : "Low Crime";
        return {
          icon: "🚨",
          label: crimeLabel,
          value: `${crimePerCapita.toFixed(0)}/1K`,
          color: getCrimeBarColor(crimePerCapita),
        };
      case "safety":
        const safetyScore = neighbourhood.categoryScores?.safety || 0;
        const safetyLabel = safetyScore >= 80 ? "Very Safe" : safetyScore >= 60 ? "Safe" : safetyScore >= 40 ? "Moderate" : "Less Safe";
        return {
          icon: "🛡️",
          label: safetyLabel,
          value: `${Math.round(safetyScore)}/100`,
          color: getMetricScoreColor(safetyScore),
        };
      case "rent":
        const rentLabel = avgRent <= 1600 ? "Very Affordable" : avgRent <= 1800 ? "Affordable" : avgRent <= 2100 ? "Moderate" : "Premium";
        return {
          icon: "💰",
          label: rentLabel,
          value: `$${avgRent.toLocaleString()}/mo`,
          color: colors[getRentScoreType(avgRent)],
        };
      case "schools":
        const schoolScore = neighbourhood.categoryScores?.schools || 0;
        const schoolLabel = schoolScore >= 80 ? "Top Schools" : schoolScore >= 60 ? "Great Schools" : schoolScore >= 40 ? "Good Schools" : "Some Schools";
        return {
          icon: "🎓",
          label: schoolLabel,
          value: `${Math.round(schoolScore)}/100`,
          color: getMetricScoreColor(schoolScore),
        };
      case "transit":
        const transitLabel = neighbourhood.transitScore >= 80 ? "Excellent Transit" : neighbourhood.transitScore >= 60 ? "Great Transit" : neighbourhood.transitScore >= 40 ? "Some Transit" : "Car Dependent";
        return {
          icon: "🚇",
          label: transitLabel,
          value: `${neighbourhood.transitScore}/100`,
          color: getMetricScoreColor(neighbourhood.transitScore),
        };
      case "walk":
        const walkLabel = neighbourhood.walkScore >= 80 ? "Walker's Paradise" : neighbourhood.walkScore >= 60 ? "Very Walkable" : neighbourhood.walkScore >= 40 ? "Somewhat Walkable" : "Car Dependent";
        return {
          icon: "🚶",
          label: walkLabel,
          value: `${neighbourhood.walkScore}/100`,
          color: getMetricScoreColor(neighbourhood.walkScore),
        };
      case "bike":
        const bikeLabel = neighbourhood.bikeScore >= 80 ? "Biker's Paradise" : neighbourhood.bikeScore >= 60 ? "Very Bikeable" : neighbourhood.bikeScore >= 40 ? "Bikeable" : "Minimal Bike Infra";
        return {
          icon: "🚴",
          label: bikeLabel,
          value: `${neighbourhood.bikeScore}/100`,
          color: getMetricScoreColor(neighbourhood.bikeScore),
        };
      case "parks":
        const parkCount = neighbourhood.details.parks;
        const parkLabel = parkCount >= 25 ? "Park Heaven" : parkCount >= 15 ? "Many Parks" : parkCount >= 8 ? "Some Parks" : "Few Parks";
        return {
          icon: "🌳",
          label: parkLabel,
          value: `${parkCount} parks`,
          color: parkCount >= 20 ? "bg-green-500" : parkCount >= 10 ? "bg-yellow-500" : "bg-orange-500",
        };
      case "amenities":
        const amenityScore = neighbourhood.categoryScores?.amenities || 0;
        const amenityLabel = amenityScore >= 80 ? "Everything Nearby" : amenityScore >= 60 ? "Well Served" : amenityScore >= 40 ? "Some Amenities" : "Limited";
        return {
          icon: "🏪",
          label: amenityLabel,
          value: `${Math.round(amenityScore)}/100`,
          color: getMetricScoreColor(amenityScore),
        };
      case "hospital":
        const dist = neighbourhood.details.distanceToNearestHospital;
        const hospitalLabel = dist === null ? "N/A" : dist <= 3 ? "Very Close" : dist <= 5 ? "Nearby" : dist <= 10 ? "Moderate" : "Far";
        return {
          icon: "🏥",
          label: hospitalLabel,
          value: dist !== null ? `${dist} km away` : "N/A",
          color: getHospitalDistanceColor(dist),
        };
      case "density":
        const densityLabel = populationDensity >= 5000 ? "Very Urban" : populationDensity >= 3000 ? "Urban" : populationDensity >= 1500 ? "Suburban" : "Spacious";
        return {
          icon: "🏙️",
          label: densityLabel,
          value: `${Math.round(populationDensity).toLocaleString()}/km²`,
          color: getDensityColor(populationDensity),
        };
      case "trees":
        const treeScore = neighbourhood.metricScores?.treeCanopy || 0;
        const treeLabel = treeScore >= 80 ? "Lush Canopy" : treeScore >= 60 ? "Well Treed" : treeScore >= 40 ? "Some Trees" : "Few Trees";
        return {
          icon: "🌲",
          label: treeLabel,
          value: `${Math.round(treeScore)}/100`,
          color: getMetricScoreColor(treeScore),
        };
      case "food":
        const restaurants = neighbourhood.details.restaurants || 0;
        const foodLabel = restaurants >= 80 ? "Foodie Heaven" : restaurants >= 40 ? "Great Dining" : restaurants >= 15 ? "Some Options" : "Limited Dining";
        return {
          icon: "🍽️",
          label: foodLabel,
          value: `${restaurants} spots`,
          color: restaurants >= 50 ? "bg-green-500" : restaurants >= 20 ? "bg-yellow-500" : "bg-orange-500",
        };
      case "nature":
        const natureScore = neighbourhood.categoryScores?.nature || 0;
        const natureLabel = natureScore >= 80 ? "Nature Lover's Dream" : natureScore >= 60 ? "Great Outdoors" : natureScore >= 40 ? "Some Nature" : "Urban";
        return {
          icon: "🦆",
          label: natureLabel,
          value: `${Math.round(natureScore)}/100`,
          color: getMetricScoreColor(natureScore),
        };
      default:
        return null;
    }
  };

  const metricBadge = getMetricBadge();

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

          {/* Metric Badge - Under name */}
          {metricBadge && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full ${metricBadge.color} shadow-lg mt-2 sm:mt-3`}>
              <span className="text-xs sm:text-sm">{metricBadge.icon}</span>
              <span className="text-white font-semibold text-xs sm:text-sm">{metricBadge.label}</span>
              <span className="text-white/60 text-xs hidden sm:inline">•</span>
              <span className="text-white/90 text-xs hidden sm:inline">{metricBadge.value}</span>
            </div>
          )}
        </div>

        {/* Score Badge - Bottom Right - Only show when no metric filter is applied */}
        {!metric && (
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${getScoreColor(overallScore)} ring-2 ${getScoreRingColor(overallScore)} ring-offset-2 ring-offset-black/50 flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold text-xs sm:text-sm">{overallScore}</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
