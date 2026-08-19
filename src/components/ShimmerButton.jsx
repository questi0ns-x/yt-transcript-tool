/**
 * Boton con un brillo que recorre el borde en bucle, al estilo del
 * ShimmerButton de MagicUI. Implementacion propia con CSS puro
 * (conic-gradient animado) para no depender de librerias externas.
 */
export default function ShimmerButton({
  children,
  onClick,
  disabled = false,
  type = "button",
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-lg p-[1.5px] transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <span
        className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite]"
        style={{
          background:
            "conic-gradient(from 90deg at 50% 50%, #f5a623 0%, #7a5416 50%, #f5a623 100%)",
        }}
      />
      <span className="relative inline-flex h-full w-full items-center justify-center gap-2 rounded-[7px] bg-[#13131a] px-6 py-3 font-mono text-sm font-medium text-[#e4e4ea] transition-colors group-hover:bg-[#1a1a23]">
        {children}
      </span>
    </button>
  );
}
