#!/usr/bin/env node
/**
 * Calculate Food Cost Burden for Ottawa Neighbourhoods
 *
 * Uses the 2025 Nutritious Food Basket (NFB) cost from Ottawa Public Health
 * combined with median household income to calculate what percentage of
 * income would be spent on food for a family of 4.
 *
 * NFB Source: https://www.ottawapublichealth.ca/en/public-health-topics/food-insecurity.aspx
 * 2025 NFB Cost: $1,180/month for family of 4 = $14,160/year
 *
 * Output:
 *   - src/data/csv/food_affordability.csv
 *
 * Run: node scripts/calculate-food-affordability.js
 */

const fs = require('fs');
const path = require('path');

// 2025 Nutritious Food Basket annual cost for a reference family of 4
// (2 adults + 2 children ages 8 and 14)
const NFB_ANNUAL_COST_FAMILY = 14160; // $1,180 × 12 months

// City of Ottawa median income (2021 Census) for reference
const OTTAWA_MEDIAN_INCOME = 98000;

// Thresholds for food cost as % of income (based on food security research)
// USDA considers >30% as food insecure
const THRESHOLDS = {
  LOW: 12,        // <12% = Low burden
  MODERATE: 16,   // 12-16% = Moderate burden
  HIGH: 20,       // 16-20% = High burden
  VERY_HIGH: 25,  // 20-25% = Very High burden
  // >25% = Severe burden
};

function getRating(pctOfIncome) {
  if (pctOfIncome < THRESHOLDS.LOW) return 'Low';
  if (pctOfIncome < THRESHOLDS.MODERATE) return 'Moderate';
  if (pctOfIncome < THRESHOLDS.HIGH) return 'High';
  if (pctOfIncome < THRESHOLDS.VERY_HIGH) return 'Very High';
  return 'Severe';
}

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Food Cost Burden Calculator');
  console.log('='.repeat(60));
  console.log(`\nUsing 2025 Nutritious Food Basket: $${NFB_ANNUAL_COST_FAMILY.toLocaleString()}/year (family of 4)`);
  console.log(`Ottawa median household income: $${OTTAWA_MEDIAN_INCOME.toLocaleString()}`);
  console.log(`Ottawa average food cost burden: ${((NFB_ANNUAL_COST_FAMILY / OTTAWA_MEDIAN_INCOME) * 100).toFixed(1)}% of income\n`);

  // Load neighbourhoods.csv (this has the correct IDs used by process-data.js)
  const neighbourhoodsPath = path.join(__dirname, '../src/data/csv/neighbourhoods.csv');
  const neighbourhoodsContent = fs.readFileSync(neighbourhoodsPath, 'utf-8');
  const neighbourhoods = parseCSV(neighbourhoodsContent);

  console.log(`Loaded ${neighbourhoods.length} neighbourhoods from neighbourhoods.csv\n`);

  // Calculate food cost burden for each neighbourhood
  const results = [];

  for (const row of neighbourhoods) {
    const id = row.id;
    const name = row.name;
    const medianIncome = parseInt(row.medianIncome) || 0;

    if (!id) {
      continue;
    }

    if (medianIncome === 0) {
      console.log(`  Skipping ${name || id}: no income data`);
      continue;
    }

    // Calculate food cost as percentage of income (this IS the burden)
    const foodCostBurden = (NFB_ANNUAL_COST_FAMILY / medianIncome) * 100;
    const rating = getRating(foodCostBurden);

    results.push({
      id,
      name,
      medianIncome,
      annualFoodCost: NFB_ANNUAL_COST_FAMILY,
      foodCostBurden: Math.round(foodCostBurden * 10) / 10,
      foodCostBurdenRating: rating,
    });
  }

  // Sort by burden (highest to lowest for easy review)
  results.sort((a, b) => b.foodCostBurden - a.foodCostBurden);

  // Generate CSV
  const csvHeaders = [
    'id',
    'name',
    'medianIncome',
    'annualFoodCost',
    'foodCostBurden',
    'foodCostBurdenRating'
  ];

  const csvRows = results.map(r => [
    r.id,
    `"${r.name}"`,
    r.medianIncome,
    r.annualFoodCost,
    r.foodCostBurden,
    r.foodCostBurdenRating
  ].join(','));

  const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

  const outputPath = path.join(__dirname, '../src/data/csv/food_affordability.csv');
  fs.writeFileSync(outputPath, csvContent);
  console.log(`\nWrote ${results.length} neighbourhoods to ${outputPath}`);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('FOOD COST BURDEN SUMMARY');
  console.log('='.repeat(60));

  const byRating = {};
  for (const r of results) {
    byRating[r.foodCostBurdenRating] = (byRating[r.foodCostBurdenRating] || 0) + 1;
  }

  console.log('\nDistribution by rating:');
  for (const rating of ['Low', 'Moderate', 'High', 'Very High', 'Severe']) {
    const count = byRating[rating] || 0;
    const pct = ((count / results.length) * 100).toFixed(0);
    console.log(`  ${rating.padEnd(10)}: ${count} (${pct}%)`);
  }

  // Show examples
  console.log('\n' + '-'.repeat(60));
  console.log('HIGHEST BURDEN (food insecurity risk):');
  console.log('-'.repeat(60));
  for (const r of results.slice(0, 5)) {
    console.log(`  ${r.name.padEnd(30)} ${r.foodCostBurden}% of income | $${r.medianIncome.toLocaleString()} | ${r.foodCostBurdenRating}`);
  }

  console.log('\n' + '-'.repeat(60));
  console.log('LOWEST BURDEN:');
  console.log('-'.repeat(60));
  for (const r of results.slice(-5).reverse()) {
    console.log(`  ${r.name.padEnd(30)} ${r.foodCostBurden}% of income | $${r.medianIncome.toLocaleString()} | ${r.foodCostBurdenRating}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Methodology:');
  console.log('  - Food Cost Burden = NFB Annual Cost / Median Household Income × 100');
  console.log('  - Higher % = greater burden on household budget');
  console.log('  - >25% considered severe (food insecurity risk)');
  console.log('='.repeat(60));
}

main().catch(console.error);
