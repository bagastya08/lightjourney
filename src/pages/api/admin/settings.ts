import type { APIRoute } from 'astro';
import { sanityWrite } from '../../../lib/sanity';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const client = sanityWrite();

  try {
    await client.createIfNotExists({ _id: 'siteSettings', _type: 'settings' });

    const fields: Record<string, unknown> = {};
    for (const key of ['name', 'role', 'about', 'tagline', 'whatsapp', 'whatsappMessage', 'instagram', 'linkedin', 'email']) {
      const value = form.get(key);
      if (value !== null && value !== '') fields[key] = value;
    }
    const tags = form.get('tags') as string | null;
    if (tags) fields.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);

    const tools = form.get('tools') as string | null;
    if (tools) fields.tools = tools.split(',').map((t) => t.trim()).filter(Boolean);

    const avatarFile = form.get('avatar') as File | null;
    if (avatarFile && avatarFile.size > 0) {
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const asset = await client.assets.upload('image', buffer, { filename: avatarFile.name });
      fields.avatar = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
    }

    await client.patch('siteSettings').set(fields).commit();
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan ke Sanity.';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
