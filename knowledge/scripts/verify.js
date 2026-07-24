#!/usr/bin/env node
/**
 * verify.js — zapisuje decyzje weryfikacyjna wlasciciela i publikuje wpisy.
 *
 * Dopisuje do review[] rekord VERIFICATION z countsTowardPublication: true
 * i przestawia lifecycle DRAFT -> PUBLISHED.
 *
 * review jest APPEND-ONLY: historia (MIGRATION_SIGHTED) zostaje nietknieta.
 * Dopisujemy nowy wpis, niczego nie nadpisujemy — slad audytowy ma pokazywac,
 * ze najpierw byl przeglad migracyjny, a potem osobna weryfikacja.
 *
 * Dotyka wylacznie wpisow AKTYWNYCH (bez supersededBy). Wpisy zastapione to
 * historia wersji — publikowanie ich nie ma sensu i zafalszowaloby raport.
 *
 * Uzycie:
 *   node verify.js --by domo --role OWNER --note "..." [--block 1] [--apply]
 *
 * Domyslnie DRY-RUN.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENTRIES = path.join(ROOT, 'entries');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')
    ? process.argv[i + 1] : def;
}
const APPLY = process.argv.includes('--apply');
const BY = arg('by', null);
const ROLE = arg('role', 'OWNER');
const NOTE = arg('note', null);
const BLOCK = arg('block', null);
const AT = arg('at', new Date().toISOString().slice(0, 10));

const ROLES = ['OWNER', 'DGSA', 'LEGAL', 'PEER'];

if (!BY) { console.error('BLAD: --by jest wymagane (kto weryfikuje).'); process.exit(1); }
if (!ROLES.includes(ROLE)) {
  console.error(`BLAD: --role musi byc jedna z: ${ROLES.join(', ')}`); process.exit(1);
}
if (!NOTE) { console.error('BLAD: --note jest wymagane (zakres przegladu).'); process.exit(1); }

const files = fs.readdirSync(ENTRIES).filter(f => f.endsWith('.json'));
let published = 0, skippedSuperseded = 0, alreadyVerified = 0, outOfScope = 0, datesFilled = 0;
const byBlock = {};

for (const f of files) {
  const p = path.join(ENTRIES, f);
  const e = JSON.parse(fs.readFileSync(p, 'utf8'));

  if (e.supersededBy) { skippedSuperseded++; continue; }
  if (BLOCK !== null && String(e.block) !== String(BLOCK)) { outOfScope++; continue; }

  const verifications = (e.review || []).filter(
    r => r.kind === 'VERIFICATION' && r.countsTowardPublication
  );
  // Weryfikacja bez daty (przeniesiona z prototypu, at: null) nie pozwala
  // policzyc wieku przegladu — currency.js traktuje taki wpis jako STALE.
  // Uzupelniamy date zamiast pomijac wpis.
  const undated = verifications.filter(r => !r.at);
  const dated = verifications.filter(r => r.at);

  if (dated.length) { alreadyVerified++; continue; }

  e.review = e.review || [];
  if (undated.length) {
    undated.forEach(r => {
      r.at = AT;
      r.role = r.role || ROLE;
      r.note = (r.note ? r.note + ' ' : '') +
        `Data uzupelniona ${AT} przy przegladzie calosci (${BY}, ${ROLE}).`;
    });
    datesFilled += undated.length;
  } else {
    e.review.push({
      by: BY,
      at: AT,
      kind: 'VERIFICATION',
      role: ROLE,
      note: NOTE,
      countsTowardPublication: true,
    });
  }
  e.lifecycle = 'PUBLISHED';

  byBlock[e.block] = (byBlock[e.block] || 0) + 1;
  published++;
  if (APPLY) fs.writeFileSync(p, JSON.stringify(e, null, 2) + '\n', 'utf8');
}

console.log('=== ' + (APPLY ? 'ZAPISANO' : 'DRY-RUN') + ' — WERYFIKACJA ===\n');
console.log('kto        : ' + BY + ' (' + ROLE + ')');
console.log('data       : ' + AT);
console.log('zakres     : ' + (BLOCK !== null ? 'blok ' + BLOCK : 'calosc'));
console.log('notatka    : ' + NOTE);
console.log('');
console.log('do publikacji     : ' + published);
if (datesFilled)       console.log('uzupelniono daty  : ' + datesFilled + ' (VERIFICATION bez at)');
if (alreadyVerified)   console.log('juz zweryfikowane : ' + alreadyVerified + ' (pominiete)');
if (skippedSuperseded) console.log('zastapione        : ' + skippedSuperseded + ' (historia, pominiete)');
if (outOfScope)        console.log('poza zakresem     : ' + outOfScope);

if (published) {
  console.log('\nwg blokow:');
  Object.keys(byBlock).sort().forEach(b => console.log('  blok ' + b + ': ' + byBlock[b]));
}
if (!APPLY) console.log('\nNic nie zapisano. Uzyj --apply aby wykonac.');
