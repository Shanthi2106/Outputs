# Autism Parent Assistant — Mobile App

The app is a **Progressive Web App (PWA)**. Users can install it on their phone or tablet like a native app (home screen icon, full-screen, no browser chrome).

## Install on Your Phone

### Android (Chrome)
1. Open the app in **Chrome** (e.g. `https://your-deployed-url.vercel.app`).
2. Tap the **menu** (⋮) → **“Install app”** or **“Add to Home screen”**.
3. Confirm. The icon appears on your home screen; open it to use the app in standalone mode.

### iPhone / iPad (Safari)
1. Open the app in **Safari** (Chrome on iOS cannot install PWAs).
2. Tap the **Share** button (□↑).
3. Scroll and tap **“Add to Home Screen”**.
4. Edit the name if you want, then tap **Add**. The icon appears on your home screen.

### Desktop (Chrome / Edge)
- Look for an **install** icon in the address bar, or use the menu → **“Install Autism Parent Assistant”**.

## What You Get

- **Home screen icon** — Launch like any other app.
- **Standalone window** — No browser URL bar or tabs (full-screen feel).
- **Portrait orientation** — Optimized for phone use.
- **Theme color** — App bar/status area uses the app’s blue theme.
- **Safe areas** — Layout respects notches and rounded corners.
- **Offline-ready** — Service worker caches the UI; API calls use the network when available.

## Building for Production

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy the `frontend/dist` folder to your host (e.g. Vercel, Netlify).
3. The PWA works only over **HTTPS** (and on localhost for testing).

## Optional: Native iOS/Android Builds (App Store / Play Store)

To ship **native** `.ipa` / `.apk` (e.g. for App Store or Play Store), you can wrap the same frontend with **Capacitor**:

1. Build the web app:
   ```bash
   cd frontend && npm run build
   ```
2. Add Capacitor and create native projects:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init "Autism Parent Assistant" com.autismparent.assistant
   npm install @capacitor/ios @capacitor/android
   npx cap add ios
   npx cap add android
   ```
3. Point Capacitor at your build output (in `capacitor.config.ts`, set `webDir` to `dist`).
4. Sync and open in native IDEs:
   ```bash
   npx cap sync
   npx cap open ios    # Xcode
   npx cap open android # Android Studio
   ```
5. Configure app icons, splash screens, and signing in Xcode/Android Studio, then submit to the stores.

The app logic stays in the existing React frontend; Capacitor only provides the native shell and device APIs if you need them later (e.g. push notifications).
