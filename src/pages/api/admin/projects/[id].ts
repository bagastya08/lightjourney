import type { APIRoute } from 'astro';
import { sanityWrite } from '../../../../lib/sanity';

export const prerender = false;

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const client = sanityWrite();
    await client.delete(params.id!);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus.';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
