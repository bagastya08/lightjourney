import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

// Falls back to a placeholder so the client can construct without throwing
// when .env isn't configured yet — actual fetches then fail and are caught
// by the try/catch in lib/content.ts, so pages render with empty state.
const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'placeholder';
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production';

export const sanityRead = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: true
});

// No CDN cache — used in /admin so a fresh upload shows up immediately.
export const sanityFresh = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false
});

// Server-only: needs a write token (Manage -> API -> Tokens, "Editor" role).
export function sanityWrite() {
  const token = import.meta.env.SANITY_API_TOKEN;
  if (!projectId || !token) {
    throw new Error('PUBLIC_SANITY_PROJECT_ID / SANITY_API_TOKEN belum diisi di .env');
  }
  return createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token });
}

const builder = imageUrlBuilder({ projectId, dataset });

export function urlFor(source: any) {
  return builder.image(source);
}
