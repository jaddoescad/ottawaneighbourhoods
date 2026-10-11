#!/usr/bin/env node
/**
 * Before/after comparison of overall scores and ranks.
 *
 * Usage:
 *   node scripts/compare-scores.js <before data.json> [after data.json] [--out file.md]
 *
 * "before" is typically a copy of src/data/processed/data.json taken from the
 * base branch (git show main:src/data/processed/data.json > /tmp/before.json).
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outFile = outIdx >= 0 ? args.splice(outIdx, 2)[1] : null;
const [beforePath, afterPath = path.join(__dirname, '..', 'src', 'data', 'processed', 'data.json')] = args;
if (!beforePath) {
  console.error('Usage: node scripts/compare-scores.js <before data.json> [after data.json] [--out file.md]');
  process.exit(1);
}

const load = (p) => JSON.parse(fs.readFileSync(p, 'utf8')).neighbourhoods;
const before = Object.fromEntries(load(beforePath).map((n) => [n.id, n]));
const after = load(afterPath);

function spearman(pairs) {
  const rank = (vals) => {
    const sorted = vals.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    const r = new Array(vals.length);
    for (let i = 0; i < sorted.length; ) {
      let j = i;
      while (j + 1 < sorted.length && sorted[j + 1][0] === sorted[i][0]) j++;
      for (let k = i; k <= j; k++) r[sorted[k][1]] = (i + j) / 2 + 1;
      i = j + 1;
    }
    return r;
  };
  const a = rank(pairs.map((p) => p[0]));
  const b = rank(pairs.map((p) => p[1]));
  const mean = (x) => x.reduce((s, v) => s + v, 0) / x.length;
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return num / Math.sqrt(da * db);
}

const rows = after
  .filter((n) => before[n.id])
  .map((n) => {
    const b = before[n.id];
    return {
      id: n.id,
      name: n.name,
      beforeScore: b.overallScore,
      afterScore: n.overallScore,
      beforeRank: b.rank,
      afterRank: n.rank,
      range: n.rankRange ? `${n.rankRange.best}–${n.rankRange.worst}` : '',
      tier: n.tier,
      move: b.rank && n.rank ? b.rank - n.rank : null,
      incomplete: n.scoreIncomplete,
    };
  })
  .sort((x, y) => (x.afterRank || 999) - (y.afterRank || 999) || x.name.localeCompare(y.name));

const scores = (key) => rows.map((r) => r[key]).filter((v) => v !== null && v !== undefined);
const stat = (vals) => {
  const s = [...vals].sort((a, b) => a - b);
  return { min: s[0], median: s[Math.floor(s.length / 2)], max: s[s.length - 1] };
};
const moves = rows.filter((r) => r.move !== null).map((r) => Math.abs(r.move));
const bS = stat(scores('beforeScore'));
const aS = stat(scores('afterScore'));
const sign = (v) => (v > 0 ? `+${v}` : `${v}`);

const lines = [];
lines.push(`Compared ${rows.length} neighbourhoods.`);
lines.push('');
lines.push('| | Before | After |');
lines.push('|---|---|---|');
lines.push(`| Overall score range | ${bS.min}–${bS.max} (median ${bS.median}) | ${aS.min}–${aS.max} (median ${aS.median}) |`);
lines.push(`| Rank correlation with before (Spearman) | 1.00 | ${spearman(rows.filter((r) => r.move !== null).map((r) => [r.beforeRank, r.afterRank])).toFixed(2)} |`);
lines.push(`| Median rank change | – | ${moves.sort((a, b) => a - b)[Math.floor(moves.length / 2)]} places |`);
lines.push(`| Moved 20+ places | – | ${moves.filter((m) => m >= 20).length} |`);
lines.push('');

const table = (title, list) => {
  lines.push(`### ${title}`);
  lines.push('');
  lines.push('| Neighbourhood | Score before → after | Rank before → after | Likely rank range | Change |');
  lines.push('|---|---|---|---|---|');
  for (const r of list) {
    lines.push(
      `| ${r.name}${r.incomplete ? ' *' : ''} | ${r.beforeScore} → ${r.afterScore} | ${r.beforeRank} → ${r.afterRank} | ${r.range} | ${r.move === null ? '' : sign(r.move)} |`
    );
  }
  lines.push('');
};

table('Top 15 after', rows.slice(0, 15));
table('Bottom 10 after', rows.slice(-10));
const risers = [...rows].filter((r) => r.move !== null).sort((a, b) => b.move - a.move).slice(0, 10);
const fallers = [...rows].filter((r) => r.move !== null).sort((a, b) => a.move - b.move).slice(0, 10);
table('Biggest risers', risers);
table('Biggest fallers', fallers);

lines.push('<details><summary>All neighbourhoods</summary>');
lines.push('');
table('Full table', rows);
lines.push('</details>');
lines.push('');
if (rows.some((r) => r.incomplete)) lines.push('\\* At least one category has too little data and is left out of the overall score.');

const md = lines.join('\n');
if (outFile) fs.writeFileSync(outFile, md + '\n');
console.log(md);
