// Valida y normaliza URLs de YouTube en el cliente antes de llamar al Worker.
// Soporta watch, youtu.be, shorts y embed. Rechaza cualquier otro dominio.

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

  if (url.hostname.toLowerCase() === "youtu.be") {
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

export function isValidYoutubeUrl(rawUrl) {
  return extractYoutubeVideoId(rawUrl) !== null;
}

export function youtubeWatchUrl(videoId, seconds) {
  const t = seconds != null ? `&t=${Math.floor(seconds)}s` : "";
  return `https://www.youtube.com/watch?v=${videoId}${t}`;
}
