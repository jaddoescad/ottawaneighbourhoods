/**
 * Generate median income CSV from ONS-SQO 2021 Census data
 *
 * Uses official Statistics Canada 2021 Census data via ONS-SQO API
 * Income field: census_general_median_after_tax_income_of_households_in_2020
 *
 * For neighbourhoods spanning multiple ONS areas, calculates population-weighted average
 */

const fs = require('fs');
const path = require('path');

// Load neighbourhood mapping
const neighbourhoodMapping = require('./config/neighbourhood-mapping');

// Load ONS census data
const censusDataPath = path.join(__dirname, '../src/data/csv/ons_census_data.csv');
const censusDataRaw = fs.readFileSync(censusDataPath, 'utf8');
const lines = censusDataRaw.trim().split('\n');
const headers = lines[0].split(',');

// Find column indices
const onsIdIndex = headers.indexOf('ons_id');
const nameIndex = headers.indexOf('name');
const medianIncomeIndex = headers.indexOf('census_general_median_after_tax_income_of_households_in_2020');
const avgIncomeIndex = headers.indexOf('census_general_average_after_tax_income_of_households_in_2020');
const populationIndex = headers.indexOf('pop2021_total');
const householdCountIndex = headers.indexOf('household_count');

console.log('Column indices:');
console.log(`  ons_id: ${onsIdIndex}`);
console.log(`  name: ${nameIndex}`);
console.log(`  median_income: ${medianIncomeIndex}`);
console.log(`  population: ${populationIndex}`);
console.log(`  household_count: ${householdCountIndex}`);

// Parse census data into a map by ONS ID
const censusDataMap = {};
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(',');
  const onsId = cols[onsIdIndex];
  censusDataMap[onsId] = {
    name: cols[nameIndex],
    medianIncome: parseFloat(cols[medianIncomeIndex]) || null,
    avgIncome: parseFloat(cols[avgIncomeIndex]) || null,
    population: parseFloat(cols[populationIndex]) || 0,
    householdCount: parseFloat(cols[householdCountIndex]) || 0
  };
}

console.log(`\nLoaded ${Object.keys(censusDataMap).length} ONS areas from census data\n`);

// Generate income data for each neighbourhood
const results = [];

for (const [neighbourhoodId, config] of Object.entries(neighbourhoodMapping)) {
  const { name, onsSqoIds } = config;

  if (!onsSqoIds || onsSqoIds.length === 0) {
    console.warn(`No ONS-SQO IDs for ${name}`);
    continue;
  }

  // Collect data from all ONS areas for this neighbourhood
  let totalHouseholds = 0;
  let weightedIncomeSum = 0;
  let totalPopulation = 0;
  const onsAreas = [];

  for (const onsId of onsSqoIds) {
    const data = censusDataMap[onsId];
    if (!data) {
      console.warn(`  No census data for ONS ID ${onsId} (${name})`);
      continue;
    }

    if (data.medianIncome && data.householdCount) {
      weightedIncomeSum += data.medianIncome * data.householdCount;
      totalHouseholds += data.householdCount;
      totalPopulation += data.population;
      onsAreas.push(`${data.name} ($${data.medianIncome.toLocaleString()})`);
    }
  }

  if (totalHouseholds > 0) {
    // Calculate household-weighted average median income
    const weightedMedianIncome = Math.round(weightedIncomeSum / totalHouseholds);

    results.push({
      id: neighbourhoodId,
      name,
      medianIncome: weightedMedianIncome,
      households: Math.round(totalHouseholds),
      population: Math.round(totalPopulation),
      onsAreas: onsAreas.join('; ')
    });

    console.log(`${name}: $${weightedMedianIncome.toLocaleString()} (${onsAreas.length} areas, ${Math.round(totalHouseholds).toLocaleString()} households)`);
  } else {
    console.warn(`No income data available for ${name}`);
  }
}

// Sort by name for consistent output
results.sort((a, b) => a.name.localeCompare(b.name));

// Generate CSV
let csv = 'id,name,medianIncome,households,population,source,onsAreas\n';

for (const row of results) {
  // Escape any commas in the onsAreas field
  const onsAreasEscaped = `"${row.onsAreas}"`;
  csv += `${row.id},${row.name},${row.medianIncome},${row.households},${row.population},Statistics Canada 2021 Census (ONS-SQO),${onsAreasEscaped}\n`;
}

// Write CSV file
const outputPath = path.join(__dirname, '../src/data/csv/income_data.csv');
fs.writeFileSync(outputPath, csv);

console.log(`\n✓ Generated ${outputPath}`);
console.log(`  ${results.length} neighbourhoods with income data`);

// Also output a comparison with current neighbourhoods.csv
console.log('\n=== Comparison with current neighbourhoods.csv ===\n');

const neighbourhoodsCsvPath = path.join(__dirname, '../src/data/csv/neighbourhoods.csv');
const neighbourhoodsCsv = fs.readFileSync(neighbourhoodsCsvPath, 'utf8');
const neighbourhoodLines = neighbourhoodsCsv.trim().split('\n');
const neighbourhoodHeaders = neighbourhoodLines[0].split(',');
const medianIncomeColIndex = neighbourhoodHeaders.indexOf('medianIncome');

const currentIncomes = {};
for (let i = 1; i < neighbourhoodLines.length; i++) {
  const cols = neighbourhoodLines[i].split(',');
  const id = cols[0];
  const currentIncome = parseInt(cols[medianIncomeColIndex]) || 0;
  currentIncomes[id] = currentIncome;
}

console.log('Neighbourhood'.padEnd(25) + 'Current'.padStart(12) + 'Census 2021'.padStart(14) + 'Diff'.padStart(10));
console.log('-'.repeat(61));

for (const row of results) {
  const current = currentIncomes[row.id] || 0;
  const diff = row.medianIncome - current;
  const diffStr = diff > 0 ? `+$${diff.toLocaleString()}` : diff < 0 ? `-$${Math.abs(diff).toLocaleString()}` : '$0';
  console.log(
    row.name.padEnd(25) +
    `$${current.toLocaleString()}`.padStart(12) +
    `$${row.medianIncome.toLocaleString()}`.padStart(14) +
    diffStr.padStart(10)
  );
}
