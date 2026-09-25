# 🎬 PVP (Personal Video Player) — Testing & Bug Fix Plan

**Project**: online-VLC (PVP Player)  
**Date**: September 25, 2026  
**Scope**: Windows Desktop, Android Mobile, Chrome Extension  
**Focus**: Platform compatibility, streaming reliability, privacy assurance, ad-free guarantee

---

## 📋 Executive Summary

PVP is a universal, privacy-focused, ad-free media player based on VLC styling. This plan covers:
1. **Platform Testing** across all three supported platforms
2. **Core Functionality Verification** for video extraction and streaming
3. **Privacy & Security Validation** to ensure zero external tracking
4. **Feature Testing** for all VLC-like features
5. **Bug Fixes & Improvements** prioritized by severity

---

## 🎯 Testing Objectives

### Primary Goals
- ✅ Verify application runs independently on each platform without external dependencies
- ✅ Confirm internet is required ONLY for fetching video streams, not for app operation
- ✅ Guarantee 100% ad-free experience with zero tracking
- ✅ Test video extraction from all supported platforms
- ✅ Validate all VLC keyboard shortcuts and controls
- ✅ Ensure proper fullscreen, subtitle, audio track, and playlist handling

### Test Scenarios
- Installation and first launch
- URL/link pasting and stream detection
- Streaming from various sources
- Playlist extraction and auto-advance
- Subtitle system functionality
- Audio track switching
- Keyboard shortcut validation
- Fullscreen mode experience
- Network activity monitoring (privacy check)

---

## 🪟 PHASE 1: WINDOWS DESKTOP TESTING

### 1.1 Installation & Startup

**Tests:**
```
[ ] Download PVP-Player.exe from releases
[ ] Run without installation (portable)
[ ] Verify system tray icon appears (orange VLC cone)
[ ] Check if browser opens at http://127.0.0.1:8000
[ ] Verify local server starts (localhost connection only)
[ ] Test system tray menu:
    - "Open Browser" button functionality
    - "Restart Server" functionality
    - "Quit" properly closes all processes
[ ] Test on fresh Windows installation (no python/dependencies pre-installed)
```

**Known Issues to Test:**
- [ ] Missing Python runtime dependencies in `.exe` build
- [ ] System tray icon might not display on Windows 11
- [ ] Port 8000 conflict if another app is running
- [ ] Browser not opening automatically on first launch

**Fixes to Implement:**
```python
# desktop/pvp_desktop.py - Add startup checks

def check_port_availability(port=8000):
    """Check if port is available, find alternative if not"""
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        result = sock.connect_ex(('127.0.0.1', port))
        if result == 0:
            return find_available_port(port)
    finally:
        sock.close()
    return port

def ensure_python_runtime():
    """Embed Python in .exe or bundle required libraries"""
    # Use PyInstaller with --onefile --windowed flags
    # Include all dependencies in .spec file
    pass
```

### 1.2 Core Application Launch

**Tests:**
```
[ ] Main page loads (VLC cone icon screen)
[ ] Network Stream modal opens on startup
[ ] All menu items are clickable and functional
[ ] Settings page loads without errors
[ ] No external API calls on startup (network monitor)
[ ] Local server only listens on 127.0.0.1 and LAN
```

**Potential Issues:**
- [ ] Static files not loading (CSS, JS, icons)
- [ ] CORS errors if static files are on different port
- [ ] Console errors in browser DevTools

**Fix:**
```python
# app/main.py - Ensure static files are properly served

from fastapi.staticfiles import StaticFiles
from pathlib import Path

app.mount(
    "/static",
    StaticFiles(directory=Path(__file__).parent / "static"),
    name="static",
)

# Also add CORS handling for development
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:*", "http://localhost:*"],
    allow_methods=["GET", "POST"],
)
```

### 1.3 Video Streaming Tests

