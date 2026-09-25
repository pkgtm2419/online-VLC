# 🪟 PVP (Personal Video Player) — Windows Desktop Application

A 100% standalone, offline-capable Windows desktop media player featuring the authentic layout, controls, and shortcuts of **VLC Media Player**.

---

## 🚀 Quick Start

### Option A: Run from Pre-compiled Binary
1. Double-click `dist/PVP-Player.exe` (or download from `releases/PVP-Player.exe`).
2. The app starts a local server on port 8000, adds a VLC orange cone to your system tray, and opens your default browser.
3. Right-click the system tray icon to **Open Browser**, **Restart Server**, or **Quit**.

### Option B: Run from Source
```powershell
# Install dependencies
pip install -r requirements.txt

# Launch desktop app
python pvp_desktop.py
# Or double-click run.bat
```

### Option C: Build Standalone Executable (.exe)
```powershell
python build.py
```
Output: `dist/PVP-Player.exe`

---

## 🌟 Key Features
- **100% Local**: No external servers required. Runs completely on your machine.
- **VLC Controls**: Exact keyboard shortcuts, volume boost (up to 125%), audio track switching (<kbd>B</kbd>), subtitle delay adjustment (<kbd>G</kbd>/<kbd>H</kbd>), and 5-second cursor autohide in fullscreen (<kbd>F</kbd>).
- **Universal Streaming**: Supports YouTube, Vimeo, direct MP4/WebM/MKV, and HLS (`.m3u8`) with ad-free extraction.
- **LAN Access**: Listens on local network so your mobile devices on home Wi-Fi can connect directly if desired.
