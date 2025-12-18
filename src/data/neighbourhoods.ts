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

export interface CrimeByCategory {
  [category: string]: number;
}

export interface Neighbourhood {
  id: string;
  name: string;
  area: string;
  image: string;
  population: number;
  medianIncome: number;
  avgRent: number;
  avgHomePrice: number;
  walkScore: number;      // 0-100 walkability score
  transitScore: number;   // 0-100 transit accessibility score
  bikeScore: number;      // 0-100 bikeability score
  pctChildren: number;    // % of population aged 0-14 (families with children indicator)
  pctYoungProfessionals: number; // % of population aged 25-44
  pctSeniors: number;     // % of population aged 65+
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
    crimeTotal: number;
    crimeByCategory: CrimeByCategory;
    nearestHospital: string | null;
    nearestHospitalAddress: string | null;
    distanceToNearestHospital: number | null; // km
  };
  pros: string[];
  cons: string[];
}

export const neighbourhoods: Neighbourhood[] = data.neighbourhoods as Neighbourhood[];
