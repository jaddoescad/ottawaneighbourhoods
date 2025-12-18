/**
 * Generate age demographics CSV from 2021 Census sub-area data
 * Data source: Statistics Canada, 2021 Census, via City of Ottawa Open Data
 */

const fs = require('fs');
const path = require('path');

// Raw census data by sub-area (from downloaded CSV)
// Source: https://open.ottawa.ca/datasets/ottawa::2021-long-form-census-sub-area
const censusData = {
  'Central Area': {
    total: 11260,
    '0-14': 490,
    '25-29': 1885, '30-34': 1455, '35-39': 1015, '40-44': 735,
    '65+': 1490
  },
  'Inner Area': {
    total: 82105,
    '0-14': 8115,
    '25-29': 10765, '30-34': 8025, '35-39': 5955, '40-44': 4805,
    '65+': 12440
  },
  'Ottawa East': {
    total: 52635,
    '0-14': 7485,
    '25-29': 4145, '30-34': 4125, '35-39': 3720, '40-44': 3300,
    '65+': 10270
  },
  'Beacon Hill': {
    total: 31090,
    '0-14': 4825,
    '25-29': 2035, '30-34': 1920, '35-39': 1950, '40-44': 1915,
    '65+': 6360
  },
  'Alta Vista': {
    total: 72410,
    '0-14': 11170,
    '25-29': 6230, '30-34': 5275, '35-39': 5015, '40-44': 4425,
    '65+': 13290
  },
  'Hunt Club': {
    total: 66175,
    '0-14': 11535,
    '25-29': 4865, '30-34': 4310, '35-39': 4280, '40-44': 3770,
    '65+': 10640
  },
  'Merivale': {
    total: 74335,
    '0-14': 11100,
    '25-29': 6785, '30-34': 5500, '35-39': 5170, '40-44': 3985,
    '65+': 13050
  },
  'Ottawa West': {
    total: 42630,
    '0-14': 6000,
    '25-29': 3470, '30-34': 3400, '35-39': 3200, '40-44': 3070,
    '65+': 8065
  },
  'Bayshore': {
    total: 37320,
    '0-14': 5545,
    '25-29': 3120, '30-34': 3015, '35-39': 2440, '40-44': 2070,
    '65+': 7705
  },
  'Cedarview': {
    total: 45235,
    '0-14': 6820,
    '25-29': 3355, '30-34': 3055, '35-39': 2860, '40-44': 2620,
    '65+': 8460
  },
  'Kanata-Stittsville': {
    total: 136015,
    '0-14': 26990,
    '25-29': 7360, '30-34': 8755, '35-39': 9880, '40-44': 9995,
    '65+': 19195
  },
  'South Nepean': {
    total: 99220,
    '0-14': 20440,
    '25-29': 5865, '30-34': 6395, '35-39': 7060, '40-44': 7555,
    '65+': 10280
  },
  'Riverside South': {
    total: 19090,
    '0-14': 4265,
    '25-29': 1090, '30-34': 1395, '35-39': 1545, '40-44': 1525,
    '65+': 1810
  },
  'Orleans': {
    total: 126135,
    '0-14': 23105,
    '25-29': 6990, '30-34': 7700, '35-39': 8675, '40-44': 8855,
    '65+': 19840
  },
  'Rural Northeast': {
    total: 11610,
    '0-14': 1755,
    '25-29': 465, '30-34': 525, '35-39': 635, '40-44': 680,
    '65+': 2260
  },
  'Rural Southeast': {
    total: 26765,
    '0-14': 4650,
    '25-29': 1225, '30-34': 1315, '35-39': 1550, '40-44': 1705,
    '65+': 4335
  },
  'Rural Southwest': {
    total: 27855,
    '0-14': 4945,
    '25-29': 960, '30-34': 1320, '35-39': 1555, '40-44': 1820,
    '65+': 5625
  },
  'Rural Northwest': {
    total: 24760,
    '0-14': 4115,
    '25-29': 955, '30-34': 1165, '35-39': 1370, '40-44': 1505,
    '65+': 4340
  }
};

