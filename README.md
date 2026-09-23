# yt-transcript

Interfaz web para extraer la transcripcion completa de cualquier video de
YouTube, sin anuncios ni recaptchas.

El backend (proxy serverless en Cloudflare Workers) vive en
[`/worker`](worker/) dentro de este mismo repositorio y se configura
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

## Limitaciones actuales

- Solo YouTube esta soportado. Se aceptan enlaces `youtube.com/watch`,
  `youtu.be`, `youtube.com/shorts` y `youtube.com/embed`; cualquier otro
  dominio se rechaza antes de llamar al backend.
- Solo se obtienen subtitulos publicos existentes (manuales o
  autogenerados). No hay transcripcion por voz (Speech-to-Text): si el
  video no tiene subtitulos publicos, no se puede extraer texto.
- **Extraccion de YouTube temporalmente no disponible:** YouTube esta
  bloqueando el metodo publico de lectura de subtitulos. Ver
  [`worker/README.md`](worker/README.md) para el detalle tecnico y las
  alternativas evaluadas (y descartadas por requerir bypass de
  deteccion de bots).
- TikTok e Instagram no estan soportados todavia (sin transcript). El
  Worker puede devolver metadata publica basica via oEmbed si se le
  pide explicitamente en `/metadata`.

## Privacidad

- Esta app (frontend) no almacena la URL ni la transcripcion en ningun
  servidor propio; todo el procesamiento visible ocurre en tu navegador.
- La URL se envia al Worker de Cloudflare (repositorio separado) para
  obtener los subtitulos publicos del video. Consulta ese repositorio
  para conocer que datos procesa y si los cachea.
