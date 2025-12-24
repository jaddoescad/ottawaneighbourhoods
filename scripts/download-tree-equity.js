/**
 * Download Tree Equity Score 2025 data from City of Ottawa Open Data
 *
 * Downloads census tract level tree equity data from 4 transects:
 * - Downtown Core
 * - Inner Urban
 * - Outer Urban
 * - Suburban
 *
 * Data includes:
 * - CANCVR_R: Canopy cover percentage
 * - CANGOAL: Goal canopy cover
 * - TES_R: Tree Equity Score (0-100, higher = better)
 * - PA_EN: Priority Area (Yes/No)
 * - Polygon geometry for spatial matching
 */

const fs = require('fs');
const path = require('path');

const TRANSECTS = [
  {
    name: 'Downtown Core',
    url: 'https://services.arcgis.com/G6F8XLCl5KtAlZ2G/arcgis/rest/services/Tree_Equity_Score_2025_Downtown_Core/FeatureServer/0'
  },
  {
    name: 'Inner Urban',
    url: 'https://services.arcgis.com/G6F8XLCl5KtAlZ2G/arcgis/rest/services/Tree_Equity_Score_2025___Inner_Urban/FeatureServer/0'
  },
  {
    name: 'Outer Urban',
    url: 'https://services.arcgis.com/G6F8XLCl5KtAlZ2G/arcgis/rest/services/Tree_Equity_Score_2025___Outer_Urban/FeatureServer/0'
  },
  {
    name: 'Suburban',
    url: 'https://services.arcgis.com/G6F8XLCl5KtAlZ2G/arcgis/rest/services/Tree_Equity_Score_2025___Suburban/FeatureServer/0'
  }
];

async function fetchAllFeatures(baseUrl) {
  const features = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const url = `${baseUrl}/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&resultOffset=${offset}&resultRecordCount=${batchSize}&f=json`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      break;
    }

    features.push(...data.features);

    if (data.features.length < batchSize) {
      break;
    }

    offset += batchSize;
  }

  return features;
}

async function downloadTreeEquityData() {
  console.log('Downloading Tree Equity Score 2025 data...\n');

  const allFeatures = [];

  for (const transect of TRANSECTS) {
    console.log(`Fetching ${transect.name}...`);

    try {
      const features = await fetchAllFeatures(transect.url);
      console.log(`  Found ${features.length} census tracts`);

      // Add transect info and transform features
      for (const feature of features) {
        allFeatures.push({
          ctuid: feature.attributes.CTUID,
          ctnum: feature.attributes.CTNUM,
          name: feature.attributes.CTNAME_EN,
          transect: transect.name,
          canopyCover: feature.attributes.CANCVR_R,
          canopyGoal: feature.attributes.CANGOAL,
          canopyGap: feature.attributes.CANGAP,
          gapScore: feature.attributes.GAPSCORE,
          priorityIndex: feature.attributes.E,
          treeEquityScore: feature.attributes.TES_R,
          isPriorityArea: feature.attributes.PA_EN === 'Yes',
          geometry: feature.geometry
        });
      }
    } catch (error) {
      console.error(`  Error fetching ${transect.name}:`, error.message);
    }
  }

  console.log(`\nTotal census tracts: ${allFeatures.length}`);

  // Save raw data with geometry (for spatial processing)
  const outputPath = path.join(__dirname, '../src/data/csv/tree_equity_raw.json');
  fs.writeFileSync(outputPath, JSON.stringify(allFeatures, null, 2));
  console.log(`\nSaved to ${outputPath}`);

  // Also save a CSV summary (without geometry)
  const csvRows = ['ctuid,name,transect,canopyCover,canopyGoal,treeEquityScore,isPriorityArea'];
  for (const f of allFeatures) {
    csvRows.push(`"${f.ctuid}","${f.name}","${f.transect}",${f.canopyCover},${f.canopyGoal},${f.treeEquityScore},${f.isPriorityArea}`);
  }

  const csvPath = path.join(__dirname, '../src/data/csv/tree_equity_raw.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n'));
  console.log(`Saved CSV summary to ${csvPath}`);

  // Print summary stats
  console.log('\n=== Summary by Transect ===');
  const transectStats = {};
  for (const f of allFeatures) {
    if (!transectStats[f.transect]) {
      transectStats[f.transect] = { count: 0, totalCanopy: 0, totalTES: 0, priorityAreas: 0 };
    }
    transectStats[f.transect].count++;
    transectStats[f.transect].totalCanopy += f.canopyCover;
    transectStats[f.transect].totalTES += f.treeEquityScore;
    if (f.isPriorityArea) transectStats[f.transect].priorityAreas++;
  }

  for (const [transect, stats] of Object.entries(transectStats)) {
    console.log(`\n${transect}:`);
    console.log(`  Census tracts: ${stats.count}`);
    console.log(`  Avg canopy cover: ${(stats.totalCanopy / stats.count).toFixed(1)}%`);
    console.log(`  Avg Tree Equity Score: ${(stats.totalTES / stats.count).toFixed(1)}`);
    console.log(`  Priority areas: ${stats.priorityAreas}`);
  }

  return allFeatures;
}

// Run
downloadTreeEquityData().catch(console.error);
