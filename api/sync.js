// Synchronizacja postępu per użytkownik. Wymaga tokenu sesji (Bearer).
//  GET  /api/sync           -> { ok, progress } (ostatni zapis serwera albo null)
//  POST /api/sync {progress} -> zapisuje {states, habit, updatedAt}
// Model: last-write-wins po updatedAt; merge robimy po stronie klienta przy logowaniu.
import { redis, requireAuth, progKey } from './_lib/auth.js';

const MAX_BYTES = 512 * 1024; // ochrona przed wielkim payloadem

// scalanie per-fakt: bierzemy bardziej zaawansowany stan (wyższe pudełko, potem więcej powtórek)
function mergeStates(a, b) {
  const byId = {};
  (Array.isArray(a) ? a : []).forEach((s) => { if (s && s.id) byId[s.id] = s; });
  (Array.isArray(b) ? b : []).forEach((s) => {
    if (!s || !s.id) return;
    const cur = byId[s.id];
    if (!cur) { byId[s.id] = s; return; }
    const better = (s.box || 0) > (cur.box || 0) ||
      ((s.box || 0) === (cur.box || 0) && (s.seen || 0) > (cur.seen || 0));
    if (better) byId[s.id] = s;
  });
  return Object.keys(byId).map((k) => byId[k]);
}
function pickHabit(prev, next) {
  if (!prev) return next || null;
  if (!next) return prev;
  return (next.updatedAt || 0) >= (prev.updatedAt || 0) ? next : prev;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://masteradr.vercel.app');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();

  let email;
  try {
    email = await requireAuth(req);
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
  if (!email) return res.status(401).json({ ok: false, error: 'auth_required' });

  try {
    if (req.method === 'GET') {
      const progress = await redis.get(progKey(email));
      return res.status(200).json({ ok: true, progress: progress || null });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
      body = body || {};
      const progress = body.progress || {};
      const size = JSON.stringify(progress).length;
      if (size > MAX_BYTES) return res.status(413).json({ ok: false, error: 'too_large' });
      const prev = (await redis.get(progKey(email))) || {};
      const rec = {
        states: mergeStates(prev.states, progress.states),
        habit: pickHabit(prev.habit, progress.habit),
        updatedAt: Date.now(),
      };
      await redis.set(progKey(email), rec);
      return res.status(200).json({ ok: true, updatedAt: rec.updatedAt });
    }

    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  } catch (e) {
    console.error('sync error', e && e.message);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}
