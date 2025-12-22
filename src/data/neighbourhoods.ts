/**
 * Neighbourhood Data - Loaded from processed JSON
 *
 * Data pipeline:
 *   1. Raw data in src/data/csv/ (parks_raw.csv, schools_raw.csv)
 *   2. Run: node scripts/process-data.js
 *   3. Output: src/data/processed/data.json
 *
 * To update data:
 *   - Edit src/data/csv/neighbourhoods.csv for neighbourhood info
 *   - Edit scripts/config/neighbourhood-mapping.js to change ONS area groupings
 *   - Run: node scripts/process-data.js
 */

import data from './processed/data.json';

export interface ParkData {
  name: string;
  type: string;
  category: string;
  lat: number;
  lng: number;
  ward: string;
  dogPolicy: string;
  address: string;
}

export interface SchoolData {
  name: string;
  board: string;
  fullBoard: string;
  category: string;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  eqaoScore: number | null; // % of students achieving provincial standard
}

export interface LibraryData {
  name: string;
  lat: number;
  lng: number;
  address: string;
  postalCode: string;
  acronym: string;
}

export interface GroceryStoreData {
  name: string;
  shopType: string;
  category: string;
  brand: string;
  address: string;
  lat: number;
  lng: number;
  osmId: string;
  osmType: string;
}

export interface FoodEstablishmentData {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
}

export interface BusStopData {
  stopId: string;
  location: string;
  lat: number;
  lng: number;
  hasShelter: boolean;
  hasBench: boolean;
}

export interface GymData {
  name: string;
  leisureType: string;
  category: string;
  sport: string;
  brand: string;
  address: string;
  lat: number;
  lng: number;
  osmId: string;
  osmType: string;
}

export interface CrimeByCategory {
  [category: string]: number;
}

export interface GreenbeltTrailData {
  name: string;
  sector: string;
  lengthKm: number;
  difficulty: string;
  type: string;
  parking: string;
  lat: number | null;
  lng: number | null;
  notes: string;
  source: string;
}

export interface NeighbourhoodBoundary {
  onsId: number | string; // ONS area ID (or 'custom' for custom boundaries)
  name: string;
  rings: number[][][]; // Array of rings, each ring is array of [lng, lat] coords
  population: number; // Population of this ONS zone
  // Age demographics (2021 Census)
  pctChildren: number; // % aged 0-14
  pctYouth: number; // % aged 15-24
  pctAdults: number; // % aged 25-64
  pctSeniors: number; // % aged 65+
  avgAge: number; // Average age
  // Education levels of residents (2021 Census, ages 25-64)
  pctNoHighSchool: number; // % without high school diploma
  pctPostSecondary: number; // % with post-secondary degree/diploma
  pctBachelors: number; // % with bachelor's degree or higher
  // Income data (2021 Census)
  medianIncome: number; // Median after-tax household income
  households: number; // Number of households
  // Crime data (2023-2024)
  crimeTotal: number; // Total crimes in this zone
  crimeRate: number; // Crimes per 1,000 residents
  dataYear: string; // Year of population data (e.g., '2021', '2011')
  source: string; // Data source name
  sourceUrl: string; // URL for citation
}

export interface CategoryScores {
  walkability: number | null;
  safety: number | null;
  affordability: number | null;
  amenities: number | null;
  education: number | null;
  healthcare: number | null;
  income: number | null;
  familyFriendly: number | null;
  commuteTime: number | null;
  lifestyle: number | null;
}

export interface ScoreWeights {
  walkability: number;
  safety: number;
  affordability: number;
  amenities: number;
  education: number;
  healthcare: number;
  income: number;
  familyFriendly: number;
  commuteTime: number;
  lifestyle: number;
}

