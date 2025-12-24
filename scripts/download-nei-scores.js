#!/usr/bin/env node
/**
 * Download Neighbourhood Equity Index (NEI) 2019 Data
 *
 * Fetches NEI scores from Ottawa Open Data (census tract level),
 * performs spatial join to ONS neighbourhoods, and outputs aggregated scores.
 *
 * Data source: https://maps.ottawa.ca/arcgis/rest/services/Planning/MapServer/109
 *
 * The NEI uses census tracts (165 areas), but we need ONS neighbourhoods (116 areas).
 * This script calculates centroids of census tracts and assigns them to ONS neighbourhoods
 * using point-in-polygon, then calculates area-weighted average scores.
 *
 * Usage: node scripts/download-nei-scores.js
 */

const fs = require('fs');
const path = require('path');
const neighbourhoodMapping = require('./config/neighbourhood-mapping.js');

// NEI 2019 Layer
const NEI_API = 'https://maps.ottawa.ca/arcgis/rest/services/Planning/MapServer/109/query';

// Gen 3 (2024) ONS boundaries
const NEIGHBOURHOODS_API = 'https://maps.ottawa.ca/arcgis/rest/services/Neighbourhoods/MapServer/2/query';

// ============================================================================
// Geometry Helpers
// ============================================================================

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

function pointInPolygonWithHoles(point, rings) {
  if (!rings || rings.length === 0) return false;

  // First ring is outer boundary
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

// Calculate centroid of a polygon (first ring only)
function calculateCentroid(rings) {
  if (!rings || rings.length === 0 || rings[0].length === 0) return null;

  const ring = rings[0];
  let sumX = 0, sumY = 0;
  for (const [x, y] of ring) {
    sumX += x;
    sumY += y;
  }
  return {
    lng: sumX / ring.length,
    lat: sumY / ring.length,
  };
}

// Calculate approximate area in sq km
const EARTH_RADIUS_M = 6371000;

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

function ringAreaMetersSquared(ring) {
  if (!ring || ring.length < 3) return 0;

  const avgLat = ring.reduce((sum, [, lat]) => sum + lat, 0) / ring.length;
  const lat0Rad = degreesToRadians(avgLat);
  const cosLat0 = Math.cos(lat0Rad);

  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[(i + 1) % ring.length];

    const x1 = EARTH_RADIUS_M * degreesToRadians(lng1) * cosLat0;
    const y1 = EARTH_RADIUS_M * degreesToRadians(lat1);
    const x2 = EARTH_RADIUS_M * degreesToRadians(lng2) * cosLat0;
    const y2 = EARTH_RADIUS_M * degreesToRadians(lat2);

    area += (x1 * y2 - x2 * y1);
  }

  return Math.abs(area / 2);
}

function polygonAreaSqKm(rings) {
  if (!rings || rings.length === 0) return 0;

  let area = ringAreaMetersSquared(rings[0]);
  for (let i = 1; i < rings.length; i++) {
    area -= ringAreaMetersSquared(rings[i]);
  }

  return Math.max(0, area) / 1000000; // Convert to sq km
}

// ============================================================================
// API Fetching
// ============================================================================

