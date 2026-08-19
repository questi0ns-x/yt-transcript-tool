import { motion } from "framer-motion";

/**
 * Un "haz" que recorre el borde de una tarjeta en bucle, al estilo del
 * BorderBeam de MagicUI. Implementacion propia con un div absoluto
 * animado a lo largo del perimetro via offset-path.
 */
export default function BorderBeam({ duration = 6 }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <motion.div
        className="absolute h-2 w-2 rounded-full"
        style={{
          background: "#f5a623",
          boxShadow: "0 0 12px 4px rgba(245,166,35,0.8)",
          offsetPath: "rect(0% auto auto 0% round 16px)",
          offsetRotate: "0deg",
        }}
        animate={{ offsetDistance: ["0%", "100%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
