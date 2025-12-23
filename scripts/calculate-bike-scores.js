/**
 * Calculate Bike Scores for Ottawa Neighbourhoods
 *
 * Uses available data to estimate bikeability (0-100):
 * - NCC Greenbelt trails (multi-use paths)
 * - Parks (green corridors for cycling)
 * - Transit integration (bike-transit combo)
 * - Population density (urban = more bike infrastructure)
 * - Distance to downtown (central areas more connected)
 *
 * Note: Official bike lane data not readily available via API
 * This is an estimated score based on proxy indicators
 */

const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Loading neighbourhood data...');
  const dataPath = path.join(__dirname, '../src/data/processed/data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // Also load our calculated transit scores
  const transitScoresPath = path.join(__dirname, '../src/data/csv/transit_scores.csv');
  const transitScoresContent = fs.readFileSync(transitScoresPath, 'utf-8');
  const transitScores = {};
  transitScoresContent.split('\n').slice(1).forEach(line => {
    const [id, name, score] = line.split(',');
    if (id) transitScores[id] = parseInt(score) || 0;
  });

  // Load walk scores
  const walkScoresPath = path.join(__dirname, '../src/data/csv/walk_scores.csv');
  const walkScoresContent = fs.readFileSync(walkScoresPath, 'utf-8');
  const walkScores = {};
  walkScoresContent.split('\n').slice(1).forEach(line => {
    const [id, name, score] = line.split(',');
    if (id) walkScores[id] = parseInt(score) || 0;
  });

  const neighbourhoods = Object.values(data.neighbourhoods)
    .filter(n => n.details && n.details.areaKm2 > 0);

  console.log(`Loaded ${neighbourhoods.length} neighbourhoods`);

  // Calculate bike scores
  const results = [];

  // First pass: collect metrics for normalization
  const metrics = {
    trailLength: [],
    parkDensity: [],
    populationDensity: []
  };

  for (const n of neighbourhoods) {
    const area = n.details.areaKm2 || 1;
    metrics.trailLength.push(n.details.greenbeltTrailsLengthKm || 0);
    metrics.parkDensity.push((n.details.parks || 0) / area);
    metrics.populationDensity.push(n.populationDensity || 0);
  }

  // Get percentile thresholds
  function getPercentile(arr, p) {
    const sorted = [...arr].filter(x => x > 0).sort((a, b) => a - b);
    if (sorted.length === 0) return 1;
    const index = Math.floor(sorted.length * p);
    return sorted[Math.min(index, sorted.length - 1)];
  }

  const thresholds = {
    trails: getPercentile(metrics.trailLength, 0.9) || 10,
    parks: getPercentile(metrics.parkDensity, 0.9) || 5,
    popDensity: getPercentile(metrics.populationDensity, 0.9) || 5000
  };

  console.log('\nThresholds:');
  console.log(`  Trail length: ${thresholds.trails.toFixed(1)} km`);
  console.log(`  Park density: ${thresholds.parks.toFixed(1)} per km²`);
  console.log(`  Pop density: ${thresholds.popDensity.toFixed(0)} per km²`);

  // Component weights (total = 100)
  const weights = {
    trails: 20,          // Greenbelt/MUP access
    parks: 15,           // Green corridors
    transitIntegration: 15, // Bike-transit combo
    walkability: 25,     // Walkable = likely bikeable
    centrality: 25       // Downtown proximity
  };

  for (const n of neighbourhoods) {
    const area = n.details.areaKm2 || 1;

    // Get distance to downtown (from commute time as proxy)
    const commuteTime = n.commuteToDowntown || 30;
    // Convert commute time to centrality score (5 min = 100, 60 min = 0)
    const centralityScore = Math.max(0, Math.min(1, (60 - commuteTime) / 55));

    // Calculate component scores
    const trailScore = Math.min(1, (n.details.greenbeltTrailsLengthKm || 0) / thresholds.trails);
    const parkScore = Math.min(1, ((n.details.parks || 0) / area) / thresholds.parks);
    const transitScore = (transitScores[n.id] || 0) / 100;
    const walkScore = (walkScores[n.id] || 0) / 100;

    // Population density bonus (denser = more bike infrastructure typically)
    const densityBonus = Math.min(0.2, (n.populationDensity || 0) / thresholds.popDensity * 0.2);

    // Calculate total score
    let bikeScore =
      trailScore * weights.trails +
      parkScore * weights.parks +
      transitScore * weights.transitIntegration +
      walkScore * weights.walkability +
      centralityScore * weights.centrality +
      densityBonus * 20; // Up to 4 bonus points

    // Penalty for very rural areas (huge area, low density)
    if (area > 50 && (n.populationDensity || 0) < 100) {
      bikeScore *= 0.5;
    }

    bikeScore = Math.round(Math.min(100, bikeScore));

    results.push({
      id: n.id,
      name: n.name,
      bikeScore,
      greenbeltTrails: n.details.greenbeltTrailsLengthKm || 0,
      parks: n.details.parks || 0,
      transitScore: transitScores[n.id] || 0,
      walkScore: walkScores[n.id] || 0,
      commuteTime: commuteTime,
      areaKm2: Math.round(area * 100) / 100
    });
  }

  // Sort by bike score
  results.sort((a, b) => b.bikeScore - a.bikeScore);

  // Print top 20
  console.log('\nTop 20 Bike Scores:');
  console.log('ID | Bike | Trails | Parks | Transit | Walk | Commute');
  console.log('-'.repeat(80));
  results.slice(0, 20).forEach(r => {
    console.log(
      `${r.id.substring(0, 28).padEnd(28)} | ${r.bikeScore.toString().padStart(3)} | ` +
      `${r.greenbeltTrails.toFixed(1).padStart(5)}km | ${r.parks.toString().padStart(2)} pk | ` +
      `${r.transitScore.toString().padStart(3)} tr | ${r.walkScore.toString().padStart(3)} wk | ` +
      `${r.commuteTime.toString().padStart(2)} min`
    );
  });

  // Print bottom 10
  console.log('\nBottom 10 Bike Scores:');
  results.slice(-10).forEach(r => {
    console.log(
      `${r.id.substring(0, 28).padEnd(28)} | ${r.bikeScore.toString().padStart(3)} | ` +
      `${r.greenbeltTrails.toFixed(1).padStart(5)}km | ${r.parks.toString().padStart(2)} pk | ` +
      `${r.transitScore.toString().padStart(3)} tr | ${r.walkScore.toString().padStart(3)} wk | ` +
      `${r.commuteTime.toString().padStart(2)} min`
    );
  });

  // Save to CSV
  const csvPath = path.join(__dirname, '../src/data/csv/bike_scores.csv');
  const csvHeader = 'id,name,bikeScore,greenbeltTrailsKm,parks,transitScore,walkScore,commuteTime,areaKm2\n';
  const csvRows = results.map(r =>
    `${r.id},${r.name.replace(/,/g, ' -')},${r.bikeScore},${r.greenbeltTrails},${r.parks},${r.transitScore},${r.walkScore},${r.commuteTime},${r.areaKm2}`
  ).join('\n');

  fs.writeFileSync(csvPath, csvHeader + csvRows);
  console.log(`\nSaved bike scores to ${csvPath}`);

  // Summary
  const avgScore = Math.round(results.reduce((sum, r) => sum + r.bikeScore, 0) / results.length);
  const maxScore = Math.max(...results.map(r => r.bikeScore));
  const minScore = Math.min(...results.map(r => r.bikeScore));

  console.log(`\nSummary:`);
  console.log(`  Average bike score: ${avgScore}`);
  console.log(`  Range: ${minScore} - ${maxScore}`);
  console.log(`  Note: Score based on trails, parks, transit, walkability, and downtown proximity`);
  console.log(`  (Official bike lane data not available via open API)`);
}

main().catch(console.error);
