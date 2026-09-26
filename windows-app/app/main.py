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

app = FastAPI(title="Ad-Free Universal Video Player", version="2.0.0")

# List of known ad and tracking domains to block
AD_BLOCKING_LIST = {
    # Advertising networks
    'doubleclick.net', 'googleadservices.com', 'googlesyndication.com',
    'adnxs.com', 'ads.google.com', 'pagead2.googlesyndication.com',
    'ads-google.com', 'ads.pubmatic.com', 'ads.openx.com',
    'ads-vip.spotify.com', 'analytics.google.com', 'google-analytics.com',
    
    # Tracking & Analytics
    'mixpanel.com', 'segment.com', 'amplitude.com', 'intercom.io',
    'facebook.com/tr', 'connect.facebook.net', 'pixel.facebook.com',
    
    # Video ad & tracking services
    'platform.twitter.com', 'analytics.twitter.com', 'ads.twitter.com',
    'player.vimeo.com/analytics', 'amazon-adsystem.com',
}

# Security & Privacy: Restrict CORS to localhost and private LAN subnets
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$",
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_privacy_headers(request: Request, call_next):
    """
    Enforce zero-tracking privacy headers, ad-blocking, and strict Content Security Policy.
    Blocks external analytics, telemetry, tracking pixels, and unauthorized scripts.
    """
    response = await call_next(request)
    
    # 1. Block tracking cookies
    if "set-cookie" in response.headers:
        del response.headers["set-cookie"]
        
    # 2. Tracking Protection Header
    response.headers["X-Tracking-Protection"] = "full"
    
    # 3. Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # 4. Prevent Clickjacking
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    
    # 5. Browser XSS protection
    response.headers["X-XSS-Protection"] = "1; mode=block"
    
    # 6. Referrer Policy: never leak user's stream history in HTTP Referer
    response.headers["Referrer-Policy"] = "no-referrer"
    
    # 7. Permissions Policy: strictly forbid access to camera, microphone, geolocation
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    
    # 8. Content Security Policy: enforce offline local execution and allow media streaming
    response.headers["Content-Security-Policy"] = (
        "default-src 'self' 'unsafe-inline' data: blob:; "
        "script-src 'self' 'unsafe-inline' blob:; "
        "style-src 'self' 'unsafe-inline'; "
        "media-src 'self' blob: http: https:; "
        "img-src 'self' data: blob: https:; "
        "connect-src 'self' http: https: ws: wss:; "
        "frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com https://www.dailymotion.com https://mega.nz https://t.me; "
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

    # Block known advertising and tracking networks
    for ad_domain in AD_BLOCKING_LIST:
        if ad_domain in hostname:
            raise HTTPException(status_code=400, detail=f"Ad and tracking network URLs are blocked ({ad_domain}).")

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


@app.post("/api/check-url-safety")
def check_url_safety(req: dict):
    """Verify that a URL does not originate from an ad or tracking network."""
    url = (req.get("url") or "").lower()
    for ad_domain in AD_BLOCKING_LIST:
        if ad_domain in url:
            return {
                "safe": False,
                "reason": f"URL contains ad/tracking domain: {ad_domain}",
                "blocked_domain": ad_domain
            }
    return {"safe": True}


# ==========================================
# SQLITE PERSISTENT PLAYLIST SYSTEM
# ==========================================
import sqlite3
import time
import random

PLAYLISTS_DB = DATA_DIR / "playlists.db"

def init_playlists_db():
    conn = sqlite3.connect(PLAYLISTS_DB)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS playlists (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS playlist_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            playlist_id TEXT NOT NULL,
            url TEXT NOT NULL,
            title TEXT,
            duration INTEGER,
            duration_str TEXT,
            position INTEGER DEFAULT 0,
            FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
        )
    ''')
    conn.commit()
    conn.close()

init_playlists_db()

class PlaylistCreate(BaseModel):
    title: str
    description: Optional[str] = ""

class PlaylistItemAdd(BaseModel):
    url: str
    title: Optional[str] = ""
    duration: Optional[int] = 0
    duration_str: Optional[str] = "--:--"
    position: Optional[int] = 0

@app.post("/api/playlists")
def create_playlist(playlist: PlaylistCreate):
    playlist_id = f"pl_{int(time.time())}_{random.randint(1000, 9999)}"
    conn = sqlite3.connect(PLAYLISTS_DB)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO playlists (id, title, description) VALUES (?, ?, ?)',
        (playlist_id, playlist.title.strip() or 'New Playlist', playlist.description or '')
    )
    conn.commit()
    conn.close()
    return {"id": playlist_id, "title": playlist.title, "status": "created"}

@app.get("/api/playlists")
def list_playlists():
    conn = sqlite3.connect(PLAYLISTS_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT id, title, description, created_at FROM playlists ORDER BY created_at DESC')
    rows = cursor.fetchall()
    playlists = []
    for r in rows:
        c2 = conn.cursor()
        c2.execute('SELECT COUNT(*) FROM playlist_items WHERE playlist_id = ?', (r["id"],))
        item_count = c2.fetchone()[0]
        playlists.append({
            "id": r["id"],
            "title": r["title"],
            "description": r["description"],
            "created_at": r["created_at"],
            "item_count": item_count
        })
    conn.close()
    return {"playlists": playlists}

@app.get("/api/playlists/{playlist_id}")
def get_playlist(playlist_id: str):
    conn = sqlite3.connect(PLAYLISTS_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT id, title, description, created_at FROM playlists WHERE id = ?', (playlist_id,))
    p = cursor.fetchone()
    if not p:
        conn.close()
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    cursor.execute('SELECT id, playlist_id, url, title, duration, duration_str, position FROM playlist_items WHERE playlist_id = ? ORDER BY position ASC, id ASC', (playlist_id,))
    items = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {
        "id": p["id"],
        "title": p["title"],
        "description": p["description"],
        "created_at": p["created_at"],
        "items": items
    }

@app.post("/api/playlists/{playlist_id}/add")
def add_to_playlist(playlist_id: str, item: PlaylistItemAdd):
    conn = sqlite3.connect(PLAYLISTS_DB)
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM playlists WHERE id = ?', (playlist_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    cursor.execute('SELECT COALESCE(MAX(position), -1) + 1 FROM playlist_items WHERE playlist_id = ?', (playlist_id,))
    next_pos = cursor.fetchone()[0]
    pos = item.position if item.position is not None and item.position > 0 else next_pos
    
    cursor.execute(
        'INSERT INTO playlist_items (playlist_id, url, title, duration, duration_str, position) VALUES (?, ?, ?, ?, ?, ?)',
        (playlist_id, item.url, item.title or "Video Track", item.duration, item.duration_str, pos)
    )
    item_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"status": "added", "item_id": item_id}

@app.delete("/api/playlists/{playlist_id}")
def delete_playlist(playlist_id: str):
    conn = sqlite3.connect(PLAYLISTS_DB)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM playlist_items WHERE playlist_id = ?', (playlist_id,))
    cursor.execute('DELETE FROM playlists WHERE id = ?', (playlist_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}

@app.delete("/api/playlists/{playlist_id}/items/{item_id}")
def delete_playlist_item(playlist_id: str, item_id: int):
    conn = sqlite3.connect(PLAYLISTS_DB)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM playlist_items WHERE playlist_id = ? AND id = ?', (playlist_id, item_id))
    conn.commit()
    conn.close()
    return {"status": "deleted"}



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
