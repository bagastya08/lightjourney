// Server-only: lists images in a Google Drive folder shared as "Anyone with the link".
// Uses GOOGLE_API_KEY (Drive API) when set, otherwise the public embed page; no OAuth.

export function driveFolderId(url: string) {
  return url.match(/\/folders\/([\w-]+)/)?.[1] ?? null;
}

export function driveThumb(fileId: string, width = 800) {
  return `https://lh3.googleusercontent.com/d/${fileId}=w${width}`;
}

export function driveDownload(fileId: string) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif|gif|tiff?|bmp|avif)$/i;

// No-key fallback: Drive's public embed page lists a shared folder's files.
// ponytail: scrapes HTML, may break if Google changes the page; set GOOGLE_API_KEY to use the official API.
export async function listViaEmbed(folderId: string) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`);
  if (!res.ok) {
    throw new Error(`Gagal baca folder Drive (${res.status}). Pastikan folder di-share "Siapa saja yang memiliki link".`);
  }
  const html = await res.text();
  const files: { id: string; name: string }[] = [];
  const re = /id="entry-([\w-]+)"[\s\S]*?class="flip-entry-title">([^<]*)</g;
  for (const m of html.matchAll(re)) {
    const name = m[2].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    if (IMAGE_EXT.test(name)) files.push({ id: m[1], name });
  }
  if (!files.length && !html.includes('flip-entry')) {
    throw new Error('Folder tidak bisa dibaca. Pastikan di-share "Siapa saja yang memiliki link — Viewer".');
  }
  return files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

export async function listDriveImages(folderUrl: string) {
  const folderId = driveFolderId(folderUrl);
  if (!folderId) throw new Error('Link harus link folder: https://drive.google.com/drive/folders/...');
  const key = import.meta.env.GOOGLE_API_KEY;
  if (!key) return listViaEmbed(folderId);

  const files: { id: string; name: string }[] = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'nextPageToken, files(id, name)',
      orderBy: 'name',
      pageSize: '1000',
      key
    });
    if (pageToken) params.set('pageToken', pageToken);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
    if (!res.ok) {
      throw new Error(`Gagal baca folder Drive (${res.status}). Pastikan folder di-share "Siapa saja yang memiliki link".`);
    }
    const data = await res.json();
    files.push(...data.files);
    pageToken = data.nextPageToken ?? '';
  } while (pageToken);
  return files;
}