**Test Cases:**
```
[ ] Direct MP4 streaming (from URL)
    - http://example.com/video.mp4
    - https://example.com/video.mp4
    
[ ] HLS streaming (.m3u8)
    - Single variant HLS
    - Multi-variant HLS (quality selection)
    
[ ] YouTube video extraction
    - Standard video
    - Playlist
    - Long video (>1 hour)
    - Age-restricted content (should handle gracefully)
    
[ ] Other platforms:
    - Vimeo videos
    - TikTok videos
    - Instagram reels
    - Facebook videos
    - Reddit videos
    - Twitter/X videos
    - Dailymotion
    - Twitch streams (if applicable)
    
[ ] Stream quality selection (if available)
[ ] Stream resolution detection
[ ] Stream duration detection
```

**Issues to Check:**
- [ ] YouTube extraction failing (YouTube changes their format frequently)
- [ ] HLS master playlist not parsing correctly
- [ ] Streaming stops/stutters (buffering issues)
- [ ] Memory leak during long streams
- [ ] Stream timeout (>10 min videos fail)

**Fixes for Streaming Issues:**
```python
# app/extractor.py - Robust extraction with error handling

import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

class VideoExtractor:
    def __init__(self):
        self.timeout = 30  # seconds
        self.max_retries = 3
        
    async def extract_youtube(self, url: str) -> Optional[Dict]:
        """Extract YouTube video with fallback methods"""
        try:
            # Method 1: yt-dlp
            result = self._try_ytdlp(url)
            if result:
                return result
        except Exception as e:
            logger.warning(f"yt-dlp failed: {e}")
        
        try:
            # Method 2: Manual parsing
            result = self._try_manual_parsing(url)
            if result:
                return result
        except Exception as e:
            logger.warning(f"Manual parsing failed: {e}")
        
        logger.error(f"Failed to extract: {url}")
        return None
    
    def _try_ytdlp(self, url: str) -> Optional[Dict]:
        """Use yt-dlp library"""
        try:
            import yt_dlp
            with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
                info = ydl.extract_info(url, download=False)
                return {
                    'url': info.get('url'),
                    'format': info.get('format_id'),
                    'duration': info.get('duration'),
                    'title': info.get('title'),
                    'ext': info.get('ext')
                }
        except ImportError:
            raise ImportError("yt-dlp not installed")
    
    def _try_manual_parsing(self, url: str) -> Optional[Dict]:
        """Fallback: Manual HTML/JS parsing"""
        pass

# Update requirements.txt
# yt-dlp>=2024.01.01
# httpx>=0.24.0
# beautifulsoup4>=4.12.0
```

### 1.4 Privacy & Network Validation

**Tests:**
```
[ ] Monitor network traffic during:
    - App startup
    - Video streaming
    - Playlist loading
    - Settings change
    
[ ] Verify NO external calls to:
    - Analytics services (Google Analytics, Mixpanel, etc.)
    - Tracking pixels
    - Ad networks
    - Telemetry services
    - Cloud backends
    
[ ] Confirm all data processing is LOCAL:
    - Video extraction
    - Stream proxying
    - Subtitle handling
    - Playlist parsing
    
[ ] Check local storage/cache:
    - Browser localStorage (should not store user data)
    - Temp files created (should be cleaned up)
    - No permanent data stored
```

**Tools to Use:**
- Wireshark (network packet analysis)
- Fiddler/Charles (HTTP proxy)
- Windows Task Manager (network monitor)
- Browser DevTools (Network tab)

**Privacy Fixes:**
```python
# app/main.py - Remove any telemetry

# REMOVE all analytics imports
# REMOVE all tracking code
# REMOVE all external API calls except for video extraction

# Add privacy headers
from fastapi.responses import Response

@app.middleware("http")
async def add_privacy_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response
```

### 1.5 VLC Features Testing

**Keyboard Shortcuts:**
```
[ ] Ctrl+N     → Open Network Stream modal
[ ] Ctrl+L     → Toggle Playlist drawer
[ ] Space      → Play/Pause
[ ] S          → Stop
[ ] F          → Fullscreen toggle
[ ] M          → Mute/Unmute
[ ] B          → Cycle audio tracks
[ ] V          → Cycle subtitles
[ ] G/H        → Subtitle delay adjustment
[ ] Ctrl+↑/↓   → Volume control
[ ] →/←        → 10s forward/backward
[ ] Ctrl+→/←   → 1m forward/backward
[ ] ]/[        → Speed faster/slower
[ ] =          → Reset speed
[ ] Esc        → Close dialog / Exit fullscreen
```

