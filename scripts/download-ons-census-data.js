/**
 * Download ONS Census Data from ons-sqo.ca API
 *
 * This script downloads 2021 Census data and other indicators from the
 * Ottawa Neighbourhood Study (ONS) API and saves it as CSV files.
 *
 * Data source: https://ons-sqo.ca/wp-json/ons/v1/get-data/
 *
 * Usage: node scripts/download-ons-census-data.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'csv');

// API endpoints
const ONS_API = {
  data: 'https://ons-sqo.ca/wp-json/ons/v1/get-data/data',
  neighbourhoods: 'https://ons-sqo.ca/wp-json/ons/v1/get-data/neighbourhoods',
};

// Key indicators we want to extract (subset of the 300+ available)
const KEY_INDICATORS = [
  // Population
  'pop2021_total',
  'household_count',
  'dwellings_priv_count',

  // Demographics
  'census_general_total_population',
  'census_general_percent_of_pop_that_are_children_age_0_14',
  'census_general_percent_of_of_pop_that_are_youth_age_15_24',
  'census_general_percent_of_pop_that_are_adults_age_25_64',
  'census_general_percent_of_pop_that_are_seniors_65',
  'census_general_average_age_of_the_population',
  'census_general_median_age_of_the_population',

  // Income
  'census_general_average_after_tax_income_in_2020_among_recipients',
  'census_general_median_after_tax_income_of_households_in_2020',
  'census_general_average_after_tax_income_of_households_in_2020',
  'census_general_unemployment_rate',
  'census_general_percent_of_people_in_low_income_based_on_lim_at',

  // Housing
  'census_general_percent_of_renter_households',
  'census_general_percent_of_owner_households',
  'census_general_average_monthly_shelter_costs_for_rented_dwellings',
  'census_general_median_monthly_shelter_costs_for_rented_dwellings',
  'census_general_average_monthly_shelter_costs_for_owned_dwellings',
  'census_general_median_value_of_owned_dwellings',
  'census_general_average_value_of_owned_dwellings',
  'census_general_percent_households_spending_30_percent_or_more_of_its_income_on_shelter_costs',
  'census_general_percent_of_households_living_in_core_housing_need',

  // Diversity
  'census_general_percent_of_pop_that_are_immigrants',
  'census_general_percent_of_pop_that_are_recent_immigrants_arr_2016_2021',
  'census_general_percent_of_pop_that_are_racialized',
  'census_general_percent_of_pop_that_are_indigenous',

  // Education
  'census_general_percent_of_pop_age_25_64_with_no_high_school_diploma_or_equivalent',
  'census_general_percent_of_pop_age_25_64_with_postsecondary_degree_diploma_certificate',
  'census_general_percent_of_people_aged_25_64_with_a_bachelors_degree_or_higher',

  // Commute
  'census_general_percent_of_workers_age_15_who_commute_by_car_truck_or_van',
  'census_general_percent_of_workers_age_15_who_commute_by_public_transit',
  'census_general_percent_of_workers_age_15_who_commute_by_walking',
  'census_general_percent_of_workers_age_15_who_commute_by_bicycle',
  'census_general_percent_of_workers_age_15_who_work_at_home',
  'census_general_percent_of_workers_who_commute_for_60_minutes_and_over',

  // Walk/Bike scores
  'walkscore_mean',
  'bikescore_mean',

  // Crime
  'crime_total',
  'crime_person_total',
  'crime_property_total',
  'crime_total_per_1000pop_plus_50m_buffer',

  // Amenities
  'food_supermarket_num_region',
  'food_supermarketgrocery_num_per_1000_res_plus_buffer',
  'food_restaurant_num_region',
  'libraries_num_region',
  'libraries_cardholders_percent',

  // Transit
  'transit_stops_num_per_region',
  'transit_stops_num_per_1000_res_plus_buffer',
  'transit_routes_avg_num_within_600m_walk',

  // Environment
  'percent_coverage_tree_canopy_2024',
  'percent_coverage_parkland_residential',

  // Healthcare
  'family_docs_num_per_1000',
  'average_distance_to_nearest_chc_km',

  // Socioeconomic
  'ses_rank_order',
  'ses_deciles',
  'ses_quintiles',

  // Housing Types
  'census_general_percent_of_single_detached_houses',
  'census_general_percent_of_apartments_in_a_building_five_or_more_storeys',
  'census_general_percent_of_row_houses',

  // Family
  'census_general_percent_of_census_families_that_are_one_parent_families',
  'census_general_percent_of_pop_living_alone',
  'census_general_average_household_size',
];

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

function escapeCSV(value) {
  if (value === null || value === undefined || value === 'NA') return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  console.log('=== Downloading ONS Census Data ===\n');

  // Fetch neighbourhoods metadata
  console.log('Fetching neighbourhood metadata...');
  const neighbourhoodsData = await fetchJSON(ONS_API.neighbourhoods);

  // Build neighbourhood lookup: internal ID -> {name, ons_id}
  const neighbourhoods = {};
  const columns = neighbourhoodsData.columns; // ['name', 'description', 'geometry', 'ONS_ID', 'name_fr']

  for (const row of neighbourhoodsData.rows) {
    const name = row[0];
    const onsId = row[3]; // This is their internal ID like 3001, 3002, etc.
    neighbourhoods[onsId] = { name, onsId };
  }
  console.log(`  Found ${Object.keys(neighbourhoods).length} neighbourhoods\n`);

  // Fetch main data
  console.log('Fetching census data (this may take a moment)...');
  const censusData = await fetchJSON(ONS_API.data);

  // The data structure:
  // - columns: ['id', '0', '3001', '3002', ...] - neighbourhood IDs
  // - rows: [['indicator_name', ottawa_value, hood1_value, hood2_value, ...], ...]

  const dataColumns = censusData.columns; // First is 'id', second is '0' (Ottawa total), rest are neighbourhood IDs
  const neighbourhoodIds = dataColumns.slice(2); // Skip 'id' and '0' (Ottawa total)

  // Build data lookup: indicator -> {neighbourhoodId: value}
  const dataByIndicator = {};
  for (const row of censusData.rows) {
    const indicator = row[0];
    dataByIndicator[indicator] = {};
    dataByIndicator[indicator]['ottawa'] = row[1]; // Ottawa total
    for (let i = 0; i < neighbourhoodIds.length; i++) {
      dataByIndicator[indicator][neighbourhoodIds[i]] = row[i + 2];
    }
  }
  console.log(`  Found ${censusData.rows.length} data indicators\n`);

  // Create CSV with all key indicators
  console.log('Creating ons_census_data.csv...');

  // Build header
  const csvHeader = ['ons_id', 'name', ...KEY_INDICATORS];
  const csvRows = [csvHeader.join(',')];

  // Build rows for each neighbourhood
  for (const onsId of neighbourhoodIds) {
    const hood = neighbourhoods[onsId];
    if (!hood) continue;

    const row = [
      escapeCSV(onsId),
      escapeCSV(hood.name),
    ];

    for (const indicator of KEY_INDICATORS) {
      const value = dataByIndicator[indicator]?.[onsId];
      row.push(escapeCSV(value));
    }

    csvRows.push(row.join(','));
  }

  // Write CSV
  const csvPath = path.join(OUTPUT_DIR, 'ons_census_data.csv');
  fs.writeFileSync(csvPath, csvRows.join('\n'));
  console.log(`  Written ${csvRows.length - 1} neighbourhoods to ${csvPath}\n`);

  // Print sample data for verification
  console.log('=== Sample Data (Findlay Creek - 3044) ===');
  const findlayCreek = '3044';
  console.log(`  Name: ${neighbourhoods[findlayCreek]?.name}`);
  console.log(`  Population 2021: ${dataByIndicator['pop2021_total']?.[findlayCreek]}`);
  console.log(`  Median Income: $${dataByIndicator['census_general_median_after_tax_income_of_households_in_2020']?.[findlayCreek]}`);
  console.log(`  % Children: ${dataByIndicator['census_general_percent_of_pop_that_are_children_age_0_14']?.[findlayCreek]}%`);
  console.log(`  % Seniors: ${dataByIndicator['census_general_percent_of_pop_that_are_seniors_65']?.[findlayCreek]}%`);
  console.log(`  Walk Score: ${dataByIndicator['walkscore_mean']?.[findlayCreek]}`);

  console.log('\n=== Sample Data (Westboro - 3116) ===');
  const westboro = '3116';
  console.log(`  Name: ${neighbourhoods[westboro]?.name}`);
  console.log(`  Population 2021: ${dataByIndicator['pop2021_total']?.[westboro]}`);
  console.log(`  Median Income: $${dataByIndicator['census_general_median_after_tax_income_of_households_in_2020']?.[westboro]}`);
  console.log(`  % Children: ${dataByIndicator['census_general_percent_of_pop_that_are_children_age_0_14']?.[westboro]}%`);
  console.log(`  % Seniors: ${dataByIndicator['census_general_percent_of_pop_that_are_seniors_65']?.[westboro]}%`);
  console.log(`  Walk Score: ${dataByIndicator['walkscore_mean']?.[westboro]}`);

  console.log('\n=== Done ===');
  console.log('Next steps:');
  console.log('1. Update scripts/config/neighbourhood-mapping.js with ONS internal IDs');
  console.log('2. Run: node scripts/process-data.js');
}

main().catch(console.error);
