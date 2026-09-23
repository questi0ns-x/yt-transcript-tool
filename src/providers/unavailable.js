import { ProviderError, ProviderErrorCodes } from "./errors";

const WORKER_URL =
  import.meta.env.VITE_WORKER_URL ||
  "https://yt-transcript-worker.questi0ns-x.workers.dev";

// Fabrica de providers para plataformas sin transcript real (no existe
// via oficial para descargar audio/video de terceros sin autorizacion
// del dueno del contenido). Pueden, eso si, mostrar metadata publica
// basica (titulo, autor, thumbnail) via el oEmbed oficial de cada
// plataforma, que el Worker expone en /metadata.
export function createUnavailableProvider({ id, label, hosts, pathIsVideo }) {
  const hostSet = new Set(hosts);

  return {
    id,

    canHandle(rawUrl) {
      try {
        const url = new URL(rawUrl.trim());
        if (!hostSet.has(url.hostname.toLowerCase())) return false;
        return pathIsVideo ? pathIsVideo(url) : true;
      } catch {
        return false;
      }
    },

    parseUrl(url) {
      return { platform: id, videoId: null, url };
    },

    async getTranscript() {
      throw new ProviderError(
        ProviderErrorCodes.PLATFORM_NOT_SUPPORTED,
        `${label} todavia no tiene transcript disponible: no existe una via oficial para descargar audio de video ajeno sin autorizacion del creador.`
      );
    },

    async getMetadata(url, { signal } = {}) {
      try {
        const res = await fetch(
          `${WORKER_URL}/metadata?platform=${id}&url=${encodeURIComponent(url)}`,
          { signal }
        );
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },
  };
}
