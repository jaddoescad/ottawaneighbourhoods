const fs = require('fs');

// Read ONS census data to get all areas
const censusData = fs.readFileSync('/Users/jadslim/Desktop/ottawaneighbourhoods/src/data/csv/ons_census_data.csv', 'utf8');
const lines = censusData.split('\n').slice(1).filter(l => l.trim());

// Skip non-residential areas
const skipAreas = ['3001', '3006', '3019', '3042', '3050', '3051', '3071', '3084'];

const mappings = [];

lines.forEach(line => {
  const match = line.match(/^(\d+),([^,]+)/);
  if (!match) return;

  const onsId = match[1];
  const name = match[2];

  if (skipAreas.includes(onsId)) return;

  // Create slug from name
  const slug = name.toLowerCase()
    .replace(/é/g, 'e')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  mappings.push({ slug, name, onsId });
});

// Output mapping.js content
let mappingJs = `/**
 * Neighbourhood Mapping Configuration
 * Each ONS area is its own distinct neighbourhood
 *
 * Data sources:
 * - Boundaries: https://maps.ottawa.ca/arcgis/rest/services/Neighbourhoods/MapServer/0
 * - Census data: https://ons-sqo.ca/wp-json/ons/v1/get-data/data
 */

module.exports = {
`;

mappings.forEach(m => {
  mappingJs += `  '${m.slug}': {
    name: '${m.name.replace(/'/g, "\\'")}',
    onsIds: [],
    onsSqoIds: ['${m.onsId}'],
  },
`;
});

mappingJs += `};
`;

fs.writeFileSync('/Users/jadslim/Desktop/ottawaneighbourhoods/scripts/config/neighbourhood-mapping.js', mappingJs);
console.log('Created mapping for', mappings.length, 'neighbourhoods');

// Now create neighbourhoods.csv
// We need: id,name,area,image,medianIncome,avgRent,avgHomePrice,pros,cons

// Read existing census data to get income
const censusLines = censusData.split('\n');
const header = censusLines[0].split(',');
const incomeIdx = header.indexOf('census_general_median_after_tax_income_of_households_in_2020');

const incomeByOns = {};
lines.forEach(line => {
  const parts = line.split(',');
  const onsId = parts[0];
  const income = parts[incomeIdx] || '70000';
  incomeByOns[onsId] = income;
});

// Determine area based on location/name
function getArea(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('kanata') || lowerName.includes('bridlewood') || lowerName.includes('beaverbrook') || lowerName.includes('glen cairn') || lowerName.includes('katimavik') || lowerName.includes('morgan')) return 'Kanata';
  if (lowerName.includes('stittsville')) return 'Stittsville';
  if (lowerName.includes('barrhaven') || lowerName.includes('chapman') || lowerName.includes('stonebridge') || lowerName.includes('half moon')) return 'Barrhaven';
  if (lowerName.includes('orleans') || lowerName.includes('fallingbrook') || lowerName.includes('convent glen') || lowerName.includes('chapel hill') || lowerName.includes('cardinal creek') || lowerName.includes('queenswood') || lowerName.includes('portobello')) return 'Orleans';
  if (lowerName.includes('gloucester') || lowerName.includes('beacon hill') || lowerName.includes('carson') || lowerName.includes('blackburn') || lowerName.includes('pineview') || lowerName.includes('rothwell')) return 'East End';
  if (lowerName.includes('vanier') || lowerName.includes('overbrook')) return 'Central East';
  if (lowerName.includes('centretown') || lowerName.includes('lebreton') || lowerName.includes('civic hospital')) return 'Downtown';
  if (lowerName.includes('glebe') || lowerName.includes('old ottawa')) return 'Central Ottawa';
  if (lowerName.includes('westboro') || lowerName.includes('hintonburg') || lowerName.includes('wellington') || lowerName.includes('island park') || lowerName.includes('laurentian') || lowerName.includes('mckellar')) return 'West End';
  if (lowerName.includes('bayshore') || lowerName.includes('britannia') || lowerName.includes('crystal') || lowerName.includes('bells corners') || lowerName.includes('qualicum') || lowerName.includes('whitehaven')) return 'West End';
  if (lowerName.includes('nepean') || lowerName.includes('merivale') || lowerName.includes('craig henry') || lowerName.includes('centrepointe') || lowerName.includes('iris') || lowerName.includes('trend') || lowerName.includes('colonnade') || lowerName.includes('parkwood') || lowerName.includes('borden') || lowerName.includes('tanglewood') || lowerName.includes('bel air') || lowerName.includes('braemar') || lowerName.includes('leslie park')) return 'South West';
  if (lowerName.includes('hunt club') || lowerName.includes('greenboro') || lowerName.includes('south keys') || lowerName.includes('blossom') || lowerName.includes('emerald woods')) return 'South End';
  if (lowerName.includes('alta vista') || lowerName.includes('playfair') || lowerName.includes('elmvale') || lowerName.includes('hawthorne') || lowerName.includes('riverview') || lowerName.includes('heron') || lowerName.includes('billings')) return 'South East';
  if (lowerName.includes('riverside south') || lowerName.includes('leitrim') || lowerName.includes('findlay') || lowerName.includes('rideau crest')) return 'South Suburban';
  if (lowerName.includes('carlington') || lowerName.includes('fisher') || lowerName.includes('cityview') || lowerName.includes('carleton heights') || lowerName.includes('skyline')) return 'Central West';
  if (lowerName.includes('rockcliffe') || lowerName.includes('manor park') || lowerName.includes('new edinburgh') || lowerName.includes('lindenlea') || lowerName.includes('sandy hill') || lowerName.includes('lowertown') || lowerName.includes('byward') || lowerName.includes('wateridge')) return 'Central';
  if (lowerName.includes('carp') || lowerName.includes('constance') || lowerName.includes('dunrobin') || lowerName.includes('fitzroy') || lowerName.includes('kinburn') || lowerName.includes('corkery') || lowerName.includes('richmond') || lowerName.includes('munster')) return 'Rural West';
  if (lowerName.includes('manotick') || lowerName.includes('greely') || lowerName.includes('metcalfe') || lowerName.includes('osgoode') || lowerName.includes('north gower') || lowerName.includes('kars')) return 'Rural South';
  if (lowerName.includes('vars') || lowerName.includes('navan') || lowerName.includes('cumberland') || lowerName.includes('edwards') || lowerName.includes('carlsbad')) return 'Rural East';
  if (lowerName.includes('riverside park') || lowerName.includes('mooney')) return 'South End';
  return 'Ottawa';
}

