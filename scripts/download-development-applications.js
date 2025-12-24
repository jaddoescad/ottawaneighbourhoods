/**
 * Download Development Applications from City of Ottawa
 *
 * Data source: https://maps.ottawa.ca/arcgis/rest/services/Development_Applications/MapServer/0
 *
 * This script downloads all development applications with public consultation
 * and saves them to a CSV file for processing.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_FILE = path.join(__dirname, '../src/data/csv/development_applications_raw.csv');

// Development Applications API
const API_URL = 'https://maps.ottawa.ca/arcgis/rest/services/Development_Applications/MapServer/0/query';

function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function downloadAllApplications() {
  console.log('Downloading development applications from City of Ottawa...\n');

  const allFeatures = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: 'APPLICATION_NUMBER,APPLICATION_DATE,APPLICATION_TYPE_EN,OBJECT_CURRENT_STATUS_EN,OBJECT_CURRENT_STATUS_DATE,ADDRESS_NUMBER_ROAD_NAME,WARD_NUMBER_EN,LATITUDE,LONGITUDE',
      returnGeometry: false,
      f: 'json',
      resultOffset: offset,
      resultRecordCount: batchSize
    });

    const url = `${API_URL}?${params.toString()}`;
    console.log(`Fetching records ${offset} to ${offset + batchSize}...`);

    const data = await fetchData(url);

    if (!data.features || data.features.length === 0) {
      break;
    }

    allFeatures.push(...data.features);

    if (data.features.length < batchSize) {
      break;
    }

    offset += batchSize;
  }

  console.log(`\nTotal applications downloaded: ${allFeatures.length}`);

  // Analyze the data
  const types = {};
  const statuses = {};
  const wards = {};
  const years = {};

  for (const f of allFeatures) {
    const attrs = f.attributes;
    const type = attrs.APPLICATION_TYPE_EN || 'Unknown';
    const status = attrs.OBJECT_CURRENT_STATUS_EN || 'Unknown';
    const ward = attrs.WARD_NUMBER_EN || 'Unknown';
    const date = attrs.APPLICATION_DATE;
    const year = date ? new Date(date).getFullYear() : 'Unknown';

    types[type] = (types[type] || 0) + 1;
    statuses[status] = (statuses[status] || 0) + 1;
    wards[ward] = (wards[ward] || 0) + 1;
    years[year] = (years[year] || 0) + 1;
  }

  console.log('\nApplication Types:');
  Object.entries(types).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}`);
  });

  console.log('\nTop Statuses:');
  Object.entries(statuses).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}`);
  });

  console.log('\nApplications by Year:');
  Object.entries(years).sort((a, b) => b[0] - a[0]).slice(0, 10).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}`);
  });

  // Determine active vs approved
  const activeStatuses = [
    'Application File Pending',
    'Comment Period in Progress',
    'Comment Period has Ended/Issue Resolution',
    'On Circulation; Initial Submission Review',
    'Initial Circulation Period Completed',
    'Additional Submission Review Required',
    'Report in Progress',
    'Application Recommended to Council for Approval',
    'Application Reactivated',
    'Request for Agreement Received',
    'By-law Passed - In Appeal Period',
    'In Appeal Period'
  ];

  const approvedStatuses = [
    'Zoning By-law in Effect',
    'Agreement Registered - Final Legal Clearance Given',
    'Agreement Registered - Securities Held',
    'Application Approved',
    'Application Approved by Council',
    'Application Approved by OMB',
    'Draft Approved',
    'No Appeal - Official Plan Amendment Adopted',
    'Heritage Permit Issued',
    'Notice of Decision Sent'
  ];

  // Write to CSV
  const csvHeader = 'APPLICATION_NUMBER,APPLICATION_DATE,APPLICATION_TYPE,STATUS,STATUS_DATE,ADDRESS,WARD,LATITUDE,LONGITUDE,IS_ACTIVE,IS_APPROVED\n';

  const csvRows = allFeatures.map(f => {
    const attrs = f.attributes;
    const status = attrs.OBJECT_CURRENT_STATUS_EN || '';
    const isActive = activeStatuses.some(s => status.includes(s)) ? 1 : 0;
    const isApproved = approvedStatuses.some(s => status.includes(s)) ? 1 : 0;

    return [
      attrs.APPLICATION_NUMBER || '',
      attrs.APPLICATION_DATE ? new Date(attrs.APPLICATION_DATE).toISOString().split('T')[0] : '',
      (attrs.APPLICATION_TYPE_EN || '').replace(/,/g, ';'),
      (attrs.OBJECT_CURRENT_STATUS_EN || '').replace(/,/g, ';'),
      attrs.OBJECT_CURRENT_STATUS_DATE ? new Date(attrs.OBJECT_CURRENT_STATUS_DATE).toISOString().split('T')[0] : '',
      (attrs.ADDRESS_NUMBER_ROAD_NAME || '').replace(/,/g, ';'),
      (attrs.WARD_NUMBER_EN || '').replace(/,/g, ';'),
      attrs.LATITUDE || '',
      attrs.LONGITUDE || '',
      isActive,
      isApproved
    ].join(',');
  });

  fs.writeFileSync(OUTPUT_FILE, csvHeader + csvRows.join('\n'));
  console.log(`\nSaved to ${OUTPUT_FILE}`);

  // Count active and approved
  const activeCount = allFeatures.filter(f => {
    const status = f.attributes.OBJECT_CURRENT_STATUS_EN || '';
    return activeStatuses.some(s => status.includes(s));
  }).length;

  const approvedCount = allFeatures.filter(f => {
    const status = f.attributes.OBJECT_CURRENT_STATUS_EN || '';
    return approvedStatuses.some(s => status.includes(s));
  }).length;

  console.log(`\nActive applications: ${activeCount}`);
  console.log(`Approved applications: ${approvedCount}`);
}

downloadAllApplications().catch(console.error);