// Map our neighbourhoods to census sub-areas
const neighbourhoodMapping = {
  'the-glebe': 'Inner Area',           // Glebe is in Inner Area
  'westboro': 'Ottawa West',           // Westboro is in Ottawa West
  'byward-market': 'Central Area',     // Downtown core
  'centretown': 'Central Area',        // Downtown core
  'old-ottawa-south': 'Inner Area',    // Near-downtown
  'hintonburg': 'Ottawa West',         // West End
  'little-italy': 'Inner Area',        // Near-downtown
  'kanata': 'Kanata-Stittsville',
  'stittsville': 'Kanata-Stittsville',
  'alta-vista': 'Alta Vista',
  'sandy-hill': 'Inner Area',          // Near-downtown
  'orleans': 'Orleans',
  'barrhaven': 'South Nepean',
  'bayshore': 'Bayshore',
  'bells-corners': 'Ottawa West',      // West End
  'carlington': 'Merivale',
  'hunt-club': 'Hunt Club',
  'riverside-south': 'Riverside South',
  'manotick': 'Rural Southeast',
  'vars': 'Rural Northeast',
  'carp': 'Rural Northwest',
  'constance-bay': 'Rural Northwest',
  'richmond': 'Rural Southwest',
  'metcalfe': 'Rural Southeast',
  'nepean': 'Cedarview',               // South Nepean/Merivale area
  'vanier': 'Ottawa East',
  'new-edinburgh': 'Ottawa East'
};

// Calculate percentages for each sub-area
function calculatePercentages(data) {
  const children = data['0-14'];
  const youngProfessionals = data['25-29'] + data['30-34'] + data['35-39'] + data['40-44'];
  const seniors = data['65+'];
  const total = data.total;

  return {
    pctChildren: Math.round((children / total) * 100 * 10) / 10,
    pctYoungProfessionals: Math.round((youngProfessionals / total) * 100 * 10) / 10,
    pctSeniors: Math.round((seniors / total) * 100 * 10) / 10
  };
}

// Generate CSV
const neighbourhoodNames = {
  'the-glebe': 'The Glebe',
  'westboro': 'Westboro',
  'byward-market': 'Byward Market',
  'centretown': 'Centretown',
  'old-ottawa-south': 'Old Ottawa South',
  'hintonburg': 'Hintonburg',
  'little-italy': 'Little Italy',
  'kanata': 'Kanata',
  'stittsville': 'Stittsville',
  'alta-vista': 'Alta Vista',
  'sandy-hill': 'Sandy Hill',
  'orleans': 'Orleans',
  'barrhaven': 'Barrhaven',
  'bayshore': 'Bayshore',
  'bells-corners': 'Bells Corners',
  'carlington': 'Carlington',
  'hunt-club': 'Hunt Club',
  'riverside-south': 'Riverside South',
  'manotick': 'Manotick',
  'vars': 'Vars-Navan',
  'carp': 'Carp',
  'constance-bay': 'Constance Bay',
  'richmond': 'Richmond',
  'metcalfe': 'Metcalfe-Osgoode',
  'nepean': 'Nepean',
  'vanier': 'Vanier',
  'new-edinburgh': 'New Edinburgh'
};

// Generate CSV content
let csv = 'id,name,pctChildren,pctYoungProfessionals,pctSeniors,censusSubArea,source\n';

for (const [neighbourhoodId, subArea] of Object.entries(neighbourhoodMapping)) {
  const data = censusData[subArea];
  if (!data) {
    console.error(`Missing data for sub-area: ${subArea}`);
    continue;
  }

  const percentages = calculatePercentages(data);
  const name = neighbourhoodNames[neighbourhoodId];

  csv += `${neighbourhoodId},${name},${percentages.pctChildren},${percentages.pctYoungProfessionals},${percentages.pctSeniors},${subArea},Statistics Canada 2021 Census\n`;
}

// Write to file
const outputPath = path.join(__dirname, '../src/data/csv/age_demographics.csv');
fs.writeFileSync(outputPath, csv);

console.log('Age demographics CSV generated successfully!');
console.log(`Output: ${outputPath}`);
console.log('\nSample data:');
console.log(csv);
