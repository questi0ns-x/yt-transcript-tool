import { extractYoutubeVideoId } from "../utils/youtube";
import { ProviderError, ProviderErrorCodes } from "./errors";

const WORKER_URL =
  import.meta.env.VITE_WORKER_URL ||
  "https://yt-transcript-worker.questi0ns-x.workers.dev";

function mapErrorMessage(status, serverMessage) {
  if (serverMessage) return serverMessage;
  if (status === 404)
    return "No se encontro ningun transcript disponible para este video.";
  if (status === 403)
    return "Este video parece ser privado o no es accesible.";
  if (status === 429)
    return "Has realizado demasiadas solicitudes. Intentalo mas tarde.";
  if (status >= 500)
    return "El servicio no esta disponible ahora mismo. Intentalo mas tarde.";
  return "No se pudo obtener la transcripcion.";
}

export const youtubeProvider = {
  id: "youtube",

  canHandle(url) {
    return extractYoutubeVideoId(url) !== null;
  },

  parseUrl(url) {
    const videoId = extractYoutubeVideoId(url);
    if (!videoId) {
      throw new ProviderError(
        ProviderErrorCodes.INVALID_URL,
        "URL de YouTube no valida."
      );
    }
    return { platform: "youtube", videoId, url };
  },

  async getTranscript(video, { signal } = {}) {
    const res = await fetch(
      `${WORKER_URL}/transcript?url=${encodeURIComponent(video.url)}`,
      { signal }
    );

    let json = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (!res.ok) {
      throw new Error(mapErrorMessage(res.status, json?.error || json?.detail));
    }

    return json;
  },
};