**Fullscreen Mode:**
```
[ ] Video plays fullscreen (no UI)
[ ] Controls appear on bottom (semi-transparent)
[ ] Controls hide after 5s of inactivity
[ ] Mouse movement shows controls
[ ] ESC exits fullscreen
[ ] Works on multi-monitor setup
[ ] Correct aspect ratio maintained
```

**Subtitle System:**
```
[ ] Embedded subtitles detected and list available
[ ] Subtitle track selection works
[ ] External .srt file upload/drag-drop
[ ] External .vtt file upload/drag-drop
[ ] Subtitle delay adjustment (G/H keys)
[ ] Subtitle delay range: -5000ms to +5000ms
[ ] Custom subtitle appearance:
    - Font size adjustment
    - Font color picker
    - Background color/opacity
[ ] Subtitle panel can be toggled
```

**Audio Tracks:**
```
[ ] Multi-language tracks detected
[ ] Audio track selection works
[ ] B key cycles through audio tracks
[ ] OSD notification shows selected audio
[ ] Seamless track switching (no pause/resume)
[ ] Audio delay if applicable
```

**Playlist System:**
```
[ ] Playlist modal opens (Ctrl+L)
[ ] Multiple video URLs recognized
[ ] Playlist order maintained
[ ] Current track highlighted
[ ] Manual track skip works
[ ] Auto-advance to next track
[ ] Playlist persists during session
[ ] Remove track from playlist
[ ] Reorder playlist items
```

**Speed Control:**
```
[ ] Speed buttons visible (- and +)
[ ] Keyboard shortcuts work ([ and ])
[ ] Speed range: 0.5x to 2.0x
[ ] Current speed displayed
[ ] = key resets to 1.0x
[ ] Speed changes smooth (no lag)
```

---

## 📱 PHASE 2: ANDROID MOBILE TESTING

### 2.1 Installation

**Tests:**
```
[ ] Download PVP-Player.apk on Android device
[ ] APK installation successful
[ ] "Unknown source" warning handled (allow installation)
[ ] App icon appears on home screen
[ ] First launch without errors
[ ] Permissions requested and handled:
    - Internet permission
    - Clipboard access (for auto-detect)
    - Storage access (for subtitle files)
    - Screen wake lock
[ ] Works on Android 8.0+ (minimum version)
[ ] Test on various Android versions:
    - Android 8 (API 26)
    - Android 10 (API 29)
    - Android 12 (API 31)
    - Android 14 (API 34)
```

**Potential Issues:**
- [ ] APK not installing ("corrupted" message)
- [ ] Missing runtime permissions
- [ ] App crashes on startup
- [ ] Wrong targetSdkVersion

**Fix:**
```gradle
// mobile/android/app/build.gradle

android {
    compileSdk = 34
    defaultConfig {
        targetSdk = 34
        minSdk = 26
    }
    
    // Ensure all permissions declared in AndroidManifest.xml
}

// AndroidManifest.xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### 2.2 Core Android Features

**Tests:**
```
[ ] Clipboard auto-detection:
    - Copy YouTube URL → Open PVP → Notification appears
    - Copy any streaming URL → Auto-detect works
    - Works in background (broadcast receiver)
    
[ ] Paste & Play button:
    - Orange cone screen has paste button
    - Menu bar has paste option
    - One-tap paste and play
    
[ ] Share Intent integration:
    - Share from YouTube → "Open with PVP" appears
    - Share from other apps → Works
    - Correct video plays after share
    
