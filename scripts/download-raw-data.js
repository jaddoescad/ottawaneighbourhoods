#!/usr/bin/env node
/**
 * Download Raw Data Script
 *
 * Downloads fresh data from Ottawa Open Data APIs and saves to CSV files.
 * Run this to get the latest parks and schools data.
 *
 * Usage: node scripts/download-raw-data.js
 *
 * Output files:
 *   - src/data/csv/parks_raw.csv
 *   - src/data/csv/schools_raw.csv
 *   - src/data/csv/ons_neighbourhoods.csv
 *   - src/data/csv/transit_stations_raw.csv
 *   - src/data/csv/crime_raw.csv
 */

const fs = require('fs');
const path = require('path');

const PARKS_API = 'https://maps.ottawa.ca/arcgis/rest/services/Parks_Inventory/MapServer/24/query';
const SCHOOLS_API = 'https://maps.ottawa.ca/arcgis/rest/services/Schools/MapServer/0/query';
const NEIGHBOURHOODS_API = 'https://maps.ottawa.ca/arcgis/rest/services/Neighbourhoods/MapServer/0/query';
const TRANSIT_STATIONS_API = 'https://maps.ottawa.ca/arcgis/rest/services/TransitServices/MapServer/0/query';
const OTRAIN_STATIONS_API = 'https://maps.ottawa.ca/arcgis/rest/services/TransitServices/MapServer/1/query';
const CRIME_API = 'https://services7.arcgis.com/2vhcNzw0NfUwAD3d/ArcGIS/rest/services/Criminal_Offences_Open_Data/FeatureServer/0/query';

function toCSV(rows, headers) {
  let csv = headers.join(',') + '\n';
  for (const row of rows) {
    const values = headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    });
    csv += values.join(',') + '\n';
  }
  return csv;
}

async function downloadParks() {
  console.log('Downloading parks...');
  const allParks = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const url = `${PARKS_API}?where=1%3D1&outFields=*&f=json&resultOffset=${offset}&resultRecordCount=${batchSize}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.features || data.features.length === 0) break;

    for (const feature of data.features) {
      allParks.push(feature.attributes);
    }

    console.log(`  Fetched ${allParks.length} parks...`);
    offset += batchSize;
    if (data.features.length < batchSize) break;
  }

  return allParks;
}

async function downloadSchools() {
  console.log('Downloading schools...');
  const allSchools = [];
  let offset = 0;
  const batchSize = 500;

  while (true) {
    const url = `${SCHOOLS_API}?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json&resultOffset=${offset}&resultRecordCount=${batchSize}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.features || data.features.length === 0) break;

    for (const feature of data.features) {
      const attrs = { ...feature.attributes };
      if (feature.geometry) {
        attrs.LONGITUDE = feature.geometry.x;
        attrs.LATITUDE = feature.geometry.y;
      }
      allSchools.push(attrs);
    }

    console.log(`  Fetched ${allSchools.length} schools...`);
    offset += batchSize;
    if (data.features.length < batchSize) break;
  }

  return allSchools;
}

async function downloadNeighbourhoods() {
  console.log('Downloading neighbourhood boundaries...');
  const url = `${NEIGHBOURHOODS_API}?where=1%3D1&outFields=ONS_ID,NAME,NAME_FR&returnGeometry=false&f=json`;
  const response = await fetch(url);
  const data = await response.json();
  return data.features.map(f => f.attributes);
}

async function downloadTransitStations() {
  console.log('Downloading transit stations (Transitway + LRT)...');
  const url = `${TRANSIT_STATIONS_API}?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json`;
  const response = await fetch(url);
  const data = await response.json();

  const stations = [];
  for (const feature of data.features) {
    const attrs = { ...feature.attributes };
    if (feature.geometry) {
      attrs.LONGITUDE = feature.geometry.x;
      attrs.LATITUDE = feature.geometry.y;
    }
    attrs.TYPE = 'Transitway';
    stations.push(attrs);
  }

  console.log(`  Fetched ${stations.length} transitway stations`);
  return stations;
}

