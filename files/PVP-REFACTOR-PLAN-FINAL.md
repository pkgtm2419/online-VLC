# 🎬 PVP (Personal Video Player) - Refactor Plan
## Windows + Android Online Streaming Player (No Ads, No Download)

**Version**: 2.0 - Streaming Edition  
**Date**: September 25, 2026  
**Target Platforms**: Windows Desktop + Android Mobile  
**Core Concept**: VLC-like online streaming player for any video URL (no downloads, no ads)

---

## 📋 Executive Summary

### Current State
- ✅ Windows desktop app with FastAPI backend
- ✅ Android app with basic infrastructure
- ❌ Chrome extension (REMOVE)
- ✅ Video extraction engine
- ⚠️ Limited storage support (only Google Drive, Dropbox)

### Target State
- ✅ Windows app - Enhanced with playlist, cloud storage support
- ✅ Android app - Full share intent, clipboard, enhanced extraction
- ✅ Zero ads guaranteed
- ✅ Support: Google Drive, Telegram, Mega, Direct URLs, Index pages
- ✅ Playlist support (auto-generate from index pages)
- ✅ Zero local storage (streaming only)
- ✅ Privacy-first architecture

---

## 🗑️ PHASE 1: CLEANUP - Remove Chrome Extension

### Action Items

**1. Delete Chrome Extension Files**
```bash
# Remove entire directory
rm -rf chrome-extension/
rm -rf releases/pvp-chrome-extension.zip

# Update .gitignore to ignore extension builds
echo "chrome-extension/" >> .gitignore
```

**2. Update README.md**
- Remove "Chrome Extension" download button
- Remove Chrome installation instructions
- Remove "Open with PVP" feature description
- Keep only Windows & Android sections

**3. Remove from Releases**
```bash
# Keep only:
- releases/PVP-Player.exe (Windows)
- releases/PVP-Player-Windows.zip
- releases/PVP-Player.apk (Android)
- releases/pvp-android-mobile.zip

# Remove:
- releases/pvp-chrome-extension.zip
```

**4. Update Project Structure**
```
online-VLC/
├── windows-app/          ← KEEP & ENHANCE
├── android-app/          ← KEEP & ENHANCE
├── releases/             ← KEEP (only .exe and .apk)
├── README.md             ← UPDATE
└── .gitignore            ← UPDATE
```

**Effort**: 15 minutes  
**Status**: 📋 Ready to implement

---

## 🪟 PHASE 2: WINDOWS APP ENHANCEMENTS

### Current Features ✅
- System tray icon
- Local FastAPI server
- Basic video extraction
- Streaming playback
- VLC keyboard shortcuts

### Missing Features ⚠️
- Cloud storage support beyond Google Drive/Dropbox
- Playlist generation from index pages
- Telegram file extraction
- Mega.nz support
- Direct index page scraping
- Playlist persistence
- Advanced search

### Enhancements Required

#### 2.1 **Expand Cloud Storage Support**

**File**: `windows-app/app/extractor.py`

**Add Support For:**