[ ] Fullscreen mode:
    - Navigation bars hidden
    - Status bar hidden
    - Screen wake lock (doesn't sleep)
    - Immersive mode enabled
    - Proper orientation handling
    
[ ] Back button behavior:
    - Exit fullscreen → Back to video
    - Back from video → Confirm before exit
    - Back on home → App closes
    
[ ] Android settings integration:
    - Display settings for local server IP
    - Audio output settings
    - Subtitle settings
```

**Issues to Check:**
- [ ] Clipboard detection not working
- [ ] Share intent not registered properly
- [ ] Fullscreen not truly fullscreen
- [ ] Screen rotation during playback
- [ ] Memory leaks during video playback
- [ ] App crashes when backgrounded

**Fixes:**
```kotlin
// mobile/android/app/src/main/kotlin/ClipboardDetectionService.kt

class ClipboardDetectionService : Service() {
    private val clipboardManager by lazy {
        getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Register clipboard listener
        clipboardManager.addPrimaryClipChangedListener {
            val clipData = clipboardManager.primaryClip
            if (clipData != null && clipData.itemCount > 0) {
                val text = clipData.getItemAt(0).text.toString()
                if (isValidVideoUrl(text)) {
                    showPlayNotification(text)
                }
            }
        }
        return START_STICKY
    }
    
    private fun isValidVideoUrl(url: String): Boolean {
        val videoPatterns = listOf(
            "youtube.com", "youtu.be", "vimeo.com", "tiktok.com",
            "instagram.com", "reddit.com", "twitter.com", "facebook.com",
            ".mp4", ".webm", ".m3u8", "dailymotion.com", "twitch.tv"
        )
        return videoPatterns.any { url.contains(it, ignoreCase = true) }
    }
}
```

### 2.3 Streaming on Android

**Tests:**
```
[ ] Direct MP4 streaming works
[ ] HLS streaming works (.m3u8)
[ ] YouTube extraction and streaming
[ ] Other platform extractions
[ ] Stream buffering (1-5 second delay normal)
[ ] Network switch handling:
    - WiFi → Mobile data
    - Mobile data → WiFi
    - Network reconnection
[ ] Bitrate adaptation (if applicable)
[ ] Stream stops on network loss:
    - Error message displayed
    - Retry option available
```

**Issues:**
- [ ] Streaming stops when screen off (wake lock issue)
- [ ] Too much buffering
- [ ] Network switch causes crash
- [ ] Audio cuts out during stream

### 2.4 Android Privacy Check

**Tests:**
```
[ ] Monitor network traffic (use packet capture)
[ ] Verify no external tracking
[ ] Check Android logs for suspicious network calls
[ ] Permissions audit:
    - Are all requested permissions necessary?
    - Are permissions used only as intended?
```

---

## 🧩 PHASE 3: CHROME EXTENSION TESTING

### 3.1 Installation

**Tests:**
```
[ ] Download and extract chrome-extension.zip
[ ] Navigate to chrome://extensions/
[ ] Enable Developer Mode toggle
[ ] Load unpacked extension
[ ] Extension appears in extension list
[ ] Icon appears in toolbar
[ ] No installation errors
[ ] Test on:
    - Google Chrome (stable)
    - Microsoft Edge
    - Brave Browser
    - Opera (if supported)
```

**Potential Issues:**
- [ ] Manifest V3 compatibility
- [ ] Service worker registration fails
- [ ] Extension icon not loading
- [ ] Popup not opening

### 3.2 Extension Functionality

**Tests:**
```
[ ] Extension popup opens
[ ] Enable/Disable toggle works
[ ] Toggle state persists across sessions
[ ] Popup UI is clean and responsive
[ ] No console errors in extension context
[ ] Icon badge shows status (enabled/disabled)
```

### 3.3 Content Injection

**Tests:**
```
[ ] Visit YouTube video page
[ ] "Open with PVP" button appears on video
[ ] Button is NOT intrusive (proper placement)
[ ] Button works (opens PVP player)
[ ] Test on:
    - YouTube (single video)
    - YouTube (embedded video)
    - Vimeo
    - Other video hosting sites
    - Movie streaming sites
    - HTML5 <video> elements
    
[ ] Floating button appears:
    - Corner of video
    - Accessible but not blocking content
    - Only appears when extension enabled
    
[ ] Multiple videos on page:
    - Each video gets button
    - Each button works independently
    - No interference between buttons
```

**Known Extension Issues:**
- [ ] Content script not injecting on some sites (CSP issues)
- [ ] Button appearing on non-video elements
- [ ] Extension conflicting with site's own scripts
- [ ] Performance impact (extension slowing down page)

**Fix:**
```javascript
// extension/content.js - Robust video detection and injection

const injectPlayButton = () => {
    // Find all video elements
    document.querySelectorAll('video').forEach((videoElement) => {
        if (videoElement.dataset.pvpInjected) return; // Already injected
        
        const button = createPlayButton();
        videoElement.parentElement.appendChild(button);
        videoElement.dataset.pvpInjected = 'true';
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Get video source
            let videoUrl = videoElement.src || 
                          videoElement.querySelector('source')?.src;
            
            if (videoUrl) {
                chrome.runtime.sendMessage({
                    action: 'openWithPVP',
                    url: videoUrl
                });
            }
        });
    });
    
    // Also check for iframe embeds
    document.querySelectorAll('iframe').forEach((iframe) => {
        if (iframe.src.includes('youtube') || 
            iframe.src.includes('vimeo') ||
            iframe.src.includes('dailymotion')) {
            // Extract video ID and handle accordingly
        }
    });
};

