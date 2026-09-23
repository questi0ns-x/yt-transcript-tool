// Cache de transcripts ya resueltos, para no volver a golpear YouTube
// por el mismo video+idioma. Usa la Cache API nativa de Cloudflare
// (edge cache), sin necesidad de KV adicional.

const CACHE_VERSION = "v1";
const TTL_SECONDS = 60 * 60 * 24; // 24h: los subtitulos de un video publicado no cambian a menudo.

function cacheKeyFor(videoId, lang) {
  return new Request(
    `https://cache.internal/transcript/${CACHE_VERSION}/${videoId}/${lang || "auto"}`
  );
}

export async function getCached(videoId, lang) {
  const cache = caches.default;
  const match = await cache.match(cacheKeyFor(videoId, lang));
  if (!match) return null;
  return match.json();
}

export async function setCached(videoId, lang, data, ctx) {
  const cache = caches.default;
  const response = new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${TTL_SECONDS}`,
    },
  });
  const putPromise = cache.put(cacheKeyFor(videoId, lang), response);
  if (ctx?.waitUntil) ctx.waitUntil(putPromise);
  else await putPromise;
}
