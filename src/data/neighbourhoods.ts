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

export interface RecreationFacilityData {
  name: string;
  facilityType: string; // Arena, Pool - Indoor, Community Center, etc.
  buildingName: string;
  address: string;
  lat: number;
  lng: number;
  link: string;
}

export interface SportsCourtData {
  courtType: string; // Basketball Court, Tennis Court, Sports Field, etc.
  sportType: string; // soccer, football, basketball, etc.
  name: string;
  parkName: string;
  address: string;
  fieldSize: string;
  lights: string;
  accessible: string;
  lat: number;
  lng: number;
}

export interface CrimeByCategory {
  [category: string]: number | undefined;
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
  // Diversity (2021 Census)
  pctImmigrants: number; // % of population that are immigrants
  pctRacialized: number; // % of population that are visible minorities
  // Greenspace (2024)
  treeCanopy: number; // % tree canopy coverage
  parklandCoverage: number; // % parkland coverage
  // Crime data (2023-2024)
  crimeTotal: number; // Total crimes in this zone
  crimeRate: number; // Crimes per 1,000 residents
  dataYear: string; // Year of population data (e.g., '2021', '2011')
  source: string; // Data source name
  sourceUrl: string; // URL for citation
}

export interface CategoryScores {
  safety: number | null;          // Crime, collisions, overdose (25%)
  schools: number | null;         // EQAO, school availability (15%)
  healthEnvironment: number | null; // Tree canopy, healthcare, food safety (15%)
  amenities: number | null;       // Parks, grocery, recreation, libraries (10%)
  community: number | null;       // NEI score, road quality (10%)
  nature: number | null;          // Trails, cycling, green space (10%)
  affordability: number | null;   // Rent, home prices (10%)
  walkability: number | null;     // Walk/transit/bike scores (5%)
}

export interface ScoreWeights {
  safety: number;           // 30%
  schools: number;          // 12%
  healthEnvironment: number; // 15%
  amenities: number;        // 8%
  community: number;        // 15%
  nature: number;           // 10%
  affordability: number;    // 7%
  walkability: number;      // 3%
}

export interface MetricScores {
  // Safety metrics (crime is weighted: violent 50%, property 30%, other 20%)
  crime: number | null;
  violentCrime: number | null;
  propertyCrime: number | null;
  collisions: number | null;
  overdose: number | null;
  // School metrics
  eqao: number | null;
  schoolCount: number | null;
  // Health & Environment metrics
  treeCanopy: number | null;
  hospital: number | null;
  primaryCare: number | null;
  foodSafety: number | null;
  // Amenity metrics
  parks: number | null;
  grocery: number | null;
  dining: number | null;
  recreation: number | null;
  libraries: number | null;
  // Community metrics
  nei: number | null;
  roadQuality: number | null;
  quietScore: number | null;
  serviceRequests: number | null;
  highway: number | null;
  // Nature metrics
  trails: number | null;
  cycling: number | null;
  // Affordability metrics
  rent: number | null;
  homePrice: number | null;
  foodCostBurden: number | null;
  // Walkability metrics
  walk: number | null;
  transit: number | null;
  bike: number | null;
}

