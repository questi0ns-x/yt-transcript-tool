# yt-transcript-worker

Backend (Cloudflare Worker) para [yt-transcript](../README.md). Sirve
`GET /transcript?url=...` (YouTube) y `GET /metadata?url=...&platform=...`
(TikTok/Instagram, solo metadata publica via oEmbed oficial).

## Estado conocido: extraccion de YouTube actualmente bloqueada

El metodo usado (leer `ytInitialPlayerResponse` de la pagina publica del
video y descargar la pista de subtitulos via el endpoint publico
`timedtext`) es el mismo que usan la mayoria de herramientas de este
tipo: no requiere login, no llama a ninguna API privada ni falsifica
la identidad de otra app.

A fecha de este commit, YouTube esta devolviendo respuestas vacias en
el endpoint `timedtext` incluso con URLs firmadas validas y recien
generadas, de forma consistente. El Worker detecta esto y devuelve un
error claro (`503`) en vez de romperse silenciosamente.

**Decision explicita de diseno:** no se ha implementado ningun
mecanismo para evadir esta proteccion (falsificar clientes moviles
oficiales, resolver el reto BotGuard con un navegador headless para
obtener un PoToken, etc.). Esas tecnicas cruzan la linea de bypass de
deteccion de bots que este proyecto evita deliberadamente, tanto por
los Terminos de Servicio de YouTube como por ser fragiles y requerir
mantenimiento continuo de evasion.

Alternativas legitimas evaluadas y descartadas:

- **YouTube Data API v3** (`captions.download`): requiere OAuth como
  dueno del canal del video. No sirve para videos de terceros, que es
  el caso de uso de esta herramienta.
- **Proveedores de PoToken** (ej. `bgutil-ytdlp-pot-provider`):
  resuelven el reto anti-bot de Google mediante automatizacion de
  navegador. Es la misma categoria de tecnica que se descarta arriba.

Si en el futuro aparece una via oficial o mantenida que no requiera
evasion, `src/youtube.js` es el unico archivo que hay que tocar.

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy

```bash
export CLOUDFLARE_API_TOKEN=...
npm run deploy
```

El token necesita permiso "Workers Scripts: Edit" con "Account
Resources" apuntando a tu cuenta.

## Variables de entorno

- `ALLOWED_ORIGINS`: lista separada por comas de origenes permitidos
  para CORS (ver `wrangler.toml`).

## Rate limiting (opcional)

El rate limiting usa un namespace KV opcional. Sin el, el Worker
funciona igual pero sin limitar requests por IP:

```bash
wrangler kv namespace create RATE_LIMIT_KV
```

Y descomenta el binding correspondiente en `wrangler.toml` con el ID
que te devuelva el comando (requiere permiso "Workers KV Storage:
Edit" en el token).
