#!/usr/bin/env node
/**
 * Process Raw Data Script
 *
 * Reads raw CSV files and processes them into data for the website.
 * Run this whenever you want to refresh the data.
 *
 * Usage: node scripts/process-data.js
 *
 * Input files:
 *   - src/data/csv/parks_raw.csv
 *   - src/data/csv/schools_raw.csv
 *   - src/data/csv/libraries_raw.csv
 *   - src/data/csv/crime_raw.csv
 *   - src/data/csv/hospitals_raw.csv
 *   - src/data/csv/restaurants_cafes_raw.csv (optional)
 *   - src/data/csv/grocery_stores_raw.csv (optional)
 *   - src/data/csv/neighbourhoods.csv (neighbourhood info/config)
 *
 * Output files:
 *   - src/data/processed/data.json (main data file for the app)
 */

const fs = require('fs');
const path = require('path');
const neighbourhoodMapping = require('./config/neighbourhood-mapping.js');

// Gen 3 (2024) boundaries - Layer 2 uses ONS-SQO IDs (3001-3117) matching census data
const NEIGHBOURHOODS_API = 'https://maps.ottawa.ca/arcgis/rest/services/Neighbourhoods/MapServer/2/query';

// ============================================================================
// School Name Normalization (for EQAO matching)
// ============================================================================

function normalizeSchoolName(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/école élémentaire catholique/gi, '')
    .replace(/école élémentaire publique/gi, '')
    .replace(/école secondaire catholique/gi, '')
    .replace(/école secondaire publique/gi, '')
    .replace(/catholic elementary school/gi, '')
    .replace(/catholic secondary school/gi, '')
    .replace(/catholic high school/gi, '')
    .replace(/elementary school/gi, '')
    .replace(/secondary school/gi, '')
    .replace(/public school/gi, '')
    .replace(/high school/gi, '')
    .replace(/intermediate school/gi, '')
    .replace(/\(.*?\)/g, '') // Remove parenthetical info
    .replace(/st\./g, 'st')
    .replace(/sainte?-?/g, 'st ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchSchoolNames(name1, name2) {
  const n1 = normalizeSchoolName(name1);
  const n2 = normalizeSchoolName(name2);

  // Exact match after normalization
  if (n1 === n2) return true;

  // One contains the other
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // Check if the main words match (first 2-3 significant words)
  const words1 = n1.split(' ').filter(w => w.length > 2);
  const words2 = n2.split(' ').filter(w => w.length > 2);

  if (words1.length >= 2 && words2.length >= 2) {
    const match1 = words1.slice(0, 2).join(' ');
    const match2 = words2.slice(0, 2).join(' ');
    if (match1 === match2) return true;
  }

  return false;
}

// ============================================================================
// CSV Parsing
// ============================================================================

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// ============================================================================
// Distance Calculation (Haversine formula)
// ============================================================================

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================================================
// Polygon Area Calculation (approx. sq km from WGS84 rings)
// ============================================================================

const EARTH_RADIUS_M = 6371000;

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

function ringAreaMetersSquared(ring) {
  if (!ring || ring.length < 3) return 0;

  // Equirectangular projection around the ring's average latitude (good local approximation)
  const avgLat = ring.reduce((sum, [, lat]) => sum + lat, 0) / ring.length;
  const lat0Rad = degreesToRadians(avgLat);
  const cosLat0 = Math.cos(lat0Rad);

  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[(i + 1) % ring.length];

    const x1 = EARTH_RADIUS_M * degreesToRadians(lng1) * cosLat0;
    const y1 = EARTH_RADIUS_M * degreesToRadians(lat1);
    const x2 = EARTH_RADIUS_M * degreesToRadians(lng2) * cosLat0;
    const y2 = EARTH_RADIUS_M * degreesToRadians(lat2);

    area += (x1 * y2 - x2 * y1);
  }

  return area / 2; // signed
}

function polygonAreaMetersSquared(rings) {
  if (!rings || rings.length === 0) return 0;

  let area = Math.abs(ringAreaMetersSquared(rings[0])); // outer ring
  for (let i = 1; i < rings.length; i++) {
    area -= Math.abs(ringAreaMetersSquared(rings[i])); // holes
  }

  return Math.max(0, area);
}

function roundTo(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Calculate centroid of a polygon (first ring only)
function calculateCentroid(rings) {
  if (!rings || rings.length === 0 || rings[0].length === 0) return null;

  const ring = rings[0]; // Use outer ring
  let sumX = 0, sumY = 0;
  for (const [x, y] of ring) {
    sumX += x;
    sumY += y;
  }
  return {
    lng: sumX / ring.length,
    lat: sumY / ring.length,
  };
}

// ============================================================================
// Point-in-Polygon Algorithm
// ============================================================================

function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

function pointInPolygonWithHoles(point, rings) {
  if (!rings || rings.length === 0) return false;

  // First ring is outer boundary
  if (!pointInPolygon(point, rings[0])) {
    return false;
  }
  // Check if point is in any hole
  for (let i = 1; i < rings.length; i++) {
    if (pointInPolygon(point, rings[i])) {
      return false;
    }
  }
  return true;
}

// ============================================================================
// Fetch Population Data
// ============================================================================

async function fetchPopulationData() {
  const url = `${NEIGHBOURHOODS_API}?where=1%3D1&outFields=ONS_ID,NAME,POPEST&returnGeometry=false&f=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const populationByOnsId = {};
    if (data.features) {
      for (const feature of data.features) {
        const { ONS_ID, POPEST } = feature.attributes;
        populationByOnsId[ONS_ID] = POPEST || 0;
      }
    }
    return populationByOnsId;
  } catch (e) {
    console.error('Error fetching population data:', e.message);
    return {};
  }
}

// ============================================================================
// Fetch Neighbourhood Boundaries
// ============================================================================

async function fetchBoundary(onsId) {
  const url = `${NEIGHBOURHOODS_API}?where=ONS_ID%3D${onsId}&outFields=ONS_ID,NAME&returnGeometry=true&outSR=4326&f=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      if (feature.geometry && feature.geometry.rings) {
        return {
          onsId,
          name: feature.attributes.NAME,
          rings: feature.geometry.rings,
        };
      }
    }
  } catch (e) {
    console.error(`Error fetching boundary for ONS_ID ${onsId}:`, e.message);
  }

  return null;
}

async function fetchAllBoundaries(onsIds) {
  const boundaries = [];
  for (const onsId of onsIds) {
    const boundary = await fetchBoundary(onsId);
    if (boundary) {
      boundaries.push(boundary);
    }
  }
  return boundaries;
}

// ============================================================================
// Assign Points to Neighbourhoods
// ============================================================================

function assignToNeighbourhood(lat, lng, boundariesByNeighbourhood) {
  const coords = [lng, lat];

  for (const [neighbourhoodId, boundaries] of Object.entries(boundariesByNeighbourhood)) {
    for (const boundary of boundaries) {
      if (pointInPolygonWithHoles(coords, boundary.rings)) {
        return neighbourhoodId;
      }
    }
  }

  return null;
}

// Assign point to specific ONS zone and return both neighbourhood ID and zone ID
function assignToOnsZone(lat, lng, boundariesByNeighbourhood) {
  const coords = [lng, lat];

  for (const [neighbourhoodId, boundaries] of Object.entries(boundariesByNeighbourhood)) {
    for (const boundary of boundaries) {
      if (pointInPolygonWithHoles(coords, boundary.rings)) {
        return { neighbourhoodId, onsId: boundary.onsId };
      }
    }
  }

  return null;
}

// ============================================================================
// Main Processing
// ============================================================================