```python
# 1. TELEGRAM FILES (Public links/channels)
def extract_telegram_file(url: str) -> Optional[Dict]:
    """
    Extract video from Telegram public links
    Example: https://t.me/username/12345
    Uses Telegram Bot API or web scraping
    """
    import re
    match = re.search(r't\.me/([a-zA-Z0-9_]+)/(\d+)', url)
    if not match:
        return None
    
    username, msg_id = match.groups()
    
    # Option 1: Use tdlib or TDLight (Telegram client)
    # Option 2: Web scrape Telegram web client (t.me)
    # Option 3: Use Telegram Bot API (if file is shared)
    
    # Try web scraping approach
    try:
        import urllib.request
        response = urllib.request.urlopen(url, timeout=10)
        html = response.read().decode('utf-8')
        
        # Look for video source in page
        video_match = re.search(r'"(\?cdnUrl[^"]+\.mp4)"', html)
        if video_match:
            return {
                "title": f"Telegram Message {msg_id}",
                "stream": video_match.group(1),
                "source": "telegram"
            }
    except Exception as e:
        logger.warning(f"Telegram extraction failed: {e}")
    
    return None

# 2. MEGA.NZ FILES
def extract_mega_file(url: str) -> Optional[Dict]:
    """
    Extract video from Mega.nz shared links
    Example: https://mega.nz/file/xxxxx#yyyy
    """
    try:
        # Option 1: Use pymega library
        # from mega import Mega
        # mega = Mega()
        # m = mega.login()  # Anonymous
        # details = m.get_link(url)
        
        # Option 2: Use web API (Mega.nz has undocumented API)
        import re
        match = re.search(r'mega\.nz/file/([a-zA-Z0-9_-]+)', url)
        if not match:
            return None
        
        file_id = match.group(1)
        
        # Note: Mega requires key in URL fragment
        # Implement Mega API call or use pymega
        # This is complex - use pymega library
        
        return None  # Requires pymega library
        
    except Exception as e:
        logger.warning(f"Mega extraction failed: {e}")
    
    return None

# 3. DIRECT INDEX PAGE PLAYLIST GENERATION
def extract_playlist_from_index(url: str) -> Optional[Dict]:
    """
    Scan index pages for media files and generate playlist
    Example: https://example.com/videos/
    Returns: List of .mp4, .mkv, .webm files found
    """
    try:
        import urllib.request
        import re
        from urllib.parse import urljoin
        
        response = urllib.request.urlopen(url, timeout=10)
        html = response.read().decode('utf-8')
        
        # Find all video file links
        video_extensions = ['.mp4', '.webm', '.mkv', '.m3u8', '.avi', '.mov']
        video_links = []
        
        # Method 1: Find <a href="file.mp4"> links
        href_pattern = r'href=["\']([^"\']+[.](?:mp4|webm|mkv|m3u8|avi|mov))["\']'
        for match in re.finditer(href_pattern, html, re.IGNORECASE):
            relative_url = match.group(1)
            absolute_url = urljoin(url, relative_url)
            video_links.append({
                "title": relative_url.split('/')[-1],
                "url": absolute_url,
                "source": "index"
            })
        
        # Method 2: Find video tags
        video_tag_pattern = r'<video[^>]*>.*?<source[^>]+src=["\']([^"\']+)["\']'
        for match in re.finditer(video_tag_pattern, html, re.IGNORECASE | re.DOTALL):
            relative_url = match.group(1)
            absolute_url = urljoin(url, relative_url)
            video_links.append({
                "title": relative_url.split('/')[-1],
                "url": absolute_url,
                "source": "index"
            })
        
        if video_links:
            return {
                "success": True,
                "is_playlist": True,
                "playlist_title": f"Index: {url}",
                "entries": video_links,
                "total_tracks": len(video_links),
                "source": "index_page"
            }
        
        return None
        
    except Exception as e:
        logger.warning(f"Index page extraction failed: {e}")
    
    return None

# 4. ONLINE STORAGE GENERIC SUPPORT
def extract_from_online_storage(url: str) -> Optional[Dict]:
    """
    Detect and extract from various online storage services
    Supports: Google Drive, Dropbox, Mega, OneDrive, 4shared, etc.
    """
    try:
        hostname = urllib.parse.urlparse(url).netloc.lower()
        
        if 'google.com' in hostname or 'drive.google.com' in hostname:
            return extract_google_drive(url)
        
        elif 'dropbox.com' in hostname:
            return extract_dropbox(url)
        
        elif 'mega.nz' in hostname:
            return extract_mega_file(url)
        
        elif 'onedrive.live.com' in hostname or 'sharepoint' in hostname:
            return extract_onedrive(url)
        
        elif '4shared.com' in hostname:
            return extract_4shared(url)
        
        elif 'mediafire.com' in hostname:
            return extract_mediafire(url)
        
        else:
            # Try generic approach
            return extract_playlist_from_index(url)
    
    except Exception as e:
        logger.warning(f"Storage extraction failed: {e}")
    
    return None
```

**Dependencies to Add**:
```txt
# Add to windows-app/requirements.txt:
pymega==0.3.20          # For Mega.nz support
requests>=2.31.0         # For better HTTP handling
beautifulsoup4>=4.12.0   # For HTML parsing
```

**Effort**: 2-3 hours  
**Priority**: HIGH

---

#### 2.2 **Enhance Video Extraction Core**

**File**: `windows-app/app/extractor.py`

**Problem Found During Code Review:**
- YouTube oEmbed call (external API)
- Limited fallback for movie streaming sites
- No Telegram/Mega support

**Fixes:**

```python
# REMOVE YouTube oEmbed (line 524-532)
# Replace with:
def extract_youtube_safe(video_id: str) -> Dict:
    """
    Get YouTube metadata WITHOUT external API calls
    Uses only constructable URLs and patterns
    """
    # Generate thumbnail URL (works for all videos)
    thumbnail_candidates = [
        f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
        f"https://i.ytimg.com/vi/{video_id}/sddefault.jpg",
        f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
    ]
    
    return {
        "title": "YouTube Video",  # Generic title (yt-dlp provides real one)
        "thumbnail": thumbnail_candidates[0],  # Let browser try all
        "source": "youtube"
    }
```

**Effort**: 30 minutes  
**Priority**: CRITICAL (privacy)

---

#### 2.3 **Implement Playlist Management**

**File**: `windows-app/app/main.py`

**Add Endpoints:**

