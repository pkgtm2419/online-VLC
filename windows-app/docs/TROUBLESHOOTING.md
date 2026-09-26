# 🛠️ Windows Desktop App — Troubleshooting & FAQ

Frequently asked questions and troubleshooting steps for PVP on Windows.

---

### 1. Port 8000 Already in Use
- **Behavior**: Another program is using port 8000.
- **Solution**: PVP automatically checks port availability and finds the next free port (e.g. `8001`, `8002`, etc.) automatically. Check the system tray or browser address bar for the active port.

### 2. Video Buffering or Infinite Loading
- **Check Stream URL**: Ensure the link is accessible and is not behind a private login wall.
- **Direct Streams vs Embedded**:
  - Direct streams (`.mp4`, `.m3u8`, Google Drive, Dropbox) play natively with full speed, volume, and subtitle controls.
  - Social media and sites with anti-bot protections automatically fall back to clean embed mode.
- **Check Server Logs**:
  - Open `data/pvp.log` in the application directory to inspect extraction details or backend error logs.

### 3. Audio & Video Muxing (1080p Separate Streams)
- **Notice on Startup**: "FFmpeg was not detected in your system PATH".
- **Explanation**: Direct streams and YouTube embeds do not require FFmpeg. However, for legacy sites that serve raw separate video and audio streams at 1080p+, FFmpeg allows the local proxy to mux them on the fly.
- **Install FFmpeg**:
  ```powershell
  winget install Gyan.FFmpeg
  ```
  Restart PVP Player after installing.

### 4. Windows Defender / SmartScreen Warning
- **Reason**: `PVP-Player.exe` is a newly compiled open-source executable without an expensive commercial code-signing certificate.
- **Resolution**: Click **More info** → **Run anyway**. All source code is 100% public, auditable, and local.

### 5. Keyboard Shortcuts Not Responding
- Ensure the browser window or player canvas has keyboard focus by clicking inside the player.
- VLC Shortcuts reference:
  - <kbd>Space</kbd>: Play / Pause
  - <kbd>F</kbd>: Fullscreen
  - <kbd>M</kbd>: Mute / Unmute
  - <kbd>B</kbd>: Cycle Audio Language
  - <kbd>V</kbd>: Cycle Subtitles
  - <kbd>G</kbd> / <kbd>H</kbd>: Subtitle delay (±50ms)
  - <kbd>[</kbd> / <kbd>]</kbd>: Speed down / up (±0.1x)
  - <kbd>=</kbd>: Reset speed to 1.0x
