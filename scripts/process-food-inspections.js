#!/usr/bin/env node
/**
 * Process Food Inspection Data and aggregate by neighbourhood
 *
 * Uses point-in-polygon matching to assign businesses to neighbourhoods,
 * then aggregates inspection scores and violations.
 *
 * Usage: node scripts/process-food-inspections.js
 *
 * Output:
 *   - src/data/csv/food_inspections_by_neighbourhood.json
 *   - src/data/csv/food_inspection_scores.csv
 */

const fs = require('fs');
const path = require('path');

const CSV_DIR = path.join(__dirname, '..', 'src', 'data', 'csv');
const DATA_PATH = path.join(__dirname, '..', 'src', 'data', 'processed', 'data.json');

// Parse CSV with quoted fields
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);

  return values;
}

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

// Find neighbourhood for a lat/lng point
function findNeighbourhood(lat, lng, neighbourhoods) {
  const point = [lng, lat]; // GeoJSON uses [lng, lat]

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

// Parse date from format like "20191125T15:17:17.3065280"
function parseDate(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})T/);
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  }
  return null;
}

function main() {
  console.log('=== Processing Food Inspection Data ===\n');

  // Load neighbourhood boundaries
  console.log('Loading neighbourhood boundaries...');
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const neighbourhoods = data.neighbourhoods;
  console.log(`  Loaded ${neighbourhoods.length} neighbourhoods\n`);

  // Load businesses
  console.log('Loading businesses...');
  const businessesPath = path.join(CSV_DIR, 'food_businesses.csv');
  const businesses = parseCSV(fs.readFileSync(businessesPath, 'utf8'));
  console.log(`  Loaded ${businesses.length.toLocaleString()} businesses`);

  // Load inspections
  console.log('Loading inspections...');
  const inspectionsPath = path.join(CSV_DIR, 'food_inspections.csv');
  const inspections = parseCSV(fs.readFileSync(inspectionsPath, 'utf8'));
  console.log(`  Loaded ${inspections.length.toLocaleString()} inspections`);

  // Load violations
  console.log('Loading violations...');
  const violationsPath = path.join(CSV_DIR, 'food_violations.csv');
  const violations = parseCSV(fs.readFileSync(violationsPath, 'utf8'));
  console.log(`  Loaded ${violations.length.toLocaleString()} violations\n`);

  // Create lookup maps
  const businessById = new Map();
  for (const b of businesses) {
    businessById.set(b.business_id, b);
  }

  // Create inspection lookup by business
  const inspectionsByBusiness = new Map();
  for (const insp of inspections) {
    if (!inspectionsByBusiness.has(insp.business_id)) {
      inspectionsByBusiness.set(insp.business_id, []);
    }
    inspectionsByBusiness.get(insp.business_id).push(insp);
  }

  // Create violation lookup by inspection
  const violationsByInspection = new Map();
  for (const v of violations) {
    if (!violationsByInspection.has(v.inspection_id)) {
      violationsByInspection.set(v.inspection_id, []);
    }
    violationsByInspection.get(v.inspection_id).push(v);
  }

  // Match businesses to neighbourhoods
  console.log('Matching businesses to neighbourhoods...');
  const businessNeighbourhood = new Map();
  let matched = 0;
  let unmatched = 0;

  for (const b of businesses) {
    const lat = parseFloat(b.latitude);
    const lng = parseFloat(b.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      unmatched++;
      continue;
    }

    const neighbourhoodId = findNeighbourhood(lat, lng, neighbourhoods);
    if (neighbourhoodId) {
      businessNeighbourhood.set(b.business_id, neighbourhoodId);
      matched++;
    } else {
      unmatched++;
    }
  }

  console.log(`  Matched: ${matched.toLocaleString()} businesses`);
  console.log(`  Unmatched: ${unmatched.toLocaleString()} businesses\n`);

  // Define date cutoffs (last 2 years for recent data)
  const now = new Date();
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

  // Aggregate by neighbourhood
  console.log('Aggregating inspection data by neighbourhood...');
  const neighbourhoodStats = {};

  // Initialize stats
  for (const n of neighbourhoods) {
    neighbourhoodStats[n.id] = {
      name: n.name,
      totalBusinesses: 0,
      totalInspections: 0,
      recentInspections: 0,
      totalViolations: 0,
      criticalViolations: 0,
      avgScore: null,
      scores: [],
      recentScores: [],
      perfectScores: 0,
      lowScores: 0 // Scores below 80
    };
  }

  // Process each business
  for (const [businessId, neighbourhoodId] of businessNeighbourhood) {
    const stats = neighbourhoodStats[neighbourhoodId];
    if (!stats) continue;

    stats.totalBusinesses++;

    // Get inspections for this business
    const businessInspections = inspectionsByBusiness.get(businessId) || [];

    for (const insp of businessInspections) {
      stats.totalInspections++;

      const score = parseInt(insp.score);
      if (!isNaN(score)) {
        stats.scores.push(score);

        if (score === 100) {
          stats.perfectScores++;
        } else if (score < 80) {
          stats.lowScores++;
        }
      }

      // Check if recent
      const inspDate = parseDate(insp.date);
      if (inspDate && inspDate >= twoYearsAgo) {
        stats.recentInspections++;
        if (!isNaN(score)) {
          stats.recentScores.push(score);
        }
      }

      // Count violations for this inspection
      const inspViolations = violationsByInspection.get(insp.inspection_id) || [];
      for (const v of inspViolations) {
        stats.totalViolations++;
        if (v.critical === 'true') {
          stats.criticalViolations++;
        }
      }
    }
  }

  // Calculate final metrics
  const results = {};

  for (const [id, stats] of Object.entries(neighbourhoodStats)) {
    const avgScore = stats.scores.length > 0
      ? stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length
      : null;

    const recentAvgScore = stats.recentScores.length > 0
      ? stats.recentScores.reduce((a, b) => a + b, 0) / stats.recentScores.length
      : null;

    const violationsPerInspection = stats.totalInspections > 0
      ? stats.totalViolations / stats.totalInspections
      : null;

    const criticalRate = stats.totalViolations > 0
      ? (stats.criticalViolations / stats.totalViolations) * 100
      : null;

    const perfectRate = stats.scores.length > 0
      ? (stats.perfectScores / stats.scores.length) * 100
      : null;

    const lowScoreRate = stats.scores.length > 0
      ? (stats.lowScores / stats.scores.length) * 100
      : null;

    results[id] = {
      name: stats.name,
      establishments: stats.totalBusinesses,
      totalInspections: stats.totalInspections,
      recentInspections: stats.recentInspections,
      avgScore: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
      recentAvgScore: recentAvgScore !== null ? Math.round(recentAvgScore * 10) / 10 : null,
      perfectScoreRate: perfectRate !== null ? Math.round(perfectRate * 10) / 10 : null,
      lowScoreRate: lowScoreRate !== null ? Math.round(lowScoreRate * 10) / 10 : null,
      totalViolations: stats.totalViolations,
      criticalViolations: stats.criticalViolations,
      violationsPerInspection: violationsPerInspection !== null ? Math.round(violationsPerInspection * 100) / 100 : null,
      criticalViolationRate: criticalRate !== null ? Math.round(criticalRate * 10) / 10 : null
    };
  }

  // Save JSON
  const jsonPath = path.join(CSV_DIR, 'food_inspections_by_neighbourhood.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\nSaved JSON to ${jsonPath}`);

  // Save CSV
  const csvHeaders = [
    'id', 'name', 'establishments', 'totalInspections', 'recentInspections',
    'avgScore', 'recentAvgScore', 'perfectScoreRate', 'lowScoreRate',
    'totalViolations', 'criticalViolations', 'violationsPerInspection', 'criticalViolationRate'
  ];

  const csvRows = [csvHeaders.join(',')];
  for (const [id, data] of Object.entries(results)) {
    const values = csvHeaders.map(h => {
      if (h === 'id') return `"${id}"`;
      if (h === 'name') return `"${data.name}"`;
      const val = data[h];
      return val !== null ? val : '';
    });
    csvRows.push(values.join(','));
  }

  const csvPath = path.join(CSV_DIR, 'food_inspection_scores.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n') + '\n');
  console.log(`Saved CSV to ${csvPath}`);

  // Print summary
  const withData = Object.values(results).filter(r => r.establishments > 0);
  console.log(`\n=== Summary ===`);
  console.log(`Neighbourhoods with food establishments: ${withData.length} / ${Object.keys(results).length}`);

  if (withData.length > 0) {
    const totalEstablishments = withData.reduce((s, r) => s + r.establishments, 0);
    const totalInspections = withData.reduce((s, r) => s + r.totalInspections, 0);
    const totalViolations = withData.reduce((s, r) => s + r.totalViolations, 0);

    console.log(`Total establishments: ${totalEstablishments.toLocaleString()}`);
    console.log(`Total inspections: ${totalInspections.toLocaleString()}`);
    console.log(`Total violations: ${totalViolations.toLocaleString()}`);

    const avgScores = withData.filter(r => r.avgScore !== null);
    if (avgScores.length > 0) {
      const cityAvg = avgScores.reduce((s, r) => s + r.avgScore, 0) / avgScores.length;
      console.log(`City-wide average score: ${cityAvg.toFixed(1)}`);
    }

    console.log('\n--- Top 10 by Average Score ---');
    withData.filter(r => r.avgScore !== null && r.totalInspections >= 10)
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10)
      .forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.name}: ${r.avgScore} avg (${r.establishments} establishments, ${r.totalInspections} inspections)`);
      });

    console.log('\n--- Bottom 10 by Average Score ---');
    withData.filter(r => r.avgScore !== null && r.totalInspections >= 10)
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 10)
      .forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.name}: ${r.avgScore} avg (${r.establishments} establishments, ${r.totalInspections} inspections)`);
      });

    console.log('\n--- Highest Violation Rates (per inspection) ---');
    withData.filter(r => r.violationsPerInspection !== null && r.totalInspections >= 10)
      .sort((a, b) => b.violationsPerInspection - a.violationsPerInspection)
      .slice(0, 10)
      .forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.name}: ${r.violationsPerInspection} violations/inspection (${r.criticalViolations} critical)`);
      });
  }
}

main();
