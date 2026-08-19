# yt-transcript

Interfaz web para extraer la transcripcion completa de cualquier video de
YouTube, sin anuncios ni recaptchas.

El backend (proxy serverless en Cloudflare Workers que obtiene los
subtitulos publicos de YouTube) vive en otro repositorio y se configura
mediante la variable de entorno `VITE_WORKER_URL`.

## Configurar el secreto en GitHub

1. En el repo de GitHub, ve a **Settings > Secrets and variables >
   Actions**.
2. Crea un secreto de Actions (no de variables) llamado
   `VITE_WORKER_URL` con la URL de tu Worker, por ejemplo:
   ```
   https://yt-transcript-worker.tu-subdominio.workers.dev
   ```

## Desplegar

1. En **Settings > Pages**, en "Build and deployment" elige **GitHub
   Actions** (no "Deploy from a branch").
2. Haz push a `main`. El workflow en `.github/workflows/deploy.yml`
   instala dependencias, construye con `VITE_WORKER_URL` y publica el
   sitio en cada push.

El sitio quedara en `https://questi0ns-x.github.io/yt-transcript-tool/`.

## Desarrollo local

```bash
npm install
```

Crea un `.env` (no lo commitees):

```
VITE_WORKER_URL=https://yt-transcript-worker.tu-subdominio.workers.dev
```

```bash
npm run dev
```
