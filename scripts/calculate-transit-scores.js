/**
 * Calculate Transit Scores for Ottawa Neighbourhoods
 *
 * Uses OC Transpo GTFS data to calculate transit accessibility scores (0-100)
 * based on:
 * - O-Train station proximity (highest weight)
 * - Bus stop density within neighbourhood
 * - Route frequency/coverage
 *
 * Data sources:
 * - GTFS: https://oct-gtfs-emasagcnfmcgeham.z01.azurefd.net/public-access/GTFSExport.zip
 * - Boundaries: Ottawa Open Data
 */

const fs = require('fs');
const path = require('path');

// Point-in-polygon algorithm
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

// Check if point is in any polygon of a multi-polygon
function pointInMultiPolygon(point, geometry) {
  if (geometry.type === 'Polygon') {
    return pointInPolygon(point, geometry.coordinates[0]);
  } else if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some(poly => pointInPolygon(point, poly[0]));
  }
  return false;
}

// Calculate distance between two points in km (Haversine formula)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate polygon centroid
function getCentroid(geometry) {
  let coords = [];
  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    coords = geometry.coordinates[0][0];
  }

  let sumLat = 0, sumLon = 0;
  coords.forEach(([lon, lat]) => {
    sumLat += lat;
    sumLon += lon;
  });

  return {
    lat: sumLat / coords.length,
    lon: sumLon / coords.length
  };
}

// Calculate polygon area in km²
function getPolygonArea(geometry) {
  let coords = [];
  if (geometry.type === 'Polygon') {
    coords = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon') {
    // Sum areas of all polygons
    let totalArea = 0;
    for (const poly of geometry.coordinates) {
      totalArea += calculateRingArea(poly[0]);
    }
    return totalArea;
  }
  return calculateRingArea(coords);
}

function calculateRingArea(coords) {
  // Shoelace formula with lat/lon to km conversion
  const R = 6371; // Earth radius in km
  let area = 0;
  const n = coords.length;

  for (let i = 0; i < n - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];

    // Convert to radians
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const lon1Rad = lon1 * Math.PI / 180;
    const lon2Rad = lon2 * Math.PI / 180;

    area += (lon2Rad - lon1Rad) * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad));
  }

  area = Math.abs(area * R * R / 2);
  return area;
}

// Parse GTFS CSV files
function parseCSV(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    return obj;
  });
}