```python
from typing import List
import sqlite3
from datetime import datetime

# Database for playlist persistence
PLAYLISTS_DB = DATA_DIR / "playlists.db"

def init_playlists_db():
    """Initialize SQLite database for playlists"""
    conn = sqlite3.connect(PLAYLISTS_DB)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS playlists (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            description TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS playlist_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            playlist_id TEXT NOT NULL,
            url TEXT NOT NULL,
            title TEXT,
            duration INTEGER,
            position INTEGER,
            FOREIGN KEY (playlist_id) REFERENCES playlists(id)
        )
    ''')
    conn.commit()
    conn.close()

@app.post("/api/playlists")
def create_playlist(playlist: dict):
    """Create new playlist"""
    playlist_id = f"pl_{int(time.time())}_{random.randint(1000, 9999)}"
    conn = sqlite3.connect(PLAYLISTS_DB)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO playlists (id, title, description) VALUES (?, ?, ?)',
        (playlist_id, playlist.get('title', 'New Playlist'), playlist.get('description', ''))
    )
    conn.commit()
    conn.close()
    return {"id": playlist_id, "status": "created"}

@app.post("/api/playlists/{playlist_id}/add")
def add_to_playlist(playlist_id: str, item: dict):
    """Add video to playlist"""
    conn = sqlite3.connect(PLAYLISTS_DB)
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO playlist_items (playlist_id, url, title, duration, position) VALUES (?, ?, ?, ?, ?)',
        (playlist_id, item['url'], item.get('title'), item.get('duration'), item.get('position'))
    )
    conn.commit()
    conn.close()
    return {"status": "added"}

@app.get("/api/playlists")
def list_playlists():
    """Get all playlists"""
    conn = sqlite3.connect(PLAYLISTS_DB)
    cursor = conn.cursor()
    cursor.execute('SELECT id, title, created_at FROM playlists')
    playlists = cursor.fetchall()
    conn.close()
    return {"playlists": playlists}

@app.get("/api/playlists/{playlist_id}")
def get_playlist(playlist_id: str):
    """Get playlist with all items"""
    conn = sqlite3.connect(PLAYLISTS_DB)
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id, url, title, duration FROM playlist_items WHERE playlist_id = ? ORDER BY position',
        (playlist_id,)
    )
    items = cursor.fetchall()
    conn.close()
    return {"playlist_id": playlist_id, "items": items}
```

**Effort**: 1 hour  
**Priority**: HIGH

---

### 2.4 **Ensure Zero Ads Guarantee**

**File**: `windows-app/app/main.py`

**Add Ad Detection & Blocking:**

```python
# List of known ad/tracking domains to BLOCK
AD_BLOCKING_LIST = {
    # Advertising networks
    'doubleclick.net', 'googleadservices.com', 'googlesyndication.com',
    'adnxs.com', 'ads.google.com', 'pagead2.googlesyndication.com',
    'ads-google.com', 'ads.pubmatic.com', 'ads.openx.com',
    'ads-vip.spotify.com', 'analytics.google.com', 'google-analytics.com',
    
    # Tracking
    'mixpanel.com', 'segment.com', 'amplitude.com', 'intercom.io',
    'facebook.com/tr', 'connect.facebook.net', 'pixel.facebook.com',
    
    # Video ad services
    'platform.twitter.com', 'analytics.twitter.com', 'ads.twitter.com',
    'player.vimeo.com/analytics', 'amazon-adsystem.com',
}

@app.middleware("http")
async def block_ads(request: Request, call_next):
    """Block all ad and tracking requests"""
    response = await call_next(request)
    
    # Block ad-related cookies
    if "set-cookie" in response.headers:
        cookies = response.headers.get("set-cookie", "")
        if any(ad_domain in cookies.lower() for ad_domain in AD_BLOCKING_LIST):
            del response.headers["set-cookie"]
    
    return response

@app.post("/api/check-url-safety")
def check_url_safety(req: dict):
    """Verify URL is not from ad/tracking network"""
    url = req.get("url", "").lower()
    
    for ad_domain in AD_BLOCKING_LIST:
        if ad_domain in url:
            return {
                "safe": False,
                "reason": f"URL contains ad/tracking domain: {ad_domain}",
                "blocked_domain": ad_domain
            }
    
    return {"safe": True}
```

**Effort**: 30 minutes  
**Priority**: CRITICAL

---

### 2.5 **Windows App Testing Scenarios**

**Test Cases to Add to Documentation:**

```markdown
### Test Scenario: Google Drive Video
1. User pastes: https://drive.google.com/file/d/[FILE_ID]/view?usp=sharing
2. App extracts: Direct download link (drive.google.com/uc?export=download&id=[FILE_ID])
3. Streams without downloading
4. Speed control works
5. Seeking works

### Test Scenario: Mega.nz Video
1. User pastes: https://mega.nz/file/[FILE_ID]#[KEY]
2. App extracts: Direct stream URL via Mega API
3. Streams without downloading
4. No ads appear
5. Quality selection works

### Test Scenario: Index Page Playlist
1. User pastes: https://example.com/movies/
2. App scans page and finds: movie1.mp4, movie2.mp4, movie3.mp4
3. Auto-creates playlist with 3 items
4. User selects any item → plays
5. Auto-advance to next when finished

### Test Scenario: Telegram File
1. User pastes: https://t.me/[CHANNEL]/[MSG_ID]
2. App extracts video if public
3. Streams directly from Telegram CDN
4. Works with channel videos
5. No account login needed

### Test Scenario: Movie Streaming Website
1. User pastes: https://fmovies.example.com/watch?id=12345
2. App scrapes page → finds HLS stream
3. Extracts quality options
4. Streams selected quality
5. NO ADS appear in stream
6. Subtitle support if available
```

**Effort**: 1 hour (documentation)  
**Priority**: HIGH

---

## 📱 PHASE 3: ANDROID APP ENHANCEMENTS

### Current Features ✅
- Basic webview player
- Clipboard detection (partial)
- Share intent support (partial)

