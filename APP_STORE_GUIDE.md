# Publish Autism Parent Assistant to the Apple App Store

To have the app listed in the **Apple App Store** (so users can install it like any other iPhone app), you need to build a **native iOS app** and submit it through Apple. This guide uses **Capacitor** to wrap your existing web app in an iOS shell.

---

## What You Need

| Requirement | Details |
|-------------|---------|
| **Mac** | Building and submitting an iOS app requires macOS (Xcode runs only on Mac). |
| **Xcode** | Free from the Mac App Store. Required to build and archive the app. |
| **Apple Developer account** | $99/year at [developer.apple.com](https://developer.apple.com). Required to submit to the App Store. |

---

## Step 1: Apple Developer Account and Xcode

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) ($99/year).
2. On your Mac, install **Xcode** from the App Store.
3. Open Xcode once and accept the license; optionally install extra components when prompted.

---

## Step 2: Set Your Production API URL

The iOS app will call your backend over the network. When you build for release, the app must use your **production API URL** (e.g. your Vercel backend).

In the **frontend** folder, create or edit `.env.production` (or set variables in your build environment):

```env
VITE_API_URL=https://your-backend.vercel.app/api/v1
```

Replace with your real backend URL. The frontend’s `api.ts` uses `VITE_API_URL` when set.

---

## Step 3: Create the iOS Project (One-Time, on a Mac)

From your project root, go into the frontend and build, then add the iOS platform. **You must run these on a Mac** (the `ios` folder is created by Xcode tooling).

```bash
cd frontend
npm run build
npx cap add ios
```

- This creates an `ios` folder with an Xcode project.
- If `npx cap add ios` asks for an app name or ID, you can accept the defaults from `capacitor.config.ts` (app name: **Autism Parent Assistant**, app ID: **com.autismparent.assistant**).

---

## Step 4: Sync and Open in Xcode

Whenever you change the web app and want to update the iOS build:

```bash
cd frontend
npm run build:ios
```

Or manually:

```bash
npm run build
npm run cap:sync
```

Then open the iOS project in Xcode:

```bash
npm run cap:ios
```

(or `npx cap open ios`)

---

## Step 5: Configure the App in Xcode

1. In Xcode, select the **App** (or **Autism Parent Assistant**) project in the left sidebar.
2. Select the **App** target → **Signing & Capabilities**.
3. Under **Team**, choose your Apple Developer team (you must be logged in with your Apple ID in Xcode).
4. Ensure **Bundle Identifier** is set (e.g. `com.autismparent.assistant`). It must be unique; change it if needed.
5. If you see signing errors, fix them (e.g. “Automatically manage signing” and correct team).

---

## Step 6: Archive and Upload to App Store Connect

1. In Xcode, choose **Any iOS Device (arm64)** (or a connected device) as the run destination—**not** a simulator.
2. Menu: **Product** → **Archive**.
3. When the archive finishes, the **Organizer** window opens.
4. Select the new archive → **Distribute App**.
5. Choose **App Store Connect** → **Upload** → follow the prompts (default options are usually fine).
6. When the upload completes, go to [App Store Connect](https://appstoreconnect.apple.com).

---

## Step 7: Create the App and Submit for Review

1. In App Store Connect, go to **My Apps** → **+** → **New App**.
2. Fill in:
   - **Platform**: iOS  
   - **Name**: Autism Parent Assistant  
   - **Primary Language**, **Bundle ID** (match Xcode), **SKU** (e.g. `autism-assistant-1`).
3. In the app’s page:
   - **App Information**: category (e.g. Education or Health), description, keywords, support URL, etc.
   - **Pricing**: Free or Paid.
   - **App Privacy**: complete the privacy questionnaire (your app doesn’t store personal data; say so where relevant).
4. Under the version (e.g. 1.0):
   - **Screenshots**: required for each device size (e.g. 6.7", 6.5", 5.5"). Use a simulator or device to capture screens.
   - **Description**, **What’s New**, **Promotional Text** (optional).
5. Under **Build**, select the build you uploaded from Xcode.
6. Submit for **Review**. Apple typically reviews within 24–48 hours.

---

## Summary Checklist

- [ ] Mac with Xcode installed  
- [ ] Apple Developer account ($99/year)  
- [ ] `VITE_API_URL` set to production backend in frontend  
- [ ] `cd frontend` → `npm run build` → `npx cap add ios` (one-time, on Mac)  
- [ ] `npm run build:ios` then `npm run cap:ios` to open in Xcode  
- [ ] In Xcode: Signing & Capabilities → Team and Bundle ID  
- [ ] Product → Archive → Distribute App → App Store Connect → Upload  
- [ ] In App Store Connect: create app, add metadata, screenshots, select build, submit for review  

---

## Updating the App Later

1. Update the web app as usual in the frontend.
2. Bump **version** (and build number) in `frontend/package.json` and, if you use it, in the iOS project (Xcode → target → General → Version / Build).
3. Run `npm run build:ios`, then in Xcode: **Product** → **Archive** → **Distribute App** → upload the new build.
4. In App Store Connect, create a new version (e.g. 1.1), attach the new build, and submit for review.

---

## Troubleshooting

- **“No accounts with App Store Connect access”**  
  Sign in to Xcode with an Apple ID that’s in the Apple Developer Program (Xcode → Settings → Accounts).

- **Signing errors**  
  Use “Automatically manage signing” and pick the correct Team. Ensure the Bundle ID is unique and matches App Store Connect.

- **App shows blank or wrong API**  
  Rebuild with the correct `VITE_API_URL` in `.env.production` (or your build env), then run `npm run build:ios` again and re-archive.

- **Capacitor / iOS project not found**  
  Run `npx cap add ios` from the **frontend** folder on a Mac after `npm run build`.
