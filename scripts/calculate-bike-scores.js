/**
 * Calculate Bike Scores for Ottawa Neighbourhoods
 *
 * Uses REAL cycling infrastructure data from City of Ottawa:
 * - Bike lanes, cycle tracks, segregated lanes
 * - Multi-use paths
 * - Paved shoulders (rural)
 *
 * Data source: https://maps.ottawa.ca/arcgis/rest/services/CyclingMap/MapServer/3
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

function pointInMultiPolygon(point, geometry) {
  if (geometry.type === 'Polygon') {
    return pointInPolygon(point, geometry.coordinates[0]);
  } else if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some(poly => pointInPolygon(point, poly[0]));
  }
  return false;
}

async function main() {
  console.log('Loading data...');

  // Load neighbourhood boundaries
  const dataPath = path.join(__dirname, '../src/data/processed/data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const neighbourhoods = Object.values(data.neighbourhoods)
    .filter(n => n.boundaries && n.boundaries.length > 0)
    .map(n => {
      const rings = n.boundaries[0].rings;
      return {
        id: n.id,
        name: n.name,
        geometry: { type: 'Polygon', coordinates: rings },
        areaKm2: n.details?.areaKm2 || 1,
        commuteTime: n.commuteToDowntown || 30
      };
    });

  console.log(`Loaded ${neighbourhoods.length} neighbourhoods`);

  // Load cycling network
  const cyclingPath = path.join(__dirname, '../src/data/csv/cycling_network.csv');
  const cyclingData = fs.readFileSync(cyclingPath, 'utf-8')
    .split('\n')
    .slice(1)
    .filter(line => line.trim())
    .map(line => {
      // Handle CSV with quoted fields: OBJECTID,"TYPE",LENGTH,LAT,LON
      const match = line.match(/^(\d+),"([^"]+)",(\d+),([\d.-]+),([\d.-]+)$/);
      if (!match) return null;
      return {
        type: match[2],
        lengthM: parseInt(match[3]) || 0,
        lat: parseFloat(match[4]),
        lon: parseFloat(match[5])
      };
    })
    .filter(Boolean);

  console.log(`Loaded ${cyclingData.length} cycling segments`);

  // Infrastructure weights (protected > painted > suggested)
  const weights = {
    'Cycle Track': 1.5,           // Protected bike lane
    'Segregated Bike Lane': 1.5,  // Physically separated
    'Bike Lane': 1.0,             // Painted bike lane
    'Path': 1.2,                  // Multi-use path
    'Paved Shoulder': 0.5,        // Rural paved shoulder
    'Mountain Bike Trail': 0.8,   // Off-road trail
    'Suggested Route': 0.2,       // No infrastructure, just suggested
    'Network Link': 0.1,          // Connection segment
    'Crossride': 0.5,             // Crossing
    'Unknown': 0.3                // Unknown type
  };

  // Assign cycling infrastructure to neighbourhoods
  console.log('\nAssigning cycling infrastructure to neighbourhoods...');
  const neighbourhoodCycling = {};

  for (const segment of cyclingData) {
    if (!segment.lat || !segment.lon) continue;

    for (const n of neighbourhoods) {
      if (pointInMultiPolygon([segment.lon, segment.lat], n.geometry)) {
        if (!neighbourhoodCycling[n.id]) {
          neighbourhoodCycling[n.id] = {
            totalLengthM: 0,
            weightedLengthM: 0,
            byType: {}
          };
        }

        const weight = weights[segment.type] || 0.3;
        neighbourhoodCycling[n.id].totalLengthM += segment.lengthM;
        neighbourhoodCycling[n.id].weightedLengthM += segment.lengthM * weight;

        if (!neighbourhoodCycling[n.id].byType[segment.type]) {
          neighbourhoodCycling[n.id].byType[segment.type] = 0;
        }
        neighbourhoodCycling[n.id].byType[segment.type] += segment.lengthM;

        break; // Only assign to first matching neighbourhood
      }
    }
  }

  // Load transit scores for integration bonus
  const transitScoresPath = path.join(__dirname, '../src/data/csv/transit_scores.csv');
  const transitScores = {};
  if (fs.existsSync(transitScoresPath)) {
    fs.readFileSync(transitScoresPath, 'utf-8')
      .split('\n').slice(1).forEach(line => {
        const [id, name, score] = line.split(',');
        if (id) transitScores[id] = parseInt(score) || 0;
      });
  }

  // Calculate bike scores
  const results = [];

  // Get percentile for normalization
  const allDensities = neighbourhoods.map(n => {
    const cycling = neighbourhoodCycling[n.id];
    return cycling ? cycling.weightedLengthM / 1000 / n.areaKm2 : 0;
  }).filter(d => d > 0).sort((a, b) => a - b);

  const p90Density = allDensities[Math.floor(allDensities.length * 0.9)] || 5;
  console.log(`90th percentile cycling density: ${p90Density.toFixed(2)} km/km²`);

  for (const n of neighbourhoods) {
    const cycling = neighbourhoodCycling[n.id] || { totalLengthM: 0, weightedLengthM: 0, byType: {} };
    const transitScore = transitScores[n.id] || 0;

    // Calculate metrics
    const totalKm = cycling.totalLengthM / 1000;
    const weightedKm = cycling.weightedLengthM / 1000;
    const density = weightedKm / n.areaKm2;

    // Score components (total = 100)
    // 1. Infrastructure density (0-50 pts)
    const densityScore = Math.min(50, (density / p90Density) * 50);

    // 2. Infrastructure quality bonus (0-20 pts)
    const protectedKm = ((cycling.byType['Cycle Track'] || 0) +
                         (cycling.byType['Segregated Bike Lane'] || 0)) / 1000;
    const qualityScore = Math.min(20, protectedKm * 4);

    // 3. Downtown proximity (0-15 pts) - central = more connected network
    const centralityScore = Math.max(0, (60 - n.commuteTime) / 60) * 15;

    // 4. Transit integration (0-15 pts) - bike + transit combo
    const transitIntegration = (transitScore / 100) * 15;

    let bikeScore = Math.round(densityScore + qualityScore + centralityScore + transitIntegration);

    // Cap at 100
    bikeScore = Math.min(100, bikeScore);

    results.push({
      id: n.id,
      name: n.name,
      bikeScore,
      totalKm: Math.round(totalKm * 10) / 10,
      bikeLanesKm: Math.round(((cycling.byType['Bike Lane'] || 0) +
                               (cycling.byType['Cycle Track'] || 0) +
                               (cycling.byType['Segregated Bike Lane'] || 0)) / 100) / 10,
      pathsKm: Math.round((cycling.byType['Path'] || 0) / 100) / 10,
      density: Math.round(density * 100) / 100,
      transitScore,
      areaKm2: Math.round(n.areaKm2 * 100) / 100
    });
  }

  // Sort by score
  results.sort((a, b) => b.bikeScore - a.bikeScore);

  // Print top 20
  console.log('\nTop 20 Bike Scores:');
  console.log('ID | Score | Total | Lanes | Paths | Density');
  console.log('-'.repeat(75));
  results.slice(0, 20).forEach(r => {
    console.log(
      `${r.id.substring(0, 28).padEnd(28)} | ${r.bikeScore.toString().padStart(3)} | ` +
      `${r.totalKm.toFixed(1).padStart(5)}km | ${r.bikeLanesKm.toFixed(1).padStart(4)}km | ` +
      `${r.pathsKm.toFixed(1).padStart(5)}km | ${r.density.toFixed(2)}/km²`
    );
  });

  // Print bottom 10
  console.log('\nBottom 10 Bike Scores:');
  results.slice(-10).forEach(r => {
    console.log(
      `${r.id.substring(0, 28).padEnd(28)} | ${r.bikeScore.toString().padStart(3)} | ` +
      `${r.totalKm.toFixed(1).padStart(5)}km | ${r.bikeLanesKm.toFixed(1).padStart(4)}km | ` +
      `${r.pathsKm.toFixed(1).padStart(5)}km | ${r.density.toFixed(2)}/km²`
    );
  });

  // Save to CSV
  const csvPath = path.join(__dirname, '../src/data/csv/bike_scores.csv');
  const csvHeader = 'id,name,bikeScore,totalCyclingKm,bikeLanesKm,pathsKm,densityPerKm2,transitScore,areaKm2\n';
  const csvRows = results.map(r =>
    `${r.id},${r.name.replace(/,/g, ' -')},${r.bikeScore},${r.totalKm},${r.bikeLanesKm},${r.pathsKm},${r.density},${r.transitScore},${r.areaKm2}`
  ).join('\n');

  fs.writeFileSync(csvPath, csvHeader + csvRows);
  console.log(`\nSaved bike scores to ${csvPath}`);

  // Summary
  const avgScore = Math.round(results.reduce((sum, r) => sum + r.bikeScore, 0) / results.length);
  const totalCyclingKm = results.reduce((sum, r) => sum + r.totalKm, 0);

  console.log(`\nSummary:`);
  console.log(`  Average bike score: ${avgScore}`);
  console.log(`  Range: ${Math.min(...results.map(r => r.bikeScore))} - ${Math.max(...results.map(r => r.bikeScore))}`);
  console.log(`  Total cycling infrastructure: ${totalCyclingKm.toFixed(0)} km`);
  console.log(`  Data source: City of Ottawa CyclingMap (maps.ottawa.ca)`);
}

main().catch(console.error);
