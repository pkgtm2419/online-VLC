"""
Universal Video Extractor
Extracts direct playable stream URLs, formats, audio, and metadata from any video URL.
Supports YouTube, Vimeo, Reddit, Twitter, TikTok, Facebook, Dailymotion,
cloud storage (Google Drive, Dropbox), direct media links (.mp4, .webm, .m3u8), and generic web pages.
"""

import re
import urllib.parse
from typing import Dict, Any, List, Optional
import yt_dlp

# Regex for common direct media files
DIRECT_MEDIA_REGEX = re.compile(r'\.(mp4|m4v|webm|ogv|ogg|mov|mkv|m3u8|mpd)(\?.*)?$', re.IGNORECASE)

def normalize_storage_url(url: str) -> str:
    """Normalize common cloud storage sharing links into direct stream URLs."""
    url = url.strip()
    
    # Dropbox: change dl=0 to raw=1
    if "dropbox.com" in url:
        if "dl=0" in url:
            url = url.replace("dl=0", "raw=1")
        elif "dl=1" not in url and "raw=1" not in url:
            sep = "&" if "?" in url else "?"
            url = f"{url}{sep}raw=1"
        return url

    # Google Drive: convert view link to direct export/uc link if possible
    gdrive_match = re.search(r'drive\.google\.com/file/d/([a-zA-Z0-9_-]+)', url)
    if gdrive_match:
        file_id = gdrive_match.group(1)
        return f"https://drive.google.com/uc?export=download&id={file_id}"

    gdrive_open = re.search(r'drive\.google\.com/open\?id=([a-zA-Z0-9_-]+)', url)
    if gdrive_open:
        file_id = gdrive_open.group(1)
        return f"https://drive.google.com/uc?export=download&id={file_id}"

    return url


def is_direct_media_link(url: str) -> bool:
    """Check if URL points directly to a video/stream file."""
    parsed = urllib.parse.urlparse(url)
    return bool(DIRECT_MEDIA_REGEX.search(parsed.path))


def format_duration(seconds: Optional[float]) -> str:
    """Convert seconds to HH:MM:SS or MM:SS."""
    if not seconds:
        return ""
    secs = int(seconds)
    hours = secs // 3600
    minutes = (secs % 3600) // 60
    remaining_secs = secs % 60
    if hours > 0:
        return f"{hours}:{minutes:02d}:{remaining_secs:02d}"
    return f"{minutes}:{remaining_secs:02d}"


