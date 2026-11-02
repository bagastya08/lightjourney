import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const { photo_ids } = await request.json();

  try {
    const supabase = supabaseAdmin();

    const { data: booking } = await supabase.from('bookings').select('*').eq('token', params.token).single();
    if (!booking) return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404 });
    if (!Array.isArray(photo_ids) || photo_ids.length > booking.quota) {
      return new Response(JSON.stringify({ error: `Maksimal ${booking.quota} foto` }), { status: 400 });
    }

    // Only allow photo ids that actually belong to this booking.
    const { data: ownedPhotos } = await supabase.from('photos').select('id').eq('booking_id', booking.id);
    const ownedIds = new Set((ownedPhotos ?? []).map((p) => p.id));
    if (!photo_ids.every((id: string) => ownedIds.has(id))) {
      return new Response(JSON.stringify({ error: 'Invalid photo selection' }), { status: 400 });
    }

    await supabase.from('selections').delete().eq('booking_id', booking.id);
    if (photo_ids.length > 0) {
      const rows = photo_ids.map((photo_id: string) => ({ booking_id: booking.id, photo_id }));
      const { error } = await supabase.from('selections').insert(rows);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server belum terhubung ke database.';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
