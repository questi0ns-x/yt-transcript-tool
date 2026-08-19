import { motion } from "framer-motion";

/**
 * Fondo con "haces" de luz animados, en el espiritu de Aceternity's
 * BackgroundBeams pero implementado desde cero: unas cuantas lineas SVG
 * con gradiente que se desplazan lentamente, muy sutiles, para dar
 * atmosfera sin robar atencion al contenido.
 */
export default function BackgroundBeams() {
  const beams = [
    { x1: "10%", y1: "0%", x2: "30%", y2: "100%", delay: 0 },
    { x1: "25%", y1: "0%", x2: "10%", y2: "100%", delay: 1.5 },
    { x1: "45%", y1: "0%", x2: "60%", y2: "100%", delay: 0.7 },
    { x1: "65%", y1: "0%", x2: "50%", y2: "100%", delay: 2.2 },
    { x1: "85%", y1: "0%", x2: "95%", y2: "100%", delay: 1.1 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="beam-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5a623" stopOpacity="0" />
            <stop offset="50%" stopColor="#f5a623" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f5a623" stopOpacity="0" />
          </linearGradient>
        </defs>
        {beams.map((b, i) => (
          <motion.line
            key={i}
            x1={b.x1}
            y1={b.y1}
            x2={b.x2}
            y2={b.y2}
            stroke="url(#beam-gradient)"
            strokeWidth="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              delay: b.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(245,166,35,0.10), transparent)",
        }}
      />
    </div>
  );
}
