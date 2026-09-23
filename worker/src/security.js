// Toda validacion de entrada vive aqui. La regla de oro: el Worker
// NUNCA hace fetch() directo a una URL proporcionada por el usuario.
// Solo extrae un videoId validado y construye el, mismo, las URLs de
// YouTube que necesita golpear. Esto elimina SSRF por diseno.

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export function extractYoutubeVideoId(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  if (rawUrl.length > 2048) return null;

  let url;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;

  let id = null;
  const host = url.hostname.toLowerCase();

  if (host === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0];
  } else if (url.pathname === "/watch") {
    id = url.searchParams.get("v");
  } else if (url.pathname.startsWith("/shorts/")) {
    id = url.pathname.split("/")[2];
  } else if (url.pathname.startsWith("/embed/")) {
    id = url.pathname.split("/")[2];
  } else if (url.pathname.startsWith("/live/")) {
    id = url.pathname.split("/")[2];
  }

  if (!id || !VIDEO_ID_RE.test(id)) return null;
  return id;
}

const OEMBED_HOSTS = {
  tiktok: new Set(["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "m.tiktok.com"]),
  instagram: new Set(["instagram.com", "www.instagram.com"]),
};

export function validateOembedUrl(rawUrl, platform) {
  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.length > 2048) return null;
  let url;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const hosts = OEMBED_HOSTS[platform];
  if (!hosts || !hosts.has(url.hostname.toLowerCase())) return null;
  return url.toString();
}

export function corsHeaders(request, allowedOrigins) {
  const origin = request.headers.get("Origin") || "";
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function jsonResponse(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}