// Run on page load and monitor for dynamic video additions
window.addEventListener('load', injectPlayButton);
const observer = new MutationObserver(injectPlayButton);
observer.observe(document.body, { childList: true, subtree: true });
```

### 3.4 Extension Privacy

**Tests:**
```
[ ] Extension doesn't send data to external servers
[ ] Extension permissions are minimal
[ ] No user tracking
[ ] No ads injected
[ ] Storage is local only
```

---

## 🔐 PHASE 4: CROSS-PLATFORM PRIVACY & SECURITY AUDIT

### 4.1 Network Activity Analysis

**Test Setup:**
```
1. Install Wireshark or Charles Proxy
2. Monitor all network traffic from:
   - Windows app
   - Android app
   - Chrome extension
3. Log all DNS queries
4. Analyze all HTTP/HTTPS requests
```

**Expected Results:**
```
✅ Only these domains should be contacted:
   - Video source domains (youtube.com, vimeo.com, etc.)
   - CDN domains (for video delivery)
   - localhost:8000 (local server)
   
❌ These should NOT appear:
   - Analytics: google-analytics.com, mixpanel.com, segment.com
   - Ads: doubleclick.net, adnxs.com, ads.google.com
   - Tracking: facebook.com (tracking pixel), twitter.com (tracking)
   - Telemetry: Any cloud backends
   - API keys: No API credentials in requests
```

**Check Points:**
```
[ ] No analytics initialization on startup
[ ] No user data sent anywhere
[ ] No device fingerprinting
[ ] No clipboard data sent externally
[ ] No localStorage data synced
[ ] No crash reporting to external service
```

### 4.2 Code Audit

**Static Analysis:**
```python
# Search for suspicious patterns:
grep -r "google-analytics" .
grep -r "mixpanel" .
grep -r "segment" .
grep -r "amplitude" .
grep -r "tracking" .
grep -r "telemetry" .
grep -r "external.*api" .
grep -r "api.anthropic" .
grep -r "http://" . | grep -v "127.0.0.1\|localhost"
```

**Dependency Check:**
```bash
# Check all dependencies for known security issues
pip-audit
npm audit
# Check for unnecessary dependencies
```

**Fixes for Privacy Issues:**
```python
# app/main.py - Audit and remove

# ❌ REMOVE:
import analytics  # If present
from telemetry import track_event  # If present
requests.post("https://analytics.example.com", data=...)  # If present

