#!/usr/bin/env node
/**
 * Count weekday morning-peak departures at every OC Transpo stop.
 *
 * Source: OC Transpo GTFS
 *   https://oct-gtfs-emasagcnfmcgeham.z01.azurefd.net/public-access/GTFSExport.zip
 *   Unzip into scripts/data/gtfs/ (not committed; ~270 MB).
 *
 * Picks the busiest Tuesday-Thursday in the feed as the representative weekday,
 * then counts departures between 07:00 and 09:00 at each stop.
 *
 * Output: src/data/csv/transit_stop_frequency.csv
 *   stopId, stopName, lat, lng, rail (1 = O-Train), amPeakDepartures,
 *   lineDepartures ("route:direction=count ..."), so a route passing several
 *   nearby stops can be counted once when measuring service near a home.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { readCSV, toCSV } = require('./lib/geo');

const gtfsDir = path.join(__dirname, 'data', 'gtfs');
const csvDir = path.join(__dirname, '..', 'src', 'data', 'csv');
const PEAK_START = 7 * 3600;
const PEAK_END = 9 * 3600;
const DAY_COLUMNS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function parseDate(s) {
  return new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)));
}

function formatDate(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function activeServices(date, calendar, exceptions) {
  const ymd = formatDate(date);
  const day = DAY_COLUMNS[date.getUTCDay()];
  const active = new Set();
  for (const c of calendar) {
    if (c[day] === '1' && c.start_date <= ymd && c.end_date >= ymd) active.add(c.service_id);
  }
  for (const e of exceptions) {
    if (e.date !== ymd) continue;
    if (e.exception_type === '1') active.add(e.service_id);
    if (e.exception_type === '2') active.delete(e.service_id);
  }
  return active;
}

function toSeconds(t) {
  const [h, m, s] = t.split(':').map(Number);
  return h * 3600 + m * 60 + s;
}

async function main() {
  if (!fs.existsSync(path.join(gtfsDir, 'stop_times.txt'))) {
    throw new Error('GTFS not found. Download GTFSExport.zip and unzip into scripts/data/gtfs/');
  }
  const calendar = readCSV(path.join(gtfsDir, 'calendar.txt'));
  const exceptions = fs.existsSync(path.join(gtfsDir, 'calendar_dates.txt'))
    ? readCSV(path.join(gtfsDir, 'calendar_dates.txt'))
    : [];
  const routes = readCSV(path.join(gtfsDir, 'routes.txt'));
  const trips = readCSV(path.join(gtfsDir, 'trips.txt'));
  const stops = readCSV(path.join(gtfsDir, 'stops.txt'));

  const railRoutes = new Set(routes.filter((r) => r.route_type === '0' || r.route_type === '2').map((r) => r.route_id));
  const tripsByService = {};
  for (const t of trips) tripsByService[t.service_id] = (tripsByService[t.service_id] || 0) + 1;

  const start = parseDate(calendar.reduce((m, c) => (c.start_date < m ? c.start_date : m), '99999999'));
  const end = parseDate(calendar.reduce((m, c) => (c.end_date > m ? c.end_date : m), '00000000'));
  let best = null;
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) {
    const dow = d.getUTCDay();
    if (dow < 2 || dow > 4) continue;
    const services = activeServices(d, calendar, exceptions);
    const tripCount = [...services].reduce((s, id) => s + (tripsByService[id] || 0), 0);
    if (!best || tripCount > best.tripCount) best = { date: d, services, tripCount };
  }
  console.log(`Representative weekday: ${formatDate(best.date)} (${best.tripCount} trips)`);

  const activeTrips = new Map();
  for (const t of trips) {
    if (!best.services.has(t.service_id)) continue;
    activeTrips.set(t.trip_id, { rail: railRoutes.has(t.route_id), line: `${t.route_id}:${t.direction_id || 0}` });
  }

  const departures = new Map();
  const lineDepartures = new Map();
  const railStops = new Set();
  const rl = readline.createInterface({ input: fs.createReadStream(path.join(gtfsDir, 'stop_times.txt')) });
  let header = null;
  for await (const line of rl) {
    const cols = line.split(',');
    if (!header) {
      header = Object.fromEntries(cols.map((c, i) => [c.trim(), i]));
      continue;
    }
    const tripId = cols[header.trip_id];
    if (!activeTrips.has(tripId)) continue;
    const dep = cols[header.departure_time] || cols[header.arrival_time];
    if (!dep) continue;
    const secs = toSeconds(dep);
    if (secs < PEAK_START || secs >= PEAK_END) continue;
    const stopId = cols[header.stop_id];
    const trip = activeTrips.get(tripId);
    departures.set(stopId, (departures.get(stopId) || 0) + 1);
    if (!lineDepartures.has(stopId)) lineDepartures.set(stopId, new Map());
    const lines = lineDepartures.get(stopId);
    lines.set(trip.line, (lines.get(trip.line) || 0) + 1);
    if (trip.rail) railStops.add(stopId);
  }

  const rows = stops
    .filter((s) => departures.has(s.stop_id))
    .map((s) => ({
      stopId: s.stop_id,
      stopName: s.stop_name,
      lat: s.stop_lat,
      lng: s.stop_lon,
      rail: railStops.has(s.stop_id) ? 1 : 0,
      amPeakDepartures: departures.get(s.stop_id),
      lineDepartures: [...lineDepartures.get(s.stop_id).entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([line, n]) => `${line}=${n}`)
        .join(' '),
    }));
  fs.writeFileSync(
    path.join(csvDir, 'transit_stop_frequency.csv'),
    toCSV(rows, ['stopId', 'stopName', 'lat', 'lng', 'rail', 'amPeakDepartures', 'lineDepartures'])
  );
  console.log(`Saved peak frequency for ${rows.length} stops (${railStops.size} O-Train platforms)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
