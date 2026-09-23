import {
  extractYoutubeVideoId,
  validateOembedUrl,
  corsHeaders,
  jsonResponse,
} from "./security";
import { checkRateLimit } from "./ratelimit";
import { getCached, setCached } from "./cache";
import { getYoutubeTranscript, TranscriptError } from "./youtube";
import { getOembedMetadata } from "./oembed";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://questi0ns-x.github.io",
  "http://localhost:5173",
];

function getAllowedOrigins(env) {
  if (env.ALLOWED_ORIGINS) {
    return env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  }
  return DEFAULT_ALLOWED_ORIGINS;
}

async function handleTranscript(request, env, ctx, cors) {
  const { limited } = await checkRateLimit(request, env);
  if (limited) {
    return jsonResponse(
      { error: "Has realizado demasiadas solicitudes. Intentalo mas tarde." },
      429,
      cors
    );
  }

  const reqUrl = new URL(request.url);
  const targetUrl = reqUrl.searchParams.get("url");
  const lang = reqUrl.searchParams.get("lang") || undefined;

  const videoId = extractYoutubeVideoId(targetUrl);
  if (!videoId) {
    return jsonResponse({ error: "URL de YouTube no valida." }, 400, cors);
  }

  const cached = await getCached(videoId, lang);
  if (cached) {
    return jsonResponse(cached, 200, { ...cors, "X-Cache": "HIT" });
  }

  try {
    const data = await getYoutubeTranscript(videoId, lang, env);
    await setCached(videoId, lang, data, ctx);
    return jsonResponse(data, 200, { ...cors, "X-Cache": "MISS" });
  } catch (err) {
    if (err instanceof TranscriptError) {
      return jsonResponse({ error: err.message }, err.status, cors);
    }
    console.error("transcript error", err.message || err);
    return jsonResponse(
      { error: "El servicio no esta disponible ahora mismo." },
      500,
      cors
    );
  }
}

async function handleMetadata(request, env, ctx, cors) {
  const { limited } = await checkRateLimit(request, env);
  if (limited) {
    return jsonResponse(
      { error: "Has realizado demasiadas solicitudes. Intentalo mas tarde." },
      429,
      cors
    );
  }

  const reqUrl = new URL(request.url);
  const targetUrl = reqUrl.searchParams.get("url");
  const platform = reqUrl.searchParams.get("platform");

  const validUrl = validateOembedUrl(targetUrl, platform);
  if (!validUrl) {
    return jsonResponse({ error: "URL o plataforma no valida." }, 400, cors);
  }

  const metadata = await getOembedMetadata(platform, validUrl);
  if (!metadata) {
    return jsonResponse({ error: "No se pudo obtener metadata." }, 502, cors);
  }
  return jsonResponse(metadata, 200, cors);
}

export default {
  async fetch(request, env, ctx) {
    const cors = corsHeaders(request, getAllowedOrigins(env));

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== "GET") {
      return jsonResponse({ error: "Metodo no permitido." }, 405, cors);
    }

    const { pathname } = new URL(request.url);

    if (pathname === "/transcript") {
      return handleTranscript(request, env, ctx, cors);
    }
    if (pathname === "/metadata") {
      return handleMetadata(request, env, ctx, cors);
    }
    return jsonResponse({ error: "Not found." }, 404, cors);
  },
};