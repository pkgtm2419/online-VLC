# PVP (Personal Video Player) — Project Details & Requirements Plan

---

## 1. Project Overview & Vision

### 1.1 Executive Summary
**PVP (Personal Video Player) / Online-VLC** is a high-performance, universal media streaming platform engineered for **100% privacy, zero advertisements, and exclusive online media playback**. The project is architected into two standalone, independent implementations:
1. **Windows Desktop Application**: A native desktop application customized from the core **VideoLAN VLC** (`videolan/vlc`) LibVLC engine.
2. **Android Mobile Application**: A native mobile application customized from **VideoLAN VLC for Android** (`videolan/vlc-android`) utilizing official `libvlc-all` multimedia runtimes.

### 1.2 Core Principles
- **Dedicated Online Streaming**: Purpose-built exclusively for streaming remote, cloud, web, and network media. Local filesystem indexing, disk scanning, and media library scraping are permanently disabled.
- **Strict Privacy Guarantee**: 100% local execution with zero external telemetry, zero tracking analytics, zero remote API pings, and zero cloud synchronization.
- **Zero Advertising (0% Ads Guaranteed)**: Automatic interception and elimination of video pre-rolls, mid-rolls, sponsor overlays, banner pop-ups, and tracking redirects.
- **Self-Contained Portability**: Every dependency, codec, library, and media engine is bundled inside the application distribution. No external runtimes or system installations are required.
- **Strict GitHub Release Compliance**: Every distributed executable, installer, and package archive must strictly remain below GitHub's 100 MB per-file threshold.

---

## 2. Project Architecture & Repository Structure

### 2.1 Repository Layout
The repository is split into isolated, uncoupled platform projects with a centralized releases directory:

```
online-VLC/
├── releases/                       # Synchronized, pre-compiled production binaries
│   ├── PVP-Player.exe              # Standalone Windows native executable (< 100 MB)
│   ├── PVP-Player-Windows.zip      # Windows portable package archive (< 100 MB)
│   ├── PVP-Player.apk              # Installable Android ARM64 APK (< 100 MB)
│   └── pvp-android-mobile.zip      # Android mobile source archive (< 100 MB)
│
├── windows-app/                    # Standalone Windows Desktop Project (videolan/vlc)
│   ├── libvlc/                     # Bundled VideoLAN LibVLC x64 binaries & plugins
│   ├── pvp_player.py               # Native desktop player UI & controller
│   ├── app/                        # Stream extraction engine & database schemas
│   ├── tests/                      # Automated test suite for Windows
│   └── pvp.spec                    # PyInstaller build specification
│
└── android-app/                    # Standalone Android Project (videolan/vlc-android)
    ├── app/                        # Android application module
    │   ├── src/main/java/          # Native Kotlin LibVLC implementation & UI
    │   ├── src/main/res/           # Layouts, vector drawables & themes
    │   └── src/test/java/          # Automated test suite for Android
    └── build.gradle.kts            # Project build configuration with LibVLC runtime
```

### 2.2 Component Isolation & Independence
- The Windows Desktop application and Android Mobile application must operate as completely independent projects with zero shared build artifacts or cross-platform dependencies.
- Deprecated components (such as legacy browser extensions or local HTTP bridge servers) are strictly prohibited.
- Both projects maintain their own automated test suites, build configuration files, and documentation.

---

## 3. Universal Functional Requirements

