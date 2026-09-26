# 📝 Windows App Changelog

All notable changes to the PVP (Personal Video Player) Windows desktop application are documented in this file.

## [2.0.0] - 2026-09-26 (Windows + Android Streaming Edition)

### Added
- **Multi-Source Video Extraction**:
  - Telegram public links support (`t.me/<channel>/<msg_id>`).
  - Mega.nz shared files support (`mega.nz/file/...`).
  - Directory index page scraping: Auto-scans open Apache/Nginx web directories for media files (`.mp4`, `.webm`, `.mkv`, `.m3u8`, `.avi`, `.mov`) and auto-generates structured playlists.
  - Cloud storage direct streaming: Google Drive, Dropbox, and OneDrive link normalizers.
- **SQLite Persistent Playlist Management**:
  - Full CRUD API for playlists and playlist tracks stored locally in `data/playlists.db`.
  - Auto-advance to next track on video completion.
- **Privacy & Zero-Ads Engine**:
  - `AD_BLOCKING_LIST` tracking domain blocklist.
  - HTTP middleware removing tracking cookies and enforcing `X-Tracking-Protection: full`.
  - `/api/check-url-safety` endpoint for checking stream URLs against tracking networks.
- **System Stability & Hardening**:
  - Native startup validation for optional FFmpeg muxing engine.
  - URL length limit validation (2048 characters) for DoS protection.
  - Rotating file logger (`data/pvp.log`, max 5 MB, 3 backups).
  - Dedicated `/health` monitoring endpoint.
  - Complete elimination of YouTube oEmbed external network calls (100% local thumbnail/title generation).

### Removed
- Removed legacy Chrome extension dependencies and code.

---

## [1.0.0] - Initial Release
- Authentic VLC Media Player dark layout, menus, and keyboard shortcuts.
- Local FastAPI streaming backend with PyInstaller standalone single-file launcher (`PVP-Player.exe`).
- System tray icon with Open Browser, Restart Server, and Quit actions.
- HLS adaptive bitrate streaming engine and embedded subtitle/audio track switching.
