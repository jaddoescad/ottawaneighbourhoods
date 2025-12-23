#!/usr/bin/env node
/**
 * Download Recreation Facilities Data from Ottawa Open Data
 *
 * Fetches pools, arenas, fitness centres, curling rinks, and other
 * recreation facilities from the City of Ottawa ArcGIS API.
 *
 * Data source: https://maps.ottawa.ca/arcgis/rest/services/City_Facilities/MapServer/5
 * (Layer 5 = Recreation / Installations récréatives)
 *
 * Usage: node scripts/download-recreation-facilities.js
 */

const fs = require('fs');
const path = require('path');

const RECREATION_API = 'https://maps.ottawa.ca/arcgis/rest/services/City_Facilities/MapServer/5/query';

// Facility types we want to include (subset focused on pools, arenas, rinks, fitness)
const INCLUDE_TYPES = [
  'Arena',
  'Pool - Indoor',
  'Fitness Centre',
  'Curling Rink',
  'Recreation Complex',
  'Athletic Facility',
  'Community Center',
  'Field House',
  'Stadium',
];

async function downloadRecreationFacilities() {
  console.log('Downloading recreation facilities from Ottawa Open Data...\n');

  const url = `${RECREATION_API}?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.error('No recreation facility data returned from API');
      return;
    }

    console.log(`Found ${data.features.length} total recreation facilities\n`);

    // Filter to only include relevant facility types
    const filtered = data.features.filter(f => {
      const type = f.attributes.BUILDING_ELEMENT_TYPE;
      return INCLUDE_TYPES.includes(type);
    });

    console.log(`Filtered to ${filtered.length} facilities (pools, arenas, fitness centres, etc.)\n`);

    // Count by type
    const typeCounts = {};
    filtered.forEach(f => {
      const type = f.attributes.BUILDING_ELEMENT_TYPE;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    console.log('By type:');
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
    console.log('');

    // Convert to CSV
    const headers = [
      'NAME',
      'FACILITY_TYPE',
      'BUILDING_NAME',
      'ADDRESS',
      'LATITUDE',
      'LONGITUDE',
      'LINK',
    ];

    const rows = filtered.map(f => {
      const attrs = f.attributes;
      const geom = f.geometry;
      const address = [attrs.ADDRNUM, attrs.FULLNAME].filter(Boolean).join(' ');
      return [
        attrs.BUILDING_ELEMENT_DESC || attrs.BUILDING_DESC || '',
        attrs.BUILDING_ELEMENT_TYPE || '',
        attrs.BUILDING_DESC || '',
        address,
        geom.y, // latitude
        geom.x, // longitude
        attrs.LINK || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    // Write to file
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'csv', 'recreation_facilities_raw.csv');
    fs.writeFileSync(outputPath, csv);

    console.log(`Saved to: ${outputPath}\n`);

    // Show sample facilities by type
    INCLUDE_TYPES.forEach(type => {
      const facilities = filtered.filter(f => f.attributes.BUILDING_ELEMENT_TYPE === type);
      if (facilities.length > 0) {
        console.log(`${type} (${facilities.length}):`);
        facilities.slice(0, 3).forEach(f => {
          const name = f.attributes.BUILDING_ELEMENT_DESC || f.attributes.BUILDING_DESC;
          console.log(`  - ${name}`);
        });
        if (facilities.length > 3) {
          console.log(`  ... and ${facilities.length - 3} more`);
        }
        console.log('');
      }
    });

  } catch (error) {
    console.error('Error downloading recreation facilities:', error.message);
  }
}

downloadRecreationFacilities();