export interface RawMetricValues {
  // Crime rates per 1,000 residents
  crime: number | null; // Total crime rate
  violentCrime: number | null;
  propertyCrime: number | null;
  otherCrime: number | null;
  collisions: number | null;
  overdose: number | null;
  eqao: number | null;
  schoolCount: number | null;
  treeCanopy: number | null;
  hospital: number | null;
  primaryCare: number | null;
  foodSafety: number | null;
  // Amenities - scoring value (density for urban, count for suburban)
  parks: number | null;
  grocery: number | null;
  dining: number | null;
  recreation: number | null;
  // Amenity counts (absolute numbers)
  parksCount: number;
  groceryCount: number;
  diningCount: number;
  recreationCount: number;
  // Amenity densities (per km²)
  parksDensity: number;
  groceryDensity: number;
  diningDensity: number;
  recreationDensity: number;
  // Whether this is an urban area (>2000/km²)
  isUrban: boolean;
  libraries: number | null;
  nei: number | null;
  roadQuality: number | null;
  quietScore: number | null;
  serviceRequests: number | null;
  highway: number | null;
  trails: number | null;
  cycling: number | null;
  rent: number | null;
  homePrice: number | null;
  foodCostBurden: number | null;
  walk: number | null;
  transit: number | null;
  bike: number | null;
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
  treeEquityScore: number | null; // Tree Equity Score (0-100)
  treeEquityPriorityAreas: number; // Number of priority areas for tree planting
  neiScore: number | null; // Neighbourhood Equity Index score (0-100, higher = better equity)
  // Overdose ED visits (Ottawa Public Health, 2020-2024)
  overdoseCumulative: number | null; // Total overdose ED visits over 5 years
  overdoseYearlyAvg: number | null; // Average yearly overdose ED visits
  overdoseRatePer100k: number | null; // Average yearly rate per 100,000 population
  overdoseYears: string | null; // Date range of data (e.g., "2020-2024")
  // Health indicators (OCHPP data)
  primaryCareAccess: number | null; // % of residents with family doctor
  diabetesPrevalence: number | null; // % of adults with diabetes
  asthmaPrevalence: number | null; // % of adults with asthma
  copdPrevalence: number | null; // % of adults with COPD
  hypertensionPrevalence: number | null; // % of adults with hypertension
  mentalHealthEdRate: number | null; // Mental health ED visits per 100K
  prematureMortality: number | null; // Premature mortality rate per 100K
  hospitalAdmissionRate: number | null; // Hospital admissions per 1K
  healthDataYear: string | null; // Year of health data
  healthDataSource: string | null; // Source of health data
  // Food Inspection data (Ottawa Public Health)
  foodEstablishments: number; // Number of food establishments
  foodInspections: number; // Total inspections
  foodInspectionAvgScore: number | null; // Average inspection score (0-100)
  foodInspectionRecentAvgScore: number | null; // Recent 2-year average
  foodViolations: number; // Total violations
  foodCriticalViolations: number; // Critical violations
  foodViolationsPerInspection: number | null; // Violations per inspection
  foodPerfectScoreRate: number | null; // % of perfect scores
  // Food Cost Burden (Ottawa Public Health NFB vs 2021 Census Income)
  foodCostBurden: number | null; // % of income spent on food
  foodCostBurdenRating: string | null; // Low/Moderate/High/Very High/Severe
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
    avgEqaoScoreElementary: number | null; // Average EQAO for elementary schools
    avgEqaoScoreSecondary: number | null; // Average EQAO for high schools
    schoolsWithEqaoScores: number;
    elementaryWithEqaoScores: number;
    secondaryWithEqaoScores: number;
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
    // Recreation facilities (pools, arenas, rinks, community centres)
    recreationFacilities: number | null;
    recreationFacilitiesList: string[];
    recreationFacilitiesData: RecreationFacilityData[];
    arenas: number | null;
    pools: number | null;
    communityCentres: number | null;
    // Sports courts
    sportsCourts: number | null;
    basketballCourts: number | null;
    tennisCourts: number | null;
    volleyballCourts: number | null;
    pickleballCourts: number | null;
    ballDiamonds: number | null;
    sportsFields: number | null;
    soccerFields: number | null;
    footballFields: number | null;
    sportsCourtsData: SportsCourtData[];
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
    // Highway proximity
    nearestHighway: string | null;
    distanceToHighway: number | null; // km
    // NCC Greenbelt trails
    greenbeltTrails: number;
    greenbeltTrailsLengthKm: number;
    greenbeltTrailsList: string[];
    greenbeltTrailsData: GreenbeltTrailData[];
    // Cycling infrastructure
    cyclingTotalKm: number;
    bikeLanesKm: number;
    pathsKm: number;
    pavedShouldersKm: number;
    cyclingByType: Record<string, number | undefined>;
    // Traffic collisions (2022-2024)
    collisions: number | null;
    collisionsFatal: number | null;
    collisionsInjury: number | null;
    collisionsPedestrian: number | null;
    collisionsBicycle: number | null;
    // 311 Service Requests (2024-2025)
    serviceRequests: number | null;
    serviceRequestRate: number | null; // per 1000 residents
    serviceRequestsByType: Record<string, number>;
    // Road Quality (from 311 data - potholes, surface damage, etc.)
    roadQualityScore: number | null; // 0-100, higher = better roads
    roadComplaints: number | null;
    roadComplaintsRate: number | null; // per 1000 residents
    roadComplaintsPerKm2: number | null;
    roadComplaintsByType: Record<string, number>;
    // Noise Level (from 311 data - music, construction, shouting, etc.)
    quietScore: number | null; // 0-100, higher = quieter neighbourhood
    noiseComplaints: number | null;
    noiseComplaintsRate: number | null; // per 1000 residents
    noiseComplaintsByType: Record<string, number | undefined>;
    // Development Activity (from City of Ottawa Development Applications)
    developmentScore: number | null; // 0-100, higher = more development activity
    developmentTotal: number | null; // Total applications since 2008
    developmentActive: number | null; // Currently active applications
    developmentApproved: number | null; // Approved applications
    developmentRecent: number | null; // Recent applications (2023-2025)
    developmentRate: number | null; // Recent applications per 1000 residents
    developmentByType: Record<string, number | undefined>;
  };
  pros: string[];
  cons: string[];
  boundaries: NeighbourhoodBoundary[];
  overallScore: number;
  categoryScores: CategoryScores;
  scoreWeights: ScoreWeights;
  metricScores: MetricScores;
  rawMetricValues: RawMetricValues;
}

export const neighbourhoods: Neighbourhood[] = data.neighbourhoods as Neighbourhood[];
