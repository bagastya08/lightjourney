import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';
import { sanityWrite } from '../../../lib/sanity';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const title = form.get('title') as string;
  const category = form.get('category') as string; // "Foto" | "Video"
  const groupId = form.get('groupId') as string;
  const description = (form.get('description') as string) || '';
  const clientName = (form.get('clientName') as string) || '';
  const files = form.getAll('images') as File[];

  if (!title || !category || !groupId) {
    return new Response(JSON.stringify({ error: 'Lengkapi title, category, kategori (group)' }), { status: 400 });
  }

  try {
    const client = sanityWrite();
    const images = [];
    for (const file of files) {
      if (!file || file.size === 0) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const asset = await client.assets.upload('image', buffer, { filename: file.name });
      images.push({ _type: 'image', _key: randomUUID().slice(0, 12), // unique per photo (old key came from the dimensions and collided) asset: { _type: 'reference', _ref: asset._id } });
    }

    await client.create({
      _type: 'project',
      title,
      category,
      description,
      client: clientName,
      projectTitle: { _type: 'reference', _ref: groupId },
      images
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan project.';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