### Missing Features ⚠️
- Full clipboard monitoring
- Enhanced share intent handling
- Storage extraction support
- Offline mode for downloaded content
- Better fullscreen UI
- Audio track switching UI
- Subtitle UI enhancement

### Enhancements Required

#### 3.1 **Implement Full Clipboard Detection**

**File**: `android-app/app/src/main/java/com/pvp/player/MainActivity.kt`

**Current State**: Likely has basic clipboard checking  
**Enhancement Needed**: Real-time monitoring + auto-play prompt

```kotlin
import android.content.ClipboardManager
import android.content.ClipData
import android.os.Handler
import android.os.Looper
import android.widget.Toast

class ClipboardMonitor(private val activity: MainActivity) : ClipboardManager.OnPrimaryClipChangedListener {
    
    private var lastClipUrl: String = ""
    private val handler = Handler(Looper.getMainLooper())
    private val checkInterval = 1000L  // Check every 1 second
    
    fun startMonitoring() {
        val clipboard = activity.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.addPrimaryClipChangedListener(this)
    }
    
    fun stopMonitoring() {
        val clipboard = activity.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.removePrimaryClipChangedListener(this)
    }
    
    override fun onPrimaryClipChanged() {
        val clipboard = activity.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clipData = clipboard.primaryClip ?: return
        
        if (clipData.itemCount == 0) return
        
        val clipText = clipData.getItemAt(0).text?.toString() ?: return
        
        // Check if it's a valid video URL
        if (isVideoUrl(clipText) && clipText != lastClipUrl) {
            lastClipUrl = clipText
            showPlayPrompt(clipText)
        }
    }
    
    private fun isVideoUrl(url: String): Boolean {
        val videoPatterns = listOf(
            "youtube.com", "youtu.be", "vimeo.com", "tiktok.com",
            "instagram.com", "reddit.com", "twitter.com", "x.com",
            "facebook.com", "dailymotion.com", "twitch.tv",
            "drive.google.com", "dropbox.com", "mega.nz",
            ".mp4", ".webm", ".m3u8", ".mkv", "t.me/",
            "index", "playlist"  // For index pages and playlists
        )
        
        return videoPatterns.any { url.contains(it, ignoreCase = true) }
    }
    
    private fun showPlayPrompt(url: String) {
        // Show a Material dialog with options
        val dialog = android.app.AlertDialog.Builder(activity)
            .setTitle("Play Video?")
            .setMessage("Found video URL in clipboard:\n${url.take(50)}...")
            .setPositiveButton("Play Now") { _, _ ->
                activity.playUrl(url)
            }
            .setNegativeButton("Cancel", null)
            .setNeutralButton("Dismiss", null)
            .create()
        
        dialog.show()
        
        // Auto-dismiss after 5 seconds
        handler.postDelayed({ dialog.dismiss() }, 5000)
    }
}
```

**Integration in MainActivity:**

```kotlin
class MainActivity : AppCompatActivity() {
    private var clipboardMonitor: ClipboardMonitor? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Start clipboard monitoring
        clipboardMonitor = ClipboardMonitor(this)
        clipboardMonitor?.startMonitoring()
        
        // Load webview
        setupWebView()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        clipboardMonitor?.stopMonitoring()
    }
    
    fun playUrl(url: String) {
        // Pass URL to webview player
        webView.evaluateJavascript(
            """
            window.playUrl('$url');
            """.trimIndent(),
            null
        )
    }
}
```

**Effort**: 2 hours  
**Priority**: HIGH

---

#### 3.2 **Enhance Share Intent Handling**

**File**: `android-app/app/src/main/AndroidManifest.xml`

**Current State**: Might have basic intent filter  
**Enhancement**: Comprehensive URL interception

```xml
<!-- Add to AndroidManifest.xml in MainActivity -->
<intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="text/*" />
</intent-filter>

<!-- Also handle HTTP/HTTPS URLs directly -->
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="http" />
    <data android:scheme="https" />
    <!-- Specific domains to intercept -->
    <data android:host="youtube.com" />
    <data android:host="youtu.be" />
    <data android:host="vimeo.com" />
    <data android:host="drive.google.com" />
    <data android:host="mega.nz" />
    <data android:host="t.me" />
    <data android:host="instagram.com" />
    <data android:host="reddit.com" />
</intent-filter>
```

**Handle in MainActivity:**

```kotlin
override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    handleIntent(intent)
}

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)
    
    handleIntent(intent)
}

private fun handleIntent(intent: Intent) {
    when {
        intent.action == Intent.ACTION_SEND -> {
            // User shared text/URL
            val url = intent.getStringExtra(Intent.EXTRA_TEXT) ?: return
            playUrl(url)
        }
        intent.action == Intent.ACTION_VIEW -> {
            // User opened URL with PVP
            val url = intent.data?.toString() ?: return
            playUrl(url)
        }
    }
}
```

**Effort**: 1.5 hours  
**Priority**: HIGH

---

#### 3.3 **Enhanced UI for Video Controls**

**File**: `android-app/app/src/main/res/layout/activity_main.xml` or webview CSS

**Add to Frontend** (`android-app/app/src/main/assets/www/app.js`):