async function fetchAllFeatures(baseUrl, fields = '*') {
  const allFeatures = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const url = `${baseUrl}?where=1%3D1&outFields=${fields}&returnGeometry=true&outSR=4326&f=json&resultOffset=${offset}&resultRecordCount=${batchSize}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.features || data.features.length === 0) break;

    allFeatures.push(...data.features);
    console.log(`  Fetched ${allFeatures.length} features...`);

    if (data.features.length < batchSize) break;
    offset += batchSize;
  }

  return allFeatures;
}

// ============================================================================
// Main Processing
// ============================================================================

async function downloadNEIScores() {
  console.log('='.repeat(60));
  console.log('Downloading Neighbourhood Equity Index (NEI) 2019 Data');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Fetch NEI data (census tracts)
  console.log('Step 1: Fetching NEI census tract data...');
  const neiFeatures = await fetchAllFeatures(
    NEI_API,
    'CTID,CTNAME,SCORENEI,R_NEI,Y_NEI,LG_NEI,G_NEI,URB_RURAL'
  );
  console.log(`  Found ${neiFeatures.length} census tracts with NEI scores\n`);

  // Step 2: Fetch ONS neighbourhood boundaries
  console.log('Step 2: Fetching ONS neighbourhood boundaries (Gen 3)...');
  const onsFeatures = await fetchAllFeatures(NEIGHBOURHOODS_API, 'ONS_ID,NAME');
  console.log(`  Found ${onsFeatures.length} ONS neighbourhoods\n`);

  // Build ONS lookup by ID
  const onsBoundaries = {};
  for (const feature of onsFeatures) {
    const onsId = String(feature.attributes.ONS_ID);
    onsBoundaries[onsId] = {
      name: feature.attributes.NAME,
      rings: feature.geometry?.rings || [],
    };
  }

  // Step 3: Map our neighbourhood IDs to ONS IDs
  const ourNeighbourhoods = {};
  for (const [id, config] of Object.entries(neighbourhoodMapping)) {
    const onsSqoIds = config.onsSqoIds || [];
    ourNeighbourhoods[id] = {
      name: config.name,
      onsSqoIds,
      boundaries: onsSqoIds.map(onsId => onsBoundaries[onsId]).filter(Boolean),
    };
  }

  // Step 4: For each census tract, find which neighbourhood it belongs to
  console.log('Step 3: Matching census tracts to neighbourhoods...');

  const neighbourhoodScores = {}; // { neighbourhoodId: { totalScore, totalArea, count, tracts: [] } }
  let matchedCount = 0;
  let unmatchedCount = 0;
  const unmatchedTracts = [];

  for (const neiFeature of neiFeatures) {
    const attrs = neiFeature.attributes;
    const score = attrs.SCORENEI;
    const ctName = attrs.CTNAME || 'Unknown';

    // Skip if no score or no geometry
    if (score === null || score === undefined || !neiFeature.geometry?.rings) {
      continue;
    }

    // Calculate centroid of census tract
    const centroid = calculateCentroid(neiFeature.geometry.rings);
    if (!centroid) continue;

    // Calculate area of census tract for weighting
    const areaSqKm = polygonAreaSqKm(neiFeature.geometry.rings);

    // Find which neighbourhood contains this centroid
    let matchedNeighbourhood = null;

    for (const [neighbourhoodId, config] of Object.entries(ourNeighbourhoods)) {
      for (const boundary of config.boundaries) {
        if (boundary.rings && pointInPolygonWithHoles([centroid.lng, centroid.lat], boundary.rings)) {
          matchedNeighbourhood = neighbourhoodId;
          break;
        }
      }
      if (matchedNeighbourhood) break;
    }

    if (matchedNeighbourhood) {
      if (!neighbourhoodScores[matchedNeighbourhood]) {
        neighbourhoodScores[matchedNeighbourhood] = {
          totalWeightedScore: 0,
          totalArea: 0,
          count: 0,
          redIndicators: 0,
          yellowIndicators: 0,
          lightGreenIndicators: 0,
          greenIndicators: 0,
          tracts: [],
        };
      }

      const ns = neighbourhoodScores[matchedNeighbourhood];
      ns.totalWeightedScore += score * areaSqKm;
      ns.totalArea += areaSqKm;
      ns.count += 1;
      ns.redIndicators += attrs.R_NEI || 0;
      ns.yellowIndicators += attrs.Y_NEI || 0;
      ns.lightGreenIndicators += attrs.LG_NEI || 0;
      ns.greenIndicators += attrs.G_NEI || 0;
      ns.tracts.push({ name: ctName, score, areaSqKm: areaSqKm.toFixed(2) });

      matchedCount++;
    } else {
      unmatchedCount++;
      unmatchedTracts.push(ctName);
    }
  }

  console.log(`  Matched: ${matchedCount} census tracts`);
  console.log(`  Unmatched: ${unmatchedCount} census tracts (Greenbelt, rural areas)\n`);

  // Step 5: Calculate final scores and generate CSV
  console.log('Step 4: Calculating neighbourhood scores...');

  const results = [];
  for (const [neighbourhoodId, config] of Object.entries(ourNeighbourhoods)) {
    const ns = neighbourhoodScores[neighbourhoodId];

    if (ns && ns.count > 0) {
      // Area-weighted average
      const avgScore = ns.totalWeightedScore / ns.totalArea;

      results.push({
        id: neighbourhoodId,
        name: config.name,
        neiScore: Math.round(avgScore * 10) / 10,
        censusTracts: ns.count,
        redIndicators: ns.redIndicators,
        yellowIndicators: ns.yellowIndicators,
        lightGreenIndicators: ns.lightGreenIndicators,
        greenIndicators: ns.greenIndicators,
      });
    } else {
      // No data for this neighbourhood
      results.push({
        id: neighbourhoodId,
        name: config.name,
        neiScore: null,
        censusTracts: 0,
        redIndicators: 0,
        yellowIndicators: 0,
        lightGreenIndicators: 0,
        greenIndicators: 0,
      });
    }
  }

  // Sort by score (highest first)
  results.sort((a, b) => {
    if (a.neiScore === null) return 1;
    if (b.neiScore === null) return -1;
    return b.neiScore - a.neiScore;
  });

  // Generate CSV
  const headers = ['id', 'name', 'neiScore', 'censusTracts', 'redIndicators', 'yellowIndicators', 'lightGreenIndicators', 'greenIndicators'];
  const csvRows = results.map(r => [
    r.id,
    `"${r.name}"`,
    r.neiScore !== null ? r.neiScore : '',
    r.censusTracts,
    r.redIndicators,
    r.yellowIndicators,
    r.lightGreenIndicators,
    r.greenIndicators,
  ].join(','));

  const csv = [headers.join(','), ...csvRows].join('\n');

  const outputPath = path.join(__dirname, '..', 'src', 'data', 'csv', 'nei_scores.csv');
  fs.writeFileSync(outputPath, csv);

  console.log(`  Saved to: ${outputPath}\n`);

  // Print summary
  console.log('='.repeat(60));
  console.log('NEI Score Summary (Higher = Better Equity)');
  console.log('='.repeat(60));
  console.log();

  const withScores = results.filter(r => r.neiScore !== null);
  const scores = withScores.map(r => r.neiScore);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  console.log(`Neighbourhoods with data: ${withScores.length}`);
  console.log(`Neighbourhoods without data: ${results.length - withScores.length}`);
  console.log(`Score range: ${minScore} - ${maxScore}`);
  console.log(`Average score: ${avgScore.toFixed(1)}`);
  console.log();

  console.log('Top 10 Highest Equity:');
  withScores.slice(0, 10).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name}: ${r.neiScore}`);
  });

  console.log();
  console.log('Top 10 Lowest Equity (most vulnerable):');
  withScores.slice(-10).reverse().forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name}: ${r.neiScore}`);
  });

  console.log();
  console.log('Done! Run `node scripts/process-data.js` to include in data.json');
}

downloadNEIScores().catch(console.error);
