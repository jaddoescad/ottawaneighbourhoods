/**
 * Process Ottawa 311 Service Request Data
 *
 * Downloads and processes 311 service request data from City of Ottawa
 * Aggregates by neighbourhood using point-in-polygon for geolocated requests
 * and ward-based distribution for requests without coordinates.
 *
 * Data sources:
 * - Current Year: https://311opendatastorage.blob.core.windows.net/311data/311opendata_currentyear.csv
 * - Previous Year: https://311opendatastorage.blob.core.windows.net/311data/311opendata_lastyear.csv
 */

const fs = require('fs');
const path = require('path');

// Load neighbourhood boundaries
const dataPath = path.join(__dirname, '../src/data/processed/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const neighbourhoods = data.neighbourhoods;

// Service request type mappings (English version)
const SERVICE_TYPES = {
  'Roads and Transportation': 'Roads & Transportation',
  'Garbage and Recycling': 'Garbage & Recycling',
  'Bylaw Services': 'Bylaw Services',
  'Water and the Environment': 'Water & Environment',
  'Recreation and Culture': 'Recreation & Culture',
  'Miscellaneous': 'Miscellaneous',
  'Social Community Service': 'Social Services',
  'City Hall': 'City Hall',
  'Licenses and Permits': 'Licenses & Permits',
  'Health and Safety': 'Health & Safety',
  'Corp Complaints': 'Corporate Complaints',
  'Knowledge Management': 'Knowledge Management'
};

// Road quality complaint types - these indicate road surface issues
const ROAD_QUALITY_COMPLAINTS = [
  'Road Maintenance - Travelled Surface Pothole',
  'Road Maintenance - Shoulder Pothole',
  'Road Surface - Damaged/Destroyed',
  'Road Surface - Sunken/Raised',
  'Road Surface - Depression',
  'Road - Broken Concrete',
  'Road - Gravel Washboard',
  'Road - Gravel Loose',
  'Road Maintenance - Surface Defect',
  'Sidewalk - Damage/Defects'  // Include sidewalk issues for walkability
];

// Noise complaint types - these indicate noise issues in the neighbourhood
const NOISE_COMPLAINTS = [
  'Noise - Music',
  'Noise - Shouting',
  'Noise - Construction',
  'Noise - Info-Noise',
  'Noise - Machinery-AirCond/Fan/Pool/Mower/Generator',
  'Noise - Car Alarms',
  'Noise - Idling',
  'Noise - Muffler',
  'Noise - Delivery/Load/Unload',
  'Noise - Festival',
  'Noise - Garbage',
  'Noise - H-Vac/Street Sweeper',
  'Noise - Special Event',
  'Noise - Outdoor Patio',
  'Noise - Vehicle Repair',
  'Noise - Squeal Tires',
  'Noise - Parades'
];

// Ward to neighbourhood mapping (approximate based on geography)
// Each ward maps to neighbourhoods with population proportions
const WARD_NEIGHBOURHOOD_MAP = {
  '1': ['orleans-village-chateauneuf', 'convent-glen-orleans-woods', 'fallingbrook', 'queenswood-chatelaine'],
  '2': ['cardinal-creek', 'queenswood-heights', 'pineview', 'portobello-south'],
  '3': ['blackburn-hamlet', 'beacon-hill-south-cardinal-heights', 'rothwell-heights-beacon-hill-north', 'hawthorne-meadows-sheffield-glen'],
  '4': ['cumberland', 'navan-sarsfield', 'vars'],
  '5': ['rideau-crest-davidson-heights', 'edwards-carlsbad-springs', 'osgoode-vernon', 'greely', 'metcalfe'],
  '6': ['old-barrhaven-east', 'old-barrhaven-west', 'chapman-mills', 'stonebridge-half-moon-bay'],
  '7': ['bridlewood-emerald-meadows', 'findlay-creek'],
  '8': ['blossom-park-timbermill', 'emerald-woods-sawmill-creek', 'hunt-club-park', 'greenboro-east', 'greenboro-west', 'south-keys'],
  '9': ['riverside-park-mooney-s-bay', 'riverside-park-south-revelstoke', 'carleton-heights-courtland-park', 'playfair-park-guildwood-estates'],
  '10': ['old-hunt-club', 'leslie-park-bruce-farm', 'ledbury-heron-gate-ridgemont', 'elmvale-canterbury'],
  '11': ['alta-vista', 'riverview', 'billings-bridge-heron-park'],
  '12': ['sandy-hill', 'lowertown-east', 'lowertown-west', 'vanier-north', 'vanier-south', 'overbrook'],
  '13': ['new-edinburgh', 'manor-park', 'rockcliffe-park', 'wateridge-village', 'carson-grove-carson-meadows'],
  '14': ['old-ottawa-east', 'old-ottawa-south', 'glebe-dows-lake'],
  '15': ['centretown', 'west-centretown', 'civic-hospital', 'hintonburg-mechanicsville'],
  '16': ['westboro', 'island-park-wellington-village', 'britannia', 'crystal-bay-lakeview-park'],
  '17': ['carlington', 'parkwood-hills', 'borden-farm-fisher-glen', 'fisher-heights', 'merivale-gardens-grenfell-glen-pineglen-country-place', 'craig-henry-manordale'],
  '18': ['centrepointe', 'trend-arlington', 'queensway-terrace-north', 'braemar-park-bel-air-heights-copeland-park'],
  '19': ['bells-corners-east', 'bells-corners-west', 'glen-cairn', 'city-view', 'crestview-tanglewood', 'laurentian'],
  '20': ['manotick', 'north-gower-kars', 'munster-ashton', 'richmond', 'riverside-south-leitrim'],
  '21': ['kanata-lakes', 'katimavik-hazeldean', 'beaverbrook', 'brookside-briarbrook-morgan-s-grant', 'stittsville-east', 'stittsville-north', 'stittsville'],
  '22': ['qualicum-redwood', 'iris', 'bayshore', 'whitehaven-woodpark-glabar-park'],
  '23': ['carp', 'kinburn', 'constance-bay', 'dunrobin', 'fitzroy', 'corkery'],
  '24': ['chapel-hill-north', 'chapel-hill-south']
};

// Point-in-polygon check
function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

// Find neighbourhood for a point
function findNeighbourhood(lat, lng) {
  const point = [lng, lat]; // GeoJSON uses [lng, lat]

  for (const n of neighbourhoods) {
    if (n.boundaries && n.boundaries.length > 0) {
      for (const boundary of n.boundaries) {
        if (boundary.rings) {
          for (const ring of boundary.rings) {
            if (pointInPolygon(point, ring)) {
              return n.id;
            }
          }
        }
      }
    }
  }
  return null;
}

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

// Process 311 data files
function process311Data() {
  const csvDir = path.join(__dirname, '../src/data/csv');
  const currentYearFile = path.join(csvDir, '311_current_year.csv');
  const previousYearFile = path.join(csvDir, '311_previous_year.csv');

  // Initialize neighbourhood stats
  const stats = {};
  neighbourhoods.forEach(n => {
    stats[n.id] = {
      total: 0,
      byType: {},
      population: n.population || 1,
      areaKm2: n.details?.areaKm2 || 1,
      // Road quality tracking
      roadComplaints: 0,
      roadComplaintsByType: {},
      // Noise tracking
      noiseComplaints: 0,
      noiseComplaintsByType: {}
    };
  });

  // Process each file
  const files = [
    { path: currentYearFile, year: '2025' },
    { path: previousYearFile, year: '2024' }
  ];

  let totalProcessed = 0;
  let geolocated = 0;
  let wardBased = 0;
  let unassigned = 0;

  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      console.log(`Skipping ${file.path} - file not found`);
      continue;
    }

    console.log(`Processing ${path.basename(file.path)}...`);
    const content = fs.readFileSync(file.path, 'utf8');
    const lines = content.split('\n').slice(1); // Skip header

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = parseCSVLine(line);
      if (parts.length < 10) continue;

      const type = parts[2];
      const description = parts[3] || ''; // The specific complaint description
      const lat = parseFloat(parts[7]);
      const lng = parseFloat(parts[8]);
      const ward = parts[9] ? parts[9].trim() : '';

      totalProcessed++;

      // Get service type category
      const typeKey = Object.keys(SERVICE_TYPES).find(k => type.includes(k));
      const category = typeKey ? SERVICE_TYPES[typeKey] : 'Other';

      // Check if this is a road quality complaint
      const isRoadComplaint = ROAD_QUALITY_COMPLAINTS.some(rc =>
        description.includes(rc) || type.includes(rc)
      );

      // Check if this is a noise complaint
      const isNoiseComplaint = NOISE_COMPLAINTS.some(nc =>
        description.includes(nc) || type.includes(nc)
      );

      // Try to find neighbourhood
      let neighbourhoodId = null;

      // Method 1: Use coordinates if available
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        neighbourhoodId = findNeighbourhood(lat, lng);
        if (neighbourhoodId) geolocated++;
      }

      // Method 2: Use ward mapping if no coordinates or geolocation failed
      if (!neighbourhoodId && ward) {
        const wardNeighbourhoods = WARD_NEIGHBOURHOOD_MAP[ward];
        if (wardNeighbourhoods && wardNeighbourhoods.length > 0) {
          // Distribute proportionally by population
          const totalWardPop = wardNeighbourhoods.reduce((sum, nId) => {
            return sum + (stats[nId]?.population || 0);
          }, 0);

          if (totalWardPop > 0) {
            for (const nId of wardNeighbourhoods) {
              if (stats[nId]) {
                const proportion = stats[nId].population / totalWardPop;
                stats[nId].total += proportion;
                stats[nId].byType[category] = (stats[nId].byType[category] || 0) + proportion;
                // Track road complaints
                if (isRoadComplaint) {
                  stats[nId].roadComplaints += proportion;
                  stats[nId].roadComplaintsByType[description] = (stats[nId].roadComplaintsByType[description] || 0) + proportion;
                }
                // Track noise complaints
                if (isNoiseComplaint) {
                  stats[nId].noiseComplaints += proportion;
                  stats[nId].noiseComplaintsByType[description] = (stats[nId].noiseComplaintsByType[description] || 0) + proportion;
                }
              }
            }
            wardBased++;
            continue; // Already distributed
          }
        }
      }

      // Assign to neighbourhood
      if (neighbourhoodId && stats[neighbourhoodId]) {
        stats[neighbourhoodId].total++;
        stats[neighbourhoodId].byType[category] = (stats[neighbourhoodId].byType[category] || 0) + 1;
        // Track road complaints
        if (isRoadComplaint) {
          stats[neighbourhoodId].roadComplaints++;
          stats[neighbourhoodId].roadComplaintsByType[description] = (stats[neighbourhoodId].roadComplaintsByType[description] || 0) + 1;
        }
        // Track noise complaints
        if (isNoiseComplaint) {
          stats[neighbourhoodId].noiseComplaints++;
          stats[neighbourhoodId].noiseComplaintsByType[description] = (stats[neighbourhoodId].noiseComplaintsByType[description] || 0) + 1;
        }
      } else {
        unassigned++;
      }
    }
  }

  console.log(`\nProcessing complete:`);
  console.log(`  Total records: ${totalProcessed}`);
  console.log(`  Geolocated: ${geolocated} (${(geolocated/totalProcessed*100).toFixed(1)}%)`);
  console.log(`  Ward-based: ${wardBased} (${(wardBased/totalProcessed*100).toFixed(1)}%)`);
  console.log(`  Unassigned: ${unassigned} (${(unassigned/totalProcessed*100).toFixed(1)}%)`);

  // Calculate rates and road/noise quality scores
  const result = {};
  const roadRates = []; // Collect rates for percentile calculation
  const noiseRates = []; // Collect noise rates for percentile calculation

  for (const [id, data] of Object.entries(stats)) {
    const total = Math.round(data.total);
    const population = data.population;
    const areaKm2 = data.areaKm2;
    const rate = population > 0 ? (total / population * 1000) : 0;

    // Road complaints per km² of road (using area as proxy for road network)
    const roadComplaints = Math.round(data.roadComplaints);
    const roadComplaintsPerKm2 = areaKm2 > 0 ? (roadComplaints / areaKm2) : 0;
    const roadComplaintsRate = population > 0 ? (roadComplaints / population * 1000) : 0;

    // Noise complaints per 1000 residents (population-based for fairness)
    const noiseComplaints = Math.round(data.noiseComplaints);
    const noiseComplaintsRate = population > 0 ? (noiseComplaints / population * 1000) : 0;

    if (roadComplaints > 0) {
      roadRates.push({ id, rate: roadComplaintsPerKm2 });
    }
    if (noiseComplaints > 0) {
      noiseRates.push({ id, rate: noiseComplaintsRate });
    }

    result[id] = {
      total,
      rate: Math.round(rate * 10) / 10,  // Rate per 1000 residents
      byType: {},
      // Road quality metrics
      roadComplaints,
      roadComplaintsRate: Math.round(roadComplaintsRate * 10) / 10,
      roadComplaintsPerKm2: Math.round(roadComplaintsPerKm2 * 10) / 10,
      roadComplaintsByType: {},
      // Noise metrics
      noiseComplaints,
      noiseComplaintsRate: Math.round(noiseComplaintsRate * 10) / 10,
      noiseComplaintsByType: {}
    };

    for (const [type, count] of Object.entries(data.byType)) {
      result[id].byType[type] = Math.round(count);
    }

    // Sort and keep top road complaint types (clean bilingual names)
    const sortedRoadTypes = Object.entries(data.roadComplaintsByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    for (const [type, count] of sortedRoadTypes) {
      // Remove French translation after | character
      const cleanType = type.split(' | ')[0].trim();
      result[id].roadComplaintsByType[cleanType] = (result[id].roadComplaintsByType[cleanType] || 0) + Math.round(count);
    }

    // Sort and keep top noise complaint types (clean bilingual names)
    const sortedNoiseTypes = Object.entries(data.noiseComplaintsByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    for (const [type, count] of sortedNoiseTypes) {
      // Remove French translation after | character
      const cleanType = type.split(' | ')[0].trim();
      result[id].noiseComplaintsByType[cleanType] = (result[id].noiseComplaintsByType[cleanType] || 0) + Math.round(count);
    }
  }

  // Calculate road quality score (0-100, higher = better roads)
  // Based on percentile ranking - fewer complaints = higher score
  roadRates.sort((a, b) => a.rate - b.rate); // Sort ascending (lowest complaints first)
  const numWithData = roadRates.length;

  for (let i = 0; i < roadRates.length; i++) {
    const id = roadRates[i].id;
    // Percentile: 0 complaints gets 100, most complaints gets ~0
    const percentile = ((numWithData - i) / numWithData) * 100;
    result[id].roadQualityScore = Math.round(percentile);
  }

  // Neighbourhoods with no road complaints get score of 100
  for (const [id, data] of Object.entries(result)) {
    if (data.roadComplaints === 0) {
      result[id].roadQualityScore = 100;
    }
  }

  // Calculate quiet score (0-100, higher = quieter neighbourhood)
  // Based on percentile ranking - fewer noise complaints = higher score
  noiseRates.sort((a, b) => a.rate - b.rate); // Sort ascending (lowest complaints first)
  const numWithNoiseData = noiseRates.length;

  for (let i = 0; i < noiseRates.length; i++) {
    const id = noiseRates[i].id;
    // Percentile: 0 complaints gets 100, most complaints gets ~0
    const percentile = ((numWithNoiseData - i) / numWithNoiseData) * 100;
    result[id].quietScore = Math.round(percentile);
  }

  // Neighbourhoods with no noise complaints get score of 100
  for (const [id, data] of Object.entries(result)) {
    if (data.noiseComplaints === 0) {
      result[id].quietScore = 100;
    }
  }

  // Save results
  const outputPath = path.join(csvDir, '311_by_neighbourhood.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\nResults saved to ${outputPath}`);

  // Print top 10 by rate
  console.log('\nTop 10 neighbourhoods by service request rate (per 1000 residents):');
  Object.entries(result)
    .filter(([id, d]) => d.total > 100) // Minimum threshold
    .sort((a, b) => b[1].rate - a[1].rate)
    .slice(0, 10)
    .forEach(([id, d], i) => {
      const n = neighbourhoods.find(n => n.id === id);
      console.log(`  ${i+1}. ${n?.name || id}: ${d.rate.toFixed(1)} (${d.total} requests)`);
    });

  // Print road quality stats
  const totalRoadComplaints = Object.values(result).reduce((sum, d) => sum + d.roadComplaints, 0);
  console.log(`\nRoad Quality Analysis:`);
  console.log(`  Total road complaints: ${totalRoadComplaints.toLocaleString()}`);

  console.log('\nTop 10 neighbourhoods with WORST road quality (most complaints/km²):');
  Object.entries(result)
    .filter(([id, d]) => d.roadComplaints > 10) // Minimum threshold
    .sort((a, b) => b[1].roadComplaintsPerKm2 - a[1].roadComplaintsPerKm2)
    .slice(0, 10)
    .forEach(([id, d], i) => {
      const n = neighbourhoods.find(n => n.id === id);
      console.log(`  ${i+1}. ${n?.name || id}: ${d.roadComplaintsPerKm2.toFixed(1)}/km² (${d.roadComplaints} complaints, score: ${d.roadQualityScore})`);
    });

  console.log('\nTop 10 neighbourhoods with BEST road quality (fewest complaints/km²):');
  Object.entries(result)
    .filter(([id, d]) => d.roadComplaints > 0 && neighbourhoods.find(n => n.id === id)?.population > 1000)
    .sort((a, b) => a[1].roadComplaintsPerKm2 - b[1].roadComplaintsPerKm2)
    .slice(0, 10)
    .forEach(([id, d], i) => {
      const n = neighbourhoods.find(n => n.id === id);
      console.log(`  ${i+1}. ${n?.name || id}: ${d.roadComplaintsPerKm2.toFixed(1)}/km² (${d.roadComplaints} complaints, score: ${d.roadQualityScore})`);
    });

  // Print noise stats
  const totalNoiseComplaints = Object.values(result).reduce((sum, d) => sum + d.noiseComplaints, 0);
  console.log(`\nNoise Level Analysis:`);
  console.log(`  Total noise complaints: ${totalNoiseComplaints.toLocaleString()}`);

  console.log('\nTop 10 NOISIEST neighbourhoods (most complaints per 1,000 residents):');
  Object.entries(result)
    .filter(([id, d]) => d.noiseComplaints > 10)
    .sort((a, b) => b[1].noiseComplaintsRate - a[1].noiseComplaintsRate)
    .slice(0, 10)
    .forEach(([id, d], i) => {
      const n = neighbourhoods.find(n => n.id === id);
      console.log(`  ${i+1}. ${n?.name || id}: ${d.noiseComplaintsRate.toFixed(1)} per 1K (${d.noiseComplaints} complaints, quiet score: ${d.quietScore})`);
    });

  console.log('\nTop 10 QUIETEST neighbourhoods (fewest complaints per 1,000 residents):');
  Object.entries(result)
    .filter(([id, d]) => d.noiseComplaints > 0 && neighbourhoods.find(n => n.id === id)?.population > 1000)
    .sort((a, b) => a[1].noiseComplaintsRate - b[1].noiseComplaintsRate)
    .slice(0, 10)
    .forEach(([id, d], i) => {
      const n = neighbourhoods.find(n => n.id === id);
      console.log(`  ${i+1}. ${n?.name || id}: ${d.noiseComplaintsRate.toFixed(1)} per 1K (${d.noiseComplaints} complaints, quiet score: ${d.quietScore})`);
    });

  return result;
}

// Run
process311Data();
