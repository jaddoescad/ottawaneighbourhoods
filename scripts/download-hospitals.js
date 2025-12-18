#!/usr/bin/env node
/**
 * Download Hospitals Data from Ottawa Open Data
 *
 * Fetches hospital locations from the City of Ottawa ArcGIS API
 * and saves to CSV format.
 *
 * Usage: node scripts/download-hospitals.js
 */

const fs = require('fs');
const path = require('path');

const HOSPITALS_API = 'https://maps.ottawa.ca/arcgis/rest/services/Hospitals/MapServer/0/query';

async function downloadHospitals() {
  console.log('Downloading hospitals from Ottawa Open Data...\n');

  const url = `${HOSPITALS_API}?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.error('No hospital data returned from API');
      return;
    }

    console.log(`Found ${data.features.length} hospitals\n`);

    // Convert to CSV
    const headers = ['NAME', 'ADDRESS', 'PHONE', 'LATITUDE', 'LONGITUDE', 'LINK'];
    const rows = data.features.map(f => {
      const attrs = f.attributes;
      const geom = f.geometry;
      return [
        attrs.NAME || '',
        attrs.ADDRESS || '',
        attrs.PHONE || '',
        geom.y, // latitude
        geom.x, // longitude
        attrs.LINK_EN || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    // Write to file
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'csv', 'hospitals_raw.csv');
    fs.writeFileSync(outputPath, csv);

    console.log(`Saved to: ${outputPath}\n`);
    console.log('Hospitals:');
    data.features.forEach(f => {
      console.log(`  - ${f.attributes.NAME} (${f.attributes.ADDRESS})`);
    });

  } catch (error) {
    console.error('Error downloading hospitals:', error.message);
  }
}

downloadHospitals();
