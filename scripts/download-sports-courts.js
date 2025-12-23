#!/usr/bin/env node
/**
 * Download Sports Courts Data from Ottawa Open Data
 *
 * Fetches basketball courts, tennis courts, volleyball courts, sports fields,
 * ball diamonds, and pickleball courts from the City of Ottawa Parks Inventory API.
 *
 * Data source: https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer
 *
 * Layers:
 * - Layer 1: Ball Diamonds
 * - Layer 3: Basketball Courts
 * - Layer 19: Sports Fields (soccer, football, rugby, etc.)
 * - Layer 21: Tennis Courts
 * - Layer 22: Volleyball Courts
 * - Layer 27: Pickleball Courts
 *
 * Usage: node scripts/download-sports-courts.js
 */

const fs = require('fs');
const path = require('path');

const BASE_API = 'https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer';

// Sports court layers to fetch
const COURT_LAYERS = [
  { id: 1, name: 'Ball Diamond', type: 'ball_diamond' },
  { id: 3, name: 'Basketball Court', type: 'basketball' },
  { id: 19, name: 'Sports Field', type: 'sports_field' },
  { id: 21, name: 'Tennis Court', type: 'tennis' },
  { id: 22, name: 'Volleyball Court', type: 'volleyball' },
  { id: 27, name: 'Pickleball Court', type: 'pickleball' },
];

async function fetchLayer(layerId, layerName) {
  const url = `${BASE_API}/${layerId}/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.features) {
      console.error(`  No data returned for ${layerName}`);
      return [];
    }

    console.log(`  ${layerName}: ${data.features.length} facilities`);
    return data.features;
  } catch (error) {
    console.error(`  Error fetching ${layerName}:`, error.message);
    return [];
  }
}

async function downloadSportsCourts() {
  console.log('Downloading sports courts from Ottawa Open Data...\n');

  const allCourts = [];

  // Fetch all court types
  for (const layer of COURT_LAYERS) {
    const features = await fetchLayer(layer.id, layer.name);
    features.forEach(f => {
      f._courtType = layer.type;
      f._courtName = layer.name;
    });
    allCourts.push(...features);
  }

  console.log(`\nTotal: ${allCourts.length} sports courts/fields\n`);

  // Convert to CSV
  const headers = [
    'COURT_TYPE',
    'SPORT_TYPE',
    'NAME',
    'PARK_NAME',
    'ADDRESS',
    'LATITUDE',
    'LONGITUDE',
    'FIELD_SIZE',
    'LIGHTS',
    'ACCESSIBLE',
    'WARD',
  ];

  const rows = allCourts.map(f => {
    const attrs = f.attributes;
    const geom = f.geometry;

    // Determine sport type from attributes
    let sportType = f._courtType;
    if (attrs.REGULAR_USE_TYPE) {
      sportType = attrs.REGULAR_USE_TYPE.toLowerCase();
    }

    // Get name - different layers use different field names
    const name = attrs.NAME || attrs.FIELD_NAME || attrs.FACILITYID || '';

    // Get park address - layers use different field names
    const parkAddress = attrs.PARKADDRESS || attrs.PARK_ADDRESS || '';

    // Get field size if available
    const fieldSize = attrs.FIELD_SIZE || attrs.COURT_TYPE || '';

    // Get lights status
    const lights = attrs.LIGHTS || attrs.LIGHTING || 'unknown';

    // Get accessible status
    const accessible = attrs.ACCESSIBLE || 'unknown';

    // Get ward
    const ward = attrs.WARD_NAME || attrs.WARD || '';

    return [
      f._courtName,
      sportType,
      name,
      attrs.PARKNAME || '',
      parkAddress,
      geom?.y || '',
      geom?.x || '',
      fieldSize,
      lights,
      accessible,
      ward,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  // Write to file
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'csv', 'sports_courts_raw.csv');
  fs.writeFileSync(outputPath, csv);

  console.log(`Saved to: ${outputPath}\n`);

  // Summary by court type
  console.log('Summary by court type:');
  const typeCounts = {};
  allCourts.forEach(f => {
    const type = f._courtName;
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });

  // For sports fields, also show breakdown by sport
  console.log('\nSports Fields by sport type:');
  const sportTypes = {};
  allCourts.filter(f => f._courtType === 'sports_field').forEach(f => {
    const sport = f.attributes.REGULAR_USE_TYPE || 'unknown';
    sportTypes[sport] = (sportTypes[sport] || 0) + 1;
  });
  Object.entries(sportTypes).sort((a, b) => b[1] - a[1]).forEach(([sport, count]) => {
    console.log(`  - ${sport}: ${count}`);
  });

  // Show sample courts
  console.log('\nSample facilities:');
  COURT_LAYERS.forEach(layer => {
    const courts = allCourts.filter(f => f._courtType === layer.type);
    if (courts.length > 0) {
      console.log(`\n${layer.name} (${courts.length}):`);
      courts.slice(0, 2).forEach(f => {
        const name = f.attributes.PARKNAME || f.attributes.NAME || 'Unknown';
        const addr = f.attributes.PARKADDRESS || '';
        console.log(`  - ${name}${addr ? ` (${addr})` : ''}`);
      });
    }
  });
}

downloadSportsCourts();
