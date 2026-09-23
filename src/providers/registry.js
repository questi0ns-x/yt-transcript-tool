import { youtubeProvider } from "./youtube";
import { tiktokProvider } from "./tiktok";
import { instagramProvider } from "./instagram";

// Unico punto que conoce todos los providers. Anadir una plataforma
// nueva significa escribir un provider con la interfaz
// { id, canHandle(url), parseUrl(url), getTranscript(video, opts) }
// y registrarlo aqui: la UI nunca necesita saber que plataformas existen.
const providers = [youtubeProvider, tiktokProvider, instagramProvider];

export function resolveProvider(url) {
  return providers.find((provider) => provider.canHandle(url)) || null;
}
