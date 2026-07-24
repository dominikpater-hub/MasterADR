#!/usr/bin/env node
/**
 * MIGRACJA MASOWA EDYCJI (carry-forward) — obsluga EDITION_LAPSED
 *
 * Przenosi wpisy z wygaslej edycji na nastepna, zachowujac niezmiennosc:
 * stary wpis NIE jest nadpisywany. Powstaje nowy wpis z supersedes,
 * stary dostaje supersededBy. Wiedza wersjonowana lancuchem (ADR-002).
 *
 * KLUCZOWE OGRANICZENIE — to NIE jest automatyczne zatwierdzenie (P-19).
 * Skrypt produkuje wpisy w lifecycle: DRAFT z pustym review.
 * Nowy wpis nie dziedziczy weryfikacji starego — przeniesienie na nowa edycje
 * jest twierdzeniem o swiecie ("ten przepis sie nie zmienil"), ktore ktos musi wypowiedziec.
 *
 * --dry-run pokazuje co by sie stalo, bez zapisu.
 *
 * Uzycie: node carry-forward.js --from adr-2023 --to adr-2025 [--dry-run] [--apply]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i+1] && !args[i+1].startsWith('--') ? args[i+1] : d; };
const DRY = !args.includes('--apply');

const ROOT = path.resolve(__dirname, '..');
const FROM = arg('from', 'adr-2023');
const TO = arg('to', 'adr-2025');
const ENTRIES = path.join(ROOT, 'entries');
const TODAY = new Date().toISOString().slice(0, 10);

function main() {
  const files = fs.readdirSync(ENTRIES).filter(f => f.endsWith('.json'));
  const entries = files.map(f => JSON.parse(fs.readFileSync(path.join(ENTRIES, f), 'utf8')));

  const candidates = entries.filter(e =>
    (e.editionRefs || []).includes(FROM) && !e.supersededBy
  );

  console.log(`=== CARRY-FORWARD ${FROM} -> ${TO} ${DRY ? '(DRY-RUN)' : '(APPLY)'} ===\n`);
  console.log(`Kandydatow: ${candidates.length}`);

  if (!candidates.length) { console.log('Nic do przeniesienia.'); return; }

  // Grupowanie po temacie — kolejka przegladu ma byc tematyczna, nie alfabetyczna.
  // 212 wpisow to nie 212 decyzji: to ~N decyzji tematycznych.
  const byTopic = {};
  for (const e of candidates) {
    const k = `b${e.block}/${e.topic}`;
    (byTopic[k] = byTopic[k] || []).push(e);
  }
  const topics = Object.entries(byTopic).sort((a, b) => b[1].length - a[1].length);

  console.log(`Tematow do przegledu: ${topics.length}`);
  console.log(`\nTo jest realna miara pracy: nie ${candidates.length} decyzji, tylko ${topics.length}.\n`);
  console.log('Najwieksze grupy:');
  topics.slice(0, 12).forEach(([t, arr]) => console.log(`  ${String(arr.length).padStart(3)}  ${t}`));
  if (topics.length > 12) console.log(`  ...  i ${topics.length - 12} tematow mniej licznych`);

  if (DRY) {
    console.log('\n--- DRY-RUN: nic nie zapisano. Uzyj --apply aby wykonac. ---');
    console.log('Po --apply powstanie ' + candidates.length + ' nowych wpisow w lifecycle DRAFT,');
    console.log('kazdy z pustym review — do zatwierdzenia przez wlasciciela (P-19).');
    return;
  }

  let created = 0;
  for (const e of candidates) {
    const newId = `${e.id}@${TO}`;
    const fresh = {
      ...e,
      id: newId,
      // factId = stabilna tozsamosc faktu PONAD edycjami.
      // Bez tego zgloszenia w Redis (kluczowane po factId) urwalyby sie
      // przy kazdym carry-forward — historia uwag przestalaby sie wiazac z wpisem.
      factId: e.factId || e.id,
      editionRefs: (e.editionRefs || []).map(r => (r === FROM ? TO : r)),
      lifecycle: 'DRAFT',
      review: [],                 // nowa edycja = nowe twierdzenie, weryfikacja sie nie dziedziczy
      drift: null,
      supersedes: e.id,
      supersededBy: null,
      carriedForwardAt: TODAY,
      carriedForwardFrom: FROM,
      migratedAt: e.migratedAt,
    };
    fs.writeFileSync(path.join(ENTRIES, `${newId}.json`), JSON.stringify(fresh, null, 2) + '\n');

    const old = { ...e, supersededBy: newId };
    fs.writeFileSync(path.join(ENTRIES, `${e.id}.json`), JSON.stringify(old, null, 2) + '\n');
    created++;
  }
  console.log(`\nUtworzono nowych wpisow: ${created}`);
  console.log(`Oznaczono supersededBy  : ${created}`);
  console.log('\nWszystkie nowe w DRAFT z pustym review. Publikacja wymaga decyzji wlasciciela.');
}

main();