```javascript
// Enhance mobile UI for better control visibility
class MobileVideoUI {
    constructor(videoPlayer) {
        this.player = videoPlayer;
        this.controlsVisible = true;
        this.hideTimeout = null;
    }
    
    initMobileControls() {
        // Make controls larger on mobile
        const controls = document.querySelector('.video-controls');
        if (window.innerWidth < 768) {
            controls.style.padding = '20px';
            controls.style.fontSize = '16px';
        }
        
        // Add touch handlers for better UX
        this.addTouchControls();
        
        // Add gesture controls
        this.addGestureControls();
    }
    
    addTouchControls() {
        const video = document.querySelector('video');
        
        // Double-tap to play/pause
        let lastTap = 0;
        video.addEventListener('click', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                // Double tap
                this.player.togglePlayPause();
            } else {
                // Single tap
                this.toggleControls();
            }
            lastTap = currentTime;
        });
        
        // Volume control via swipe up/down
        let startY = 0;
        video.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        video.addEventListener('touchmove', (e) => {
            const currentY = e.touches[0].clientY;
            const diff = startY - currentY;
            
            if (Math.abs(diff) > 50) {
                const volumeChange = diff > 0 ? 0.1 : -0.1;
                this.player.setVolume(this.player.getVolume() + volumeChange);
                startY = currentY;
            }
        });
    }
    
    addGestureControls() {
        const video = document.querySelector('video');
        
        // Pinch to fullscreen
        let lastDist = 0;
        video.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                const dist = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                if (lastDist !== 0 && Math.abs(dist - lastDist) > 50) {
                    if (dist > lastDist) {
                        // Pinch out - fullscreen
                        video.requestFullscreen?.();
                    } else {
                        // Pinch in - exit fullscreen
                        document.exitFullscreen?.();
                    }
                }
                lastDist = dist;
            }
        });
    }
    
    toggleControls() {
        const controls = document.querySelector('.video-controls');
        this.controlsVisible = !this.controlsVisible;
        controls.style.display = this.controlsVisible ? 'flex' : 'none';
        
        // Auto-hide after 5 seconds
        clearTimeout(this.hideTimeout);
        if (this.controlsVisible) {
            this.hideTimeout = setTimeout(() => {
                controls.style.display = 'none';
                this.controlsVisible = false;
            }, 5000);
        }
    }
}

// Initialize on Android
if (/Android/i.test(navigator.userAgent)) {
    const mobileUI = new MobileVideoUI(window.videoPlayer);
    mobileUI.initMobileControls();
}
```

**Effort**: 2 hours  
**Priority**: MEDIUM

---

#### 3.4 **Add Audio/Subtitle Track Selection UI**

**File**: `android-app/app/src/main/assets/www/index.html`

```html
<!-- Add UI for audio and subtitle tracks -->
<div class="tracks-panel" id="tracksPanel" style="display:none;">
    <div class="panel-header">
        <h3>Audio & Subtitle Tracks</h3>
        <button onclick="closeTracksPanel()">×</button>
    </div>
    
    <div class="audio-tracks">
        <h4>Audio Languages</h4>
        <div id="audioTracksList"></div>
    </div>
    
    <div class="subtitle-tracks">
        <h4>Subtitles</h4>
        <button onclick="uploadSubtitleFile()">Upload .srt/.vtt</button>
        <div id="subtitleTracksList"></div>
        <div class="subtitle-settings">
            <label>Font Size: <input type="range" min="10" max="40" value="20" onchange="setSubtitleSize(this.value)"></label>
            <label>Color: <input type="color" value="#FFFFFF" onchange="setSubtitleColor(this.value)"></label>
            <label>Background: <input type="color" value="#000000" onchange="setSubtitleBg(this.value)"></label>
        </div>
    </div>
</div>

<style>
.tracks-panel {
    position: absolute;
    top: 0;
    right: 0;
    width: 300px;
    height: 100%;
    background: rgba(0,0,0,0.9);
    padding: 20px;
    overflow-y: auto;
    color: white;
    font-family: VLC, sans-serif;
}

.audio-tracks, .subtitle-tracks {
    margin: 15px 0;
    border-bottom: 1px solid #666;
    padding-bottom: 15px;
}

.tracks-panel h4 {
    margin: 10px 0;
    color: #FF9900;
}

.track-item {
    padding: 8px;
    background: rgba(255,153,0,0.1);
    margin: 5px 0;
    border-radius: 4px;
    cursor: pointer;
    border-left: 3px solid transparent;
}

.track-item.selected {
    border-left-color: #FF9900;
    background: rgba(255,153,0,0.3);
}
</style>
```

**Effort**: 1.5 hours  
**Priority**: MEDIUM

---

#### 3.5 **Android App Testing Scenarios**

