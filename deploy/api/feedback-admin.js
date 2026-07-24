import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Porownanie odporne na timing attack.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toCsv(rows) {
  const cols = ['got', 'ts', 'factId', 'topic', 'cat', 'msg', 'build'];
  const esc = (v) => {
    const s = v === undefined || v === null ? '' : String(v);
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const head = cols.join(';');
  const body = rows.map((r) =>
    cols.map((c) => {
      if (c === 'got' || c === 'ts') {
        return r[c] ? new Date(r[c]).toISOString() : '';
      }
      return esc(r[c]);
    }).join(';')
  );
  return '\uFEFF' + [head, ...body].join('\n'); // BOM -> Excel czyta ogonki
}

export default async function handler(req, res) {
  const secret = process.env.FEEDBACK_ADMIN_TOKEN;
  if (!secret) {
    return res.status(500).json({ ok: false, error: 'admin_token_not_set' });
  }

  const given =
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '') ||
    (req.query.token || '');

  if (!safeEqual(given, secret)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  try {
    const limit = Math.min(Number(req.query.limit) || 200, 1000);
    const format = (req.query.format || 'json').toLowerCase();

    // najnowsze najpierw
    const ids = await redis.zrange('madr:fb:index', 0, limit - 1, { rev: true });
    if (!ids.length) {
      return res.status(200).json({ ok: true, count: 0, items: [] });
    }

    const raw = await redis.mget(...ids.map((id) => `madr:fb:${id}`));
    const items = raw
      .filter(Boolean)
      .map((r) => (typeof r === 'string' ? JSON.parse(r) : r));

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="franek-zgloszenia.csv"'
      );
      return res.status(200).send(toCsv(items));
    }

    const [byFact, byCat, total] = await Promise.all([
      redis.hgetall('madr:fb:stats:fact'),
      redis.hgetall('madr:fb:stats:cat'),
      redis.zcard('madr:fb:index'),
    ]);

    // najczesciej zglaszane fakty na gorze
    const top = Object.entries(byFact || {})
      .map(([factId, n]) => ({ factId, n: Number(n) }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 25);

    return res.status(200).json({
      ok: true,
      total,
      returned: items.length,
      byCat: byCat || {},
      topFacts: top,
      items,
    });
  } catch (err) {
    console.error('admin error', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}
