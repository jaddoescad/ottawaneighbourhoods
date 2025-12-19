import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { neighbourhoods } from "@/data/neighbourhoods";
import ExpandableStatRow from "@/components/ExpandableStatRow";
import StatRow from "@/components/StatRow";
import CrimeStatRow from "@/components/CrimeStatRow";
import EqaoStatRow from "@/components/EqaoStatRow";
import WalkScoreRow from "@/components/WalkScoreRow";
import AgeDemographicsRow from "@/components/AgeDemographicsRow";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import BusStopsRow from "@/components/BusStopsRow";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return neighbourhoods.map((n) => ({ id: n.id }));
}

// Thresholds for each category
const THRESHOLDS = {
  parks: { max: 25, great: 20, okay: 10 },
  schools: { max: 15, great: 12, okay: 6 },
  libraries: { max: 2, great: 2, okay: 1 },
  trails: { max: 20, great: 12, okay: 5 },
  restaurantsCafesDensity: { max: 12, great: 8, okay: 3 }, // places per km²
  groceryStoreDensity: { max: 1, great: 0.5, okay: 0.2 }, // stores per km²
  gymDensity: { max: 1, great: 0.5, okay: 0.2 }, // gyms per km²
  income: { max: 130000, great: 110000, okay: 80000 },
  rent: { max: 2500, great: 1800, okay: 2000 }, // Lower is better for rent
  homePrice: { max: 1200000, great: 600000, okay: 800000 }, // Lower is better for home price
  population: { max: 150000, great: 50000, okay: 20000 },
  populationDensity: { max: 6000, great: 3000, okay: 1000 }, // people per km²
  commuteTime: { max: 60, great: 15, okay: 30 }, // Lower is better for commute
};

// Determine bar color based on thresholds
function getScoreType(value: number, category: keyof typeof THRESHOLDS): "great" | "good" | "okay" | "bad" {
  const t = THRESHOLDS[category];
  if (value >= t.great) return "great";
  if (value >= t.okay) return "okay";
  return "bad";
}

// For rent, lower is better (inverted scoring)
function getRentScoreType(value: number): "great" | "good" | "okay" | "bad" {
  if (value <= 1800) return "great";
  if (value <= 2000) return "okay";
  return "bad";
}

// For home price, lower is better (inverted scoring)
function getHomePriceScoreType(value: number): "great" | "good" | "okay" | "bad" {
  if (value <= 600000) return "great";
  if (value <= 800000) return "okay";
  return "bad";
}

// For commute time, lower is better (inverted scoring)
function getCommuteScoreType(minutes: number): "great" | "good" | "okay" | "bad" {
  if (minutes <= 15) return "great";
  if (minutes <= 30) return "okay";
  return "bad";
}

// Commute time as percentage (inverse - shorter = higher bar)
function getCommutePercent(minutes: number): number {
  const maxMinutes = 60;
  return Math.max(5, 100 - (minutes / maxMinutes) * 100);
}

// For hospital distance, lower is better (inverted scoring)
function getHealthcareScoreType(distanceKm: number | null): "great" | "good" | "okay" | "bad" | "neutral" {
  if (distanceKm === null) return "neutral";
  if (distanceKm <= 3) return "great";
  if (distanceKm <= 8) return "good";
  if (distanceKm <= 15) return "okay";
  return "bad";
}

// Hospital distance as percentage (inverse - closer = higher bar)
function getHealthcarePercent(distanceKm: number | null): number {
  if (distanceKm === null) return 0;
  // Max distance ~30km, invert so closer = fuller bar
  const maxDistance = 30;
  return Math.max(5, 100 - (distanceKm / maxDistance) * 100);
}

// Calculate bar percentage based on threshold max
function getPercent(value: number, category: keyof typeof THRESHOLDS): number {
  const max = THRESHOLDS[category].max;
  return Math.min((value / max) * 100, 100);
}

