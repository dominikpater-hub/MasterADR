#!/usr/bin/env node
/**
 * WALIDATOR + RAPORT AKTUALNOSCI
 *
 * Sprawdza integralnosc schematu v2 i liczy currency dla calej bazy.
 * Buduje library/currency-index.json — materializowany cache, NIE zrodlo prawdy.
 * Mozna skasowac i odtworzyc z entries/ + editions/ + policy.json.
 *
 * Uzycie: node report.js [--entries DIR] [--asOf YYYY-MM-DD] [--json]
 */

const fs = require('fs');
const path = require('path');
const { computeCurrency, computeTrustLevel, channelGate } = require('./currency.js');

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i+1] && !args[i+1].startsWith('--') ? args[i+1] : d; };

const ROOT = path.resolve(__dirname, '..');
const ENTRIES = arg('entries', path.join(ROOT, 'entries'));
const ASOF = arg('asOf', new Date().toISOString().slice(0, 10));
const AS_JSON = args.includes('--json');

const REQUIRED = ['schemaVersion','id','adrRef','editionRefs','jurisdictions','source','lifecycle','review','why'];

function load() {
  const editions = {};
  for (const f of fs.readdirSync(path.join(ROOT, 'editions'))) {
    if (!f.endsWith('.json')) continue;
    const ed = JSON.parse(fs.readFileSync(path.join(ROOT, 'editions', f), 'utf8'));
    editions[ed.id] = ed;
  }
  const policy = JSON.parse(fs.readFileSync(path.join(ROOT, 'policy.json'), 'utf8'));
  const entries = fs.readdirSync(ENTRIES)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(ENTRIES, f), 'utf8')));
  return { editions, policy, entries };
}

function validate(entries, editions) {
  const errors = [];
  const ids = new Set();
  for (const e of entries) {
    for (const k of REQUIRED) {
      if (e[k] === undefined) errors.push(`${e.id || '?'}: brak pola "${k}"`);
    }
    if (ids.has(e.id)) errors.push(`${e.id}: duplikat id`);
    ids.add(e.id);
    if (e.schemaVersion !== 2) errors.push(`${e.id}: schemaVersion=${e.schemaVersion}, oczekiwano 2`);
    if (!Array.isArray(e.editionRefs) || !e.editionRefs.length) errors.push(`${e.id}: editionRefs puste`);
    else for (const r of e.editionRefs) if (!editions[r]) errors.push(`${e.id}: nieznana edycja "${r}"`);
    if ('edition' in e) errors.push(`${e.id}: pozostalo stare pole "edition"`);
    if ('nextReviewDue' in e) errors.push(`${e.id}: pole "nextReviewDue" nie powinno istniec (currency jest liczone)`);
    if (!e.why || !e.why.trim()) errors.push(`${e.id}: puste why`);
  }
  return errors;
}

function main() {
  const { editions, policy, entries: allEntries } = load();

  // Wpisy zastapione (supersededBy) to HISTORIA wersji — zostaja w magazynie
  // dla sladu audytowego, ale nie ida do zadnego kanalu. Liczenie ich razem
  // z aktywnymi zawyzalo LAPSED po kazdym carry-forward.
  const superseded = allEntries.filter(e => e.supersededBy);
  const entries = allEntries.filter(e => !e.supersededBy);

  const errors = validate(allEntries, editions);
  const out = { asOf: ASOF, total: entries.length, superseded: superseded.length,
                errors, currency: {}, trust: {}, channels: {}, lapsedDetail: {} };

  const idx = [];
  for (const e of entries) {
    const c = computeCurrency(e, editions, policy, ASOF);
    const t = computeTrustLevel(e, c.currency, policy);
    out.currency[c.currency] = (out.currency[c.currency] || 0) + 1;
    out.trust[t] = (out.trust[t] || 0) + 1;
    for (const ch of Object.keys(policy.channels)) {
      const verdict = channelGate(c.currency, ch, policy);
      out.channels[ch] = out.channels[ch] || {};
      out.channels[ch][verdict] = (out.channels[ch][verdict] || 0) + 1;
    }
    if (c.currency === 'LAPSED') {
      const key = (c.migrateTo || []).join(',') || 'brak nastepcy';
      out.lapsedDetail[key] = (out.lapsedDetail[key] || 0) + 1;
    }
    idx.push({ id: e.id, currency: c.currency, trustLevel: t, reasons: c.reasons, migrateTo: c.migrateTo || [] });
  }

  fs.mkdirSync(path.join(ROOT, 'library'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'library', 'currency-index.json'),
    JSON.stringify({ builtAt: new Date().toISOString(), asOf: ASOF, note: 'CACHE — odtwarzalny z entries/ + editions/ + policy.json', entries: idx }, null, 2));

  if (AS_JSON) { console.log(JSON.stringify(out, null, 2)); return; }

  console.log(`=== RAPORT AKTUALNOSCI (asOf ${ASOF}) ===\n`);
  console.log(`Wpisow aktywnych: ${entries.length}`);
  if (superseded.length) console.log(`Zastapionych (historia, poza dystrybucja): ${superseded.length}`);
  console.log(`Bledy schematu: ${errors.length}`);
  errors.slice(0, 15).forEach(e => console.log('   ! ' + e));
  if (errors.length > 15) console.log(`   ... i ${errors.length - 15} wiecej`);

  console.log('\n--- currency ---');
  for (const [k, v] of Object.entries(out.currency).sort((a,b)=>b[1]-a[1])) {
    console.log(`  ${k.padEnd(9)} ${String(v).padStart(4)}`);
  }
  if (Object.keys(out.lapsedDetail).length) {
    console.log('\n  LAPSED — cel migracji:');
    for (const [k, v] of Object.entries(out.lapsedDetail)) console.log(`    -> ${k.padEnd(12)} ${v} wpisow`);
  }

  console.log('\n--- trustLevel (mapCurrencyToT2=' + policy.trustLadderCompat.mapCurrencyToT2 + ') ---');
  for (const [k, v] of Object.entries(out.trust).sort()) console.log(`  ${k.padEnd(9)} ${String(v).padStart(4)}`);

  console.log('\n--- bramki kanalowe ---');
  for (const [ch, verdicts] of Object.entries(out.channels)) {
    const parts = Object.entries(verdicts).map(([v, n]) => `${v}=${n}`).join('  ');
    console.log(`  ${ch.padEnd(14)} ${parts}`);
  }

  console.log('\nZapisano: library/currency-index.json (cache, odtwarzalny)');
}

main();
