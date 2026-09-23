import { useEffect, useRef, useState } from "react";
import BackgroundBeams from "./components/BackgroundBeams";
import TextGenerateEffect from "./components/TextGenerateEffect";
import ShimmerButton from "./components/ShimmerButton";
import LiveCaptionTicker from "./components/LiveCaptionTicker";
import TranscriptViewer from "./components/TranscriptViewer";
import { isValidYoutubeUrl } from "./utils/youtube";

// URL del Cloudflare Worker desplegado. En produccion GitHub Actions
// inyecta esta URL como secreto VITE_WORKER_URL; en local puedes definirla
// en un .env. El fallback aqui es solo para que el build no rompa si el
// secreto no esta configurado todavia.
const WORKER_URL =
  import.meta.env.VITE_WORKER_URL ||
  "https://yt-transcript-worker.questi0ns-x.workers.dev";

const REQUEST_TIMEOUT_MS = 25000;

const LOADING_STEPS = [
  "Detectando plataforma...",
  "Obteniendo informacion del video...",
  "Buscando transcripcion...",
];

function mapErrorMessage(status, serverMessage) {
  if (status === 404) return "No se encontro ningun transcript disponible para este video.";
  if (status === 403) return "Este video parece ser privado o no es accesible.";
  if (status === 429) return "Has realizado demasiadas solicitudes. Intentalo mas tarde.";
  if (status >= 500) return "El servicio no esta disponible ahora mismo. Intentalo mas tarde.";
  return serverMessage || "No se pudo obtener la transcripcion.";
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 900);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl || loading) return;

    if (!isValidYoutubeUrl(trimmedUrl)) {
      setError(
        "Esa URL no parece ser un enlace valido de YouTube (watch, youtu.be, shorts o embed)."
      );
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(
        `${WORKER_URL}/transcript?url=${encodeURIComponent(trimmedUrl)}`,
        { signal: controller.signal }
      );

      let json = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok) {
        throw new Error(mapErrorMessage(res.status, json?.error));
      }

      setData(json);
    } catch (err) {
      if (err.name === "AbortError") {
        setError("La solicitud tardo demasiado. Intentalo de nuevo.");
      } else if (err instanceof TypeError) {
        setError("No se pudo conectar con el servicio. Comprueba tu conexion.");
      } else {
        setError(err.message || "Ha ocurrido un error inesperado.");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0f]">
      <BackgroundBeams />

      <main className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 py-20">
        <span className="mb-4 rounded-full border border-[#232330] px-3 py-1 font-mono text-xs tracking-widest text-[#8a8a99]">
          SIN ANUNCIOS · SIN RECAPTCHA · SIN CUENTA
        </span>

        <h1 className="text-center font-display text-4xl font-bold leading-tight text-[#e4e4ea] sm:text-5xl">
          <TextGenerateEffect text="Pega un enlace de YouTube." />
          <br />
          <TextGenerateEffect
            text="Recibe la transcripcion completa."
            delay={0.6}
            className="text-[#f5a623]"
          />
        </h1>

        <p className="mt-5 max-w-lg text-center text-[#8a8a99]">
          Extrae subtitulos publicos directamente, sin pasar por sitios
          llenos de anuncios ni verificaciones absurdas.
        </p>

        <div className="mt-10">
          <LiveCaptionTicker />
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="video-url" className="sr-only">
            URL del video de YouTube
          </label>
          <input
            id="video-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            aria-invalid={Boolean(error)}
            className="flex-1 rounded-lg border border-[#232330] bg-[#13131a] px-4 py-3 text-sm text-[#e4e4ea] placeholder:text-[#5a5a68] outline-none focus:border-[#f5a623]"
          />
          <ShimmerButton type="submit" disabled={loading}>
            {loading ? "extrayendo..." : "obtener transcripcion"}
          </ShimmerButton>
        </form>

        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 w-full max-w-xl rounded-lg border border-[#232330] bg-[#13131a] px-4 py-3 text-center text-sm text-[#8a8a99]"
          >
            {LOADING_STEPS[loadingStep]}
          </div>
        )}

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-6 w-full max-w-xl rounded-lg border border-[#5a1e1e] bg-[#1a0d0d] px-4 py-3 text-sm text-[#e08585]"
          >
            {error}
          </div>
        )}

        {data && (
          <div className="mt-10 w-full flex justify-center">
            <TranscriptViewer data={data} />
          </div>
        )}
      </main>

      <footer className="relative z-10 pb-10 text-center font-mono text-xs text-[#5a5a68]">
        hecho para leer, no para anunciar
      </footer>
    </div>
  );
}
