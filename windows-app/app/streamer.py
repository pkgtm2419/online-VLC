"""
Streamer module:
Provides HTTP proxying with Range header support for seeking,
and on-the-fly zero-reencode FFmpeg muxing for paired video + audio streams.
"""

import os
import subprocess
import urllib.parse
from typing import AsyncGenerator
import httpx
from fastapi import Request, Response, HTTPException
from fastapi.responses import StreamingResponse

DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

DEFAULT_HEADERS = {
    'User-Agent': DEFAULT_UA,
    'Accept': '*/*',
    'Accept-Encoding': 'identity;q=1, *;q=0',
    'Accept-Language': 'en-US,en;q=0.9',
}

async def proxy_stream(url: str, request: Request) -> Response:
    """
    Proxies a video stream to the browser, forwarding Range headers for fast seeking
    and setting CORS headers to allow seamless playback.
    """
    client = httpx.AsyncClient(follow_redirects=True, timeout=30.0)
    req_headers = dict(DEFAULT_HEADERS)
    
    # Inject platform-specific referers to prevent 403 Forbidden on CDN links
    try:
        domain = urllib.parse.urlparse(url).netloc.lower()
        if any(x in domain for x in ['instagram', 'cdninstagram', 'fbcdn']):
            req_headers['Referer'] = 'https://www.instagram.com/'
        elif any(x in domain for x in ['tiktok', 'tiktokcdn', 'byteoversea', 'ibyteimg']):
            req_headers['Referer'] = 'https://www.tiktok.com/'
        elif any(x in domain for x in ['twimg', 'twitter', 'x.com']):
            req_headers['Referer'] = 'https://x.com/'
        elif any(x in domain for x in ['reddit', 'redd.it']):
            req_headers['Referer'] = 'https://www.reddit.com/'
    except Exception:
        pass

    if request:
        range_header = request.headers.get("range")
        if range_header:
            req_headers["range"] = range_header

    try:
        upstream_req = client.build_request("GET", url, headers=req_headers)
        upstream_resp = await client.send(upstream_req, stream=True)
        
        status_code = upstream_resp.status_code
        if status_code not in (200, 206):
            await upstream_resp.aclose()
            await client.aclose()
            raise HTTPException(status_code=status_code, detail=f"Upstream returned status {status_code}")

        forward_headers = {
            "Content-Type": upstream_resp.headers.get("Content-Type", "video/mp4"),
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        }
        
        if "Content-Range" in upstream_resp.headers:
            forward_headers["Content-Range"] = upstream_resp.headers["Content-Range"]
        if "Content-Length" in upstream_resp.headers:
            forward_headers["Content-Length"] = upstream_resp.headers["Content-Length"]

        async def stream_generator() -> AsyncGenerator[bytes, None]:
            try:
                async for chunk in upstream_resp.aiter_bytes(chunk_size=128 * 1024):
                    yield chunk
            finally:
                await upstream_resp.aclose()
                await client.aclose()

        return StreamingResponse(
            stream_generator(),
            status_code=status_code,
            headers=forward_headers,
            media_type=forward_headers["Content-Type"]
        )

    except Exception as e:
        await client.aclose()
        raise HTTPException(status_code=500, detail=str(e))


def stream_muxed_video(video_url: str, audio_url: str, start: float = 0.0) -> StreamingResponse:
    """
    Mux separate video and audio streams in real-time using FFmpeg with stream copy (-c:v copy).
    Uses proper browser User-Agent to prevent 403 Forbidden from CDN servers.
    """
    seek_str = str(max(0.0, start))
    
    cmd = [
        'ffmpeg',
        '-hide_banner',
        '-loglevel', 'error',
    ]

    # Video input with UA and reconnect flags
    cmd.extend([
        '-user_agent', DEFAULT_UA,
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5',
    ])
    if start > 0.5:
        cmd.extend(['-ss', seek_str])
    cmd.extend(['-i', video_url])

    # Audio input with UA and reconnect flags
    cmd.extend([
        '-user_agent', DEFAULT_UA,
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5',
    ])
    if start > 0.5:
        cmd.extend(['-ss', seek_str])
    cmd.extend(['-i', audio_url])

    # Mapping and fragmented MP4 flags for instant HTML5 video playback
    cmd.extend([
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-f', 'mp4',
        'pipe:1'
    ])

    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        bufsize=1024 * 1024
    )

    def iter_ffmpeg_bytes():
        try:
            while True:
                chunk = proc.stdout.read(64 * 1024)
                if not chunk:
                    break
                yield chunk
        finally:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=2.0)
                except subprocess.TimeoutExpired:
                    proc.kill()

    headers = {
        "Content-Type": "video/mp4",
        "Accept-Ranges": "none",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "no-cache",
    }

    return StreamingResponse(
        iter_ffmpeg_bytes(),
        media_type="video/mp4",
        headers=headers
    )
