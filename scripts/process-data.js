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
  const neighbourhoodsInfo = parseCSV(fs.readFileSync(path.join(csvDir, 'neighbourhoods.csv'), 'utf8'));

  console.log(`  - ${parksRaw.length} parks`);
  console.log(`  - ${schoolsRaw.length} schools`);
  console.log(`  - ${librariesRaw.length} libraries`);
  console.log(`  - ${crimeRaw.length} crimes`);
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
    boundariesByNeighbourhood[neighbourhoodId] = await fetchAllBoundaries(config.onsIds);
    console.log(` ${boundariesByNeighbourhood[neighbourhoodId].length} areas`);
  }

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

  for (const school of schoolsRaw) {
    const lat = parseFloat(school.LATITUDE);
    const lng = parseFloat(school.LONGITUDE);

    if (isNaN(lat) || isNaN(lng)) continue;

    const neighbourhoodId = assignToNeighbourhood(lat, lng, boundariesByNeighbourhood);
    if (neighbourhoodId) {
      if (!schoolsByNeighbourhood[neighbourhoodId]) {
        schoolsByNeighbourhood[neighbourhoodId] = [];
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
      });
      assignedSchools++;
    }
  }
  console.log(`  Assigned ${assignedSchools} schools`);

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

  // Process crime data
  console.log('\nProcessing crime data by neighbourhood...');

  // Build mapping from ONS neighbourhood names to our neighbourhood IDs
  // Crime data uses slightly different names, so we need flexible matching
  const onsNameToNeighbourhoodId = {};
  const boundaryNames = []; // Store all boundary names for fuzzy matching

  for (const [neighbourhoodId, boundaries] of Object.entries(boundariesByNeighbourhood)) {
    for (const boundary of boundaries) {
      if (boundary.name) {
        onsNameToNeighbourhoodId[boundary.name] = neighbourhoodId;
        boundaryNames.push({ name: boundary.name, id: neighbourhoodId });
      }
    }
  }

  // Helper to find neighbourhood by partial name match
  function findNeighbourhoodByName(crimeName) {
    // Exact match first
    if (onsNameToNeighbourhoodId[crimeName]) {
      return onsNameToNeighbourhoodId[crimeName];
    }

    // Try partial matching - crime name starts with or contains boundary name
    for (const { name, id } of boundaryNames) {
      // Check if crime name starts with boundary name (before " - ")
      const boundaryBase = name.split(' - ')[0];
      const crimeBase = crimeName.split(' - ')[0];

      if (boundaryBase === crimeBase) {
        return id;
      }
    }

    return null;
  }

  // Aggregate crime by neighbourhood
  const crimeByNeighbourhood = {};
  let assignedCrimes = 0;

  for (const crime of crimeRaw) {
    const onsName = crime.NB_NAME_EN;
    const neighbourhoodId = findNeighbourhoodByName(onsName);

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

  // Build final data structure
  console.log('\nBuilding output data...');
  const neighbourhoods = [];

  for (const info of neighbourhoodsInfo) {
    const parks = parksByNeighbourhood[info.id] || [];
    const schools = schoolsByNeighbourhood[info.id] || [];
    const libraries = librariesByNeighbourhood[info.id] || [];
    const crime = crimeByNeighbourhood[info.id] || { total: 0, byCategory: {} };

    // Calculate population by summing all ONS areas for this neighbourhood
    const mapping = neighbourhoodMapping[info.id];
    let population = 0;
    if (mapping && mapping.onsIds) {
      for (const onsId of mapping.onsIds) {
        population += populationByOnsId[onsId] || 0;
      }
    }

    neighbourhoods.push({
      id: info.id,
      name: info.name,
      area: info.area,
      image: info.image,
      population,
      medianIncome: parseInt(info.medianIncome) || 0,
      avgRent: parseInt(info.avgRent) || 0,
      details: {
        parks: parks.length,
        parksList: parks.map(p => p.name),
        parksData: parks,
        schools: schools.length,
        schoolsList: schools.map(s => s.name),
        schoolsData: schools,
        libraries: libraries.length,
        librariesList: libraries.map(l => l.name),
        librariesData: libraries,
        crimeTotal: crime.total,
        crimeByCategory: crime.byCategory,
      },
      pros: info.pros ? info.pros.split('; ') : [],
      cons: info.cons ? info.cons.split('; ') : [],
    });
  }

  // Write output
  const outputFile = path.join(outputDir, 'data.json');
  fs.writeFileSync(outputFile, JSON.stringify({ neighbourhoods }, null, 2));
  console.log(`\nWritten to: ${outputFile}`);

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Neighbourhoods: ${neighbourhoods.length}`);
  console.log(`Total parks assigned: ${assignedParks}`);
  console.log(`Total schools assigned: ${assignedSchools}`);
  console.log(`Total libraries assigned: ${assignedLibraries}`);
  console.log(`Total crimes assigned: ${assignedCrimes}`);

  console.log('\nPopulation per neighbourhood (sorted by population):');
  for (const n of [...neighbourhoods].sort((a, b) => b.population - a.population)) {
    console.log(`  ${n.name}: ${n.population.toLocaleString()} residents`);
  }
}

main().catch(console.error);
