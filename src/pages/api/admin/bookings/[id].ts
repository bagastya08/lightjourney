import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../../lib/supabase';
import { listDriveImages, driveThumb } from '../../../../lib/drive';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  const body = await request.json();

  try {
    const supabase = supabaseAdmin();
    const { data: existing } = await supabase.from('bookings').select('id').eq('id', params.id).single();
    if (!existing) return new Response(JSON.stringify({ error: 'Booking tidak ditemukan' }), { status: 404 });

    const update: Record<string, unknown> = {};
    if (body.status) {
      if (!['new', 'confirmed', 'done', 'cancelled'].includes(body.status)) {
        return new Response(JSON.stringify({ error: 'Status tidak valid.' }), { status: 400 });
      }
      update.status = body.status;
    }
    if (body.quota !== undefined) {
      const quota = Number(body.quota);
      if (!Number.isInteger(quota) || quota < 1) {
        return new Response(JSON.stringify({ error: 'Kuota harus angka 1 atau lebih.' }), { status: 400 });
      }
      update.quota = quota;
    }
    if (typeof body.title === 'string') update.title = body.title.trim() || null;

    let driveFiles: { id: string; name: string }[] = [];
    if (typeof body.drive_url === 'string' && body.drive_url.trim()) {
      update.drive_url = body.drive_url.trim();
      driveFiles = await listDriveImages(update.drive_url as string);
    }

    const { error } = await supabase.from('bookings').update(update).eq('id', params.id);
    if (error) throw error;

    // Re-sync keeps earlier rows (and the client's picks); only new Drive files get added.
    if (driveFiles.length) {
      const rows = driveFiles.map((f) => ({
        booking_id: params.id,
        drive_file_id: f.id,
        filename: f.name,
        storage_path: driveThumb(f.id)
      }));
      const { error: syncError } = await supabase
        .from('photos')
        .upsert(rows, { onConflict: 'booking_id,drive_file_id', ignoreDuplicates: true });
      if (syncError) throw syncError;
    }

    return new Response(JSON.stringify({ ok: true, synced: driveFiles.length }), { status: 200 });
  } catch (err) {
    const message = (err as { message?: string })?.message || 'Server belum terhubung ke database.';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
