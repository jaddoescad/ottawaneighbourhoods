/**
 * Calculate Walk Scores for Ottawa Neighbourhoods
 *
 * Uses local amenity data to calculate walkability scores (0-100)
 * based on density of:
 * - Grocery stores (essential daily needs)
 * - Restaurants & cafes (dining options)
 * - Parks (recreation)
 * - Schools (education)
 * - Libraries (community services)
 * - Recreation facilities (fitness/community)
 *
 * Methodology: Weighted amenity density per km² normalized to 0-100 scale
 */

const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Loading neighbourhood data...');
  const dataPath = path.join(__dirname, '../src/data/processed/data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const neighbourhoods = Object.values(data.neighbourhoods)
    .filter(n => n.details && n.details.areaKm2 > 0);

  console.log(`Loaded ${neighbourhoods.length} neighbourhoods with data`);

  // Calculate walk scores
  const results = [];

  // First pass: collect data to understand ranges
  const metrics = {
    groceryDensity: [],
    restaurantDensity: [],
    parkDensity: [],
    schoolDensity: [],
    libraryDensity: [],
    recreationDensity: []
  };

  for (const n of neighbourhoods) {
    const area = n.details.areaKm2 || 1;

    metrics.groceryDensity.push((n.details.groceryStores || 0) / area);
    metrics.restaurantDensity.push((n.details.restaurantsAndCafes || 0) / area);
    metrics.parkDensity.push((n.details.parks || 0) / area);
    metrics.schoolDensity.push((n.details.schools || 0) / area);
    metrics.libraryDensity.push((n.details.libraries || 0) / area);
    metrics.recreationDensity.push((n.details.recreationFacilities || 0) / area);
  }

  // Get percentile-based scoring thresholds
  function getPercentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * p);
    return sorted[index];
  }

  // Define max thresholds as 90th percentile to avoid outlier effects
  const thresholds = {
    grocery: getPercentile(metrics.groceryDensity, 0.9),
    restaurant: getPercentile(metrics.restaurantDensity, 0.9),
    park: getPercentile(metrics.parkDensity, 0.9),
    school: getPercentile(metrics.schoolDensity, 0.9),
    library: getPercentile(metrics.libraryDensity, 0.9),
    recreation: getPercentile(metrics.recreationDensity, 0.9)
  };

  console.log('\n90th percentile thresholds (per km²):');
  console.log(`  Grocery: ${thresholds.grocery.toFixed(2)}`);
  console.log(`  Restaurant: ${thresholds.restaurant.toFixed(2)}`);
  console.log(`  Park: ${thresholds.park.toFixed(2)}`);
  console.log(`  School: ${thresholds.school.toFixed(2)}`);
  console.log(`  Library: ${thresholds.library.toFixed(2)}`);
  console.log(`  Recreation: ${thresholds.recreation.toFixed(2)}`);

  // Score weights (total = 100)
  const weights = {
    grocery: 30,      // Most important - daily essentials
    restaurant: 25,   // Dining/entertainment options
    recreation: 15,   // Fitness and community
    park: 15,         // Green space access
    school: 10,       // Education (mainly for families)
    library: 5        // Community services
  };

  // Second pass: calculate scores
  for (const n of neighbourhoods) {
    const area = n.details.areaKm2 || 1;

    // Calculate densities
    const densities = {
      grocery: (n.details.groceryStores || 0) / area,
      restaurant: (n.details.restaurantsAndCafes || 0) / area,
      park: (n.details.parks || 0) / area,
      school: (n.details.schools || 0) / area,
      library: (n.details.libraries || 0) / area,
      recreation: (n.details.recreationFacilities || 0) / area
    };

    // Calculate component scores (0-1 scale, capped at threshold)
    const componentScores = {};
    let totalScore = 0;

    for (const [key, weight] of Object.entries(weights)) {
      const normalized = Math.min(1, densities[key] / thresholds[key]);
      componentScores[key] = normalized;
      totalScore += normalized * weight;
    }

    // Bonus for having at least one of each essential amenity
    const hasGrocery = (n.details.groceryStores || 0) > 0;
    const hasRestaurant = (n.details.restaurantsAndCafes || 0) > 0;
    const hasPark = (n.details.parks || 0) > 0;

    // Penalty for missing essential amenities
    if (!hasGrocery) totalScore *= 0.7;
    if (!hasRestaurant) totalScore *= 0.85;

    const walkScore = Math.round(Math.min(100, totalScore));

    results.push({
      id: n.id,
      name: n.name,
      walkScore,
      groceryStores: n.details.groceryStores || 0,
      restaurants: n.details.restaurantsAndCafes || 0,
      parks: n.details.parks || 0,
      schools: n.details.schools || 0,
      libraries: n.details.libraries || 0,
      recreation: n.details.recreationFacilities || 0,
      areaKm2: Math.round(area * 100) / 100
    });
  }

  // Sort by walk score
  results.sort((a, b) => b.walkScore - a.walkScore);

  // Print top 20
  console.log('\nTop 20 Walk Scores:');
  console.log('ID | Score | Grocery | Restaurants | Parks | Schools | Recreation');
  console.log('-'.repeat(85));
  results.slice(0, 20).forEach(r => {
    console.log(
      `${r.id.substring(0, 28).padEnd(28)} | ${r.walkScore.toString().padStart(3)} | ` +
      `${r.groceryStores.toString().padStart(3)} groc | ${r.restaurants.toString().padStart(3)} rest | ` +
      `${r.parks.toString().padStart(2)} park | ${r.schools.toString().padStart(2)} sch | ${r.recreation.toString().padStart(2)} rec`
    );
  });

  // Print bottom 10
  console.log('\nBottom 10 Walk Scores:');
  results.slice(-10).forEach(r => {
    console.log(
      `${r.id.substring(0, 28).padEnd(28)} | ${r.walkScore.toString().padStart(3)} | ` +
      `${r.groceryStores.toString().padStart(3)} groc | ${r.restaurants.toString().padStart(3)} rest | ` +
      `${r.parks.toString().padStart(2)} park | ${r.schools.toString().padStart(2)} sch | ${r.recreation.toString().padStart(2)} rec`
    );
  });

  // Save to CSV
  const csvPath = path.join(__dirname, '../src/data/csv/walk_scores.csv');
  const csvHeader = 'id,name,walkScore,groceryStores,restaurants,parks,schools,libraries,recreation,areaKm2\n';
  const csvRows = results.map(r =>
    `${r.id},${r.name.replace(/,/g, ' -')},${r.walkScore},${r.groceryStores},${r.restaurants},${r.parks},${r.schools},${r.libraries},${r.recreation},${r.areaKm2}`
  ).join('\n');

  fs.writeFileSync(csvPath, csvHeader + csvRows);
  console.log(`\nSaved walk scores to ${csvPath}`);

  // Summary
  const avgScore = Math.round(results.reduce((sum, r) => sum + r.walkScore, 0) / results.length);
  const maxScore = Math.max(...results.map(r => r.walkScore));
  const minScore = Math.min(...results.map(r => r.walkScore));

  console.log(`\nSummary:`);
  console.log(`  Average walk score: ${avgScore}`);
  console.log(`  Range: ${minScore} - ${maxScore}`);
}

main().catch(console.error);
