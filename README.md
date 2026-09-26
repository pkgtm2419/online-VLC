# 🎬 PVP (Personal Video Player) — Windows & Android

[![GitHub Repository](https://img.shields.io/badge/GitHub-pkgtm2419%2Fonline--VLC-blue?style=for-the-badge&logo=github)](https://github.com/pkgtm2419/online-VLC)
[![100% Local Execution](https://img.shields.io/badge/Privacy-100%25%20Local%20%26%20Offline-success?style=for-the-badge&logo=shield)](https://github.com/pkgtm2419/online-VLC)
[![Platforms](https://img.shields.io/badge/Platforms-Windows%20%7C%20Android-orange?style=for-the-badge)](https://github.com/pkgtm2419/online-VLC)
[![Zero Ads](https://img.shields.io/badge/Ads-0%25%20Guaranteed-red?style=for-the-badge)](https://github.com/pkgtm2419/online-VLC)

> **PVP (Personal Video Player)** is a universal, 100% ad-free media player designed with the authentic layout, controls, and keyboard shortcuts of **VLC Media Player**. The repository is organized into **two completely independent, standalone projects** for **Windows Desktop** and **Android Mobile**, each bundling all its required dependencies to run locally without cloud servers or cross-project dependencies.

---

## 📥 Direct Downloads & Installation

Choose your platform below to download the pre-built files directly from this repository:

| Platform | Download Button | Package Type | Quick Instructions |
| :--- | :--- | :--- | :--- |
| 🪟 **Windows Desktop** | [![Download Windows EXE](https://img.shields.io/badge/Download-PVP--Player.exe-FF8800?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player.exe) <br> *(or [Download as .ZIP](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player-Windows.zip))* | Standalone `.exe` (93.4 MB) | **Double-click `PVP-Player.exe` to run.** <br> Pure native VideoLAN LibVLC player with hardware acceleration, PyQt6 UI, and zero web servers. |
| 📱 **Android Mobile** | [![Download Android APK](https://img.shields.io/badge/Download-PVP--Player.apk-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player.apk) <br> *(or [Source Project .ZIP](https://github.com/pkgtm2419/online-VLC/raw/main/releases/pvp-android-mobile.zip))* | Installable `.apk` (49.7 MB) | **Direct install on Android phone or tablet.** <br> Powered by official VideoLAN `libvlc-all:3.6.2` with `VLCVideoLayout`, swipe gestures (volume, brightness, seek), and zero ads. |

---

## 📁 Independent Repository Structure

This repository contains **two isolated project directories** with zero coupling between them:

```
online-VLC/
├── releases/                       # Compiled, production-ready release downloads
│   ├── PVP-Player.exe              # Standalone Windows LibVLC executable (93.4 MB)
│   ├── PVP-Player-Windows.zip      # Windows package archive (93.0 MB)
│   ├── PVP-Player.apk              # Installable Android LibVLC APK (49.7 MB)
│   └── pvp-android-mobile.zip      # Android project source archive (1.3 MB)
│
├── windows-app/                    # Standalone Windows Desktop App Project
│   ├── libvlc/                     # Bundled VideoLAN LibVLC x64 DLLs & streaming plugins
│   ├── pvp_player.py               # Native PyQt6 + VideoLAN LibVLC desktop application
│   ├── build.py                    # PyInstaller standalone binary builder
│   ├── pvp.spec                    # PyInstaller build specification
│   ├── requirements.txt            # Python dependencies (PyQt6, python-vlc, yt-dlp)
│   └── tests/                      # Unit tests for LibVLC and stream extraction
│
└── android-app/                    # Standalone Android Mobile Project (VLC-Android)
    ├── app/                        # Android application module
    │   ├── src/main/java/          # Native Kotlin VideoLAN LibVLC player & UI
    │   │   ├── extractor/          # Privacy-first ad-blocking stream resolver
    │   │   ├── player/             # VLCPlayerActivity (VLCVideoLayout, gestures)
    │   │   └── ui/                 # HomeActivity (clipboard, paste & play, history)
    │   ├── src/main/res/           # Native Android resources, layouts & vector drawables
    │   └── src/test/java/          # Kotlin unit tests (ad blocking & URL parsing)
    ├── build.gradle.kts            # Configured with org.videolan.android:libvlc-all:3.6.2
    └── settings.gradle.kts         # Gradle settings
```

---

## 🚀 Platform Setup Guides

### 🪟 1. Windows Desktop App (`windows-app/`)

- **Direct Download**: **[PVP-Player.exe](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player.exe)** (or [PVP-Player-Windows.zip](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player-Windows.zip)).
- **Quick Run**: Double-click `PVP-Player.exe`. The app launches immediately as a native desktop application powered directly by VideoLAN's LibVLC C engine. No web browser, no local port bindings, and no external dependencies required.
- **Built-in Features**: Hardware-accelerated decoding, aspect ratio switching, multi-track audio and subtitle selection, speed cycling (0.25x-2.0x), playlist manager with SQLite persistence, and zero ads.
- **Build from Source**:
  ```powershell
  cd windows-app
  pip install -r requirements.txt
  python build.py
  ```

---

### 📱 2. Android Mobile App (`android-app/`)

- **Direct Download**: **[PVP-Player.apk](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player.apk)**.
- **Install**: Tap `PVP-Player.apk` on your Android device (enable *Install unknown apps* if prompted).
- **Mobile UI & Touch Controls**:
  - **Clean Mobile Header**: Mobile-optimized header with VLC cone, direct "Open URL", and "Paste & Play" buttons.
  - **Gesture Seeking**: Double-tap left side of the screen to jump backward 10s, double-tap right side to jump forward 10s.
  - **Volume & Brightness Gestures**: Swipe vertically on the left half for brightness, swipe on the right half for volume.
  - **Share to Play**: Share any video link from YouTube, Instagram, TikTok, Reddit, Chrome, or any other app directly to **PVP Player** — it auto-detects the URL and begins playback instantly with zero manual clicks.
  - **Clipboard Auto-Detection**: Automatically detects video URLs on your clipboard when opening the app and prompts for immediate streaming.
  - **Persistent Settings**: Customize and save default video quality, audio language, subtitles, speed, volume, brightness, and background playback.
  - **Full Offline Operation**: Direct video URLs (.mp4, .m3u8, etc.) stream directly on device without any local or external server.
- **Build from Source**:
  ```powershell
  cd android-app
  gradle assembleDebug
  ```

---

## 🌟 Player Capabilities & Supported Sources

- **🛡️ 100% Ad-Free**: Extracts pure media streams from CDNs, completely bypassing pre-rolls, mid-rolls, pop-ups, and trackers.
- **🔒 Zero Cloud Interaction**: All operations run locally on your hardware. No external tracking, no cloud telemetry.
- **🌐 Universal Video Source Support**:
  - **Website Embedded Videos**: Paste any webpage, article, or blog containing embedded video players (YouTube, Vimeo, Dailymotion, Streamable, HTML5 `<video>`, or custom iframe players). Displays a sleek VLC-styled selection modal allowing you to choose and play any detected stream.
  - **YouTube**: Videos, Shorts, Live streams, and Playlists (with embed touch player).
  - **Telegram**: Public message and channel video links (`t.me/channel/123`).
  - **Mega.nz**: Shared file links (`mega.nz/file/...`).
  - **Cloud Storage**: Google Drive, Dropbox, OneDrive, Mediafire.
  - **Web Directory Indexes**: Automatically scans Apache/Nginx open directories for `.mp4`, `.mkv`, `.webm`, `.m3u8` and auto-generates playlists.
  - **Social Media**: TikTok, Instagram Reels, Reddit, Twitter/X, Vimeo, Dailymotion, Twitch.
  - **Movie Streaming Sites**: Dean Edwards JavaScript unpacking & HLS master playlist extraction.
  - **Direct Media Streams**: `.mp4`, `.webm`, `.mkv`, `.mov`, `.avi`, and HLS (`.m3u8`).
- **📑 Playlist Management & Persistence**:
  - Auto-generate playlists from directory index pages and album links.
  - Save and organize playlists with SQLite local persistence.
  - Automatically advances to the next track when a video ends.
- **🪟 Startup "Open Network Stream" Modal**: Opens automatically on launch so you can paste any link and click **Stream** immediately.
- **📋 One-Tap Paste & Play**: Instant playback button on the main cone screen, menubar, and automatic clipboard detection banner.
- **🖥️ Authentic VLC Fullscreen Mode**: Full display video with floating bottom controls toolbar that auto-hides after 5 seconds of inactivity.
- **⏱️ Accurate Duration & Seeking**: Correctly displays total duration and remaining countdown time with seamless timeline scrubbing.
- **🔊 Audio Language Switching**: Detects multi-language audio tracks (HLS), switches tracks seamlessly on the fly with VLC-style OSD notifications, and allows track cycling via the <kbd>B</kbd> key.
- **📝 Subtitle System**: Embedded subtitle track switching (<kbd>V</kbd> key), external `.srt` / `.vtt` file drag-and-drop, delay synchronization (-5000ms to +5000ms via <kbd>G</kbd> / <kbd>H</kbd> keys), and appearance styling.
- **⏩ Video Speed Control**: Adjust playback speed smoothly (`0.5x` to `2.0x`) with **`-`** and **`+`** step buttons or keyboard shortcuts (<kbd>[</kbd>, <kbd>]</kbd>, <kbd>=</kbd>).
- **🔊 Volume Boost**: Volume slider goes from `0%` up to `125%` just like real VLC.

---

## ⌨️ VLC Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> | **Open Network Stream** popup dialog |
| <kbd>Ctrl</kbd> + <kbd>L</kbd> | **Toggle Playlist** drawer |
| <kbd>Space</kbd> | **Play / Pause** |
| <kbd>S</kbd> | **Stop** playback (resets to cone screen) |
| <kbd>F</kbd> / Double Click | **Toggle Fullscreen** mode |
| <kbd>N</kbd> / <kbd>P</kbd> | **Next / Previous** track in playlist |
| <kbd>M</kbd> | **Mute / Unmute** audio |
| <kbd>B</kbd> | **Cycle Audio** language tracks |
| <kbd>V</kbd> | **Cycle Subtitles** (or toggle on/off) |
| <kbd>G</kbd> / <kbd>H</kbd> | **Subtitle Delay** adjust (±50ms steps) |
| <kbd>Ctrl</kbd> + <kbd>&uarr;</kbd> / <kbd>&darr;</kbd> | **Volume** up / down (+5% / -5%) |
| <kbd>&rarr;</kbd> / <kbd>&larr;</kbd> | **Short jump** forward / backward (10s) |
| <kbd>Ctrl</kbd> + <kbd>&rarr;</kbd> / <kbd>&larr;</kbd> | **Medium jump** forward / backward (1m) |
| <kbd>]</kbd> / <kbd>[</kbd> | **Faster / Slower** speed (+0.1x / -0.1x) |
| <kbd>=</kbd> | **Reset** speed to 1.0x (Normal) |
| <kbd>Esc</kbd> | **Close dialog** or exit fullscreen |

---

## 📄 License

MIT License — Free to use, modify, and distribute.
