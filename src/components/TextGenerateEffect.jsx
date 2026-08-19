import { motion } from "framer-motion";

/**
 * Revela el texto palabra por palabra con un fundido + leve desplazamiento,
 * al estilo del TextGenerateEffect de Aceternity. Implementacion propia.
 */
export default function TextGenerateEffect({ text, className = "", delay = 0 }) {
  const words = text.split(" ");

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.4,
            delay: delay + i * 0.06,
            ease: "easeOut",
          }}
          className="inline-block mr-[0.28em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
