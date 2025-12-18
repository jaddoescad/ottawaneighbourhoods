/**
 * Neighbourhood Data - Combines real and mockup data
 *
 * Real data:   ./real/   - Verified from official sources (Ottawa Open Data, etc.)
 * Mockup data: ./mockup/ - Placeholders that need real data
 */

import { mockupNeighbourhoods } from './mockup';
import { parksByNeighbourhood } from './real';

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
    schools: number;
    bikeScore: number;
  };
  pros: string[];
  cons: string[];
}

// Merge mockup with real data
export const neighbourhoods: Neighbourhood[] = mockupNeighbourhoods.map((mockup) => ({
  ...mockup,
  details: {
    ...mockup.details,
    // Real data fields
    parks: parksByNeighbourhood[mockup.id]?.count ?? 0,
  },
}));
