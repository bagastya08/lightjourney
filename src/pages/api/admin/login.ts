import type { APIRoute } from 'astro';
import { checkPassword, createSessionCookieValue, ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE } from '../../../lib/admin-auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const { password } = await request.json();
  try {
    if (!checkPassword(password)) {
      return new Response(JSON.stringify({ error: 'Wrong password' }), { status: 401 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server belum dikonfigurasi.';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
  cookies.set(ADMIN_COOKIE, createSessionCookieValue(), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE
  });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
