# PVP (Personal Video Player) - Desktop Edition

This directory contains the files needed to build a standalone Windows executable for the PVP application.

## Prerequisites

- Python 3.8+ (Windows)
- Pip

## Building the Executable

To build the standalone `.exe`, simply run the build script from this directory:

```bash
python build.py
```

This script will:
1. Install all required dependencies (including PyInstaller, PyStray, etc.)
2. Run PyInstaller with the provided `pvp.spec` file
3. Bundle the entire application (including FastAPI, yt-dlp, and static assets) into a single executable file

Once the build is complete, you will find `PVP-Player.exe` in the `dist/` directory.

## Running the Application

1. Double-click `PVP-Player.exe`.
2. A system tray icon (orange VLC-style cone) will appear.
3. The app will automatically find an available port (starting at 8000), start the background server, and open your default web browser.

You can right-click the system tray icon to:
- **Open in Browser**: Re-open the web player interface
- **Restart Server**: Restart the underlying FastAPI server
- **Quit**: Gracefully shut down the server and exit the application
