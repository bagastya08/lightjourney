import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';
import { SESSION_TYPES, isIsoDate } from '../../lib/content';

export const prerender = false;

// Public, unauthenticated: only accept known fields, sane lengths, today-or-later dates.
// ponytail: no rate limit / captcha; add one if spam bookings show up.
const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Data tidak valid.' }), { status: 400 });
  }

  const name = clip(body.name, 100);
  const whatsapp = clip(body.whatsapp, 30);
  const email = clip(body.email, 200);
  const session_type = clip(body.session_type, 30);
  const preferred_date = clip(body.preferred_date, 10);
  const preferred_time = clip(body.preferred_time, 5);
  const notes = clip(body.notes, 1000);
  const today = new Date().toLocaleDateString('sv-SE');

  if (!name || !/^[0-9+\-\s()]{8,30}$/.test(whatsapp) || !(session_type in SESSION_TYPES) || !isIsoDate(preferred_date)) {
    return new Response(JSON.stringify({ error: 'Lengkapi nama, nomor WhatsApp yang benar, jenis sesi, dan tanggal.' }), { status: 400 });
  }
  if (preferred_date < today) {
    return new Response(JSON.stringify({ error: 'Tanggal sudah lewat.' }), { status: 400 });
  }
  if (preferred_time && !/^\d{2}:\d{2}$/.test(preferred_time)) {
    return new Response(JSON.stringify({ error: 'Format jam tidak valid.' }), { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin().from('bookings').insert({
      name,
      whatsapp,
      email: email || null,
      session_type,
      preferred_date,
      preferred_time: preferred_time || null,
      notes: notes || null
    });
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: 'Gagal menyimpan booking, coba lagi atau hubungi lewat WhatsApp.' }), { status: 500 });
  }
};
