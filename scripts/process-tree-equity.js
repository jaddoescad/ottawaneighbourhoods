/**
 * Process Tree Equity Score data and map to neighbourhoods
 *
 * Uses centroid-based matching: for each census tract, find which
 * neighbourhood its centroid falls within, then aggregate scores
 * by neighbourhood using area-weighted averages.
 */

const fs = require('fs');
const path = require('path');

// Load tree equity data with geometry
const treeEquityPath = path.join(__dirname, '../src/data/csv/tree_equity_raw.json');
const treeEquityData = JSON.parse(fs.readFileSync(treeEquityPath, 'utf8'));

// Load neighbourhood data with boundaries
const dataPath = path.join(__dirname, '../src/data/processed/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const neighbourhoods = data.neighbourhoods;

// Calculate centroid of a polygon (already in WGS84)
function calculateCentroid(rings) {
  if (!rings || rings.length === 0) return null;

  // Use the first ring (outer boundary)
  const ring = rings[0];
  if (!ring || ring.length === 0) return null;

  let sumLng = 0, sumLat = 0;
  for (const point of ring) {
    sumLng += point[0];
    sumLat += point[1];
  }

  return {
    lng: sumLng / ring.length,
    lat: sumLat / ring.length
  };
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
function findNeighbourhood(lat, lng) {
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

// Calculate polygon area (approximate, for weighting)
function calculateArea(rings) {
  if (!rings || rings.length === 0) return 0;

  const ring = rings[0];
  let area = 0;

  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    area += ring[i][0] * ring[j][1];
    area -= ring[j][0] * ring[i][1];
  }

  return Math.abs(area / 2);
}

function processTreeEquity() {
  console.log('Processing Tree Equity Score data...\n');
  console.log(`Census tracts: ${treeEquityData.length}`);
  console.log(`Neighbourhoods: ${neighbourhoods.length}\n`);

  // Map census tracts to neighbourhoods
  const neighbourhoodStats = {};

  // Initialize stats for all neighbourhoods
  for (const n of neighbourhoods) {
    neighbourhoodStats[n.id] = {
      name: n.name,
      censusTractCount: 0,
      totalArea: 0,
      weightedCanopy: 0,
      weightedTES: 0,
      priorityAreas: 0,
      transects: new Set(),
      tracts: []
    };
  }

  let matched = 0;
  let unmatched = 0;

  for (const tract of treeEquityData) {
    if (!tract.geometry || !tract.geometry.rings) {
      unmatched++;
      continue;
    }

    // Calculate centroid (already in WGS84)
    const centroid = calculateCentroid(tract.geometry.rings);
    if (!centroid) {
      unmatched++;
      continue;
    }

    // Find neighbourhood
    const neighbourhoodId = findNeighbourhood(centroid.lat, centroid.lng);

    if (neighbourhoodId && neighbourhoodStats[neighbourhoodId]) {
      const area = calculateArea(tract.geometry.rings);

      neighbourhoodStats[neighbourhoodId].censusTractCount++;
      neighbourhoodStats[neighbourhoodId].totalArea += area;
      neighbourhoodStats[neighbourhoodId].weightedCanopy += tract.canopyCover * area;
      neighbourhoodStats[neighbourhoodId].weightedTES += tract.treeEquityScore * area;
      neighbourhoodStats[neighbourhoodId].transects.add(tract.transect);
      neighbourhoodStats[neighbourhoodId].tracts.push({
        name: tract.name,
        canopy: tract.canopyCover,
        tes: tract.treeEquityScore
      });

      if (tract.isPriorityArea) {
        neighbourhoodStats[neighbourhoodId].priorityAreas++;
      }

      matched++;
    } else {
      unmatched++;
    }
  }

  console.log(`Matched: ${matched} census tracts`);
  console.log(`Unmatched: ${unmatched} census tracts\n`);

  // Calculate final scores
  const results = {};

  for (const [id, stats] of Object.entries(neighbourhoodStats)) {
    if (stats.censusTractCount > 0 && stats.totalArea > 0) {
      results[id] = {
        name: stats.name,
        treeCanopy: Math.round(stats.weightedCanopy / stats.totalArea),
        treeEquityScore: Math.round(stats.weightedTES / stats.totalArea),
        censusTractCount: stats.censusTractCount,
        priorityAreas: stats.priorityAreas,
        transects: Array.from(stats.transects).join(', ')
      };
    } else {
      // No data for this neighbourhood
      results[id] = {
        name: stats.name,
        treeCanopy: null,
        treeEquityScore: null,
        censusTractCount: 0,
        priorityAreas: 0,
        transects: ''
      };
    }
  }

  // Save results
  const outputPath = path.join(__dirname, '../src/data/csv/tree_equity_by_neighbourhood.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Saved to ${outputPath}`);

  // Save as CSV
  const csvRows = ['id,name,treeCanopy,treeEquityScore,censusTractCount,priorityAreas,transects'];
  for (const [id, data] of Object.entries(results)) {
    csvRows.push(`"${id}","${data.name}",${data.treeCanopy ?? ''},${data.treeEquityScore ?? ''},${data.censusTractCount},${data.priorityAreas},"${data.transects}"`);
  }

  const csvPath = path.join(__dirname, '../src/data/csv/tree_equity_scores.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n'));
  console.log(`Saved CSV to ${csvPath}`);

  // Print summary
  const withData = Object.values(results).filter(r => r.treeCanopy !== null);
  console.log(`\n=== Results ===`);
  console.log(`Neighbourhoods with tree data: ${withData.length} / ${Object.keys(results).length}`);

  if (withData.length > 0) {
    const avgCanopy = withData.reduce((s, r) => s + r.treeCanopy, 0) / withData.length;
    const avgTES = withData.reduce((s, r) => s + r.treeEquityScore, 0) / withData.length;
    console.log(`Average canopy cover: ${avgCanopy.toFixed(1)}%`);
    console.log(`Average Tree Equity Score: ${avgTES.toFixed(1)}`);

    console.log('\nTop 10 by Tree Canopy Cover:');
    withData.sort((a, b) => b.treeCanopy - a.treeCanopy).slice(0, 10).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.name}: ${r.treeCanopy}% canopy, TES: ${r.treeEquityScore}`);
    });

    console.log('\nBottom 10 by Tree Canopy Cover:');
    withData.sort((a, b) => a.treeCanopy - b.treeCanopy).slice(0, 10).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.name}: ${r.treeCanopy}% canopy, TES: ${r.treeEquityScore}`);
    });
  }

  return results;
}

// Run
processTreeEquity();