async function downloadOTrainStations() {
  console.log('Downloading O-Train Line 2 stations...');
  const url = `${OTRAIN_STATIONS_API}?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json`;
  const response = await fetch(url);
  const data = await response.json();

  const stations = [];
  for (const feature of data.features) {
    stations.push({
      NAME: feature.attributes.STATIONNAME,
      TYPE: 'O-Train Line 2',
      LONGITUDE: feature.geometry ? feature.geometry.x : null,
      LATITUDE: feature.geometry ? feature.geometry.y : null,
    });
  }

  console.log(`  Fetched ${stations.length} O-Train stations`);
  return stations;
}

async function downloadCrimeData() {
  console.log('Downloading crime data (2023-2024) with coordinates...');
  const allCrimes = [];
  let offset = 0;
  const batchSize = 2000;

  // Only get last 2 full years of data (2023-2024)
  const startYear = 2023;

  while (true) {
    const url = `${CRIME_API}?where=YEAR>=${startYear}&outFields=YEAR,OFF_CATEG,NB_NAME_EN,WARD&returnGeometry=true&outSR=4326&f=json&resultOffset=${offset}&resultRecordCount=${batchSize}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.features || data.features.length === 0) break;

    for (const feature of data.features) {
      const attrs = { ...feature.attributes };
      if (feature.geometry) {
        attrs.LONGITUDE = feature.geometry.x;
        attrs.LATITUDE = feature.geometry.y;
      }
      allCrimes.push(attrs);
    }

    console.log(`  Fetched ${allCrimes.length} crimes...`);
    offset += batchSize;
    if (data.features.length < batchSize) break;
  }

  return allCrimes;
}

async function main() {
  console.log('=== Downloading Raw Data from Ottawa Open Data ===\n');

  const csvDir = path.join(__dirname, '..', 'src', 'data', 'csv');

  // Download parks
  const parks = await downloadParks();
  const parkHeaders = Object.keys(parks[0] || {});
  fs.writeFileSync(path.join(csvDir, 'parks_raw.csv'), toCSV(parks, parkHeaders));
  console.log(`Saved ${parks.length} parks to parks_raw.csv\n`);

  // Download schools
  const schools = await downloadSchools();
  const schoolHeaders = Object.keys(schools[0] || {});
  fs.writeFileSync(path.join(csvDir, 'schools_raw.csv'), toCSV(schools, schoolHeaders));
  console.log(`Saved ${schools.length} schools to schools_raw.csv\n`);

  // Download neighbourhoods
  const neighbourhoods = await downloadNeighbourhoods();
  fs.writeFileSync(
    path.join(csvDir, 'ons_neighbourhoods.csv'),
    toCSV(neighbourhoods, ['ONS_ID', 'NAME', 'NAME_FR'])
  );
  console.log(`Saved ${neighbourhoods.length} neighbourhoods to ons_neighbourhoods.csv\n`);

  // Download transit stations
  const transitStations = await downloadTransitStations();
  const otrainStations = await downloadOTrainStations();
  const allTransit = [...transitStations, ...otrainStations];
  fs.writeFileSync(
    path.join(csvDir, 'transit_stations_raw.csv'),
    toCSV(allTransit, ['NAME', 'TYPE', 'LATITUDE', 'LONGITUDE'])
  );
  console.log(`Saved ${allTransit.length} transit stations to transit_stations_raw.csv\n`);

  // Download crime data
  const crimes = await downloadCrimeData();
  fs.writeFileSync(
    path.join(csvDir, 'crime_raw.csv'),
    toCSV(crimes, ['YEAR', 'OFF_CATEG', 'NB_NAME_EN', 'WARD', 'LATITUDE', 'LONGITUDE'])
  );
  console.log(`Saved ${crimes.length} crimes to crime_raw.csv\n`);

  console.log('=== Done ===');
  console.log('Now run: node scripts/process-data.js');
}

main().catch(console.error);
