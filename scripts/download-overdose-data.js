#!/usr/bin/env node
/**
 * Download Overdose Data from Ottawa Open Data (Ottawa Public Health)
 *
 * Fetches confirmed drug overdose ED visits by ONS neighbourhood from the
 * City of Ottawa ArcGIS API and saves to CSV format.
 *
 * Data Source: Ottawa Public Health (OPH) via Open Ottawa
 * API: https://services.arcgis.com/G6F8XLCl5KtAlZ2G/arcgis/rest/services/Confirmed_Drug_Overdose_ED_Visits_by_ONS_Neighbourhood_of_Patient_/FeatureServer/0
 *
 * Fields:
 * - ONS_neighbourhood_ID: ONS Gen 3 ID (3001-3117)
 * - ONS_neighbourhood_name: Neighbourhood name
 * - Cumulative_number_of_overdose_ED_visits_in_Ottawa_hospitals
 * - Yearly_average_of_overdose_ED_visits_in_Ottawa_hospitals
 * - Average_yearly_rate__per_100_000_population__of_overdose_ED_visits_in_Ottawa_hospitals
 * - Years: Date range (e.g., "2020-2024")
 *
 * Usage: node scripts/download-overdose-data.js
 */

const fs = require('fs');
const path = require('path');

const OVERDOSE_API = 'https://services.arcgis.com/G6F8XLCl5KtAlZ2G/arcgis/rest/services/Confirmed_Drug_Overdose_ED_Visits_by_ONS_Neighbourhood_of_Patient_/FeatureServer/0/query';

async function downloadOverdoseData() {
  console.log('Downloading Confirmed Drug Overdose ED Visits by ONS Neighbourhood...\n');
  console.log('Source: Ottawa Public Health (OPH) via Open Ottawa\n');

  const url = `${OVERDOSE_API}?where=1%3D1&outFields=*&f=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.error('No overdose data returned from API');
      return;
    }

    console.log(`Found ${data.features.length} neighbourhoods with overdose data\n`);

    // Convert to CSV
    const headers = [
      'ons_id',
      'ons_name',
      'cumulative_overdose_ed_visits',
      'yearly_avg_overdose_ed_visits',
      'yearly_rate_per_100k',
      'years'
    ];

    const rows = data.features.map(f => {
      const attrs = f.attributes;
      return [
        attrs.ONS_neighbourhood_ID || '',
        attrs.ONS_neighbourhood_name || '',
        attrs.Cumulative_number_of_overdose_ED_visits_in_Ottawa_hospitals ?? '',
        attrs.Yearly_average_of_overdose_ED_visits_in_Ottawa_hospitals ?? '',
        attrs.Average_yearly_rate__per_100_000_population__of_overdose_ED_visits_in_Ottawa_hospitals ?? '',
        attrs.Years || ''
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    // Write to file
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'csv', 'overdose_by_neighbourhood.csv');
    fs.writeFileSync(outputPath, csv);

    console.log(`Saved to: ${outputPath}\n`);

    // Show summary statistics
    const validRates = data.features
      .map(f => f.attributes.Average_yearly_rate__per_100_000_population__of_overdose_ED_visits_in_Ottawa_hospitals)
      .filter(r => r !== null && r !== undefined);

    const avgRate = validRates.reduce((a, b) => a + b, 0) / validRates.length;
    const maxRate = Math.max(...validRates);
    const minRate = Math.min(...validRates);

    console.log('Summary Statistics:');
    console.log(`  Total neighbourhoods: ${data.features.length}`);
    console.log(`  Neighbourhoods with rate data: ${validRates.length}`);
    console.log(`  Average yearly rate (per 100k): ${avgRate.toFixed(1)}`);
    console.log(`  Min rate: ${minRate.toFixed(1)}`);
    console.log(`  Max rate: ${maxRate.toFixed(1)}`);

    // Show top 10 by rate
    const sorted = data.features
      .filter(f => f.attributes.Average_yearly_rate__per_100_000_population__of_overdose_ED_visits_in_Ottawa_hospitals !== null)
      .sort((a, b) =>
        (b.attributes.Average_yearly_rate__per_100_000_population__of_overdose_ED_visits_in_Ottawa_hospitals || 0) -
        (a.attributes.Average_yearly_rate__per_100_000_population__of_overdose_ED_visits_in_Ottawa_hospitals || 0)
      );

    console.log('\nTop 10 neighbourhoods by overdose ED visit rate (per 100k):');
    sorted.slice(0, 10).forEach((f, i) => {
      const attrs = f.attributes;
      console.log(`  ${i + 1}. ${attrs.ONS_neighbourhood_name} (${attrs.ONS_neighbourhood_ID}): ${attrs.Average_yearly_rate__per_100_000_population__of_overdose_ED_visits_in_Ottawa_hospitals?.toFixed(1) || 'N/A'}`);
    });

    console.log('\nLowest 5 neighbourhoods by overdose ED visit rate (per 100k):');
    sorted.slice(-5).reverse().forEach((f, i) => {
      const attrs = f.attributes;
      console.log(`  ${i + 1}. ${attrs.ONS_neighbourhood_name} (${attrs.ONS_neighbourhood_ID}): ${attrs.Average_yearly_rate__per_100_000_population__of_overdose_ED_visits_in_Ottawa_hospitals?.toFixed(1) || 'N/A'}`);
    });

  } catch (error) {
    console.error('Error downloading overdose data:', error.message);
  }
}

downloadOverdoseData();
