# 🎬 PVP (Personal Video Player) — Three Independent Platforms

[![GitHub Repository](https://img.shields.io/badge/GitHub-pkgtm2419%2Fonline--VLC-blue?style=for-the-badge&logo=github)](https://github.com/pkgtm2419/online-VLC)
[![100% Local Execution](https://img.shields.io/badge/Privacy-100%25%20Local%20%26%20Offline-success?style=for-the-badge&logo=shield)](https://github.com/pkgtm2419/online-VLC)
[![Platforms](https://img.shields.io/badge/Platforms-Windows%20%7C%20Android%20%7C%20Chrome-orange?style=for-the-badge)](https://github.com/pkgtm2419/online-VLC)

> **PVP (Personal Video Player)** is a universal, 100% ad-free media player designed with the authentic layout, controls, and keyboard shortcuts of **VLC Media Player**. The repository is organized into **three completely independent, standalone projects** for **Windows**, **Android**, and **Google Chrome**, each bundling all its required dependencies to run locally without cloud servers or cross-project dependencies.

---

## 📥 Direct Downloads & Installation

Choose your platform below to download the pre-built files directly from this repository:

| Platform | Download Button | Package Type | Quick Instructions |
| :--- | :--- | :--- | :--- |
| 🪟 **Windows Desktop** | [![Download Windows EXE](https://img.shields.io/badge/Download-PVP--Player.exe-FF8800?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player.exe) <br> *(or [Download as .ZIP](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player-Windows.zip))* | Standalone `.exe` (36.8 MB) | **Double-click `PVP-Player.exe` to run.** <br> Starts local player and opens in default browser with tray icon. No setup needed. |
| 📱 **Android Mobile** | [![Download Android APK](https://img.shields.io/badge/Download-PVP--Player.apk-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player.apk) <br> *(or [Source Project .ZIP](https://github.com/pkgtm2419/online-VLC/raw/main/releases/pvp-android-mobile.zip))* | Installable `.apk` (6.18 MB) | **Direct install on Android phone or tablet.** <br> Tap to install. Supports Share-to-Play, automatic clipboard detection, and full VLC controls. |
| 🧩 **Chrome Extension** | [![Download Chrome Extension](https://img.shields.io/badge/Download-Chrome--Extension.zip-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://github.com/pkgtm2419/online-VLC/raw/main/releases/pvp-chrome-extension.zip) | Extension `.zip` (139 KB) | **1.** Unzip the downloaded file. <br> **2.** Go to `chrome://extensions` → toggle **Developer mode**. <br> **3.** Click **Load unpacked** and select folder. Adds "Open with PVP" to every web video! |

---

## 📁 Independent Repository Structure

This repository contains **three separate project directories** with zero coupling between them:

```
online-VLC/
├── releases/                       # Compiled, production-ready release downloads
│   ├── PVP-Player.exe              # Standalone Windows executable (36.8 MB)
│   ├── PVP-Player-Windows.zip      # Windows package archive (36.5 MB)
│   ├── PVP-Player.apk              # Installable Android Mobile APK (6.18 MB)
│   ├── pvp-android-mobile.zip      # Android project source archive (165 KB)
│   └── pvp-chrome-extension.zip    # Self-contained Chrome extension (139 KB)
│
├── windows-app/                    # Standalone Windows Desktop App Project
│   ├── app/                        # Bundled backend and VLC web player frontend
│   │   ├── main.py                 # FastAPI local backend
│   │   ├── extractor.py            # Universal stream extraction engine
│   │   ├── streamer.py             # Local streaming proxy
│   │   └── static/                 # VLC frontend (index.html, app.js, style.css, hls.min.js)
│   ├── pvp_desktop.py              # System tray launcher (pystray + uvicorn)
│   ├── build.py                    # PyInstaller standalone binary builder
│   ├── pvp.spec                    # PyInstaller build specification
│   ├── requirements.txt            # Standalone Python dependencies
│   ├── run.bat                     # Instant one-click launcher
│   └── README.md                   # Windows project guide
│
├── android-app/                    # Standalone Android Mobile Project
│   ├── app/                        # Android application module
│   │   ├── src/main/java/          # Kotlin native bridge & Share Intent handler
│   │   ├── src/main/assets/www/    # Touch-optimized mobile VLC UI & player
│   │   └── src/main/res/           # Native Android resources, drawables & icons
│   ├── build.gradle.kts            # Project build configuration
│   ├── settings.gradle.kts         # Gradle settings
│   ├── gradle.properties           # Build properties
│   └── README.md                   # Android build & setup guide
│
└── chrome-extension/               # Standalone Chrome Browser Extension
    ├── manifest.json               # Manifest V3 specification
    ├── popup.html/css/js           # Minimal ON/OFF toggle UI
    ├── content.js/css              # Video overlay injector
    ├── player/                     # Self-contained internal offline VLC player
    │   ├── player.html             # Standalone playback tab
    │   ├── player.js               # Autonomous player engine
    │   ├── player.css              # Dark VLC-themed player style
    │   └── hls.min.js              # Bundled HLS streaming engine
    ├── icons/                      # Extension icons
    └── README.md                   # Chrome extension guide
```

---

## 🚀 Platform Setup Guides

### 🪟 1. Windows Desktop App (`windows-app/`)

- **Direct Download**: **[PVP-Player.exe](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player.exe)** (or [PVP-Player-Windows.zip](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player-Windows.zip)).
- **Quick Run**: Double-click `PVP-Player.exe`. The app starts a local server on your computer, places an orange VLC cone icon in your system tray, and opens your default browser at `http://127.0.0.1:8000`.
- **System Tray Options**: Right-click the system tray icon to **Open Browser**, **Restart Server**, or **Quit**.
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
  - **Share to Play**: Share any video link from YouTube, Instagram, TikTok, Reddit, Chrome, or any other app directly to **PVP Player** — it auto-detects the URL and begins playback instantly with zero manual clicks.
  - **Clipboard Auto-Detection**: Automatically detects video URLs on your clipboard when opening the app and prompts for immediate streaming.
  - **Full Offline Operation**: Direct video URLs (.mp4, .m3u8, etc.) stream directly on device without any local or external server.
- **Build from Source**:
  ```powershell
  cd android-app
  gradle assembleDebug
  ```

---

### 🧩 3. Chrome Browser Extension (`chrome-extension/`)

- **Direct Download**: **[pvp-chrome-extension.zip](https://github.com/pkgtm2419/online-VLC/raw/main/releases/pvp-chrome-extension.zip)**.
- **Installation**:
  1. Extract `pvp-chrome-extension.zip`.
  2. Open Chrome, Brave, or Edge and go to `chrome://extensions/`.
  3. Turn on **Developer mode** in the top-right corner.
  4. Click **Load unpacked** and select the extracted folder.
- **How to Use**:
  - Click the extension icon to toggle it **ON** or **OFF**.
  - When enabled, every `<video>` and video embed on any webpage displays a floating **"Open with PVP"** button.
  - Clicking the button automatically opens the video in the extension's **internal standalone VLC player tab** (`player/player.html`) with zero dependency on external servers or desktop apps.

---

## 🌟 Player Capabilities

- **🛡️ 100% Ad-Free**: Extracts pure media streams from CDNs, completely bypassing pre-rolls, mid-rolls, pop-ups, and trackers.
- **🔒 Zero Cloud Interaction**: All operations run locally on your hardware. No external tracking, no cloud telemetry.
- **🪟 Startup "Open Network Stream" Modal**: Opens automatically on launch so you can paste any link and click **Stream** immediately.
- **📋 One-Tap Paste & Play**: Instant playback button on the main cone screen, menubar, and automatic clipboard detection banner.
- **🖥️ Authentic VLC Fullscreen Mode**:
  - Full display video with zero distractions (top menu hidden).
  - Floating bottom controls toolbar and mouse cursor automatically **hide after 5 seconds of inactivity**.
  - Moving the mouse brings them back instantly.
- **⏱️ Accurate Duration & Seeking**: Correctly displays total duration and remaining countdown time (`00:01:23 / 00:03:45` or `-00:02:22`), with seamless timeline scrubbing.
- **🔊 Audio Language Switching**: Detects multi-language audio tracks (HLS), switches tracks seamlessly on the fly with VLC-style OSD notifications, and allows track cycling via the <kbd>B</kbd> key.
- **📝 Subtitle System**:
  - Auto-detects embedded subtitle tracks (<kbd>V</kbd> key to cycle).
  - External `.srt` / `.vtt` file drag-and-drop or file picker.
  - Subtitle delay synchronization (-5000ms to +5000ms via <kbd>G</kbd> / <kbd>H</kbd> keys).
  - Custom subtitle appearance settings (font size, color, background).
- **📑 Full Playlist Support**:
  - Paste any playlist URL (YouTube, Vimeo albums, etc.).
  - Extracts all tracks into the **VLC Playlist Drawer** (<kbd>Ctrl</kbd> + <kbd>L</kbd>).
  - Automatically advances to the next track when a video ends.
- **⏩ Video Speed Control**: Adjust playback speed smoothly (`0.5x` to `2.0x`) with **`-`** and **`+`** step buttons or keyboard shortcuts (<kbd>[</kbd>, <kbd>]</kbd>, <kbd>=</kbd>).
- **🔊 Volume Boost**: Volume slider goes from `0%` up to `125%` just like real VLC.
- **🌐 Universal URL Support**:
  - YouTube, Vimeo, Twitter/X, Reddit, TikTok, Facebook, Dailymotion, Twitch.
  - Movie streaming sites & download portals (Dean Edwards JavaScript unpacking & HLS master playlist extraction).
  - Direct media: `.mp4`, `.webm`, `.mkv`, `.mov`, and HLS (`.m3u8`).

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
