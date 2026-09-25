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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
@app.head("/")
def index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return HTMLResponse("<h1>Ad-Free Video Player backend is running!</h1>")
