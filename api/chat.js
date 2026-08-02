// Franek — przewodnik po wiedzy ADR (czat). Vercel serverless.
// Grounding: 239 faktów ADR 2025 (retrieval po słowach kluczowych) wstrzykiwane do promptu.
// Provider: ANTHROPIC_API_KEY (Claude) albo OPENAI_API_KEY (GPT). Bez klucza -> grzeczny offline.
// Zależności: brak (global fetch). Rate-limit best-effort, jeśli jest Redis (KV_*/UPSTASH_*).
import { KB } from './_lib/adr-knowledge.js';
import { requireAuth, redis } from './_lib/auth.js';

const MAX_MSG = 2000;      // znaków w pojedynczej wiadomości użytkownika
const MAX_TURNS = 16;      // ile ostatnich tur bierzemy pod uwagę
const TOP_K = 12;          // ile faktów wstrzykujemy jako kontekst
const RATE_PER_HOUR = 40;      // zapytań/godzinę z jednego KONTA
const RATE_GLOBAL_DAY = 3000;  // twardy globalny sufit dzienny — ochrona klucza API

const MODEL_ANTHROPIC = process.env.FRANEK_MODEL || 'claude-haiku-4-5-20251001';
const MODEL_OPENAI = process.env.FRANEK_MODEL_OPENAI || 'gpt-4o-mini';

const clip = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');

const PL_MAP = { 'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ż':'z','ź':'z' };
function norm(s) {
  return String(s || '').toLowerCase().replace(/[ąćęłńóśżź]/g, (c) => PL_MAP[c] || c);
}
const STOP = new Set(('i oraz w we na do z za o u a co jak czy to jest są być czym ile kiedy gdzie'
  + ' dla po od bez pod nad przy ten ta to te czy jaki jaka jakie ktory ktora ktore adr').split(/\s+/));

// Prosty „stemmer" PL: obcięcie do rdzenia (6 znaków) zdejmuje końcówki fleksyjne,
// więc „gaśnicami" i „gaśnica" trafiają w to samo (po norm: „gasnic"). Krótkie słowa bez zmian.
function stem(w) { return w.length > 6 ? w.slice(0, 6) : w; }
function retrieve(query) {
  const qt = norm(query).split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w)).map(stem);
  if (!qt.length) return KB.slice(0, TOP_K);
  const scored = KB.map((e) => {
    const hay = norm(e.topic + ' ' + e.why + ' ' + e.adrRef + ' ' + e.blockName);
    const hayTopic = norm(e.topic), hayRef = norm(e.adrRef);
    let s = 0;
    for (const w of qt) { if (hay.includes(w)) s += 1; }
    // lekka premia za trafienie w temat/odnośnik
    for (const w of qt) { if (hayTopic.includes(w) || hayRef.includes(w)) s += 0.5; }
    return { e, s };
  }).filter((x) => x.s > 0);
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, TOP_K).map((x) => x.e);
}

function buildContext(items) {
  return items.map((e, i) =>
    `[${i + 1}] Blok ${e.block} (${e.blockName}) · temat: ${e.topic} · ${e.adrRef}\n${e.why}`
  ).join('\n\n');
}

function systemPrompt(ctx) {
  return [
    'Jesteś Franek — przyjazny przewodnik po wiedzy ADR w aplikacji MasterADR (transport towarów niebezpiecznych).',
    'Odpowiadasz po polsku, konkretnie i rzeczowo, prostym językiem kierowcy. Krótko: 2–6 zdań, listy tylko gdy pomagają.',
    'Odpowiadasz WYŁĄCZNIE na podstawie poniższej wiedzy ADR (edycja ADR 2025, 239 zweryfikowanych faktów). Nie korzystasz z wiedzy ogólnej modelu.',
    'Gdy odpowiadasz, powołaj się na odnośnik ADR z kontekstu (np. „ADR 1.1.3.1").',
    'Jeśli odpowiedzi NIE ma w powyższej wiedzy — nie zgaduj i nie wymyślaj przepisów. Powiedz wprost, że tego nie ma w materiale (239 faktów), i odeślij do aktualnego ADR lub doradcy DGSA.',
    'Możesz łączyć i streszczać fakty z kontekstu oraz tłumaczyć je prościej, ale nie dodawaj informacji spoza niego.',
    'Pamiętaj: to pomoc w nauce, nie zastępuje kursu ani egzaminu państwowego.',
    '',
    'WIEDZA ADR (jedyne dozwolone źródło odpowiedzi):',
    ctx || '(brak dopasowanego faktu — powiedz, że tego nie ma w materiale i nie zgaduj)',
  ].join('\n');
}

