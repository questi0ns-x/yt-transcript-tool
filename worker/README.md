# yt-transcript-worker

Backend (Cloudflare Python Worker) para [yt-transcript](../README.md).
Todo el codigo vive en `src/main.py` (FastAPI sobre `workers-py`) y usa
directamente `youtube-transcript-api` para obtener subtitulos. Sirve:

- `GET /transcript?video_id=...&lang=...` (YouTube)
- `GET /metadata?url=...&platform=...` (TikTok/Instagram, solo metadata
  publica via oEmbed oficial)
- `GET /health`

## Extraccion de YouTube

El Worker usa `youtube-transcript-api`, que puede fallar con `503` si
YouTube bloquea la IP saliente del Worker. Para mitigarlo, se puede
configurar un proxy residencial de Webshare via las variables de
entorno `WEBSHARE_USERNAME` / `WEBSHARE_PASSWORD` (ver
`get_proxy_config` en `src/main.py`); sin ellas, el Worker sale
directamente con la IP de Cloudflare, que YouTube bloquea con mas
frecuencia.

## Desarrollo local

Este es un Python Worker, asi que se gestiona con `pywrangler` (via
`uv`), **no** con `wrangler` directamente: `wrangler dev` falla porque
el paquete `workers` que trae Pyodide por defecto no incluye el puente
ASGI (`workers.asgi`) que usa `src/main.py`. `pywrangler` lee
`pyproject.toml`/`pylock.toml` y empaqueta las dependencias correctas
(incluido `workers-py`, que si trae `asgi`) antes de arrancar.

```bash
uv sync
uv run pywrangler dev
```

## Deploy

```bash
export CLOUDFLARE_API_TOKEN=...
uv run pywrangler deploy
```

El token necesita permiso "Workers Scripts: Edit" con "Account
Resources" apuntando a tu cuenta.

## Cache de transcripts (opcional, gratis)

Si dos personas piden el mismo video, la segunda puede servirse desde
cache en vez de volver a golpear YouTube (reduce cuantas veces se
dispara un bloqueo). Usa un namespace de Cloudflare KV, gratis dentro
del tier free (100k lecturas/dia, 1k escrituras/dia). Sin configurar,
el Worker funciona igual, solo que sin cache.

```bash
npx wrangler kv namespace create TRANSCRIPT_CACHE
```

Copia el `id` que te devuelva y descomenta el binding `kv_namespaces`
en `wrangler.jsonc` con ese id. TTL de cache: 6 horas
(`CACHE_TTL_SECONDS` en `src/main.py`).

## Variables de entorno

- `WEBSHARE_USERNAME` / `WEBSHARE_PASSWORD` (opcional): credenciales
  del proxy residencial de Webshare para reducir bloqueos de YouTube.

Los origenes permitidos para CORS estan hardcodeados en `src/main.py`
(`https://questi0ns-x.github.io` y `http://localhost:5173`).

No hay rate limiting implementado actualmente en el Worker Python.
