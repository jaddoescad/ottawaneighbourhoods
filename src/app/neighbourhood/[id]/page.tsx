import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { neighbourhoods } from "@/data/neighbourhoods";
import { neighbourhoodMeta, defaultMeta } from "@/data/neighbourhood-meta";
import ExpandableStatRow from "@/components/ExpandableStatRow";
import StatRow from "@/components/StatRow";
import PopulationStatRow from "@/components/PopulationStatRow";
import CrimeStatRow from "@/components/CrimeStatRow";
import CollisionStatRow from "@/components/CollisionStatRow";
import OverdoseStatRow from "@/components/OverdoseStatRow";
import EqaoStatRow from "@/components/EqaoStatRow";
import WalkScoreRow from "@/components/WalkScoreRow";
import AgeDemographicsRow from "@/components/AgeDemographicsRow";
import DiversityStatRow from "@/components/DiversityStatRow";
import BusStopsRow from "@/components/BusStopsRow";
import TransitInfoRow from "@/components/TransitInfoRow";
import ParksStatRow from "@/components/ParksStatRow";
import GreenspaceStatRow from "@/components/GreenspaceStatRow";
import SchoolsStatRow from "@/components/SchoolsStatRow";
import EducationStatRow from "@/components/EducationStatRow";
import IncomeStatRow from "@/components/IncomeStatRow";
import HospitalStatRow from "@/components/HospitalStatRow";
import LibrariesStatRow from "@/components/LibrariesStatRow";
import TrailsStatRow from "@/components/TrailsStatRow";
import CyclingInfraStatRow from "@/components/CyclingInfraStatRow";
import RoadQualityStatRow from "@/components/RoadQualityStatRow";
import NoiseStatRow from "@/components/NoiseStatRow";
import DevelopmentStatRow from "@/components/DevelopmentStatRow";
import ServiceRequestsStatRow from "@/components/ServiceRequestsStatRow";
import FoodEstablishmentsStatRow from "@/components/FoodEstablishmentsStatRow";
import GroceryStoresStatRow from "@/components/GroceryStoresStatRow";
import GymStatRow from "@/components/GymStatRow";
import RecreationFacilitiesStatRow from "@/components/RecreationFacilitiesStatRow";
import SportsCourtsStatRow from "@/components/SportsCourtsStatRow";
import EquityStatRow from "@/components/EquityStatRow";
import HealthStatRow from "@/components/HealthStatRow";
import FoodInspectionStatRow from "@/components/FoodInspectionStatRow";
import FoodCostBurdenStatRow from "@/components/FoodCostBurdenStatRow";
import CoverageButton from "@/components/CoverageButton";

const BASE_URL = "https://ottawahoods.com";

// Data sources for attribution
const DATA_SOURCES = {
  parks: {
    name: "City of Ottawa Open Data",
    url: "https://open.ottawa.ca/datasets/parks-and-greenspace",
  },
  schools: {
    name: "City of Ottawa Open Data",
    url: "https://open.ottawa.ca/search?tags=school",
  },
  libraries: {
    name: "City of Ottawa Open Data",
    url: "https://open.ottawa.ca/datasets/ottawa-public-library-locations-2024",
  },
  trails: {
    name: "NCC Greenbelt & City of Ottawa",
    url: "https://ncc-ccn.gc.ca/places/greenbelt",
  },
  food: {
    name: "Ottawa Public Health",
    url: "https://inspections.ottawapublichealth.ca/",
  },
  gyms: {
    name: "OpenStreetMap",
    url: "https://www.openstreetmap.org/",
  },
  recreation: {
    name: "City of Ottawa Open Data",
    url: "https://open.ottawa.ca/datasets/city-facilities",
  },
  sportsCourts: {
    name: "City of Ottawa Parks Inventory",
    url: "https://open.ottawa.ca/datasets/parks-inventory",
  },
  crime: {
    name: "Ottawa Police Open Data",
    url: "https://data.ottawapolice.ca/",
  },
  collisions: {
    name: "City of Ottawa Open Data",
    url: "https://open.ottawa.ca/datasets/traffic-collision-data",
  },
  overdose: {
    name: "Ottawa Public Health",
    url: "https://open.ottawa.ca/datasets/ottawa::confirmed-drug-overdose-ed-visits-by-ons-neighbourhood-of-patient",
  },
  eqao: {
    name: "Ontario Open Data (EQAO)",
    url: "https://data.ontario.ca/dataset/school-information-and-student-demographics",
  },
  census: {
    name: "Statistics Canada 2021 Census",
    url: "https://www12.statcan.gc.ca/census-recensement/2021/dp-pd/prof/index.cfm",
  },
  walkScore: {
    name: "Ottawa Open Data & OC Transpo GTFS",
    url: "https://open.ottawa.ca",
  },
  busStops: {
    name: "OC Transpo / City of Ottawa",
    url: "https://open.ottawa.ca/datasets/ottawa::oc-transpo-schedules",
  },
  transitStations: {
    name: "City of Ottawa Open Data",
    url: "https://open.ottawa.ca/search?tags=o-train",
  },
};

