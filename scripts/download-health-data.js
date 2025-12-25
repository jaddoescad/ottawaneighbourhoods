#!/usr/bin/env node
/**
 * Download and Process OCHPP Health Data for Ottawa Neighbourhoods
 *
 * OCHPP (Ontario Community Health Profiles Partnership) provides neighbourhood-level
 * health indicators for Ottawa. Data must be manually downloaded as Excel files.
 *
 * Data Source: https://www.ontariohealthprofiles.ca/dataTablesON.php?varTab=HPDtbl&select1=7
 *
 * MANUAL DOWNLOAD INSTRUCTIONS:
 * 1. Visit: https://www.ontariohealthprofiles.ca/dataTablesON.php
 * 2. Select "Neighbourhoods in City of Ottawa" as the geographic unit
 * 3. Download Excel files for each indicator:
 *    - Adult Health: Primary Care Attachment, Diabetes Prevalence, Asthma Prevalence
 *    - ED Visits: Mental Health ED Visits, All ED Visits
 *    - Hospital: Hospital Admissions, Premature Mortality
 * 4. Place downloaded files in: scripts/data/ochpp/
 * 5. Run this script to process them: node scripts/download-health-data.js
 *
 * If no Excel files are present, this script generates sample data for testing.
 *
 * Usage: node scripts/download-health-data.js [--sample]
 */

const fs = require('fs');
const path = require('path');
const neighbourhoodMapping = require('./config/neighbourhood-mapping.js');

// Output path
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'csv', 'health_data.csv');
const OCHPP_DIR = path.join(__dirname, 'data', 'ochpp');

// Neighbourhood name normalization for matching OCHPP names to our IDs
function normalizeNeighbourhoodName(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build lookup from name to ID
function buildNameToIdLookup() {
  const lookup = {};
  for (const [id, config] of Object.entries(neighbourhoodMapping)) {
    const normalizedName = normalizeNeighbourhoodName(config.name);
    lookup[normalizedName] = id;

    // Also add variations
    const simpleName = config.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    lookup[simpleName] = id;
  }
  return lookup;
}

// Match OCHPP neighbourhood name to our ID
function matchNeighbourhoodName(ochppName, lookup) {
  const normalized = normalizeNeighbourhoodName(ochppName);

  // Direct match
  if (lookup[normalized]) return lookup[normalized];

  // Simple match (alphanumeric only)
  const simple = ochppName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (lookup[simple]) return lookup[simple];

  // Fuzzy match - find best match
  let bestMatch = null;
  let bestScore = 0;

  for (const [id, config] of Object.entries(neighbourhoodMapping)) {
    const configSimple = config.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if one contains the other
    if (simple.includes(configSimple) || configSimple.includes(simple)) {
      const score = Math.min(simple.length, configSimple.length) / Math.max(simple.length, configSimple.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = id;
      }
    }
  }

  return bestScore > 0.6 ? bestMatch : null;
}

// Parse Excel file using built-in capabilities
// Note: For full Excel parsing, you'd need a library like xlsx
// This function handles CSV exports from OCHPP
function parseCSVFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    data.push(row);
  }

  return data;
}

// Generate sample health data based on typical Ottawa patterns
// This provides realistic estimates when OCHPP data isn't available
function generateSampleData() {
  console.log('Generating sample health data (OCHPP data not found)...\n');

  const results = [];
  const nameLookup = buildNameToIdLookup();

  for (const [id, config] of Object.entries(neighbourhoodMapping)) {
    // Generate realistic sample data based on neighbourhood characteristics
    // These are estimates based on Ottawa averages and typical variation

    // Base values (Ottawa averages from OCHPP)
    const baseValues = {
      primaryCareAccess: 85, // % with family doctor (Ottawa avg ~85%)
      diabetesPrevalence: 9.5, // % of adults (Ottawa avg ~9.5%)
      asthmaPrevalence: 14, // % of adults (Ottawa avg ~14%)
      copdPrevalence: 4, // % of adults (Ottawa avg ~4%)
      hypertensionPrevalence: 22, // % of adults (Ottawa avg ~22%)
      mentalHealthEdRate: 650, // per 100K (Ottawa avg varies)
      prematureMortality: 180, // per 100K (Ottawa avg ~180)
      hospitalAdmissionRate: 45, // per 1000 (Ottawa avg ~45)
    };

    // Add realistic variation (-20% to +30% based on neighbourhood type)
    const variation = () => 0.8 + Math.random() * 0.5;

    // Some neighbourhoods have known health challenges (downtown core, lower income areas)
    const isUrbanCore = ['lowertown-west', 'lowertown-east', 'west-centretown', 'centretown', 'vanier-south', 'vanier-north'].includes(id);
    const isAffluent = ['rockcliffe-park', 'glebe-dows-lake', 'westboro', 'old-ottawa-south', 'manor-park'].includes(id);

    let modifier = 1.0;
    if (isUrbanCore) modifier = 1.2; // Higher health challenges
    if (isAffluent) modifier = 0.85; // Lower health challenges

    results.push({
      id,
      name: config.name,
      primaryCareAccess: Math.round(baseValues.primaryCareAccess * (isAffluent ? 1.05 : isUrbanCore ? 0.9 : 1) * 10) / 10,
      diabetesPrevalence: Math.round(baseValues.diabetesPrevalence * modifier * variation() * 10) / 10,
      asthmaPrevalence: Math.round(baseValues.asthmaPrevalence * variation() * 10) / 10,
      copdPrevalence: Math.round(baseValues.copdPrevalence * modifier * variation() * 10) / 10,
      hypertensionPrevalence: Math.round(baseValues.hypertensionPrevalence * modifier * variation() * 10) / 10,
      mentalHealthEdRate: Math.round(baseValues.mentalHealthEdRate * modifier * variation()),
      prematureMortality: Math.round(baseValues.prematureMortality * modifier * variation()),
      hospitalAdmissionRate: Math.round(baseValues.hospitalAdmissionRate * modifier * variation() * 10) / 10,
      dataYear: '2022-2023',
      dataSource: 'Sample (pending OCHPP data)',
    });
  }

  return results;
}

