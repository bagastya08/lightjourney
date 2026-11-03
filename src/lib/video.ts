// Shared by /works and /works/[id]: YouTube/Vimeo links to embed + thumbnail URLs.
export function embedUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (u.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes('vimeo.com')) {
      return `https://player.vimeo.com/video/${u.pathname.split('/').pop()}`;
    }
    return url;
  } catch {
    return url;
  }
}


export function youtubeThumb(url: string) {
  const id = embedUrl(url).match(/youtube\.com\/embed\/([^?/]+)/)?.[1];
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
