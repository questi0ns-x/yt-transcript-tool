# transcript-service

Microservicio Python que envuelve `youtube-transcript-api` (v0.6.x). El
Worker de Cloudflare le hace `fetch()` para obtener subtitulos reales,
sorteando el bloqueo por PoToken que afecta a implementaciones desde cero.

## Desarrollo local

```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000