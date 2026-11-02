import { defineMiddleware } from 'astro:middleware';
import { isValidSession, ADMIN_COOKIE } from './lib/admin-auth';

const PUBLIC_ADMIN_PATHS = new Set(['/admin/login', '/api/admin/login']);

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  if (!isAdminArea || PUBLIC_ADMIN_PATHS.has(pathname)) return next();

  const authed = isValidSession(context.cookies.get(ADMIN_COOKIE)?.value);
  if (!authed) {
    if (pathname.startsWith('/api/admin')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    return context.redirect('/admin/login');
  }
  return next();
});