def extract_video_info(url: str) -> Dict[str, Any]:
    """
    Extract video metadata and available stream formats from any video URL.
    Returns clean dictionary with playable stream options.
    """
    cleaned_url = normalize_storage_url(url.strip())
    
    # Check if it's already a direct media file
    if is_direct_media_link(cleaned_url):
        filename = cleaned_url.split('/')[-1].split('?')[0] or "Direct Video"
        ext = filename.split('.')[-1].lower() if '.' in filename else "mp4"
        is_hls = ext == "m3u8"
        return {
            "success": True,
            "title": urllib.parse.unquote(filename),
            "uploader": "Direct Link",
            "duration": None,
            "duration_str": "",
            "thumbnail": None,
            "webpage_url": cleaned_url,
            "is_direct": True,
            "qualities": [
                {
                    "label": "Original Quality",
                    "height": 1080,
                    "type": "direct",
                    "video_url": cleaned_url,
                    "audio_url": None,
                    "is_hls": is_hls
                }
            ],
            "default_quality_index": 0,
            "source": "Direct Link"
        }

    # yt-dlp options
    ydl_opts = {
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'simulate': True,
        'extract_flat': False,
        'no_check_certificates': True,
        'ignoreerrors': False,
        'remote_components': ['ejs:github'],
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        }
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(cleaned_url, download=False)
            
            if not info:
                raise Exception("Could not extract media info from this link.")
                
            if 'entries' in info and info['entries']:
                info = info['entries'][0]

            title = info.get('title') or "Untitled Video"
            uploader = info.get('uploader') or info.get('channel') or info.get('extractor_key') or ""
            duration = info.get('duration')
            thumbnail = info.get('thumbnail')
            webpage_url = info.get('webpage_url') or cleaned_url
            
            raw_formats = info.get('formats', [])
            
            # Filter out restricted/CORS-blocked Google Video manifests
            clean_formats = [
                f for f in raw_formats 
                if f.get('url') and 'manifest.googlevideo.com' not in f.get('url', '')
            ]

            # Best audio track (prefer https audio)
            audio_formats = [
                f for f in clean_formats 
                if f.get('acodec') != 'none' and f.get('vcodec') == 'none' and f.get('url')
            ]
            audio_formats.sort(key=lambda x: (x.get('protocol') == 'https', x.get('abr') or 0), reverse=True)
            best_audio_url = audio_formats[0]['url'] if audio_formats else None

            # Video qualities
            quality_options = []
            seen_heights = set()

            # 1. Progressive combined formats (both video + audio)
            combined_formats = [
                f for f in clean_formats 
                if f.get('vcodec') != 'none' and f.get('acodec') != 'none' and f.get('url')
            ]
            combined_formats.sort(key=lambda x: (x.get('height') or 0), reverse=True)

            for cf in combined_formats:
                h = cf.get('height') or 0
                label = f"{h}p" if h > 0 else "Auto"
                if h not in seen_heights and h > 0:
                    seen_heights.add(h)
                    quality_options.append({
                        "label": label,
                        "height": h,
                        "type": "direct",
                        "video_url": cf['url'],
                        "audio_url": None,
                        "is_hls": '.m3u8' in cf['url'] and 'googlevideo' not in cf['url'],
                        "ext": cf.get('ext', 'mp4')
                    })

            # 2. Video-only formats paired with best audio track
            video_formats = [
                f for f in clean_formats 
                if f.get('vcodec') != 'none' and f.get('height') and f.get('url')
            ]
            # Sort by height descending and prefer mp4 container
            video_formats.sort(key=lambda x: (x.get('height') or 0, x.get('ext') == 'mp4'), reverse=True)

            for vf in video_formats:
                h = vf.get('height') or 0
                if h >= 144 and h not in seen_heights:
                    seen_heights.add(h)
                    has_audio = vf.get('acodec') != 'none'
                    stream_type = "direct" if has_audio else ("mux" if best_audio_url else "direct")
                    is_hls = '.m3u8' in vf['url'] and 'googlevideo' not in vf['url']
                    
                    quality_options.append({
                        "label": f"{h}p" + (" HD" if h in (720, 1080) else "") + (" 4K" if h >= 2160 else ""),
                        "height": h,
                        "type": stream_type,
                        "video_url": vf['url'],
                        "audio_url": None if has_audio else best_audio_url,
                        "is_hls": is_hls,
                        "ext": vf.get('ext', 'mp4')
                    })

            # Sort quality options descending by resolution height
            quality_options.sort(key=lambda x: x.get('height', 0), reverse=True)

            # Fallback if quality_options is empty
            if not quality_options and info.get('url'):
                direct_url = info['url']
                quality_options.append({
                    "label": "Auto",
                    "height": info.get('height') or 720,
                    "type": "direct",
                    "video_url": direct_url,
                    "audio_url": None,
                    "is_hls": '.m3u8' in direct_url and 'googlevideo' not in direct_url,
                    "ext": info.get('ext', 'mp4')
                })

            # Select 720p or 1080p by default for fast, smooth loading
            default_index = 0
            for idx, q in enumerate(quality_options):
                if q['height'] in (720, 1080):
                    default_index = idx
                    break

            return {
                "success": True,
                "title": title,
                "uploader": uploader,
                "duration": duration,
                "duration_str": format_duration(duration),
                "thumbnail": thumbnail,
                "webpage_url": webpage_url,
                "is_direct": False,
                "qualities": quality_options,
                "default_quality_index": default_index,
                "source": info.get('extractor_key') or "Web"
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "fallback_url": cleaned_url,
            "title": "Video Stream",
            "qualities": [
                {
                    "label": "Direct",
                    "height": 720,
                    "type": "direct",
                    "video_url": cleaned_url,
                    "audio_url": None,
                    "is_hls": '.m3u8' in cleaned_url
                }
            ],
            "default_quality_index": 0
        }
