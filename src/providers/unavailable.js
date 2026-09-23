import { ProviderError, ProviderErrorCodes } from "./errors";

// Forzado a local para pruebas. En produccion se cambiara al Worker
// desplegado.
const WORKER_URL = "http://localhost:8787";

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