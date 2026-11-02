import type { APIRoute } from 'astro';
import { sanityWrite } from '../../../../../lib/sanity';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const form = await request.formData();
  const videoUrl = form.get('videoUrl') as string | null;
  const existingAssetId = form.get('existingAssetId') as string | null;
  const file = form.get('videoFile') as File | null;

  try {
    const client = sanityWrite();
    const patch: Record<string, unknown> = {};

    if (videoUrl) patch.videoUrl = videoUrl;

    if (existingAssetId) {
      patch.videoFile = { _type: 'file', asset: { _type: 'reference', _ref: existingAssetId } };
    } else if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const asset = await client.assets.upload('file', buffer, { filename: file.name });
      patch.videoFile = { _type: 'file', asset: { _type: 'reference', _ref: asset._id } };
    }

    if (Object.keys(patch).length === 0) {
      return new Response(JSON.stringify({ error: 'Isi Video URL, pilih file existing, atau upload file' }), { status: 400 });
    }

    await client.patch(params.id!).set(patch).commit();
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan video.';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
