# 🧩 PVP (Personal Video Player) — Chrome Browser Extension

A 100% standalone Manifest V3 browser extension for Google Chrome, Brave, and Microsoft Edge that lets you stream any web video directly in an ad-free, authentic VLC Player tab with zero external servers.

---

## 📥 Installation

1. Open your browser and navigate to:
   - Chrome / Brave: `chrome://extensions`
   - Edge: `edge://extensions`
2. Enable **Developer mode** using the toggle in the top-right corner.
3. Click the **Load unpacked** button.
4. Select the `chrome-extension` folder (or extract `pvp-chrome-extension.zip` and select it).

---

## 🚀 How to Use

1. Click the **PVP icon** in your browser toolbar to open the clean Enable/Disable popup.
2. Browse to any webpage containing a video (YouTube, Vimeo, streaming sites, direct videos).
3. Hover over the video to reveal the floating orange **"Open with PVP"** button.
4. Clicking **"Open with PVP"** opens the stream directly in a dedicated VLC Player tab (`chrome-extension://.../player/player.html`) with:
   - Authentic VLC controls, timeline scrubber, and volume boost (up to 125%).
   - Bundled offline HLS engine (`hls.min.js`) for adaptive `.m3u8` streams.
   - Standard VLC shortcuts (<kbd>Space</kbd>, <kbd>S</kbd>, <kbd>F</kbd>, <kbd>M</kbd>, <kbd>Ctrl+N</kbd>).
   - **Zero connection to any desktop app or external server required!**