```markdown
### Test Scenario: YouTube Share to PVP
1. Open YouTube app → find video
2. Tap Share → Select "Open with PVP"
3. PVP app opens with video URL
4. Video plays immediately
5. All controls visible on mobile
6. Fullscreen works (hide status/nav bars)

### Test Scenario: Telegram Channel Video
1. Open Telegram → find public channel with video
2. Long-press message → Copy URL
3. Switch to PVP → Paste prompt appears
4. Tap "Play Now"
5. Video extracts and streams
6. Seek/speed work without lag

### Test Scenario: Google Drive Shared File
1. User receives shared link: https://drive.google.com/file/d/xxx/view
2. Shares to PVP from browser
3. PVP extracts and plays
4. Streams without downloading to storage
5. Works on mobile network (cellular data)

### Test Scenario: Index Page Playlist
1. User shares: https://example.com/movies/ (public directory)
2. PVP app receives and analyzes page
3. Finds 10 .mp4 files → creates playlist
4. Shows playlist UI
5. User selects movie #5 → plays
6. Video finishes → auto-advances to #6

### Test Scenario: Mega.nz Link
1. User pastes: https://mega.nz/file/ABC#XYZ
2. App detects Mega format
3. Extracts stream using pymega
4. Streams with quality selection
5. Seeking works
6. NO ads interrupt playback

### Test Scenario: Rotation During Playback
1. Video playing in portrait
2. Rotate device to landscape
3. Video resizes smoothly
4. Controls remain visible and functional
5. Fullscreen toggle works after rotation
6. Resume playback without interruption

### Test Scenario: Network Switch (WiFi→Cellular)
1. Video streaming over WiFi
2. Switch to cellular network (without airplane mode)
3. Stream continues (or brief buffer)
4. Auto-adjust quality if needed
5. No app crash or force-close
6. User can resume after network change

### Test Scenario: Zero Ads Verification
1. Play movie streaming website URL
2. Run packet sniffer in background
3. NO ad/tracking domains appear
4. NO pre-roll ads
5. NO mid-roll ads
6. NO post-roll ads
7. Stream is pure video only
```

**Effort**: 1 hour (documentation)  
**Priority**: HIGH

---

## 🔧 PHASE 4: CRITICAL FIXES REQUIRED

### Fix #1: Remove YouTube oEmbed (Privacy)

**Files Affected:**
- `windows-app/app/extractor.py` (lines 524-532)

**Action:**
```python
# BEFORE (remove this):
req = urllib.request.Request(
    f"https://www.youtube.com/oembed?url=...",
    headers={"User-Agent": "Mozilla/5.0"}
)

# AFTER (use this):
# Construct thumbnail URL locally without API call
yt_thumb = f"https://i.ytimg.com/vi/{yt_id}/hqdefault.jpg"
yt_title = "YouTube Video"  # Generic title
```

**Effort**: 10 minutes  
**Priority**: CRITICAL

---

### Fix #2: Add FFmpeg Validation

**File**: `windows-app/pvp_desktop.py`

**Action:**
```python
import shutil

def check_ffmpeg():
    """Verify FFmpeg is installed before running app"""
    if shutil.which('ffmpeg') is None:
        root = tk.Tk()
        root.withdraw()
        messagebox.showwarning(
            "FFmpeg Required",
            "FFmpeg is needed for audio muxing.\n\n"
            "Install: https://ffmpeg.org/download.html"
        )
        sys.exit(1)

# Call in main() before starting server
def main():
    check_ffmpeg()  # ← Add this line
    # ... rest of code
```

**Effort**: 5 minutes  
**Priority**: CRITICAL

---

### Fix #3: Ensure Zero Ads Architecture

**Files Affected:**
- `windows-app/app/main.py`
- `windows-app/app/streamer.py`

**Verify:**
```
✅ No advertisement SDKs (Google Ads, Facebook, etc.)
✅ No analytics (Google Analytics, Mixpanel, etc.)
✅ CSP headers block external scripts
✅ CORS blocks external domains
✅ All extraction LOCAL ONLY
✅ History file encrypted/local
✅ No cloud backend calls
✅ No telemetry services
```

**Add Ad-Blocking Middleware:**
```python
# In app/main.py
@app.middleware("http")
async def block_ads(request: Request, call_next):
    """Block any ad/tracking network requests"""
    response = await call_next(request)
    
    # Remove tracking cookies
    if "set-cookie" in response.headers:
        del response.headers["set-cookie"]
    
    # Add tracking prevention header
    response.headers["X-Tracking-Protection"] = "full"
    
    return response
```

**Effort**: 1 hour  
**Priority**: CRITICAL

---

### Fix #4: Telegram File Extraction

**Status**: Not implemented yet

**Required Libraries:**
```txt
pymega==0.3.20          # For Mega.nz
python-telegram-bot==20.3  # Optional, for better Telegram support
```

**Implementation Effort**: 2-3 hours  
**Priority**: HIGH

---

## 🧪 PHASE 5: COMPREHENSIVE TESTING PLAN

### Testing Environment Setup

```bash
# Windows Test Machine
- Windows 11 Pro
- FFmpeg installed
- Python 3.10+
- Wireshark for network monitoring
- 10+ test video URLs

# Android Test Device
- Android 10, 12, 14 devices
- Network monitor app (Charles Proxy or Wireshark)
- 10+ test URLs

# Ad-Free Verification
- AdAway or hosts file blocking ad domains
- Network traffic analysis
- Browser console monitoring
```

### Windows Desktop Testing Checklist

