#!/usr/bin/env node
/**
 * MIGRACJA SCHEMATU v1 -> v2 (Guardian Knowledge)
 *
 * Co robi:
 *   1. wyciaga tablice `uo` z prototypu HTML (parser nawiasowy, nie regex)
 *   2. zamienia `edition: "ADR 2023"` (string) na `editionRefs: ["adr-2023"]` (tablica referencji)
 *   3. dodaje `jurisdictions: ["PL"]` — pole potrzebne przy 2. jurysdykcji, tanie teraz, drogie pozniej
 *   4. dodaje `review` z historia przegladow (append-only)
 *   5. NIE dodaje nextReviewDue — currency jest liczone, nie przechowywane
 *
 * Czego NIE robi:
 *   - nie nadaje trustLevel (006-B: deterministyczne z metadanych, przy odczycie)
 *   - nie publikuje (P-19: zatwierdza wylacznie wlasciciel)
 *   - nie dotyka pola `why` (Verified Knowledge First)
 *
 * Uzycie:
 *   node migrate.js --src <prototyp.html> --out <katalog> [--owner <id>] [--sighted] [--force]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def;
};
const flag = (name) => args.includes('--' + name);

const SRC = arg('src', '/mnt/project/MasterADR-prototyp-v2.html');
const OUT = arg('out', './entries');
const OWNER = arg('owner', 'domo');
const SIGHTED = flag('sighted');
const FORCE = flag('force');
const MIGRATION_DATE = new Date().toISOString().slice(0, 10);

// --- mapowanie edycji: string w prototypie -> id bytu edycji ---
const EDITION_MAP = {
  'ADR 2023': 'adr-2023',
  'ADR 2025': 'adr-2025',
};

/** Wyciaga literal tablicy `uo=[...]` zliczajac nawiasy, z pominieciem stringow. */
function extractUo(src) {
  const marker = 'uo=[';
  const start = src.indexOf(marker);
  if (start < 0) throw new Error('Nie znaleziono tablicy `uo=[` w zrodle.');
  const open = start + marker.length - 1;
  let depth = 0, inStr = null, esc = false;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (inStr) { if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return src.slice(open, i + 1); }
  }
  throw new Error('Tablica `uo` nie zostala domknieta.');
}

function migrateEntry(e) {
  const editionId = EDITION_MAP[e.edition];
  if (!editionId) throw new Error(`Wpis ${e.id}: nieznana edycja "${e.edition}".`);

  const review = [];

  // Przeglad migracyjny: zapisujemy to, co sie FAKTYCZNIE stalo — obejrzenie zadan
  // w prototypie. Odrebny reviewKind, ktorego bramka publikacji NIE liczy.
  if (SIGHTED) {
    review.push({
      by: OWNER,
      at: MIGRATION_DATE,
      kind: 'MIGRATION_SIGHTED',
      note: 'Przeglad zadan w prototypie przed migracja. Nie jest weryfikacja zrodlowa.',
      countsTowardPublication: false,
    });
  }

  // Istniejacy verifiedBy z prototypu — to byla realna weryfikacja, zachowujemy jako pelna.
  if (e.verifiedBy) {
    review.push({
      by: e.verifiedBy,
      at: null, // prototyp nie zapisywal daty — null jest uczciwy, data zmyslona nie
      kind: 'VERIFICATION',
      note: 'Przeniesione z pola verifiedBy prototypu. Data nieznana.',
      countsTowardPublication: true,
    });
  }

  return {
    schemaVersion: 2,
    id: e.id,
    // factId — tozsamosc faktu STABILNA ponad edycjami. `id` zmienia sie przy
    // carry-forward (b1-def -> b1-def@adr-2025), factId nie. Zgloszenia od
    // kierowcow w Redis sa kluczowane wlasnie po tym polu.
    factId: e.id,

    // --- tozsamosc zrodlowa ---
    adrRef: e.adrRef,
    editionRefs: [editionId],        // A: tablica, nie skalar — wpis moze stac na kilku edycjach
    jurisdictions: ['PL'],           // E: pole dodane teraz, choc dzis wszystkie takie same
    source: e.source,
    page: e.page,
    status: e.status,

    // --- klasyfikacja dydaktyczna ---
    block: e.block,
    topic: e.topic,
    kind: e.kind,
    scope: e.scope,
    formats: e.formats,

    // --- tresc (nietykana) ---
    why: e.why,
    q: e.q,

    // --- cykl zycia ---
    lifecycle: 'DRAFT',
    review,                          // append-only, historia zamiast pojedynczego pola
    drift: null,                     // ustawiane wylacznie decyzja wlasciciela z inbox/
    supersedes: null,
    supersededBy: null,

    migratedAt: MIGRATION_DATE,
  };
}

function main() {
  console.log('=== MIGRACJA SCHEMATU v1 -> v2 ===\n');

  const src = fs.readFileSync(SRC, 'utf8');
  const uo = eval(extractUo(src));
  console.log(`Wczytano wpisow: ${uo.length}`);

  if (fs.existsSync(OUT) && fs.readdirSync(OUT).length && !FORCE) {
    console.error(`\nBLAD: katalog ${OUT} nie jest pusty. Uzyj --force aby nadpisac.`);
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  const seen = new Set();
  let written = 0;
  const problems = [];

  for (const e of uo) {
    if (seen.has(e.id)) { problems.push(`duplikat id: ${e.id}`); continue; }
    seen.add(e.id);
    try {
      const m = migrateEntry(e);
      fs.writeFileSync(path.join(OUT, `${m.id}.json`), JSON.stringify(m, null, 2) + '\n');
      written++;
    } catch (err) {
      problems.push(`${e.id}: ${err.message}`);
    }
  }

  console.log(`Zapisano plikow  : ${written}`);
  console.log(`Problemy         : ${problems.length}`);
  problems.forEach(p => console.log('   ! ' + p));

  console.log('\nPrzeglady migracyjne:');
  console.log(`  MIGRATION_SIGHTED : ${SIGHTED ? written + ' (nie licza sie do publikacji)' : 'wylaczone (brak --sighted)'}`);
  const verified = uo.filter(e => e.verifiedBy).length;
  console.log(`  VERIFICATION      : ${verified} (przeniesione z verifiedBy)`);

  console.log('\nUsuniete pola: edition (string) -> editionRefs (tablica ref)');
  console.log('Dodane pola  : schemaVersion, editionRefs, jurisdictions, lifecycle, review[], drift, supersedes, supersededBy');
  console.log('NIE dodano   : nextReviewDue — currency jest liczone przy odczycie, nie przechowywane');
}

main();
