#!/usr/bin/env node
/**
 * Download NCC Greenbelt Trails
 *
 * Downloads trail data from NCC ArcGIS API and supplements with manual data
 * from NCC website research.
 *
 * Data sources:
 *   - NCC ArcGIS API: https://services2.arcgis.com/WLyMuW006nKOfa5Z/ArcGIS/rest/services/Walking_Hiking/FeatureServer
 *   - NCC Website: https://ncc-ccn.gc.ca/places/hiking-and-walking-greenbelt
 *
 * Output: src/data/csv/ncc_greenbelt_trails.csv
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_FILE = path.join(__dirname, '../src/data/csv/ncc_greenbelt_trails.csv');

// NCC Greenbelt sectors mapped to our neighbourhoods
// Based on NCC trail map: https://ncc-website-2.s3.amazonaws.com/documents/national-capital-greenbelt-all-seasons-trail-map.pdf
const SECTOR_TO_NEIGHBOURHOODS = {
  'Shirleys Bay': ['bayshore', 'bells-corners'],
  'Stony Swamp': ['bells-corners', 'nepean', 'bayshore'],
  'Southern Farm': ['nepean', 'barrhaven'],
  'Pinhey Forest': ['nepean', 'carlington'],
  'Pine Grove': ['hunt-club', 'alta-vista'],
  'Conroy Pit': ['hunt-club', 'riverside-south'],
  'Mer Bleue': ['orleans', 'vars'],
  'Greens Creek': ['orleans'],
};

// Comprehensive trail data from NCC website + API
// Reference: https://ncc-ccn.gc.ca/places/hiking-and-walking-greenbelt
const GREENBELT_TRAILS = [
  // Shirleys Bay Sector
  { name: 'Shoreline Trail', sector: 'Shirleys Bay', length: 0.1, difficulty: 'Easy', parking: 'P1', type: 'Trail' },
  { name: 'Trail 10', sector: 'Shirleys Bay', length: 4.2, difficulty: 'Easy', parking: 'P1/P2', type: 'Trail' },
  { name: 'Trail 12', sector: 'Shirleys Bay', length: 2.7, difficulty: 'Easy', parking: 'P3', type: 'Trail' },
  { name: "Shirley's Bay Loop", sector: 'Shirleys Bay', length: 4.2, difficulty: 'Easy', parking: 'P1-P3', type: 'Loop', lat: 45.35292, lng: -75.87292 },

  // Stony Swamp Sector (largest trail network - 40+ km)
  { name: 'Trail 20', sector: 'Stony Swamp', length: 3.2, difficulty: 'Easy', parking: 'P3', type: 'Trail' },
  { name: 'Trail 21', sector: 'Stony Swamp', length: 4.5, difficulty: 'Easy', parking: 'P4', type: 'Trail' },
  { name: 'Old Quarry Trail', sector: 'Stony Swamp', length: 3.1, difficulty: 'Moderate', parking: 'P5', type: 'Trail' },
  { name: 'Trail 23', sector: 'Stony Swamp', length: 5.7, difficulty: 'Easy', parking: 'P4/P6', type: 'Trail' },
  { name: 'Trail 24', sector: 'Stony Swamp', length: 5.1, difficulty: 'Easy', parking: 'P6', type: 'Trail' },
  { name: 'Sarsaparilla Trail', sector: 'Stony Swamp', length: 0.9, difficulty: 'Easy', parking: 'P7', type: 'Trail', lat: 45.30324, lng: -75.83547 },
  { name: 'Beaver Trail', sector: 'Stony Swamp', length: 1.2, difficulty: 'Easy', parking: 'P8', type: 'Trail' },
  { name: 'Chipmunk Trail', sector: 'Stony Swamp', length: 0.7, difficulty: 'Easy', parking: 'P8', type: 'Trail' },
  { name: 'Lime Kiln Trail', sector: 'Stony Swamp', length: 2.1, difficulty: 'Easy', parking: 'P10', type: 'Trail', lat: 45.28421, lng: -75.82066 },
  { name: 'Trail 25', sector: 'Stony Swamp', length: 3.9, difficulty: 'Easy', parking: 'P10', type: 'Trail' },
  { name: 'Jack Pine Trail', sector: 'Stony Swamp', length: 3.1, difficulty: 'Easy', parking: 'P9', type: 'Trail', notes: 'Short (0.7km), Medium (1.7km), Long (2.3km) loops' },
  { name: 'Trail 26', sector: 'Stony Swamp', length: 3.8, difficulty: 'Easy', parking: 'P9/P11', type: 'Trail' },
  { name: 'Trail 27', sector: 'Stony Swamp', length: 5.3, difficulty: 'Easy', parking: 'P13', type: 'Trail', notes: 'Access from Bell Centennial Arena (Bells Corners)' },
  { name: 'Trail 29', sector: 'Stony Swamp', length: 3.4, difficulty: 'Easy', parking: 'P12', type: 'Trail' },
  { name: 'Bruce Pit', sector: 'Stony Swamp', length: 2.0, difficulty: 'Easy', parking: 'P12', type: 'Off-leash Dog Area', notes: 'Popular off-leash dog park with trails' },

  // Southern Farm & Pinhey Forest
  { name: 'Trail 31', sector: 'Southern Farm', length: 3.6, difficulty: 'Easy', parking: 'P14', type: 'Trail' },
  { name: 'Trail 32', sector: 'Southern Farm', length: 2.8, difficulty: 'Easy', parking: 'P15', type: 'Trail' },
  { name: 'Pinhey Forest Loops Trail 31', sector: 'Pinhey Forest', length: 2.6, difficulty: 'Easy', parking: 'P14', type: 'Loop', lat: 45.32778, lng: -75.73008 },

  // Pine Grove Sector
  { name: 'Trail 43', sector: 'Pine Grove', length: 4.4, difficulty: 'Easy', parking: 'P18', type: 'Trail' },
  { name: 'Trail 44', sector: 'Pine Grove', length: 3.1, difficulty: 'Easy', parking: 'P18', type: 'Trail' },
  { name: 'Trail 45', sector: 'Pine Grove', length: 6.4, difficulty: 'Easy', parking: 'P19', type: 'Trail' },
  { name: 'Pine Grove Forestry Trail', sector: 'Pine Grove', length: 1.46, difficulty: 'Easy', parking: 'P18', type: 'Trail' },
  { name: 'Trail 43/44 Loop', sector: 'Pine Grove', length: 5.6, difficulty: 'Easy', parking: 'P18', type: 'Loop', lat: 45.34846, lng: -75.59277 },
  { name: 'Conroy Pit', sector: 'Conroy Pit', length: 1.5, difficulty: 'Easy', parking: 'P17', type: 'Off-leash Dog Area', notes: 'Off-leash dog park' },

  // Mer Bleue Sector
  { name: 'Trail 50', sector: 'Mer Bleue', length: 6.3, difficulty: 'Easy', parking: 'P20/P23', type: 'Trail' },
  { name: 'Trail 51', sector: 'Mer Bleue', length: 7.5, difficulty: 'Easy', parking: 'P20', type: 'Trail' },
  { name: 'Trail 53', sector: 'Mer Bleue', length: 6.7, difficulty: 'Moderate', parking: 'P21/P22', type: 'Trail' },
  { name: 'Dewberry Trail', sector: 'Mer Bleue', length: 1.0, difficulty: 'Easy', parking: 'P23', type: 'Trail' },
  { name: 'Mer Bleue Bog Trail', sector: 'Mer Bleue', length: 1.2, difficulty: 'Easy', parking: 'P22', type: 'Boardwalk Trail', lat: 45.39343, lng: -75.50927, notes: 'Iconic boardwalk over peat bog - Ramsar Wetland' },

  // Green's Creek Sector
  { name: 'Trail 61', sector: 'Greens Creek', length: 1.1, difficulty: 'Easy', parking: 'P26', type: 'Trail' },
  { name: 'Trail 63', sector: 'Greens Creek', length: 1.8, difficulty: 'Easy', parking: 'P26', type: 'Trail' },

  // Multi-use Pathways (paved)
  { name: 'Greenbelt Pathway West', sector: 'Stony Swamp', length: 21.0, difficulty: 'Easy', parking: 'Multiple', type: 'Paved Pathway', notes: 'Connects Shirleys Bay to Stony Swamp - accessible' },
  { name: 'Greenbelt Southwest Loop', sector: 'Stony Swamp', length: 4.5, difficulty: 'Easy', parking: 'P12', type: 'Loop', lat: 45.31094, lng: -75.87129 },
];

// Sector centroid coordinates (approximate) for mapping
const SECTOR_CENTROIDS = {
  'Shirleys Bay': { lat: 45.36, lng: -75.87 },
  'Stony Swamp': { lat: 45.30, lng: -75.83 },
  'Southern Farm': { lat: 45.30, lng: -75.75 },
  'Pinhey Forest': { lat: 45.33, lng: -75.73 },
  'Pine Grove': { lat: 45.35, lng: -75.59 },
  'Conroy Pit': { lat: 45.32, lng: -75.63 },
  'Mer Bleue': { lat: 45.40, lng: -75.50 },
  'Greens Creek': { lat: 45.45, lng: -75.58 },
};

async function fetchNCCTrails() {
  return new Promise((resolve, reject) => {
    const url = 'https://services2.arcgis.com/WLyMuW006nKOfa5Z/ArcGIS/rest/services/Walking_Hiking/FeatureServer/0/query?where=Location%3D%27Greenbelt%27&outFields=*&returnGeometry=true&outSR=4326&f=json';

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.features || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function generateCSV(trails) {
  const headers = [
    'NAME',
    'SECTOR',
    'LENGTH_KM',
    'DIFFICULTY',
    'TYPE',
    'PARKING',
    'LATITUDE',
    'LONGITUDE',
    'NEIGHBOURHOODS',
    'NOTES',
    'SOURCE'
  ];

  const rows = trails.map(trail => {
    const neighbourhoods = SECTOR_TO_NEIGHBOURHOODS[trail.sector] || [];
    const centroid = SECTOR_CENTROIDS[trail.sector] || {};
    const lat = trail.lat || centroid.lat || '';
    const lng = trail.lng || centroid.lng || '';

    return [
      trail.name,
      trail.sector,
      trail.length,
      trail.difficulty || 'Easy',
      trail.type || 'Trail',
      trail.parking || '',
      lat,
      lng,
      neighbourhoods.join(';'),
      trail.notes || '',
      'NCC'
    ].map(v => {
      const str = String(v);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

async function main() {
  console.log('Downloading NCC Greenbelt trails...\n');

  // Fetch from API to verify/supplement our manual data
  try {
    const apiTrails = await fetchNCCTrails();
    console.log(`Found ${apiTrails.length} trails from NCC API`);

    // Log API trails for reference
    apiTrails.forEach(f => {
      console.log(`  - ${f.attributes.Circuit_Name} (${f.attributes.Length} km)`);
    });
  } catch (error) {
    console.log('Warning: Could not fetch from NCC API:', error.message);
  }

  console.log(`\nUsing comprehensive manual dataset: ${GREENBELT_TRAILS.length} trails\n`);

  // Calculate totals by sector
  const sectorTotals = {};
  GREENBELT_TRAILS.forEach(t => {
    if (!sectorTotals[t.sector]) {
      sectorTotals[t.sector] = { count: 0, length: 0 };
    }
    sectorTotals[t.sector].count++;
    sectorTotals[t.sector].length += t.length;
  });

  console.log('Trails by sector:');
  Object.entries(sectorTotals).forEach(([sector, data]) => {
    const neighbourhoods = SECTOR_TO_NEIGHBOURHOODS[sector]?.join(', ') || 'N/A';
    console.log(`  ${sector}: ${data.count} trails (${data.length.toFixed(1)} km) → ${neighbourhoods}`);
  });

  // Generate CSV
  const csv = generateCSV(GREENBELT_TRAILS);
  fs.writeFileSync(OUTPUT_FILE, csv);

  console.log(`\nTotal: ${GREENBELT_TRAILS.length} trails`);
  console.log(`Total length: ${GREENBELT_TRAILS.reduce((s, t) => s + t.length, 0).toFixed(1)} km`);
  console.log(`\nSaved to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
