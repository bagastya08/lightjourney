import type { APIRoute } from 'astro';
import { insertBooking } from '../../../lib/supabase';
import { normalizeWa, isIsoDate } from '../../../lib/content';

export const prerender = false;

// Admin books for a client. token (access code) and quota come from DB defaults.
export const POST: APIRoute = async ({ request }) => {
  const b = await request.json();
  const name = b.name?.trim();
  if (!name || !isIsoDate(b.preferred_date)) {
    return new Response(JSON.stringify({ error: 'Isi nama client dan tanggal.' }), { status: 400 });
  }

  try {
    const id = await insertBooking({
        name,
        whatsapp: normalizeWa(b.whatsapp) || null,
        session_type: b.session_type || 'other',
        preferred_date: b.preferred_date,
        preferred_time: b.preferred_time || null,
        notes: b.notes?.trim() || null,
        title: b.title?.trim() || null,
        quota: Number(b.quota) >= 1 ? Math.floor(Number(b.quota)) : undefined,
        status: 'confirmed',
        source: 'admin'
      });
    return new Response(JSON.stringify({ ok: true, id }), { status: 200 });
  } catch (err) {
    const message = (err as { message?: string })?.message || 'Server belum terhubung ke database.';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
