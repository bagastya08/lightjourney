import type { APIRoute } from 'astro';
import { sanityWrite } from '../../../../../lib/sanity';

export const prerender = false;

// Moves the photo to the front of the project and sets it as the category cover (home banner).
export const POST: APIRoute = async ({ params, url }) => {
  const key = url.searchParams.get('key');
  if (!key) return new Response(JSON.stringify({ error: 'key wajib' }), { status: 400 });
  try {
    const client = sanityWrite();
    const project = await client.fetch(`*[_id == $id][0]{ images, "groupId": projectTitle._ref }`, { id: params.id });
    const images: any[] = project?.images || [];
    const img = images.find((i) => i._key === key);
    if (!img) return new Response(JSON.stringify({ error: 'Foto tidak ditemukan' }), { status: 404 });

    const tx = client.transaction().patch(params.id!, (p) => p.set({ images: [img, ...images.filter((i) => i._key !== key)] }));
    if (project.groupId) {
      tx.patch(project.groupId, (p) => p.set({ cover: { _type: 'image', asset: { _type: 'reference', _ref: img.asset._ref } } }));
    }
    await tx.commit();
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan cover.';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