# ✅ KEEP ONLY:
from fastapi import FastAPI  # Core
from fastapi.staticfiles import StaticFiles  # Static files
import uvicorn  # Server
# Video extraction dependencies only
```

---

## 🧪 PHASE 5: FEATURE TESTING MATRIX

Create a comprehensive test matrix:

| Feature | Windows | Android | Chrome Ext | Status | Notes |
|---------|---------|---------|-----------|--------|-------|
| Direct MP4 | ✅ | ✅ | ✅ | Test | |
| HLS Streaming | ✅ | ✅ | ✅ | Test | |
| YouTube | ✅ | ✅ | ✅ | Test | |
| Vimeo | ✅ | ✅ | ✅ | Test | |
| Playlists | ✅ | ✅ | ✅ | Test | |
| Subtitles | ✅ | ✅ | ❌ | Test | Ext shows video only |
| Audio Tracks | ✅ | ✅ | ✅ | Test | |
| Speed Control | ✅ | ✅ | ✅ | Test | |
| Fullscreen | ✅ | ✅ | ✅ | Test | |
| Keyboard Shortcuts | ✅ | N/A | ✅ | Test | |
| Network Privacy | ✅ | ✅ | ✅ | CRITICAL | Must pass |
| Ad-Free | ✅ | ✅ | ✅ | CRITICAL | Must pass |
| Offline Operation* | ✅ | ✅ | ✅ | Test | *App itself, not streams |

---

## 🐛 COMMON BUGS & FIXES

### Bug #1: YouTube Extraction Failing

**Symptom:** "Unable to extract video" when pasting YouTube links

**Root Cause:** YouTube constantly changes their API/website structure

**Fix:**
```python
# Use multiple extraction methods with fallback

async def extract_youtube_reliable(url: str):
    methods = [
        extract_with_ytdlp,
        extract_with_puppeteer,  # For JavaScript-heavy pages
        extract_with_invidious,  # Fallback service
    ]
    
    for method in methods:
        try:
            result = await method(url)
            if result:
                return result
        except Exception as e:
            logger.warning(f"{method.__name__} failed: {e}")
            continue
    
    raise ExtractionError("All extraction methods failed")
```

### Bug #2: HLS Stream Stuttering

**Symptom:** Video buffers frequently, playback is jerky

**Root Cause:** Bandwidth throttling, poor segment fetching

**Fix:**
```javascript
// static/app.js - Improve HLS buffering

const player = new Hls({
    manifestLoadingTimeOut: 20000,
    segmentLoadingTimeOut: 20000,
    startFragPrefetch: true,
    lowLatencyMode: false,  // Don't use low latency for stability
    backBufferLength: 30,   // Keep more data buffered
    maxBufferLength: 60,
    maxMaxBufferLength: 600,
});
```

### Bug #3: Android App Crashes on Resume

**Symptom:** App closes when resumed from background during video

**Root Cause:** Improper lifecycle handling, resource cleanup

**Fix:**
```kotlin
// mobile/android/app/src/main/kotlin/MainActivity.kt

class MainActivity : AppCompatActivity() {
    private var mediaPlayer: MediaPlayer? = null
    
    override fun onPause() {
        super.onPause()
        // Don't destroy the media player
        mediaPlayer?.pause()
    }
    
    override fun onResume() {
        super.onResume()
        mediaPlayer?.start()
    }
    
    override fun onDestroy() {
        mediaPlayer?.release()
        super.onDestroy()
    }
}
```

### Bug #4: Chrome Extension Not Injecting

**Symptom:** "Open with PVP" button doesn't appear on videos

**Root Cause:** Content Security Policy blocking scripts

**Fix:**
```json
// extension/manifest.json

{
    "manifest_version": 3,
    "permissions": [
        "scripting",
        "activeTab"
    ],
    "host_permissions": [
        "<all_urls>"
    ],
    "content_scripts": [
        {
            "matches": ["<all_urls>"],
            "js": ["content.js"],
            "run_at": "document_end",
            "all_frames": false
        }
    ]
}
```

### Bug #5: No Ads Guarantee (Verification)

**Symptom:** Ads might be injected by dependencies

**Prevention:**
```python
# app/main.py - Strict ad blocking

@app.middleware("http")
async def block_ads(request: Request, call_next):
    response = await call_next(request)
    
    # Block ad-related headers
    response.headers.pop("Set-Cookie", None)  # Block tracking cookies
    
    # Add CSP to block external ad scripts
    response.headers["Content-Security-Policy"] = (
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "connect-src 'self' http://127.0.0.1:*; "
        "frame-src 'none'; "
        "object-src 'none';"
    )
    
    return response