// Generate pros/cons based on area
function getPros(name, area) {
  const lowerName = name.toLowerCase();
  const pros = [];

  if (area === 'Downtown' || area === 'Central') pros.push('Walking distance to downtown');
  if (area === 'Central Ottawa') pros.push('Central location');
  if (lowerName.includes('river') || lowerName.includes('bay') || lowerName.includes('beach') || lowerName.includes('crystal')) pros.push('Waterfront access');
  if (area.includes('Rural')) pros.push('Quiet rural setting');
  if (area === 'Kanata') pros.push('Tech hub proximity');
  if (area === 'Orleans') pros.push('Family friendly');
  if (lowerName.includes('greenbelt') || lowerName.includes('park')) pros.push('Green space access');

  if (pros.length === 0) pros.push('Established community');
  return pros.join('; ');
}

function getCons(name, area) {
  const cons = [];

  if (area.includes('Rural')) cons.push('Car essential');
  if (area === 'Downtown') cons.push('Higher density');
  if (area === 'Kanata' || area === 'Barrhaven' || area === 'Orleans' || area === 'Stittsville') cons.push('Far from downtown');
  if (area.includes('Suburban')) cons.push('Limited transit');

  if (cons.length === 0) cons.push('Varies by location');
  return cons.join('; ');
}

// Estimate rent and home price based on income
function getRent(income) {
  const inc = parseInt(income) || 70000;
  if (inc > 120000) return 2400;
  if (inc > 100000) return 2200;
  if (inc > 80000) return 2000;
  if (inc > 60000) return 1800;
  return 1650;
}

function getHomePrice(income) {
  const inc = parseInt(income) || 70000;
  if (inc > 120000) return 950000;
  if (inc > 100000) return 800000;
  if (inc > 80000) return 700000;
  if (inc > 60000) return 600000;
  return 500000;
}

let csvContent = 'id,name,area,image,medianIncome,avgRent,avgHomePrice,pros,cons\n';

mappings.forEach(m => {
  const area = getArea(m.name);
  const income = incomeByOns[m.onsId] || '70000';
  const rent = getRent(income);
  const homePrice = getHomePrice(income);
  const pros = getPros(m.name, area);
  const cons = getCons(m.name, area);

  csvContent += `${m.slug},${m.name},${area},/neighbourhoodcovers/default.jpg,${income},${rent},${homePrice},${pros},${cons}\n`;
});

fs.writeFileSync('/Users/jadslim/Desktop/ottawaneighbourhoods/src/data/csv/neighbourhoods.csv', csvContent);
console.log('Created neighbourhoods.csv with', mappings.length, 'entries');
