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
}

export interface LibraryData {
  name: string;
  lat: number;
  lng: number;
  address: string;
  postalCode: string;
  acronym: string;
}

export interface TransitStationData {
  name: string;
  type: string;
  lat: number;
  lng: number;
}

export interface CrimeByCategory {
  [category: string]: number;
}

export interface Neighbourhood {
  id: string;
  name: string;
  area: string;
  image: string;
  score: number;
  rank: number;
  quickStats: {
    avgRent: number;
    walkScore: number;
    transit: string;
    safety: number;
    internetMbps: number;
  };
  details: {
    population: string;
    avgIncome: string;
    restaurants: number;
    parks: number;
    parksList: string[];
    parksData: ParkData[];
    schools: number;
    schoolsList: string[];
    schoolsData: SchoolData[];
    libraries: number;
    librariesList: string[];
    librariesData: LibraryData[];
    transitStations: number;
    transitStationsList: string[];
    transitStationsData: TransitStationData[];
    crimeTotal: number;
    crimeByCategory: CrimeByCategory;
    bikeScore: number;
  };
  pros: string[];
  cons: string[];
}

export const neighbourhoods: Neighbourhood[] = data.neighbourhoods as Neighbourhood[];
