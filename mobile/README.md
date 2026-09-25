# PVP Mobile App (Android)

A native Android wrapper for the PVP (Personal Video Player) using **Capacitor** + a local Python backend via **Chaquopy**.

## Architecture

Since the user requires **everything to work locally on the device**, we use:

1. **Capacitor** - Wraps the web frontend (HTML/CSS/JS) into a native Android WebView
2. **Chaquopy** - Runs the Python FastAPI backend inside the Android app
3. The app starts the local FastAPI server on `localhost:8000` and loads the WebView pointing to it

## Alternative: Simplified WebView Approach

For easier building, we provide a pure Android Studio project that:
- Embeds the web frontend directly in the WebView
- Uses an Android service to run yt-dlp via termux/embedded Python
- Works completely offline

## Build Instructions

### Prerequisites
- Android Studio (latest)
- JDK 17+
- Android SDK 34+

### Steps

1. Open `android/` folder in Android Studio
2. Sync Gradle
3. Build & Run on device/emulator

### APK Build
```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`
