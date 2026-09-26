# 📱 Android Mobile App — Installation & Setup Guide

This guide describes how to install and build the PVP (Personal Video Player) mobile application for Android devices running Android 10, 11, 12, 13, 14, and 15+.

---

## Method 1: Install Pre-Built APK (Recommended)

1. **Download APK**:
   - Download [`PVP-Player.apk`](../../releases/PVP-Player.apk) onto your Android device.
2. **Enable Unknown Apps**:
   - Open your browser's download manager or Files app.
   - Tap `PVP-Player.apk`.
   - If prompted: *For your security, your phone is not allowed to install unknown apps from this source*, tap **Settings** and enable **Allow from this source**.
3. **Install & Launch**:
   - Tap **Install**.
   - Tap **Open** to start PVP Player.

---

## Method 2: Build from Source

### Prerequisites
- Android Studio Jellyfish / Koala (or Command-Line Tools)
- OpenJDK 17 or higher
- Gradle 8.10+ (wrapper included)
- Android SDK Platform 35 / Build Tools 35.0.0

### Build Instructions
1. Open PowerShell or Terminal in the repository root:
   ```powershell
   cd android-app
   ```
2. Build debug APK using the Gradle wrapper:
   ```powershell
   ./gradlew assembleDebug
   ```
3. Locate output APK:
   - Output path: `app/build/outputs/apk/debug/app-debug.apk`
4. Install to connected device or emulator via ADB:
   ```powershell
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

---

## First-Time Configuration & Features

- **Share-to-Play**: When viewing any video in YouTube, Instagram, TikTok, Reddit, or Chrome, tap **Share** → select **PVP Player**.
- **Clipboard Auto-Detection**: Copy any link to your clipboard, then switch to PVP Player. A prompt banner appears automatically.
- **Hardware Acceleration**: GPU decoding is enabled by default for smooth 1080p and 4K playback.
- **Background Playback**: In Settings (gear icon in player), toggle **Background Play** to keep audio streaming when switching apps or locking the screen.
