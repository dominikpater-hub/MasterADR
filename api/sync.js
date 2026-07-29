// Synchronizacja postępu per użytkownik. Wymaga tokenu sesji (Bearer).
//  GET  /api/sync           -> { ok, progress } (ostatni zapis serwera albo null)
//  POST /api/sync {progress} -> zapisuje {states, habit, updatedAt}
// Model: last-write-wins po updatedAt; merge robimy po stronie klienta przy logowaniu.
import { redis, requireAuth, progKey } from './_lib/auth.js';

const MAX_BYTES = 512 * 1024; // ochrona przed wielkim payloadem

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
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
      const rec = {
        states: progress.states || {},
        habit: progress.habit || null,
        updatedAt: Date.now(),
      };
      await redis.set(progKey(email), rec);
      return res.status(200).json({ ok: true, updatedAt: rec.updatedAt });
    }

    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'server_error', detail: String((e && e.message) || e).slice(0, 200) });
  }
}