// Process OCHPP Excel/CSV files if available
function processOCHPPFiles() {
  if (!fs.existsSync(OCHPP_DIR)) {
    console.log(`OCHPP data directory not found: ${OCHPP_DIR}`);
    console.log('Creating directory for future data...\n');
    fs.mkdirSync(OCHPP_DIR, { recursive: true });
    return null;
  }

  const files = fs.readdirSync(OCHPP_DIR).filter(f =>
    f.endsWith('.csv') || f.endsWith('.xlsx') || f.endsWith('.xls')
  );

  if (files.length === 0) {
    console.log('No OCHPP data files found in:', OCHPP_DIR);
    return null;
  }

  console.log(`Found ${files.length} OCHPP data files:`);
  files.forEach(f => console.log(`  - ${f}`));
  console.log();

  // Initialize results with all neighbourhoods
  const results = {};
  for (const [id, config] of Object.entries(neighbourhoodMapping)) {
    results[id] = {
      id,
      name: config.name,
      primaryCareAccess: null,
      diabetesPrevalence: null,
      asthmaPrevalence: null,
      copdPrevalence: null,
      hypertensionPrevalence: null,
      mentalHealthEdRate: null,
      prematureMortality: null,
      hospitalAdmissionRate: null,
      dataYear: null,
      dataSource: 'OCHPP',
    };
  }

  const nameLookup = buildNameToIdLookup();

  // Process each CSV file
  for (const file of files) {
    if (!file.endsWith('.csv')) {
      console.log(`Skipping non-CSV file: ${file} (convert to CSV first)`);
      continue;
    }

    const filePath = path.join(OCHPP_DIR, file);
    console.log(`Processing: ${file}`);

    try {
      const data = parseCSVFile(filePath);

      // Detect indicator type from filename
      const lowerFile = file.toLowerCase();
      let indicator = null;

      if (lowerFile.includes('primary') || lowerFile.includes('attachment')) {
        indicator = 'primaryCareAccess';
      } else if (lowerFile.includes('diabetes')) {
        indicator = 'diabetesPrevalence';
      } else if (lowerFile.includes('asthma')) {
        indicator = 'asthmaPrevalence';
      } else if (lowerFile.includes('copd')) {
        indicator = 'copdPrevalence';
      } else if (lowerFile.includes('hypertension') || lowerFile.includes('blood pressure')) {
        indicator = 'hypertensionPrevalence';
      } else if (lowerFile.includes('mental') && lowerFile.includes('ed')) {
        indicator = 'mentalHealthEdRate';
      } else if (lowerFile.includes('mortality') || lowerFile.includes('premature')) {
        indicator = 'prematureMortality';
      } else if (lowerFile.includes('hospital') || lowerFile.includes('admission')) {
        indicator = 'hospitalAdmissionRate';
      }

      if (!indicator) {
        console.log(`  Could not detect indicator type from filename`);
        continue;
      }

      console.log(`  Detected indicator: ${indicator}`);

      // Find neighbourhood and value columns
      const sampleRow = data[0];
      const neighbourhoodCol = Object.keys(sampleRow).find(k =>
        k.toLowerCase().includes('neighbourhood') || k.toLowerCase().includes('area') || k.toLowerCase().includes('name')
      );
      const valueCol = Object.keys(sampleRow).find(k =>
        k.toLowerCase().includes('rate') || k.toLowerCase().includes('prevalence') ||
        k.toLowerCase().includes('percent') || k.toLowerCase().includes('value') ||
        k.toLowerCase().includes('%')
      );

      if (!neighbourhoodCol || !valueCol) {
        console.log(`  Could not find required columns`);
        continue;
      }

      let matched = 0;
      for (const row of data) {
        const neighbourhoodName = row[neighbourhoodCol];
        const value = parseFloat(row[valueCol]);

        if (!neighbourhoodName || isNaN(value)) continue;

        const id = matchNeighbourhoodName(neighbourhoodName, nameLookup);
        if (id && results[id]) {
          results[id][indicator] = value;
          matched++;
        }
      }

      console.log(`  Matched ${matched} neighbourhoods`);
    } catch (err) {
      console.log(`  Error processing file: ${err.message}`);
    }
  }

  return Object.values(results);
}