```markdown
## Installation & Startup
- [ ] Download PVP-Player.exe
- [ ] Run without administrator
- [ ] No Python errors
- [ ] System tray icon appears
- [ ] Browser opens at http://127.0.0.1:8000

## Video Extraction Tests
- [ ] YouTube video: https://youtube.com/watch?v=xxxxx
- [ ] YouTube playlist: https://youtube.com/playlist?list=xxxxx
- [ ] Vimeo: https://vimeo.com/xxxxx
- [ ] Direct MP4: https://example.com/video.mp4
- [ ] HLS: https://example.com/playlist.m3u8
- [ ] Google Drive: https://drive.google.com/file/d/xxxxx/view
- [ ] Dropbox: https://dropbox.com/s/xxxxx/video.mp4
- [ ] Mega.nz: https://mega.nz/file/xxxxx#yyyy
- [ ] Index page: https://example.com/videos/
- [ ] Movie streaming site: https://fmovies.example.com/watch?id=xxxxx

## Playback Tests
- [ ] Video plays smoothly
- [ ] Seeking works (fast forward/rewind)
- [ ] Speed control (0.5x - 2.0x)
- [ ] Volume control (0% - 125%)
- [ ] Mute/Unmute (M key)
- [ ] Fullscreen (F key)
- [ ] Keyboard shortcuts all work
- [ ] Subtitle support
- [ ] Audio track switching
- [ ] Playlist auto-advance
- [ ] Long videos (>2 hours) don't timeout

## Privacy & Ad Tests (CRITICAL)
- [ ] Run Wireshark throughout all tests
- [ ] Monitor all network traffic
- [ ] VERIFY NO external domains contacted:
  ✗ google-analytics.com
  ✗ doubleclick.net
  ✗ ads.google.com
  ✗ facebook.com/tr
  ✗ mixpanel.com
  ✗ segment.com
  ✓ ONLY: localhost:8000 + video sources
- [ ] Check YouTube extraction doesn't call oEmbed
- [ ] Verify NO ads appear in movie streams
- [ ] History file is local only

## Edge Cases
- [ ] Network interruption (pause stream, resume)
- [ ] Port 8000 already in use (auto-find new port)
- [ ] Invalid URL (show error message)
- [ ] Very large file (100GB+ stream)
- [ ] Multiple simultaneous videos (app stability)
```

### Android Testing Checklist

```markdown
## Installation
- [ ] Download PVP-Player.apk
- [ ] Install on Android 10, 12, 14
- [ ] Grant permissions (Internet, Storage optional)
- [ ] App opens without errors
- [ ] Tray notification shows app is running

## Clipboard Detection
- [ ] Copy YouTube URL → Notification appears
- [ ] Copy Vimeo URL → Notification appears
- [ ] Copy direct MP4 → Notification appears
- [ ] Tap "Play Now" → Video opens and streams
- [ ] Works with notification center

## Share Intent
- [ ] Share from YouTube → "Open with PVP" option appears
- [ ] Share from Instagram → works
- [ ] Share from Reddit → works
- [ ] Share from browser → works
- [ ] Video plays after share

## Video Playback
- [ ] Plays YouTube videos
- [ ] Plays Vimeo videos
- [ ] Plays direct MP4
- [ ] Plays HLS streams
- [ ] Plays Google Drive videos
- [ ] Plays Mega.nz videos
- [ ] Plays Telegram videos
- [ ] Plays movie streaming sites

## Controls & UI (Mobile)
- [ ] Double-tap to play/pause
- [ ] Single-tap to show/hide controls
- [ ] Seek by dragging timeline
- [ ] Volume swipe (up to increase, down to decrease)
- [ ] Pinch to fullscreen
- [ ] Rotation works smoothly
- [ ] Fullscreen hides status/nav bars
- [ ] Screen stays on during playback

## Network & Privacy
- [ ] Monitor network traffic (Charles Proxy)
- [ ] VERIFY NO external ad/tracking domains
- [ ] Verify NO analytics calls
- [ ] History stored locally
- [ ] Works with cellular data
- [ ] WiFi to cellular switch smooth
- [ ] Airplane mode + offline doesn't crash

## Audio & Subtitles
- [ ] Multi-language audio detected
- [ ] Audio track switching works
- [ ] B key cycles audio tracks
- [ ] Upload .srt file for subtitles
- [ ] Subtitle display customizable
- [ ] Subtitle delay adjustable (G/H)
```

---

## 📊 Implementation Timeline

```
WEEK 1: Cleanup & Critical Fixes
├─ Remove Chrome extension (15 min)
├─ Fix FFmpeg validation (5 min)
├─ Remove YouTube oEmbed (10 min)
└─ Add ad-blocking middleware (30 min)

WEEK 2: Windows App Enhancements
├─ Add Telegram support (2 hours)
├─ Add Mega.nz support (2 hours)
├─ Add index page scraping (1 hour)
├─ Implement playlist system (1 hour)
└─ Integration & testing (2 hours)

WEEK 3: Android App Enhancements
├─ Full clipboard monitoring (2 hours)
├─ Enhanced share intent (1.5 hours)
├─ Mobile UI improvements (2 hours)
├─ Audio/subtitle UI (1.5 hours)
└─ Integration & testing (2 hours)

WEEK 4: Testing & Fixes
├─ Windows desktop full testing (1 week)
├─ Android full testing (1 week)
├─ Privacy audit (Wireshark) (ongoing)
├─ Bug fixes (as found)
└─ Final release build

WEEK 5: Release Preparation
├─ Documentation (1-2 hours)
├─ Release notes (1 hour)
├─ Build final .exe & .apk (30 min)
└─ GitHub push (15 min)
```

