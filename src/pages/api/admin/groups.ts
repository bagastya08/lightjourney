import type { APIRoute } from 'astro';
import { sanityWrite } from '../../../lib/sanity';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { title } = await request.json();
  if (!title) return new Response(JSON.stringify({ error: 'title wajib diisi' }), { status: 400 });

  try {
    const client = sanityWrite();
    await client.create({ _type: 'projectGroup', title, date: new Date().toISOString().slice(0, 10) });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal membuat kategori.';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
