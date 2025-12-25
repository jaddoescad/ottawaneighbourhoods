#!/usr/bin/env node
/**
 * Download Highway Data for Ottawa
 *
 * Downloads major highways from OpenStreetMap via Overpass API.
 * Highways include: 417 (Queensway), 416, 174, and other major routes.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_FILE = path.join(__dirname, '../src/data/csv/highways_raw.csv');

// Ottawa bounding box (expanded slightly)
const OTTAWA_BBOX = '44.9,-76.4,45.6,-75.2';

// Overpass query for major highways in Ottawa
const OVERPASS_QUERY = `
[out:json][timeout:60];
(
  // Major highways (motorway, trunk)
  way["highway"="motorway"](${OTTAWA_BBOX});
  way["highway"="trunk"](${OTTAWA_BBOX});
  // Primary roads that are major routes
  way["highway"="primary"]["ref"~"^(417|416|174|7|17)$"](${OTTAWA_BBOX});
);
out body;
>;
out skel qt;
`;

function fetchData(query) {
  return new Promise((resolve, reject) => {
    const url = 'https://overpass-api.de/api/interpreter';
    const postData = `data=${encodeURIComponent(query)}`;

    const options = {
      hostname: 'overpass-api.de',
      path: '/api/interpreter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('Fetching highway data from Overpass API...');

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse response: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('=== Downloading Ottawa Highway Data ===\n');

  try {
    const data = await fetchData(OVERPASS_QUERY);

    // Build node lookup
    const nodes = {};
    data.elements.filter(e => e.type === 'node').forEach(n => {
      nodes[n.id] = { lat: n.lat, lon: n.lon };
    });

    // Process ways (highways)
    const highways = [];
    const ways = data.elements.filter(e => e.type === 'way');

    console.log(`Found ${ways.length} highway segments`);

    for (const way of ways) {
      const name = way.tags?.name || way.tags?.ref || 'Unknown';
      const ref = way.tags?.ref || '';
      const highwayType = way.tags?.highway || 'unknown';

      // Get coordinates for each node in the way
      for (const nodeId of way.nodes) {
        const node = nodes[nodeId];
        if (node) {
          highways.push({
            wayId: way.id,
            name,
            ref,
            type: highwayType,
            lat: node.lat,
            lng: node.lon
          });
        }
      }
    }

    console.log(`Extracted ${highways.length} highway points`);

    // Write to CSV
    const csv = ['way_id,name,ref,type,lat,lng'];
    for (const h of highways) {
      csv.push(`${h.wayId},"${h.name}","${h.ref}",${h.type},${h.lat},${h.lng}`);
    }

    fs.writeFileSync(OUTPUT_FILE, csv.join('\n'));
    console.log(`\nWritten to: ${OUTPUT_FILE}`);
    console.log(`Total points: ${highways.length}`);

    // Show summary by highway
    const byRef = {};
    highways.forEach(h => {
      const key = h.ref || h.name;
      byRef[key] = (byRef[key] || 0) + 1;
    });
    console.log('\nPoints by highway:');
    Object.entries(byRef).sort((a, b) => b[1] - a[1]).forEach(([ref, count]) => {
      console.log(`  ${ref}: ${count} points`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
