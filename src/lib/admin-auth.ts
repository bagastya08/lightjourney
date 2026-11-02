import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'admin_session';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function secret() {
  const pw = import.meta.env.ADMIN_PASSWORD;
  if (!pw) throw new Error('ADMIN_PASSWORD belum diisi di .env');
  return pw;
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

export function checkPassword(input: string) {
  // Compare HMACs so length/content can't leak through timing.
  const a = Buffer.from(sign(`pw:${input ?? ''}`));
  const b = Buffer.from(sign(`pw:${secret()}`));
  return timingSafeEqual(a, b);
}

export function createSessionCookieValue() {
  const payload = String(Date.now() + MAX_AGE_MS);
  return `${payload}.${sign(payload)}`;
}

export function isValidSession(cookieValue: string | undefined) {
  if (!cookieValue) return false;
  const [payload, sig] = cookieValue.split('.');
  if (!payload || !sig) return false;
  try {
    const expected = sign(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    return Number(payload) > Date.now();
  } catch {
    return false;
  }
}

export const ADMIN_COOKIE = COOKIE_NAME;
export const ADMIN_COOKIE_MAX_AGE = Math.floor(MAX_AGE_MS / 1000);