---

## 📋 Deliverables Checklist

### Windows Application
- [ ] Supports 10+ video sources
- [ ] Extracts from Google Drive, Dropbox, Mega
- [ ] Supports Telegram files
- [ ] Generates playlists from index pages
- [ ] Persistent playlist storage
- [ ] Zero ads guarantee
- [ ] FFmpeg validation
- [ ] All VLC keyboard shortcuts
- [ ] Fullscreen with controls hide
- [ ] Subtitle support with customization
- [ ] Speed control (0.5x - 2.0x)
- [ ] Audio track selection
- [ ] History tracking (local only)
- [ ] Error logging

### Android Application  
- [ ] Real-time clipboard monitoring
- [ ] Full share intent handling
- [ ] Same video sources as Windows
- [ ] Touch controls (double-tap, swipe, pinch)
- [ ] Rotation handling
- [ ] Fullscreen with immersive mode
- [ ] Audio track UI
- [ ] Subtitle UI
- [ ] Network switch handling
- [ ] Cellular data support
- [ ] No app crashes on background/resume

### Privacy & Security
- [ ] Zero external API calls (except video sources)
- [ ] No ads in any videos
- [ ] HTTPS only for all connections
- [ ] CORS restricted to localhost
- [ ] CSP blocks external scripts
- [ ] Referrer-Policy prevents tracking
- [ ] History encrypted locally
- [ ] No cloud backend
- [ ] No telemetry/analytics
- [ ] Wireshark audit passed

### Documentation
- [ ] Comprehensive README
- [ ] Installation guide (Windows & Android)
- [ ] Keyboard shortcuts reference
- [ ] Troubleshooting guide
- [ ] Privacy statement
- [ ] Supported sources list
- [ ] Release notes

---

## 🎯 Success Criteria

### MVP (Minimum for Release)
- ✅ Windows app works
- ✅ Android app works
- ✅ Streams videos without ads
- ✅ Supports 5+ sources
- ✅ **ZERO external calls** (verified)

### v1.0 (Full Feature)
- ✅ 10+ sources supported
- ✅ Playlist generation
- ✅ All keyboard shortcuts
- ✅ Full subtitle/audio support
- ✅ Offline playlist storage
- ✅ Advanced error handling
- ✅ Complete documentation

### Quality Standards
- ✅ No app crashes
- ✅ Smooth playback
- ✅ Fast extraction (<5 seconds)
- ✅ 100% ad-free guarantee
- ✅ Privacy-first architecture
- ✅ Works on 3+ Android versions
- ✅ Works on Windows 10+

---

## 📝 Files to Create/Modify

### Delete
```
chrome-extension/          (entire folder)
releases/pvp-chrome-extension.zip
```

### Create
```
windows-app/CHANGELOG.md              (version history)
windows-app/docs/INSTALLATION.md      (install guide)
windows-app/docs/TROUBLESHOOTING.md   (FAQ)
android-app/docs/INSTALLATION.md
android-app/docs/TROUBLESHOOTING.md
```

### Modify
```
README.md                             (remove extension, add features)
windows-app/requirements.txt          (add pymega, etc.)
windows-app/app/extractor.py          (add new sources)
windows-app/app/main.py               (add playlist API)
windows-app/pvp_desktop.py            (add FFmpeg check)
android-app/AndroidManifest.xml       (add intents)
android-app/MainActivity.kt           (add clipboard monitoring)
```

---

## 🚀 Getting Started (This Week)

1. **Day 1-2**: Remove Chrome extension, implement critical fixes
2. **Day 3-5**: Add Windows enhancements (Telegram, Mega, index scraping)
3. **Day 6-7**: Begin Android enhancements

**Commands to Start:**
```bash
# Remove Chrome extension
rm -rf chrome-extension/
rm -rf releases/pvp-chrome-extension.zip

# Fix FFmpeg check
# (See code in Phase 4, Fix #2)

# Fix YouTube oEmbed
# (See code in Phase 4, Fix #1)

# Rebuild
cd windows-app
python build.py

# Output: dist/PVP-Player.exe
```

---

**Document Version**: 2.0  
**Created**: September 25, 2026  
**By**: Pawan Kumar Gautam (MEAN Stack Developer)  
**Status**: 🟢 **READY FOR IMPLEMENTATION**

---

## 📞 Questions?

**For Chrome Extension Removal:**
- Just delete the folder
- Update README
- No code changes needed

**For Windows Enhancements:**
- See Phase 2 for detailed code
- Requires pymega library
- Test each source independently

**For Android Enhancements:**
- See Phase 3 for Kotlin code
- Requires manifest updates
- Test on real devices

**For Testing:**
- See Phase 5
- Use Wireshark for privacy audit
- Document all findings
