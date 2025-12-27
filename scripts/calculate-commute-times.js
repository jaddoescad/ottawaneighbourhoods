/**
 * Calculate commute times to downtown Ottawa for all neighbourhoods
 * Uses neighbourhood centroids and estimates based on distance + transit access
 */

const fs = require('fs');
const path = require('path');

// Downtown Ottawa (Parliament Hill area)
const DOWNTOWN = { lat: 45.4236, lng: -75.6998 };

// Haversine distance calculation
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Load the processed data to get neighbourhood info
const dataPath = path.join(__dirname, '../src/data/processed/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('Calculating commute times for', data.neighbourhoods.length, 'neighbourhoods...\n');

const commuteTimes = [];

for (const n of data.neighbourhoods) {
  // Get centroid from boundaries
  let centroidLat = 0, centroidLng = 0, pointCount = 0;

  for (const boundary of n.boundaries) {
    for (const ring of boundary.rings) {
      for (const point of ring) {
        centroidLng += point[0];
        centroidLat += point[1];
        pointCount++;
      }
    }
  }

  if (pointCount === 0) {
    console.log('No boundary data for:', n.name);
    continue;
  }

  centroidLat /= pointCount;
  centroidLng /= pointCount;

  // Calculate distance to downtown
  const distanceKm = haversineDistance(centroidLat, centroidLng, DOWNTOWN.lat, DOWNTOWN.lng);

  // Estimate car commute time
  // - Under 5km: mostly city streets, ~20-25 km/h average with lights
  // - 5-15km: mix of arterials, ~30-35 km/h average
  // - 15-30km: highway access likely, ~45-50 km/h average
  // - 30km+: mostly highway, ~55-60 km/h average
  // Add 5-10 min for parking/walking
  let carSpeed;
  if (distanceKm < 5) {
    carSpeed = 22;
  } else if (distanceKm < 15) {
    carSpeed = 32;
  } else if (distanceKm < 30) {
    carSpeed = 48;
  } else {
    carSpeed = 55;
  }

  let carCommute = Math.round((distanceKm / carSpeed) * 60);
  // Add parking/walking time
  if (distanceKm < 5) {
    carCommute += 5;
  } else {
    carCommute += 8;
  }

  // Estimate transit commute time based on O-Train access
  const hasOTrain = n.distanceToOTrain && n.distanceToOTrain < 2;
  const hasTransitway = n.distanceToTransitway && n.distanceToTransitway < 1.5;
  const hasRapidTransit = hasOTrain || hasTransitway;

  let transitCommute;
  if (distanceKm < 3) {
    // Walking distance to downtown
    transitCommute = Math.round(distanceKm * 12) + 5; // ~5 km/h walking
  } else if (hasOTrain) {
    // O-Train is fast - roughly 35-40 km/h including stops
    // Add time to get to station + wait
    const timeToStation = Math.round(n.distanceToOTrain * 12); // walk to station
    const trainTime = Math.round((distanceKm * 0.7) / 35 * 60); // train covers ~70% of distance
    transitCommute = timeToStation + 5 + trainTime + 5; // wait + walk at end
  } else if (hasTransitway) {
    // Transitway buses are decent - roughly 25-30 km/h
    const timeToStation = Math.round(n.distanceToTransitway * 12);
    const busTime = Math.round((distanceKm * 0.8) / 28 * 60);
    transitCommute = timeToStation + 8 + busTime + 5;
  } else {
    // Regular bus service - much slower
    // Typically 15-20 km/h average with stops, transfers
    if (distanceKm < 10) {
      transitCommute = Math.round(distanceKm * 4) + 15; // local bus
    } else if (distanceKm < 20) {
      transitCommute = Math.round(distanceKm * 3.5) + 20; // express routes available
    } else {
      transitCommute = Math.round(distanceKm * 3) + 30; // long distance, transfers
    }
  }

  // Cap transit time at reasonable maximum
  transitCommute = Math.min(transitCommute, 120);

  // Determine primary commute method
  let method = 'car';
  if (distanceKm < 3) {
    method = 'walk/bike';
  } else if (hasOTrain && transitCommute < carCommute + 10) {
    method = 'transit';
  } else if (distanceKm < 8 && n.bikeScore > 60) {
    method = 'mixed';
  }

  // Generate notes
  let notes = '';
  if (distanceKm < 3) {
    notes = 'Walking/cycling distance to downtown';
  } else if (hasOTrain) {
    notes = `O-Train access (${n.nearestOTrainLine} - ${n.nearestOTrainStation})`;
  } else if (hasTransitway) {
    notes = `Transitway access (${n.nearestTransitwayStation})`;
  } else if (distanceKm > 25) {
    notes = 'Highway commute; limited transit options';
  } else {
    notes = 'Bus routes to downtown; moderate distance';
  }

  commuteTimes.push({
    id: n.id,
    name: n.name,
    commuteToDowntown: carCommute,
    commuteByTransit: transitCommute,
    commuteMethod: method,
    distanceKm: Math.round(distanceKm * 10) / 10,
    source: 'Calculated from centroid distance',
    notes: notes
  });

  console.log(`${n.name}: ${carCommute} min (car) / ${transitCommute} min (transit) - ${distanceKm.toFixed(1)} km`);
}

// Sort by name
commuteTimes.sort((a, b) => a.name.localeCompare(b.name));

// Write CSV
const csvPath = path.join(__dirname, '../src/data/csv/commute_times.csv');
const header = 'id,name,commuteToDowntown,commuteByTransit,commuteMethod,distanceKm,source,notes';
const rows = commuteTimes.map(c =>
  `${c.id},${c.name.replace(/,/g, '')},${c.commuteToDowntown},${c.commuteByTransit},${c.commuteMethod},${c.distanceKm},"${c.source}","${c.notes}"`
);

fs.writeFileSync(csvPath, header + '\n' + rows.join('\n'));
console.log(`\nWritten ${commuteTimes.length} entries to ${csvPath}`);

// Show summary
console.log('\n=== SUMMARY ===');
console.log('Closest to downtown:');
commuteTimes.sort((a, b) => a.commuteToDowntown - b.commuteToDowntown);
commuteTimes.slice(0, 5).forEach(c => console.log(`  ${c.name}: ${c.commuteToDowntown} min`));

console.log('\nFarthest from downtown:');
commuteTimes.slice(-5).reverse().forEach(c => console.log(`  ${c.name}: ${c.commuteToDowntown} min`));
