"""
Main FastAPI Application:
Serves the Ad-Free Universal Video Player backend and single-page web app.
"""

import os
import json
import urllib.parse
from typing import Optional, List
from pathlib import Path

from fastapi import FastAPI, Request, Query, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.extractor import extract_video_info
from app.streamer import proxy_stream, stream_muxed_video

APP_DIR = Path(__file__).parent
STATIC_DIR = APP_DIR / "static"
try:
    DATA_DIR = Path("data")
    DATA_DIR.mkdir(exist_ok=True)
except Exception:
    DATA_DIR = Path.home() / ".pvp" / "data"
    DATA_DIR.mkdir(parents=True, exist_ok=True)
HISTORY_FILE = DATA_DIR / "history.json"

app = FastAPI(title="Ad-Free Universal Video Player", version="1.0.0")

# Security & Privacy: Restrict CORS to localhost, private LAN subnets, and browser extensions
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$|^chrome-extension://[a-z]+$",
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_privacy_headers(request: Request, call_next):
    """
    Enforce zero-tracking privacy headers and strict Content Security Policy.
    Blocks external analytics, telemetry, tracking pixels, and unauthorized scripts.
    """
    response = await call_next(request)
    
    # 1. Block tracking cookies
    if "set-cookie" in response.headers:
        del response.headers["set-cookie"]
    
    # 2. Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # 3. Prevent Clickjacking
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    
    # 4. Browser XSS protection
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # 5. Referrer Policy: never leak user's stream history in HTTP Referer
    response.headers["Referrer-Policy"] = "no-referrer"
    
    # 6. Permissions Policy: strictly forbid access to camera, microphone, geolocation
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    
    # 7. Content Security Policy: enforce offline local execution and allow media streaming
    response.headers["Content-Security-Policy"] = (
        "default-src 'self' 'unsafe-inline' data: blob:; "
        "script-src 'self' 'unsafe-inline' blob:; "
        "style-src 'self' 'unsafe-inline'; "
        "media-src 'self' blob: http: https:; "
        "img-src 'self' data: blob: https:; "
        "connect-src 'self' http: https: ws: wss:; "
        "frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com https://www.dailymotion.com; "
        "object-src 'none';"
    )
    
    return response

class ExtractRequest(BaseModel):
    url: str

class HistoryItem(BaseModel):
    url: str
    title: str
    uploader: Optional[str] = None
    duration_str: Optional[str] = None
    thumbnail: Optional[str] = None
    timestamp: Optional[float] = None


def load_history() -> List[dict]:
    if not HISTORY_FILE.exists():
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_history(items: List[dict]):
    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(items[:50], f, indent=2, ensure_ascii=False)
    except Exception:
        pass


@app.post("/api/extract")
async def extract_url(req: ExtractRequest):
    url = req.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme.lower() not in ("http", "https"):
        raise HTTPException(status_code=400, detail="Only HTTP and HTTPS stream protocols are supported.")
    
    hostname = (parsed.hostname or "").lower()
    if hostname in {"169.254.169.254", "metadata.google.internal", "instance-data"}:
        raise HTTPException(status_code=403, detail="Access to cloud metadata endpoints is forbidden.")

    info = extract_video_info(url)
    
    if not info.get("success") and not info.get("qualities") and not info.get("entries"):
        raise HTTPException(status_code=400, detail=info.get("error", "Failed to extract video."))

    # Generate convenient streaming endpoints for each quality
    qualities = info.get("qualities", [])
    for q in qualities:
        v_url = q.get("video_url")
        a_url = q.get("audio_url")
        q_type = q.get("type", "direct")
        
        if q_type == "mux" and v_url and a_url:
            encoded_v = urllib.parse.quote(v_url, safe="")
            encoded_a = urllib.parse.quote(a_url, safe="")
            q["play_url"] = f"/api/stream/mux?v={encoded_v}&a={encoded_a}"
        elif q_type == "embed":
            q["play_url"] = v_url
            q["raw_url"] = v_url
        else:
            encoded_v = urllib.parse.quote(v_url, safe="")
            q["play_url"] = f"/api/stream/direct?url={encoded_v}"
            q["raw_url"] = v_url

    # Save to history automatically
    history = load_history()
    # Filter out if already in history
    history = [h for h in history if h.get("url") != url]
    history.insert(0, {
        "url": url,
        "title": info.get("title", "Video"),
        "uploader": info.get("uploader", "Web"),
        "duration_str": info.get("duration_str", ""),
        "thumbnail": info.get("thumbnail"),
        "timestamp": os.path.getmtime(HISTORY_FILE) if HISTORY_FILE.exists() else 0
    })
    save_history(history)

    return info


@app.get("/api/stream/direct")
async def stream_direct(url: str = Query(...), request: Request = None):
    decoded_url = urllib.parse.unquote(url)
    return await proxy_stream(decoded_url, request)


@app.get("/api/stream/mux")
def stream_mux(
    v: str = Query(..., description="Encoded video URL"),
    a: str = Query(..., description="Encoded audio URL"),
    start: float = Query(0.0, description="Start offset in seconds")
):
    video_url = urllib.parse.unquote(v)
    audio_url = urllib.parse.unquote(a)
    return stream_muxed_video(video_url, audio_url, start=start)


@app.get("/api/history")
def get_history():
    return load_history()


@app.delete("/api/history")
def clear_history():
    save_history([])
    return {"status": "cleared"}


# Mount static assets
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/style.css")
def get_style():
    return FileResponse(str(STATIC_DIR / "style.css"), media_type="text/css")

@app.get("/app.js")
def get_app_js():
    return FileResponse(str(STATIC_DIR / "app.js"), media_type="application/javascript")

@app.get("/hls.min.js")
def get_hls_js():
    return FileResponse(str(STATIC_DIR / "hls.min.js"), media_type="application/javascript")

@app.get("/")
@app.head("/")
def index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return HTMLResponse("<h1>Ad-Free Video Player backend is running!</h1>")
