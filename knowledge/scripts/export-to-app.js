#!/usr/bin/env node
/**
 * EKSPORT BIBLIOTEKI -> BUNDLE MasterADR
 *
 * Kierunek jednokierunkowy, build-time: entries/ jest zrodlem prawdy,
 * index.html jest artefaktem. Nigdy odwrotnie.
 *
 * Co robi:
 *   1. czyta entries/ + editions/ + policy.json
 *   2. liczy currency dla kazdego wpisu (asOf = dzien builda)
 *   3. odrzuca wpisy, ktorych bramka kanalowa nie przepuszcza
 *   4. splaszcza schemat v2 z powrotem do ksztaltu `uo` oczekiwanego przez aplikacje
 *   5. dokleja pola aktualnosci, zeby aplikacja mogla pokazac etykiete
 *   6. podmienia tablice `uo=[...]` w index.html
 *
 * DLACZEGO build-time a nie fetch:
 *   PWA jest offline-first. Osobny knowledge.json to drugi niezaleznie
 *   cache'owany zasob — kierowca moglby dostac nowa aplikacje ze stara baza.
 *   Jeden artefakt = jedna wersja = brak rozjazdu.
 *
 * Uzycie:
 *   node export-to-app.js --app <index.html> --out <index.html> [--channel offline_pack] [--asOf DATA]
 */

const fs = require('fs');
const path = require('path');
const { computeCurrency, computeTrustLevel, channelGate } = require('./currency.js');

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i+1] && !args[i+1].startsWith('--') ? args[i+1] : d; };

const ROOT = path.resolve(__dirname, '..');
const APP_IN = arg('app', null);
const APP_OUT = arg('out', null);
const CHANNEL = arg('channel', 'offline_pack');
const ASOF = arg('asOf', new Date().toISOString().slice(0, 10));

if (!APP_IN || !APP_OUT) {
  console.error('Uzycie: node export-to-app.js --app <index.html> --out <index.html> [--channel offline_pack]');
  process.exit(1);
}

/** Znajduje literal tablicy `uo=[...]` zliczajac nawiasy, z pominieciem stringow. */
function findUo(src) {
  const marker = 'uo=[';
  const start = src.indexOf(marker);
  if (start < 0) throw new Error('Nie znaleziono `uo=[` w aplikacji.');
  const open = start + marker.length - 1;
  let depth = 0, inStr = null, esc = false;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (inStr) { if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return { open, close: i }; }
  }
  throw new Error('Tablica `uo` nie zostala domknieta.');
}

/** Schemat v2 -> ksztalt `uo` oczekiwany przez aplikacje (wstecznie zgodny). */
function toAppShape(entry, editions, currency, trustLevel) {
  const ed = editions[entry.editionRefs[0]];
  return {
    // pola oryginalne — aplikacja ich uzywa, nie ruszamy nazw.
    // UWAGA: do aplikacji idzie factId (stabilne), NIE entry.id (zmienia sie
    // przy carry-forward). Dzieki temu zgloszenia w Redis wiaza sie z faktem
    // ponad edycjami — historia uwag przezywa przejscie ADR 2023 -> 2025.
    id: entry.factId || entry.id,
    block: entry.block,
    topic: entry.topic,
    kind: entry.kind,
    scope: entry.scope,
    adrRef: entry.adrRef,
    source: entry.source,
    page: entry.page,
    edition: ed ? ed.label : entry.editionRefs[0],
    status: entry.status,
    verifiedBy: (entry.review || []).find(r => r.kind === 'VERIFICATION' && r.countsTowardPublication)?.by || null,
    formats: entry.formats,
    why: entry.why,
    q: entry.q,

    // NOWE pola z biblioteki — aplikacja moze je zignorowac (wsteczna zgodnosc)
    _currency: currency,
    _trust: trustLevel,
    _editionRef: entry.editionRefs[0],
    _lifecycle: entry.lifecycle,
    _entryId: entry.id,   // konkretna wersja wpisu — do namierzenia pliku w bibliotece
  };
}

function main() {
  const editions = {};
  for (const f of fs.readdirSync(path.join(ROOT, 'editions'))) {
    if (!f.endsWith('.json')) continue;
    const e = JSON.parse(fs.readFileSync(path.join(ROOT, 'editions', f), 'utf8'));
    editions[e.id] = e;
  }
  const policy = JSON.parse(fs.readFileSync(path.join(ROOT, 'policy.json'), 'utf8'));
  const entries = fs.readdirSync(path.join(ROOT, 'entries'))
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(ROOT, 'entries', f), 'utf8')));

  console.log(`=== EKSPORT DO APLIKACJI (kanal: ${CHANNEL}, asOf: ${ASOF}) ===\n`);

  const out = [];
  const rejected = { block: 0 };
  const byCurrency = {};

  for (const e of entries) {
    if (e.supersededBy) continue; // wpis zastapiony — do aplikacji idzie nastepca

    const c = computeCurrency(e, editions, policy, ASOF);
    const t = computeTrustLevel(e, c.currency, policy);
    byCurrency[c.currency] = (byCurrency[c.currency] || 0) + 1;

    const verdict = channelGate(c.currency, CHANNEL, policy);
    if (verdict === 'block') { rejected.block++; continue; }

    out.push(toAppShape(e, editions, c.currency, t));
  }

  console.log('currency w bibliotece:');
  Object.entries(byCurrency).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k.padEnd(9)} ${v}`));
  console.log(`\nDo aplikacji trafia : ${out.length}`);
  console.log(`Zablokowane bramka  : ${rejected.block}`);

  if (!out.length) {
    console.error('\nBLAD: bramka odrzucila wszystko. Sprawdz policy.json albo zrob carry-forward.');
    process.exit(1);
  }

  if (rejected.block > out.length) {
    console.warn(`\nUWAGA: bramka blokuje wiecej wpisow (${rejected.block}) niz przepuszcza (${out.length}).`);
    console.warn('Kierowca dostanie okrojona aplikacje. Rozwaz carry-forward przed deployem.');
  }

  const src = fs.readFileSync(APP_IN, 'utf8');
  const { open, close } = findUo(src);
  const literal = JSON.stringify(out);
  const patched = src.slice(0, open) + literal + src.slice(close + 1);

  fs.writeFileSync(APP_OUT, patched);
  console.log(`\nZapisano: ${APP_OUT}`);
  console.log(`Rozmiar : ${src.length} -> ${patched.length} znakow`);
  console.log('\nPAMIETAJ: podbij CACHE w sw.js, inaczej recenzenci zobacza stara wersje.');
}

main();
