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
