# 📱 PVP (Personal Video Player) — Android Mobile Application

A 100% standalone, offline-capable Android media player app built with Kotlin and Android SDK, featuring an authentic, touch-optimized **VLC Media Player** mobile interface.

---

## 📥 Direct Installation

1. Download **`PVP-Player.apk`** (located at `android-app/PVP-Player.apk` or in `releases/PVP-Player.apk`).
2. Transfer or download directly to your Android device (phone or tablet).
3. Tap the `.apk` file to install. If prompted by Android security, enable *"Allow from this source"*.
4. Open **PVP Player**!

---

## 🌟 Key Mobile Features

- **⚡ Universal Share Intent Auto-Detection**:
  - Tap **"Share"** on any video in YouTube, Instagram Reels, TikTok, Twitter/X, Reddit, or Chrome.
  - Choose **PVP Player** from the Android system share sheet.
  - The app automatically launches, parses the URL (stripping extra text/punctuation), and **immediately starts streaming the video with zero clicks**!
- **📋 Smart Clipboard Auto-Detection & "Paste & Play"**:
  - Copy any link to clipboard, then open PVP.
  - The app automatically detects the video URL and prompts you to stream, or tap the prominent orange **"📋 Paste & Play"** button.
- **👆 Mobile Touch Gestures**:
  - **Double-tap left screen**: Seek backward 10 seconds (with animated ripple).
  - **Double-tap right screen**: Seek forward 10 seconds (with animated ripple).
  - **Tap center**: Toggle Play / Pause and display/hide controls.
- **🛡️ 100% Ad-Free & Offline Engine**:
  - Bundled offline HLS engine (`hls.min.js`) for adaptive `.m3u8` video streaming.
  - Direct client-side video resolution for MP4, WebM, MKV, YouTube embeds, and Vimeo with zero server dependency.
- **🖥️ True Mobile VLC Interface**:
  - Clean touch-first layout without desktop window borders.
  - Screen WakeLock (screen stays on during video playback).
  - Immersive fullscreen playback with transient system bars on swipe.

---

## 🛠️ Building from Source

```powershell
# Set Java 17
$env:JAVA_HOME = "C:\Program Files\ojdkbuild\java-17-openjdk-17.0.3.0.6-1"

# Build APK
./gradlew assembleDebug
```
Output: `app/build/outputs/apk/debug/app-debug.apk`
