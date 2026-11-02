import { createClient } from '@supabase/supabase-js';

// Server-only: uses the service role key, never import this in client-side code.
export function supabaseAdmin() {
  const url = import.meta.env.SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi di .env');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// Insert a booking and return its id. `source` ('web' | 'admin') needs the column from
// supabase/schema.sql; until that SQL is run, retry without it instead of failing.
export async function insertBooking(row: Record<string, unknown>) {
  const table = supabaseAdmin().from('bookings');
  let res = await table.insert(row).select('id').single();
  if (res.error?.code === 'PGRST204' && 'source' in row) {
    const { source: _, ...rest } = row;
    res = await supabaseAdmin().from('bookings').insert(rest).select('id').single();
  }
  if (res.error) throw res.error;
  return res.data.id as string;
}