export default async function NeighbourhoodPage({ params }: PageProps) {
  const { id } = await params;
  const neighbourhood = neighbourhoods.find((n) => n.id === id);

  if (!neighbourhood) {
    notFound();
  }

  const { name, area, image, population, populationDensity, medianIncome, avgRent, avgHomePrice, walkScore, transitScore, bikeScore, pctChildren, pctYoungProfessionals, pctSeniors, commuteToDowntown, details, overallScore, categoryScores, scoreWeights } = neighbourhood;
  const trails = details.parksData
    .filter((park) => park.category === "Linear Park")
    .map((park) => park.name);

  // Format numbers
  const formattedPopulation = population.toLocaleString();
  const formattedIncome = medianIncome.toLocaleString();
  const formattedRent = avgRent.toLocaleString();
  const formattedHomePrice = avgHomePrice.toLocaleString();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-[35vh] min-h-[280px]">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />

        {/* Back Button */}
        <Link
          href="/"
          className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/40 transition"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-1 sm:mb-2">{name}</h1>
            <p className="text-white/80 text-sm sm:text-lg">{area}</p>
            <div className="mt-2 sm:mt-3 flex flex-wrap justify-center gap-2 sm:gap-3">
              <ScoreBreakdown
                overallScore={overallScore}
                categoryScores={categoryScores}
                scoreWeights={scoreWeights}
              />
              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                <span className="text-base sm:text-xl">👥</span>
                <span className="text-white font-semibold text-sm sm:text-base">{formattedPopulation} residents</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Real Data Only */}
      <div className="max-w-5xl mx-auto px-2 sm:px-6 py-4 sm:py-8">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <WalkScoreRow
            walkScore={walkScore}
            transitScore={transitScore}
            bikeScore={bikeScore}
          />
          <StatRow
            icon="👥"
            label="Population"
            value={`${formattedPopulation} residents`}
            percent={getPercent(population, "population")}
            type={getScoreType(population, "population")}
            labelSet="population"
          />
          <StatRow
            icon="📊"
            label="Density"
            value={`${populationDensity.toLocaleString()}/km²`}
            percent={getPercent(populationDensity, "populationDensity")}
            type={getScoreType(populationDensity, "populationDensity")}
            labelSet="density"
          />
          <AgeDemographicsRow
            pctChildren={pctChildren}
            pctYoungProfessionals={pctYoungProfessionals}
            pctSeniors={pctSeniors}
          />
          <ExpandableStatRow
            icon="🌳"
            label="Parks"
            value={`${details.parks} parks`}
            percent={getPercent(details.parks, "parks")}
            type={getScoreType(details.parks, "parks")}
            items={details.parksList}
            itemLabel="parks"
          />
          <ExpandableStatRow
            icon="🏫"
            label="Schools"
            value={`${details.schools} schools`}
            percent={getPercent(details.schools, "schools")}
            type={getScoreType(details.schools, "schools")}
            items={details.schoolsList}
            itemLabel="schools"
          />
          <EqaoStatRow
            avgScore={details.avgEqaoScore}
            schoolsWithScores={details.schoolsWithEqaoScores}
            schools={details.schoolsData.map(s => ({
              name: s.name,
              eqaoScore: s.eqaoScore,
              category: s.category,
            }))}
          />
          <ExpandableStatRow
            icon="📚"
            label="Libraries"
            value={`${details.libraries} ${details.libraries === 1 ? 'library' : 'libraries'}`}
            percent={getPercent(details.libraries, "libraries")}
            type={getScoreType(details.libraries, "libraries")}
            items={details.librariesList}
            itemLabel="libraries"
          />
          <ExpandableStatRow
            icon="🚴"
            label="Trails"
            value={`${trails.length} trails`}
            percent={getPercent(trails.length, "trails")}
            type={trails.length > 0 ? getScoreType(trails.length, "trails") : "neutral"}
            items={trails}
            itemLabel="trails"
          />
          <ExpandableStatRow
            icon="🍽️"
            label="Restaurants & Cafés"
            value={
              details.restaurantsAndCafes !== null && details.restaurantsAndCafesDensity !== null
                ? `${details.restaurantsAndCafes} (${details.restaurantsAndCafesDensity}/km²)`
                : "N/A"
            }
            percent={
              details.restaurantsAndCafesDensity !== null
                ? getPercent(details.restaurantsAndCafesDensity, "restaurantsCafesDensity")
                : 0
            }
            type={
              details.restaurantsAndCafesDensity !== null
                ? getScoreType(details.restaurantsAndCafesDensity, "restaurantsCafesDensity")
                : "neutral"
            }
            items={[]}
            itemLabel="places"
          />
          <ExpandableStatRow
            icon="🛒"
            label="Grocery Stores"
            value={
              details.groceryStores !== null && details.groceryStoreDensity !== null
                ? `${details.groceryStores} (${details.groceryStoreDensity}/km²)`
                : "N/A"
            }
            percent={
              details.groceryStoreDensity !== null
                ? getPercent(details.groceryStoreDensity, "groceryStoreDensity")
                : 0
            }
            type={
              details.groceryStoreDensity !== null
                ? getScoreType(details.groceryStoreDensity, "groceryStoreDensity")
                : "neutral"
            }
            items={details.groceryStoresList || []}
            itemLabel="stores"
          />
          <ExpandableStatRow
            icon="🏋️"
            label="Gyms & Fitness"
            value={
              details.gyms !== null && details.gymDensity !== null
                ? `${details.gyms} (${details.gymDensity}/km²)`
                : "N/A"
            }
            percent={
              details.gymDensity !== null
                ? getPercent(details.gymDensity, "gymDensity")
                : 0
            }
            type={
              details.gymDensity !== null
                ? getScoreType(details.gymDensity, "gymDensity")
                : "neutral"
            }
            items={details.gymsList || []}
            itemLabel="gyms"
          />
          <BusStopsRow
            totalStops={details.busStops}
            stopsWithShelter={details.stopsWithShelter}
            stopsWithBench={details.stopsWithBench}
            density={details.busStopDensity}
          />
          <StatRow
            icon="🚗"
            label="Commute"
            value={`${commuteToDowntown} min`}
            percent={getCommutePercent(commuteToDowntown)}
            type={getCommuteScoreType(commuteToDowntown)}
            labelSet="commute"
            tooltip="Average commute time to downtown Ottawa"
          />
          <StatRow
            icon="🏥"
            label="Hospital"
            value={details.distanceToNearestHospital !== null ? `${details.distanceToNearestHospital} km` : "N/A"}
            percent={getHealthcarePercent(details.distanceToNearestHospital)}
            type={getHealthcareScoreType(details.distanceToNearestHospital)}
            labelSet="healthcare"
          />
          <CrimeStatRow
            total={details.crimeTotal}
            byCategory={details.crimeByCategory}
            population={population}
          />
          <StatRow
            icon="💰"
            label="Income"
            value={`$${formattedIncome}`}
            percent={getPercent(medianIncome, "income")}
            type={getScoreType(medianIncome, "income")}
          />
          <StatRow
            icon="🏠"
            label="Rent"
            value={`$${formattedRent}/mo`}
            percent={getPercent(avgRent, "rent")}
            type={getRentScoreType(avgRent)}
            labelSet="rent"
          />
          <StatRow
            icon="🏡"
            label="Home Price"
            value={`$${formattedHomePrice}`}
            percent={getPercent(avgHomePrice, "homePrice")}
            type={getHomePriceScoreType(avgHomePrice)}
            labelSet="homePrice"
          />
        </div>
      </div>
    </div>
  );
}
