/**
 * Download Ottawa Cycling Network Data
 *
 * Source: https://maps.ottawa.ca/arcgis/rest/services/CyclingMap/MapServer/3
 *
 * Facility types:
 * - Bike Lane: On-road bike lane
 * - Cycle Track: Protected/separated bike lane
 * - Segregated Bike Lane: Physically separated
 * - Path: Multi-use pathway
 * - Paved Shoulder: Rural paved shoulder
 * - Suggested Route: Recommended cycling route (no infrastructure)
 * - Network Link: Connection between facilities
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'https://maps.ottawa.ca/arcgis/rest/services/CyclingMap/MapServer/3/query';

async function fetchAllFeatures() {
  const allFeatures = [];
  let offset = 0;
  const batchSize = 1000;

  console.log('Fetching cycling network data...');

  while (true) {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: 'OBJECTID,EXISTING_CYCLING_NETWORK,Shape_Length',
      returnGeometry: 'true',
      outSR: '4326',
      f: 'json',
      resultOffset: offset,
      resultRecordCount: batchSize
    });

    const response = await fetch(`${API_URL}?${params}`);
    const data = await response.json();

    if (!data.features || data.features.length === 0) break;

    allFeatures.push(...data.features);
    console.log(`  Fetched ${allFeatures.length} features...`);

    if (data.features.length < batchSize) break;
    offset += batchSize;
  }

  return allFeatures;
}

async function main() {
  const features = await fetchAllFeatures();
  console.log(`\nTotal features: ${features.length}`);

  // Convert to CSV format
  const csvRows = ['OBJECTID,FACILITY_TYPE,LENGTH_M,COORDINATES'];

  // Also collect stats
  const stats = {};
  let totalLength = 0;

  for (const feature of features) {
    const type = feature.attributes.EXISTING_CYCLING_NETWORK || 'Unknown';
    const length = feature.attributes.Shape_Length || 0;

    stats[type] = stats[type] || { count: 0, length: 0 };
    stats[type].count++;
    stats[type].length += length;
    totalLength += length;

    // Get centroid of the line for neighbourhood assignment
    if (feature.geometry && feature.geometry.paths && feature.geometry.paths[0]) {
      const coords = feature.geometry.paths[0];
      const midIndex = Math.floor(coords.length / 2);
      const [lon, lat] = coords[midIndex];

      csvRows.push([
        feature.attributes.OBJECTID,
        `"${type}"`,
        Math.round(length),
        `${lat},${lon}`
      ].join(','));
    }
  }

  // Save CSV
  const csvPath = path.join(__dirname, '../src/data/csv/cycling_network.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n'));
  console.log(`\nSaved to ${csvPath}`);

  // Print stats
  console.log('\nCycling Network Summary:');
  console.log('========================');
  Object.entries(stats)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([type, data]) => {
      console.log(`  ${type}: ${data.count} segments, ${(data.length / 1000).toFixed(1)} km`);
    });
  console.log(`\nTotal: ${features.length} segments, ${(totalLength / 1000).toFixed(1)} km`);

  // Save GeoJSON for detailed analysis
  const geojson = {
    type: 'FeatureCollection',
    features: features.map(f => ({
      type: 'Feature',
      properties: {
        id: f.attributes.OBJECTID,
        type: f.attributes.EXISTING_CYCLING_NETWORK,
        lengthM: f.attributes.Shape_Length
      },
      geometry: {
        type: 'LineString',
        coordinates: f.geometry?.paths?.[0] || []
      }
    }))
  };

  const geojsonPath = path.join(__dirname, 'data/cycling_network.geojson');
  fs.writeFileSync(geojsonPath, JSON.stringify(geojson));
  console.log(`\nSaved GeoJSON to ${geojsonPath}`);
}

main().catch(console.error);
