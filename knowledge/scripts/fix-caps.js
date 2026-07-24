#!/usr/bin/env node
/**
 * fix-caps.js — przywraca wersaliki utracone przy migracji diakrytykow.
 *
 * Migracja zamienila CAPS na Zdanie ("OGLADA" -> "Ogląda"), gubiac
 * emfaze na czasowniku kluczowym w zadaniach typu "dopasuj role".
 * Docelowo ma byc CAPS Z diakrytykami: "OGLĄDA".
 *
 * Zrodlo prawdy: caps-do-naprawy.csv (kolumny: id, jest, powinno_byc).
 * Podmiana wylacznie:
 *   - we wskazanym wpisie (po id),
 *   - dokladnego tokenu `jest` -> `powinno_byc`,
 *   - w polach tekstowych q.* (prompt/options/pairs/correct/hint) oraz why.
 *
 * Domyslnie DRY-RUN. Zapis dopiero z --apply.
 */
const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const ENTRIES = path.join(__dirname, '..', 'entries');
const CSV = path.join(__dirname, '..', 'caps-do-naprawy.csv');

// --- CSV z obsluga cudzyslowow ---
function parseCsv(text) {
  const lines = text.trim().split('\n');
  const head = splitRow(lines[0]);
  return lines.slice(1).filter(Boolean).map(l => {
    const cells = splitRow(l);
    const o = {};
    head.forEach((h, i) => (o[h] = cells[i]));
    return o;
  });
}
function splitRow(line) {
  const out = [];
  let cur = '', q = false;
  for (const ch of line) {
    if (ch === '"') { q = !q; continue; }
    if (ch === ',' && !q) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

// Podmiana calego slowa, z poszanowaniem polskich liter jako znakow slowa.
const WORD = 'A-Za-z0-9ĄĆĘŁŃÓŚŻŹąćęłńóśżź';
function replaceToken(str, from, to) {
  if (typeof str !== 'string') return { out: str, n: 0 };
  const re = new RegExp(`(^|[^${WORD}])(${escapeRe(from)})(?=[^${WORD}]|$)`, 'g');
  let n = 0;
  const out = str.replace(re, (m, pre) => { n++; return pre + to; });
  return { out, n };
}
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Rekurencyjnie po polach tekstowych; klucze obiektow tez (pairs maja tekst w kluczu).
function walk(node, from, to, count) {
  if (typeof node === 'string') {
    const r = replaceToken(node, from, to);
    count.n += r.n;
    return r.out;
  }
  if (Array.isArray(node)) return node.map(v => walk(v, from, to, count));
  if (node && typeof node === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(node)) {
      const rk = replaceToken(k, from, to);
      count.n += rk.n;
      o[rk.out] = walk(v, from, to, count);
    }
    return o;
  }
  return node;
}

const rows = parseCsv(fs.readFileSync(CSV, 'utf8'));
const byId = {};
for (const r of rows) {
  if (!r.id || !r.jest || !r.powinno_byc) continue;
  (byId[r.id] = byId[r.id] || []).push(r);
}

let filesTouched = 0, totalRepl = 0, missing = [], noHit = [];

for (const [id, list] of Object.entries(byId)) {
  const file = path.join(ENTRIES, id + '.json');
  if (!fs.existsSync(file)) { missing.push(id); continue; }
  const entry = JSON.parse(fs.readFileSync(file, 'utf8'));
  let entryRepl = 0;

  for (const r of list) {
    if (r.jest === r.powinno_byc) continue;      // nic do roboty
    const count = { n: 0 };
    // naprawiamy tylko tresc dydaktyczna, nie metadane
    if (entry.q)   entry.q   = walk(entry.q, r.jest, r.powinno_byc, count);
    if (entry.why) entry.why = walk(entry.why, r.jest, r.powinno_byc, count);
    if (count.n === 0) noHit.push(`${id}: "${r.jest}" -> "${r.powinno_byc}"`);
    entryRepl += count.n;
  }

  if (entryRepl > 0) {
    filesTouched++; totalRepl += entryRepl;
    if (APPLY) fs.writeFileSync(file, JSON.stringify(entry, null, 2) + '\n', 'utf8');
    console.log(`  ${id.padEnd(32)} ${entryRepl} podmian`);
  }
}

console.log('\n=== ' + (APPLY ? 'ZASTOSOWANO' : 'DRY-RUN') + ' ===');
console.log('regul w CSV:      ' + rows.length);
console.log('wpisow dotknietych: ' + filesTouched);
console.log('podmian lacznie:  ' + totalRepl);
if (missing.length) console.log('BRAK PLIKU:       ' + missing.join(', '));
if (noHit.length) {
  console.log('\nBEZ TRAFIENIA (' + noHit.length + ') — token nie wystapil w tresci:');
  noHit.forEach(s => console.log('  ' + s));
}
if (!APPLY) console.log('\nNic nie zapisano. Uzyj --apply aby wykonac.');
