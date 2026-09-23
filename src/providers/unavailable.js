import { ProviderError, ProviderErrorCodes } from "./errors";

// Fabrica de providers para plataformas cuya deteccion de URL ya esta
// lista, pero cuya extraccion de transcript (via audio + Speech-to-Text)
// todavia no esta implementada porque depende del backend/Worker, que
// vive en otro repositorio. Mantiene la UI y el registry agnosticos de
// plataforma: cuando el Worker soporte la plataforma, basta con
// sustituir este provider por uno real con la misma interfaz.
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
        `${label} todavia no esta soportado. Estamos trabajando en ello.`
      );
    },
  };
}
