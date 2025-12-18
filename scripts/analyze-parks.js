// Script to analyze parks per neighbourhood using Ottawa Open Data
// Run with: node scripts/analyze-parks.js

const PARKS_URL = 'https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer/24/query';
const NEIGHBOURHOODS_URL = 'https://maps.ottawa.ca/arcgis/rest/services/Neighbourhoods/MapServer/0/query';

// Neighbourhood mapping from our app to Ottawa ONS IDs
const NEIGHBOURHOOD_MAPPING = {
  'the-glebe': { onsIds: [923], name: 'Glebe - Dows Lake' },
  'westboro': { onsIds: [958], name: 'Westboro' },
  'byward-market': { onsIds: [908], name: 'Byward Market' },
  'centretown': { onsIds: [24, 957], name: 'Centretown' },
  'old-ottawa-south': { onsIds: [83], name: 'Old Ottawa South' },
  'hintonburg': { onsIds: [47], name: 'Hintonburg - Mechanicsville' },
  'little-italy': { onsIds: [55], name: 'Island Park - Wellington Village' }, // Little Italy is around Preston St
  'kanata': { onsIds: [928, 929, 924, 902], name: 'Kanata area' },
  'alta-vista': { onsIds: [903], name: 'Billings Bridge - Alta Vista' },
  'sandy-hill': { onsIds: [949], name: 'Sandy Hill' },
  'orleans': { onsIds: [920, 915, 939, 909, 913, 75, 942, 943], name: 'Orleans area' },
  'barrhaven': { onsIds: [937, 938, 914, 952, 921], name: 'Barrhaven area' },
};

// Point-in-polygon algorithm (ray casting)
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

// Check if point is in any ring of a polygon (handles holes)
function pointInPolygonWithHoles(point, rings) {
  if (!rings || rings.length === 0) return false;

  // First ring is outer boundary, rest are holes
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

async function fetchAllParks() {
  console.log('Fetching parks data...');
  const allParks = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const url = `${PARKS_URL}?where=1%3D1&outFields=NAME,LATITUDE,LONGITUDE,PARK_TYPE,PARK_CATEGORY&f=json&resultOffset=${offset}&resultRecordCount=${batchSize}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      break;
    }

    for (const feature of data.features) {
      const attrs = feature.attributes;
      if (attrs.LATITUDE && attrs.LONGITUDE) {
        allParks.push({
          name: attrs.NAME,
          type: attrs.PARK_TYPE,
          category: attrs.PARK_CATEGORY,
          lat: attrs.LATITUDE,
          lng: attrs.LONGITUDE
        });
      }
    }

    console.log(`  Fetched ${allParks.length} parks so far...`);
    offset += batchSize;

    if (data.features.length < batchSize) {
      break;
    }
  }

  console.log(`Total parks fetched: ${allParks.length}`);
  return allParks;
}

async function fetchNeighbourhoodBoundaries(onsIds) {
  const boundaries = [];

  for (const onsId of onsIds) {
    const url = `${NEIGHBOURHOODS_URL}?where=ONS_ID%3D${onsId}&outFields=ONS_ID,NAME&returnGeometry=true&outSR=4326&f=json`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        if (feature.geometry && feature.geometry.rings) {
          boundaries.push({
            onsId: onsId,
            name: feature.attributes.NAME,
            rings: feature.geometry.rings
          });
        }
      }
    } catch (e) {
      console.error(`Error fetching boundary for ONS_ID ${onsId}:`, e.message);
    }
  }

  return boundaries;
}

function countParksInNeighbourhood(parks, boundaries) {
  let count = 0;
  const parksInArea = [];

  for (const park of parks) {
    // Point as [longitude, latitude] to match the polygon format
    const point = [park.lng, park.lat];

    for (const boundary of boundaries) {
      if (pointInPolygonWithHoles(point, boundary.rings)) {
        count++;
        parksInArea.push({ name: park.name, type: park.type, category: park.category });
        break;
      }
    }
  }

  return { count, parksInArea };
}

async function main() {
  console.log('=== Ottawa Parks Analysis ===\n');

  // Fetch all parks
  const parks = await fetchAllParks();

  console.log('\nAnalyzing parks per neighbourhood...\n');

  const results = {};

  for (const [id, mapping] of Object.entries(NEIGHBOURHOOD_MAPPING)) {
    process.stdout.write(`Processing ${mapping.name}...`);

    const boundaries = await fetchNeighbourhoodBoundaries(mapping.onsIds);
    const { count, parksInArea } = countParksInNeighbourhood(parks, boundaries);

    results[id] = {
      name: mapping.name,
      parkCount: count,
      parks: parksInArea
    };

    console.log(` ${count} parks`);
  }

  console.log('\n=== RESULTS ===\n');
  console.log('Park counts to update in neighbourhoods.ts:\n');

  for (const [id, data] of Object.entries(results)) {
    console.log(`"${id}": ${data.parkCount} parks`);
    if (data.parks.length > 0) {
      const sampleParks = data.parks.slice(0, 3).map(p => p.name).join(', ');
      console.log(`  Sample: ${sampleParks}`);
    }
  }

  // Output update code
  console.log('\n=== CODE TO UPDATE neighbourhoods.ts ===\n');
  for (const [id, data] of Object.entries(results)) {
    console.log(`// ${id}: ${data.parkCount} parks`);
  }

  // Output full JSON
  console.log('\n=== FULL JSON OUTPUT ===\n');
  const output = {};
  for (const [id, data] of Object.entries(results)) {
    output[id] = {
      parkCount: data.parkCount,
      sampleParks: data.parks.slice(0, 5).map(p => p.name)
    };
  }
  console.log(JSON.stringify(output, null, 2));
}

main().catch(console.error);