async function main() {
  console.log('=== Processing Ottawa Neighbourhood Data ===\n');

  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const csvDir = path.join(dataDir, 'csv');
  const outputDir = path.join(dataDir, 'processed');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Load raw data
  console.log('Loading raw CSV files...');
  const parksRaw = parseCSV(fs.readFileSync(path.join(csvDir, 'parks_raw.csv'), 'utf8'));
  const schoolsRaw = parseCSV(fs.readFileSync(path.join(csvDir, 'schools_raw.csv'), 'utf8'));
  const librariesRaw = parseCSV(fs.readFileSync(path.join(csvDir, 'libraries_raw.csv'), 'utf8'));
  const crimeRaw = parseCSV(fs.readFileSync(path.join(csvDir, 'crime_raw.csv'), 'utf8'));
  const hospitalsRaw = parseCSV(fs.readFileSync(path.join(csvDir, 'hospitals_raw.csv'), 'utf8'));
  const neighbourhoodsInfo = parseCSV(fs.readFileSync(path.join(csvDir, 'neighbourhoods.csv'), 'utf8'));

  // Load OPH Food Establishments (categorized data from Ottawa Public Health)
  const ophFoodPath = path.join(csvDir, 'oph_categorized.csv');
  const hasOphFoodData = fs.existsSync(ophFoodPath);
  const ophFoodRaw = hasOphFoodData
    ? parseCSV(fs.readFileSync(ophFoodPath, 'utf8'))
    : [];
  if (hasOphFoodData) {
    // Count by category
    const categoryCounts = {};
    for (const item of ophFoodRaw) {
      const cat = item.CATEGORY || 'unknown';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
    console.log(`  - ${ophFoodRaw.length} food establishments (OPH)`);
    console.log(`    Categories: ${Object.entries(categoryCounts).map(([k, v]) => `${k}:${v}`).join(', ')}`);
  } else {
    console.log('  - No OPH food data found (run: node scripts/categorize-oph-establishments.js)');
  }

  // Consumer-facing food categories (exclude institutional, catering, etc.)
  const CONSUMER_FOOD_CATEGORIES = ['restaurant', 'cafe', 'fast_food', 'coffee_shop', 'bakery', 'pub', 'bar', 'ice_cream', 'grocery', 'food_court'];

  // Legacy: Also check for old grocery stores file for backwards compatibility
  const groceryStoresPath = path.join(csvDir, 'grocery_stores_raw.csv');
  const hasGroceryStoresData = fs.existsSync(groceryStoresPath);
  const groceryStoresRaw = hasGroceryStoresData
    ? parseCSV(fs.readFileSync(groceryStoresPath, 'utf8'))
    : [];
  if (hasGroceryStoresData && !hasOphFoodData) {
    console.log(`  - ${groceryStoresRaw.length} grocery stores (legacy OSM data)`);
  }


  // Load Gyms & Fitness Centers (optional - file may not exist)
  const gymsPath = path.join(csvDir, 'gyms_raw.csv');
  const hasGymsData = fs.existsSync(gymsPath);
  const gymsRaw = hasGymsData
    ? parseCSV(fs.readFileSync(gymsPath, 'utf8'))
    : [];
  if (hasGymsData) {
    console.log(`  - ${gymsRaw.length} gyms & fitness centers`);
  } else {
    console.log('  - No gyms file found (run: node scripts/download-gyms.js)');
  }

  // Load Recreation Facilities (pools, arenas, rinks, etc.)
  const recreationFacilitiesPath = path.join(csvDir, 'recreation_facilities_raw.csv');
  const hasRecreationFacilitiesData = fs.existsSync(recreationFacilitiesPath);
  const recreationFacilitiesRaw = hasRecreationFacilitiesData
    ? parseCSV(fs.readFileSync(recreationFacilitiesPath, 'utf8'))
    : [];
  if (hasRecreationFacilitiesData) {
    // Count by type
    const typeCounts = {};
    for (const facility of recreationFacilitiesRaw) {
      const type = facility.FACILITY_TYPE || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
    console.log(`  - ${recreationFacilitiesRaw.length} recreation facilities`);
    console.log(`    Types: ${Object.entries(typeCounts).map(([k, v]) => `${k}:${v}`).join(', ')}`);
  } else {
    console.log('  - No recreation facilities file found (run: node scripts/download-recreation-facilities.js)');
  }

  // Load Sports Courts (basketball, tennis, volleyball, sports fields, ball diamonds, pickleball)
  const sportsCourtsPath = path.join(csvDir, 'sports_courts_raw.csv');
  const hasSportsCourtsData = fs.existsSync(sportsCourtsPath);
  const sportsCourtsRaw = hasSportsCourtsData
    ? parseCSV(fs.readFileSync(sportsCourtsPath, 'utf8'))
    : [];
  if (hasSportsCourtsData) {
    // Count by court type
    const courtTypeCounts = {};
    for (const court of sportsCourtsRaw) {
      const type = court.COURT_TYPE || 'Unknown';
      courtTypeCounts[type] = (courtTypeCounts[type] || 0) + 1;
    }
    console.log(`  - ${sportsCourtsRaw.length} sports courts/fields`);
    console.log(`    Types: ${Object.entries(courtTypeCounts).map(([k, v]) => `${k}:${v}`).join(', ')}`);
  } else {
    console.log('  - No sports courts file found (run: node scripts/download-sports-courts.js)');
  }

  // Load Traffic Collision Data (optional - file may not exist)
  const collisionsPath = path.join(csvDir, 'collisions_raw.csv');
  const hasCollisionsData = fs.existsSync(collisionsPath);
  const collisionsRaw = hasCollisionsData
    ? parseCSV(fs.readFileSync(collisionsPath, 'utf8'))
    : [];
  if (hasCollisionsData) {
    const fatalCount = collisionsRaw.filter(c => c.CLASSIFICATION && c.CLASSIFICATION.includes('Fatal')).length;
    const injuryCount = collisionsRaw.filter(c => c.CLASSIFICATION && c.CLASSIFICATION.includes('Non-fatal injury')).length;
    console.log(`  - ${collisionsRaw.length} traffic collisions (${fatalCount} fatal, ${injuryCount} injury)`);
  } else {
    console.log('  - No collisions file found (run: node scripts/download-collisions.js)');
  }

  // Load OC Transpo Bus Stops (optional - file may not exist)
  const busStopsPath = path.join(csvDir, 'OC_Transpo_Stops.csv');
  const hasBusStopsData = fs.existsSync(busStopsPath);
  const busStopsRaw = hasBusStopsData
    ? parseCSV(fs.readFileSync(busStopsPath, 'utf8'))
    : [];
  if (hasBusStopsData) {
    console.log(`  - ${busStopsRaw.length} bus stops`);
  } else {
    console.log('  - No OC Transpo stops file found');
  }

  // Load Transit Stations (O-Train and Transitway)
  const transitStationsPath = path.join(csvDir, 'transit_stations.csv');
  const hasTransitStationsData = fs.existsSync(transitStationsPath);
  const transitStationsRaw = hasTransitStationsData
    ? parseCSV(fs.readFileSync(transitStationsPath, 'utf8'))
    : [];
  if (hasTransitStationsData) {
    const otrainCount = transitStationsRaw.filter(s => s.TYPE === 'O-Train').length;
    const transitwayCount = transitStationsRaw.filter(s => s.TYPE === 'Transitway').length;
    console.log(`  - ${transitStationsRaw.length} transit stations (${otrainCount} O-Train, ${transitwayCount} Transitway)`);
  } else {
    console.log('  - No transit stations file found (run: node scripts/download-transit-stations.js)');
  }

  // Load Walk/Transit/Bike Scores from our calculated CSV files
  const walkScoresById = {};

  // Load Transit Scores (calculated from GTFS data)
  const transitScoresPath = path.join(csvDir, 'transit_scores.csv');
  if (fs.existsSync(transitScoresPath)) {
    const transitData = parseCSV(fs.readFileSync(transitScoresPath, 'utf8'));
    console.log(`  - ${transitData.length} transit score entries (from GTFS)`);
    for (const entry of transitData) {
      if (!walkScoresById[entry.id]) walkScoresById[entry.id] = {};
      walkScoresById[entry.id].transitScore = parseInt(entry.transitScore) || 0;
    }
  } else {
    console.log('  - No transit scores file (run: node scripts/calculate-transit-scores.js)');
  }

  // Load Walk Scores (calculated from amenity data)
  const walkScoresPath = path.join(csvDir, 'walk_scores.csv');
  if (fs.existsSync(walkScoresPath)) {
    const walkData = parseCSV(fs.readFileSync(walkScoresPath, 'utf8'));
    console.log(`  - ${walkData.length} walk score entries (from amenities)`);
    for (const entry of walkData) {
      if (!walkScoresById[entry.id]) walkScoresById[entry.id] = {};
      walkScoresById[entry.id].walkScore = parseInt(entry.walkScore) || 0;
    }
  } else {
    console.log('  - No walk scores file (run: node scripts/calculate-walk-scores.js)');
  }

  // Load Bike Scores (calculated from trails/connectivity)
  const bikeScoresPath = path.join(csvDir, 'bike_scores.csv');
  if (fs.existsSync(bikeScoresPath)) {
    const bikeData = parseCSV(fs.readFileSync(bikeScoresPath, 'utf8'));
    console.log(`  - ${bikeData.length} bike score entries (from trails/connectivity)`);
    for (const entry of bikeData) {
      if (!walkScoresById[entry.id]) walkScoresById[entry.id] = {};
      walkScoresById[entry.id].bikeScore = parseInt(entry.bikeScore) || 0;
    }
  } else {
    console.log('  - No bike scores file (run: node scripts/calculate-bike-scores.js)');
  }

  // Load Food Cost Burden data (calculated from income vs NFB cost)
  const foodCostBurdenById = {};
  const foodAffordabilityPath = path.join(csvDir, 'food_affordability.csv');
  if (fs.existsSync(foodAffordabilityPath)) {
    const foodData = parseCSV(fs.readFileSync(foodAffordabilityPath, 'utf8'));
    console.log(`  - ${foodData.length} food cost burden entries`);
    for (const entry of foodData) {
      foodCostBurdenById[entry.id] = {
        foodCostBurden: parseFloat(entry.foodCostBurden) || 0,
        foodCostBurdenRating: entry.foodCostBurdenRating || '',
      };
    }
  } else {
    console.log('  - No food cost burden file (run: node scripts/calculate-food-affordability.js)');
  }

  // Load Age Demographics (optional - file may not exist)
  let ageDemographicsData = [];
  const ageDemographicsPath = path.join(csvDir, 'age_demographics.csv');
  if (fs.existsSync(ageDemographicsPath)) {
    ageDemographicsData = parseCSV(fs.readFileSync(ageDemographicsPath, 'utf8'));
    console.log(`  - ${ageDemographicsData.length} age demographics entries`);
  } else {
    console.log('  - No age demographics file found (run: node scripts/generate-age-demographics.js)');
  }

  // Build age demographics lookup by id
  const ageDemographicsById = {};
  for (const entry of ageDemographicsData) {
    ageDemographicsById[entry.id] = {
      pctChildren: parseFloat(entry.pctChildren) || 0,
      pctYoungProfessionals: parseFloat(entry.pctYoungProfessionals) || 0,
      pctSeniors: parseFloat(entry.pctSeniors) || 0,
    };
  }

  // Load Commute Times (optional - file may not exist)
  let commuteTimesData = [];
  const commuteTimesPath = path.join(csvDir, 'commute_times.csv');
  if (fs.existsSync(commuteTimesPath)) {
    commuteTimesData = parseCSV(fs.readFileSync(commuteTimesPath, 'utf8'));
    console.log(`  - ${commuteTimesData.length} commute time entries`);
  } else {
    console.log('  - No commute times file found');
  }

  // Build commute times lookup by id
  const commuteTimesById = {};
  for (const entry of commuteTimesData) {
    commuteTimesById[entry.id] = {
      commuteToDowntown: parseInt(entry.commuteToDowntown) || 0,
      commuteByTransit: parseInt(entry.commuteByTransit) || 0,
    };
  }

  // Load EQAO scores (optional - file may not exist)
  let eqaoScores = [];
  const eqaoPath = path.join(csvDir, 'eqao_scores.csv');
  if (fs.existsSync(eqaoPath)) {
    eqaoScores = parseCSV(fs.readFileSync(eqaoPath, 'utf8'));
    console.log(`  - ${eqaoScores.length} EQAO school scores`);
  } else {
    console.log('  - No EQAO scores file (run: node scripts/download-eqao-data.js)');
  }

  // Load NCC Greenbelt trails (optional - file may not exist)
  let greenbeltTrails = [];
  const greenbeltPath = path.join(csvDir, 'ncc_greenbelt_trails.csv');
  if (fs.existsSync(greenbeltPath)) {
    greenbeltTrails = parseCSV(fs.readFileSync(greenbeltPath, 'utf8'));
    console.log(`  - ${greenbeltTrails.length} NCC Greenbelt trails`);
  } else {
    console.log('  - No NCC Greenbelt trails file (run: node scripts/download-ncc-greenbelt.js)');
  }

  // Load Cycling Infrastructure (optional - file may not exist)
  let cyclingNetwork = [];
  const cyclingPath = path.join(csvDir, 'cycling_network.csv');
  if (fs.existsSync(cyclingPath)) {
    const cyclingContent = fs.readFileSync(cyclingPath, 'utf8');
    cyclingNetwork = cyclingContent.split('\n').slice(1).filter(line => line.trim()).map(line => {
      const match = line.match(/^(\d+),"([^"]+)",(\d+),([\d.-]+),([\d.-]+)$/);
      if (!match) return null;
      return {
        type: match[2],
        lengthM: parseInt(match[3]) || 0,
        lat: parseFloat(match[4]),
        lon: parseFloat(match[5])
      };
    }).filter(Boolean);
    console.log(`  - ${cyclingNetwork.length} cycling infrastructure segments`);
  } else {
    console.log('  - No cycling network file (run: node scripts/download-cycling-network.js)');
  }

  // Load 311 Service Requests data (optional - pre-processed from process-311-data.js)
  let serviceRequestsData = {};
  const serviceRequestsPath = path.join(csvDir, '311_by_neighbourhood.json');
  if (fs.existsSync(serviceRequestsPath)) {
    serviceRequestsData = JSON.parse(fs.readFileSync(serviceRequestsPath, 'utf8'));
    console.log(`  - 311 service requests for ${Object.keys(serviceRequestsData).length} neighbourhoods`);
  } else {
    console.log('  - No 311 data file (run: node scripts/process-311-data.js)');
  }

  // Load Development Applications data (optional - pre-processed from process-development-data.js)
  let developmentData = {};
  const developmentPath = path.join(csvDir, 'development_by_neighbourhood.json');
  if (fs.existsSync(developmentPath)) {
    developmentData = JSON.parse(fs.readFileSync(developmentPath, 'utf8'));
    console.log(`  - Development applications for ${Object.keys(developmentData).length} neighbourhoods`);
  } else {
    console.log('  - No development data file (run: node scripts/process-development-data.js)');
  }

  // Load Tree Equity Score data (optional - pre-processed from process-tree-equity.js)
  let treeEquityData = {};
  const treeEquityPath = path.join(csvDir, 'tree_equity_by_neighbourhood.json');
  if (fs.existsSync(treeEquityPath)) {
    treeEquityData = JSON.parse(fs.readFileSync(treeEquityPath, 'utf8'));
    const withData = Object.values(treeEquityData).filter(t => t.treeEquityScore !== null).length;
    console.log(`  - Tree Equity Scores for ${withData} neighbourhoods`);
  } else {
    console.log('  - No tree equity data file (run: node scripts/download-tree-equity.js && node scripts/process-tree-equity.js)');
  }

  // Load Neighbourhood Equity Index (NEI) 2019 scores
  let neiScoresById = {};
  const neiScoresPath = path.join(csvDir, 'nei_scores.csv');
  if (fs.existsSync(neiScoresPath)) {
    const neiData = parseCSV(fs.readFileSync(neiScoresPath, 'utf8'));
    const withData = neiData.filter(e => e.neiScore && e.neiScore !== '').length;
    console.log(`  - NEI Equity Scores for ${withData} neighbourhoods`);
    for (const entry of neiData) {
      neiScoresById[entry.id] = {
        neiScore: parseFloat(entry.neiScore) || null,
        neiCensusTracts: parseInt(entry.censusTracts) || 0,
        neiRedIndicators: parseInt(entry.redIndicators) || 0,
        neiYellowIndicators: parseInt(entry.yellowIndicators) || 0,
      };
    }
  } else {
    console.log('  - No NEI scores file (run: node scripts/download-nei-scores.js)');
  }

  // Load Overdose ED Visits data by ONS neighbourhood (Ottawa Public Health)
  let overdoseDataById = {};
  const overdosePath = path.join(csvDir, 'overdose_by_neighbourhood.csv');
  if (fs.existsSync(overdosePath)) {
    const overdoseRaw = parseCSV(fs.readFileSync(overdosePath, 'utf8'));
    console.log(`  - Overdose ED visits for ${overdoseRaw.length} ONS neighbourhoods`);
    for (const entry of overdoseRaw) {
      overdoseDataById[entry.ons_id] = {
        onsName: entry.ons_name,
        cumulativeOverdoseEdVisits: parseFloat(entry.cumulative_overdose_ed_visits) || 0,
        yearlyAvgOverdoseEdVisits: parseFloat(entry.yearly_avg_overdose_ed_visits) || 0,
        overdoseRatePer100k: parseFloat(entry.yearly_rate_per_100k) || null,
        overdoseYears: entry.years || '',
      };
    }
  } else {
    console.log('  - No overdose data file (run: node scripts/download-overdose-data.js)');
  }

  // Load Health Data (OCHPP indicators by neighbourhood)
  let healthDataById = {};
  const healthDataPath = path.join(csvDir, 'health_data.csv');
  if (fs.existsSync(healthDataPath)) {
    const healthRaw = parseCSV(fs.readFileSync(healthDataPath, 'utf8'));
    console.log(`  - Health indicators for ${healthRaw.length} neighbourhoods`);
    for (const entry of healthRaw) {
      healthDataById[entry.id] = {
        primaryCareAccess: parseFloat(entry.primaryCareAccess) || null,
        diabetesPrevalence: parseFloat(entry.diabetesPrevalence) || null,
        asthmaPrevalence: parseFloat(entry.asthmaPrevalence) || null,
        copdPrevalence: parseFloat(entry.copdPrevalence) || null,
        hypertensionPrevalence: parseFloat(entry.hypertensionPrevalence) || null,
        mentalHealthEdRate: parseFloat(entry.mentalHealthEdRate) || null,
        prematureMortality: parseFloat(entry.prematureMortality) || null,
        hospitalAdmissionRate: parseFloat(entry.hospitalAdmissionRate) || null,
        healthDataYear: entry.dataYear || null,
        healthDataSource: entry.dataSource || null,
      };
    }
  } else {
    console.log('  - No health data file (run: node scripts/download-health-data.js)');
  }

  // Load Food Inspection data (Ottawa Public Health)
  let foodInspectionData = {};
  const foodInspectionPath = path.join(csvDir, 'food_inspections_by_neighbourhood.json');
  if (fs.existsSync(foodInspectionPath)) {
    foodInspectionData = JSON.parse(fs.readFileSync(foodInspectionPath, 'utf8'));
    const withData = Object.values(foodInspectionData).filter(f => f.establishments > 0).length;
    console.log(`  - Food inspection data for ${withData} neighbourhoods`);
  } else {
    console.log('  - No food inspection data (run: node scripts/download-food-inspections.js && node scripts/process-food-inspections.js)');
  }

  // Load ONS Census Data from ons-sqo.ca (2021 Census data)
  let onsCensusData = [];
  const onsCensusPath = path.join(csvDir, 'ons_census_data.csv');
  if (fs.existsSync(onsCensusPath)) {
    onsCensusData = parseCSV(fs.readFileSync(onsCensusPath, 'utf8'));
    console.log(`  - ${onsCensusData.length} ONS census entries (2021 Census)`);
  } else {
    console.log('  - No ONS census file (run: node scripts/download-ons-census-data.js)');
  }

  // Build ONS census lookup by ONS-SQO internal ID (3001, 3002, etc.)
  const onsCensusBySqoId = {};
  for (const entry of onsCensusData) {
    onsCensusBySqoId[entry.ons_id] = {
      name: entry.name,
      population: parseInt(entry.pop2021_total) || 0,
      households: parseInt(entry.household_count) || 0,
      // Demographics
      pctChildren: parseFloat(entry.census_general_percent_of_pop_that_are_children_age_0_14) || 0,
      pctYouth: parseFloat(entry['census_general_percent_of_of_pop_that_are_youth_age_15_24']) || 0,
      pctAdults: parseFloat(entry.census_general_percent_of_pop_that_are_adults_age_25_64) || 0,
      pctSeniors: parseFloat(entry.census_general_percent_of_pop_that_are_seniors_65) || 0,
      avgAge: parseFloat(entry.census_general_average_age_of_the_population) || 0,
      // Income
      medianIncome: parseInt(entry.census_general_median_after_tax_income_of_households_in_2020) || 0,
      avgIncome: parseInt(entry.census_general_average_after_tax_income_of_households_in_2020) || 0,
      unemploymentRate: parseFloat(entry.census_general_unemployment_rate) || 0,
      pctLowIncome: parseFloat(entry.census_general_percent_of_people_in_low_income_based_on_lim_at) || 0,
      // Housing
      pctRenters: parseFloat(entry.census_general_percent_of_renter_households) || 0,
      avgRent: parseInt(entry.census_general_average_monthly_shelter_costs_for_rented_dwellings) || 0,
      medianHomeValue: parseInt(entry.census_general_median_value_of_owned_dwellings) || 0,
      pctCoreHousingNeed: parseFloat(entry.census_general_percent_of_households_living_in_core_housing_need) || 0,
      // Diversity
      pctImmigrants: parseFloat(entry.census_general_percent_of_pop_that_are_immigrants) || 0,
      pctRacialized: parseFloat(entry.census_general_percent_of_pop_that_are_racialized) || 0,
      // Education (ages 25-64)
      pctNoHighSchool: parseFloat(entry.census_general_percent_of_pop_age_25_64_with_no_high_school_diploma_or_equivalent) || 0,
      pctPostSecondary: parseFloat(entry.census_general_percent_of_pop_age_25_64_with_postsecondary_degree_diploma_certificate) || 0,
      pctBachelors: parseFloat(entry['census_general_percent_of_people_aged_25_64_with_a_bachelors_degree_or_higher']) || 0,
      // Commute
      pctCommuteCar: parseFloat(entry.census_general_percent_of_workers_age_15_who_commute_by_car_truck_or_van) || 0,
      pctCommuteTransit: parseFloat(entry.census_general_percent_of_workers_age_15_who_commute_by_public_transit) || 0,
      pctCommuteWalk: parseFloat(entry.census_general_percent_of_workers_age_15_who_commute_by_walking) || 0,
      pctCommuteBike: parseFloat(entry.census_general_percent_of_workers_age_15_who_commute_by_bicycle) || 0,
      pctWorkFromHome: parseFloat(entry.census_general_percent_of_workers_age_15_who_work_at_home) || 0,
      // Walk/Bike scores
      walkScore: parseFloat(entry.walkscore_mean) || null,
      bikeScore: parseFloat(entry.bikescore_mean) || null,
      // Environment / Greenspace
      treeCanopy: parseFloat(entry.percent_coverage_tree_canopy_2024) || 0,
      parklandCoverage: parseFloat(entry.percent_coverage_parkland_residential) || 0,
    };
  }

  // Build greenbelt trails lookup by neighbourhood ID
  const greenbeltByNeighbourhood = {};
  for (const trail of greenbeltTrails) {
    const neighbourhoods = trail.NEIGHBOURHOODS ? trail.NEIGHBOURHOODS.split(';') : [];
    for (const neighbourhoodId of neighbourhoods) {
      if (!greenbeltByNeighbourhood[neighbourhoodId]) {
        greenbeltByNeighbourhood[neighbourhoodId] = [];
      }
      greenbeltByNeighbourhood[neighbourhoodId].push({
        name: trail.NAME,
        sector: trail.SECTOR,
        lengthKm: parseFloat(trail.LENGTH_KM) || 0,
        difficulty: trail.DIFFICULTY || 'Easy',
        type: trail.TYPE || 'Trail',
        parking: trail.PARKING || '',
        lat: parseFloat(trail.LATITUDE) || null,
        lng: parseFloat(trail.LONGITUDE) || null,
        notes: trail.NOTES || '',
        source: 'NCC',
      });
    }
  }

  console.log(`  - ${parksRaw.length} parks`);
  console.log(`  - ${schoolsRaw.length} schools`);
  console.log(`  - ${librariesRaw.length} libraries`);
  console.log(`  - ${crimeRaw.length} crimes`);
  console.log(`  - ${hospitalsRaw.length} hospitals`);
  console.log(`  - ${neighbourhoodsInfo.length} neighbourhoods\n`);

  // Fetch population data
  console.log('Fetching population data from Ottawa Open Data...');
  const populationByOnsId = await fetchPopulationData();
  console.log(`  Fetched population for ${Object.keys(populationByOnsId).length} ONS areas\n`);

  // Fetch all neighbourhood boundaries using Gen 3 (2024) API with ONS-SQO IDs
  console.log('Fetching neighbourhood boundaries from Ottawa Open Data (Gen 3)...');
  const allOnsIds = new Set();
  for (const config of Object.values(neighbourhoodMapping)) {
    // Use onsSqoIds for Gen 3 boundaries (same IDs as census data)
    (config.onsSqoIds || []).forEach(id => allOnsIds.add(id));
  }

  const boundariesByNeighbourhood = {};
  for (const [neighbourhoodId, config] of Object.entries(neighbourhoodMapping)) {
    process.stdout.write(`  Fetching ${neighbourhoodId}...`);

    // Check for custom boundary first
    if (config.customBoundary) {
      boundariesByNeighbourhood[neighbourhoodId] = [{
        onsId: 'custom',
        name: config.name,
        rings: config.customBoundary.rings,
      }];
      console.log(` 1 areas (custom boundary)`);
    } else {
      // Use onsSqoIds for Gen 3 API (IDs like 3044, 3047, etc.)
      const idsToFetch = config.onsSqoIds || [];
      boundariesByNeighbourhood[neighbourhoodId] = await fetchAllBoundaries(idsToFetch);
      console.log(` ${boundariesByNeighbourhood[neighbourhoodId].length} areas`);
    }
  }

  // Calculate neighbourhood areas (km²)
  console.log('\nCalculating neighbourhood land area (km²)...');
  const areaKm2ByNeighbourhood = {};
  for (const [neighbourhoodId, boundaries] of Object.entries(boundariesByNeighbourhood)) {
    let areaMeters2 = 0;
    for (const boundary of boundaries) {
      areaMeters2 += polygonAreaMetersSquared(boundary.rings);
    }
    areaKm2ByNeighbourhood[neighbourhoodId] = areaMeters2 > 0 ? areaMeters2 / 1e6 : 0;
  }
  console.log(`  Calculated area for ${Object.keys(areaKm2ByNeighbourhood).length} neighbourhoods`);

  // Process parks
  console.log('\nAssigning parks to neighbourhoods...');
  const parksByNeighbourhood = {};
  let assignedParks = 0;

  for (const park of parksRaw) {
    const lat = parseFloat(park.LATITUDE);
    const lng = parseFloat(park.LONGITUDE);

    if (isNaN(lat) || isNaN(lng)) continue;

    const neighbourhoodId = assignToNeighbourhood(lat, lng, boundariesByNeighbourhood);
    if (neighbourhoodId) {
      if (!parksByNeighbourhood[neighbourhoodId]) {
        parksByNeighbourhood[neighbourhoodId] = [];
      }
      parksByNeighbourhood[neighbourhoodId].push({
        name: park.NAME,
        type: park.PARK_TYPE,
        category: park.PARK_CATEGORY,
        lat,
        lng,
        ward: park.WARD_NAME,
        dogPolicy: park.DOG_DESIGNATION,
        address: park.ADDRESS,
      });
      assignedParks++;
    }
  }
  console.log(`  Assigned ${assignedParks} parks`);

  // Process schools
  console.log('\nAssigning schools to neighbourhoods...');
  const schoolsByNeighbourhood = {};
  let assignedSchools = 0;
  let matchedEqaoScores = 0;

  // Build EQAO lookup map
  const eqaoByName = new Map();
  for (const eqao of eqaoScores) {
    const normalized = normalizeSchoolName(eqao.schoolName);
    eqaoByName.set(normalized, parseInt(eqao.avgScore, 10));
  }

  // Helper to find EQAO score for a school
  function findEqaoScore(schoolName) {
    // Try direct normalized match first
    const normalized = normalizeSchoolName(schoolName);
    if (eqaoByName.has(normalized)) {
      return eqaoByName.get(normalized);
    }

    // Try fuzzy matching
    for (const eqao of eqaoScores) {
      if (matchSchoolNames(schoolName, eqao.schoolName)) {
        return parseInt(eqao.avgScore, 10);
      }
    }

    return null;
  }

  for (const school of schoolsRaw) {
    const lat = parseFloat(school.LATITUDE);
    const lng = parseFloat(school.LONGITUDE);

    if (isNaN(lat) || isNaN(lng)) continue;

    const neighbourhoodId = assignToNeighbourhood(lat, lng, boundariesByNeighbourhood);
    if (neighbourhoodId) {
      if (!schoolsByNeighbourhood[neighbourhoodId]) {
        schoolsByNeighbourhood[neighbourhoodId] = [];
      }

      // Find EQAO score for this school
      const eqaoScore = findEqaoScore(school.NAME);
      if (eqaoScore !== null) {
        matchedEqaoScores++;
      }

      schoolsByNeighbourhood[neighbourhoodId].push({
        name: school.NAME,
        board: school.BOARD,
        fullBoard: school.FULL_BOARD,
        category: school.CATEGORY,
        lat,
        lng,
        address: school.NUM ? `${school.NUM} ${school.STREET}` : school.STREET,
        phone: school.PHONE,
        eqaoScore, // EQAO score (percentage achieving provincial standard), null if not available
      });
      assignedSchools++;
    }
  }
  console.log(`  Assigned ${assignedSchools} schools`);
  console.log(`  Matched ${matchedEqaoScores} schools with EQAO scores`);

  // Process libraries
  console.log('\nAssigning libraries to neighbourhoods...');
  const librariesByNeighbourhood = {};
  let assignedLibraries = 0;

  for (const library of librariesRaw) {
    const lat = parseFloat(library.LATITUDE);
    const lng = parseFloat(library.LONGITUDE);

    if (isNaN(lat) || isNaN(lng)) continue;

    const neighbourhoodId = assignToNeighbourhood(lat, lng, boundariesByNeighbourhood);
    if (neighbourhoodId) {
      if (!librariesByNeighbourhood[neighbourhoodId]) {
        librariesByNeighbourhood[neighbourhoodId] = [];
      }
      librariesByNeighbourhood[neighbourhoodId].push({
        name: library.NAME,
        lat,
        lng,
        address: library.ADDRESS,
        postalCode: library.POSTAL_CODE,
        acronym: library.ACRONYM,
      });
      assignedLibraries++;
    }
  }
  console.log(`  Assigned ${assignedLibraries} libraries`);

  // Process OPH food establishments by category
  console.log('\nAssigning food establishments to neighbourhoods (OPH data)...');
  const foodByNeighbourhood = {};
  const foodCategoryCounts = {};
  let assignedFood = 0;

  // Initialize category counts
  for (const cat of CONSUMER_FOOD_CATEGORIES) {
    foodCategoryCounts[cat] = 0;
  }

  // Decode HTML entities in names
  function decodeHtmlEntities(str) {
    return (str || '')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, '')
      .replace(/[\x00-\x1F\x7F]/g, '');
  }

  if (hasOphFoodData) {
    for (const place of ophFoodRaw) {
      const lat = parseFloat(place.LATITUDE);
      const lng = parseFloat(place.LONGITUDE);
      const category = place.CATEGORY || 'unknown';

      // Only process consumer-facing categories
      if (!CONSUMER_FOOD_CATEGORIES.includes(category)) continue;
      if (isNaN(lat) || isNaN(lng)) continue;

      const neighbourhoodId = assignToNeighbourhood(lat, lng, boundariesByNeighbourhood);
      if (neighbourhoodId) {
        if (!foodByNeighbourhood[neighbourhoodId]) {
          foodByNeighbourhood[neighbourhoodId] = {
            all: [],
            restaurant: [],
            cafe: [],
            fast_food: [],
            coffee_shop: [],
            bakery: [],
            pub: [],
            bar: [],
            ice_cream: [],
            grocery: [],
            food_court: [],
          };
        }
        const establishment = {
          name: decodeHtmlEntities(place.NAME) || 'Unnamed',
          category,
          address: place.ADDRESS || '',
          lat,
          lng,
          id: place.ID,
        };
        foodByNeighbourhood[neighbourhoodId].all.push(establishment);
        if (foodByNeighbourhood[neighbourhoodId][category]) {
          foodByNeighbourhood[neighbourhoodId][category].push(establishment);
        }
        foodCategoryCounts[category]++;
        assignedFood++;
      }
    }
  }
  console.log(`  Assigned ${assignedFood} food establishments`);
  console.log(`  By category: ${Object.entries(foodCategoryCounts).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(', ')}`);

  // Legacy: Process grocery stores from old OSM data if no OPH data
  const groceryStoresByNeighbourhood = {};
  let assignedGroceryStores = 0;

  if (!hasOphFoodData && hasGroceryStoresData) {
    console.log('\nFallback: Assigning grocery stores from legacy OSM data...');
    for (const store of groceryStoresRaw) {
      const lat = parseFloat(store.LATITUDE);
      const lng = parseFloat(store.LONGITUDE);

      if (isNaN(lat) || isNaN(lng)) continue;

      const neighbourhoodId = assignToNeighbourhood(lat, lng, boundariesByNeighbourhood);
      if (neighbourhoodId) {
        if (!groceryStoresByNeighbourhood[neighbourhoodId]) {
          groceryStoresByNeighbourhood[neighbourhoodId] = [];
        }
        groceryStoresByNeighbourhood[neighbourhoodId].push({
          name: store.NAME || 'Unnamed',
          shopType: store.SHOP_TYPE || 'grocery',
          category: store.CATEGORY || 'Grocery Store',
          brand: store.BRAND || '',
          address: store.ADDRESS || '',
          lat,
          lng,
          osmId: store.OSM_ID,
          osmType: store.OSM_TYPE,
        });
        assignedGroceryStores++;
      }
    }
    console.log(`  Assigned ${assignedGroceryStores} grocery stores (legacy)`);
  }

  // Backwards compatibility: map OPH data to old format
  const restaurantsByNeighbourhood = {};
  for (const [nId, food] of Object.entries(foodByNeighbourhood)) {
    // Combine restaurants, cafes, fast_food for the old restaurantsAndCafes count
    const combined = [...(food.restaurant || []), ...(food.cafe || []), ...(food.fast_food || [])];
    restaurantsByNeighbourhood[nId] = combined;
  }

  // Process gyms & fitness centers (optional)
  console.log('\nAssigning gyms & fitness centers to neighbourhoods...');
  const gymsByNeighbourhood = {};
  let assignedGyms = 0;

  if (hasGymsData) {
    for (const gym of gymsRaw) {
      const lat = parseFloat(gym.LATITUDE);
      const lng = parseFloat(gym.LONGITUDE);

      if (isNaN(lat) || isNaN(lng)) continue;

      const neighbourhoodId = assignToNeighbourhood(lat, lng, boundariesByNeighbourhood);
      if (neighbourhoodId) {
        if (!gymsByNeighbourhood[neighbourhoodId]) {
          gymsByNeighbourhood[neighbourhoodId] = [];
        }
        gymsByNeighbourhood[neighbourhoodId].push({
          name: gym.NAME || 'Unnamed',
          leisureType: gym.LEISURE_TYPE || 'fitness_centre',
          category: gym.CATEGORY || 'Fitness Center',
          sport: gym.SPORT || '',
          brand: gym.BRAND || '',
          address: gym.ADDRESS || '',
          lat,
          lng,
          osmId: gym.OSM_ID,
          osmType: gym.OSM_TYPE,
        });
        assignedGyms++;
      }
    }
  }
  console.log(`  Assigned ${assignedGyms} gyms & fitness centers`);

  // Process recreation facilities (pools, arenas, rinks, etc.)
  console.log('\nAssigning recreation facilities to neighbourhoods...');
  const recreationFacilitiesByNeighbourhood = {};
  let assignedRecreationFacilities = 0;

  if (hasRecreationFacilitiesData) {
    for (const facility of recreationFacilitiesRaw) {
      const lat = parseFloat(facility.LATITUDE);
      const lng = parseFloat(facility.LONGITUDE);

      if (isNaN(lat) || isNaN(lng)) continue;

      const neighbourhoodId = assignToNeighbourhood(lat, lng, boundariesByNeighbourhood);
      if (neighbourhoodId) {
        if (!recreationFacilitiesByNeighbourhood[neighbourhoodId]) {
          recreationFacilitiesByNeighbourhood[neighbourhoodId] = [];
        }
        recreationFacilitiesByNeighbourhood[neighbourhoodId].push({
          name: facility.NAME || 'Unnamed',
          facilityType: facility.FACILITY_TYPE || 'Unknown',
          buildingName: facility.BUILDING_NAME || '',
          address: facility.ADDRESS || '',
          lat,
          lng,
          link: facility.LINK || '',
        });
        assignedRecreationFacilities++;
      }
    }
  }
  console.log(`  Assigned ${assignedRecreationFacilities} recreation facilities`);

  // Process sports courts (basketball, tennis, volleyball, sports fields, ball diamonds, pickleball)
  console.log('\nAssigning sports courts to neighbourhoods...');
  const sportsCourtsByNeighbourhood = {};
  let assignedSportsCourts = 0;

  if (hasSportsCourtsData) {
    for (const court of sportsCourtsRaw) {
      const lat = parseFloat(court.LATITUDE);
      const lng = parseFloat(court.LONGITUDE);

      if (isNaN(lat) || isNaN(lng)) continue;

      const neighbourhoodId = assignToNeighbourhood(lat, lng, boundariesByNeighbourhood);
      if (neighbourhoodId) {
        if (!sportsCourtsByNeighbourhood[neighbourhoodId]) {
          sportsCourtsByNeighbourhood[neighbourhoodId] = [];
        }
        sportsCourtsByNeighbourhood[neighbourhoodId].push({
          courtType: court.COURT_TYPE || 'Unknown',
          sportType: court.SPORT_TYPE || '',
          name: court.NAME || '',
          parkName: court.PARK_NAME || '',
          address: court.ADDRESS || '',
          fieldSize: court.FIELD_SIZE || '',
          lights: court.LIGHTS || '',
          accessible: court.ACCESSIBLE || '',
          lat,
          lng,
        });
        assignedSportsCourts++;
      }
    }
  }
  console.log(`  Assigned ${assignedSportsCourts} sports courts/fields`);

  // Process bus stops (optional)
  console.log('\nAssigning bus stops to neighbourhoods...');
  const busStopsByNeighbourhood = {};
  let assignedBusStops = 0;

  if (hasBusStopsData) {
    for (const stop of busStopsRaw) {
      const lat = parseFloat(stop.Latitude);
      const lng = parseFloat(stop.Longitude);

      if (isNaN(lat) || isNaN(lng)) continue;

      const neighbourhoodId = assignToNeighbourhood(lat, lng, boundariesByNeighbourhood);
      if (neighbourhoodId) {
        if (!busStopsByNeighbourhood[neighbourhoodId]) {
          busStopsByNeighbourhood[neighbourhoodId] = [];
        }
        busStopsByNeighbourhood[neighbourhoodId].push({
          stopId: stop.F560 || stop.FID,
          location: stop.Location || '',
          lat,
          lng,
          hasShelter: stop.Shelter === 'Y',
          hasBench: stop.Bench === 'Y',
        });
        assignedBusStops++;
      }
    }
  }
  console.log(`  Assigned ${assignedBusStops} bus stops`);

  // Assign traffic collisions to neighbourhoods
  console.log('\nAssigning traffic collisions to neighbourhoods...');
  const collisionsByNeighbourhood = {};
  let assignedCollisions = 0;

  if (hasCollisionsData) {
    for (const collision of collisionsRaw) {
      const lat = parseFloat(collision.LATITUDE);
      const lng = parseFloat(collision.LONGITUDE);

      if (isNaN(lat) || isNaN(lng)) continue;

      const neighbourhoodId = assignToNeighbourhood(lat, lng, boundariesByNeighbourhood);
      if (neighbourhoodId) {
        if (!collisionsByNeighbourhood[neighbourhoodId]) {
          collisionsByNeighbourhood[neighbourhoodId] = {
            total: 0,
            fatal: 0,
            injury: 0,
            propertyDamage: 0,
            pedestrian: 0,
            bicycle: 0,
            motorcycle: 0,
          };
        }
        const data = collisionsByNeighbourhood[neighbourhoodId];
        data.total++;

        // Classification
        const classification = collision.CLASSIFICATION || '';
        if (classification.includes('Fatal')) {
          data.fatal++;
        } else if (classification.includes('Non-fatal injury')) {
          data.injury++;
        } else if (classification.includes('P.D.')) {
          data.propertyDamage++;
        }

        // Vulnerable road users
        if (parseInt(collision.PEDESTRIANS) > 0) data.pedestrian++;
        if (parseInt(collision.BICYCLES) > 0) data.bicycle++;
        if (parseInt(collision.MOTORCYCLES) > 0) data.motorcycle++;

        assignedCollisions++;
      }
    }
  }
  console.log(`  Assigned ${assignedCollisions} traffic collisions`);

  // Assign cycling infrastructure to neighbourhoods
  console.log('\nAssigning cycling infrastructure to neighbourhoods...');
  const cyclingByNeighbourhood = {};
  let assignedCycling = 0;

  for (const segment of cyclingNetwork) {
    if (!segment.lat || !segment.lon) continue;

    const neighbourhoodId = assignToNeighbourhood(segment.lat, segment.lon, boundariesByNeighbourhood);
    if (neighbourhoodId) {
      if (!cyclingByNeighbourhood[neighbourhoodId]) {
        cyclingByNeighbourhood[neighbourhoodId] = {
          totalLengthM: 0,
          byType: {},
          segments: []
        };
      }
      const data = cyclingByNeighbourhood[neighbourhoodId];
      data.totalLengthM += segment.lengthM;

      if (!data.byType[segment.type]) {
        data.byType[segment.type] = 0;
      }
      data.byType[segment.type] += segment.lengthM;

      assignedCycling++;
    }
  }
  console.log(`  Assigned ${assignedCycling} cycling segments`);

  // Process hospitals - calculate nearest hospital for each neighbourhood
  console.log('\nCalculating hospital proximity for each neighbourhood...');
  const hospitals = hospitalsRaw.map(h => ({
    name: h.NAME,
    address: h.ADDRESS,
    phone: h.PHONE,
    lat: parseFloat(h.LATITUDE),
    lng: parseFloat(h.LONGITUDE),
    link: h.LINK,
  })).filter(h => !isNaN(h.lat) && !isNaN(h.lng));

  // Calculate centroid for each neighbourhood (from combined boundaries)
  const centroidsByNeighbourhood = {};
  for (const [neighbourhoodId, boundaries] of Object.entries(boundariesByNeighbourhood)) {
    // Combine all boundary points to get overall centroid
    let totalLat = 0, totalLng = 0, totalPoints = 0;
    for (const boundary of boundaries) {
      const centroid = calculateCentroid(boundary.rings);
      if (centroid) {
        totalLat += centroid.lat;
        totalLng += centroid.lng;
        totalPoints++;
      }
    }
    if (totalPoints > 0) {
      centroidsByNeighbourhood[neighbourhoodId] = {
        lat: totalLat / totalPoints,
        lng: totalLng / totalPoints,
      };
    }
  }

  // For each neighbourhood, find nearest hospital and distance
  const hospitalsByNeighbourhood = {};
  for (const [neighbourhoodId, centroid] of Object.entries(centroidsByNeighbourhood)) {
    let nearestHospital = null;
    let nearestDistance = Infinity;

    for (const hospital of hospitals) {
      const distance = haversineDistance(centroid.lat, centroid.lng, hospital.lat, hospital.lng);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestHospital = hospital;
      }
    }

    hospitalsByNeighbourhood[neighbourhoodId] = {
      nearestHospital: nearestHospital ? nearestHospital.name : null,
      nearestHospitalAddress: nearestHospital ? nearestHospital.address : null,
      distanceToNearestHospital: nearestDistance === Infinity ? null : Math.round(nearestDistance * 10) / 10, // km, 1 decimal
    };
  }
  console.log(`  Calculated proximity for ${Object.keys(hospitalsByNeighbourhood).length} neighbourhoods`);

  // Process transit stations - calculate nearest O-Train and Transitway station for each neighbourhood
  console.log('\nCalculating transit station proximity for each neighbourhood...');
  const transitStations = transitStationsRaw.map(s => ({
    name: s.NAME,
    type: s.TYPE,
    line: s.LINE,
    lat: parseFloat(s.LATITUDE),
    lng: parseFloat(s.LONGITUDE),
  })).filter(s => !isNaN(s.lat) && !isNaN(s.lng));

  const otrainStations = transitStations.filter(s => s.type === 'O-Train');
  const transitwayStations = transitStations.filter(s => s.type === 'Transitway');

  // For each neighbourhood, find nearest O-Train and Transitway station
  const transitByNeighbourhood = {};
  for (const [neighbourhoodId, centroid] of Object.entries(centroidsByNeighbourhood)) {
    // Find nearest O-Train station
    let nearestOTrain = null;
    let nearestOTrainDistance = Infinity;
    for (const station of otrainStations) {
      const distance = haversineDistance(centroid.lat, centroid.lng, station.lat, station.lng);
      if (distance < nearestOTrainDistance) {
        nearestOTrainDistance = distance;
        nearestOTrain = station;
      }
    }

    // Find nearest Transitway station
    let nearestTransitway = null;
    let nearestTransitwayDistance = Infinity;
    for (const station of transitwayStations) {
      const distance = haversineDistance(centroid.lat, centroid.lng, station.lat, station.lng);
      if (distance < nearestTransitwayDistance) {
        nearestTransitwayDistance = distance;
        nearestTransitway = station;
      }
    }

    // Find nearest rapid transit (either O-Train or Transitway)
    const nearestRapidTransit = nearestOTrainDistance <= nearestTransitwayDistance ? nearestOTrain : nearestTransitway;
    const nearestRapidTransitDistance = Math.min(nearestOTrainDistance, nearestTransitwayDistance);

    transitByNeighbourhood[neighbourhoodId] = {
      nearestOTrainStation: nearestOTrain ? nearestOTrain.name : null,
      nearestOTrainLine: nearestOTrain ? nearestOTrain.line : null,
      distanceToOTrain: nearestOTrainDistance === Infinity ? null : roundTo(nearestOTrainDistance, 1),
      nearestTransitwayStation: nearestTransitway ? nearestTransitway.name : null,
      distanceToTransitway: nearestTransitwayDistance === Infinity ? null : roundTo(nearestTransitwayDistance, 1),
      nearestRapidTransit: nearestRapidTransit ? nearestRapidTransit.name : null,
      nearestRapidTransitType: nearestRapidTransit ? nearestRapidTransit.type : null,
      distanceToRapidTransit: nearestRapidTransitDistance === Infinity ? null : roundTo(nearestRapidTransitDistance, 1),
    };
  }
  console.log(`  Calculated transit proximity for ${Object.keys(transitByNeighbourhood).length} neighbourhoods`);
  if (otrainStations.length > 0) {
    console.log(`  O-Train stations: ${otrainStations.length}`);
  }
  if (transitwayStations.length > 0) {
    console.log(`  Transitway stations: ${transitwayStations.length}`);
  }

  // Process crime data using point-in-polygon matching
  console.log('\nAssigning crimes to neighbourhoods and ONS zones...');
  const crimeByNeighbourhood = {};
  const crimeByOnsZone = {}; // Track crime per individual ONS zone
  let assignedCrimes = 0;
  let crimesWithoutCoords = 0;

  for (const crime of crimeRaw) {
    // Only include 2024 crimes
    if (crime.YEAR !== '2024') {
      continue;
    }

    const lat = parseFloat(crime.LATITUDE);
    const lng = parseFloat(crime.LONGITUDE);

    if (isNaN(lat) || isNaN(lng)) {
      crimesWithoutCoords++;
      continue;
    }

    const result = assignToOnsZone(lat, lng, boundariesByNeighbourhood);
    if (result) {
      const { neighbourhoodId, onsId } = result;

      // Track by neighbourhood
      if (!crimeByNeighbourhood[neighbourhoodId]) {
        crimeByNeighbourhood[neighbourhoodId] = {
          total: 0,
          byCategory: {},
        };
      }
      crimeByNeighbourhood[neighbourhoodId].total++;

      const category = crime.OFF_CATEG;
      if (!crimeByNeighbourhood[neighbourhoodId].byCategory[category]) {
        crimeByNeighbourhood[neighbourhoodId].byCategory[category] = 0;
      }
      crimeByNeighbourhood[neighbourhoodId].byCategory[category]++;

      // Track by ONS zone
      if (!crimeByOnsZone[onsId]) {
        crimeByOnsZone[onsId] = 0;
      }
      crimeByOnsZone[onsId]++;

      assignedCrimes++;
    }
  }
  console.log(`  Assigned ${assignedCrimes} crimes to neighbourhoods`);
  console.log(`  Tracked crime in ${Object.keys(crimeByOnsZone).length} ONS zones`);
  if (crimesWithoutCoords > 0) {
    console.log(`  Skipped ${crimesWithoutCoords} crimes without coordinates`);
  }

  // Build final data structure
  console.log('\nBuilding output data...');
  const neighbourhoods = [];

  for (const info of neighbourhoodsInfo) {
    const parks = parksByNeighbourhood[info.id] || [];
    const schools = schoolsByNeighbourhood[info.id] || [];
    const libraries = librariesByNeighbourhood[info.id] || [];
    const crime = crimeByNeighbourhood[info.id] || { total: 0, byCategory: {} };
    const hospitalData = hospitalsByNeighbourhood[info.id] || {
      nearestHospital: null,
      nearestHospitalAddress: null,
      distanceToNearestHospital: null,
    };
    const areaKm2 = areaKm2ByNeighbourhood[info.id] || 0;

    // Food establishments (from OPH data)
    const foodData = foodByNeighbourhood[info.id] || {
      all: [], restaurant: [], cafe: [], fast_food: [], coffee_shop: [],
      bakery: [], pub: [], bar: [], ice_cream: [], grocery: [], food_court: []
    };
    const totalFoodEstablishments = hasOphFoodData ? foodData.all.length : null;
    const totalFoodDensity = totalFoodEstablishments !== null && areaKm2 > 0
      ? roundTo(totalFoodEstablishments / areaKm2, 1) : null;

    // Individual category counts
    const restaurantCount = hasOphFoodData ? foodData.restaurant.length : null;
    const cafeCount = hasOphFoodData ? foodData.cafe.length : null;
    const coffeeShopCount = hasOphFoodData ? foodData.coffee_shop.length : null;
    const fastFoodCount = hasOphFoodData ? foodData.fast_food.length : null;
    const bakeryCount = hasOphFoodData ? foodData.bakery.length : null;
    const pubCount = hasOphFoodData ? foodData.pub.length : null;
    const barCount = hasOphFoodData ? foodData.bar.length : null;
    const iceCreamCount = hasOphFoodData ? foodData.ice_cream.length : null;
    const groceryFromOph = hasOphFoodData ? foodData.grocery.length : null;

    // Backwards compatibility - combine for old restaurantsAndCafes field
    const restaurants = restaurantsByNeighbourhood[info.id] || [];
    const restaurantsAndCafes = hasOphFoodData ? restaurants.length : null;
    const restaurantsAndCafesDensity = restaurantsAndCafes !== null && areaKm2 > 0
      ? roundTo(restaurantsAndCafes / areaKm2, 1) // per km²
      : null;

    // Grocery stores - prefer OPH data, fallback to legacy OSM data
    const groceryStores = hasOphFoodData ? foodData.grocery : (groceryStoresByNeighbourhood[info.id] || []);
    const groceryStoreCount = hasOphFoodData ? groceryFromOph : (hasGroceryStoresData ? groceryStores.length : null);
    const groceryStoreDensity = groceryStoreCount !== null && areaKm2 > 0
      ? roundTo(groceryStoreCount / areaKm2, 2) // per km²
      : null;
    const gyms = gymsByNeighbourhood[info.id] || [];
    const gymCount = hasGymsData ? gyms.length : null;
    const gymDensity = gymCount !== null && areaKm2 > 0
      ? roundTo(gymCount / areaKm2, 2) // per km²
      : null;
    const recreationFacilities = recreationFacilitiesByNeighbourhood[info.id] || [];
    const recreationFacilityCount = hasRecreationFacilitiesData ? recreationFacilities.length : null;
    const arenaCount = hasRecreationFacilitiesData
      ? recreationFacilities.filter(f => f.facilityType === 'Arena').length : null;
    const poolCount = hasRecreationFacilitiesData
      ? recreationFacilities.filter(f => f.facilityType === 'Pool - Indoor').length : null;
    const communityCentreCount = hasRecreationFacilitiesData
      ? recreationFacilities.filter(f => f.facilityType === 'Community Center').length : null;

    // Sports courts metrics
    const sportsCourts = sportsCourtsByNeighbourhood[info.id] || [];
    const sportsCourtCount = hasSportsCourtsData ? sportsCourts.length : null;
    const basketballCourtCount = hasSportsCourtsData
      ? sportsCourts.filter(c => c.courtType === 'Basketball Court').length : null;
    const tennisCourtCount = hasSportsCourtsData
      ? sportsCourts.filter(c => c.courtType === 'Tennis Court').length : null;
    const volleyballCourtCount = hasSportsCourtsData
      ? sportsCourts.filter(c => c.courtType === 'Volleyball Court').length : null;
    const pickleballCourtCount = hasSportsCourtsData
      ? sportsCourts.filter(c => c.courtType === 'Pickleball Court').length : null;
    const ballDiamondCount = hasSportsCourtsData
      ? sportsCourts.filter(c => c.courtType === 'Ball Diamond').length : null;
    const sportsFieldCount = hasSportsCourtsData
      ? sportsCourts.filter(c => c.courtType === 'Sports Field').length : null;
    const soccerFieldCount = hasSportsCourtsData
      ? sportsCourts.filter(c => c.sportType === 'soccer').length : null;
    const footballFieldCount = hasSportsCourtsData
      ? sportsCourts.filter(c => c.sportType === 'football').length : null;

    const busStops = busStopsByNeighbourhood[info.id] || [];
    const busStopCount = hasBusStopsData ? busStops.length : null;
    const busStopDensity = busStopCount !== null && areaKm2 > 0
      ? roundTo(busStopCount / areaKm2, 1) // per km²
      : null;
    const stopsWithShelter = busStops.filter(s => s.hasShelter).length;
    const stopsWithBench = busStops.filter(s => s.hasBench).length;

    // Get traffic collision data for this neighbourhood
    const collisions = collisionsByNeighbourhood[info.id] || {
      total: 0, fatal: 0, injury: 0, propertyDamage: 0,
      pedestrian: 0, bicycle: 0, motorcycle: 0
    };
    const collisionTotal = hasCollisionsData ? collisions.total : null;
    const collisionFatal = hasCollisionsData ? collisions.fatal : null;
    const collisionInjury = hasCollisionsData ? collisions.injury : null;
    const collisionPedestrian = hasCollisionsData ? collisions.pedestrian : null;
    const collisionBicycle = hasCollisionsData ? collisions.bicycle : null;

    // Get NCC Greenbelt trails for this neighbourhood
    const greenbeltTrailsForNeighbourhood = greenbeltByNeighbourhood[info.id] || [];
    const greenbeltTrailCount = greenbeltTrailsForNeighbourhood.length;
    const greenbeltTotalLengthKm = greenbeltTrailsForNeighbourhood.reduce((sum, t) => sum + t.lengthKm, 0);

    // Get cycling infrastructure for this neighbourhood
    const cyclingData = cyclingByNeighbourhood[info.id] || { totalLengthM: 0, byType: {} };
    const cyclingTotalKm = roundTo(cyclingData.totalLengthM / 1000, 1);
    const bikeLanesKm = roundTo(((cyclingData.byType['Bike Lane'] || 0) +
                                  (cyclingData.byType['Cycle Track'] || 0) +
                                  (cyclingData.byType['Segregated Bike Lane'] || 0)) / 1000, 1);
    const pathsKm = roundTo((cyclingData.byType['Path'] || 0) / 1000, 1);
    const pavedShouldersKm = roundTo((cyclingData.byType['Paved Shoulder'] || 0) / 1000, 1);

    // Get population data from ONS Census (2021 Census from ons-sqo.ca)
    // Aggregate population from all ONS-SQO areas that make up this neighbourhood
    const mapping = neighbourhoodMapping[info.id];
    let population = 0;
    let households = 0;
    let censusPctChildren = 0;
    let censusPctSeniors = 0;
    let censusMedIncome = 0;
    let censusUnemployment = 0;
    let censusPctRenters = 0;
    let censusPctImmigrants = 0;
    let censusPctRacialized = 0;
    let censusPctPostSecondary = 0;
    let censusPctCommuteCar = 0;
    let censusPctCommuteTransit = 0;
    let censusPctWorkFromHome = 0;
    let censusTreeCanopy = 0;
    let sqoAreasWithData = 0;

    if (mapping && mapping.onsSqoIds && mapping.onsSqoIds.length > 0) {
      // Use ONS-SQO census data (2021 Census)
      for (const sqoId of mapping.onsSqoIds) {
        const censusEntry = onsCensusBySqoId[sqoId];
        if (censusEntry) {
          population += censusEntry.population;
          households += censusEntry.households;
          // Accumulate for weighted average
          if (censusEntry.population > 0) {
            censusPctChildren += censusEntry.pctChildren * censusEntry.population;
            censusPctSeniors += censusEntry.pctSeniors * censusEntry.population;
            censusMedIncome += censusEntry.medianIncome * censusEntry.population;
            censusUnemployment += censusEntry.unemploymentRate * censusEntry.population;
            censusPctRenters += censusEntry.pctRenters * censusEntry.population;
            censusPctImmigrants += censusEntry.pctImmigrants * censusEntry.population;
            censusPctRacialized += censusEntry.pctRacialized * censusEntry.population;
            censusPctPostSecondary += censusEntry.pctPostSecondary * censusEntry.population;
            censusPctCommuteCar += censusEntry.pctCommuteCar * censusEntry.population;
            censusPctCommuteTransit += censusEntry.pctCommuteTransit * censusEntry.population;
            censusPctWorkFromHome += censusEntry.pctWorkFromHome * censusEntry.population;
            if (censusEntry.treeCanopy !== null) {
              censusTreeCanopy += censusEntry.treeCanopy * censusEntry.population;
            }
            sqoAreasWithData++;
          }
        }
      }
      // Calculate weighted averages
      if (population > 0) {
        censusPctChildren = roundTo(censusPctChildren / population, 1);
        censusPctSeniors = roundTo(censusPctSeniors / population, 1);
        censusMedIncome = Math.round(censusMedIncome / population);
        censusUnemployment = roundTo(censusUnemployment / population, 1);
        censusPctRenters = roundTo(censusPctRenters / population, 1);
        censusPctImmigrants = roundTo(censusPctImmigrants / population, 1);
        censusPctRacialized = roundTo(censusPctRacialized / population, 1);
        censusPctPostSecondary = roundTo(censusPctPostSecondary / population, 1);
        censusPctCommuteCar = roundTo(censusPctCommuteCar / population, 1);
        censusPctCommuteTransit = roundTo(censusPctCommuteTransit / population, 1);
        censusPctWorkFromHome = roundTo(censusPctWorkFromHome / population, 1);
        censusTreeCanopy = roundTo(censusTreeCanopy / population, 1);
      }
    } else if (mapping && mapping.onsIds) {
      // Fallback: Calculate population by summing all ONS areas (outdated POPEST)
      for (const onsId of mapping.onsIds) {
        population += populationByOnsId[onsId] || 0;
      }
    }

    // For historical values, we only have 2021 data from census
    const pop2021 = population;

    // Calculate population density (people per km²)
    const populationDensity = areaKm2 > 0 ? roundTo(population / areaKm2, 0) : 0;

    // Get walk scores for this neighbourhood
    const walkScores = walkScoresById[info.id] || { walkScore: 0, transitScore: 0, bikeScore: 0 };

    // Get age demographics for this neighbourhood
    const ageDemographics = ageDemographicsById[info.id] || { pctChildren: 0, pctYoungProfessionals: 0, pctSeniors: 0 };

    // Get commute time for this neighbourhood
    const commuteData = commuteTimesById[info.id] || { commuteToDowntown: 0, commuteByTransit: 0 };

    // Get transit station data for this neighbourhood
    const transitData = transitByNeighbourhood[info.id] || {
      nearestOTrainStation: null,
      nearestOTrainLine: null,
      distanceToOTrain: null,
      nearestTransitwayStation: null,
      distanceToTransitway: null,
      nearestRapidTransit: null,
      nearestRapidTransitType: null,
      distanceToRapidTransit: null,
    };

    // Aggregate overdose data from ONS neighbourhoods
    let overdoseCumulative = 0;
    let overdoseYearlyAvg = 0;
    let overdoseRatePer100k = null;
    let overdoseOnsAreas = 0;
    let overdoseYears = '';
    if (mapping && mapping.onsSqoIds && mapping.onsSqoIds.length > 0) {
      let rateSum = 0;
      let rateCount = 0;
      for (const sqoId of mapping.onsSqoIds) {
        const overdoseEntry = overdoseDataById[sqoId];
        if (overdoseEntry) {
          overdoseCumulative += overdoseEntry.cumulativeOverdoseEdVisits;
          overdoseYearlyAvg += overdoseEntry.yearlyAvgOverdoseEdVisits;
          if (overdoseEntry.overdoseRatePer100k !== null) {
            rateSum += overdoseEntry.overdoseRatePer100k;
            rateCount++;
          }
          if (!overdoseYears) overdoseYears = overdoseEntry.overdoseYears;
          overdoseOnsAreas++;
        }
      }
      // Average the rate if we have multiple ONS areas with data
      if (rateCount > 0) {
        overdoseRatePer100k = roundTo(rateSum / rateCount, 1);
      }
    }

    // Calculate average EQAO score for the neighbourhood
    const schoolsWithScores = schools.filter(s => s.eqaoScore !== null);
    const avgEqaoScore = schoolsWithScores.length > 0
      ? Math.round(schoolsWithScores.reduce((sum, s) => sum + s.eqaoScore, 0) / schoolsWithScores.length)
      : null;

    // Count schools by level
    const elementarySchools = schools.filter(s =>
      s.category === 'Elementary' || s.category === 'Elementary/Secondary'
    ).length;
    const secondarySchools = schools.filter(s =>
      s.category === 'Secondary' || s.category === 'Elementary/Secondary' || s.category === 'Intermediate'
    ).length;

    // Use census data for demographics if available, fall back to age_demographics.csv
    const finalPctChildren = censusPctChildren > 0 ? censusPctChildren : ageDemographics.pctChildren;
    const finalPctSeniors = censusPctSeniors > 0 ? censusPctSeniors : ageDemographics.pctSeniors;
    // Census median income can override CSV median income if available
    const finalMedianIncome = censusMedIncome > 0 ? censusMedIncome : (parseInt(info.medianIncome) || 0);

    neighbourhoods.push({
      id: info.id,
      name: info.name,
      area: info.area,
      image: info.image,
      population,
      populationDensity,
      households, // from 2021 Census
      pop2021, // 2021 Census population
      dataYear: 2021, // Census year
      dataSource: population > 0 && sqoAreasWithData > 0 ? 'Statistics Canada 2021 Census via ONS-SQO' : 'City of Ottawa POPEST',
      medianIncome: finalMedianIncome,
      avgRent: parseInt(info.avgRent) || 0,
      avgHomePrice: parseInt(info.avgHomePrice) || 0,
      walkScore: walkScores.walkScore,
      transitScore: walkScores.transitScore,
      bikeScore: walkScores.bikeScore,
      // Demographics from 2021 Census
      pctChildren: finalPctChildren,
      pctYoungProfessionals: ageDemographics.pctYoungProfessionals, // not in census data, keep from CSV
      pctSeniors: finalPctSeniors,
      // Additional census demographics
      unemploymentRate: censusUnemployment > 0 ? censusUnemployment : null,
      pctRenters: censusPctRenters > 0 ? censusPctRenters : null,
      pctImmigrants: censusPctImmigrants > 0 ? censusPctImmigrants : null,
      pctRacialized: censusPctRacialized > 0 ? censusPctRacialized : null,
      pctPostSecondary: censusPctPostSecondary > 0 ? censusPctPostSecondary : null,
      pctCommuteCar: censusPctCommuteCar > 0 ? censusPctCommuteCar : null,
      pctCommuteTransit: censusPctCommuteTransit > 0 ? censusPctCommuteTransit : null,
      pctWorkFromHome: censusPctWorkFromHome > 0 ? censusPctWorkFromHome : null,
      treeCanopy: censusTreeCanopy > 0 ? censusTreeCanopy : null,
      treeEquityScore: treeEquityData[info.id]?.treeEquityScore || null,
      treeEquityPriorityAreas: treeEquityData[info.id]?.priorityAreas || 0,
      neiScore: neiScoresById[info.id]?.neiScore || null,
      // Food Cost Burden (2025 Nutritious Food Basket vs Median Income)
      foodCostBurden: foodCostBurdenById[info.id]?.foodCostBurden || null,
      foodCostBurdenRating: foodCostBurdenById[info.id]?.foodCostBurdenRating || null,
      // Overdose ED visits (Ottawa Public Health, 2020-2024)
      overdoseCumulative: overdoseCumulative > 0 ? roundTo(overdoseCumulative, 1) : null,
      overdoseYearlyAvg: overdoseYearlyAvg > 0 ? roundTo(overdoseYearlyAvg, 1) : null,
      overdoseRatePer100k: overdoseRatePer100k,
      overdoseYears: overdoseYears || null,
      // Health indicators (OCHPP data)
      primaryCareAccess: healthDataById[info.id]?.primaryCareAccess || null,
      diabetesPrevalence: healthDataById[info.id]?.diabetesPrevalence || null,
      asthmaPrevalence: healthDataById[info.id]?.asthmaPrevalence || null,
      copdPrevalence: healthDataById[info.id]?.copdPrevalence || null,
      hypertensionPrevalence: healthDataById[info.id]?.hypertensionPrevalence || null,
      mentalHealthEdRate: healthDataById[info.id]?.mentalHealthEdRate || null,
      prematureMortality: healthDataById[info.id]?.prematureMortality || null,
      hospitalAdmissionRate: healthDataById[info.id]?.hospitalAdmissionRate || null,
      healthDataYear: healthDataById[info.id]?.healthDataYear || null,
      healthDataSource: healthDataById[info.id]?.healthDataSource || null,
      // Food Inspection data (Ottawa Public Health)
      foodEstablishments: foodInspectionData[info.id]?.establishments || 0,
      foodInspections: foodInspectionData[info.id]?.totalInspections || 0,
      foodInspectionAvgScore: foodInspectionData[info.id]?.avgScore || null,
      foodInspectionRecentAvgScore: foodInspectionData[info.id]?.recentAvgScore || null,
      foodViolations: foodInspectionData[info.id]?.totalViolations || 0,
      foodCriticalViolations: foodInspectionData[info.id]?.criticalViolations || 0,
      foodViolationsPerInspection: foodInspectionData[info.id]?.violationsPerInspection || null,
      foodPerfectScoreRate: foodInspectionData[info.id]?.perfectScoreRate || null,
      commuteToDowntown: commuteData.commuteToDowntown,
      commuteByTransit: commuteData.commuteByTransit,
      // Transit station proximity
      nearestOTrainStation: transitData.nearestOTrainStation,
      nearestOTrainLine: transitData.nearestOTrainLine,
      distanceToOTrain: transitData.distanceToOTrain,
      nearestTransitwayStation: transitData.nearestTransitwayStation,
      distanceToTransitway: transitData.distanceToTransitway,
      nearestRapidTransit: transitData.nearestRapidTransit,
      nearestRapidTransitType: transitData.nearestRapidTransitType,
      distanceToRapidTransit: transitData.distanceToRapidTransit,
      details: {
        areaKm2: roundTo(areaKm2, 2),
        parks: parks.length,
        parksList: parks.map(p => p.name),
        parksData: parks,
        schools: schools.length,
        elementarySchools,
        secondarySchools,
        schoolsList: schools.map(s => s.name),
        schoolsData: schools,
        avgEqaoScore, // Average EQAO score for schools in this neighbourhood (% achieving provincial standard)
        schoolsWithEqaoScores: schoolsWithScores.length,
        libraries: libraries.length,
        librariesList: libraries.map(l => l.name),
        librariesData: libraries,
        // Legacy fields for backwards compatibility
        restaurantsAndCafes,
        restaurantsAndCafesDensity,
        restaurantsList: restaurants.map(r => r.name),
        restaurantsData: restaurants,

        // New OPH food data by category
        foodEstablishments: totalFoodEstablishments,
        foodDensity: totalFoodDensity,
        foodData: foodData.all,
        // Individual categories
        restaurants: restaurantCount,
        restaurantsOnlyData: foodData.restaurant,
        cafes: cafeCount,
        cafesData: foodData.cafe,
        coffeeShops: coffeeShopCount,
        coffeeShopsData: foodData.coffee_shop,
        fastFood: fastFoodCount,
        fastFoodData: foodData.fast_food,
        bakeries: bakeryCount,
        bakeriesData: foodData.bakery,
        pubs: pubCount,
        pubsData: foodData.pub,
        bars: barCount,
        barsData: foodData.bar,
        iceCreamShops: iceCreamCount,
        iceCreamShopsData: foodData.ice_cream,

        // Grocery stores (OPH data preferred)
        groceryStores: groceryStoreCount,
        groceryStoreDensity,
        groceryStoresList: groceryStores.map(g => g.name),
        groceryStoresData: groceryStores,
        gyms: gymCount,
        gymDensity,
        gymsList: gyms.map(g => g.name),
        gymsData: gyms,
        // Recreation facilities (pools, arenas, rinks, etc.)
        recreationFacilities: recreationFacilityCount,
        recreationFacilitiesList: recreationFacilities.map(f => f.name),
        recreationFacilitiesData: recreationFacilities,
        arenas: arenaCount,
        pools: poolCount,
        communityCentres: communityCentreCount,
        // Sports courts (basketball, tennis, volleyball, sports fields, ball diamonds, pickleball)
        sportsCourts: sportsCourtCount,
        basketballCourts: basketballCourtCount,
        tennisCourts: tennisCourtCount,
        volleyballCourts: volleyballCourtCount,
        pickleballCourts: pickleballCourtCount,
        ballDiamonds: ballDiamondCount,
        sportsFields: sportsFieldCount,
        soccerFields: soccerFieldCount,
        footballFields: footballFieldCount,
        sportsCourtsData: sportsCourts,
        busStops: busStopCount,
        busStopDensity,
        stopsWithShelter,
        stopsWithBench,
        busStopsData: busStops,
        // Traffic collisions (2022-2024)
        collisions: collisionTotal,
        collisionsFatal: collisionFatal,
        collisionsInjury: collisionInjury,
        collisionsPedestrian: collisionPedestrian,
        collisionsBicycle: collisionBicycle,
        crimeTotal: crime.total,
        crimeByCategory: crime.byCategory,
        nearestHospital: hospitalData.nearestHospital,
        nearestHospitalAddress: hospitalData.nearestHospitalAddress,
        distanceToNearestHospital: hospitalData.distanceToNearestHospital,
        // NCC Greenbelt trails
        greenbeltTrails: greenbeltTrailCount,
        greenbeltTrailsLengthKm: roundTo(greenbeltTotalLengthKm, 1),
        greenbeltTrailsList: greenbeltTrailsForNeighbourhood.map(t => t.name),
        greenbeltTrailsData: greenbeltTrailsForNeighbourhood,
        // Cycling infrastructure
        cyclingTotalKm,
        bikeLanesKm,
        pathsKm,
        pavedShouldersKm,
        cyclingByType: cyclingData.byType,
        // 311 Service Requests (2024-2025)
        serviceRequests: serviceRequestsData[info.id]?.total || null,
        serviceRequestRate: serviceRequestsData[info.id]?.rate || null,
        serviceRequestsByType: serviceRequestsData[info.id]?.byType || {},
        // Road Quality (from 311 data - potholes, surface damage, etc.)
        roadQualityScore: serviceRequestsData[info.id]?.roadQualityScore || null,
        roadComplaints: serviceRequestsData[info.id]?.roadComplaints || null,
        roadComplaintsRate: serviceRequestsData[info.id]?.roadComplaintsRate || null,
        roadComplaintsPerKm2: serviceRequestsData[info.id]?.roadComplaintsPerKm2 || null,
        roadComplaintsByType: serviceRequestsData[info.id]?.roadComplaintsByType || {},
        // Noise Level (from 311 data - music, construction, shouting, etc.)
        quietScore: serviceRequestsData[info.id]?.quietScore || null,
        noiseComplaints: serviceRequestsData[info.id]?.noiseComplaints || null,
        noiseComplaintsRate: serviceRequestsData[info.id]?.noiseComplaintsRate || null,
        noiseComplaintsByType: serviceRequestsData[info.id]?.noiseComplaintsByType || {},
        // Development Activity (from City of Ottawa Development Applications)
        developmentScore: developmentData[info.id]?.developmentScore || null,
        developmentTotal: developmentData[info.id]?.total || null,
        developmentActive: developmentData[info.id]?.active || null,
        developmentApproved: developmentData[info.id]?.approved || null,
        developmentRecent: developmentData[info.id]?.recent || null,
        developmentRate: developmentData[info.id]?.developmentRate || null,
        developmentByType: developmentData[info.id]?.byType || {},
      },
      pros: info.pros ? info.pros.split('; ') : [],
      cons: info.cons ? info.cons.split('; ') : [],
      // Boundaries for map display (array of polygons with rings, population, and age demographics)
      // Gen 3 boundaries use ONS-SQO IDs which match census data directly
      boundaries: (boundariesByNeighbourhood[info.id] || []).map(b => {
        const censusData = onsCensusBySqoId[b.onsId] || {};
        const zoneCrimeTotal = crimeByOnsZone[b.onsId] || 0;
        const zonePopulation = censusData.population || 0;
        // Crime rate per 1,000 residents (2 years of data, so divide by 2 for annual rate)
        const crimeRate = zonePopulation > 0 ? roundTo((zoneCrimeTotal / zonePopulation) * 1000, 1) : 0;
        return {
          onsId: b.onsId,
          name: b.name,
          rings: b.rings,
          population: zonePopulation,
          // Age demographics from 2021 Census
          pctChildren: censusData.pctChildren || 0,
          pctYouth: censusData.pctYouth || 0,
          pctAdults: censusData.pctAdults || 0,
          pctSeniors: censusData.pctSeniors || 0,
          avgAge: censusData.avgAge || 0,
          // Education levels of residents (ages 25-64)
          pctNoHighSchool: censusData.pctNoHighSchool || 0,
          pctPostSecondary: censusData.pctPostSecondary || 0,
          pctBachelors: censusData.pctBachelors || 0,
          // Income data (2021 Census)
          medianIncome: censusData.medianIncome || 0,
          households: censusData.households || 0,
          // Diversity (2021 Census)
          pctImmigrants: censusData.pctImmigrants || 0,
          pctRacialized: censusData.pctRacialized || 0,
          // Greenspace (2024)
          treeCanopy: censusData.treeCanopy || 0,
          parklandCoverage: censusData.parklandCoverage || 0,
          // Crime data (2024)
          crimeTotal: zoneCrimeTotal,
          crimeRate: crimeRate,
          dataYear: '2021',
          source: 'Statistics Canada 2021 Census',
          sourceUrl: 'https://ons-sqo.ca',
        };
      }),
    });
  }

  // ============================================================================
  // Calculate Neighbourhood Scores
  // ============================================================================
  console.log('\nCalculating neighbourhood scores...');

  // NEW SCORING MODEL - Balanced for urban AND suburban neighbourhoods
  // Removes urban bias by focusing on universal quality-of-life factors
  //
  // Categories:
  //   - Safety (25%): Crime, collisions, overdose - matters everywhere
  //   - Schools (15%): EQAO scores, school availability
  //   - Health & Environment (15%): Tree canopy, healthcare access, food safety
  //   - Amenities (10%): Parks, grocery, recreation, libraries (counts, not density)
  //   - Community (10%): NEI equity score, road quality, city investment
  //   - Nature (10%): Trails, cycling infra, green space
  //   - Affordability (10%): Rent and home prices vs city median
  //   - Walkability (5%): Walk/transit/bike scores - still counts but doesn't dominate

  const SCORE_WEIGHTS = {
    safety: 0.20,           // Crime, collisions, overdose
    schools: 0.12,          // EQAO scores, school availability
    healthEnvironment: 0.15, // Tree canopy, healthcare, food safety
    amenities: 0.20,        // Parks, grocery, dining, recreation, libraries
    community: 0.12,        // NEI score, road quality - community health matters
    nature: 0.08,           // Trails, cycling infrastructure, green space
    affordability: 0.10,    // Rent, home prices, food costs
    walkability: 0.03,      // Walk/transit/bike scores
  };

  // Helper to calculate average, ignoring nulls
  function average(values) {
    const valid = values.filter(v => v !== null && v !== undefined);
    if (valid.length === 0) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  // Helper for weighted average of two values
  function weightedAvg(val1, weight1, val2, weight2) {
    if (val1 === null && val2 === null) return null;
    if (val1 === null) return val2;
    if (val2 === null) return val1;
    return (val1 * weight1 + val2 * weight2) / (weight1 + weight2);
  }

  // ABSOLUTE STANDARDS SCORING
  // Each metric has defined thresholds that map to scores
  // These are objective standards, not comparative to other Ottawa neighbourhoods

  // Threshold-based scoring: returns score based on where value falls in thresholds
  // thresholds: array of { max: number, score: number } sorted by max ascending
  // For "lower is better" metrics, pass the value as-is and structure thresholds accordingly
  function thresholdScore(value, thresholds, higherIsBetter = true) {
    if (value === null || value === undefined) return null;

    for (const t of thresholds) {
      if (higherIsBetter ? value <= t.max : value <= t.max) {
        return t.score;
      }
    }
    return thresholds[thresholds.length - 1].score;
  }

  // ABSOLUTE STANDARDS - Objective thresholds based on urban planning standards & research
  const STANDARDS = {
    // SAFETY - Based on Canadian crime statistics and public health data
    crime: { // per 1,000 residents - TOTAL crime (lower is better)
      thresholds: [
        { max: 15, score: 100, label: 'Very Low' },
        { max: 30, score: 80, label: 'Low' },
        { max: 50, score: 60, label: 'Moderate' },
        { max: 80, score: 40, label: 'High' },
        { max: 120, score: 20, label: 'Very High' },
        { max: Infinity, score: 0, label: 'Extreme' },
      ],
      unit: 'per 1,000',
      higherIsBetter: false,
    },
    violentCrime: { // per 1,000 residents - VIOLENT crimes (50% weight)
      thresholds: [
        { max: 3, score: 100, label: 'Very Low' },
        { max: 7, score: 80, label: 'Low' },
        { max: 12, score: 60, label: 'Moderate' },
        { max: 20, score: 40, label: 'High' },
        { max: 30, score: 20, label: 'Very High' },
        { max: Infinity, score: 0, label: 'Extreme' },
      ],
      unit: 'per 1,000',
      higherIsBetter: false,
    },
    propertyCrime: { // per 1,000 residents - PROPERTY crimes (30% weight)
      thresholds: [
        { max: 10, score: 100, label: 'Very Low' },
        { max: 25, score: 80, label: 'Low' },
        { max: 45, score: 60, label: 'Moderate' },
        { max: 70, score: 40, label: 'High' },
        { max: 100, score: 20, label: 'Very High' },
        { max: Infinity, score: 0, label: 'Extreme' },
      ],
      unit: 'per 1,000',
      higherIsBetter: false,
    },
    collisions: { // per 1,000 residents (lower is better)
      thresholds: [
        { max: 5, score: 100, label: 'Very Safe' },
        { max: 10, score: 80, label: 'Safe' },
        { max: 15, score: 60, label: 'Moderate' },
        { max: 25, score: 40, label: 'Elevated' },
        { max: 40, score: 20, label: 'High' },
        { max: Infinity, score: 0, label: 'Very High' },
      ],
      unit: 'per 1,000',
      higherIsBetter: false,
    },
    overdose: { // per 100,000 residents (lower is better)
      thresholds: [
        { max: 25, score: 100, label: 'Very Low' },
        { max: 50, score: 80, label: 'Low' },
        { max: 80, score: 60, label: 'Moderate' },
        { max: 120, score: 40, label: 'Elevated' },
        { max: 200, score: 20, label: 'High' },
        { max: Infinity, score: 0, label: 'Very High' },
      ],
      unit: 'per 100K',
      higherIsBetter: false,
    },

    // SCHOOLS - Based on Ontario education standards
    eqao: { // % meeting provincial standard (higher is better)
      thresholds: [
        { max: 49, score: 20, label: 'Below Standard' },
        { max: 59, score: 40, label: 'Approaching' },
        { max: 69, score: 60, label: 'Meeting' },
        { max: 79, score: 80, label: 'Above' },
        { max: 100, score: 100, label: 'Excellent' },
      ],
      unit: '%',
      higherIsBetter: true,
    },
    schoolCount: { // number of schools (higher is better)
      thresholds: [
        { max: 0, score: 0, label: 'None' },
        { max: 1, score: 40, label: 'Limited' },
        { max: 3, score: 60, label: 'Some' },
        { max: 6, score: 80, label: 'Good' },
        { max: Infinity, score: 100, label: 'Excellent' },
      ],
      unit: 'schools',
      higherIsBetter: true,
    },

    // HEALTH & ENVIRONMENT
    treeCanopy: { // % coverage (higher is better) - Urban forestry standards
      thresholds: [
        { max: 10, score: 20, label: 'Sparse' },
        { max: 20, score: 40, label: 'Low' },
        { max: 30, score: 60, label: 'Moderate' },
        { max: 40, score: 80, label: 'Good' },
        { max: 100, score: 100, label: 'Excellent' },
      ],
      unit: '%',
      higherIsBetter: true,
    },
    hospital: { // km to nearest (lower is better)
      thresholds: [
        { max: 3, score: 100, label: 'Very Close' },
        { max: 5, score: 80, label: 'Close' },
        { max: 8, score: 60, label: 'Moderate' },
        { max: 12, score: 40, label: 'Far' },
        { max: 20, score: 20, label: 'Very Far' },
        { max: Infinity, score: 0, label: 'Remote' },
      ],
      unit: 'km',
      higherIsBetter: false,
    },
    primaryCare: { // % with family doctor (higher is better)
      thresholds: [
        { max: 74, score: 20, label: 'Poor' },
        { max: 79, score: 40, label: 'Low' },
        { max: 84, score: 60, label: 'Moderate' },
        { max: 89, score: 80, label: 'Good' },
        { max: 100, score: 100, label: 'Excellent' },
      ],
      unit: '%',
      higherIsBetter: true,
    },
    foodSafety: { // inspection score 0-100 (higher is better)
      thresholds: [
        { max: 95, score: 20, label: 'Poor' },
        { max: 97, score: 50, label: 'Fair' },
        { max: 98, score: 70, label: 'Good' },
        { max: 99, score: 85, label: 'Very Good' },
        { max: 100, score: 100, label: 'Excellent' },
      ],
      unit: 'score',
      higherIsBetter: true,
    },

    // AMENITIES - Density-based for urban, count-based for suburban/rural
    // Urban threshold: >2000 people/km² uses density scoring
    // Suburban/rural: <2000 people/km² uses count scoring

    // URBAN density thresholds (per km²)
    parksDensity: { // parks per km² (for urban areas >2000/km²)
      thresholds: [
        { max: 0, score: 0, label: 'None' },
        { max: 1, score: 40, label: 'Sparse' },
        { max: 2, score: 60, label: 'Moderate' },
        { max: 4, score: 80, label: 'Good' },
        { max: Infinity, score: 100, label: 'Excellent' },
      ],
      unit: 'per km²',
      higherIsBetter: true,
    },
    groceryDensity: { // grocery stores per km² (for urban areas)
      thresholds: [
        { max: 0, score: 0, label: 'None' },
        { max: 0.5, score: 40, label: 'Sparse' },
        { max: 1, score: 60, label: 'Some' },
        { max: 2, score: 80, label: 'Good' },
        { max: Infinity, score: 100, label: 'Excellent' },
      ],
      unit: 'per km²',
      higherIsBetter: true,
    },
    diningDensity: { // dining places per km² (for urban areas)
      thresholds: [
        { max: 0, score: 0, label: 'None' },
        { max: 5, score: 30, label: 'Few' },
        { max: 15, score: 50, label: 'Some' },
        { max: 30, score: 70, label: 'Good' },
        { max: 60, score: 85, label: 'Many' },
        { max: Infinity, score: 100, label: 'Abundant' },
      ],
      unit: 'per km²',
      higherIsBetter: true,
    },
    recreationDensity: { // recreation facilities per km² (for urban areas)
      thresholds: [
        { max: 0, score: 0, label: 'None' },
        { max: 0.3, score: 40, label: 'Sparse' },
        { max: 0.6, score: 60, label: 'Some' },
        { max: 1, score: 80, label: 'Good' },
        { max: Infinity, score: 100, label: 'Excellent' },
      ],
      unit: 'per km²',
      higherIsBetter: true,
    },

    // SUBURBAN/RURAL count thresholds (for areas <2000/km²)
    // These areas have access via car, so absolute count matters more
    parks: { // count (for suburban/rural areas)
      thresholds: [
        { max: 0, score: 0, label: 'None' },
        { max: 3, score: 40, label: 'Few' },
        { max: 8, score: 60, label: 'Some' },
        { max: 15, score: 80, label: 'Good' },
        { max: Infinity, score: 100, label: 'Many' },
      ],
      unit: 'parks',
      higherIsBetter: true,
    },
    grocery: { // count (for suburban/rural areas)
      thresholds: [
        { max: 0, score: 0, label: 'None' },
        { max: 1, score: 50, label: 'Limited' },
        { max: 3, score: 70, label: 'Some' },
        { max: 6, score: 85, label: 'Good' },
        { max: Infinity, score: 100, label: 'Excellent' },
      ],
      unit: 'stores',
      higherIsBetter: true,
    },
    dining: { // count (for suburban/rural areas)
      thresholds: [
        { max: 0, score: 0, label: 'None' },
        { max: 5, score: 30, label: 'Few' },
        { max: 15, score: 50, label: 'Some' },
        { max: 30, score: 70, label: 'Good' },
        { max: 60, score: 85, label: 'Many' },
        { max: Infinity, score: 100, label: 'Abundant' },
      ],
      unit: 'places',
      higherIsBetter: true,
    },
    recreation: { // count (for suburban/rural areas)
      thresholds: [
        { max: 0, score: 0, label: 'None' },
        { max: 1, score: 50, label: 'Limited' },
        { max: 3, score: 70, label: 'Some' },
        { max: 6, score: 85, label: 'Good' },
        { max: Infinity, score: 100, label: 'Excellent' },
      ],
      unit: 'facilities',
      higherIsBetter: true,
    },
    libraries: { // count - same for all areas (1 library often serves the whole area)
      thresholds: [
        { max: 0, score: 0, label: 'None' },
        { max: 1, score: 70, label: 'One' },
        { max: Infinity, score: 100, label: 'Multiple' },
      ],
      unit: 'libraries',
      higherIsBetter: true,
    },

    // COMMUNITY
    nei: { // Neighbourhood Equity Index 0-100 (higher is better)
      thresholds: [
        { max: 40, score: 20, label: 'Low Equity' },
        { max: 55, score: 40, label: 'Below Average' },
        { max: 70, score: 60, label: 'Average' },
        { max: 85, score: 80, label: 'Good' },
        { max: 100, score: 100, label: 'High Equity' },
      ],
      unit: 'score',
      higherIsBetter: true,
    },
    roadQuality: { // 0-100 score (higher is better)
      thresholds: [
        { max: 20, score: 20, label: 'Poor' },
        { max: 40, score: 40, label: 'Fair' },
        { max: 60, score: 60, label: 'Moderate' },
        { max: 80, score: 80, label: 'Good' },
        { max: 100, score: 100, label: 'Excellent' },
      ],
      unit: 'score',
      higherIsBetter: true,
    },
    quietScore: { // 0-100 score (higher is better)
      thresholds: [
        { max: 20, score: 20, label: 'Noisy' },
        { max: 40, score: 40, label: 'Moderate' },
        { max: 60, score: 60, label: 'Average' },
        { max: 80, score: 80, label: 'Quiet' },
        { max: 100, score: 100, label: 'Very Quiet' },
      ],
      unit: 'score',
      higherIsBetter: true,
    },
    serviceRequests: { // per 1,000 residents (lower is better)
      thresholds: [
        { max: 300, score: 100, label: 'Very Low' },
        { max: 500, score: 80, label: 'Low' },
        { max: 700, score: 60, label: 'Moderate' },
        { max: 900, score: 40, label: 'High' },
        { max: 1200, score: 20, label: 'Very High' },
        { max: Infinity, score: 0, label: 'Extreme' },
      ],
      unit: 'per 1,000',
      higherIsBetter: false,
    },

    // NATURE
    trails: { // km of trails (higher is better)
      thresholds: [
        { max: 0, score: 0, label: 'None' },
        { max: 2, score: 30, label: 'Limited' },
        { max: 5, score: 50, label: 'Some' },
        { max: 10, score: 70, label: 'Good' },
        { max: 20, score: 85, label: 'Extensive' },
        { max: Infinity, score: 100, label: 'Excellent' },
      ],
      unit: 'km',
      higherIsBetter: true,
    },
    cycling: { // km of cycling infra (higher is better)
      thresholds: [
        { max: 0, score: 0, label: 'None' },
        { max: 3, score: 30, label: 'Limited' },
        { max: 8, score: 50, label: 'Some' },
        { max: 15, score: 70, label: 'Good' },
        { max: 25, score: 85, label: 'Extensive' },
        { max: Infinity, score: 100, label: 'Excellent' },
      ],
      unit: 'km',
      higherIsBetter: true,
    },

    // AFFORDABILITY - Based on Ottawa market data
    rent: { // monthly rent (lower is better)
      thresholds: [
        { max: 1500, score: 100, label: 'Very Affordable' },
        { max: 1800, score: 80, label: 'Affordable' },
        { max: 2100, score: 60, label: 'Moderate' },
        { max: 2400, score: 40, label: 'Expensive' },
        { max: 2800, score: 20, label: 'Very Expensive' },
        { max: Infinity, score: 0, label: 'Premium' },
      ],
      unit: '$/mo',
      higherIsBetter: false,
    },
    homePrice: { // home price (lower is better)
      thresholds: [
        { max: 450000, score: 100, label: 'Very Affordable' },
        { max: 550000, score: 80, label: 'Affordable' },
        { max: 700000, score: 60, label: 'Moderate' },
        { max: 900000, score: 40, label: 'Expensive' },
        { max: 1200000, score: 20, label: 'Very Expensive' },
        { max: Infinity, score: 0, label: 'Premium' },
      ],
      unit: '$',
      higherIsBetter: false,
    },
    foodCostBurden: { // % of income (lower is better)
      thresholds: [
        { max: 10, score: 100, label: 'Very Low' },
        { max: 14, score: 80, label: 'Low' },
        { max: 18, score: 60, label: 'Moderate' },
        { max: 22, score: 40, label: 'High' },
        { max: 28, score: 20, label: 'Very High' },
        { max: Infinity, score: 0, label: 'Severe' },
      ],
      unit: '%',
      higherIsBetter: false,
    },

    // WALKABILITY - Using Walk Score's official thresholds
    walk: { // Walk Score 0-100
      thresholds: [
        { max: 24, score: 20, label: 'Car-Dependent' },
        { max: 49, score: 40, label: 'Car-Dependent' },
        { max: 69, score: 60, label: 'Somewhat Walkable' },
        { max: 89, score: 80, label: 'Very Walkable' },
        { max: 100, score: 100, label: "Walker's Paradise" },
      ],
      unit: 'score',
      higherIsBetter: true,
    },
    transit: { // Transit Score 0-100
      thresholds: [
        { max: 24, score: 20, label: 'Minimal Transit' },
        { max: 49, score: 40, label: 'Some Transit' },
        { max: 69, score: 60, label: 'Good Transit' },
        { max: 89, score: 80, label: 'Excellent Transit' },
        { max: 100, score: 100, label: 'World-Class' },
      ],
      unit: 'score',
      higherIsBetter: true,
    },
    bike: { // Bike Score 0-100
      thresholds: [
        { max: 49, score: 40, label: 'Bikeable' },
        { max: 69, score: 60, label: 'Bikeable' },
        { max: 89, score: 80, label: 'Very Bikeable' },
        { max: 100, score: 100, label: "Biker's Paradise" },
      ],
      unit: 'score',
      higherIsBetter: true,
    },
  };

  // Get score using absolute standards
  function getAbsoluteScore(value, standardKey) {
    if (value === null || value === undefined) return null;
    const standard = STANDARDS[standardKey];
    if (!standard) return null;

    for (const t of standard.thresholds) {
      if (value <= t.max) {
        return standard.higherIsBetter ? t.score : t.score;
      }
    }
    return standard.thresholds[standard.thresholds.length - 1].score;
  }

  // Get label for a value based on absolute standards
  function getAbsoluteLabel(value, standardKey) {
    if (value === null || value === undefined) return null;
    const standard = STANDARDS[standardKey];
    if (!standard) return null;

    for (const t of standard.thresholds) {
      if (value <= t.max) {
        return t.label;
      }
    }
    return standard.thresholds[standard.thresholds.length - 1].label;
  }

  // Crime classification for weighted scoring
  const VIOLENT_CRIMES = [
    'Assaults',
    'Other Violations Involving Violence Or The Threat Of Violence',
    'Offensive Weapons',
    'Violations Resulting In The Deprivation Of Freedom',
    'Robbery',
    'Sexual Violations',
    'Homicide',
  ];

  const PROPERTY_CRIMES = [
    'Break and Enter',
    'Theft $5000 and Under',
    'Theft Over $5000',
    'Theft - Motor Vehicle',
    'Possession / Trafficking Stolen Goods',
    'Mischief',
    'Arson',
  ];

  // Helper to calculate crime by type
  function getCrimeByType(crimeByCategory, types) {
    if (!crimeByCategory) return 0;
    let total = 0;
    for (const [category, count] of Object.entries(crimeByCategory)) {
      if (types.some(t => category.toLowerCase().includes(t.toLowerCase()))) {
        total += count || 0;
      }
    }
    return total;
  }

  // Calculate scores for each neighbourhood
  for (const neighbourhood of neighbourhoods) {
    const pop = neighbourhood.population || 1;
    const areaKm2 = neighbourhood.details.areaKm2 || 1;

    // Calculate violent and property crime counts
    const violentCrimeCount = getCrimeByType(neighbourhood.details.crimeByCategory, VIOLENT_CRIMES);
    const propertyCrimeCount = getCrimeByType(neighbourhood.details.crimeByCategory, PROPERTY_CRIMES);
    const otherCrimeCount = neighbourhood.details.crimeTotal - violentCrimeCount - propertyCrimeCount;

    // Calculate crime rates per 1,000 residents
    const otherCrimeRate = pop > 0 ? Math.round((otherCrimeCount / pop) * 1000 * 10) / 10 : null;

    // Determine if urban or suburban/rural (threshold: 2000 people/km²)
    const URBAN_DENSITY_THRESHOLD = 2000;
    const isUrban = neighbourhood.populationDensity > URBAN_DENSITY_THRESHOLD;

    // Calculate amenity densities (per km²)
    const parksCount = neighbourhood.details.parks || 0;
    const groceryCount = neighbourhood.details.groceryStores || 0;
    const diningCount = neighbourhood.details.foodEstablishments || 0;
    const recreationCount = neighbourhood.details.recreationFacilities || 0;

    const parksDensity = areaKm2 > 0 ? Math.round((parksCount / areaKm2) * 10) / 10 : 0;
    const groceryDensity = areaKm2 > 0 ? Math.round((groceryCount / areaKm2) * 10) / 10 : 0;
    const diningDensity = areaKm2 > 0 ? Math.round((diningCount / areaKm2) * 10) / 10 : 0;
    const recreationDensity = areaKm2 > 0 ? Math.round((recreationCount / areaKm2) * 10) / 10 : 0;

    // Calculate raw metric values (for transparency in UI)
    const rawValues = {
      // Crime metrics for weighted scoring
      crime: pop > 0 ? Math.round((neighbourhood.details.crimeTotal / pop) * 1000 * 10) / 10 : null, // total crime rate
      violentCrime: pop > 0 ? Math.round((violentCrimeCount / pop) * 1000 * 10) / 10 : null,
      propertyCrime: pop > 0 ? Math.round((propertyCrimeCount / pop) * 1000 * 10) / 10 : null,
      otherCrime: otherCrimeRate,
      collisions: pop > 0 && neighbourhood.details.collisions
        ? Math.round((neighbourhood.details.collisions / pop) * 1000 * 10) / 10 : null,
      overdose: neighbourhood.overdoseRatePer100k,
      eqao: neighbourhood.details.avgEqaoScore,
      schoolCount: neighbourhood.details.schools,
      treeCanopy: neighbourhood.treeCanopy,
      hospital: neighbourhood.details.distanceToNearestHospital,
      primaryCare: neighbourhood.primaryCareAccess,
      foodSafety: neighbourhood.foodInspectionAvgScore,
      // Amenities - use density for urban, count for suburban/rural (stored for UI transparency)
      parks: isUrban ? parksDensity : parksCount,
      grocery: isUrban ? groceryDensity : groceryCount,
      dining: isUrban ? diningDensity : diningCount,
      recreation: isUrban ? recreationDensity : recreationCount,
      // Store both for UI display
      parksCount,
      groceryCount,
      diningCount,
      recreationCount,
      parksDensity,
      groceryDensity,
      diningDensity,
      recreationDensity,
      isUrban,
      libraries: neighbourhood.details.libraries,
      nei: neighbourhood.neiScore,
      roadQuality: neighbourhood.details.roadQualityScore,
      quietScore: neighbourhood.details.quietScore,
      serviceRequests: neighbourhood.details.serviceRequestRate,
      trails: neighbourhood.details.greenbeltTrailsLengthKm || 0,
      cycling: neighbourhood.details.cyclingTotalKm || 0,
      rent: neighbourhood.avgRent,
      homePrice: neighbourhood.avgHomePrice,
      foodCostBurden: neighbourhood.foodCostBurden,
      walk: neighbourhood.walkScore,
      transit: neighbourhood.transitScore,
      bike: neighbourhood.bikeScore,
    };

    // Calculate individual crime type scores
    const violentScore = getAbsoluteScore(rawValues.violentCrime, 'violentCrime');
    const propertyScore = getAbsoluteScore(rawValues.propertyCrime, 'propertyCrime');
    const otherScore = getAbsoluteScore(rawValues.otherCrime, 'crime'); // use generic crime thresholds for other

    // Weighted crime score: Violent 50%, Property 30%, Other 20%
    let crimeScore = null;
    if (violentScore !== null && propertyScore !== null && otherScore !== null) {
      crimeScore = Math.round(violentScore * 0.5 + propertyScore * 0.3 + otherScore * 0.2);
    } else if (rawValues.crime !== null) {
      // Fallback to total crime if breakdown not available
      crimeScore = getAbsoluteScore(rawValues.crime, 'crime');
    }

    // Calculate scores using ABSOLUTE STANDARDS
    const scores = {
      // Safety (20%) - Crime is now weighted: Violent 50%, Property 30%, Other 20%
      crime: crimeScore,
      violentCrime: violentScore, // Store individual scores for transparency
      propertyCrime: propertyScore,
      collisions: getAbsoluteScore(rawValues.collisions, 'collisions'),
      overdose: getAbsoluteScore(rawValues.overdose, 'overdose'),

      // Schools (12%) - EQAO weighted 70%, school count 30%
      eqao: getAbsoluteScore(rawValues.eqao, 'eqao'),
      schoolCount: getAbsoluteScore(rawValues.schoolCount, 'schoolCount'),

      // Health & Environment (15%)
      treeCanopy: getAbsoluteScore(rawValues.treeCanopy, 'treeCanopy'),
      hospital: getAbsoluteScore(rawValues.hospital, 'hospital'),
      primaryCare: getAbsoluteScore(rawValues.primaryCare, 'primaryCare'),
      foodSafety: getAbsoluteScore(rawValues.foodSafety, 'foodSafety'),

      // Amenities (13%) - Use density for urban, count for suburban/rural
      parks: isUrban
        ? getAbsoluteScore(rawValues.parksDensity, 'parksDensity')
        : getAbsoluteScore(rawValues.parksCount, 'parks'),
      grocery: isUrban
        ? getAbsoluteScore(rawValues.groceryDensity, 'groceryDensity')
        : getAbsoluteScore(rawValues.groceryCount, 'grocery'),
      dining: isUrban
        ? getAbsoluteScore(rawValues.diningDensity, 'diningDensity')
        : getAbsoluteScore(rawValues.diningCount, 'dining'),
      recreation: isUrban
        ? getAbsoluteScore(rawValues.recreationDensity, 'recreationDensity')
        : getAbsoluteScore(rawValues.recreationCount, 'recreation'),
      libraries: getAbsoluteScore(rawValues.libraries, 'libraries'),

      // Community (15%)
      nei: getAbsoluteScore(rawValues.nei, 'nei'),
      roadQuality: getAbsoluteScore(rawValues.roadQuality, 'roadQuality'),
      quietScore: getAbsoluteScore(rawValues.quietScore, 'quietScore'),
      serviceRequests: getAbsoluteScore(rawValues.serviceRequests, 'serviceRequests'),

      // Nature (10%)
      trails: getAbsoluteScore(rawValues.trails, 'trails'),
      cycling: getAbsoluteScore(rawValues.cycling, 'cycling'),

      // Affordability (10%)
      rent: getAbsoluteScore(rawValues.rent, 'rent'),
      homePrice: getAbsoluteScore(rawValues.homePrice, 'homePrice'),
      foodCostBurden: getAbsoluteScore(rawValues.foodCostBurden, 'foodCostBurden'),

      // Walkability (5%)
      walk: getAbsoluteScore(rawValues.walk, 'walk'),
      transit: getAbsoluteScore(rawValues.transit, 'transit'),
      bike: getAbsoluteScore(rawValues.bike, 'bike'),
    };

    // Calculate category scores
    const categoryScores = {
      safety: average([scores.crime, scores.collisions, scores.overdose]),
      schools: weightedAvg(scores.eqao, 0.7, scores.schoolCount, 0.3), // EQAO 70%, count 30%
      healthEnvironment: average([scores.treeCanopy, scores.hospital, scores.primaryCare, scores.foodSafety]),
      amenities: average([scores.parks, scores.grocery, scores.dining, scores.recreation, scores.libraries]),
      community: average([scores.nei, scores.roadQuality, scores.quietScore, scores.serviceRequests]),
      nature: average([scores.trails, scores.cycling]),
      affordability: average([scores.rent, scores.homePrice, scores.foodCostBurden]),
      walkability: average([scores.walk, scores.transit, scores.bike]),
    };

    // Calculate weighted total score
    let totalScore = 0;
    let totalWeight = 0;

    for (const [category, weight] of Object.entries(SCORE_WEIGHTS)) {
      const categoryScore = categoryScores[category];
      if (categoryScore !== null) {
        totalScore += categoryScore * weight;
        totalWeight += weight;
      }
    }

    const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

    // Add scores to neighbourhood object
    neighbourhood.overallScore = finalScore;
    neighbourhood.categoryScores = {
      safety: categoryScores.safety !== null ? Math.round(categoryScores.safety) : null,
      schools: categoryScores.schools !== null ? Math.round(categoryScores.schools) : null,
      healthEnvironment: categoryScores.healthEnvironment !== null ? Math.round(categoryScores.healthEnvironment) : null,
      amenities: categoryScores.amenities !== null ? Math.round(categoryScores.amenities) : null,
      community: categoryScores.community !== null ? Math.round(categoryScores.community) : null,
      nature: categoryScores.nature !== null ? Math.round(categoryScores.nature) : null,
      affordability: categoryScores.affordability !== null ? Math.round(categoryScores.affordability) : null,
      walkability: categoryScores.walkability !== null ? Math.round(categoryScores.walkability) : null,
    };
    neighbourhood.scoreWeights = SCORE_WEIGHTS;
    // Store individual metric scores for detailed breakdown
    neighbourhood.metricScores = {
      // Safety metrics (crime is weighted: violent 50%, property 30%, other 20%)
      crime: scores.crime,
      violentCrime: scores.violentCrime,
      propertyCrime: scores.propertyCrime,
      collisions: scores.collisions,
      overdose: scores.overdose,
      // School metrics
      eqao: scores.eqao,
      schoolCount: scores.schoolCount,
      // Health & Environment metrics
      treeCanopy: scores.treeCanopy,
      hospital: scores.hospital,
      primaryCare: scores.primaryCare,
      foodSafety: scores.foodSafety,
      // Amenity metrics
      parks: scores.parks,
      grocery: scores.grocery,
      dining: scores.dining,
      recreation: scores.recreation,
      libraries: scores.libraries,
      // Community metrics
      nei: scores.nei,
      roadQuality: scores.roadQuality,
      quietScore: scores.quietScore,
      serviceRequests: scores.serviceRequests,
      // Nature metrics
      trails: scores.trails,
      cycling: scores.cycling,
      // Affordability metrics
      rent: scores.rent,
      homePrice: scores.homePrice,
      foodCostBurden: scores.foodCostBurden,
      // Walkability metrics
      walk: scores.walk,
      transit: scores.transit,
      bike: scores.bike,
    };
    // Store raw values for transparency in UI
    neighbourhood.rawMetricValues = rawValues;
  }

  // Sort neighbourhoods by overall score for summary
  const sortedByScore = [...neighbourhoods].sort((a, b) => b.overallScore - a.overallScore);
  console.log('  Top 5 neighbourhoods by overall score:');
  for (const n of sortedByScore.slice(0, 5)) {
    console.log(`    ${n.overallScore}/100 - ${n.name}`);
  }

  // Assign ranks based on overall score (1 = best)
  sortedByScore.forEach((n, index) => {
    n.rank = index + 1;
  });
  console.log(`\nAssigned ranks 1-${neighbourhoods.length} to neighbourhoods`);

  // Write output (minified for faster loading)
  const outputFile = path.join(outputDir, 'data.json');
  fs.writeFileSync(outputFile, JSON.stringify({ neighbourhoods }));
  const fileSizeMB = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(2);
  console.log(`\nWritten to: ${outputFile} (${fileSizeMB} MB)`);

  // Export assigned restaurants to CSV
  if (hasOphFoodData) {
    const restaurantsCsvRows = [];
    for (const n of neighbourhoods) {
      const restaurants = n.details.restaurantsData || [];
      for (const r of restaurants) {
        restaurantsCsvRows.push({
          neighbourhood_id: n.id,
          neighbourhood_name: n.name,
          name: r.name,
          type: r.type,
          cuisine: r.cuisine,
          latitude: r.lat,
          longitude: r.lng,
          osm_id: r.osmId,
          osm_type: r.osmType,
        });
      }
    }

    // Write CSV
    const csvHeaders = ['neighbourhood_id', 'neighbourhood_name', 'name', 'type', 'cuisine', 'latitude', 'longitude', 'osm_id', 'osm_type'];
    let csvContent = csvHeaders.join(',') + '\n';
    for (const row of restaurantsCsvRows) {
      const values = csvHeaders.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      });
      csvContent += values.join(',') + '\n';
    }

    const restaurantsCsvPath = path.join(outputDir, 'restaurants_by_neighbourhood.csv');
    fs.writeFileSync(restaurantsCsvPath, csvContent);
    console.log(`Written ${restaurantsCsvRows.length} restaurants to: ${restaurantsCsvPath}`);
  }

  // Export assigned grocery stores to CSV
  if (hasOphFoodData) {
    const groceryCsvRows = [];
    for (const n of neighbourhoods) {
      const stores = n.details.groceryStoresData || [];
      for (const g of stores) {
        groceryCsvRows.push({
          neighbourhood_id: n.id,
          neighbourhood_name: n.name,
          name: g.name,
          shop_type: g.shopType,
          category: g.category,
          brand: g.brand,
          address: g.address,
          latitude: g.lat,
          longitude: g.lng,
          osm_id: g.osmId,
          osm_type: g.osmType,
        });
      }
    }

    // Write CSV
    const groceryCsvHeaders = ['neighbourhood_id', 'neighbourhood_name', 'name', 'shop_type', 'category', 'brand', 'address', 'latitude', 'longitude', 'osm_id', 'osm_type'];
    let groceryCsvContent = groceryCsvHeaders.join(',') + '\n';
    for (const row of groceryCsvRows) {
      const values = groceryCsvHeaders.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      });
      groceryCsvContent += values.join(',') + '\n';
    }

    const groceryCsvPath = path.join(outputDir, 'grocery_stores_by_neighbourhood.csv');
    fs.writeFileSync(groceryCsvPath, groceryCsvContent);
    console.log(`Written ${groceryCsvRows.length} grocery stores to: ${groceryCsvPath}`);
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Neighbourhoods: ${neighbourhoods.length}`);
  console.log(`Total parks assigned: ${assignedParks}`);
  console.log(`Total schools assigned: ${assignedSchools}`);
  console.log(`Total schools with EQAO scores: ${matchedEqaoScores}`);
  console.log(`Total libraries assigned: ${assignedLibraries}`);
  console.log(`Total food establishments assigned: ${assignedFood}`);
  console.log(`Total gyms & fitness centers assigned: ${assignedGyms}`);
  console.log(`Total recreation facilities assigned: ${assignedRecreationFacilities}`);
  console.log(`Total sports courts assigned: ${assignedSportsCourts}`);
  console.log(`Total bus stops assigned: ${assignedBusStops}`);
  console.log(`Total crimes assigned: ${assignedCrimes}`);

  console.log('\nPopulation per neighbourhood (sorted by population):');
  for (const n of [...neighbourhoods].sort((a, b) => b.population - a.population)) {
    console.log(`  ${n.name}: ${n.population.toLocaleString()} residents`);
  }

  // EQAO Score summary
  const neighbourhoodsWithEqao = neighbourhoods.filter(n => n.details.avgEqaoScore !== null);
  if (neighbourhoodsWithEqao.length > 0) {
    console.log('\nAverage EQAO scores by neighbourhood (sorted by score):');
    for (const n of [...neighbourhoodsWithEqao].sort((a, b) => b.details.avgEqaoScore - a.details.avgEqaoScore)) {
      console.log(`  ${n.name}: ${n.details.avgEqaoScore}% (${n.details.schoolsWithEqaoScores} schools)`);
    }
  }
}

main().catch(console.error);
