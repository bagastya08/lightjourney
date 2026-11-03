import { sanityRead, sanityFresh, urlFor } from './sanity';

export const DEFAULT_SETTINGS = {
  name: 'Bagastya',
  tagline: 'Capturing moments, crafting stories.',
  tags: ['Freelance Photographer & Videographer', 'Available for booking'],
  tools: ['Lightroom', 'Premiere Pro', 'DaVinci Resolve', 'Illustrator'],
  avatar: null as string | null,
  whatsapp: '62895412230426',
  whatsappMessage: 'Halo Bagastya, saya tertarik untuk booking sesi foto/video.',
  instagram: 'https://www.instagram.com/journey.creative4/',
  linkedin: 'https://www.linkedin.com/in/kadek-bagastya-adi-72701b2b5/',
  email: ''
};

export async function getSettings() {
  try {
    const doc = await sanityRead.fetch(`*[_type == "settings" && _id == "siteSettings"][0]`);
    if (!doc) return DEFAULT_SETTINGS;
    return {
      ...DEFAULT_SETTINGS,
      ...doc,
      avatar: doc.avatar ? urlFor(doc.avatar).width(200).height(200).fit('crop').url() : null,
      tags: doc.tags?.length ? doc.tags : DEFAULT_SETTINGS.tags,
      tools: doc.tools?.length ? doc.tools : DEFAULT_SETTINGS.tools
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const GROUPS_QUERY = `*[_type == "projectGroup"] | order(order asc, date asc){ _id, title, cover }`;

const PROJECTS_QUERY = `*[_type == "project"] | order(_createdAt desc) {
  _id, title, category, description, client,
  "groupId": projectTitle._ref,
  "groupTitle": projectTitle->title,
  "images": images[]{
    ...,
    "width": asset->metadata.dimensions.width,
    "height": asset->metadata.dimensions.height
  },
  videoUrl,
  "videoFileUrl": videoFile.asset->url
}`;

export async function getCategories(fresh = false) {
  const client = fresh ? sanityFresh : sanityRead;
  try {
    const groups = await client.fetch(GROUPS_QUERY);
    return (groups || []).map((g: any) => ({
      ...g,
      coverUrl: g.cover?.asset ? urlFor(g.cover).width(1200).auto('format').url() : null
    }));
  } catch {
    return [];
  }
}

export async function getProjects(fresh = false) {
  const client = fresh ? sanityFresh : sanityRead;
  try {
    const docs = await client.fetch(PROJECTS_QUERY);
    return (docs || []).map((p: any) => ({
      ...p,
      thumbUrl: p.images?.[0] ? urlFor(p.images[0]).width(600).auto('format').url() : null,
      imageUrls: (p.images || []).map((img: any) => ({
        key: img._key,
        url: urlFor(img).width(1200).auto('format').url(),
        downloadUrl: urlFor(img).url(),
        width: img.width || 1200,
        height: img.height || 900
      })),
      heroImageUrls: (p.images || []).map((img: any) =>
        urlFor(img).width(720).auto('format').url()
      )
    }));
  } catch {
    return [];
  }
}

export function whatsappLink(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function formatDateId(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export const SESSION_TYPES: Record<string, string> = {
  wedding: 'Wedding',
  wisuda: 'Wisuda',
  sport: 'Sport',
  fnb: 'Food & Beverage',
  property: 'Hotel & Property',
  video: 'Videography',
  other: 'Lainnya'
};

// "0812-345" -> "62812345" so wa.me links work with local-format numbers.
export function normalizeWa(raw: string | null | undefined) {
  const digits = (raw || '').replace(/[^0-9]/g, '');
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
}

export function isIsoDate(s: string | null | undefined): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}
