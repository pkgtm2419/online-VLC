# 🎬 Online VLC — Ad-Free Universal Video Player

**Online VLC** is a minimalist, ad-free universal video player web application. Paste any video URL from any website or cloud storage, and it automatically extracts the raw stream, bypasses ads, and starts playing immediately with video title and playback speed controls.

---

## 🌟 Key Features

- **🛡️ 100% Ad-Free**: Bypasses all pre-rolls, mid-rolls, pop-ups, and tracking scripts by streaming directly from underlying media servers.
- **⚡ Instant Autoplay**: Automatically starts playing as soon as a video link is pasted and submitted.
- **🎯 Clean & Minimalist UI**: Distraction-free design displaying strictly the video player, video title, and controls.
- **⏩ Video Speed Control**: Seamless playback speed adjustment (`0.5x`, `0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`).
- **🎛️ Multi-Resolution Quality**: Switch between 1080p HD, 720p HD, 480p, 360p, or Original on the fly.
- **🌐 Universal Link Support**:
  - **Platforms**: YouTube, Vimeo, Twitter/X, Reddit, TikTok, Facebook, Dailymotion, Twitch, etc.
  - **Cloud Storage**: Google Drive, Dropbox, OneDrive (automatically normalized to direct stream links).
  - **Direct Formats**: `.mp4`, `.webm`, `.ogv`, `.mov`, `.mkv`, and HLS (`.m3u8`).
- **🚀 Live Remuxing**: Zero-reencode stream copy using FFmpeg to merge high-res video and audio tracks in real-time.

---

## 💻 Manual Commands to Run and Test Locally

### Option 1: One-Click Launcher (Windows)
Simply double-click:
```cmd
run.bat
```

### Option 2: PowerShell
```powershell
# 1. Navigate to the project directory
cd d:\drive

# 2. Activate virtual environment
.\.venv\Scripts\Activate.ps1

# 3. Start the application server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

### Option 3: Command Prompt (cmd.exe)
```cmd
cd /d d:\drive
.venv\Scripts\activate.bat
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Option 4: Docker
```bash
docker compose up --build
```
Access at **http://localhost:8000**.

---

## 🛠️ GitHub Actions CI/CD Pipeline

The repository includes a complete GitHub Actions workflow located at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
- **Automated Testing**: Sets up Python 3.11 & FFmpeg, installs dependencies, and runs smoke checks on every push and PR to `main`.
- **Docker Container Build & Publish**: Automatically builds and publishes a container image to GitHub Container Registry (`ghcr.io/pkgtm2419/online-vlc:latest`).
- **Deploy Anywhere**: The resulting container can be deployed directly to Cloud Run, Render, Fly.io, Railway, or any VPS with Docker.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause |
| <kbd>&larr;</kbd> / <kbd>&rarr;</kbd> | Seek backward / forward 5s |
| <kbd>M</kbd> | Mute / Unmute |
