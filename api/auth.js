// Konta MasterADR: rejestracja / logowanie / me / wylogowanie.
// E-mail + hasło (PBKDF2 w Redis). Token sesji w odpowiedzi -> klient trzyma w localStorage.
import {
  redis, normEmail, validEmail, hashPassword, verifyPassword,
  getUser, saveUser, createSession, getSessionEmail, destroySession, bearer,
} from './_lib/auth.js';

const MIN_PASS = 8;
const MAX_PASS = 200;
const MAX_NAME = 60;
const RATE_PER_HOUR = 30; // prób logowania/rejestracji na IP
// Publiczny Client ID (Web) — służy do weryfikacji odbiorcy (aud) tokenu Google.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
  || '272890735121-jenj9r0a46cjdggrier025ss0446k04j.apps.googleusercontent.com';

const clip = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '');

async function rateOk(ip) {
  try {
    const k = 'madr:authrate:' + ip;
    const n = await redis.incr(k);
    if (n === 1) await redis.expire(k, 3600);
    return n <= RATE_PER_HOUR;
  } catch (e) { return true; }
}

function publicUser(u) {
  return { email: u.email, name: u.name || '', createdAt: u.createdAt, provider: u.provider || 'password' };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const action = String(body.action || '');
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

  try {
    if (action === 'me') {
      const email = await getSessionEmail(bearer(req));
      if (!email) return res.status(200).json({ ok: false, error: 'not_authenticated' });
      const u = await getUser(email);
      if (!u) return res.status(200).json({ ok: false, error: 'not_authenticated' });
      return res.status(200).json({ ok: true, user: publicUser(u) });
    }

    if (action === 'logout') {
      await destroySession(bearer(req));
      return res.status(200).json({ ok: true });
    }

    if (action === 'register') {
      if (!(await rateOk(ip))) return res.status(429).json({ ok: false, error: 'rate_limited' });
      const email = normEmail(body.email);
      const password = clip(body.password, MAX_PASS);
      const name = clip(body.name, MAX_NAME).trim();
      if (!validEmail(email)) return res.status(400).json({ ok: false, error: 'bad_email', message: 'Podaj poprawny adres e-mail.' });
      if (password.length < MIN_PASS) return res.status(400).json({ ok: false, error: 'weak_password', message: 'Hasło musi mieć co najmniej 8 znaków.' });
      const existing = await getUser(email);
      if (existing) return res.status(409).json({ ok: false, error: 'email_taken', message: 'Konto z tym e-mailem już istnieje. Zaloguj się.' });
      const { salt, hash } = await hashPassword(password);
      const user = { email, name, salt, hash, provider: 'password', createdAt: Date.now() };
      await saveUser(user);
      const token = await createSession(email);
      return res.status(200).json({ ok: true, token, user: publicUser(user) });
    }

    if (action === 'login') {
      if (!(await rateOk(ip))) return res.status(429).json({ ok: false, error: 'rate_limited' });
      const email = normEmail(body.email);
      const password = clip(body.password, MAX_PASS);
      const u = await getUser(email);
      // ten sam komunikat dla „brak konta" i „złe hasło" — nie ujawniamy istnienia konta
      const fail = () => res.status(401).json({ ok: false, error: 'bad_credentials', message: 'Nieprawidłowy e-mail lub hasło.' });
      if (!u || !u.hash) return fail();
      const ok = await verifyPassword(password, u.salt, u.hash);
      if (!ok) return fail();
      const token = await createSession(email);
      return res.status(200).json({ ok: true, token, user: publicUser(u) });
    }

    if (action === 'google') {
      if (!(await rateOk(ip))) return res.status(429).json({ ok: false, error: 'rate_limited' });
      const credential = String(body.credential || '');
      if (!credential) return res.status(400).json({ ok: false, error: 'no_credential' });
      // Weryfikacja tokenu ID przez Google (tokeninfo): sprawdza podpis i ważność.
      let info = null;
      try {
        const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential));
        if (r.ok) info = await r.json();
      } catch (e) { info = null; }
      if (!info || !info.email) {
        return res.status(401).json({ ok: false, error: 'google_invalid', message: 'Nie udało się zweryfikować logowania Google.' });
      }
      // aud musi zgadzać się z naszym Client ID, iss musi być Google, e-mail potwierdzony
      const audOk = info.aud === GOOGLE_CLIENT_ID;
      const issOk = info.iss === 'accounts.google.com' || info.iss === 'https://accounts.google.com';
      const emailOk = info.email_verified === true || info.email_verified === 'true';
      if (!audOk || !issOk || !emailOk) {
        return res.status(401).json({ ok: false, error: 'google_invalid', message: 'Logowanie Google nie przeszło weryfikacji.' });
      }
      const email = normEmail(info.email);
      let u = await getUser(email);
      if (!u) {
        u = { email, name: info.name || info.given_name || email.split('@')[0], provider: 'google', createdAt: Date.now() };
        await saveUser(u);
      } else if (!u.provider) {
        u.provider = u.hash ? 'password' : 'google';
      }
      const token = await createSession(email);
      return res.status(200).json({ ok: true, token, user: publicUser(u) });
    }

    return res.status(400).json({ ok: false, error: 'unknown_action' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'server_error', detail: String((e && e.message) || e).slice(0, 200) });
  }
}