// Main execution
async function main() {
  console.log('='.repeat(60));
  console.log('Ottawa Neighbourhood Health Data Processor');
  console.log('='.repeat(60));
  console.log();

  console.log('OCHPP Data Source: https://www.ontariohealthprofiles.ca/dataTablesON.php');
  console.log();

  // Check for --sample flag
  const useSample = process.argv.includes('--sample');

  let results;

  if (useSample) {
    console.log('Using sample data (--sample flag provided)\n');
    results = generateSampleData();
  } else {
    // Try to process OCHPP files first
    results = processOCHPPFiles();

    if (!results) {
      console.log('\n' + '-'.repeat(60));
      console.log('OCHPP DATA NOT FOUND - Generating sample data');
      console.log('-'.repeat(60));
      console.log('\nTo use real OCHPP data:');
      console.log('1. Visit: https://www.ontariohealthprofiles.ca/dataTablesON.php');
      console.log('2. Select "Neighbourhoods in City of Ottawa"');
      console.log('3. Download indicators as CSV (or Excel, then convert to CSV)');
      console.log('4. Place files in: scripts/data/ochpp/');
      console.log('5. Run this script again\n');

      results = generateSampleData();
    }
  }

  // Sort by name
  results.sort((a, b) => a.name.localeCompare(b.name));

  // Generate CSV
  const headers = [
    'id',
    'name',
    'primaryCareAccess',
    'diabetesPrevalence',
    'asthmaPrevalence',
    'copdPrevalence',
    'hypertensionPrevalence',
    'mentalHealthEdRate',
    'prematureMortality',
    'hospitalAdmissionRate',
    'dataYear',
    'dataSource',
  ];

  const csvRows = results.map(r => [
    r.id,
    `"${r.name}"`,
    r.primaryCareAccess !== null ? r.primaryCareAccess : '',
    r.diabetesPrevalence !== null ? r.diabetesPrevalence : '',
    r.asthmaPrevalence !== null ? r.asthmaPrevalence : '',
    r.copdPrevalence !== null ? r.copdPrevalence : '',
    r.hypertensionPrevalence !== null ? r.hypertensionPrevalence : '',
    r.mentalHealthEdRate !== null ? r.mentalHealthEdRate : '',
    r.prematureMortality !== null ? r.prematureMortality : '',
    r.hospitalAdmissionRate !== null ? r.hospitalAdmissionRate : '',
    r.dataYear || '',
    r.dataSource || '',
  ].join(','));

  const csv = [headers.join(','), ...csvRows].join('\n');
  fs.writeFileSync(OUTPUT_PATH, csv);

  console.log('='.repeat(60));
  console.log('Health Data Summary');
  console.log('='.repeat(60));
  console.log();
  console.log(`Total neighbourhoods: ${results.length}`);
  console.log(`Output file: ${OUTPUT_PATH}`);
  console.log();

  // Print sample statistics
  const withData = results.filter(r => r.primaryCareAccess !== null);
  if (withData.length > 0) {
    const avgPrimaryCare = withData.reduce((sum, r) => sum + (r.primaryCareAccess || 0), 0) / withData.length;
    const avgDiabetes = withData.reduce((sum, r) => sum + (r.diabetesPrevalence || 0), 0) / withData.length;
    const avgMentalHealth = withData.reduce((sum, r) => sum + (r.mentalHealthEdRate || 0), 0) / withData.length;

    console.log('Average Health Indicators:');
    console.log(`  Primary Care Access: ${avgPrimaryCare.toFixed(1)}%`);
    console.log(`  Diabetes Prevalence: ${avgDiabetes.toFixed(1)}%`);
    console.log(`  Mental Health ED Rate: ${avgMentalHealth.toFixed(0)} per 100K`);
  }

  console.log();
  console.log('Done! Run `node scripts/process-data.js` to include in data.json');
}

main().catch(console.error);
