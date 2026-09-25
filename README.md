# 🎬 PVP (Personal Video Player) — Online VLC

### 🚀 **Live Web Application**: [https://online-vlc.onrender.com](https://online-vlc.onrender.com)

[![Live Web App](https://img.shields.io/badge/Live%20App-online--vlc.onrender.com-success?style=for-the-badge&logo=render)](https://online-vlc.onrender.com)
[![GitHub Repository](https://img.shields.io/badge/GitHub-pkgtm2419%2Fonline--VLC-blue?style=for-the-badge&logo=github)](https://github.com/pkgtm2419/online-VLC)
[![CI/CD Pipeline](https://github.com/pkgtm2419/online-VLC/actions/workflows/deploy.yml/badge.svg)](https://github.com/pkgtm2419/online-VLC/actions)

> **PVP (Personal Video Player)** is a universal, ad-free video player designed with the authentic layout, controls, and keyboard shortcuts of **VLC Media Player**. All processing runs **locally on your device** without third-party servers.

---

## 📥 Direct Downloads & Installation

Choose your platform below to download the pre-built files directly from this repository:

| Platform | Download Button | Package Type | Quick Instructions |
| :--- | :--- | :--- | :--- |
| 🪟 **Windows Desktop** | [![Download Windows EXE](https://img.shields.io/badge/Download-PVP--Player.exe-FF8800?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player.exe) <br> *(or [Download as .ZIP](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player-Windows.zip))* | Standalone `.exe` (36 MB) | **Double-click `PVP-Player.exe` to run.** <br> Starts local player and opens in default browser with tray icon. No setup needed. |
| 📱 **Android Mobile** | [![Download Android APK](https://img.shields.io/badge/Download-PVP--Player.apk-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player.apk) <br> *(or [Source Project .ZIP](https://github.com/pkgtm2419/online-VLC/raw/main/releases/pvp-android-mobile.zip))* | Installable `.apk` (6 MB) | **Direct install on Android phone or tablet.** <br> Tap to install. Supports Share-to-Play, automatic clipboard detection, and full VLC controls. |
| 🧩 **Chrome Extension** | [![Download Chrome Extension](https://img.shields.io/badge/Download-Chrome--Extension.zip-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://github.com/pkgtm2419/online-VLC/raw/main/releases/pvp-chrome-extension.zip) | Extension `.zip` (8 KB) | **1.** Unzip the downloaded file. <br> **2.** Go to `chrome://extensions` → toggle **Developer mode**. <br> **3.** Click **Load unpacked** and select folder. Adds "Open with PVP" to every web video! |
| 🌐 **Web Version** | [![Launch Web App](https://img.shields.io/badge/Launch-Live--Web--Player-E65100?style=for-the-badge&logo=firefoxbrowser&logoColor=white)](https://online-vlc.onrender.com) | Cloud Hosted | Instant browser playback on any desktop, tablet, or phone without downloading. |

---

## 🚀 Platform Setup Guides

### 🪟 1. Windows Desktop Executable (`.exe`)

1. Click **[Download PVP-Player.exe](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player.exe)** (or the [ZIP archive](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player-Windows.zip)).
2. Double-click `PVP-Player.exe`.
3. The app starts a local server on your computer, places an orange VLC cone icon in your system tray, and opens your default browser at `http://127.0.0.1:8000`.
4. Right-click the system tray icon to **Open Browser**, **Restart Server**, or **Quit**.

### 📱 2. Android Mobile App (`.apk`)

1. Download **[PVP-Player.apk](https://github.com/pkgtm2419/online-VLC/raw/main/releases/PVP-Player.apk)** directly onto your Android device.
2. Tap the downloaded `.apk` file to install (if prompted, tap *Settings* and enable *Allow from this source*).
3. **Features on Android**:
   - **Direct Video Streaming**: Plays videos directly with zero storage waste and no waiting for downloads.
   - **Smart Clipboard Auto-Detection**: Copy any video link (YouTube, Instagram, TikTok, Reddit, etc.) and open PVP Player — it immediately prompts you to stream with one tap.
   - **One-Tap "Paste & Play"**: Dedicated orange button on the cone screen and menu bar.
   - **Native Android Share Intent**: Tap "Share" on any video in YouTube, Instagram, or your browser, then select **PVP Player** to start streaming right away.
   - **Immersive Fullscreen & Screen WakeLock**: Automatically hides navigation bars and keeps the screen awake during playback.

### 🧩 3. Chrome Browser Extension (Manifest V3)

1. Click **[Download Chrome-Extension.zip](https://github.com/pkgtm2419/online-VLC/raw/main/releases/pvp-chrome-extension.zip)** and extract the zip file.
2. In Google Chrome, Brave, or Microsoft Edge, navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click the **Load unpacked** button and select the extracted `pvp-chrome-extension` folder.
5. **How to use**:
   - The extension popup features a clean **Enable / Disable** toggle.
   - When enabled, any `<video>` or iframe on YouTube, movie sites, or web pages will show a floating **"Open with PVP"** button.
   - Clicking the button opens the stream in your local PVP player.

---

## 🌟 Key Features

- **🛡️ 100% Ad-Free**: Extracts pure media streams from CDNs, completely bypassing pre-rolls, mid-rolls, pop-ups, and trackers.
- **🪟 Startup "Open Network Stream" Modal**: Opens automatically on launch so you can paste any link and click **Stream** immediately.
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
  - Cloud storage: Google Drive, Dropbox, OneDrive.
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

## 💻 Developer & Source Instructions

### Option 1: Run Web App Locally
```powershell
# Clone repo
git clone https://github.com/pkgtm2419/online-VLC.git
cd online-VLC

# Install dependencies and start
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

### Option 2: Build Windows Executable from Source
```powershell
cd desktop
pip install -r requirements-desktop.txt
python build.py
```
Output: `desktop/dist/PVP-Player.exe`

### Option 3: Prepare Android Project
```bash
python mobile/build_android.py
# Then open mobile/android in Android Studio
```

---

## 📁 Repository Structure

```
online-VLC/
├── releases/                   # Direct download builds
│   ├── PVP-Player.exe          # Standalone Windows executable
│   ├── PVP-Player-Windows.zip  # Windows package archive
│   ├── pvp-chrome-extension.zip# Chrome extension package
│   └── pvp-android-mobile.zip  # Android mobile project package
├── app/                        # Core application
│   ├── main.py                 # FastAPI backend
│   ├── extractor.py            # Universal video & movie scraper
│   ├── streamer.py             # Streaming proxy & FFmpeg muxer
│   └── static/                 # VLC frontend
│       ├── index.html          # VLC layout & modals
│       ├── app.js              # VLC client player logic
│       └── style.css           # VLC styles & theme
├── desktop/                    # Windows desktop launcher & build
│   ├── pvp_desktop.py          # System tray application
│   ├── build.py                # PyInstaller build script
│   └── pvp.spec                # PyInstaller spec
├── mobile/                     # Android application
│   ├── build_android.py        # Asset synchronization script
│   └── android/                # Native Android Studio project
├── extension/                  # Chrome extension source
│   ├── manifest.json           # Manifest V3
│   ├── popup.html/css/js       # Toggle button interface
│   ├── content.js/css          # "Open with PVP" button injector
│   └── icons/                  # VLC icons
├── Dockerfile                  # Container definition
├── docker-compose.yml          # Container orchestration
├── render.yaml                 # Render cloud deployment
└── README.md                   # Documentation & downloads
```

---

## 📄 License

MIT License — Free to use, modify, and distribute.
