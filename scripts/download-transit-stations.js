#!/usr/bin/env node
/**
 * Download Transit Stations Data from Ottawa Open Data
 *
 * Fetches O-Train stations and Transitway stations from the City of Ottawa ArcGIS API
 * and saves to CSV format.
 *
 * Usage: node scripts/download-transit-stations.js
 */

const fs = require('fs');
const path = require('path');

// Transit Services MapServer
// Layer 0: Transit Stations (Transitway + O-Train combined)
// Layer 1: O-Train Stations only (Trillium Line stations)
const TRANSIT_STATIONS_API = 'https://maps.ottawa.ca/arcgis/rest/services/TransitServices/MapServer/0/query';
const OTRAIN_STATIONS_API = 'https://maps.ottawa.ca/arcgis/rest/services/TransitServices/MapServer/1/query';

// O-Train Line definitions
const CONFEDERATION_LINE_STATIONS = [
  'Tunney\'s Pasture', 'Westboro', 'Dominion', 'Cleary', 'Queensview',
  'Iris', 'Pinecrest', 'Baseline', 'Lincoln Fields', 'Moodie',
  'Bayshore', 'Pimisi', 'Lyon', 'Parliament', 'Rideau', 'uOttawa',
  'Lees', 'Hurdman', 'Tremblay', 'St-Laurent', 'Cyrville', 'Blair',
  'Montreal', 'Jeanne d\'Arc', 'Orléans', 'Place d\'Orléans',
  'LeBreton', 'Lebreton'
];

const TRILLIUM_LINE_STATIONS = [
  'Bayview', 'Carling', 'Carleton', 'Mooney\'s Bay', 'Greenboro',
  'South Keys', 'Walkley', 'Confederation Heights', 'Uplands',
  'Leitrim', 'Bowesville', 'Limebank', 'Riverside South'
];

function determineLineType(stationName) {
  const name = stationName.toLowerCase();

  // Check Trillium Line first (more specific)
  for (const station of TRILLIUM_LINE_STATIONS) {
    if (name.includes(station.toLowerCase()) || station.toLowerCase().includes(name)) {
      return 'Line 2 Trillium';
    }
  }

  // Check Confederation Line
  for (const station of CONFEDERATION_LINE_STATIONS) {
    if (name.includes(station.toLowerCase()) || station.toLowerCase().includes(name)) {
      return 'Line 1 Confederation';
    }
  }

  // Default based on common patterns
  if (name.includes('transitway') || name.includes('north') || name.includes('south')) {
    return 'Transitway';
  }

  return 'O-Train';
}

function determineStationType(stationName, isOTrainLayer) {
  if (isOTrainLayer) {
    return 'O-Train';
  }

  const name = stationName.toLowerCase();

  // O-Train station indicators
  const otrainIndicators = [
    'bayview', 'carling', 'carleton', 'mooney', 'greenboro',
    'tunney', 'westboro', 'pimisi', 'lyon', 'parliament', 'rideau',
    'uottawa', 'lees', 'hurdman', 'tremblay', 'st-laurent', 'cyrville', 'blair',
    'lebreton', 'orleans', 'montreal', 'jeanne'
  ];

  for (const indicator of otrainIndicators) {
    if (name.includes(indicator)) {
      return 'O-Train';
    }
  }

  return 'Transitway';
}

async function downloadTransitStations() {
  console.log('Downloading transit stations from Ottawa Open Data...\n');

  const stationsMap = new Map(); // Use map to deduplicate by name

  try {
    // Fetch all transit stations (Layer 0)
    console.log('Fetching transit stations (Transitway + O-Train)...');
    const transitUrl = `${TRANSIT_STATIONS_API}?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json`;
    const transitResponse = await fetch(transitUrl);
    const transitData = await transitResponse.json();

    if (transitData.features) {
      console.log(`  Found ${transitData.features.length} transit stations`);

      for (const f of transitData.features) {
        const name = f.attributes.NAME || f.attributes.STATIONNAME || '';
        const stationType = determineStationType(name, false);
        const lineType = stationType === 'O-Train' ? determineLineType(name) : 'Transitway';

        stationsMap.set(name.toLowerCase(), {
          name: name,
          latitude: f.geometry.y,
          longitude: f.geometry.x,
          type: stationType,
          line: lineType,
        });
      }
    }

    // Fetch O-Train only stations (Layer 1) for Trillium Line
    console.log('Fetching O-Train stations (Trillium Line)...');
    const otrainUrl = `${OTRAIN_STATIONS_API}?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json`;
    const otrainResponse = await fetch(otrainUrl);
    const otrainData = await otrainResponse.json();

    if (otrainData.features) {
      console.log(`  Found ${otrainData.features.length} O-Train stations`);

      for (const f of otrainData.features) {
        const name = f.attributes.STATIONNAME || f.attributes.NAME || '';

        // Update or add O-Train stations
        stationsMap.set(name.toLowerCase(), {
          name: name,
          latitude: f.geometry.y,
          longitude: f.geometry.x,
          type: 'O-Train',
          line: 'Line 2 Trillium',
        });
      }
    }

    // Convert map to array and sort
    const stations = Array.from(stationsMap.values()).sort((a, b) => {
      // Sort by type first (O-Train before Transitway), then by name
      if (a.type !== b.type) {
        return a.type === 'O-Train' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    console.log(`\nTotal unique stations: ${stations.length}`);
    console.log(`  - O-Train: ${stations.filter(s => s.type === 'O-Train').length}`);
    console.log(`  - Transitway: ${stations.filter(s => s.type === 'Transitway').length}`);

    // Convert to CSV
    const headers = ['NAME', 'TYPE', 'LINE', 'LATITUDE', 'LONGITUDE'];
    const rows = stations.map(s => {
      return [
        s.name,
        s.type,
        s.line,
        s.latitude,
        s.longitude,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    // Write to file
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'csv', 'transit_stations.csv');
    fs.writeFileSync(outputPath, csv);

    console.log(`\nSaved to: ${outputPath}\n`);

    console.log('O-Train Stations:');
    stations.filter(s => s.type === 'O-Train').forEach(s => {
      console.log(`  - ${s.name} (${s.line})`);
    });

    console.log('\nTransitway Stations:');
    stations.filter(s => s.type === 'Transitway').forEach(s => {
      console.log(`  - ${s.name}`);
    });

  } catch (error) {
    console.error('Error downloading transit stations:', error.message);
  }
}

downloadTransitStations();