function sanitizeMessages(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  const out = [];
  for (const m of arr.slice(-MAX_TURNS)) {
    const role = m && m.role === 'assistant' ? 'assistant' : 'user';
    const content = clip(m && m.content, MAX_MSG);
    if (content) out.push({ role, content });
  }
  // musi kończyć się turą użytkownika
  while (out.length && out[out.length - 1].role !== 'user') out.pop();
  return out;
}

async function callAnthropic(sys, messages) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL_ANTHROPIC,
      max_tokens: 700,
      system: sys,
      messages,
    }),
  });
  if (!r.ok) throw new Error('anthropic_' + r.status + '_' + (await r.text()).slice(0, 300));
  const j = await r.json();
  return (j.content || []).map((b) => b.text || '').join('').trim();
}

async function callOpenAI(sys, messages) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
    },
    body: JSON.stringify({
      model: MODEL_OPENAI,
      max_tokens: 700,
      messages: [{ role: 'system', content: sys }, ...messages],
    }),
  });
  if (!r.ok) throw new Error('openai_' + r.status + '_' + (await r.text()).slice(0, 300));
  const j = await r.json();
  return (j.choices && j.choices[0] && j.choices[0].message.content || '').trim();
}

// Limit per KONTO (nie IP) + twardy globalny sufit dzienny. FAIL-CLOSED:
// gdy Redis nie odpowiada, nie przepuszczamy — ochrona kosztów jest ważniejsza niż wygoda.
async function rateCheck(email) {
  try {
    const hour = new Date().toISOString().slice(0, 13);
    const day = new Date().toISOString().slice(0, 10);
    const acctKey = `madr:chatrl:acct:${email}:${hour}`;
    const globKey = `madr:chatrl:glob:${day}`;
    const n = await redis.incr(acctKey);
    if (n === 1) await redis.expire(acctKey, 3600);
    if (n > RATE_PER_HOUR) return { ok: false, why: 'acct' };
    const g = await redis.incr(globKey);
    if (g === 1) await redis.expire(globKey, 86400);
    if (g > RATE_GLOBAL_DAY) return { ok: false, why: 'global' };
    return { ok: true };
  } catch (e) {
    return { ok: false, why: 'error' };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://masteradr.vercel.app');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  // Franek jest za logowaniem — chroni koszty i wiąże rozmowy z kontem.
  let authEmail = null;
  try { authEmail = await requireAuth(req); } catch (e) { authEmail = null; }
  if (!authEmail) {
    return res.status(401).json({
      ok: false,
      error: 'auth_required',
      reply: 'Żeby porozmawiać z Frankiem, zaloguj się na swoje konto MasterADR. '
        + 'Dzięki temu Twój postęp synchronizuje się między urządzeniami. 🛻',
    });
  }

  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  if (!hasAnthropic && !hasOpenAI) {
    return res.status(200).json({
      ok: false,
      error: 'no_provider',
      reply: 'Przewodnik Franka nie jest jeszcze włączony — brakuje klucza API modelu. '
        + 'Poproś administratora o dodanie ANTHROPIC_API_KEY (Claude) lub OPENAI_API_KEY w ustawieniach. '
        + 'W międzyczasie ćwicz spokojnie — zbieram Twoje uwagi do każdego pytania. 🛻',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const messages = sanitizeMessages(body.messages);
    if (!messages.length) return res.status(400).json({ ok: false, error: 'empty' });

    const rl = await rateCheck(authEmail);
    if (!rl.ok) {
      const msg = rl.why === 'global'
        ? 'Franek ma dziś komplet pytań (limit dzienny). Wróć jutro. 🛻'
        : rl.why === 'error'
          ? 'Chwilowo nie mogę odpowiadać (serwis limitów). Spróbuj za moment. 🛻'
          : 'Sporo dziś pytań z Twojego konta! Daj mi chwilę i spróbuj za moment. 🛻';
      return res.status(429).json({ ok: false, error: 'rate_limited', reply: msg });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const ctx = buildContext(retrieve(lastUser ? lastUser.content : ''));
    const sys = systemPrompt(ctx);

    const reply = hasAnthropic ? await callAnthropic(sys, messages) : await callOpenAI(sys, messages);
    return res.status(200).json({ ok: true, reply: reply || 'Hmm, nie mam na to dobrej odpowiedzi. Spróbuj zapytać inaczej.' });
  } catch (err) {
    console.error('chat error', err && err.message);
    return res.status(200).json({
      ok: false, error: 'server_error',
      reply: 'Coś mi się zacięło po drodze. Spróbuj ponownie za chwilę.',
    });
  }
}
