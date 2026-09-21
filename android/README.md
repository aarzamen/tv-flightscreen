# FlightScreen TV — Android TV & Chromecast Desk Radar

Native Android TV Leanback package for **Chromecast with Google TV** and **Android TV / Fire TV** devices.

This package turns your TV into an ambient, high-contrast, live flight and weather radar display with hardware-accelerated rendering and voice remote control support.

---

## Pre-compiled APK Downloads

The compiled debug APK is ready to install directly from this repository:
- `builds/FlightMap-DeskRadar-Chromecast-debug.apk`
- `artifacts/FlightMap-DeskRadar-Chromecast-debug.apk`
- `android/app/build/outputs/apk/debug/FlightMap-DeskRadar-Chromecast-debug.apk`

When you push this repository to GitHub, the **GitHub Actions workflow** (`.github/workflows/build-apk.yml`) also automatically builds this APK on GitHub's cloud servers and attaches it to the **Actions** tab as an artifact named `FlightMap-DeskRadar-Chromecast-APK`.

---

## TV Features & Architecture

- **Leanback Launcher Integration**: Configured with `android.intent.category.LEANBACK_LAUNCHER` and `android.software.leanback` to appear directly in the Android TV / Google TV home screen app row.
- **Touchscreen Independent**: Explicitly sets `android.hardware.touchscreen` to `false` for seamless installation on Chromecast and TV boxes without touch panels.
- **Custom 16:9 Leanback Banner & Icon**: Includes a 320x180 vector banner (`banner.xml`) and launcher icon (`ic_launcher.xml`) optimized for dark TV displays.
- **Persistent Screen-On (Desk Monitor Mode)**: Employs `WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON` to keep your TV screen awake as a continuous flight radar monitor without triggering the screensaver.
- **Hardware Acceleration**: `setLayerType(View.LAYER_TYPE_HARDWARE, null)` ensures high-speed Leaflet tile rendering and smooth heading rotations.
- **Cleartext HTTP Support**: `android:usesCleartextTraffic="true"` allows connecting directly to local LAN radar servers (e.g. `http://192.168.1.x:8080`).
- **Offline / Standby Radar**: If no server URL is configured, a bundled ambient radar screen runs locally without requiring network servers.

---

## Chromecast Voice Remote Controls

| Remote Button | Action |
| --- | --- |
| **D-Pad Up / Down / Left / Right** | Pan the radar map view across the sky |
| **Center / Select** | Target / select next aircraft or confirm option |
| **Play / Pause** | Snap radar center back to home station |
| **Menu / Info (or Long-press Center)** | Open on-screen dialog to set or switch the radar server URL (cloud or local LAN IP like `http://192.168.1.50:8080`) |
| **Back** | Deselect active aircraft or dismiss dialog (double-tap within 2 seconds to exit) |

---

## Sideloading Instructions

### Method 1: Direct Wireless ADB (Fastest from Mac/PC)

1. **Enable Developer Mode on Chromecast:**
   - On your Chromecast, go to **Settings** → **System** → **About**.
   - Scroll down to **Android TV OS build** and click it **7 times** until you see *"You are now a developer!"*.
2. **Enable Network Debugging:**
   - Go to **Settings** → **System** → **Developer options**.
   - Turn on **Network debugging** (or USB debugging).
3. **Find Chromecast IP Address:**
   - Check **Settings** → **Network & Internet** → select your connected Wi-Fi to view the IP address (e.g. `192.168.1.75`).
4. **Connect and Install from Terminal:**
   ```bash
   adb connect 192.168.1.75:5555
   adb install -r android/app/build/outputs/apk/debug/FlightMap-DeskRadar-Chromecast-debug.apk
   adb shell am start -n com.flightscreen.tv/.MainActivity
   ```

---

### Method 2: Via the "Downloader" App by AFTVnews

1. Install **Downloader by AFTVnews** from the Google Play Store on your Chromecast.
2. In Chromecast Settings → Apps → Special app access → **Install unknown apps**, allow Downloader.
3. Open Downloader and enter the direct download link or release URL of your APK from your GitHub repository.
4. Click **Go** to download and install.

---

### Method 3: Via "Send Files to TV" App

1. Install **Send Files to TV** on both your computer/phone and your Chromecast.
2. Transfer `FlightMap-DeskRadar-Chromecast-debug.apk` to your TV.
3. Open a file manager (like *FX File Explorer* or *AnExplorer*) on the TV to open and install the APK.

---

## Building Locally

To build the APK locally from your terminal:

```bash
cd android
./scripts/gradle.sh assembleDebug
```

The APK will be output to:
`android/app/build/outputs/apk/debug/app-debug.apk`
