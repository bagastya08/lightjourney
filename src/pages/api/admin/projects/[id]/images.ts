import type { APIRoute } from 'astro';
import { sanityWrite } from '../../../../../lib/sanity';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const form = await request.formData();
  const files = form.getAll('images') as File[];
  if (!files.length) return new Response(JSON.stringify({ error: 'No files' }), { status: 400 });

  try {
    const client = sanityWrite();
    const newImages = [];
    for (const file of files) {
      if (!file || file.size === 0) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const asset = await client.assets.upload('image', buffer, { filename: file.name });
      newImages.push({ _type: 'image', _key: asset._id.slice(-12), asset: { _type: 'reference', _ref: asset._id } });
    }
    await client
      .patch(params.id!)
      .setIfMissing({ images: [] })
      .insert('after', 'images[-1]', newImages)
      .commit();
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal upload.';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

// Remove one photo from the project (the asset stays in Sanity's media library).
export const DELETE: APIRoute = async ({ params, url }) => {
  const key = url.searchParams.get('key');
  if (!key) return new Response(JSON.stringify({ error: 'key wajib' }), { status: 400 });
  try {
    await sanityWrite().patch(params.id!).unset([`images[_key=="${key.replace(/"/g, '')}"]`]).commit();
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus foto.';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
