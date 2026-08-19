import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages sirve el sitio en /<usuario>/<repo>/, y Vite necesita
// saberlo para que las rutas de los assets no rompan en produccion.
// Repo: questi0ns-x/yt-transcript-tool -> base "/yt-transcript-tool/"
export default defineConfig({
  base: "/yt-transcript-tool/",
  plugins: [react(), tailwindcss()],
});
