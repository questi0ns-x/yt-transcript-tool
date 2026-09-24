"""
Cloudflare Python Worker que expone /transcript y /metadata.

Usa youtube-transcript-api con WebshareProxyConfig para salir por
las IPs del proxy gratuito de Webshare. Las credenciales se leen
desde variables de entorno (Secret en Cloudflare).
"""

from workers import asgi
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import WebshareProxyConfig
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
    VideoUnplayable,
    RequestBlocked,
    IpBlocked,
)
import os
import json
import requests


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://questi0ns-x.github.io", "http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

OEMBED_ENDPOINTS = {
    "tiktok": "https://www.tiktok.com/oembed",
    "instagram": "https://graph.facebook.com/v19.0/instagram_oembed",
}


def get_proxy_config():
    """Lee las credenciales de Webshare desde las variables de entorno."""
    username = os.environ.get("WEBSHARE_USERNAME")
    password = os.environ.get("WEBSHARE_PASSWORD")
    if username and password:
        return WebshareProxyConfig(
            proxy_username=username,
            proxy_password=password,
        )
    return None


OEMBED_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def fetch_youtube_oembed(video_id: str):
    """Titulo, autor y miniatura via oEmbed oficial de YouTube."""
    try:
        resp = requests.get(
            "https://www.youtube.com/oembed",
            params={
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "format": "json",
            },
            headers={"User-Agent": OEMBED_USER_AGENT},
            timeout=8,
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "title": data.get("title"),
            "author": data.get("author_name"),
            "thumbnail": data.get("thumbnail_url"),
        }
    except Exception:
        return {"title": None, "author": None, "thumbnail": None}


CACHE_TTL_SECONDS = 6 * 60 * 60  # 6 horas


def cache_key(video_id: str, lang: str | None) -> str:
    return f"transcript:{video_id}:{lang or 'auto'}"


async def get_cached_transcript(env, video_id: str, lang: str | None):
    """Lee del KV TRANSCRIPT_CACHE si esta configurado. Sin el binding
    (namespace no creado/no enlazado), el Worker sigue funcionando
    igual pero sin cache."""
    kv = getattr(env, "TRANSCRIPT_CACHE", None) if env is not None else None
    print(f"[cache] env={env is not None} kv={kv is not None}")
    if kv is None:
        return None
    try:
        raw = await kv.get(cache_key(video_id, lang))
        print(f"[cache] get key={cache_key(video_id, lang)} hit={raw is not None}")
        return json.loads(raw) if raw else None
    except Exception as e:
        print(f"[cache] get error: {e!r}")
        return None


async def set_cached_transcript(env, video_id: str, lang: str | None, data: dict):
    kv = getattr(env, "TRANSCRIPT_CACHE", None) if env is not None else None
    if kv is None:
        return
    try:
        await kv.put(
            cache_key(video_id, lang),
            json.dumps(data),
            expirationTtl=CACHE_TTL_SECONDS,
        )
        print(f"[cache] put key={cache_key(video_id, lang)} ok")
    except Exception as e:
        print(f"[cache] put error: {e!r}")


def build_thumbnails(video_id: str, thumbnail_url):
    """Miniaturas ordenadas de mejor a peor."""
    candidates = []
    if thumbnail_url:
        candidates.append(thumbnail_url)
    candidates.append(f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg")
    candidates.append(f"https://i.ytimg.com/vi/{video_id}/sddefault.jpg")
    candidates.append(f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg")
    candidates.append(f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg")
    seen = set()
    out = []
    for u in candidates:
        if u and u not in seen:
            seen.add(u)
            out.append(u)
    return out


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/metadata")
async def metadata(url: str = Query(...), platform: str = Query(...)):
    endpoint = OEMBED_ENDPOINTS.get(platform)
    if not endpoint:
        raise HTTPException(status_code=400, detail="Plataforma no soportada.")

    params = {"url": url}
    if platform == "instagram":
        params["access_token"] = ""

    try:
        resp = requests.get(
            endpoint,
            params=params,
            headers={"User-Agent": OEMBED_USER_AGENT},
            timeout=8,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="No se pudo obtener metadata.")

    return {
        "platform": platform,
        "title": data.get("title"),
        "author": data.get("author_name"),
        "thumbnailUrl": data.get("thumbnail_url"),
    }


@app.get("/transcript")
async def transcript(
    request: Request,
    video_id: str = Query(..., min_length=11, max_length=11),
    lang: str = Query(None),
):
    env = request.scope.get("env")

    cached = await get_cached_transcript(env, video_id, lang)
    if cached:
        return cached

    try:
        proxy_config = get_proxy_config()
        api = YouTubeTranscriptApi(proxy_config=proxy_config)
        transcript_list = api.list(video_id)

        chosen = None
        if lang:
            for t in transcript_list:
                if t.language_code == lang:
                    chosen = t
                    break

        if chosen is None:
            try:
                chosen = transcript_list.find_manually_created_transcript(["es", "en"])
            except Exception:
                pass

        if chosen is None:
            try:
                chosen = transcript_list.find_generated_transcript(["es", "en"])
            except Exception:
                pass

        if chosen is None:
            for t in transcript_list:
                chosen = t
                break

        if chosen is None:
            raise HTTPException(status_code=404, detail="No hay subtitulos publicos.")

        fetched = chosen.fetch()
        segments = [
            {
                "start": s.start,
                "duration": s.duration,
                "text": s.text.replace("\n", " ").strip(),
            }
            for s in fetched
            if s.text and s.text.strip()
        ]

        full_text = " ".join(s["text"] for s in segments)

        meta = fetch_youtube_oembed(video_id)
        thumbnails = build_thumbnails(video_id, meta["thumbnail"])

        result = {
            "platform": "youtube",
            "videoId": video_id,
            "title": meta["title"],
            "author": meta["author"],
            "thumbnails": thumbnails,
            "language": chosen.language_code,
            "languageName": getattr(chosen, "language", chosen.language_code),
            "isAutoGenerated": chosen.is_generated,
            "source": "speech-to-text" if chosen.is_generated else "native",
            "segmentCount": len(segments),
            "transcript": segments,
            "fullText": full_text,
        }
        await set_cached_transcript(env, video_id, lang, result)
        return result

    except TranscriptsDisabled:
        raise HTTPException(status_code=404, detail="Subtitulos desactivados para este video.")
    except NoTranscriptFound:
        raise HTTPException(status_code=404, detail="No se encontro ninguna pista de subtitulos.")
    except VideoUnavailable:
        raise HTTPException(status_code=404, detail="El video no existe o fue eliminado.")
    except VideoUnplayable as e:
        raise HTTPException(status_code=403, detail=f"El video no es reproducible: {e}")
    except RequestBlocked:
        raise HTTPException(
            status_code=503,
            detail="YouTube bloqueo la peticion. El proxy puede estar saturado.",
        )
    except IpBlocked:
        raise HTTPException(
            status_code=503,
            detail="La IP del proxy esta bloqueada por YouTube.",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inesperado: {e}")


# ---------- Entrypoint oficial para FastAPI en Cloudflare Python Workers ----------
Default = asgi.entrypoint(app)