### 3.1 Privacy, Security & Ad-Blocking Engine
- **Advertising Domain Elimination**: Intercept and block network connection requests to known advertising, telemetry, and tracking networks (including DoubleClick, Google AdServices, Criteo, Rubicon, Adnxs, and behavioral trackers).
- **Tracking Parameter Sanitization**: Automatically inspect and strip tracking query parameters (such as `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `fbclid`, `gclid`, `dclid`, `ref`, and `source`) from all incoming URLs before stream resolution.
- **Zero External Reporting**: Under no circumstances may the application send telemetry, crash reports, playback logs, or usage metrics to external servers.
- **Local Data Isolation**: All user settings, playback history, and saved playlists must be stored exclusively in local device storage (SQLite/preferences) with zero cloud sync.

### 3.2 Universal Media & Stream Resolution
The application must extract and resolve playable direct media streams (MRLs) from a comprehensive range of sources:
- **Direct Video Streams**: MP4, WebM, MKV, MOV, AVI, FLV, TS.
- **Adaptive Bitrate Streaming Protocols**: HTTP Live Streaming (HLS `.m3u8`) and Dynamic Adaptive Streaming over HTTP (DASH `.mpd`).
- **Video Platforms**: YouTube (standard videos, shorts, live streams, and playlists).
- **Social Media Platforms**: Vimeo, Dailymotion, Twitch, Reddit, TikTok, Instagram Reels, Twitter/X.
- **Messaging Platforms**: Telegram public video and channel post links (`t.me/channel/post_id`).
- **Cloud Storage Services**: Google Drive, Dropbox, OneDrive, Mega.nz, Mediafire.
- **Web Directory Indexes**: Automatic scanning and parsing of open Apache/Nginx directory listings containing video media files to dynamically construct sequential playlists.
- **Website Video Embeds**: Detection and extraction of embedded HTML5 `<video>`, `<source>`, and iframe video players across third-party blogs, articles, and movie streaming portals.

### 3.3 Real-Time Clipboard Integration & One-Tap Streaming
- **Automated Clipboard Monitoring**: Continuously or contextually inspect the system clipboard for valid video URLs.
- **Smart Notification Banner**: Display an unobtrusive prompt when a media link is detected on the clipboard, allowing the user to initiate immediate streaming with a single interaction.
- **Instant "Paste & Play" Action**: Prominently feature a dedicated "Paste & Play" button that reads the current clipboard content, sanitizes the URL, resolves the stream, and begins playback immediately.

### 3.4 Local History & Playlist Management
- **Local History Tracking**: Automatically record streamed media titles, source URLs, duration, and playback timestamps into a local SQLite database.
- **Playback Resume**: Support resuming playback from the last recorded timestamp or restarting from the beginning, governed by user preferences.
- **Custom Playlists**: Enable users to create, rename, reorder, and delete custom playlists containing multiple stream links.
- **Continuous Playback**: Automatically advance to the next track upon completion of a playlist item.

---

## 4. Windows Desktop Application Requirements (`windows-app`)

### 4.1 Architecture & Runtime
- **Customized Core**: Built directly upon the official VideoLAN LibVLC C/C++ engine (`videolan/vlc`).
- **Zero Local Web Server**: The desktop client must be a pure native Windows window. It must not run a local web server (e.g. Uvicorn/Flask), must not bind local network ports (e.g. port 8000), and must not launch an external web browser.
- **Rapid Startup**: The application window must launch in under 0.5 seconds without initialization delays or port collisions.
- **Bundled Engine & Codecs**:
  - Bundled LibVLC dynamic link libraries (`libvlc.dll`, `libvlccore.dll`).
  - Essential streaming plugins (access, demux, codecs, packetizers, video/audio output).
  - Pruned non-streaming plugins (GUI engines, disc readers, encoders) to guarantee a total executable size under 100 MB.
  - Bundled FFmpeg static utilities for stream muxing and decoding.
  - Bundled stream extractor engine.

### 4.2 Graphics & Hardware Acceleration
- **Direct3D 11 Output**: Hardware-accelerated video rendering directly to the native desktop window surface.
- **Codec Support**: Native hardware decoding for 4K, 60fps, HDR, AV1, HEVC/H.265, H.264, VP9, and all standard audio codecs (AAC, AC3, DTS, Opus, FLAC, MP3).
- **Display Modes**: Support seamless aspect ratio switching (Default, 16:9, 4:3, 1:1, 21:9, Fit to Window).

### 4.3 User Interface & Controls (Authentic VLC Design)
- **Authentic VLC Dark Theme**: Charcoal/black dark background (#1E1E1E) with signature VLC-orange accents (#FF8800).
- **Top Streaming Toolbar**:
  - Stream URL input box with clear action.
  - "⚡ Paste & Play" button for one-click playback from clipboard.
  - "▶ Stream" button for initiating resolution.
  - "☰ Playlist" toggle button to display/hide the sidebar.
- **Idle Screen**: Displays the custom high-resolution VLC cone icon, application title, quick-start action buttons, and supported service badges.
- **Complete VLC Menubar**:
  - `Media`: Open Network Stream (`Ctrl+N`), Open Clipboard (`Ctrl+V`), Save Playlist, Exit.
  - `Playback`: Play/Pause (`Space`), Stop (`S`), Previous/Next, Jump Forward/Backward (`Ctrl+Right`/`Ctrl+Left`), Speed Controls.
  - `Audio`: Audio Track Selection, Volume Up/Down (`Ctrl+Up`/`Ctrl+Down`), Mute (`M`).
  - `Video`: Fullscreen (`F11`/Double-Click), Aspect Ratio Selection, Take Snapshot.
  - `Subtitle`: Subtitle Track Selection, Subtitle Delay/Synchronization.
  - `Tools`: Stream Media Information, Preferences.
  - `Help`: About PVP Player.
- **Bottom Playback Controls Toolbar**:
  - Interactive scrub slider with elapsed time and total duration displays.
  - Media control buttons: Play/Pause, Stop, Skip Backward 10s, Skip Forward 10s.
  - Playback speed indicator and cycler (0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 2.0x).
  - Audio track selection popup.
  - Subtitle track selection popup.
  - Volume slider with range from 0% up to 125% (VLC volume boost).
  - Fullscreen toggle button.

### 4.4 System Integration
- **Windows System Tray**: Minimize to system tray with quick-access context menu (Show/Hide, Paste & Play, Mute, Quit).
- **Background Clipboard Listener**: Detects copied media URLs in any Windows application and surfaces a quick-action notification.
- **Single Instance Enforcement**: Prevent multiple competing processes by focusing the existing application window if a new instance is launched.

---

## 5. Android Mobile Application Requirements (`android-app`)

### 5.1 Architecture & Runtime
- **Customized Core**: Built directly upon the official VideoLAN VLC-Android architecture (`videolan/vlc-android`).
- **Official LibVLC Dependency**: Integration of `org.videolan.android:libvlc-all:3.6.2` supplying native C++ runtime binaries via JNI.
- **Target OS Compatibility**: Optimized for Android 12+ (API Level 31 through 35) with backwards compatibility down to Android 7.0 (API Level 24).
- **Architecture Optimization**: Native ABI packaging targeted to `arm64-v8a` to ensure the APK remains lightweight (~49.7 MB) and well within GitHub's 100 MB limit while supporting 100% of modern Android 12+ devices.
- **Pure Native UI**: 100% native Kotlin layouts and views utilizing `VLCVideoLayout` and hardware-accelerated `SurfaceView`. All legacy hybrid WebViews are eliminated.

### 5.2 Layouts & Navigation
- **Home Streaming Screen (`activity_home.xml`)**:
  - Modern Edge-to-Edge display with transparent status and navigation bars.
  - Branded header featuring the custom VLC cone icon and title.
  - Active clipboard card displaying detected video URLs with a one-tap "Stream Now" action.
  - Stream input card featuring a URL text field, a clear button, and an orange "Paste & Play" button.
  - Supported platforms badge grid highlighting compatible online services.
  - Recent stream history section positioned at the bottom with a "Show More History" expansion toggle and clear history action.
- **Native Player Screen (`activity_player.xml`)**:
  - Dedicated landscape/sensor-oriented fullscreen player activity.
  - Base `VLCVideoLayout` rendering hardware-accelerated video frames.
  - Centered circular loading indicator during stream resolution and buffering.
  - Floating gesture HUD displaying visual iconography and levels for volume, brightness, and seek offsets.
  - Top overlay bar containing back navigation, stream title, audio track selector, subtitle track selector, and player settings.
  - Center overlay containing quick replay (-10s), play/pause toggle, and quick forward (+10s) buttons.
  - Bottom overlay containing current timestamp, timeline scrub bar, total duration, playback speed cycler, and orientation toggle.
  - Auto-hiding control timers (controls automatically fade out after 5 seconds of touch inactivity).

### 5.3 Touch Gestures & Interactivity
- **Vertical Swipe (Right Half)**: Dynamic volume adjustment (0% to 100%) with visual volume bar HUD.
- **Vertical Swipe (Left Half)**: Screen brightness adjustment (0% to 100%) with visual brightness bar HUD.
- **Double-Tap (Left Half)**: Instantly skip backward 10 seconds with animated feedback.
- **Double-Tap (Right Half)**: Instantly skip forward 10 seconds with animated feedback.
- **Single Tap (Anywhere)**: Toggle visibility of on-screen controls overlay.
- **Timeline Scrubbing**: Smooth dragging with real-time time preview and immediate playback seek.

### 5.4 System & OS Integration
- **System Share Sheet Receiver (`ACTION_SEND`)**:
  - Registered intent filters for `text/*` mime types.
  - When a link is shared from YouTube, Chrome, TikTok, Instagram, Twitter, or any app, PVP Player opens directly, resolves the stream, and begins playing immediately.
- **Deep Linking (`ACTION_VIEW`)**:
  - Direct association with video domains (`youtube.com`, `youtu.be`, `vimeo.com`, `drive.google.com`, `mega.nz`, `t.me`).
  - Custom URI scheme support (`pvp://<stream_url>`).
- **Picture-in-Picture (PiP)**: Native support for background/floating video playback when navigating away from the player.
- **Audio Focus Management**: Automatic pausing and resuming when receiving phone calls or when other audio applications request focus.
- **Wakelock Management**: Keep screen awake during active video playback; release wakelock upon pause, stop, or exit.

### 5.5 Mobile Settings & Persistent Preferences
- **Default Video Quality**: Configurable preferred stream quality (Auto, 1080p, 720p, 480p, 360p).
- **Default Audio Language**: Preferred language track code (e.g. English, Spanish, Japanese, Auto).
- **Default Subtitles**: Subtitle state (Enabled/Disabled) and default language preference.
- **Default Playback Speed**: Default startup rate (0.75x, 1.0x, 1.25x, 1.5x, 2.0x).
- **Background Playback**: Option to continue audio playback when screen is locked or app is in background.
- **Timestamp Resume Preference**: Configurable behavior on selecting recent videos (Prompt, Always Resume from Timestamp, Always Start from Beginning).

---

## 6. Non-Functional Requirements

### 6.1 Performance & Responsiveness
- **Launch Latency**: Windows app initializes and displays the main window in under 500ms; Android app launches cold in under 800ms.
- **Stream Buffering**: Instantaneous playback start for direct CDN streams (< 1.5s on broadband connections).
- **Memory Footprint**:
  - Windows Desktop: Idle memory < 120 MB; active 4K playback < 350 MB.
  - Android Mobile: Idle memory < 80 MB; active 1080p playback < 180 MB.
- **CPU & Battery Efficiency**: Mandatory utilization of hardware decoders (Direct3D 11 on Windows, MediaCodec via LibVLC on Android) to minimize CPU load and maximize battery endurance.

### 6.2 Reliability & Fault Tolerance
- **Graceful Error Handling**: Non-fatal error alerts for broken URLs, invalid network connections, or geo-blocked streams without application crashes.
- **Network Resilience**: Automatic reconnection and buffer recovery during transient network dropouts.
- **Sanitized Input Handling**: Safe extraction and parsing of malformed, redirected, or tracking-heavy URLs.

### 6.3 Security & Compliance
- **Zero Local Server Vulnerabilities**: Elimination of local HTTP servers prevents local port hijacking, cross-site request forgery, or unauthorized local network access.
- **Sandboxed Storage**: Android application data resides strictly within private application sandbox storage.
- **No Insecure Cleartext Telemetry**: All network operations are strictly outbound stream fetches initiated directly by user interaction.

---

## 7. Testing, Verification & Acceptance Criteria

### 7.1 Windows Desktop Verification
- [x] **LibVLC Loading**: Verify dynamic loading of bundled `libvlc.dll` and validate version report (`3.0.23 Vetinari`).
- [x] **Zero Port Binding**: Verify that no network sockets (TCP/UDP) are opened on `127.0.0.1` or `0.0.0.0` upon launch.
- [x] **Offline Self-Containment**: Verify that the application functions without requiring pre-installed VLC or FFmpeg on the host operating system.
- [x] **Stream Playback**: Verify hardware-accelerated playback of direct MP4, HLS M3U8, YouTube streams, and cloud storage links.
- [x] **Ad-Blocking Verification**: Verify that tracking parameters and ad network URLs are intercepted and stripped prior to playback.
- [x] **Unit Test Execution**: Automated unit tests must pass with zero failures.

### 7.2 Android Mobile Verification
- [x] **Gradle Build**: Automated compilation via Gradle (`assembleDebug`) must succeed with zero errors and zero fatal warnings.
- [x] **Native Library Packaging**: Verify that `lib/arm64-v8a/libvlc.so` and `lib/arm64-v8a/libvlcjni.so` are present inside the compiled APK.
- [x] **Size Verification**: The resulting APK must remain strictly under 60 MB (well below the 100 MB limit).
- [x] **Unit Test Execution**: Kotlin unit tests verifying URL sanitization, parameter stripping, and ad-domain blocking must pass (`testDebugUnitTest`).
- [x] **Intent Handling**: Verify that `ACTION_SEND` and `ACTION_VIEW` properly extract URLs and trigger stream resolution.
- [x] **Gesture Mechanics**: Verify smooth response to volume swipe, brightness swipe, and double-tap seeking.

---

## 8. Release & Deployment Specifications

### 8.1 Distribution Artifacts
All production release binaries are tracked in the `releases/` directory and must satisfy strict file-size constraints:

| Artifact Name | Platform / Target | Maximum Allowed Size | Current Production Size | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **`PVP-Player.exe`** | Windows x64 Standalone Executable | < 100.0 MB | 93.4 MB (97,992,599 B) | Verified & Tested |
| **`PVP-Player-Windows.zip`** | Windows x64 Portable Archive | < 100.0 MB | 93.0 MB (97,576,348 B) | Verified & Tested |
| **`PVP-Player.apk`** | Android Mobile ARM64 APK | < 100.0 MB | 49.7 MB (52,186,006 B) | Verified & Tested |
| **`pvp-android-mobile.zip`** | Android Mobile Source Archive | < 100.0 MB | 1.27 MB (1,333,670 B) | Verified & Tested |

### 8.2 Maintenance & Versioning Guidelines
- Any future binary update must verify file sizes with filesystem checks prior to committing to ensure strict compliance with GitHub's 100 MB ceiling.
- Both Windows and Android platforms maintain independent release tracking while sharing version numbering synchronization across major milestones.
