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

const NEIGHBOURHOODS_API = 'https://maps.ottawa.ca/arcgis/rest/services/Neighbourhoods/MapServer/0/query';

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

  // Load Restaurants & Cafes (optional - file may not exist)
  const restaurantsCafesPath = path.join(csvDir, 'restaurants_cafes_raw.csv');
  const hasRestaurantsCafesData = fs.existsSync(restaurantsCafesPath);
  const restaurantsCafesRaw = hasRestaurantsCafesData
    ? parseCSV(fs.readFileSync(restaurantsCafesPath, 'utf8'))
    : [];
  if (hasRestaurantsCafesData) {
    console.log(`  - ${restaurantsCafesRaw.length} restaurants & cafes`);
  } else {
    console.log('  - No restaurants/cafes file found (run: node scripts/download-restaurants-cafes.js)');
  }

  // Load Grocery Stores (optional - file may not exist)
  const groceryStoresPath = path.join(csvDir, 'grocery_stores_raw.csv');
  const hasGroceryStoresData = fs.existsSync(groceryStoresPath);
  const groceryStoresRaw = hasGroceryStoresData
    ? parseCSV(fs.readFileSync(groceryStoresPath, 'utf8'))
    : [];
  if (hasGroceryStoresData) {
    console.log(`  - ${groceryStoresRaw.length} grocery stores`);
  } else {
    console.log('  - No grocery stores file found (run: node scripts/download-grocery-stores.js)');
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

  // Load Walk Scores (optional - file may not exist)
  let walkScoresData = [];
  const walkScoresPath = path.join(csvDir, 'walkscores.csv');
  if (fs.existsSync(walkScoresPath)) {
    walkScoresData = parseCSV(fs.readFileSync(walkScoresPath, 'utf8'));
    console.log(`  - ${walkScoresData.length} walk score entries`);
  } else {
    console.log('  - No walk scores file found');
  }

  // Build walk scores lookup by id
  const walkScoresById = {};
  for (const entry of walkScoresData) {
    walkScoresById[entry.id] = {
      walkScore: parseInt(entry.walkScore) || 0,
      transitScore: parseInt(entry.transitScore) || 0,
      bikeScore: parseInt(entry.bikeScore) || 0,
    };
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

  // Fetch all neighbourhood boundaries
  console.log('Fetching neighbourhood boundaries from Ottawa Open Data...');
  const allOnsIds = new Set();
  for (const config of Object.values(neighbourhoodMapping)) {
    config.onsIds.forEach(id => allOnsIds.add(id));
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
      boundariesByNeighbourhood[neighbourhoodId] = await fetchAllBoundaries(config.onsIds);
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

  // Process restaurants & cafes (optional)
  console.log('\nAssigning restaurants & cafes to neighbourhoods...');
  const restaurantsByNeighbourhood = {};
  let assignedRestaurantsCafes = 0;

  if (hasRestaurantsCafesData) {
    for (const place of restaurantsCafesRaw) {
      const lat = parseFloat(place.LATITUDE);
      const lng = parseFloat(place.LONGITUDE);

      if (isNaN(lat) || isNaN(lng)) continue;

      const neighbourhoodId = assignToNeighbourhood(lat, lng, boundariesByNeighbourhood);
      if (neighbourhoodId) {
        if (!restaurantsByNeighbourhood[neighbourhoodId]) {
          restaurantsByNeighbourhood[neighbourhoodId] = [];
        }
        restaurantsByNeighbourhood[neighbourhoodId].push({
          name: place.NAME || 'Unnamed',
          type: place.TYPE || 'unknown',
          cuisine: place.CUISINE || '',
          lat,
          lng,
          osmId: place.OSM_ID,
          osmType: place.OSM_TYPE,
        });
        assignedRestaurantsCafes++;
      }
    }
  }
  console.log(`  Assigned ${assignedRestaurantsCafes} restaurants & cafes`);

  // Process grocery stores (optional)
  console.log('\nAssigning grocery stores to neighbourhoods...');
  const groceryStoresByNeighbourhood = {};
  let assignedGroceryStores = 0;

  if (hasGroceryStoresData) {
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
  }
  console.log(`  Assigned ${assignedGroceryStores} grocery stores`);

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

  // Process crime data using point-in-polygon matching
  console.log('\nAssigning crimes to neighbourhoods...');
  const crimeByNeighbourhood = {};
  let assignedCrimes = 0;
  let crimesWithoutCoords = 0;

  for (const crime of crimeRaw) {
    const lat = parseFloat(crime.LATITUDE);
    const lng = parseFloat(crime.LONGITUDE);

    if (isNaN(lat) || isNaN(lng)) {
      crimesWithoutCoords++;
      continue;
    }

    const neighbourhoodId = assignToNeighbourhood(lat, lng, boundariesByNeighbourhood);
    if (neighbourhoodId) {
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
      assignedCrimes++;
    }
  }
  console.log(`  Assigned ${assignedCrimes} crimes to neighbourhoods`);
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
    const restaurants = restaurantsByNeighbourhood[info.id] || [];
    const restaurantsAndCafes = hasRestaurantsCafesData ? restaurants.length : null;
    const restaurantsAndCafesDensity = restaurantsAndCafes !== null && areaKm2 > 0
      ? roundTo(restaurantsAndCafes / areaKm2, 1) // per km²
      : null;
    const groceryStores = groceryStoresByNeighbourhood[info.id] || [];
    const groceryStoreCount = hasGroceryStoresData ? groceryStores.length : null;
    const groceryStoreDensity = groceryStoreCount !== null && areaKm2 > 0
      ? roundTo(groceryStoreCount / areaKm2, 2) // per km²
      : null;
    const gyms = gymsByNeighbourhood[info.id] || [];
    const gymCount = hasGymsData ? gyms.length : null;
    const gymDensity = gymCount !== null && areaKm2 > 0
      ? roundTo(gymCount / areaKm2, 2) // per km²
      : null;
    const busStops = busStopsByNeighbourhood[info.id] || [];
    const busStopCount = hasBusStopsData ? busStops.length : null;
    const busStopDensity = busStopCount !== null && areaKm2 > 0
      ? roundTo(busStopCount / areaKm2, 1) // per km²
      : null;
    const stopsWithShelter = busStops.filter(s => s.hasShelter).length;
    const stopsWithBench = busStops.filter(s => s.hasBench).length;

    // Get NCC Greenbelt trails for this neighbourhood
    const greenbeltTrailsForNeighbourhood = greenbeltByNeighbourhood[info.id] || [];
    const greenbeltTrailCount = greenbeltTrailsForNeighbourhood.length;
    const greenbeltTotalLengthKm = greenbeltTrailsForNeighbourhood.reduce((sum, t) => sum + t.lengthKm, 0);

    // Calculate population by summing all ONS areas for this neighbourhood
    const mapping = neighbourhoodMapping[info.id];
    let population = 0;
    if (mapping && mapping.onsIds) {
      for (const onsId of mapping.onsIds) {
        population += populationByOnsId[onsId] || 0;
      }
    }

    // Calculate population density (people per km²)
    const populationDensity = areaKm2 > 0 ? roundTo(population / areaKm2, 0) : 0;

    // Get walk scores for this neighbourhood
    const walkScores = walkScoresById[info.id] || { walkScore: 0, transitScore: 0, bikeScore: 0 };

    // Get age demographics for this neighbourhood
    const ageDemographics = ageDemographicsById[info.id] || { pctChildren: 0, pctYoungProfessionals: 0, pctSeniors: 0 };

    // Get commute time for this neighbourhood
    const commuteData = commuteTimesById[info.id] || { commuteToDowntown: 0 };

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

    neighbourhoods.push({
      id: info.id,
      name: info.name,
      area: info.area,
      image: info.image,
      population,
      populationDensity,
      medianIncome: parseInt(info.medianIncome) || 0,
      avgRent: parseInt(info.avgRent) || 0,
      avgHomePrice: parseInt(info.avgHomePrice) || 0,
      walkScore: walkScores.walkScore,
      transitScore: walkScores.transitScore,
      bikeScore: walkScores.bikeScore,
      pctChildren: ageDemographics.pctChildren,
      pctYoungProfessionals: ageDemographics.pctYoungProfessionals,
      pctSeniors: ageDemographics.pctSeniors,
      commuteToDowntown: commuteData.commuteToDowntown,
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
        restaurantsAndCafes,
        restaurantsAndCafesDensity,
        restaurantsList: restaurants.map(r => r.name),
        restaurantsData: restaurants,
        groceryStores: groceryStoreCount,
        groceryStoreDensity,
        groceryStoresList: groceryStores.map(g => g.name),
        groceryStoresData: groceryStores,
        gyms: gymCount,
        gymDensity,
        gymsList: gyms.map(g => g.name),
        gymsData: gyms,
        busStops: busStopCount,
        busStopDensity,
        stopsWithShelter,
        stopsWithBench,
        busStopsData: busStops,
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
      },
      pros: info.pros ? info.pros.split('; ') : [],
      cons: info.cons ? info.cons.split('; ') : [],
      // Boundaries for map display (array of polygons with rings)
      boundaries: (boundariesByNeighbourhood[info.id] || []).map(b => ({
        name: b.name,
        rings: b.rings,
      })),
    });
  }

  // ============================================================================
  // Calculate Neighbourhood Scores
  // ============================================================================
  console.log('\nCalculating neighbourhood scores...');

  // Define category weights (must sum to 1.0)
  const SCORE_WEIGHTS = {
    safety: 0.22,          // crime per capita (lower is better) - highest priority
    amenities: 0.21,       // parks, schools, libraries, grocery stores (self-sufficiency)
    education: 0.14,       // avgEqaoScore
    walkability: 0.14,     // walkScore, transitScore, bikeScore, busStopDensity
    commuteTime: 0.05,     // commute time to downtown (less important for self-contained suburbs)
    lifestyle: 0.08,       // restaurants & cafes density, gym density
    familyFriendly: 0.06,  // pctChildren (higher is better for families)
    healthcare: 0.04,      // distance to hospital (lower is better)
    affordability: 0.04,   // avgRent, avgHomePrice (lower is better)
    income: 0.02,          // medianIncome (higher is better)
  };

  // Absolute benchmark scoring: maps raw values to 0-100 scores
  // Uses linear interpolation between defined thresholds
  function absoluteScore(value, minVal, maxVal, higherIsBetter = true) {
    if (value === null || value === undefined) return null;

    // Clamp value to range
    const clamped = Math.max(minVal, Math.min(maxVal, value));

    // Linear interpolation to 0-100
    let score = ((clamped - minVal) / (maxVal - minVal)) * 100;

    // Invert if lower is better
    if (!higherIsBetter) {
      score = 100 - score;
    }

    return Math.round(score);
  }

  // Define absolute benchmarks for each metric
  // Format: { min: worst value, max: best value, higherIsBetter }
  // Benchmarks are calibrated so "good" neighbourhoods score 70-85 on their strengths
  const BENCHMARKS = {
    // Walkability scores (already 0-100 scale from WalkScore.com)
    // Scale 0-100 as-is, already meaningful
    walkScore: { min: 0, max: 100, higherIsBetter: true },
    transitScore: { min: 0, max: 100, higherIsBetter: true },
    bikeScore: { min: 0, max: 100, higherIsBetter: true },
    busStopDensity: { min: 0, max: 15, higherIsBetter: true }, // 15+ stops/km² = excellent

    // Safety: crimes per 1000 residents (ANNUAL - we divide 2-year total by 2)
    // Ottawa typical: 20-50, excellent: <20, concerning: >70
    crimePerCapita: { min: 10, max: 70, higherIsBetter: false },

    // Affordability - calibrated to Ottawa market (Dec 2024)
    avgRent: { min: 1500, max: 2800, higherIsBetter: false }, // $1500=100, $2800=0
    avgHomePrice: { min: 450000, max: 1100000, higherIsBetter: false },

    // Amenities - use counts that reward having "enough"
    parks: { min: 0, max: 60, higherIsBetter: true }, // 60+ parks = 100
    schools: { min: 0, max: 25, higherIsBetter: true }, // 25+ schools = 100
    libraries: { min: 0, max: 2, higherIsBetter: true }, // 2+ = 100
    groceryStoreDensity: { min: 0, max: 0.5, higherIsBetter: true }, // 0.5/km² = excellent

    // Lifestyle - calibrated for Ottawa (not downtown Toronto)
    restaurantsDensity: { min: 0, max: 8, higherIsBetter: true }, // 8/km² = excellent for Ottawa
    gymDensity: { min: 0, max: 1.2, higherIsBetter: true }, // 1.2/km² = excellent

    // Education (EQAO % achieving provincial standard)
    // Provincial average ~60-65%, good schools 70+, excellent 80+
    avgEqaoScore: { min: 55, max: 82, higherIsBetter: true },

    // Healthcare (distance to nearest hospital in km)
    // <3km excellent, >15km poor
    hospitalDistance: { min: 1, max: 15, higherIsBetter: false },

    // Income - Ottawa context
    medianIncome: { min: 60000, max: 130000, higherIsBetter: true },

    // Family Friendly (% children in population)
    // Ottawa avg ~16%, family suburbs 18-22%
    pctChildren: { min: 8, max: 20, higherIsBetter: true },

    // Commute (minutes to downtown)
    // <10 excellent, 20-30 typical, >40 long
    commuteToDowntown: { min: 5, max: 45, higherIsBetter: false },
  };

  // Calculate scores for each neighbourhood
  for (const neighbourhood of neighbourhoods) {
    const pop = neighbourhood.population;
    // Divide by 2 because crime data spans 2 years (2023-2024) - get annual rate
    const crimePerCapita = pop > 0 ? (neighbourhood.details.crimeTotal / 2 / pop) * 1000 : null;

    // Calculate individual metric scores (0-100) using absolute benchmarks
    const scores = {
      // Walkability
      walkScore: absoluteScore(neighbourhood.walkScore, BENCHMARKS.walkScore.min, BENCHMARKS.walkScore.max, BENCHMARKS.walkScore.higherIsBetter),
      transitScore: absoluteScore(neighbourhood.transitScore, BENCHMARKS.transitScore.min, BENCHMARKS.transitScore.max, BENCHMARKS.transitScore.higherIsBetter),
      bikeScore: absoluteScore(neighbourhood.bikeScore, BENCHMARKS.bikeScore.min, BENCHMARKS.bikeScore.max, BENCHMARKS.bikeScore.higherIsBetter),
      busStopDensity: absoluteScore(neighbourhood.details.busStopDensity, BENCHMARKS.busStopDensity.min, BENCHMARKS.busStopDensity.max, BENCHMARKS.busStopDensity.higherIsBetter),

      // Safety
      crimePerCapita: absoluteScore(crimePerCapita, BENCHMARKS.crimePerCapita.min, BENCHMARKS.crimePerCapita.max, BENCHMARKS.crimePerCapita.higherIsBetter),

      // Affordability
      avgRent: absoluteScore(neighbourhood.avgRent, BENCHMARKS.avgRent.min, BENCHMARKS.avgRent.max, BENCHMARKS.avgRent.higherIsBetter),
      avgHomePrice: absoluteScore(neighbourhood.avgHomePrice, BENCHMARKS.avgHomePrice.min, BENCHMARKS.avgHomePrice.max, BENCHMARKS.avgHomePrice.higherIsBetter),

      // Amenities
      parks: absoluteScore(neighbourhood.details.parks, BENCHMARKS.parks.min, BENCHMARKS.parks.max, BENCHMARKS.parks.higherIsBetter),
      schools: absoluteScore(neighbourhood.details.schools, BENCHMARKS.schools.min, BENCHMARKS.schools.max, BENCHMARKS.schools.higherIsBetter),
      libraries: absoluteScore(neighbourhood.details.libraries, BENCHMARKS.libraries.min, BENCHMARKS.libraries.max, BENCHMARKS.libraries.higherIsBetter),
      groceryStoreDensity: absoluteScore(neighbourhood.details.groceryStoreDensity, BENCHMARKS.groceryStoreDensity.min, BENCHMARKS.groceryStoreDensity.max, BENCHMARKS.groceryStoreDensity.higherIsBetter),

      // Lifestyle
      restaurantsDensity: absoluteScore(neighbourhood.details.restaurantsAndCafesDensity, BENCHMARKS.restaurantsDensity.min, BENCHMARKS.restaurantsDensity.max, BENCHMARKS.restaurantsDensity.higherIsBetter),
      gymDensity: absoluteScore(neighbourhood.details.gymDensity, BENCHMARKS.gymDensity.min, BENCHMARKS.gymDensity.max, BENCHMARKS.gymDensity.higherIsBetter),

      // Education
      avgEqaoScore: absoluteScore(neighbourhood.details.avgEqaoScore, BENCHMARKS.avgEqaoScore.min, BENCHMARKS.avgEqaoScore.max, BENCHMARKS.avgEqaoScore.higherIsBetter),

      // Healthcare
      hospitalDistance: absoluteScore(neighbourhood.details.distanceToNearestHospital, BENCHMARKS.hospitalDistance.min, BENCHMARKS.hospitalDistance.max, BENCHMARKS.hospitalDistance.higherIsBetter),

      // Income
      medianIncome: absoluteScore(neighbourhood.medianIncome, BENCHMARKS.medianIncome.min, BENCHMARKS.medianIncome.max, BENCHMARKS.medianIncome.higherIsBetter),

      // Family Friendly
      pctChildren: absoluteScore(neighbourhood.pctChildren, BENCHMARKS.pctChildren.min, BENCHMARKS.pctChildren.max, BENCHMARKS.pctChildren.higherIsBetter),

      // Commute Time
      commuteToDowntown: absoluteScore(neighbourhood.commuteToDowntown, BENCHMARKS.commuteToDowntown.min, BENCHMARKS.commuteToDowntown.max, BENCHMARKS.commuteToDowntown.higherIsBetter),
    };

    // Calculate category scores (average of metrics in each category)
    const categoryScores = {
      safety: scores.crimePerCapita,
      amenities: average([scores.parks, scores.schools, scores.libraries, scores.groceryStoreDensity]),
      education: scores.avgEqaoScore,
      walkability: average([scores.walkScore, scores.transitScore, scores.bikeScore, scores.busStopDensity]),
      commuteTime: scores.commuteToDowntown,
      lifestyle: average([scores.restaurantsDensity, scores.gymDensity]),
      familyFriendly: scores.pctChildren,
      healthcare: scores.hospitalDistance,
      affordability: average([scores.avgRent, scores.avgHomePrice]),
      income: scores.medianIncome,
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

    // Normalize if not all categories have data
    const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

    // Add scores to neighbourhood object
    neighbourhood.overallScore = finalScore;
    neighbourhood.categoryScores = {
      safety: categoryScores.safety !== null ? Math.round(categoryScores.safety) : null,
      amenities: categoryScores.amenities !== null ? Math.round(categoryScores.amenities) : null,
      education: categoryScores.education !== null ? Math.round(categoryScores.education) : null,
      walkability: categoryScores.walkability !== null ? Math.round(categoryScores.walkability) : null,
      commuteTime: categoryScores.commuteTime !== null ? Math.round(categoryScores.commuteTime) : null,
      lifestyle: categoryScores.lifestyle !== null ? Math.round(categoryScores.lifestyle) : null,
      familyFriendly: categoryScores.familyFriendly !== null ? Math.round(categoryScores.familyFriendly) : null,
      healthcare: categoryScores.healthcare !== null ? Math.round(categoryScores.healthcare) : null,
      affordability: categoryScores.affordability !== null ? Math.round(categoryScores.affordability) : null,
      income: categoryScores.income !== null ? Math.round(categoryScores.income) : null,
    };
    neighbourhood.scoreWeights = SCORE_WEIGHTS;
  }

  // Helper to calculate average, ignoring nulls
  function average(values) {
    const valid = values.filter(v => v !== null && v !== undefined);
    if (valid.length === 0) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  // Sort neighbourhoods by overall score for summary
  const sortedByScore = [...neighbourhoods].sort((a, b) => b.overallScore - a.overallScore);
  console.log('  Top 5 neighbourhoods by overall score:');
  for (const n of sortedByScore.slice(0, 5)) {
    console.log(`    ${n.overallScore}/100 - ${n.name}`);
  }

  // Write output (minified for faster loading)
  const outputFile = path.join(outputDir, 'data.json');
  fs.writeFileSync(outputFile, JSON.stringify({ neighbourhoods }));
  const fileSizeMB = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(2);
  console.log(`\nWritten to: ${outputFile} (${fileSizeMB} MB)`);

  // Export assigned restaurants to CSV
  if (hasRestaurantsCafesData) {
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
  if (hasGroceryStoresData) {
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
  console.log(`Total restaurants & cafes assigned: ${assignedRestaurantsCafes}`);
  console.log(`Total grocery stores assigned: ${assignedGroceryStores}`);
  console.log(`Total gyms & fitness centers assigned: ${assignedGyms}`);
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
