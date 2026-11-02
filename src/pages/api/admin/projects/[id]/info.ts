import type { APIRoute } from 'astro';
import { sanityWrite } from '../../../../../lib/sanity';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const form = await request.formData();
  const title = form.get('title') as string | null;
  const description = form.get('description') as string | null;
  const clientName = form.get('clientName') as string | null;

  const patch: Record<string, unknown> = {};
  if (title) patch.title = title;
  if (description !== null) patch.description = description;
  if (clientName !== null) patch.client = clientName;

  try {
    const client = sanityWrite();
    await client.patch(params.id!).set(patch).commit();
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan.';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
