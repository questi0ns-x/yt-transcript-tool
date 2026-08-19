import { useState } from "react";
import BackgroundBeams from "./components/BackgroundBeams";
import TextGenerateEffect from "./components/TextGenerateEffect";
import ShimmerButton from "./components/ShimmerButton";
import LiveCaptionTicker from "./components/LiveCaptionTicker";
import TranscriptViewer from "./components/TranscriptViewer";

// URL de tu Cloudflare Worker desplegado. Puedes sobreescribirla con la
// variable de entorno VITE_WORKER_URL en un .env o en GitHub Actions.
const WORKER_URL =
  import.meta.env.VITE_WORKER_URL ||
  "https://yt-transcript-worker.TU-SUBDOMINIO.workers.dev";

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(
        `${WORKER_URL}/transcript?url=${encodeURIComponent(url.trim())}`
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "No se pudo obtener la transcripcion.");
      }

      setData(json);
    } catch (err) {
      setError(err.message || "Ha ocurrido un error inesperado.");
    } finally {
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
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 rounded-lg border border-[#232330] bg-[#13131a] px-4 py-3 text-sm text-[#e4e4ea] placeholder:text-[#5a5a68] outline-none focus:border-[#f5a623]"
          />
          <ShimmerButton type="submit" disabled={loading}>
            {loading ? "extrayendo..." : "obtener transcripcion"}
          </ShimmerButton>
        </form>

        {error && (
          <div className="mt-6 w-full max-w-xl rounded-lg border border-[#5a1e1e] bg-[#1a0d0d] px-4 py-3 text-sm text-[#e08585]">
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
