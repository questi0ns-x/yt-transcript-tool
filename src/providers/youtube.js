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

const RETRY_DELAY_MS = 3000;

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const timeoutId = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeoutId);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
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
    const url = `${WORKER_URL}/transcript?video_id=${encodeURIComponent(video.videoId)}`;

    for (let attempt = 0; ; attempt++) {
      const res = await fetch(url, { signal });

      let json = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (res.ok) return json;

      // YouTube a veces bloquea momentaneamente (503): un reintento
      // tras una breve espera suele bastar sin costarnos nada extra.
      if (res.status === 503 && attempt === 0) {
        await delay(RETRY_DELAY_MS, signal);
        continue;
      }

      throw new Error(mapErrorMessage(res.status, json?.error || json?.detail));
    }
  },
};