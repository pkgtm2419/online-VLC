# 🛠️ Android Mobile App — Troubleshooting & FAQ

Frequently asked questions and troubleshooting steps for PVP Player on Android.

---

### 1. YouTube Embed Error 153 ("Video unavailable in this app")
- **Cause**: YouTube's embed player enforces a strict web origin policy. When loaded from raw `file:///android_asset/`, YouTube rejects embedding.
- **Solution in v2.0**: PVP uses `WebViewAssetLoader` with a secure virtual domain (`https://appassets.androidplatform.net/assets/www/index.html`). This gives the player an authentic HTTPS origin that satisfies YouTube's embedding constraints.

### 2. Audio Stops When Screen is Locked
- **Solution**: Open Player Settings (gear icon), and turn **ON** the **Background Play** toggle switch. This prevents the WebKit engine from pausing media when the app loses foreground focus.

### 3. Video Not Playing on Mobile Data / Cellular Network
- **Check Settings**: Ensure **Mobile Data** permission is granted to PVP Player in *Android Settings → Apps → PVP Player → Mobile data & Wi-Fi*.
- **Data Saver**: If *Data Saver* mode is active, set PVP Player to *Unrestricted data access*.

### 4. Touch Controls Reference
- **Double-Tap Left Side**: Jump backward 10 seconds.
- **Double-Tap Right Side**: Jump forward 10 seconds.
- **Swipe Left Half (Vertical)**: Adjust display brightness (20% – 100%).
- **Swipe Right Half (Vertical)**: Adjust media volume (0% – 125%).
- **Pinch In / Out**: Toggle full display mode.
- **Single Tap**: Toggle on-screen VLC HUD controls.

### 5. App Permissions
- PVP Player only requests:
  - `android.permission.INTERNET`: To stream video streams from the internet.
  - `android.permission.ACCESS_NETWORK_STATE`: To detect network transitions.
  - `android.permission.WAKE_LOCK`: To keep the screen active while watching.
- **Zero local storage reading**: PVP does not require or request device file storage permissions.
