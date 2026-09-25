"""
Universal Video & Playlist Extractor
Extracts direct playable stream URLs, formats, audio, and metadata from any video or playlist URL.
Supports YouTube, Vimeo, Reddit, Twitter, TikTok, Facebook, Dailymotion,
cloud storage (Google Drive, Dropbox), direct media links (.mp4, .webm, .m3u8), and playlists.
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
        return "--:--"
    secs = int(seconds)
    hours = secs // 3600
    minutes = (secs % 3600) // 60
    remaining_secs = secs % 60
    if hours > 0:
        return f"{hours}:{minutes:02d}:{remaining_secs:02d}"
    return f"{minutes:02d}:{remaining_secs:02d}"


def unpack_dean_edwards(packed: str) -> str:
    m = re.search(r"\}\('(.*)',\s*(\d+),\s*(\d+),\s*'([^']*)'\.split\('\|'\)", packed)
    if not m:
        m = re.search(r'\}\("(.*)",\s*(\d+),\s*(\d+),\s*"([^"]*)"\.split\("\|"\)', packed)
    if not m:
        return ""
    p, a, c, k = m.groups()
    a = int(a)
    c = int(c)
    k = k.split('|')

    def baseN(num, b):
        digits = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        res = ""
        while num > 0:
            res = digits[num % b] + res
            num //= b
        return res or "0"

    for i in range(c - 1, -1, -1):
        val = k[i] if i < len(k) and k[i] else baseN(i, a)
        p = re.sub(r'\b' + baseN(i, a) + r'\b', val, p)
    return p


def extract_streams_from_html(html: str) -> List[str]:
    streams = []
    # 1. Unpack any Dean Edwards scripts
    packed_matches = re.findall(r'(eval\(function\(p,a,c,k,e,d\).*?\.split\([\'\"]\|[\'\"]\).*?\)\))', html, re.S)
    for pm in packed_matches:
        unpacked = unpack_dean_edwards(pm)
        m3u8s = re.findall(r'https?://[^\s"\'<>\\]+\.(?:m3u8|mp4)[^\s"\'<>\\]*', unpacked)
        if m3u8s:
            streams.extend(m3u8s)

    # 2. Search for direct m3u8 or mp4 in HTML
    m3u8s = re.findall(r'https?://[^\s"\'<>\\]+\.(?:m3u8|mp4)[^\s"\'<>\\]*', html)
    if m3u8s:
        streams.extend(m3u8s)

    # 3. Search for video or source src
    srcs = re.findall(r'<(?:video|source)[^>]+src=[\'"]([^\'"]+)[\'"]', html, re.I)
    for s in srcs:
        if any(ext in s.lower() for ext in ['.m3u8', '.mp4', '.webm', '.mkv']):
            streams.append(s)

    return list(dict.fromkeys(streams))


def scrape_movie_webpage(url: str) -> Optional[Dict[str, Any]]:
    """
    Intelligent scraper for movie/anime streaming pages, WordPress DooPlay players,
    and packed streaming hosts (Minochinos, Callistanise, ModiPlay, etc.).
    """
    import ssl
    import urllib.request
    import json

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
            final_url = resp.geturl()
            html = resp.read().decode('utf-8', errors='ignore')
    except Exception:
        return None

    # Title extraction
    title_m = re.search(r'<title>(.*?)</title>', html, re.I | re.S)
    raw_title = title_m.group(1).strip() if title_m else "Movie Stream"
    clean_title = re.sub(r'^(?:Multimovies\s*\|\s*|Download\s*[–—-]\s*|Watch\s+)', '', raw_title, flags=re.I).strip()
    clean_title = re.sub(r'\s*\|\s*Multimovies.*$', '', clean_title, flags=re.I).strip()
    clean_title = re.sub(r'\s*–\s*.*$', '', clean_title).strip()
    if not clean_title:
        clean_title = "Movie Stream"

    # Poster / Thumbnail
    thumb_m = re.search(r'<meta[^>]+property=[\'"]og:image[\'"][^>]+content=[\'"]([^\'"]+)[\'"]', html, re.I)
    thumbnail = thumb_m.group(1).strip() if thumb_m else None

    # 1. Direct stream in page
    streams = extract_streams_from_html(html)
    if streams:
        return {"title": clean_title, "stream": streams[0], "thumbnail": thumbnail}

    # 2. DooPlay player options (common on movie streaming sites)
    dooplay_lis = re.findall(r'<li[^>]+class=[\'"][^\'"]*dooplay_player_option[^\'"]*[\'"][^>]*>', html)
    dooplay_options = []
    for li in dooplay_lis:
        p_m = re.search(r'data-post=[\'"](\d+)[\'"]', li)
        n_m = re.search(r'data-nume=[\'"]([^\'"]+)[\'"]', li)
        t_m = re.search(r'data-type=[\'"]([^\'"]+)[\'"]', li)
        if p_m and n_m and t_m:
            dooplay_options.append((p_m.group(1), n_m.group(1), t_m.group(1)))

    embed_urls = []
    parsed_url = urllib.parse.urlparse(final_url)
    origin = f"{parsed_url.scheme}://{parsed_url.netloc}"

    if dooplay_options:
        for post_id, nume, opt_type in dooplay_options:
            if nume == 'trailer':
                continue
            try:
                ajax_data = urllib.parse.urlencode({
                    'action': 'doo_player_ajax',
                    'post': post_id,
                    'nume': nume,
                    'type': opt_type
                }).encode('utf-8')
                ajax_req = urllib.request.Request(
                    f"{origin}/wp-admin/admin-ajax.php",
                    data=ajax_data,
                    headers={
                        'User-Agent': headers['User-Agent'],
                        'Referer': final_url,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                )
                with urllib.request.urlopen(ajax_req, context=ctx, timeout=8) as aresp:
                    res_json = json.loads(aresp.read().decode('utf-8'))
                    emb = res_json.get('embed_url')
                    if emb:
                        emb = emb.replace('\\/', '/')
                        embed_urls.append(emb)
            except Exception:
                pass

    # 3. Look for streaming host / download links
    all_links = re.findall(r'href=[\'"](https?://[^\'"]+)[\'"]', html)
    for l in all_links:
        if any(h in l for h in ['minochinos.com', 'callistanise.com', 'embedseek', 'p2pplay', 'embed4me', 'rpmhub', 'streamwish', 'streamtape', 'vidcloud']):
            clean_l = l.replace('&amp;', '&')
            if '/download/' in clean_l:
                clean_l = clean_l.replace('/download/', '/embed/')
            embed_urls.append(clean_l)

    # 4. Resolve candidate embed pages to unpack direct video streams
    for e_url in embed_urls:
        try:
            ereq = urllib.request.Request(e_url, headers={'User-Agent': headers['User-Agent'], 'Referer': final_url})
            with urllib.request.urlopen(ereq, context=ctx, timeout=10) as eresp:
                e_html = eresp.read().decode('utf-8', errors='ignore')
                e_final = eresp.geturl()

            e_streams = extract_streams_from_html(e_html)
            if e_streams:
                return {"title": clean_title, "stream": e_streams[0], "thumbnail": thumbnail}

            # Check nested host links (e.g. minochinos inside modiplay embed)
            sub_links = re.findall(r'https?://[^\s"\'<>\\]+', e_html)
            for sl in sub_links:
                if any(h in sl for h in ['minochinos.com', 'callistanise.com']) and sl not in embed_urls:
                    csl = sl.replace('/download/', '/embed/').replace('&amp;', '&')
                    try:
                        sreq = urllib.request.Request(csl, headers={'User-Agent': headers['User-Agent'], 'Referer': e_final})
                        with urllib.request.urlopen(sreq, context=ctx, timeout=10) as sresp:
                            s_html = sresp.read().decode('utf-8', errors='ignore')
                            s_streams = extract_streams_from_html(s_html)
                            if s_streams:
                                return {"title": clean_title, "stream": s_streams[0], "thumbnail": thumbnail}
                    except Exception:
                        pass

            # Check sub-iframes (e.g. proxy.php)
            sub_iframes = re.findall(r'<iframe[^>]+src=[\'"]([^\'"]+)[\'"]', e_html)
            for sub_ifr in sub_iframes:
                sub_url = urllib.parse.urljoin(e_final, sub_ifr.replace('&amp;', '&'))
                try:
                    sreq = urllib.request.Request(sub_url, headers={'User-Agent': headers['User-Agent'], 'Referer': e_final})
                    with urllib.request.urlopen(sreq, context=ctx, timeout=10) as sresp:
                        s_html = sresp.read().decode('utf-8', errors='ignore')
                        s_streams = extract_streams_from_html(s_html)
                        if s_streams:
                            return {"title": clean_title, "stream": s_streams[0], "thumbnail": thumbnail}
                except Exception:
                    pass

        except Exception:
            pass

    # 5. Fallback: return embed URL if found
    if embed_urls:
        return {"title": clean_title, "embed": embed_urls[0], "thumbnail": thumbnail}

    return None


def extract_single_video_info(cleaned_url: str) -> Dict[str, Any]:
    """Extract formats and streams for an individual video link."""
    # Check direct media link
    if is_direct_media_link(cleaned_url):
        filename = cleaned_url.split('/')[-1].split('?')[0] or "Direct Media"
        ext = filename.split('.')[-1].lower() if '.' in filename else "mp4"
        is_hls = ext == "m3u8"
        return {
            "success": True,
            "is_playlist": False,
            "title": urllib.parse.unquote(filename),
            "uploader": "Direct Link",
            "duration": None,
            "duration_str": "--:--",
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

    ydl_opts = {
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'simulate': True,
        'extract_flat': False,
        'no_check_certificates': True,
        'ignoreerrors': False,
        'extractor_args': {
            'youtube': {
                'player_client': ['web_embedded', 'web_creator', 'mweb', 'android', 'web']
            }
        },
        'remote_components': ['ejs:github'],
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        }
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(cleaned_url, download=False)
        if not info:
            raise Exception("No video data retrieved.")
        if 'entries' in info and info['entries']:
            info = info['entries'][0]

        title = info.get('title') or "Untitled Video"
        uploader = info.get('uploader') or info.get('channel') or info.get('extractor_key') or ""
        duration = info.get('duration')
        thumbnail = info.get('thumbnail')
        webpage_url = info.get('webpage_url') or cleaned_url

        raw_formats = info.get('formats', [])
        clean_formats = [
            f for f in raw_formats 
            if f.get('url') and 'manifest.googlevideo.com' not in f.get('url', '')
        ]

        audio_formats = [
            f for f in clean_formats 
            if f.get('acodec') != 'none' and f.get('vcodec') == 'none' and f.get('url')
        ]
        audio_formats.sort(key=lambda x: (x.get('protocol') == 'https', x.get('abr') or 0), reverse=True)
        best_audio_url = audio_formats[0]['url'] if audio_formats else None

        quality_options = []
        seen_heights = set()

        # 1. Progressive streams (both video + audio)
        combined_formats = [
            f for f in clean_formats 
            if f.get('vcodec') != 'none' and f.get('acodec') != 'none' and f.get('url')
        ]
        combined_formats.sort(key=lambda x: (x.get('height') or 0), reverse=True)

        for cf in combined_formats:
            h = cf.get('height') or 0
            label = f"{h}p" if h > 0 else "Auto"
            is_cf_hls = (
                ('.m3u8' in cf['url'] or 'm3u8' in str(cf.get('protocol', '')) or cf.get('ext') == 'm3u8')
                and 'googlevideo' not in cf['url']
            )
            if h not in seen_heights and h > 0:
                seen_heights.add(h)
                quality_options.append({
                    "label": label,
                    "height": h,
                    "type": "direct",
                    "video_url": cf['url'],
                    "audio_url": None,
                    "is_hls": is_cf_hls,
                    "ext": cf.get('ext', 'mp4')
                })

        # 2. Video-only formats paired with best audio track
        video_formats = [
            f for f in clean_formats 
            if f.get('vcodec') != 'none' and f.get('height') and f.get('url')
        ]
        video_formats.sort(key=lambda x: (x.get('height') or 0, x.get('ext') == 'mp4'), reverse=True)

        for vf in video_formats:
            h = vf.get('height') or 0
            if h >= 144 and h not in seen_heights:
                seen_heights.add(h)
                has_audio = vf.get('acodec') != 'none'
                stream_type = "direct" if has_audio else ("mux" if best_audio_url else "direct")
                is_hls = (
                    ('.m3u8' in vf['url'] or 'm3u8' in str(vf.get('protocol', '')) or vf.get('ext') == 'm3u8')
                    and 'googlevideo' not in vf['url']
                )
                
                quality_options.append({
                    "label": f"{h}p" + (" HD" if h in (720, 1080) else "") + (" 4K" if h >= 2160 else ""),
                    "height": h,
                    "type": stream_type,
                    "video_url": vf['url'],
                    "audio_url": None if has_audio else best_audio_url,
                    "is_hls": is_hls,
                    "ext": vf.get('ext', 'mp4')
                })

        quality_options.sort(key=lambda x: x.get('height', 0), reverse=True)

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

        if not quality_options:
            raise Exception("No playable video streams found.")

        default_index = 0
        for idx, q in enumerate(quality_options):
            if q['height'] in (720, 1080):
                default_index = idx
                break

        return {
            "success": True,
            "is_playlist": False,
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


def extract_video_info(url: str, force_single: bool = False) -> Dict[str, Any]:
    """
    Extract video metadata and available stream formats from any video or playlist URL.
    Detects playlists automatically.
    """
    cleaned_url = normalize_storage_url(url.strip())

    # If it's a direct media file, no playlist check needed
    if is_direct_media_link(cleaned_url):
        return extract_single_video_info(cleaned_url)

    # Check for playlist if force_single is not requested
    if not force_single:
        flat_opts = {
            'quiet': True,
            'skip_download': True,
            'extract_flat': 'in_playlist',
            'extractor_args': {
                'youtube': {
                    'player_client': ['web_embedded', 'web_creator', 'mweb', 'android', 'web']
                }
            },
            'remote_components': ['ejs:github'],
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            }
        }

        try:
            with yt_dlp.YoutubeDL(flat_opts) as ydl:
                info = ydl.extract_info(cleaned_url, download=False)
                if info:
                    entries = list(info.get('entries', [])) if 'entries' in info else []
                    is_playlist = (info.get('_type') == 'playlist') or (len(entries) > 1)
                    
                    if is_playlist and entries:
                        playlist_title = info.get('title') or "Playlist"
                        formatted_entries = []
                        for idx, entry in enumerate(entries):
                            if not entry:
                                continue
                            e_url = entry.get('url')
                            if not e_url and entry.get('id'):
                                e_url = f"https://www.youtube.com/watch?v={entry.get('id')}"
                            if not e_url:
                                continue
                            formatted_entries.append({
                                "index": idx,
                                "id": entry.get('id') or str(idx),
                                "title": entry.get('title') or f"Track {idx + 1}",
                                "duration_str": format_duration(entry.get('duration')),
                                "duration": entry.get('duration'),
                                "url": e_url
                            })

                        # Extract full stream info for the first track so playback begins immediately
                        first_track_info = {}
                        if formatted_entries:
                            try:
                                first_track_info = extract_video_info(formatted_entries[0]['url'], force_single=True)
                            except Exception:
                                first_track_info = {}

                        return {
                            "success": True,
                            "is_playlist": True,
                            "playlist_title": playlist_title,
                            "total_tracks": len(formatted_entries),
                            "entries": formatted_entries,
                            # Provide first track details and streams
                            "title": first_track_info.get("title") or (formatted_entries[0]["title"] if formatted_entries else playlist_title),
                            "duration": first_track_info.get("duration"),
                            "duration_str": first_track_info.get("duration_str", "--:--"),
                            "thumbnail": first_track_info.get("thumbnail"),
                            "qualities": first_track_info.get("qualities", []),
                            "default_quality_index": first_track_info.get("default_quality_index", 0),
                            "current_track_index": 0
                        }
        except Exception as e:
            # If flat extraction failed or timed out, continue to single extraction
            pass

    # Single video extraction
    try:
        return extract_single_video_info(cleaned_url)
    except Exception as e:
        yt_match = re.search(r'(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/|v/|shorts/))([a-zA-Z0-9_-]{11})', cleaned_url)
        if yt_match:
            yt_id = yt_match.group(1)
            yt_title = "YouTube Video"
            yt_thumb = f"https://i.ytimg.com/vi/{yt_id}/hqdefault.jpg"
            try:
                import urllib.request, json
                req = urllib.request.Request(
                    f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={yt_id}&format=json",
                    headers={"User-Agent": "Mozilla/5.0"}
                )
                with urllib.request.urlopen(req, timeout=3) as resp:
                    oembed_data = json.loads(resp.read().decode('utf-8'))
                    yt_title = oembed_data.get('title') or yt_title
                    yt_thumb = oembed_data.get('thumbnail_url') or yt_thumb
            except Exception:
                pass

            return {
                "success": True,
                "is_playlist": False,
                "title": yt_title,
                "is_embed_fallback": True,
                "duration": None,
                "duration_str": "--:--",
                "thumbnail": yt_thumb,
                "qualities": [
                    {
                        "label": "Auto",
                        "height": 1080,
                        "type": "embed",
                        "video_url": f"https://www.youtube-nocookie.com/embed/{yt_id}?autoplay=1&rel=0&modestbranding=1",
                        "audio_url": None,
                        "is_hls": False
                    }
                ],
                "default_quality_index": 0
            }

        # Movie & web streaming site fallback
        scraped = scrape_movie_webpage(cleaned_url)
        if scraped:
            clean_title = scraped.get("title", "Movie Stream")
            thumb = scraped.get("thumbnail")
            if scraped.get("stream"):
                stream_url = scraped["stream"]
                is_hls = '.m3u8' in stream_url
                return {
                    "success": True,
                    "is_playlist": False,
                    "title": clean_title,
                    "uploader": "Web Stream",
                    "duration": None,
                    "duration_str": "--:--",
                    "thumbnail": thumb,
                    "webpage_url": cleaned_url,
                    "is_direct": True,
                    "qualities": [
                        {
                            "label": "Master HLS (Auto)" if is_hls else "Direct Stream",
                            "height": 1080,
                            "type": "direct",
                            "video_url": stream_url,
                            "audio_url": None,
                            "is_hls": is_hls
                        }
                    ],
                    "default_quality_index": 0
                }
            elif scraped.get("embed"):
                embed_url = scraped["embed"]
                return {
                    "success": True,
                    "is_playlist": False,
                    "title": clean_title,
                    "uploader": "Web Stream",
                    "duration": None,
                    "duration_str": "--:--",
                    "thumbnail": thumb,
                    "webpage_url": cleaned_url,
                    "is_direct": False,
                    "qualities": [
                        {
                            "label": "Embed Player",
                            "height": 1080,
                            "type": "embed",
                            "video_url": embed_url,
                            "audio_url": None,
                            "is_hls": False
                        }
                    ],
                    "default_quality_index": 0
                }

        return {
            "success": False,
            "error": str(e),
            "fallback_url": cleaned_url,
            "title": "Stream Video",
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