// Pre-compute rankings (sorted by score descending)
const rankedNeighbourhoods = [...neighbourhoods]
  .sort((a, b) => b.overallScore - a.overallScore)
  .map((n, index) => ({ ...n, rank: index + 1 }));

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return neighbourhoods.map((n) => ({ id: n.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const neighbourhood = rankedNeighbourhoods.find((n) => n.id === id);

  if (!neighbourhood) {
    return {
      title: "Neighbourhood Not Found | OttawaHoods",
    };
  }

  const { name, image, rank } = neighbourhood;
  const meta = neighbourhoodMeta[id] || defaultMeta;
  const ogImage = image.startsWith("http") ? image : `${BASE_URL}${image}`;

  // Dynamic title with rank
  const ogTitle = `${name} Ranked #${rank} Neighbourhood in Ottawa`;
  const title = `${name} Ranked #${rank} Neighbourhood in Ottawa | OttawaHoods`;
  const description = meta.metaDescription.replace("{rank}", String(rank));

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: meta.ogDescription,
      url: `${BASE_URL}/neighbourhood/${id}`,
      siteName: "OttawaHoods",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${name} neighbourhood in Ottawa`,
        },
      ],
      locale: "en_CA",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: meta.ogDescription,
      images: [ogImage],
    },
  };
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
// Thresholds: <= 3km very close, <= 5km close, <= 8km medium, > 8km far
function getHealthcareScoreType(distanceKm: number | null): "great" | "good" | "okay" | "bad" | "neutral" {
  if (distanceKm === null) return "neutral";
  if (distanceKm <= 3) return "great";
  if (distanceKm <= 5) return "good";
  if (distanceKm <= 8) return "okay";
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

  const { name, area, image, population, populationDensity, households, pop2021, dataYear, dataSource, medianIncome, avgRent, avgHomePrice, walkScore, transitScore, bikeScore, pctChildren, pctYoungProfessionals, pctSeniors, commuteToDowntown, commuteByTransit, nearestOTrainStation, nearestOTrainLine, distanceToOTrain, nearestTransitwayStation, distanceToTransitway, overdoseCumulative, overdoseYearlyAvg, overdoseRatePer100k, overdoseYears, details, overallScore, categoryScores, scoreWeights, boundaries } = neighbourhood;

  // Combine Linear Parks and NCC Greenbelt trails
  const linearParks = details.parksData
    .filter((park) => park.category === "Linear Park")
    .map((park) => park.name);
  const greenbeltTrails = details.greenbeltTrailsList || [];
  const allTrails = [...linearParks, ...greenbeltTrails];
  const greenbeltLengthKm = details.greenbeltTrailsLengthKm || 0;

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

        {/* Coverage Button */}
        <div className="absolute top-6 right-6">
          <CoverageButton
            neighbourhoodName={name}
            boundaries={boundaries || []}
          />
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-1 sm:mb-2">{name}</h1>
            <p className="text-white/80 text-sm sm:text-lg">{area}</p>
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
          <PopulationStatRow
            population={population}
            populationDensity={populationDensity}
            households={households}
            pop2021={pop2021}
            dataYear={dataYear}
            dataSource={dataSource}
            percent={getPercent(population, "population")}
            type={getScoreType(population, "population")}
            boundaries={boundaries}
            neighbourhoodName={name}
          />
          <AgeDemographicsRow
            pctChildren={pctChildren}
            pctYoungProfessionals={pctYoungProfessionals}
            pctSeniors={pctSeniors}
            boundaries={boundaries}
            neighbourhoodName={name}
          />
          <DiversityStatRow
            pctImmigrants={neighbourhood.pctImmigrants}
            pctRacialized={neighbourhood.pctRacialized}
            boundaries={boundaries}
            neighbourhoodName={name}
          />
          <EquityStatRow
            neiScore={neighbourhood.neiScore}
          />
          <HealthStatRow
            nearestHospital={details.nearestHospital}
            distanceToHospital={details.distanceToNearestHospital}
            overdoseRatePer100k={overdoseRatePer100k}
            neiScore={neighbourhood.neiScore}
            primaryCareAccess={neighbourhood.primaryCareAccess}
            diabetesPrevalence={neighbourhood.diabetesPrevalence}
            asthmaPrevalence={neighbourhood.asthmaPrevalence}
            copdPrevalence={neighbourhood.copdPrevalence}
            hypertensionPrevalence={neighbourhood.hypertensionPrevalence}
            mentalHealthEdRate={neighbourhood.mentalHealthEdRate}
            prematureMortality={neighbourhood.prematureMortality}
            hospitalAdmissionRate={neighbourhood.hospitalAdmissionRate}
            healthDataYear={neighbourhood.healthDataYear}
            healthDataSource={neighbourhood.healthDataSource}
            population={population}
          />
          <ParksStatRow
            parksCount={details.parks}
            parksList={details.parksList}
            parksData={details.parksData}
            percent={getPercent(details.parks, "parks")}
            type={getScoreType(details.parks, "parks")}
            source={DATA_SOURCES.parks}
            boundaries={boundaries}
            neighbourhoodName={name}
          />
          <GreenspaceStatRow
            treeCanopy={neighbourhood.treeCanopy}
            treeEquityScore={neighbourhood.treeEquityScore}
            treeEquityPriorityAreas={neighbourhood.treeEquityPriorityAreas ?? 0}
            parksCount={details.parks}
            greenbeltTrailsCount={details.greenbeltTrails}
            greenbeltLengthKm={greenbeltLengthKm}
            boundaries={boundaries}
            neighbourhoodName={name}
          />
          <SchoolsStatRow
            schoolsCount={details.schools}
            elementaryCount={details.elementarySchools}
            secondaryCount={details.secondarySchools}
            schoolsList={details.schoolsList}
            schoolsData={details.schoolsData}
            avgEqaoScore={details.avgEqaoScore}
            percent={getPercent(details.schools, "schools")}
            type={getScoreType(details.schools, "schools")}
            source={DATA_SOURCES.schools}
            boundaries={boundaries}
            neighbourhoodName={name}
          />
          <EqaoStatRow
            avgScore={details.avgEqaoScore}
            schoolsWithScores={details.schoolsWithEqaoScores}
            schools={details.schoolsData.map(s => ({
              name: s.name,
              eqaoScore: s.eqaoScore,
              category: s.category,
              board: s.board,
            }))}
          />
          <EducationStatRow
            boundaries={boundaries}
            neighbourhoodName={name}
          />
          <LibrariesStatRow
            count={details.libraries}
            librariesData={details.librariesData}
            boundaries={boundaries}
            neighbourhoodName={name}
          />
          <TrailsStatRow
            greenbeltTrails={details.greenbeltTrailsData}
            greenbeltLengthKm={greenbeltLengthKm}
            linearParks={details.parksData.filter(p => p.category === "Linear Park")}
            boundaries={boundaries}
            neighbourhoodName={name}
          />
          <CyclingInfraStatRow
            cyclingTotalKm={details.cyclingTotalKm || 0}
            bikeLanesKm={details.bikeLanesKm || 0}
            pathsKm={details.pathsKm || 0}
            pavedShouldersKm={details.pavedShouldersKm || 0}
            cyclingByType={details.cyclingByType || {}}
            bikeScore={bikeScore}
            areaKm2={details.areaKm2 || 1}
          />
          <RoadQualityStatRow
            roadQualityScore={details.roadQualityScore || 50}
            roadComplaints={details.roadComplaints || 0}
            roadComplaintsRate={details.roadComplaintsRate || 0}
            roadComplaintsPerKm2={details.roadComplaintsPerKm2 || 0}
            roadComplaintsByType={details.roadComplaintsByType || {}}
            areaKm2={details.areaKm2 || 1}
          />
          <NoiseStatRow
            quietScore={details.quietScore || 50}
            noiseComplaints={details.noiseComplaints || 0}
            noiseComplaintsRate={details.noiseComplaintsRate || 0}
            noiseComplaintsByType={details.noiseComplaintsByType || {}}
            population={population}
          />
          <DevelopmentStatRow
            developmentScore={details.developmentScore || 0}
            total={details.developmentTotal || 0}
            active={details.developmentActive || 0}
            approved={details.developmentApproved || 0}
            recent={details.developmentRecent || 0}
            developmentRate={details.developmentRate || 0}
            byType={details.developmentByType || {}}
          />
          <FoodEstablishmentsStatRow
            foodData={(details.foodData || []).filter(f => f.category !== 'grocery')}
            totalCount={(details.foodEstablishments || 0) - (details.groceryStores || 0)}
            foodDensity={details.foodDensity}
            restaurants={details.restaurants}
            restaurantsData={details.restaurantsOnlyData || []}
            cafes={details.cafes}
            cafesData={details.cafesData || []}
            coffeeShops={details.coffeeShops}
            coffeeShopsData={details.coffeeShopsData || []}
            fastFood={details.fastFood}
            fastFoodData={details.fastFoodData || []}
            bakeries={details.bakeries}
            bakeriesData={details.bakeriesData || []}
            pubs={details.pubs}
            pubsData={details.pubsData || []}
            bars={details.bars}
            barsData={details.barsData || []}
            iceCreamShops={details.iceCreamShops}
            iceCreamShopsData={details.iceCreamShopsData || []}
            percent={
              details.foodDensity !== null
                ? getPercent(details.foodDensity, "restaurantsCafesDensity")
                : 0
            }
            type={
              details.foodDensity !== null
                ? getScoreType(details.foodDensity, "restaurantsCafesDensity")
                : "neutral"
            }
            source={DATA_SOURCES.food}
            boundaries={boundaries}
            neighbourhoodName={name}
          />
          <FoodInspectionStatRow
            establishments={neighbourhood.foodEstablishments}
            inspections={neighbourhood.foodInspections}
            avgScore={neighbourhood.foodInspectionAvgScore}
            recentAvgScore={neighbourhood.foodInspectionRecentAvgScore}
            violations={neighbourhood.foodViolations}
            criticalViolations={neighbourhood.foodCriticalViolations}
            violationsPerInspection={neighbourhood.foodViolationsPerInspection}
            perfectScoreRate={neighbourhood.foodPerfectScoreRate}
          />
          <FoodCostBurdenStatRow
            foodCostBurden={neighbourhood.foodCostBurden}
            foodCostBurdenRating={neighbourhood.foodCostBurdenRating}
            medianIncome={neighbourhood.medianIncome}
          />
          <GroceryStoresStatRow
            groceryStores={details.groceryStores}
            groceryStoreDensity={details.groceryStoreDensity}
            groceryStoresData={details.groceryStoresData || []}
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
            source={DATA_SOURCES.food}
            boundaries={boundaries}
            neighbourhoodName={name}
          />
          <GymStatRow
            gyms={details.gyms}
            gymDensity={details.gymDensity}
            gymsData={details.gymsData || []}
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
            source={DATA_SOURCES.gyms}
            boundaries={boundaries}
            neighbourhoodName={name}
          />
          <RecreationFacilitiesStatRow
            totalCount={details.recreationFacilities}
            facilitiesData={details.recreationFacilitiesData || []}
            arenas={details.arenas}
            pools={details.pools}
            communityCentres={details.communityCentres}
            source={DATA_SOURCES.recreation}
            boundaries={boundaries}
            neighbourhoodName={name}
          />
          <SportsCourtsStatRow
            totalCount={details.sportsCourts}
            courtsData={details.sportsCourtsData || []}
            basketballCourts={details.basketballCourts}
            tennisCourts={details.tennisCourts}
            volleyballCourts={details.volleyballCourts}
            pickleballCourts={details.pickleballCourts}
            ballDiamonds={details.ballDiamonds}
            sportsFields={details.sportsFields}
            soccerFields={details.soccerFields}
            footballFields={details.footballFields}
            source={DATA_SOURCES.sportsCourts}
            boundaries={boundaries}
            neighbourhoodName={name}
          />
          <BusStopsRow
            totalStops={details.busStops}
            stopsWithShelter={details.stopsWithShelter}
            stopsWithBench={details.stopsWithBench}
            density={details.busStopDensity}
            source={DATA_SOURCES.busStops}
          />
          <TransitInfoRow
            commuteToDowntown={commuteToDowntown}
            commuteByTransit={commuteByTransit}
            nearestOTrainStation={nearestOTrainStation}
            nearestOTrainLine={nearestOTrainLine}
            distanceToOTrain={distanceToOTrain}
            nearestTransitwayStation={nearestTransitwayStation}
            distanceToTransitway={distanceToTransitway}
          />
          <HospitalStatRow
            nearestHospital={details.nearestHospital}
            nearestHospitalAddress={details.nearestHospitalAddress}
            distanceKm={details.distanceToNearestHospital}
          />
          <CrimeStatRow
            total={details.crimeTotal}
            byCategory={details.crimeByCategory}
            population={population}
            source={DATA_SOURCES.crime}
            boundaries={boundaries}
            neighbourhoodName={name}
          />
          <CollisionStatRow
            total={details.collisions}
            fatal={details.collisionsFatal}
            injury={details.collisionsInjury}
            pedestrian={details.collisionsPedestrian}
            bicycle={details.collisionsBicycle}
            population={population}
            areaKm2={details.areaKm2}
            source={DATA_SOURCES.collisions}
          />
          <OverdoseStatRow
            cumulative={overdoseCumulative}
            yearlyAvg={overdoseYearlyAvg}
            ratePer100k={overdoseRatePer100k}
            years={overdoseYears}
            population={population}
            source={DATA_SOURCES.overdose}
          />
          <ServiceRequestsStatRow
            total={details.serviceRequests || 0}
            rate={details.serviceRequestRate || 0}
            byType={details.serviceRequestsByType || {}}
            population={population}
          />
          <IncomeStatRow
            medianIncome={medianIncome}
            households={households}
            boundaries={boundaries}
            neighbourhoodName={name}
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
