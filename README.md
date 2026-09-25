# 🎬 PVP (Personal Video Player) — Online VLC

[![CI/CD Pipeline](https://github.com/pkgtm2419/online-VLC/actions/workflows/deploy.yml/badge.svg)](https://github.com/pkgtm2419/online-VLC/actions)
[![GitHub Container Registry](https://img.shields.io/badge/Container-GHCR-blue?logo=docker)](https://github.com/pkgtm2419/online-VLC/pkgs/container/online-vlc)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/pkgtm2419/online-VLC)

> **PVP (Personal Video Player)** is a universal, ad-free web video player designed with the authentic layout, controls, and keyboard shortcuts of **VLC Media Player**. Paste any video or playlist URL from anywhere on the internet or cloud storage, and enjoy instant, ad-free playback.

---

## 🌐 Public Application URLs & Deployment

Because **PVP** requires a live Python backend with **FFmpeg** and **yt-dlp** to extract streams and bypass ads, GitHub Pages (which only supports static HTML without a server) cannot run the backend directly.

Instead, the application is deployed through the following channels:

### 1. 🚀 One-Click Free Public Cloud URL (Render)
Click the button below to deploy your own live, public web URL (e.g. `https://online-vlc.onrender.com`):

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/pkgtm2419/online-VLC)

*(Deployment takes ~2 minutes and gives you a free, public `https://<your-app-name>.onrender.com` URL accessible by anyone on any device)*.

### 2. 📦 Published Docker Image (GitHub Container Registry)
GitHub Actions automatically builds and publishes the production container image on every push:
- **Registry URI**: `ghcr.io/pkgtm2419/online-vlc:latest`
- **Package Page**: [https://github.com/pkgtm2419/online-VLC/pkgs/container/online-vlc](https://github.com/pkgtm2419/online-VLC/pkgs/container/online-vlc)

To run the published image on any server or VPS in one command:
```bash
docker run -d -p 8000:8000 --name pvp ghcr.io/pkgtm2419/online-vlc:latest
```
Then visit `http://localhost:8000` (or `http://<your-server-ip>:8000`).

### 3. 💻 Local Web URL
When running locally on your computer:
- **Local Address**: [**http://localhost:8000**](http://localhost:8000)

---

## 🌟 Key Features

- **🛡️ 100% Ad-Free**: Extracts pure media streams from CDNs, completely bypassing pre-rolls, mid-rolls, pop-ups, and trackers.
- **🪟 Startup "Open Network Stream" Modal**: Opens automatically on launch so you can paste any link and click **Stream** immediately.
- **🖥️ Authentic VLC Fullscreen Mode**:
  - Full display video with zero distractions (top menu hidden).
  - Floating bottom controls toolbar and mouse cursor automatically **hide after 5 seconds of inactivity**.
  - Moving the mouse brings them back instantly.
- **⏱️ Accurate Duration & Seeking**: Correctly displays total duration and remaining countdown time (`00:01:23 / 00:03:45` or `-00:02:22`), with seamless timeline scrubbing.
- **📑 Full Playlist Support**:
  - Paste any playlist URL (YouTube, Vimeo albums, etc.).
  - Extracts all tracks into the **VLC Playlist Drawer** (<kbd>Ctrl</kbd> + <kbd>L</kbd>).
  - Automatically advances to the next track when a video ends.
- **⏩ Video Speed Control**: Adjust playback speed smoothly (`0.5x` to `2.0x`) with **`-`** and **`+`** step buttons or keyboard shortcuts.
- **🔊 Volume Boost**: Volume slider goes from `0%` up to `125%` just like real VLC.
- **🌐 Universal URL Support**:
  - YouTube, Vimeo, Twitter/X, Reddit, TikTok, Facebook, Dailymotion, Twitch.
  - Cloud storage: Google Drive, Dropbox, OneDrive.
  - Direct media: `.mp4`, `.webm`, `.mkv`, `.mov`, and HLS (`.m3u8`).

---

## ⌨️ VLC Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> | **Open Network Stream** popup dialog |
| <kbd>Ctrl</kbd> + <kbd>L</kbd> | **Toggle Playlist** view |
| <kbd>Space</kbd> | **Play / Pause** |
| <kbd>S</kbd> | **Stop** playback (resets to beginning and shows VLC cone) |
| <kbd>F</kbd> / Double Click | **Toggle Fullscreen** |
| <kbd>N</kbd> | **Next** track in playlist |
| <kbd>P</kbd> | **Previous** track in playlist |
| <kbd>M</kbd> | **Mute / Unmute** |
| <kbd>Ctrl</kbd> + <kbd>&uarr;</kbd> / <kbd>&darr;</kbd> | **Volume** up / down (+5% / -5%) |
| <kbd>&rarr;</kbd> / <kbd>&larr;</kbd> | **Short jump** forward / backward (10s) |
| <kbd>Ctrl</kbd> + <kbd>&rarr;</kbd> / <kbd>&larr;</kbd> | **Medium jump** forward / backward (1m) |
| <kbd>]</kbd> / <kbd>[</kbd> | **Faster / Slower** speed (+0.1x / -0.1x) |
| <kbd>=</kbd> | **Reset** speed to 1.0x (Normal) |
| <kbd>Esc</kbd> | **Close dialog** or exit fullscreen |

---

## 💻 Manual Commands to Run Locally

### Option 1: One-Click Launcher (Windows)
Double-click:
```cmd
run.bat
```

### Option 2: PowerShell
```powershell
cd d:\drive
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

### Option 3: Docker
```bash
docker compose up --build
```
Access at **http://localhost:8000**.
