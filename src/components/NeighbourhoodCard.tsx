"use client";

import Image from "next/image";
import Link from "next/link";
import { Neighbourhood } from "@/data/neighbourhoods";

export type MetricType =
  | "crime"
  | "safety"
  | "rent"
  | "schools"
  | "elementary-schools"
  | "high-schools"
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
  | "income"
  | "immigrants"
  | "visible-minorities"
  | null;

interface NeighbourhoodCardProps {
  neighbourhood: Neighbourhood;
  rank?: number;
  metric?: MetricType;
  /** Overrides the published overall score (e.g. when ranking with custom weights). */
  score?: number;
  tierText?: string | null;
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
  score,
  tierText = null,
}: NeighbourhoodCardProps) {
  const { id, name, area, image, population, populationDensity, avgRent } = neighbourhood;
  const overallScore = score ?? neighbourhood.overallScore;

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
        if (avgRent === null) {
          return { icon: "💰", label: "Rent", value: "n/a", color: "bg-gray-400" };
        }
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
      case "elementary-schools":
        const elemScore = neighbourhood.details.avgEqaoScoreElementary || 0;
        const elemLabel = elemScore >= 80 ? "Top" : elemScore >= 70 ? "Great" : elemScore >= 60 ? "Good" : "Okay";
        return {
          icon: "🎒",
          label: elemLabel,
          value: `${Math.round(elemScore)}% EQAO`,
          color: getMetricScoreColor(elemScore),
        };
      case "high-schools":
        const highScore = neighbourhood.details.avgEqaoScoreSecondary || 0;
        const highLabel = highScore >= 80 ? "Top" : highScore >= 70 ? "Great" : highScore >= 60 ? "Good" : "Okay";
        return {
          icon: "🎓",
          label: highLabel,
          value: `${Math.round(highScore)}% EQAO`,
          color: getMetricScoreColor(highScore),
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
        const bike = neighbourhood.bikeScore;
        if (bike === null) {
          return { icon: "🚴", label: "No Bike Score", value: "n/a", color: "bg-gray-400" };
        }
        const bikeLabel = bike >= 80 ? "Biker's Paradise" : bike >= 60 ? "Very Bikeable" : bike >= 40 ? "Bikeable" : "Minimal Bike Infra";
        return {
          icon: "🚴",
          label: bikeLabel,
          value: `${bike}/100`,
          color: getMetricScoreColor(bike),
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
      case "income":
        const income = neighbourhood.medianIncome || 0;
        const incomeLabel = income >= 150000 ? "Wealthy" : income >= 120000 ? "High Income" : income >= 90000 ? "Above Average" : "Average";
        return {
          icon: "💵",
          label: incomeLabel,
          value: `$${(income / 1000).toFixed(0)}K`,
          color: income >= 150000 ? "bg-green-500" : income >= 120000 ? "bg-green-400" : income >= 90000 ? "bg-yellow-400" : "bg-orange-500",
        };
      case "immigrants":
        const immigrantPct = neighbourhood.pctImmigrants || 0;
        const immigrantLabel = immigrantPct >= 40 ? "Very Diverse" : immigrantPct >= 30 ? "Diverse" : immigrantPct >= 20 ? "Mixed" : "Less Diverse";
        return {
          icon: "🌍",
          label: immigrantLabel,
          value: `${immigrantPct.toFixed(0)}%`,
          color: immigrantPct >= 40 ? "bg-green-500" : immigrantPct >= 30 ? "bg-green-400" : immigrantPct >= 20 ? "bg-yellow-400" : "bg-gray-400",
        };
      case "visible-minorities":
        const racializedPct = neighbourhood.pctRacialized || 0;
        const racializedLabel = racializedPct >= 50 ? "Very Diverse" : racializedPct >= 35 ? "Diverse" : racializedPct >= 20 ? "Mixed" : "Less Diverse";
        return {
          icon: "👥",
          label: racializedLabel,
          value: `${racializedPct.toFixed(0)}%`,
          color: racializedPct >= 50 ? "bg-green-500" : racializedPct >= 35 ? "bg-green-400" : racializedPct >= 20 ? "bg-yellow-400" : "bg-gray-400",
        };
      default:
        return null;
    }
  };

  const metricBadge = getMetricBadge();

  return (
    <Link
      href={`/neighbourhood/${id}`}
      className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer block"
    >
      <Image
        src={image}
        alt={name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 50vw, 25vw"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

      {rank && (
        <div className="absolute top-2 left-2 z-10">
          <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
            <span className="text-white font-bold text-sm">{rank}</span>
          </div>
        </div>
      )}

      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <h2 className="text-white text-lg font-bold drop-shadow-lg">{name}</h2>
          <p className="text-white/80 text-xs mt-1">{area}</p>

          {metricBadge && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${metricBadge.color} shadow-lg mt-2`}>
              <span className="text-sm">{metricBadge.icon}</span>
              <span className="text-white font-semibold text-sm">{metricBadge.label}</span>
            </div>
          )}
        </div>

        {!metric && tierText && (
          <div className="absolute bottom-3 left-2">
            <span className="text-[10px] font-semibold text-white bg-black/50 backdrop-blur-sm border border-white/20 px-2 py-0.5 rounded-full">
              {tierText}
            </span>
          </div>
        )}

        {!metric && (
          <div className="absolute bottom-2 right-2">
            <div className={`w-10 h-10 rounded-full ${getScoreColor(overallScore)} ring-2 ${getScoreRingColor(overallScore)} ring-offset-2 ring-offset-black/50 flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold text-xs">{overallScore}</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
