#!/usr/bin/env node
/**
 * Manual categorization for remaining uncategorized OPH establishments
 */

const fs = require('fs');
const path = require('path');

const CSV_DIR = path.join(__dirname, '..', 'src', 'data', 'csv');

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of lines[i]) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else current += char;
    }
    values.push(current.trim());
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

function decodeHtml(str) {
  return (str || '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '');
}

// Manual categorization rules - more specific patterns
const MANUAL_RULES = [
  // Fast food chains
  [/\bbento\s*nouveau/i, 'fast_food'],
  [/\bchocolats?\s*favoris/i, 'bakery'],
  [/\bcrumbl/i, 'bakery'],
  [/\bbenny\s*&\s*co/i, 'fast_food'],
  [/\bchips?\s*(&|and)?\s*(dairy|dogs?)/i, 'fast_food'],
  [/\bcrispy\s*chips/i, 'fast_food'],
  [/\bbaird'?s\s*chips/i, 'fast_food'],
  [/\bfry\s*yay/i, 'fast_food'],
  [/\bgolden\s*potato/i, 'fast_food'],
  [/\bburgers?\s*on/i, 'fast_food'],
  [/\bboss\s*hog/i, 'fast_food'],
  [/\bbig\s*rideau\s*bbq/i, 'fast_food'],
  [/\bpizza/i, 'fast_food'],
  [/\bbbq\b/i, 'fast_food'],
  [/\bfryer\b/i, 'fast_food'],
  [/\bchip\s*(n|and)/i, 'fast_food'],
  [/\bhotdog|hot\s*dog/i, 'fast_food'],
  [/\bburrito/i, 'fast_food'],
  [/\bwrap/i, 'fast_food'],
  [/\bsandwich/i, 'fast_food'],
  [/\bsub\b/i, 'fast_food'],
  [/\bwheels\b/i, 'food_truck'],
  [/\bon\s*wheels/i, 'food_truck'],
  [/\bstreet\s*(cart|eats|food)/i, 'food_truck'],

  // Grocery/convenience
  [/\bgeneral\s*store/i, 'grocery'],
  [/\bmini\s*market/i, 'grocery'],
  [/\bmart\b/i, 'grocery'],
  [/\bgrocer/i, 'grocery'],
  [/\bfood\s*cupboard/i, 'institutional'], // food bank
  [/\bfood\s*bank/i, 'institutional'],
  [/\bfood\s*pantry/i, 'institutional'],
  [/\bdollar\s*tree/i, 'grocery'],
  [/\bdollarama/i, 'grocery'],
  [/\bgiant\s*tiger/i, 'grocery'],
  [/\bcanadian\s*tire/i, 'grocery'],
  [/\bcabela/i, 'grocery'],
  [/\baisle\s*24/i, 'grocery'],
  [/\bcircle\s*k/i, 'grocery'],
  [/\bdrummond/i, 'grocery'], // gas station
  [/\bgas\b/i, 'grocery'],
  [/\bconfectionery/i, 'grocery'],
  [/\bcorner\b/i, 'grocery'],
  [/\btuck\s*shop/i, 'grocery'],
  [/\bvariety/i, 'grocery'],
  [/\bprice\s*club/i, 'grocery'],

  // Restaurants
  [/\bchez\b/i, 'restaurant'],
  [/\bbrasserie/i, 'restaurant'],
  [/\btrattoria/i, 'restaurant'],
  [/\bosteria/i, 'restaurant'],
  [/\bcuisine/i, 'restaurant'],
  [/\bbreakfast/i, 'restaurant'],
  [/\bbrunch/i, 'restaurant'],
  [/\bdiner/i, 'restaurant'],
  [/\beatery/i, 'restaurant'],
  [/\bfood\s*(corp|inc|ltd|co\b)/i, 'restaurant'],
  [/\bfine\s*food/i, 'restaurant'],
  [/\bfoods?\b.*\binc/i, 'specialty_food'],
  [/\bfettuccine/i, 'restaurant'],
  [/\balmanac/i, 'restaurant'],
  [/\bexpress\b/i, 'fast_food'],
  [/\bflavou?rs?\b/i, 'restaurant'],
  [/\btropical/i, 'restaurant'],
  [/\bpersian/i, 'restaurant'],
  [/\bafrican?\b/i, 'restaurant'],
  [/\bcaribbean/i, 'restaurant'],

  // Bakery/dessert
  [/\bbeignet/i, 'bakery'],
  [/\bpastries/i, 'bakery'],
  [/\bcrepe/i, 'bakery'],
  [/\bhoney\b/i, 'specialty_food'],
  [/\bpoultry/i, 'specialty_food'],
  [/\bfresh\s*cuts/i, 'specialty_food'],
  [/\bsausage/i, 'specialty_food'],
  [/\bfarm\s*(shop|store)/i, 'specialty_food'],
  [/\bfarm\b/i, 'specialty_food'],
  [/\bacres\b/i, 'specialty_food'],
  [/\borchard/i, 'specialty_food'],
  [/\bwine\s*cellar/i, 'specialty_food'],
  [/\bbrew/i, 'pub'],
  [/\bcider/i, 'pub'],
  [/\bdistillery/i, 'pub'],

  // Ice cream
  [/\bice\s*cream/i, 'ice_cream'],
  [/\bgelato/i, 'ice_cream'],
  [/\bfrozen\s*(dream|yogurt|treat)/i, 'ice_cream'],
  [/\bcool\s*(delight|treats?)/i, 'ice_cream'],
  [/\bsundae/i, 'ice_cream'],
  [/\blemon/i, 'ice_cream'],

  // Bars/lounges
  [/\babstention/i, 'bar'],
  [/\bkaraoke/i, 'bar'],
  [/\bclub\b/i, 'bar'],
  [/\bcasino/i, 'bar'],
  [/\blounge/i, 'bar'],

  // Cafes/tea
  [/\btea\b/i, 'cafe'],
  [/\bbliss\b/i, 'cafe'],

  // Institutional - childcare/schools
  [/\becole\b/i, 'institutional'],
  [/\bécole\b/i, 'institutional'],
  [/\bgrandir/i, 'institutional'],
  [/\bbeginning/i, 'institutional'],
  [/\bbloom\b/i, 'institutional'],
  [/\bbettye\s*hyde/i, 'institutional'],
  [/\bandrew\s*fleck/i, 'institutional'],
  [/\baux\s*4\s*vents/i, 'institutional'],
  [/\bbrin\s*de\s*soleil/i, 'institutional'],
  [/\bexplorer/i, 'institutional'],
  [/\bhoppers/i, 'institutional'],
  [/\bnursery/i, 'institutional'],
  [/\bchildcare/i, 'institutional'],
  [/\bdaycare/i, 'institutional'],
  [/\bday\s*care/i, 'institutional'],
  [/\bchild\s*devel/i, 'institutional'],
  [/\bmult\.\s*child/i, 'institutional'],
  [/\bfilante/i, 'institutional'],
  [/\bcarson\s*grove/i, 'institutional'],
  [/\bcarleton\s*memorial/i, 'institutional'],

  // Institutional - seniors/care
  [/\bextendicare/i, 'institutional'],
  [/\batria\b/i, 'institutional'],
  [/\bmanor\b/i, 'institutional'],
  [/\bmeadows\b/i, 'institutional'],
  [/\bterrace\b/i, 'institutional'],
  [/\bgarden\s*(view|terrace)/i, 'institutional'],
  [/\bhospice/i, 'institutional'],
  [/\bhouse\b/i, 'institutional'],
  [/\blodge\b/i, 'institutional'],
  [/\bforest\s*(hill|valley)/i, 'institutional'],
  [/\bhazeldean\s*gardens/i, 'institutional'],
  [/\bbishop/i, 'institutional'],
  [/\bparish\b/i, 'institutional'],
  [/\bministr/i, 'institutional'],
  [/\bspirit/i, 'institutional'],

  // Institutional - corporate/government
  [/\beurest/i, 'institutional'],
  [/\bcompass\b/i, 'institutional'],
  [/\bbank\s*note/i, 'institutional'],
  [/\bcommissionaires/i, 'institutional'],
  [/\bcommunications\s*security/i, 'institutional'],
  [/\brcmp\b/i, 'institutional'],
  [/\bdiefenbaker/i, 'institutional'],
  [/\bnatural\s*resources/i, 'institutional'],
  [/\bcheo\b/i, 'institutional'],
  [/\btheratronics/i, 'institutional'],
  [/\btransitional/i, 'institutional'],
  [/\bempathy\s*house/i, 'institutional'],
  [/\bcci\b/i, 'institutional'],
  [/\bfamsac/i, 'institutional'],
  [/\bemergency\s*food/i, 'institutional'],

  // Institutional - community/events
  [/\bcommunity/i, 'institutional'],
  [/\bcomm\.\s*(assoc|centre|ctre)/i, 'institutional'],
  [/\bhall\b/i, 'institutional'],
  [/\bfield\s*house/i, 'institutional'],
  [/\bbluesfest/i, 'institutional'],
  [/\bfestival/i, 'institutional'],
  [/\bfair\b/i, 'institutional'],
  [/\bfun\s*(days?|haven)/i, 'institutional'],
  [/\bmuseum/i, 'institutional'],
  [/\bgigspace/i, 'institutional'],
  [/\bperformance/i, 'institutional'],
  [/\bbingo/i, 'institutional'],
  [/\blinks\b/i, 'sports_rec'], // golf
  [/\bgolf\b/i, 'sports_rec'],
  [/\bpadel\b/i, 'sports_rec'],
  [/\bskate\b/i, 'sports_rec'],
  [/\bplay\b/i, 'sports_rec'],
  [/\bsports\s*lab/i, 'sports_rec'],
  [/\bice\s*complex/i, 'sports_rec'],
  [/\bprovincial\s*park/i, 'institutional'],
  [/\bcemetery/i, 'institutional'],
  [/\bestates?\b/i, 'institutional'],
  [/\bbillings/i, 'institutional'],

  // Catering/food service
  [/\bculinary/i, 'catering'],
  [/\bconspiracy/i, 'catering'], // culinary conspiracy
  [/\bfood\s*service/i, 'catering'],
  [/\bsysco/i, 'catering'],
  [/\btannis/i, 'catering'],
  [/\bcash\s*(&|and)\s*carry/i, 'catering'],
  [/\bimport\s*export/i, 'specialty_food'],
  [/\bsupply\b/i, 'specialty_food'],
  [/\bwholesale/i, 'specialty_food'],

  // Hotels
  [/\baquatopia/i, 'hotel'],
];

function guessCategory(name) {
  const decoded = decodeHtml(name).toLowerCase();

  for (const [pattern, category] of MANUAL_RULES) {
    if (pattern.test(decoded)) {
      return category;
    }
  }

  return 'unknown';
}

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

function main() {
  const uncategorized = parseCSV(fs.readFileSync(path.join(CSV_DIR, 'oph_uncategorized.csv'), 'utf-8'));

  console.log(`Processing ${uncategorized.length} uncategorized establishments...\n`);

  const results = [];
  const counts = {};

  for (const row of uncategorized) {
    const category = guessCategory(row.NAME);
    counts[category] = (counts[category] || 0) + 1;
    results.push({
      ...row,
      CATEGORY: category,
    });
  }

  console.log('Category breakdown:');
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

  // Save the manual categorization
  const headers = ['ID', 'NAME', 'ADDRESS', 'LAST_INSPECTION', 'LATITUDE', 'LONGITUDE', 'CATEGORY'];
  fs.writeFileSync(
    path.join(CSV_DIR, 'oph_manual_categorized.csv'),
    toCSV(results, headers)
  );

  console.log(`\nSaved to: src/data/csv/oph_manual_categorized.csv`);

  // Show remaining unknowns
  const unknowns = results.filter(r => r.CATEGORY === 'unknown');
  console.log(`\n=== Still Unknown (${unknowns.length}) ===`);
  unknowns.forEach(u => {
    console.log(`  ${decodeHtml(u.NAME)} - ${u.ADDRESS}`);
  });
}

main();
