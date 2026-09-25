# 🎬 PVP (Personal Video Player) — Online VLC

### 🚀 **Live Web Application**: [https://online-vlc.onrender.com](https://online-vlc.onrender.com)

[![Live Web App](https://img.shields.io/badge/Live%20App-online--vlc.onrender.com-success?style=for-the-badge&logo=render)](https://online-vlc.onrender.com)
[![GitHub Repository](https://img.shields.io/badge/GitHub-pkgtm2419%2Fonline--VLC-blue?style=for-the-badge&logo=github)](https://github.com/pkgtm2419/online-VLC)
[![CI/CD Pipeline](https://github.com/pkgtm2419/online-VLC/actions/workflows/deploy.yml/badge.svg)](https://github.com/pkgtm2419/online-VLC/actions)

> **PVP (Personal Video Player)** is a universal, ad-free video player designed with the authentic layout, controls, and keyboard shortcuts of **VLC Media Player**. Available on **3 platforms**: Web Browser, Windows Desktop, Android Mobile, and Chrome Extension.

---

## 📦 Available Platforms

| Platform | Description | Status |
|:---------|:------------|:-------|
| 🌐 **Web App** | [https://online-vlc.onrender.com](https://online-vlc.onrender.com) | ✅ Live |
| 🖥️ **Windows Desktop** | Standalone `.exe` with system tray | ✅ Ready |
| 📱 **Android Mobile** | Native Android app with embedded server | ✅ Ready |
| 🧩 **Chrome Extension** | Open any video with PVP | ✅ Ready |

---

## 🌐 Web Application

Open and use the live application right now in your browser:

👉 **[https://online-vlc.onrender.com](https://online-vlc.onrender.com)**

*(Works on all mobile, tablet, and desktop browsers — zero installation required)*

---

## 🖥️ Windows Desktop App

A standalone Windows executable that runs PVP locally with a system tray icon.

### Features
- Starts a local server automatically
- Opens in your default browser
- System tray icon with: Open Browser, Restart Server, Quit
- Works completely offline (except for streaming URLs)

### Quick Start
```powershell
cd desktop
pip install -r requirements-desktop.txt
python pvp_desktop.py
```

### Build Standalone .exe
```powershell
cd desktop
python build.py
# Output: desktop/dist/PVP-Player.exe
```

See [`desktop/README.md`](desktop/README.md) for full details.

---

## 📱 Android Mobile App

A native Android app wrapping PVP with an embedded Python backend via **Chaquopy**.

### Features
- Full VLC-style player in a native Android WebView
- Embedded Python FastAPI server runs locally on device
- **Share Intent**: Share any video URL from another app → PVP opens and plays it
- Foreground service keeps server alive in background
- Fullscreen immersive mode

### Build Instructions
```bash
# 1. Copy web assets into the Android project
python mobile/build_android.py

# 2. Open mobile/android/ in Android Studio
# 3. Sync Gradle (Chaquopy downloads Python automatically)
# 4. Build & Run on device/emulator
```

See [`mobile/README.md`](mobile/README.md) for full details.

---

## 🧩 Chrome Browser Extension

A Manifest V3 Chrome extension that adds "Open with PVP" buttons to every video on the web.

### Features
- **Simple popup**: Only an enable/disable toggle switch
- **Content script**: Detects `<video>` and `<iframe>` elements on any webpage
- **Floating button**: "Open with PVP" appears on hover over any video
- **MutationObserver**: Handles dynamically loaded videos (SPAs)
- **Badge indicator**: Shows ON/OFF state on the extension icon

### Installation
1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **"Load unpacked"**
4. Select the `extension/` folder
5. The PVP icon appears in your toolbar

> **Note**: The extension requires the desktop app or local server running at `http://127.0.0.1:8000`. Start the desktop app first, then use the extension.

See the [`extension/`](extension/) folder for all source files.

---

## 🌟 Key Features

- **🛡️ 100% Ad-Free**: Extracts pure media streams from CDNs, bypassing pre-rolls, mid-rolls, pop-ups, and trackers
- **🪟 Open Network Stream Modal**: Opens on launch to paste any link and stream immediately
- **🖥️ VLC Fullscreen Mode**: Zero-distraction video with auto-hiding controls (5s timeout)
- **⏱️ Accurate Duration & Seeking**: Correct duration display with seamless timeline scrubbing
- **📑 Playlist Support**: Extracts all tracks with auto-advance
- **🔊 Audio Language Switching**: HLS multi-audio track support with OSD notifications
- **📝 Subtitle System**: HLS subtitles, external SRT/VTT loader, delay sync, appearance customization
- **⏩ Speed Control**: `0.5x` to `2.0x` with VLC keyboard shortcuts
- **🔊 Volume Boost**: Up to 125% like real VLC
- **🌐 Universal URL Support**: YouTube, Vimeo, Twitter/X, Reddit, TikTok, Facebook, Dailymotion, Google Drive, Dropbox, `.mp4`, `.m3u8`, and movie streaming sites

---

## ⌨️ VLC Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> | **Open Network Stream** popup dialog |
| <kbd>Ctrl</kbd> + <kbd>L</kbd> | **Toggle Playlist** view |
| <kbd>Space</kbd> | **Play / Pause** |
| <kbd>S</kbd> | **Stop** playback |
| <kbd>F</kbd> / Double Click | **Toggle Fullscreen** |
| <kbd>N</kbd> / <kbd>P</kbd> | **Next / Previous** track |
| <kbd>M</kbd> | **Mute / Unmute** |
| <kbd>B</kbd> | **Cycle audio** tracks |
| <kbd>V</kbd> | **Cycle subtitle** tracks |
| <kbd>G</kbd> / <kbd>H</kbd> | **Subtitle delay** adjust (±50ms) |
| <kbd>Ctrl</kbd> + <kbd>&uarr;</kbd> / <kbd>&darr;</kbd> | **Volume** up / down |
| <kbd>&rarr;</kbd> / <kbd>&larr;</kbd> | **Short jump** (10s) |
| <kbd>Ctrl</kbd> + <kbd>&rarr;</kbd> / <kbd>&larr;</kbd> | **Medium jump** (1m) |
| <kbd>]</kbd> / <kbd>[</kbd> | **Faster / Slower** speed |
| <kbd>=</kbd> | **Reset** speed to 1.0x |

---

## 💻 Run Locally

### Option 1: One-Click (Windows)
```cmd
run.bat
```

### Option 2: Python
```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

### Option 3: Docker
```bash
docker compose up --build
```
Access at **http://localhost:8000**.

---

## 📁 Project Structure

```
online-VLC/
├── app/                        # Web application
│   ├── main.py                 # FastAPI backend
│   ├── extractor.py            # Universal video extractor
│   ├── streamer.py             # HTTP proxy & FFmpeg muxer
│   └── static/                 # Frontend (HTML/CSS/JS)
│       ├── index.html
│       ├── app.js
│       └── style.css
├── desktop/                    # Windows desktop app
│   ├── pvp_desktop.py          # System tray launcher
│   ├── build.py                # PyInstaller build script
│   ├── pvp.spec                # PyInstaller spec
│   └── requirements-desktop.txt
├── mobile/                     # Android mobile app
│   ├── build_android.py        # Asset copy script
│   └── android/                # Android Studio project
│       ├── app/src/main/
│       │   ├── java/.../       # Kotlin source
│       │   ├── python/         # Chaquopy Python
│       │   └── res/            # Android resources
│       └── build.gradle.kts
├── extension/                  # Chrome extension
│   ├── manifest.json
│   ├── popup.html/css/js
│   ├── content.js/css
│   ├── background.js
│   └── icons/
├── Dockerfile
├── docker-compose.yml
├── render.yaml
├── requirements.txt
└── README.md
```

---

## 📄 License

MIT License — Free to use, modify, and distribute.
