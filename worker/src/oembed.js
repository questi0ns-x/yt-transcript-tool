// Solo metadata publica y oficial (titulo, autor, thumbnail) via los
// endpoints oEmbed publicos de cada plataforma. Nunca se descarga
// audio/video: no existe una via oficial para eso, asi que esos
// providers siguen sin transcript por diseno.

const OEMBED_ENDPOINTS = {
  tiktok: (url) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
  instagram: (url) =>
    `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=`,
};

export async function getOembedMetadata(platform, url) {
  const buildUrl = OEMBED_ENDPOINTS[platform];
  if (!buildUrl) return null;

  const res = await fetch(buildUrl(url), {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) return null;

  const data = await res.json();
  return {
    platform,
    title: data.title || null,
    author: data.author_name || null,
    thumbnailUrl: data.thumbnail_url || null,
  };
}
