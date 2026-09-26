# 🪟 Windows Desktop App — Installation Guide

This guide describes how to run and install the PVP (Personal Video Player) desktop application on Windows 10 and Windows 11.

---

## Method 1: Standalone Executable (Recommended)

1. **Download**:
   - Get [`PVP-Player.exe`](../../releases/PVP-Player.exe) directly from the `releases/` directory or GitHub releases.
2. **Run**:
   - Double-click `PVP-Player.exe`.
   - The app starts an embedded local server on `http://127.0.0.1:8000`, adds an orange VLC cone icon to your Windows system tray (near the taskbar clock), and opens your default browser.
3. **No Installation Needed**:
   - The executable is completely self-contained. All dependencies (Python runtime, FastAPI, uvicorn, yt-dlp, web frontend) are bundled inside.

---

## Method 2: Run from Python Source

If you prefer running from source or want to modify code:

### Requirements
- Windows 10 or 11 (64-bit)
- Python 3.10, 3.11, or 3.12
- *(Optional)* FFmpeg in your system PATH for separate 1080p video+audio muxing (`winget install Gyan.FFmpeg`)

### Steps
1. Open PowerShell or Command Prompt in the `windows-app/` directory:
   ```powershell
   cd windows-app
   ```
2. Create and activate a virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
3. Install required packages:
   ```powershell
   pip install -r requirements.txt
   ```
4. Start the application:
   ```powershell
   python pvp_desktop.py
   ```
   Or double-click `run.bat`.

---

## Method 3: Compile Your Own Standalone Executable

To compile a fresh single-file `.exe`:
```powershell
pip install -r requirements.txt
python build.py
```
The output binary will be generated at `dist/PVP-Player.exe`.
