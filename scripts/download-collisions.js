/**
 * Download Traffic Collision Data from Ottawa Open Data
 *
 * Data source: https://open.ottawa.ca/ (Traffic Collisions by Location 2017-2024, excluding 2023)
 * The City has not published 2023 collision records, so the scoring window is 2022 + 2024.
 *
 * Output: src/data/csv/collisions_raw.csv
 */

const fs = require('fs');
const path = require('path');
const { arcgisQueryAll, toCSV } = require('./lib/geo');

const LAYER_URL =
  'https://services.arcgis.com/G6F8XLCl5KtAlZ2G/arcgis/rest/services/' +
  'Traffic_Collisions_by_Location_2017-2024_(excluding_2023)/FeatureServer/0';
const OUTPUT_FILE = path.join(__dirname, '../src/data/csv/collisions_raw.csv');
const YEARS = [2022, 2024];

const HEADERS = [
  'LATITUDE', 'LONGITUDE', 'YEAR', 'DATE', 'CLASSIFICATION',
  'IMPACT_TYPE', 'ROAD_CONDITION', 'ENVIRONMENT', 'LIGHT',
  'PEDESTRIANS', 'BICYCLES', 'MOTORCYCLES',
  'INJURIES', 'FATAL', 'MAJOR', 'MINOR', 'MAX_INJURY',
];

const int = v => parseInt(v, 10) || 0;

function formatDate(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'number') {
    const d = new Date(v);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
  }
  return String(v);
}

async function main() {
  console.log('=== Downloading Ottawa Traffic Collision Data ===');
  const features = await arcgisQueryAll(
    LAYER_URL,
    {
      where: `Accident_Year IN (${YEARS.join(',')})`,
      outFields: 'Lat,Long,Accident_Year,Accident_Date,Classification_Of_Accident,Initial_Impact_Type,' +
        'Road_1_Surface_Condition,Environment_Condition,Light,num_of_pedestrians,num_of_bicycles,' +
        'num_of_motorcycles,num_of_injuries,num_of_fatal,num_of_major,num_of_minor,Max_injury',
      returnGeometry: 'false',
    },
    { orderBy: 'ObjectId' }
  );

  const rows = features
    .map(f => f.attributes)
    .filter(a => a.Lat && a.Long)
    .map(a => ({
      LATITUDE: a.Lat,
      LONGITUDE: a.Long,
      YEAR: a.Accident_Year,
      DATE: formatDate(a.Accident_Date),
      CLASSIFICATION: a.Classification_Of_Accident || '',
      IMPACT_TYPE: a.Initial_Impact_Type || '',
      ROAD_CONDITION: a.Road_1_Surface_Condition || '',
      ENVIRONMENT: a.Environment_Condition || '',
      LIGHT: a.Light || '',
      PEDESTRIANS: int(a.num_of_pedestrians),
      BICYCLES: int(a.num_of_bicycles),
      MOTORCYCLES: int(a.num_of_motorcycles),
      INJURIES: int(a.num_of_injuries),
      FATAL: int(a.num_of_fatal),
      MAJOR: int(a.num_of_major),
      MINOR: int(a.num_of_minor),
      MAX_INJURY: a.Max_injury || '',
    }));

  fs.writeFileSync(OUTPUT_FILE, toCSV(rows, HEADERS));
  console.log(`Wrote ${rows.length} collisions (of ${features.length}) to ${OUTPUT_FILE}`);

  const byYear = {};
  let ksi = 0;
  for (const r of rows) {
    byYear[r.YEAR] = (byYear[r.YEAR] || 0) + 1;
    if (r.FATAL > 0 || r.MAJOR > 0) ksi++;
  }
  console.log('By year:', byYear);
  console.log(`Fatal or major-injury collisions: ${ksi}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
