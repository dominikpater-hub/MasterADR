import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// ---- limity ochronne -------------------------------------------------
const MAX_MSG = 1000;        // znakow w polu tekstowym
const MAX_BATCH = 50;        // zgloszen w jednej paczce synchronizacji
const RATE_PER_HOUR = 60;    // zgloszen/godzine z jednego IP
const KEEP_DAYS = 180;       // po tylu dniach wpisy wygasaja

const CATS = ['blad', 'literowka', 'niejasne', 'trudne'];

const clip = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');

// IP tylko do rate limitu, hashowane — nie zapisujemy go przy zgloszeniu.
async function hashIp(ip) {
  const data = new TextEncoder().encode('madr:' + ip);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const ip =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const ipKey = await hashIp(ip);

    // Rate limit: licznik na godzine, sam wygasa.
    const rlKey = `madr:rl:${ipKey}:${new Date().toISOString().slice(0, 13)}`;
    const hits = await redis.incr(rlKey);
    if (hits === 1) await redis.expire(rlKey, 3600);
    if (hits > RATE_PER_HOUR) {
      return res.status(429).json({ ok: false, error: 'rate_limited' });
    }

    const body =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const items = Array.isArray(body.items) ? body.items : [body];

    if (!items.length) {
      return res.status(400).json({ ok: false, error: 'empty' });
    }
    if (items.length > MAX_BATCH) {
      return res.status(413).json({ ok: false, error: 'batch_too_large' });
    }

    const accepted = [];
    const pipe = redis.pipeline();

    for (const it of items) {
      const factId = clip(it.factId, 80);
      if (!factId) continue;

      const cat = CATS.includes(it.cat) ? it.cat : 'inne';
      const entry = {
        factId,
        topic: clip(it.topic, 120),
        cat,
        msg: clip(it.msg, MAX_MSG),
        ts: Number(it.ts) || Date.now(),
        got: Date.now(),
        build: clip(it.build, 40),
        // celowo NIE zapisujemy IP ani niczego identyfikujacego urzadzenie
      };

      // cid = deterministyczne id klienta -> idempotencja przy retry
      const cid = clip(it.cid, 60) || `${factId}:${entry.ts}`;
      const key = `madr:fb:${cid}`;

      pipe.set(key, JSON.stringify(entry), { ex: KEEP_DAYS * 86400, nx: true });
      pipe.zadd('madr:fb:index', { score: entry.got, member: cid });
      pipe.hincrby('madr:fb:stats:fact', factId, 1);
      pipe.hincrby('madr:fb:stats:cat', cat, 1);
      accepted.push(cid);
    }

    if (!accepted.length) {
      return res.status(400).json({ ok: false, error: 'no_valid_items' });
    }

    await pipe.exec();
    return res.status(200).json({ ok: true, accepted });
  } catch (err) {
    console.error('feedback error', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}
