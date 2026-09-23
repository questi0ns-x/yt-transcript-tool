// Rate limit por IP con ventana fija de 1 minuto, respaldado en KV.
// Si el binding RATE_LIMIT_KV no esta configurado (p.ej. en un entorno
// de pruebas), el limite se salta en vez de romper el servicio: es
// preferible degradar a "sin limite" que a "caido".

const WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 20;

export async function checkRateLimit(request, env) {
  if (!env.RATE_LIMIT_KV) return { limited: false };

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const windowId = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
  const key = `rl:${ip}:${windowId}`;

  const current = parseInt((await env.RATE_LIMIT_KV.get(key)) || "0", 10);
  if (current >= MAX_REQUESTS_PER_WINDOW) {
    return { limited: true };
  }

  await env.RATE_LIMIT_KV.put(key, String(current + 1), {
    expirationTtl: WINDOW_SECONDS * 2,
  });
  return { limited: false };
}
