#!/usr/bin/env node

/**
 * Fetches daily BTC options trading notional volume from Deribit API v2.
 *
 * Uses two endpoints:
 *  1. public/get_trade_volumes - aggregated 24h volumes
 *  2. public/ticker (via book summary) - per-instrument detail with USD volume
 *
 * Run: node scripts/fetch-deribit-volume.js
 */

const https = require('https');

const BASE_URL = 'https://www.deribit.com';

function apiCall(method, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const path = `/api/v2/public/${method}${qs ? '?' + qs : ''}`;

  return new Promise((resolve, reject) => {
    https.get(`${BASE_URL}${path}`, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(JSON.stringify(parsed.error)));
          else resolve(parsed.result);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching Deribit BTC options daily trading volume...\n');

  // 1) Aggregated trade volumes (24h)
  const volumes = await apiCall('get_trade_volumes');
  const btcEntry = volumes.find(v => v.currency === 'BTC' || v.currency === 'bitcoin');

  if (btcEntry) {
    console.log('=== Aggregated 24h Trade Volumes (BTC) ===');
    console.log(`  Futures volume:  ${btcEntry.futures_volume ?? 'N/A'} BTC`);
    console.log(`  Options volume:  ${btcEntry.options_volume ?? 'N/A'} BTC`);
    console.log(`  Futures USD:     $${(btcEntry.futures_volume_usd ?? 0).toLocaleString()}`);
    console.log(`  Options USD:     $${(btcEntry.options_volume_usd ?? 0).toLocaleString()}`);
    console.log();
  } else {
    console.log('BTC entry not found in trade volumes. Available:', volumes.map(v => v.currency));
  }

  // 2) Get BTC index price for notional calculation
  const indexResult = await apiCall('get_index_price', { index_name: 'btc_usd' });
  const btcPrice = indexResult.index_price;
  console.log(`BTC Index Price: $${btcPrice.toLocaleString()}\n`);

  // 3) Book summary for all BTC options - includes per-instrument volume
  const bookSummary = await apiCall('get_book_summary_by_currency', {
    currency: 'BTC',
    kind: 'option',
  });

  let totalVolumeBTC = 0;
  let totalVolumeUSD = 0;
  let totalOpenInterest = 0;
  let instrumentCount = 0;

  const topByVolume = [];

  for (const inst of bookSummary) {
    const vol = inst.volume ?? 0;
    const volUsd = inst.volume_usd ?? (vol * btcPrice);
    totalVolumeBTC += vol;
    totalVolumeUSD += volUsd;
    totalOpenInterest += inst.open_interest ?? 0;
    instrumentCount++;

    if (vol > 0) {
      topByVolume.push({
        name: inst.instrument_name,
        volume: vol,
        volumeUSD: volUsd,
        openInterest: inst.open_interest ?? 0,
        last: inst.last,
        markPrice: inst.mark_price,
      });
    }
  }

  topByVolume.sort((a, b) => b.volumeUSD - a.volumeUSD);

  console.log('=== BTC Options — 24h Summary ===');
  console.log(`  Total instruments:     ${instrumentCount}`);
  console.log(`  Active (volume > 0):   ${topByVolume.length}`);
  console.log(`  Total volume (BTC):    ${totalVolumeBTC.toFixed(2)} BTC`);
  console.log(`  Total notional (USD):  $${totalVolumeUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
  console.log(`  Total open interest:   ${totalOpenInterest.toFixed(2)} BTC`);
  console.log(`  OI notional (USD):     $${(totalOpenInterest * btcPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
  console.log();

  console.log('=== Top 15 Instruments by Notional Volume ===');
  console.log(
    'Instrument'.padEnd(35) +
    'Vol (BTC)'.padStart(12) +
    'Notional (USD)'.padStart(18) +
    'OI (BTC)'.padStart(12)
  );
  console.log('-'.repeat(77));

  for (const inst of topByVolume.slice(0, 15)) {
    console.log(
      inst.name.padEnd(35) +
      inst.volume.toFixed(2).padStart(12) +
      ('$' + inst.volumeUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })).padStart(18) +
      inst.openInterest.toFixed(2).padStart(12)
    );
  }

  // Output as JSON for programmatic use
  const output = {
    timestamp: new Date().toISOString(),
    btcIndexPrice: btcPrice,
    aggregated24h: btcEntry || null,
    optionsSummary: {
      totalInstruments: instrumentCount,
      activeInstruments: topByVolume.length,
      totalVolumeBTC: totalVolumeBTC,
      totalNotionalUSD: totalVolumeUSD,
      totalOpenInterestBTC: totalOpenInterest,
      totalOpenInterestUSD: totalOpenInterest * btcPrice,
    },
    topInstruments: topByVolume.slice(0, 30),
  };

  const fs = require('fs');
  const outPath = 'deribit-btc-options-volume.json';
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nJSON output saved to ${outPath}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