```

---

## 📊 TESTING CHECKLIST

### Windows Desktop
- [ ] Installation & startup
- [ ] Streaming functionality
- [ ] Privacy verification
- [ ] All VLC features
- [ ] Keyboard shortcuts
- [ ] Fullscreen mode
- [ ] Multi-monitor support
- [ ] Port conflict handling
- [ ] Tray icon menu
- [ ] Network isolation

### Android Mobile
- [ ] Installation on multiple Android versions
- [ ] Clipboard detection
- [ ] Share intent integration
- [ ] Streaming functionality
- [ ] Fullscreen mode
- [ ] Screen rotation handling
- [ ] Privacy verification
- [ ] Background behavior
- [ ] Local server settings
- [ ] Permissions audit

### Chrome Extension
- [ ] Installation on multiple browsers
- [ ] Popup functionality
- [ ] Content injection
- [ ] Video detection
- [ ] Button functionality
- [ ] Privacy verification
- [ ] Performance impact
- [ ] CSP compliance
- [ ] Multiple video handling
- [ ] Embedded video support

---

## 🚀 IMPLEMENTATION PRIORITY

### CRITICAL (Must Fix Before Release)
1. YouTube extraction reliability (affects core functionality)
2. Privacy audit (zero external calls)
3. Ad-free guarantee (no ad injection)
4. iOS/Android installation (if applicable)
5. Chrome extension injection (if applicable)

### HIGH (Should Fix)
1. HLS streaming stability
2. Subtitle system completeness
3. Keyboard shortcut testing
4. Fullscreen mode polish
5. Playlist handling

### MEDIUM (Nice to Have)
1. Performance optimization
2. UI/UX improvements
3. Additional platform support
4. Advanced features

### LOW (Future Versions)
1. Mobile platform improvements
2. Additional video sources
3. Cloud sync (if privacy-compliant)
4. Advanced filters/effects

---

## 📈 TESTING REPORT TEMPLATE

For each test phase, document:

```markdown
## Phase [X]: [Platform] Testing Report
Date: YYYY-MM-DD
Tester: [Name]

### Results Summary
- Tests Passed: [X]/[Y]
- Tests Failed: [X]
- Critical Issues: [X]
- High Priority: [X]

### Critical Issues Found
1. [Issue] - Description
   - Severity: CRITICAL
   - Reproduction: Steps
   - Expected: Behavior
   - Actual: Behavior
   - Fix: Proposed solution

### Video
| Source | Format | Status | Notes |
|--------|--------|--------|-------|
| YouTube | MP4 | ✅ PASS | |
| Vimeo | HLS | ❌ FAIL | Buffering issue |

### Keyboard Shortcuts
| Shortcut | Action | Status | Notes |
|----------|--------|--------|-------|
| Ctrl+N | Open Network Stream | ✅ PASS | |
| Space | Play/Pause | ❌ FAIL | Not working |

### Privacy Findings
- Network calls: [List all external calls]
- External domains: [List]
- Tracking detected: [Yes/No]
- Ads detected: [Yes/No]

### Recommendations
1. [Priority 1 fix]
2. [Priority 2 fix]
3. [Priority 3 fix]
```

---

## 🔗 Resources & Tools

**Testing Tools:**
- Wireshark (network analysis)
- Charles Proxy / Fiddler (HTTP proxy)
- Burp Suite (security testing)
- Android Studio Emulator (mobile testing)
- Chrome DevTools (extension testing)
- Packet Capture (Android network monitoring)

**Dependency Management:**
- pip-audit (Python)
- npm audit (Node.js)
- OWASP Dependency Check (general)

**Build & Testing:**
- PyInstaller (Windows .exe)
- Gradle (Android)
- webpack (Chrome extension)
- GitHub Actions (CI/CD)

---

## 📝 Conclusion

This plan provides comprehensive testing and fixing strategies for PVP across all three platforms. Focus on:
1. **Privacy**: Absolutely no external calls or tracking
2. **Functionality**: All video sources must extract and stream
3. **User Experience**: Smooth playback, responsive UI
4. **Reliability**: Handle errors gracefully, auto-retry

Execute phases sequentially, document findings, and prioritize critical issues first.

---

**Plan Version:** 1.0  
**Last Updated:** September 25, 2026  
**Created by:** Pawan Kumar Gautam (MEAN Stack Developer)  
**Status:** Ready for Testing