export interface Neighbourhood {
  id: string;
  name: string;
  area: string;
  image: string;
  population: number;
  populationDensity: number; // people per km²
  households: number; // Number of households (2021 Census)
  pop2021: number; // 2021 Census population
  dataYear: number; // Year of census data (2021)
  dataSource: string; // "Statistics Canada 2021 Census via ONS-SQO" or "City of Ottawa POPEST"
  medianIncome: number;
  avgRent: number;
  avgHomePrice: number;
  walkScore: number;      // 0-100 walkability score
  transitScore: number;   // 0-100 transit accessibility score
  bikeScore: number;      // 0-100 bikeability score
  // Demographics from 2021 Census
  pctChildren: number;    // % of population aged 0-14 (families with children indicator)
  pctYoungProfessionals: number; // % of population aged 25-44
  pctSeniors: number;     // % of population aged 65+
  // Additional census demographics
  unemploymentRate: number | null; // Unemployment rate %
  pctRenters: number | null; // % of households that rent
  pctImmigrants: number | null; // % of population that are immigrants
  pctRacialized: number | null; // % of population that are racialized
  pctPostSecondary: number | null; // % of population (25-64) with post-secondary education
  pctCommuteCar: number | null; // % of workers who commute by car
  pctCommuteTransit: number | null; // % of workers who commute by public transit
  pctWorkFromHome: number | null; // % of workers who work from home
  treeCanopy: number | null; // % tree canopy coverage (2024)
  commuteToDowntown: number; // Average commute time to downtown in minutes (by car)
  commuteByTransit: number; // Average commute time to downtown in minutes (by transit)
  // Transit station proximity
  nearestOTrainStation: string | null;
  nearestOTrainLine: string | null;
  distanceToOTrain: number | null; // km
  nearestTransitwayStation: string | null;
  distanceToTransitway: number | null; // km
  nearestRapidTransit: string | null;
  nearestRapidTransitType: string | null;
  distanceToRapidTransit: number | null; // km
  details: {
    areaKm2: number;
    parks: number;
    parksList: string[];
    parksData: ParkData[];
    schools: number;
    elementarySchools: number;
    secondarySchools: number;
    schoolsList: string[];
    schoolsData: SchoolData[];
    avgEqaoScore: number | null; // Neighbourhood average EQAO score
    schoolsWithEqaoScores: number;
    libraries: number;
    librariesList: string[];
    librariesData: LibraryData[];
    restaurantsAndCafes: number | null;
    restaurantsAndCafesDensity: number | null; // per km²
    restaurantsList: string[];
    restaurantsData: FoodEstablishmentData[];
    // New food establishment categories (from OPH data)
    foodEstablishments: number | null;
    foodDensity: number | null; // per km²
    foodData: FoodEstablishmentData[];
    restaurants: number | null;
    restaurantsOnlyData: FoodEstablishmentData[];
    cafes: number | null;
    cafesData: FoodEstablishmentData[];
    coffeeShops: number | null;
    coffeeShopsData: FoodEstablishmentData[];
    fastFood: number | null;
    fastFoodData: FoodEstablishmentData[];
    bakeries: number | null;
    bakeriesData: FoodEstablishmentData[];
    pubs: number | null;
    pubsData: FoodEstablishmentData[];
    bars: number | null;
    barsData: FoodEstablishmentData[];
    iceCreamShops: number | null;
    iceCreamShopsData: FoodEstablishmentData[];
    groceryStores: number | null;
    groceryStoreDensity: number | null; // per km²
    groceryStoresList: string[];
    groceryStoresData: FoodEstablishmentData[];
    gyms: number | null;
    gymDensity: number | null; // per km²
    gymsList: string[];
    gymsData: GymData[];
    busStops: number | null;
    busStopDensity: number | null; // per km²
    stopsWithShelter: number;
    stopsWithBench: number;
    busStopsData: BusStopData[];
    crimeTotal: number;
    crimeByCategory: CrimeByCategory;
    nearestHospital: string | null;
    nearestHospitalAddress: string | null;
    distanceToNearestHospital: number | null; // km
    // NCC Greenbelt trails
    greenbeltTrails: number;
    greenbeltTrailsLengthKm: number;
    greenbeltTrailsList: string[];
    greenbeltTrailsData: GreenbeltTrailData[];
    // Traffic collisions (2022-2024)
    collisions: number | null;
    collisionsFatal: number | null;
    collisionsInjury: number | null;
    collisionsPedestrian: number | null;
    collisionsBicycle: number | null;
  };
  pros: string[];
  cons: string[];
  boundaries: NeighbourhoodBoundary[];
  overallScore: number;
  categoryScores: CategoryScores;
  scoreWeights: ScoreWeights;
}

export const neighbourhoods: Neighbourhood[] = data.neighbourhoods as Neighbourhood[];
