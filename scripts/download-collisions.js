/**
 * Download Traffic Collision Data from Ottawa Open Data
 *
 * Data source: https://open.ottawa.ca/datasets/ottawa::traffic-collision-data
 * API: https://services.arcgis.com/G6F8XLCl5KtAlZ2G/arcgis/rest/services/Collisions/FeatureServer/0
 *
 * Fields:
 * - Lat, Long: Coordinates
 * - Accident_Year, Accident_Date: When
 * - Classification_Of_Accident: Fatal, Injury, Property Damage, etc.
 * - Initial_Impact_Type: Angle, Rear End, Sideswipe, etc.
 * - Road_1_Surface_Condition: Dry, Wet, Ice, Snow, etc.
 * - Environment_Condition_1: Clear, Rain, Snow, Fog, etc.
 * - Light: Daylight, Dark, Dawn, Dusk
 * - num_of_pedestrians, num_of_bicycles, num_of_motorcycles
 * - num_of_injuries, num_of_fatal, num_of_major, num_of_minor
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'https://services.arcgis.com/G6F8XLCl5KtAlZ2G/arcgis/rest/services/Collisions/FeatureServer/0/query';
const OUTPUT_FILE = path.join(__dirname, '../src/data/csv/collisions_raw.csv');

// Focus on recent years for relevance (2022-2024)
const MIN_YEAR = 2022;

async function fetchCollisions(offset = 0, limit = 2000) {
  const params = new URLSearchParams({
    where: `Accident_Year >= ${MIN_YEAR}`,
    outFields: 'Lat,Long,Accident_Year,Accident_Date,Classification_Of_Accident,Initial_Impact_Type,Road_1_Surface_Condition,Environment_Condition_1,Light,num_of_pedestrians,num_of_bicycles,num_of_motorcycles,num_of_injuries,num_of_fatal,num_of_major,num_of_minor',
    returnGeometry: false,
    resultOffset: offset,
    resultRecordCount: limit,
    f: 'json'
  });

  const response = await fetch(`${API_URL}?${params}`);
  const data = await response.json();
  return data.features || [];
}

async function downloadAllCollisions() {
  console.log('=== Downloading Ottawa Traffic Collision Data ===\n');
  console.log(`Fetching collisions from ${MIN_YEAR} onwards...`);

  let allCollisions = [];
  let offset = 0;
  const limit = 2000;

  while (true) {
    const features = await fetchCollisions(offset, limit);
    if (features.length === 0) break;

    allCollisions = allCollisions.concat(features);
    console.log(`  Fetched ${allCollisions.length} collisions...`);
    offset += limit;

    // Small delay to be nice to the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\nTotal collisions fetched: ${allCollisions.length}`);

  // Convert to CSV
  const headers = [
    'LATITUDE', 'LONGITUDE', 'YEAR', 'DATE', 'CLASSIFICATION',
    'IMPACT_TYPE', 'ROAD_CONDITION', 'ENVIRONMENT', 'LIGHT',
    'PEDESTRIANS', 'BICYCLES', 'MOTORCYCLES',
    'INJURIES', 'FATAL', 'MAJOR', 'MINOR'
  ];

  const rows = allCollisions.map(f => {
    const a = f.attributes;
    return [
      a.Lat || '',
      a.Long || '',
      a.Accident_Year || '',
      a.Accident_Date || '',
      a.Classification_Of_Accident || '',
      a.Initial_Impact_Type || '',
      a.Road_1_Surface_Condition || '',
      a.Environment_Condition_1 || '',
      a.Light || '',
      a.num_of_pedestrians || '0',
      a.num_of_bicycles || '0',
      a.num_of_motorcycles || '0',
      a.num_of_injuries || '0',
      a.num_of_fatal || '0',
      a.num_of_major || '0',
      a.num_of_minor || '0'
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  fs.writeFileSync(OUTPUT_FILE, csv);
  console.log(`\nWritten to: ${OUTPUT_FILE}`);

  // Print summary statistics
  const byYear = {};
  const byClassification = {};
  let totalFatal = 0;
  let totalPedestrian = 0;
  let totalBicycle = 0;

  allCollisions.forEach(f => {
    const a = f.attributes;
    byYear[a.Accident_Year] = (byYear[a.Accident_Year] || 0) + 1;
    byClassification[a.Classification_Of_Accident] = (byClassification[a.Classification_Of_Accident] || 0) + 1;
    totalFatal += parseInt(a.num_of_fatal) || 0;
    totalPedestrian += parseInt(a.num_of_pedestrians) || 0;
    totalBicycle += parseInt(a.num_of_bicycles) || 0;
  });

  console.log('\n=== Summary ===');
  console.log('\nCollisions by year:');
  Object.keys(byYear).sort().forEach(year => {
    console.log(`  ${year}: ${byYear[year]}`);
  });

  console.log('\nCollisions by classification:');
  Object.entries(byClassification)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cls, count]) => {
      console.log(`  ${cls}: ${count}`);
    });

  console.log(`\nTotal fatalities: ${totalFatal}`);
  console.log(`Collisions involving pedestrians: ${totalPedestrian}`);
  console.log(`Collisions involving bicycles: ${totalBicycle}`);
}

downloadAllCollisions().catch(console.error);
