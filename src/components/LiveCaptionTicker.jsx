import { useEffect, useState } from "react";

const DEMO_LINES = [
  { t: "00:00:02", text: "Bienvenidos de nuevo al canal, hoy vamos a hablar de..." },
  { t: "00:00:07", text: "...algo que muchos me habeis pedido en comentarios." },
  { t: "00:00:12", text: "Asi que sin mas rodeos, empecemos por el principio." },
  { t: "00:00:18", text: "Lo primero que teneis que entender es el contexto." },
  { t: "00:00:24", text: "Y con esto ya podemos pasar al siguiente punto." },
];

/**
 * Ticker de subtitulos que se autoescribe, linea a linea, como si fuera
 * una transcripcion real generandose en directo. Es el elemento firma
 * de la pagina: no es decoracion, es literalmente una demo del producto.
 */
export default function LiveCaptionTicker() {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [completedLines, setCompletedLines] = useState([]);

  useEffect(() => {
    if (lineIndex >= DEMO_LINES.length) {
      const resetTimeout = setTimeout(() => {
        setCompletedLines([]);
        setLineIndex(0);
        setCharIndex(0);
      }, 2200);
      return () => clearTimeout(resetTimeout);
    }

    const current = DEMO_LINES[lineIndex].text;

    if (charIndex < current.length) {
      const timeout = setTimeout(() => setCharIndex((c) => c + 1), 22);
      return () => clearTimeout(timeout);
    }

    const holdTimeout = setTimeout(() => {
      setCompletedLines((prev) => [...prev, DEMO_LINES[lineIndex]]);
      setLineIndex((l) => l + 1);
      setCharIndex(0);
    }, 500);
    return () => clearTimeout(holdTimeout);
  }, [lineIndex, charIndex]);

  const visibleCompleted = completedLines.slice(-3);
  const activeLine = DEMO_LINES[lineIndex];

  return (
    <div className="w-full max-w-xl rounded-xl border border-[#232330] bg-[#0d0d13]/80 p-5 font-mono text-sm backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#f5a623] animate-pulse" />
        <span className="text-xs tracking-widest text-[#8a8a99]">
          TRANSCRIBIENDO EN VIVO
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {visibleCompleted.map((line, i) => (
          <div key={i} className="flex gap-3 text-[#5a5a68]">
            <span className="shrink-0 text-[#7a5416]">{line.t}</span>
            <span>{line.text}</span>
          </div>
        ))}
        {activeLine && (
          <div className="flex gap-3 text-[#e4e4ea]">
            <span className="shrink-0 text-[#f5a623]">{activeLine.t}</span>
            <span>
              {activeLine.text.slice(0, charIndex)}
              <span className="animate-pulse text-[#f5a623]">▍</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
