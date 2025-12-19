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
  name: string;
  rings: number[][][]; // Array of rings, each ring is array of [lng, lat] coords
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
  medianIncome: number;
  avgRent: number;
  avgHomePrice: number;
  walkScore: number;      // 0-100 walkability score
  transitScore: number;   // 0-100 transit accessibility score
  bikeScore: number;      // 0-100 bikeability score
  pctChildren: number;    // % of population aged 0-14 (families with children indicator)
  pctYoungProfessionals: number; // % of population aged 25-44
  pctSeniors: number;     // % of population aged 65+
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
    groceryStores: number | null;
    groceryStoreDensity: number | null; // per km²
    groceryStoresList: string[];
    groceryStoresData: GroceryStoreData[];
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
  };
  pros: string[];
  cons: string[];
  boundaries: NeighbourhoodBoundary[];
  overallScore: number;
  categoryScores: CategoryScores;
  scoreWeights: ScoreWeights;
}

export const neighbourhoods: Neighbourhood[] = data.neighbourhoods as Neighbourhood[];