async function main() {
  console.log('Loading GTFS data...');

  const gtfsDir = path.join(__dirname, 'data/gtfs');

  // Parse GTFS files
  const stops = parseCSV(path.join(gtfsDir, 'stops.txt'));
  const routes = parseCSV(path.join(gtfsDir, 'routes.txt'));
  const trips = parseCSV(path.join(gtfsDir, 'trips.txt'));
  const stopTimes = parseCSV(path.join(gtfsDir, 'stop_times.txt'));

  console.log(`Loaded ${stops.length} stops, ${routes.length} routes`);

  // Identify O-Train routes (route_type = 0)
  const otrainRouteIds = new Set(
    routes.filter(r => r.route_type === '0').map(r => r.route_id)
  );
  console.log(`O-Train routes: ${[...otrainRouteIds].join(', ')}`);

  // Get trips for O-Train routes
  const otrainTripIds = new Set(
    trips.filter(t => otrainRouteIds.has(t.route_id)).map(t => t.trip_id)
  );
  console.log(`O-Train trips: ${otrainTripIds.size}`);

  // Find O-Train stop IDs
  console.log('Finding O-Train stops...');
  const otrainStopIds = new Set();
  stopTimes.forEach(st => {
    if (otrainTripIds.has(st.trip_id)) {
      otrainStopIds.add(st.stop_id);
    }
  });
  console.log(`O-Train stops: ${otrainStopIds.size}`);

  // Categorize stops
  const otrainStops = [];
  const busStops = [];

  stops.forEach(stop => {
    const lat = parseFloat(stop.stop_lat);
    const lon = parseFloat(stop.stop_lon);

    if (isNaN(lat) || isNaN(lon)) return;

    const stopData = {
      id: stop.stop_id,
      name: stop.stop_name,
      lat,
      lon
    };

    if (otrainStopIds.has(stop.stop_id)) {
      otrainStops.push(stopData);
    } else {
      busStops.push(stopData);
    }
  });

  console.log(`Categorized: ${otrainStops.length} O-Train stops, ${busStops.length} bus stops`);

  // Load neighbourhood boundaries
  console.log('\nLoading neighbourhood boundaries...');
  const dataPath = path.join(__dirname, '../src/data/processed/data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const neighbourhoods = Object.values(data.neighbourhoods)
    .filter(n => n.boundaries && n.boundaries.length > 0)
    .map(n => {
      // Convert rings format to GeoJSON-like format for our functions
      const rings = n.boundaries[0].rings;
      const geometry = {
        type: 'Polygon',
        coordinates: rings
      };
      return {
        id: n.id,
        name: n.name,
        geometry,
        centroid: getCentroid(geometry),
        area: getPolygonArea(geometry)
      };
    });

  console.log(`Loaded ${neighbourhoods.length} neighbourhoods with boundaries`);

  // Calculate transit scores for each neighbourhood
  console.log('\nCalculating transit scores...');
  const results = [];

  for (const neighbourhood of neighbourhoods) {
    // Count stops within neighbourhood
    let otrainCount = 0;
    let busCount = 0;

    otrainStops.forEach(stop => {
      if (pointInMultiPolygon([stop.lon, stop.lat], neighbourhood.geometry)) {
        otrainCount++;
      }
    });

    busStops.forEach(stop => {
      if (pointInMultiPolygon([stop.lon, stop.lat], neighbourhood.geometry)) {
        busCount++;
      }
    });

    // Find distance to nearest O-Train station
    let minOtrainDistance = Infinity;
    otrainStops.forEach(stop => {
      const dist = haversineDistance(
        neighbourhood.centroid.lat, neighbourhood.centroid.lon,
        stop.lat, stop.lon
      );
      if (dist < minOtrainDistance) {
        minOtrainDistance = dist;
      }
    });

    // Calculate bus stop density (stops per km²)
    const busStopDensity = neighbourhood.area > 0 ? busCount / neighbourhood.area : 0;

    // Calculate transit score (0-100)
    // Components:
    // 1. O-Train access (0-40 pts): Based on having O-Train stops or proximity
    // 2. Bus stop density (0-40 pts): Based on stops per km²
    // 3. Bus coverage (0-20 pts): Based on total bus stops

    let otrainScore = 0;
    if (otrainCount > 0) {
      // Has O-Train stations within neighbourhood
      otrainScore = Math.min(40, 25 + otrainCount * 5);
    } else if (minOtrainDistance < 1) {
      // Within 1km of O-Train
      otrainScore = 20;
    } else if (minOtrainDistance < 2) {
      // Within 2km of O-Train
      otrainScore = 10;
    } else if (minOtrainDistance < 5) {
      // Within 5km of O-Train
      otrainScore = 5;
    }

    // Bus density score (typical urban density is 10-30 stops/km²)
    // Max score at 20+ stops/km²
    const densityScore = Math.min(40, busStopDensity * 2);

    // Bus coverage score (bonus for high absolute number of stops)
    const coverageScore = Math.min(20, busCount / 5);

    const transitScore = Math.round(otrainScore + densityScore + coverageScore);

    results.push({
      id: neighbourhood.id,
      name: neighbourhood.name,
      transitScore: Math.min(100, transitScore),
      otrainStops: otrainCount,
      busStops: busCount,
      busStopDensity: Math.round(busStopDensity * 10) / 10,
      distanceToOtrain: Math.round(minOtrainDistance * 10) / 10,
      area: Math.round(neighbourhood.area * 100) / 100
    });
  }

  // Sort by transit score
  results.sort((a, b) => b.transitScore - a.transitScore);

  // Print top 20
  console.log('\nTop 20 Transit Scores:');
  console.log('ID | Name | Score | O-Train | Bus Stops | Density | Dist to O-Train');
  console.log('-'.repeat(90));
  results.slice(0, 20).forEach(r => {
    console.log(
      `${r.id.substring(0, 25).padEnd(25)} | ${r.transitScore.toString().padStart(3)} | ` +
      `${r.otrainStops.toString().padStart(2)} O-Train | ${r.busStops.toString().padStart(3)} bus | ` +
      `${r.busStopDensity.toString().padStart(5)}/km² | ${r.distanceToOtrain}km`
    );
  });

  // Print bottom 10
  console.log('\nBottom 10 Transit Scores:');
  results.slice(-10).forEach(r => {
    console.log(
      `${r.id.substring(0, 25).padEnd(25)} | ${r.transitScore.toString().padStart(3)} | ` +
      `${r.otrainStops.toString().padStart(2)} O-Train | ${r.busStops.toString().padStart(3)} bus | ` +
      `${r.busStopDensity.toString().padStart(5)}/km² | ${r.distanceToOtrain}km`
    );
  });

  // Save to CSV
  const csvPath = path.join(__dirname, '../src/data/csv/transit_scores.csv');
  const csvHeader = 'id,name,transitScore,otrainStops,busStops,busStopDensity,distanceToOtrain,areaKm2\n';
  const csvRows = results.map(r =>
    `${r.id},${r.name.replace(/,/g, ' -')},${r.transitScore},${r.otrainStops},${r.busStops},${r.busStopDensity},${r.distanceToOtrain},${r.area}`
  ).join('\n');

  fs.writeFileSync(csvPath, csvHeader + csvRows);
  console.log(`\nSaved transit scores to ${csvPath}`);

  // Summary stats
  const avgScore = Math.round(results.reduce((sum, r) => sum + r.transitScore, 0) / results.length);
  const maxScore = Math.max(...results.map(r => r.transitScore));
  const minScore = Math.min(...results.map(r => r.transitScore));

  console.log(`\nSummary:`);
  console.log(`  Average transit score: ${avgScore}`);
  console.log(`  Range: ${minScore} - ${maxScore}`);
  console.log(`  Neighbourhoods with O-Train: ${results.filter(r => r.otrainStops > 0).length}`);
  console.log(`  Total bus stops analyzed: ${busStops.length}`);
}

main().catch(console.error);
