#!/usr/bin/env node
/**
 * MOST ZGLOSZEN: Redis (backend Franka) -> inbox/ biblioteki
 *
 * Zamyka petle, ktorej dzis nie ma: zgloszenie od kierowcy trafia do Redis
 * pod factId i tam umiera. Nikt go nie laczy z wpisem, nikt nie podnosi drift.
 *
 * CO TEN SKRYPT ROBI:
 *   pobiera zgloszenia z /api/feedback-admin, grupuje po factId,
 *   dopasowuje do wpisow w entries/ i zapisuje do inbox/ jako SYGNAL.
 *
 * CZEGO NIE ROBI (i to jest celowe — P-19):
 *   nie ustawia drift, nie zmienia currency, nie dotyka entries/.
 *   Zgloszenie kierowcy to obserwacja, nie werdykt. Trzech kierowcow moze
 *   zglosic "blad", bo nie rozumieja przepisu — to sygnal o TRESCI (moze
 *   niejasna), nie dowod, ze prawo sie zmienilo. Rozstrzyga wlasciciel.
 *
 * Kategoria zgloszenia niesie rozna wage:
 *   blad      -> moze wskazywac na drift LUB na bledna tresc
 *   literowka -> prawie na pewno tresc, nie prawo
 *   niejasne  -> sygnal dla 006-C (te same 3 rozmyte tematy!)
 *   trudne    -> sygnal dydaktyczny, nie prawny
 *
 * Uzycie:
 *   node feedback-bridge.js --url https://masteradr.vercel.app --token XXX [--limit 1000]
 *   node feedback-bridge.js --file zgloszenia.json     (offline, z pobranego JSON)
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i+1] && !args[i+1].startsWith('--') ? args[i+1] : d; };

const ROOT = path.resolve(__dirname, '..');
const URL_BASE = arg('url', null);
const TOKEN = arg('token', null);
const FILE = arg('file', null);
const LIMIT = arg('limit', '1000');

// Progi eskalacji — w polityce, nie w kodzie.
const ESCALATE = {
  blad: 2,      // 2+ zgloszen "blad" na jeden fakt -> warte spojrzenia
  niejasne: 3,  // 3+ "niejasne" -> problem z trescia (006-C)
  literowka: 1,
  trudne: 5,
};

async function fetchFeedback() {
  if (FILE) return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (!URL_BASE || !TOKEN) {
    console.error('Podaj --url i --token, albo --file z pobranym JSON.');
    process.exit(1);
  }
  const u = `${URL_BASE}/api/feedback-admin?token=${encodeURIComponent(TOKEN)}&limit=${LIMIT}`;
  const res = await fetch(u);
  if (!res.ok) throw new Error(`HTTP ${res.status} z /api/feedback-admin`);
  return res.json();
}

function loadEntries() {
  const dir = path.join(ROOT, 'entries');
  const byFactId = new Map();
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const e = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (e.supersededBy) continue; // interesuje nas aktualna wersja faktu
    const k = e.factId || e.id;
    byFactId.set(k, e);
  }
  return byFactId;
}

async function main() {
  console.log('=== MOST ZGLOSZEN: Redis -> inbox/ ===\n');

  const data = await fetchFeedback();
  const items = data.items || [];
  console.log(`Pobrano zgloszen: ${items.length}`);

  const entries = loadEntries();
  console.log(`Wpisow w bibliotece (aktualne wersje): ${entries.size}\n`);

  // grupowanie po factId
  const byFact = new Map();
  for (const it of items) {
    const k = it.factId;
    if (!k) continue;
    if (!byFact.has(k)) byFact.set(k, { factId: k, topic: it.topic, cats: {}, msgs: [], first: it.ts, last: it.ts });
    const g = byFact.get(k);
    g.cats[it.cat] = (g.cats[it.cat] || 0) + 1;
    if (it.msg) g.msgs.push({ cat: it.cat, msg: it.msg, ts: it.ts });
    g.first = Math.min(g.first, it.ts);
    g.last = Math.max(g.last, it.ts);
  }

  const orphans = [];
  const signals = [];

  for (const [factId, g] of byFact) {
    const entry = entries.get(factId);
    if (!entry) { orphans.push(factId); continue; }

    const escalated = Object.entries(g.cats)
      .filter(([cat, n]) => n >= (ESCALATE[cat] || 99))
      .map(([cat, n]) => `${cat}×${n}`);

    if (!escalated.length) continue;

    signals.push({
      kind: 'USER_REPORT',
      factId,
      entryId: entry.id,
      topic: g.topic || entry.topic,
      counts: g.cats,
      escalated,
      samples: g.msgs.slice(0, 5),
      firstSeen: new Date(g.first).toISOString().slice(0, 10),
      lastSeen: new Date(g.last).toISOString().slice(0, 10),
      status: 'PENDING',          // czeka na decyzje wlasciciela
      decision: null,             // wlasciciel wpisuje: DRIFT | CONTENT | DISMISS
      note: 'Sygnal od uzytkownikow. NIE jest dowodem zmiany prawa — rozstrzyga wlasciciel (P-19).',
    });
  }

  const inbox = path.join(ROOT, 'inbox');
  fs.mkdirSync(inbox, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(inbox, `user-reports-${stamp}.json`);

  fs.writeFileSync(file, JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: FILE || URL_BASE,
    totalReports: items.length,
    factsWithReports: byFact.size,
    escalated: signals.length,
    orphans,
    signals,
  }, null, 2));

  console.log(`Faktow ze zgloszeniami : ${byFact.size}`);
  console.log(`Eskalowanych do inbox  : ${signals.length}`);
  console.log(`Sierot (brak wpisu)    : ${orphans.length}`);
  if (orphans.length) {
    console.log('  ! ' + orphans.slice(0, 10).join(', '));
    console.log('  Sieroty = zgloszenia do faktow, ktorych nie ma w bibliotece.');
    console.log('  Zwykle znaczy: aplikacja wyprzedza biblioteke, albo factId sie rozjechalo.');
  }

  if (signals.length) {
    console.log('\nNajmocniejsze sygnaly:');
    signals.sort((a, b) => Object.values(b.counts).reduce((x,y)=>x+y,0) - Object.values(a.counts).reduce((x,y)=>x+y,0));
    signals.slice(0, 10).forEach(s =>
      console.log(`  ${s.factId.padEnd(30)} ${s.escalated.join(' ')}  (${s.topic})`));
  }

  console.log(`\nZapisano: ${path.relative(ROOT, file)}`);
  console.log('\nNASTEPNY KROK (czlowiek): przejrzyj inbox, dla kazdego sygnalu wpisz decision:');
  console.log('  DRIFT   -> zrodlo sie zmienilo   -> ustaw drift w entries/, wpis -> DRIFTED');
  console.log('  CONTENT -> tresc jest niejasna   -> przeredaguj why (Verified Knowledge First)');
  console.log('  DISMISS -> zgloszenie nietrafione -> zamknij bez zmian');
}

main().catch(err => { console.error('BLAD:', err.message); process.exit(1); });
