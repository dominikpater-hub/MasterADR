// Wspólny helper auth dla funkcji serverless (Vercel + Upstash Redis).
// Prefiks "_" w api/ => Vercel nie tworzy z tego endpointu.
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const SESSION_TTL = 60 * 60 * 24 * 30; // 30 dni
const PBKDF2_ITERS = 100000;

const enc = (s) => new TextEncoder().encode(s);
const bufToHex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const hexToBuf = (hex) => {
  const a = new Uint8Array(hex.length / 2);
  for (let i = 0; i < a.length; i++) a[i] = parseInt(hex.substr(i * 2, 2), 16);
  return a;
};

export const normEmail = (e) => String(e || '').trim().toLowerCase();
export const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const userKey = (email) => 'madr:user:' + normEmail(email);
export const sessKey = (token) => 'madr:sess:' + token;
export const progKey = (email) => 'madr:progress:' + normEmail(email);

export async function hashPassword(password, saltHex) {
  const salt = saltHex ? hexToBuf(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    key,
    256
  );
  return { salt: saltHex || bufToHex(salt), hash: bufToHex(bits) };
}

// porównanie w stałym czasie
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function verifyPassword(password, saltHex, expectedHash) {
  const { hash } = await hashPassword(password, saltHex);
  return safeEqual(hash, expectedHash);
}

export function makeToken() {
  return bufToHex(crypto.getRandomValues(new Uint8Array(32)));
}

export async function getUser(email) {
  return await redis.get(userKey(email)); // zwraca obiekt lub null
}
export async function saveUser(user) {
  await redis.set(userKey(user.email), user);
}

export async function createSession(email) {
  const token = makeToken();
  await redis.set(sessKey(token), normEmail(email), { ex: SESSION_TTL });
  return token;
}
export async function getSessionEmail(token) {
  if (!token) return null;
  return await redis.get(sessKey(token));
}
export async function destroySession(token) {
  if (token) await redis.del(sessKey(token));
}

// wyciąga token z nagłówka Authorization: Bearer <token>
export function bearer(req) {
  const h = req.headers['authorization'] || req.headers['Authorization'] || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}

// zwraca email zalogowanego usera albo null
export async function requireAuth(req) {
  return await getSessionEmail(bearer(req));
}
