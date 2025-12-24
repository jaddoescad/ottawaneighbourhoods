/**
 * Process Development Applications by Neighbourhood
 *
 * Uses point-in-polygon to assign development applications to neighbourhoods.
 * Calculates development activity metrics for each neighbourhood.
 */

const fs = require('fs');
const path = require('path');

// Load neighbourhood boundaries
const dataPath = path.join(__dirname, '../src/data/processed/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const neighbourhoods = data.neighbourhoods;

// Ward to neighbourhood mapping (same as 311 data)
const WARD_NEIGHBOURHOOD_MAP = {
  '1': ['orleans-village-chateauneuf', 'convent-glen-orleans-woods', 'fallingbrook', 'queenswood-chatelaine'],
  '2': ['cardinal-creek', 'queenswood-heights', 'pineview', 'portobello-south'],
  '3': ['blackburn-hamlet', 'beacon-hill-south-cardinal-heights', 'rothwell-heights-beacon-hill-north', 'hawthorne-meadows-sheffield-glen'],
  '4': ['cumberland', 'navan-sarsfield', 'vars'],
  '5': ['rideau-crest-davidson-heights', 'edwards-carlsbad-springs', 'osgoode-vernon', 'greely', 'metcalfe'],
  '6': ['old-barrhaven-east', 'old-barrhaven-west', 'chapman-mills', 'stonebridge-half-moon-bay'],
  '7': ['bridlewood-emerald-meadows', 'findlay-creek'],
  '8': ['blossom-park-timbermill', 'emerald-woods-sawmill-creek', 'hunt-club-park', 'greenboro-east', 'greenboro-west', 'south-keys'],
  '9': ['riverside-park-mooney-s-bay', 'riverside-park-south-revelstoke', 'carleton-heights-courtland-park', 'playfair-park-guildwood-estates'],
  '10': ['old-hunt-club', 'leslie-park-bruce-farm', 'ledbury-heron-gate-ridgemont', 'elmvale-canterbury'],
  '11': ['alta-vista', 'riverview', 'billings-bridge-heron-park'],
  '12': ['sandy-hill', 'lowertown-east', 'lowertown-west', 'vanier-north', 'vanier-south', 'overbrook'],
  '13': ['new-edinburgh', 'manor-park', 'rockcliffe-park', 'wateridge-village', 'carson-grove-carson-meadows'],
  '14': ['old-ottawa-east', 'old-ottawa-south', 'glebe-dows-lake'],
  '15': ['centretown', 'west-centretown', 'civic-hospital', 'hintonburg-mechanicsville'],
  '16': ['westboro', 'island-park-wellington-village', 'britannia', 'crystal-bay-lakeview-park'],
  '17': ['carlington', 'parkwood-hills', 'borden-farm-fisher-glen', 'fisher-heights', 'merivale-gardens-grenfell-glen-pineglen-country-place', 'craig-henry-manordale'],
  '18': ['centrepointe', 'trend-arlington', 'queensway-terrace-north', 'braemar-park-bel-air-heights-copeland-park'],
  '19': ['bells-corners-east', 'bells-corners-west', 'glen-cairn', 'city-view', 'crestview-tanglewood', 'laurentian'],
  '20': ['manotick', 'north-gower-kars', 'munster-ashton', 'richmond', 'riverside-south-leitrim'],
  '21': ['kanata-lakes', 'katimavik-hazeldean', 'beaverbrook', 'brookside-briarbrook-morgan-s-grant', 'stittsville-east', 'stittsville-north', 'stittsville'],
  '22': ['qualicum-redwood', 'iris', 'bayshore', 'whitehaven-woodpark-glabar-park'],
  '23': ['carp', 'kinburn', 'constance-bay', 'dunrobin', 'fitzroy', 'corkery'],
  '24': ['chapel-hill-north', 'chapel-hill-south']
};

// Point-in-polygon check
function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

// Find neighbourhood for a point
function findNeighbourhood(lat, lng) {
  const point = [lng, lat];

  for (const n of neighbourhoods) {
    if (n.boundaries && n.boundaries.length > 0) {
      for (const boundary of n.boundaries) {
        if (boundary.rings) {
          for (const ring of boundary.rings) {
            if (pointInPolygon(point, ring)) {
              return n.id;
            }
          }
        }
      }
    }
  }
  return null;
}

// Extract ward number from ward string (e.g., "Ward 14" -> "14")
function extractWardNumber(wardStr) {
  if (!wardStr) return null;
  const match = wardStr.match(/Ward\s*(\d+)/i);
  return match ? match[1] : null;
}

function processDevelopmentData() {
  const csvDir = path.join(__dirname, '../src/data/csv');
  const inputFile = path.join(csvDir, 'development_applications_raw.csv');

  if (!fs.existsSync(inputFile)) {
    console.log('Development applications file not found. Run download-development-applications.js first.');
    return;
  }

  console.log('Processing development applications...\n');

  // Initialize stats
  const stats = {};
  neighbourhoods.forEach(n => {
    stats[n.id] = {
      total: 0,
      active: 0,
      approved: 0,
      byType: {},
      recent: 0, // Applications from 2023-2025
      population: n.population || 1,
      areaKm2: n.details?.areaKm2 || 1
    };
  });

  // Read and parse CSV
  const content = fs.readFileSync(inputFile, 'utf8');
  const lines = content.split('\n').slice(1); // Skip header

  let totalProcessed = 0;
  let geolocated = 0;
  let wardBased = 0;
  let unassigned = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split(',');
    if (parts.length < 11) continue;

    const appNumber = parts[0];
    const appDate = parts[1];
    const appType = parts[2];
    const status = parts[3];
    const statusDate = parts[4];
    const address = parts[5];
    const ward = parts[6];
    const lat = parseFloat(parts[7]);
    const lng = parseFloat(parts[8]);
    const isActive = parseInt(parts[9]) === 1;
    const isApproved = parseInt(parts[10]) === 1;

    totalProcessed++;

    // Check if recent (2023-2025)
    const year = appDate ? parseInt(appDate.substring(0, 4)) : 0;
    const isRecent = year >= 2023;

    // Try to find neighbourhood
    let neighbourhoodId = null;

    // Method 1: Use coordinates
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      neighbourhoodId = findNeighbourhood(lat, lng);
      if (neighbourhoodId) geolocated++;
    }

    // Method 2: Use ward mapping
    if (!neighbourhoodId && ward) {
      const wardNum = extractWardNumber(ward);
      const wardNeighbourhoods = WARD_NEIGHBOURHOOD_MAP[wardNum];
      if (wardNeighbourhoods && wardNeighbourhoods.length > 0) {
        // Distribute proportionally by population
        const totalWardPop = wardNeighbourhoods.reduce((sum, nId) => {
          return sum + (stats[nId]?.population || 0);
        }, 0);

        if (totalWardPop > 0) {
          for (const nId of wardNeighbourhoods) {
            if (stats[nId]) {
              const proportion = stats[nId].population / totalWardPop;
              stats[nId].total += proportion;
              if (isActive) stats[nId].active += proportion;
              if (isApproved) stats[nId].approved += proportion;
              if (isRecent) stats[nId].recent += proportion;
              stats[nId].byType[appType] = (stats[nId].byType[appType] || 0) + proportion;
            }
          }
          wardBased++;
          continue;
        }
      }
    }

    // Assign to neighbourhood
    if (neighbourhoodId && stats[neighbourhoodId]) {
      stats[neighbourhoodId].total++;
      if (isActive) stats[neighbourhoodId].active++;
      if (isApproved) stats[neighbourhoodId].approved++;
      if (isRecent) stats[neighbourhoodId].recent++;
      stats[neighbourhoodId].byType[appType] = (stats[neighbourhoodId].byType[appType] || 0) + 1;
    } else {
      unassigned++;
    }
  }

  console.log('Processing complete:');
  console.log(`  Total applications: ${totalProcessed}`);
  console.log(`  Geolocated: ${geolocated} (${(geolocated/totalProcessed*100).toFixed(1)}%)`);
  console.log(`  Ward-based: ${wardBased} (${(wardBased/totalProcessed*100).toFixed(1)}%)`);
  console.log(`  Unassigned: ${unassigned} (${(unassigned/totalProcessed*100).toFixed(1)}%)`);

  // Calculate development scores and rates
  const result = {};
  const recentRates = [];

  for (const [id, data] of Object.entries(stats)) {
    const total = Math.round(data.total);
    const active = Math.round(data.active);
    const approved = Math.round(data.approved);
    const recent = Math.round(data.recent);
    const population = data.population;
    const areaKm2 = data.areaKm2;

    // Development rate per 1000 residents (recent applications)
    const developmentRate = population > 0 ? (recent / population * 1000) : 0;

    if (recent > 0) {
      recentRates.push({ id, rate: developmentRate });
    }

    result[id] = {
      total,
      active,
      approved,
      recent,
      developmentRate: Math.round(developmentRate * 100) / 100,
      byType: {}
    };

    // Keep top types
    const sortedTypes = Object.entries(data.byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    for (const [type, count] of sortedTypes) {
      result[id].byType[type] = Math.round(count);
    }
  }

  // Calculate development activity score (0-100, higher = more development)
  recentRates.sort((a, b) => b.rate - a.rate); // Sort descending (most development first)
  const numWithData = recentRates.length;

  for (let i = 0; i < recentRates.length; i++) {
    const id = recentRates[i].id;
    const percentile = ((numWithData - i) / numWithData) * 100;
    result[id].developmentScore = Math.round(percentile);
  }

  // Neighbourhoods with no recent development get score of 0
  for (const [id, data] of Object.entries(result)) {
    if (data.recent === 0) {
      result[id].developmentScore = 0;
    }
  }

  // Save results
  const outputPath = path.join(csvDir, 'development_by_neighbourhood.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\nResults saved to ${outputPath}`);

  // Print top neighbourhoods by development activity
  console.log('\nTop 15 neighbourhoods by development activity (recent applications per 1,000 residents):');
  Object.entries(result)
    .filter(([id, d]) => d.recent > 0)
    .sort((a, b) => b[1].developmentRate - a[1].developmentRate)
    .slice(0, 15)
    .forEach(([id, d], i) => {
      const n = neighbourhoods.find(n => n.id === id);
      console.log(`  ${i+1}. ${n?.name || id}: ${d.developmentRate.toFixed(2)} per 1K (${d.recent} recent, ${d.active} active)`);
    });

  console.log('\nNeighbourhoods with MOST active development applications:');
  Object.entries(result)
    .filter(([id, d]) => d.active > 0)
    .sort((a, b) => b[1].active - a[1].active)
    .slice(0, 10)
    .forEach(([id, d], i) => {
      const n = neighbourhoods.find(n => n.id === id);
      console.log(`  ${i+1}. ${n?.name || id}: ${d.active} active applications`);
    });

  return result;
}

processDevelopmentData();
